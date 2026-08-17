import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import {
  buildDatatablesSearch,
  parseDatatablesOrder,
  parseDatatablesSelect,
  sanitizeDatatablesRecords,
} from '../common/helpers/datatables.helper';
import { TenantService } from '../common/services/tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagRfidBatchDto } from './dto/create-batch-rfid.dto';
import { CreateTagRfidDto } from './dto/create-tag-rfid.dto';
import { UpdateTagRfidDto } from './dto/update-tag-rfid.dto';

@Injectable()
export class TagRfidService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  async create(dto: CreateTagRfidDto, userId: number, regra: string) {
    // SEC-01: Validate tenant access to the target filial
    const filialIds = await this.tenant.getFilialIds(userId, regra);
    if (filialIds && !filialIds.includes(dto.idFilial)) {
      throw new NotFoundException('Filial não encontrada ou sem permissão.');
    }
    return this.prisma.tagRfid.create({ data: dto });
  }

  async createBatch(dto: CreateTagRfidBatchDto, userId: number, regra: string) {
    if (!dto.idProduto) {
      throw new BadRequestException(
        'idProduto é obrigatório para criação em lote.',
      );
    }

    // Validate tenant access to the target filial
    const filialIds = await this.tenant.getFilialIds(userId, regra);
    if (filialIds && !filialIds.includes(dto.idFilial)) {
      throw new NotFoundException('Filial não encontrada ou sem permissão.');
    }

    const idProduto = dto.idProduto;

    const data = dto.tags.map((epc) => ({
      codigoRfid: epc,
      idFilial: dto.idFilial,
      idProduto,
      quantidade: 1,
    }));

    const result = await this.prisma.tagRfid.createMany({
      data,
      skipDuplicates: true,
    });

    return { inserted: result.count, total: dto.tags.length };
  }

  async clearByFilial(idFilial: number, userId: number, regra: string) {
    // Validate tenant access to the target filial
    const filialIds = await this.tenant.getFilialIds(userId, regra);
    if (filialIds && !filialIds.includes(idFilial)) {
      throw new NotFoundException('Filial não encontrada ou sem permissão.');
    }

    const result = await this.prisma.tagRfid.deleteMany({
      where: { idFilial },
    });
    return { deleted: result.count };
  }

  async findAll(userId: number, regra: string) {
    const filialIds = await this.tenant.getFilialIds(userId, regra);
    return this.prisma.tagRfid.findMany({
      where: filialIds ? { idFilial: { in: filialIds } } : {},
      include: { produto: true, posicaoEstoque: true },
      take: 1000,
    });
  }

  async findOne(id: number, userId?: number, regra?: string) {
    const tag = await this.prisma.tagRfid.findUnique({
      where: { id },
      include: { produto: true, posicaoEstoque: true },
    });
    if (!tag) throw new NotFoundException('Tag RFID não encontrada');

    if (userId != null && regra) {
      const filialIds = await this.tenant.getFilialIds(userId, regra);
      if (filialIds && !filialIds.includes(tag.idFilial)) {
        throw new NotFoundException('Tag RFID não encontrada');
      }
    }

    return tag;
  }

  async update(
    id: number,
    dto: UpdateTagRfidDto,
    userId?: number,
    regra?: string,
  ) {
    await this.findOne(id, userId, regra);
    return this.prisma.tagRfid.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number, userId?: number, regra?: string) {
    await this.findOne(id, userId, regra);
    return this.prisma.tagRfid.delete({ where: { id } });
  }

  async findByEpc(epc: string, userId: number, regra: string) {
    const tag = await this.prisma.tagRfid.findFirst({
      where: { codigoRfid: epc },
      include: { produto: true, posicaoEstoque: true },
    });
    if (!tag) return null;

    // SEC-05: Validate tenant access
    const filialIds = await this.tenant.getFilialIds(userId, regra);
    if (filialIds && !filialIds.includes(tag.idFilial)) {
      return null; // Don't reveal the tag exists to other tenants
    }
    return tag;
  }

  async datatables(data: DatatablesRequestDto, userId: number, regra: string) {
    const { draw, start = 0, length = 10, filters = [] } = data;
    const filialIds = await this.tenant.getFilialIds(userId, regra);
    const orderBy = parseDatatablesOrder(data);
    const where: any = filialIds ? { idFilial: { in: filialIds } } : {};
    const andConditions: any[] = [];

    const searchConditions = await buildDatatablesSearch(
      data,
      this.prisma,
      'tags_rfid',
      [
        'codigoRfid',
        'codigoUnico',
        'lote',
        'produto.nome',
        'posicaoEstoque.nome',
        'filial.nome',
      ],
      [{ field: 'id', column: 'id' }],
    );
    if (searchConditions) {
      andConditions.push({ OR: searchConditions });
    }

    for (const filter of filters) {
      if (filter.field === 'idFilial' && filter.type === 'equals') {
        andConditions.push({ idFilial: Number(filter.value) });
      }
      if (filter.field === 'codigoRfid') {
        andConditions.push({ codigoRfid: { contains: filter.value } });
      }
      if (filter.field === 'codigoUnico') {
        andConditions.push({ codigoUnico: { contains: filter.value } });
      }
      if (filter.field === 'lote') {
        andConditions.push({ lote: { contains: filter.value } });
      }
      if (filter.field === 'idProduto' && Array.isArray(filter.value)) {
        andConditions.push({ idProduto: { in: filter.value } });
      }
      if (filter.field === 'idPosicaoEstoque') {
        andConditions.push({ idPosicaoEstoque: Number(filter.value) });
      }
    }
    if (andConditions.length > 0) where.AND = andConditions;

    const recordsTotal = await this.prisma.tagRfid.count({
      where: filialIds ? { idFilial: { in: filialIds } } : {},
    });
    const recordsFiltered = await this.prisma.tagRfid.count({ where });
    const select = parseDatatablesSelect(data);
    const args: any = {
      where,
      skip: Number(start),
      take: Number(length),
      orderBy,
    };
    if (select) {
      args.select = select;
    } else {
      args.include = { produto: true, posicaoEstoque: true };
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const records = await this.prisma.tagRfid.findMany(args);
    return {
      draw: draw || 1,
      recordsTotal,
      recordsFiltered,
      data: sanitizeDatatablesRecords(records),
    };
  }

  // ── Active Tags (Conferência) ────────────────────────────

  async findAtivasByProdutoId(
    idProduto: number,
    userId: number,
    regra: string,
  ) {
    const filialIds = await this.tenant.getFilialIds(userId, regra);
    const where: any = { idProduto, dataBaixa: null };
    if (filialIds) where.idFilial = { in: filialIds };
    return this.prisma.tagRfid.findMany({
      where,
      include: { produto: true, posicaoEstoque: true },
    });
  }

  async findAtivasBatchByCodigos(
    codigos: string[],
    userId: number,
    regra: string,
    idFilial?: number,
  ) {
    const filialIds = await this.tenant.getFilialIds(userId, regra);
    const baseWhere: any = { dataBaixa: null };

    if (idFilial) {
      if (filialIds && !filialIds.includes(idFilial)) {
        throw new NotFoundException('Filial não encontrada ou sem permissão.');
      }
      baseWhere.idFilial = idFilial;
    } else if (filialIds) {
      baseWhere.idFilial = { in: filialIds };
    }

    const produtos = await this.prisma.produto.findMany({
      where: { codigo: { in: codigos } },
    });

    const results = [];
    for (const produto of produtos) {
      const tags = await this.prisma.tagRfid.findMany({
        where: { ...baseWhere, idProduto: produto.id },
        select: { id: true, codigoRfid: true, codigoUnico: true },
      });
      results.push({
        codigo: produto.codigo,
        idProduto: produto.id,
        tagsAtivas: tags,
        totalAtivas: tags.length,
      });
    }

    // Include codes that weren't found
    for (const codigo of codigos) {
      if (!results.find((r) => r.codigo === codigo)) {
        results.push({
          codigo,
          idProduto: null,
          tagsAtivas: [],
          totalAtivas: 0,
        });
      }
    }

    return results;
  }
}
