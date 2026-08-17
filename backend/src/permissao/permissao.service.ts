import { Injectable, NotFoundException } from '@nestjs/common';
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import {
  parseDatatablesOrder,
  sanitizeDatatablesRecords,
} from '../common/helpers/datatables.helper';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissaoDto } from './dto/create-permissao.dto';
import { UpdatePermissaoDto } from './dto/update-permissao.dto';

@Injectable()
export class PermissaoService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePermissaoDto) {
    return this.prisma.permissaoUsuario.create({ data: dto });
  }

  async findAll() {
    return this.prisma.permissaoUsuario.findMany({
      include: { usuario: true, opcaoMenu: true },
    });
  }

  async findOne(idUsuario: number, idOpcaoMenu: number) {
    const permissao = await this.prisma.permissaoUsuario.findUnique({
      where: {
        idUsuario_idOpcaoMenu: {
          idUsuario,
          idOpcaoMenu,
        },
      },
      include: { usuario: true, opcaoMenu: true },
    });
    if (!permissao) throw new NotFoundException('Permissão não encontrada');
    return permissao;
  }

  async update(
    idUsuario: number,
    idOpcaoMenu: number,
    dto: UpdatePermissaoDto,
  ) {
    await this.findOne(idUsuario, idOpcaoMenu);
    return this.prisma.permissaoUsuario.update({
      where: {
        idUsuario_idOpcaoMenu: {
          idUsuario,
          idOpcaoMenu,
        },
      },
      data: dto,
    });
  }

  async remove(idUsuario: number, idOpcaoMenu: number) {
    await this.findOne(idUsuario, idOpcaoMenu);
    return this.prisma.permissaoUsuario.delete({
      where: {
        idUsuario_idOpcaoMenu: {
          idUsuario,
          idOpcaoMenu,
        },
      },
    });
  }

  async findByUser(idUsuario: number) {
    return this.prisma.permissaoUsuario.findMany({
      where: { idUsuario },
      include: { opcaoMenu: true },
    });
  }

  async datatables(data: DatatablesRequestDto) {
    const { draw, start = 0, length = 10, filters = [] } = data;
    const searchTerm = data.search?.value?.trim();
    const orderBy = parseDatatablesOrder(data);
    const where: any = {};
    const andConditions: any[] = [];

    // Busca global (search.value do DataTables.net)
    if (searchTerm) {
      andConditions.push({
        OR: [
          { usuario: { nome: { contains: searchTerm } } },
          { opcaoMenu: { nome: { contains: searchTerm } } },
        ],
      });
    }

    for (const filter of filters) {
      if (filter.field === 'idUsuario' && Array.isArray(filter.value)) {
        andConditions.push({ idUsuario: { in: filter.value } });
      }
      if (filter.field === 'idOpcaoMenu' && Array.isArray(filter.value)) {
        andConditions.push({ idOpcaoMenu: { in: filter.value } });
      }
      if (filter.field === 'podeVisualizar') {
        if (filter.value === 'true' || filter.value === true)
          andConditions.push({ podeVisualizar: true });
        else if (filter.value === 'false' || filter.value === false)
          andConditions.push({ podeVisualizar: false });
      }
      if (filter.field === 'podeIncluir') {
        if (filter.value === 'true' || filter.value === true)
          andConditions.push({ podeIncluir: true });
        else if (filter.value === 'false' || filter.value === false)
          andConditions.push({ podeIncluir: false });
      }
      if (filter.field === 'podeAlterar') {
        if (filter.value === 'true' || filter.value === true)
          andConditions.push({ podeAlterar: true });
        else if (filter.value === 'false' || filter.value === false)
          andConditions.push({ podeAlterar: false });
      }
      if (filter.field === 'podeExcluir') {
        if (filter.value === 'true' || filter.value === true)
          andConditions.push({ podeExcluir: true });
        else if (filter.value === 'false' || filter.value === false)
          andConditions.push({ podeExcluir: false });
      }
    }
    if (andConditions.length > 0) where.AND = andConditions;

    const recordsTotal = await this.prisma.permissaoUsuario.count();
    const recordsFiltered = await this.prisma.permissaoUsuario.count({ where });
    const records = await this.prisma.permissaoUsuario.findMany({
      where,
      skip: Number(start),
      take: Number(length),
      orderBy,
      include: { usuario: true, opcaoMenu: true },
    });
    return {
      draw: draw || 1,
      recordsTotal,
      recordsFiltered,
      data: sanitizeDatatablesRecords(records),
    };
  }

  // Opções de Menu
  async findAllMenuOptions() {
    return this.prisma.opcaoMenu.findMany();
  }
}
