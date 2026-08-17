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
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';

@Injectable()
export class ProdutoService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  async create(
    createProdutoDto: CreateProdutoDto,
    userId?: number,
    regra?: string,
    tx?: Prisma.TransactionClient,
  ) {
    // SEC-07: Validate tenant access to the target empresa (skip for external/system calls)
    if (userId != null && regra) {
      const empresaIds = await this.tenant.getEmpresaIds(userId, regra);
      if (empresaIds && !empresaIds.includes(createProdutoDto.idEmpresa)) {
        throw new NotFoundException('Empresa não encontrada ou sem permissão.');
      }
    }
    const db = tx || this.prisma;
    return db.produto.create({ data: createProdutoDto });
  }

  async findAll(userId: number, regra: string, idEmpresa?: number) {
    const empresaIds = await this.tenant.getEmpresaIds(userId, regra);
    const where: any = empresaIds ? { idEmpresa: { in: empresaIds } } : {};
    if (idEmpresa) {
      where.idEmpresa = idEmpresa;
    }
    return this.prisma.produto.findMany({
      where,
      take: 1000,
    });
  }

  async combo(userId: number, regra: string, idEmpresa?: number) {
    const empresaIds = await this.tenant.getEmpresaIds(userId, regra);
    const where: any = empresaIds ? { idEmpresa: { in: empresaIds } } : {};
    if (idEmpresa) {
      where.idEmpresa = idEmpresa;
    }
    return this.prisma.produto.findMany({
      where,
      select: { id: true, codigo: true, nome: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: number, userId?: number, regra?: string) {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
      include: { categoria: true, modeloEtiqueta: true },
    });
    if (!produto) throw new NotFoundException('Produto não encontrado');

    if (userId != null && regra) {
      const empresaIds = await this.tenant.getEmpresaIds(userId, regra);
      if (empresaIds && !empresaIds.includes(produto.idEmpresa)) {
        throw new NotFoundException('Produto não encontrado');
      }
    }

    return produto;
  }

  async update(
    id: number,
    updateProdutoDto: UpdateProdutoDto,
    userId?: number,
    regra?: string,
  ) {
    await this.findOne(id, userId, regra);
    return this.prisma.produto.update({
      where: { id },
      data: updateProdutoDto,
    });
  }

  async remove(id: number, userId?: number, regra?: string) {
    await this.findOne(id, userId, regra);
    return this.prisma.produto.delete({ where: { id } });
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
      'produtos',
      [
        'codigo',
        'nome',
        'unidadeMedida',
        'categoria.nome',
        'modeloEtiqueta.nome',
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
      if (filter.field === 'codigo') {
        andConditions.push({ codigo: { contains: filter.value } });
      }
      if (filter.field === 'nome') {
        andConditions.push({ nome: { contains: filter.value } });
      }
      if (filter.field === 'unidadeMedida') {
        andConditions.push({ unidadeMedida: { contains: filter.value } });
      }
      if (filter.field === 'idCategoria' && Array.isArray(filter.value)) {
        andConditions.push({ idCategoria: { in: filter.value } });
      }
      if (filter.field === 'idModeloEtiqueta' && Array.isArray(filter.value)) {
        andConditions.push({ idModeloEtiqueta: { in: filter.value } });
      }
    }
    if (andConditions.length > 0) where.AND = andConditions;

    const recordsTotal = await this.prisma.produto.count({
      where: empresaIds ? { idEmpresa: { in: empresaIds } } : {},
    });
    const recordsFiltered = await this.prisma.produto.count({ where });
    const select = parseDatatablesSelect(data);
    const records = await this.prisma.produto.findMany({
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
