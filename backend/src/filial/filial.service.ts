import { Injectable, NotFoundException } from '@nestjs/common';
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import {
  buildDatatablesSearch,
  parseDatatablesOrder,
  parseDatatablesSelect,
  sanitizeDatatablesRecords,
} from '../common/helpers/datatables.helper';
import { TenantService } from '../common/services/tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFilialDto } from './dto/create-filial.dto';
import { UpdateFilialDto } from './dto/update-filial.dto';

@Injectable()
export class FilialService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  async create(createFilialDto: CreateFilialDto) {
    return this.prisma.filial.create({ data: createFilialDto });
  }

  async findAll(userId: number, regra: string) {
    const filialIds = await this.tenant.getFilialIds(userId, regra);
    return this.prisma.filial.findMany({
      where: filialIds ? { id: { in: filialIds } } : {},
      include: { empresa: true },
      take: 1000,
    });
  }

  async findOne(id: number, userId?: number, regra?: string) {
    const filial = await this.prisma.filial.findUnique({
      where: { id },
      include: { empresa: true, etiquetaPadrao: true },
    });
    if (!filial) throw new NotFoundException('Filial não encontrada');

    if (userId != null && regra) {
      const filialIds = await this.tenant.getFilialIds(userId, regra);
      if (filialIds && !filialIds.includes(filial.id)) {
        throw new NotFoundException('Filial não encontrada');
      }
    }

    return filial;
  }

  async update(id: number, updateFilialDto: UpdateFilialDto) {
    await this.findOne(id);
    return this.prisma.filial.update({
      where: { id },
      data: updateFilialDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.filial.delete({ where: { id } });
  }

  async datatables(data: DatatablesRequestDto, userId: number, regra: string) {
    const { draw, start = 0, length = 10, filters = [] } = data;
    const filialIds = await this.tenant.getFilialIds(userId, regra);
    const orderBy = parseDatatablesOrder(data);
    const where: any = filialIds ? { id: { in: filialIds } } : {};
    const andConditions: any[] = [];

    const searchConditions = await buildDatatablesSearch(
      data,
      this.prisma,
      'filiais',
      [
        'nome',
        'documentoIdentificacao',
        'cidade',
        'estado',
        'telefone',
        'endereco',
        'empresa.nome',
      ],
      [{ field: 'id', column: 'id' }],
    );
    if (searchConditions) {
      andConditions.push({ OR: searchConditions });
    }

    for (const filter of filters) {
      if (filter.field === 'idEmpresa' && filter.type === 'equals') {
        andConditions.push({ idEmpresa: Number(filter.value) });
      }
      if (filter.field === 'nome') {
        andConditions.push({ nome: { contains: filter.value } });
      }
      if (filter.field === 'documentoIdentificacao') {
        andConditions.push({
          documentoIdentificacao: { contains: filter.value },
        });
      }
      if (filter.field === 'cidade') {
        andConditions.push({ cidade: { contains: filter.value } });
      }
      if (filter.field === 'estado') {
        andConditions.push({ estado: { contains: filter.value } });
      }
      if (filter.field === 'telefone') {
        andConditions.push({ telefone: { contains: filter.value } });
      }
      if (filter.field === 'idEmpresa' && Array.isArray(filter.value)) {
        andConditions.push({ idEmpresa: { in: filter.value } });
      }
      if (filter.field === 'idEtiquetaPadrao' && Array.isArray(filter.value)) {
        andConditions.push({ idEtiquetaPadrao: { in: filter.value } });
      }
    }
    if (andConditions.length > 0) where.AND = andConditions;

    const recordsTotal = await this.prisma.filial.count({
      where: filialIds ? { id: { in: filialIds } } : {},
    });
    const recordsFiltered = await this.prisma.filial.count({ where });
    const select = parseDatatablesSelect(data);
    const records = await this.prisma.filial.findMany({
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
