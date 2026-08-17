import { Injectable, NotFoundException } from '@nestjs/common';
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import {
  buildDatatablesSearch,
  parseDatatablesOrder,
  parseDatatablesSelect,
  sanitizeDatatablesRecords,
} from '../common/helpers/datatables.helper';
import { TenantService } from '../common/services/tenant.service';
import { TipoEquipamento } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';

@Injectable()
export class EquipamentoService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  async create(createEquipamentoDto: CreateEquipamentoDto) {
    return this.prisma.equipamento.create({
      data: createEquipamentoDto as any,
    });
  }

  async findAll(userId: number, regra: string, idFilial?: number) {
    const filialIds = await this.tenant.getFilialIds(userId, regra);
    const where: any = filialIds ? { idFilial: { in: filialIds } } : {};
    if (idFilial) {
      where.idFilial = idFilial;
    }
    return this.prisma.equipamento.findMany({
      where,
      include: { filial: true },
      take: 1000,
    });
  }

  async findOne(id: number, userId?: number, regra?: string) {
    const equipamento = await this.prisma.equipamento.findUnique({
      where: { id },
      include: { filial: true },
    });
    if (!equipamento) throw new NotFoundException('Equipamento não encontrado');

    // Tenant validation: operador só acessa equipamentos de suas filiais
    if (userId != null && regra) {
      const filialIds = await this.tenant.getFilialIds(userId, regra);
      if (filialIds && !filialIds.includes(equipamento.idFilial)) {
        throw new NotFoundException('Equipamento não encontrado');
      }
    }

    return equipamento;
  }

  async update(
    id: number,
    updateEquipamentoDto: UpdateEquipamentoDto,
    userId?: number,
    regra?: string,
  ) {
    await this.findOne(id, userId, regra);
    return this.prisma.equipamento.update({
      where: { id },
      data: updateEquipamentoDto as any,
    });
  }

  async remove(id: number, userId?: number, regra?: string) {
    await this.findOne(id, userId, regra);
    return this.prisma.equipamento.delete({ where: { id } });
  }

  async datatables(data: DatatablesRequestDto, userId: number, regra: string) {
    const { draw, start = 0, length = 10, filters = [] } = data;
    const searchTerm = data.search?.value?.trim();
    const filialIds = await this.tenant.getFilialIds(userId, regra);
    const orderBy = parseDatatablesOrder(data);
    const where: any = filialIds ? { idFilial: { in: filialIds } } : {};
    const andConditions: any[] = [];

    const searchConditions =
      (await buildDatatablesSearch(
        data,
        this.prisma,
        'equipamentos',
        ['nome', 'ipConexao', 'filial.nome'],
        [{ field: 'id', column: 'id' }],
      )) || [];

    if (searchTerm) {
      const matchingTipos = Object.values(TipoEquipamento).filter((t) =>
        t.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      if (matchingTipos.length > 0) {
        searchConditions.push({ tipo: { in: matchingTipos } });
      }
    }

    if (searchConditions.length > 0) {
      andConditions.push({ OR: searchConditions });
    }

    for (const filter of filters) {
      if (filter.field === 'idFilial' && filter.type === 'equals') {
        andConditions.push({ idFilial: Number(filter.value) });
      }
      if (filter.field === 'nome') {
        andConditions.push({ nome: { contains: filter.value } });
      }
      if (filter.field === 'tipo' && Array.isArray(filter.value)) {
        andConditions.push({ tipo: { in: filter.value } });
      }
      if (filter.field === 'idFilial' && Array.isArray(filter.value)) {
        andConditions.push({ idFilial: { in: filter.value } });
      }
      if (filter.field === 'ipAddress') {
        andConditions.push({ ipAddress: { contains: filter.value } });
      }
      if (filter.field === 'posicao') {
        andConditions.push({ posicao: { contains: filter.value } });
      }
    }
    if (andConditions.length > 0) where.AND = andConditions;

    const recordsTotal = await this.prisma.equipamento.count({
      where: filialIds ? { idFilial: { in: filialIds } } : {},
    });
    const recordsFiltered = await this.prisma.equipamento.count({ where });
    const select = parseDatatablesSelect(data);
    const records = await this.prisma.equipamento.findMany({
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
