import { Injectable, NotFoundException } from '@nestjs/common';
import { OmitType, PartialType } from '@nestjs/swagger';
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import {
  buildDatatablesSearch,
  parseDatatablesOrder,
  parseDatatablesSelect,
  sanitizeDatatablesRecords,
} from '../common/helpers/datatables.helper';
import { TenantService } from '../common/services/tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipoMovimentacaoDto } from './dto/create-tipo-movimentacao.dto';

export class UpdateTipoMovimentacaoDto extends PartialType(
  OmitType(CreateTipoMovimentacaoDto, ['idEmpresa'] as const),
) {}

@Injectable()
export class TipoMovimentacaoService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  async create(dto: CreateTipoMovimentacaoDto, userId: number, regra: string) {
    const empresaIds = await this.tenant.getEmpresaIds(userId, regra);
    if (empresaIds && !empresaIds.includes(dto.idEmpresa)) {
      throw new NotFoundException('Empresa não encontrada ou sem permissão.');
    }
    return this.prisma.tipoMovimentacao.create({ data: dto });
  }

  async findAll(userId: number, regra: string, idEmpresa?: number) {
    const empresaIds = await this.tenant.getEmpresaIds(userId, regra);
    const where: any = empresaIds ? { idEmpresa: { in: empresaIds } } : {};
    if (idEmpresa) {
      where.idEmpresa = idEmpresa;
    }
    return this.prisma.tipoMovimentacao.findMany({
      where,
      include: { empresa: true },
    });
  }

  async findOne(id: number, userId?: number, regra?: string) {
    const type = await this.prisma.tipoMovimentacao.findUnique({
      where: { id },
      include: { empresa: true },
    });
    if (!type)
      throw new NotFoundException('Tipo de movimentação não encontrado');

    if (userId != null && regra) {
      const empresaIds = await this.tenant.getEmpresaIds(userId, regra);
      if (empresaIds && !empresaIds.includes(type.idEmpresa)) {
        throw new NotFoundException('Tipo de movimentação não encontrado');
      }
    }

    return type;
  }

  async update(
    id: number,
    dto: UpdateTipoMovimentacaoDto,
    userId?: number,
    regra?: string,
  ) {
    await this.findOne(id, userId, regra);
    return this.prisma.tipoMovimentacao.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number, userId?: number, regra?: string) {
    await this.findOne(id, userId, regra);
    return this.prisma.tipoMovimentacao.delete({ where: { id } });
  }

  async datatables(data: DatatablesRequestDto, userId: number, regra: string) {
    const { draw, start = 0, length = 10, filters = [] } = data;
    const empresaIds = await this.tenant.getEmpresaIds(userId, regra);
    const orderBy = parseDatatablesOrder(data);
    const where: any = empresaIds ? { idEmpresa: { in: empresaIds } } : {};
    const andConditions: any[] = [];

    const searchConditions = await buildDatatablesSearch(
      data,
      this.prisma,
      'tipos_movimentacao',
      ['descricao', 'empresa.nome'],
      [{ field: 'id', column: 'id' }],
    );
    if (searchConditions) {
      andConditions.push({ OR: searchConditions });
    }

    for (const filter of filters) {
      if (filter.field === 'idEmpresa' && filter.type === 'equals') {
        andConditions.push({ idEmpresa: Number(filter.value) });
      }
      if (filter.field === 'descricao') {
        andConditions.push({ descricao: { contains: filter.value } });
      }
    }
    if (andConditions.length > 0) where.AND = andConditions;

    const recordsTotal = await this.prisma.tipoMovimentacao.count({
      where: empresaIds ? { idEmpresa: { in: empresaIds } } : {},
    });
    const recordsFiltered = await this.prisma.tipoMovimentacao.count({ where });
    const select = parseDatatablesSelect(data);
    const records = await this.prisma.tipoMovimentacao.findMany({
      where,
      skip: Number(start),
      take: Number(length),
      orderBy,
      ...(select ? { select } : {}),
    });
    return {
      draw: draw || 1,
      recordsTotal,
      recordsFiltered,
      data: sanitizeDatatablesRecords(records),
    };
  }
}
