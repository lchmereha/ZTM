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
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@Injectable()
export class EmpresaService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  async create(createEmpresaDto: CreateEmpresaDto) {
    return this.prisma.empresa.create({ data: createEmpresaDto });
  }

  async findAll(userId: number, regra: string) {
    const empresaIds = await this.tenant.getEmpresaIds(userId, regra);
    const where = empresaIds ? { id: { in: empresaIds } } : {};
    return this.prisma.empresa.findMany({ where });
  }

  async findOne(id: number) {
    const empresa = await this.prisma.empresa.findUnique({ where: { id } });
    if (!empresa) throw new NotFoundException('Empresa não encontrada');
    return empresa;
  }

  async update(id: number, updateEmpresaDto: UpdateEmpresaDto) {
    await this.findOne(id);
    return this.prisma.empresa.update({
      where: { id },
      data: updateEmpresaDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.empresa.delete({ where: { id } });
  }

  async datatables(data: DatatablesRequestDto, userId: number, regra: string) {
    const { draw, start = 0, length = 10, filters = [] } = data;
    const empresaIds = await this.tenant.getEmpresaIds(userId, regra);
    const orderBy = parseDatatablesOrder(data);
    const where: any = empresaIds ? { id: { in: empresaIds } } : {};
    const andConditions: any[] = [];

    const searchConditions = await buildDatatablesSearch(
      data,
      this.prisma,
      'empresas',
      ['nome'],
      [{ field: 'id', column: 'id' }],
    );
    if (searchConditions) {
      andConditions.push({ OR: searchConditions });
    }

    for (const filter of filters) {
      if (filter.field === 'nome') {
        andConditions.push({ nome: { contains: filter.value } });
      }
      if (filter.field === 'corEsquema') {
        andConditions.push({ corEsquema: filter.value });
      }
    }
    if (andConditions.length > 0) where.AND = andConditions;

    const recordsTotal = await this.prisma.empresa.count({
      where: empresaIds ? { id: { in: empresaIds } } : {},
    });
    const recordsFiltered = await this.prisma.empresa.count({ where });
    const select = parseDatatablesSelect(data);
    const records = await this.prisma.empresa.findMany({
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
