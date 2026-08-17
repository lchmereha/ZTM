import { Injectable, NotFoundException } from '@nestjs/common';
import { PartialType } from '@nestjs/swagger';
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import {
  buildDatatablesSearch,
  parseDatatablesOrder,
  parseDatatablesSelect,
  sanitizeDatatablesRecords,
} from '../common/helpers/datatables.helper';
import { TenantService } from '../common/services/tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModeloEtiquetaDto } from './dto/create-modelo-etiqueta.dto';

export class UpdateModeloEtiquetaDto extends PartialType(
  CreateModeloEtiquetaDto,
) {}

@Injectable()
export class ModeloEtiquetaService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  async create(dto: CreateModeloEtiquetaDto, userId?: number, regra?: string) {
    // SEC: Validate tenant access (skip for external/system calls)
    if (userId != null && regra) {
      const empresaIds = await this.tenant.getEmpresaIds(userId, regra);
      if (empresaIds && !empresaIds.includes(dto.idEmpresa)) {
        throw new NotFoundException('Empresa não encontrada ou sem permissão.');
      }
    }
    return this.prisma.modeloEtiqueta.create({ data: dto });
  }

  async findAll(userId: number, regra: string, idEmpresa?: number) {
    const empresaIds = await this.tenant.getEmpresaIds(userId, regra);
    const where: any = empresaIds ? { idEmpresa: { in: empresaIds } } : {};
    if (idEmpresa) {
      where.idEmpresa = idEmpresa;
    }
    return this.prisma.modeloEtiqueta.findMany({
      where,
      include: { empresa: true },
    });
  }

  async findOne(id: number, userId?: number, regra?: string) {
    const model = await this.prisma.modeloEtiqueta.findUnique({
      where: { id },
      include: { empresa: true },
    });
    if (!model)
      throw new NotFoundException('Modelo de etiqueta não encontrado');

    if (userId != null && regra) {
      const empresaIds = await this.tenant.getEmpresaIds(userId, regra);
      if (empresaIds && !empresaIds.includes(model.idEmpresa)) {
        throw new NotFoundException('Modelo de etiqueta não encontrado');
      }
    }

    return model;
  }

  async update(
    id: number,
    dto: UpdateModeloEtiquetaDto,
    userId?: number,
    regra?: string,
  ) {
    await this.findOne(id, userId, regra);
    return this.prisma.modeloEtiqueta.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number, userId?: number, regra?: string) {
    await this.findOne(id, userId, regra);
    return this.prisma.modeloEtiqueta.delete({ where: { id } });
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
      'modelos_etiqueta',
      ['nome', 'codigoZPL', 'empresa.nome'],
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
      if (filter.field === 'codigoZPL') {
        andConditions.push({ codigoZPL: { contains: filter.value } });
      }
      if (filter.field === 'ativo') {
        if (filter.value === 'true' || filter.value === true) {
          andConditions.push({ ativo: true });
        } else if (filter.value === 'false' || filter.value === false) {
          andConditions.push({ ativo: false });
        }
      }
    }
    if (andConditions.length > 0) where.AND = andConditions;

    const recordsTotal = await this.prisma.modeloEtiqueta.count({
      where: empresaIds ? { idEmpresa: { in: empresaIds } } : {},
    });
    const recordsFiltered = await this.prisma.modeloEtiqueta.count({ where });
    const select = parseDatatablesSelect(data);
    const records = await this.prisma.modeloEtiqueta.findMany({
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
