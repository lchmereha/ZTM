import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import {
  buildDatatablesSearch,
  parseDatatablesOrder,
  parseDatatablesSelect,
  sanitizeDatatablesRecords,
} from '../common/helpers/datatables.helper';
import { TenantService } from '../common/services/tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriaService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  async create(dto: CreateCategoriaDto, tx?: Prisma.TransactionClient) {
    const db = tx || this.prisma;
    return db.categoria.create({ data: dto });
  }

  async findAll(userId: number, regra: string, idEmpresa?: number) {
    const empresaIds = await this.tenant.getEmpresaIds(userId, regra);
    const where: any = empresaIds ? { idEmpresa: { in: empresaIds } } : {};
    if (idEmpresa) {
      where.idEmpresa = idEmpresa;
    }
    return this.prisma.categoria.findMany({
      where,
      include: { empresa: true },
      take: 1000,
    });
  }

  async findOne(id: number, userId?: number, regra?: string) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
      include: { empresa: true },
    });
    if (!categoria) throw new NotFoundException('Categoria não encontrada');

    if (userId != null && regra) {
      const empresaIds = await this.tenant.getEmpresaIds(userId, regra);
      if (empresaIds && !empresaIds.includes(categoria.idEmpresa)) {
        throw new NotFoundException('Categoria não encontrada');
      }
    }

    return categoria;
  }

  async update(
    id: number,
    dto: UpdateCategoriaDto,
    userId?: number,
    regra?: string,
  ) {
    await this.findOne(id, userId, regra);
    return this.prisma.categoria.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number, userId?: number, regra?: string) {
    await this.findOne(id, userId, regra);
    return this.prisma.categoria.delete({ where: { id } });
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
      'categorias',
      ['nome', 'empresa.nome'],
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
    }
    if (andConditions.length > 0) where.AND = andConditions;

    const recordsTotal = await this.prisma.categoria.count({
      where: empresaIds ? { idEmpresa: { in: empresaIds } } : {},
    });
    const recordsFiltered = await this.prisma.categoria.count({ where });
    const select = parseDatatablesSelect(data);
    const records = await this.prisma.categoria.findMany({
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
