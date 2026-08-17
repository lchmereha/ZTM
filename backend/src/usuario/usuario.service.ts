import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import {
  buildDatatablesSearch,
  parseDatatablesOrder,
  parseDatatablesSelect,
  sanitizeDatatablesRecords,
} from '../common/helpers/datatables.helper';
import { UsuarioRole } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  private readonly includeRelations = {
    filiaisPermitidas: {
      include: { filial: true },
    },
    permissoesUsuario: {
      include: { opcaoMenu: true },
    },
  };

  private formatUsuario(usuario: any) {
    const { filiaisPermitidas, permissoesUsuario, ...rest } = usuario;
    delete rest.senha;
    return {
      ...rest,
      filiais:
        filiaisPermitidas?.map((uf: any) => ({
          id: uf.filial.id,
          nome: uf.filial.nome,
        })) || [],
      permissoes: {
        visualizar:
          permissoesUsuario
            ?.filter((p: any) => p.podeVisualizar)
            .map((p: any) => p.idOpcaoMenu) || [],
        incluir:
          permissoesUsuario
            ?.filter((p: any) => p.podeIncluir)
            .map((p: any) => p.idOpcaoMenu) || [],
        alterar:
          permissoesUsuario
            ?.filter((p: any) => p.podeAlterar)
            .map((p: any) => p.idOpcaoMenu) || [],
        excluir:
          permissoesUsuario
            ?.filter((p: any) => p.podeExcluir)
            .map((p: any) => p.idOpcaoMenu) || [],
      },
    };
  }

  private buildPermissoesData(permissoes: CreateUsuarioDto['permissoes']) {
    if (!permissoes) return undefined;

    const {
      visualizar = [],
      incluir = [],
      alterar = [],
      excluir = [],
    } = permissoes;

    // Collect all unique opcaoMenu IDs
    const allIds = [
      ...new Set([...visualizar, ...incluir, ...alterar, ...excluir]),
    ];

    return allIds.map((idOpcaoMenu) => ({
      idOpcaoMenu,
      podeVisualizar: visualizar.includes(idOpcaoMenu),
      podeIncluir: incluir.includes(idOpcaoMenu),
      podeAlterar: alterar.includes(idOpcaoMenu),
      podeExcluir: excluir.includes(idOpcaoMenu),
    }));
  }

  async create(dto: CreateUsuarioDto) {
    const exists = await this.prisma.usuario.findUnique({
      where: { usuario: dto.usuario },
    });
    if (exists)
      throw new ConflictException(
        'Já existe um usuário com esse nome de acesso',
      );

    if (dto.email) {
      const emailExists = await this.prisma.usuario.findUnique({
        where: { email: dto.email },
      });
      if (emailExists)
        throw new ConflictException('Já existe um usuário com esse e-mail');
    }

    const { idFiliais, permissoes, senha, ...userData } = dto;
    const hashedPassword = await bcrypt.hash(senha, 10);

    const permissoesData = this.buildPermissoesData(permissoes);

    const usuario = await this.prisma.usuario.create({
      data: {
        ...userData,
        senha: hashedPassword,
        filiaisPermitidas: idFiliais
          ? {
              create: idFiliais.map((id) => ({ idFilial: id })),
            }
          : undefined,
        permissoesUsuario: permissoesData
          ? {
              create: permissoesData,
            }
          : undefined,
      },
      include: this.includeRelations,
    });
    return this.formatUsuario(usuario);
  }

  async findAll() {
    const usuarios = await this.prisma.usuario.findMany({
      include: this.includeRelations,
    });
    return usuarios.map(this.formatUsuario);
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: this.includeRelations,
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return this.formatUsuario(usuario);
  }

  async update(id: number, dto: UpdateUsuarioDto) {
    const {
      idFiliais,
      permissoes,
      senha,
      id: dtoId,
      filiais: dtoFiliais,
      ...userData
    } = dto as UpdateUsuarioDto & {
      id?: number;
      filiais?: unknown;
      idFiliais?: number[];
      permissoes?: CreateUsuarioDto['permissoes'];
    };
    void dtoId;
    void dtoFiliais; // stripped from userData intentionally
    const data: Record<string, unknown> = { ...userData };

    // Remove formatted fields that shouldn't be sent to Prisma
    delete data.permissoes;

    // Hash password only if provided
    if (senha) {
      data.senha = await bcrypt.hash(senha, 10);
    } else {
      delete data.senha;
    }

    // Wrap in transaction to prevent partial updates
    return this.prisma.$transaction(async (tx) => {
      if (idFiliais) {
        await tx.usuarioFilial.deleteMany({ where: { idUsuario: id } });
        data.filiaisPermitidas = {
          create: idFiliais.map((filialId: number) => ({ idFilial: filialId })),
        };
      }

      if (permissoes) {
        await tx.permissaoUsuario.deleteMany({
          where: { idUsuario: id },
        });
        const permissoesData = this.buildPermissoesData(permissoes);
        if (permissoesData && permissoesData.length > 0) {
          data.permissoesUsuario = {
            create: permissoesData,
          };
        }
      }

      const usuario = await tx.usuario.update({
        where: { id },
        data,
        include: this.includeRelations,
      });
      return this.formatUsuario(usuario);
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.permissaoUsuario.deleteMany({ where: { idUsuario: id } });
      await tx.usuarioFilial.deleteMany({ where: { idUsuario: id } });
      return tx.usuario.delete({ where: { id } });
    });
  }

  async datatables(data: DatatablesRequestDto) {
    const { draw, start = 0, length = 10, filters = [] } = data;
    const searchTerm = data.search?.value?.trim();
    const orderBy = parseDatatablesOrder(data);

    // Construir condições de filtro
    const where: any = {};
    const andConditions: any[] = [];

    const searchConditions =
      (await buildDatatablesSearch(
        data,
        this.prisma,
        'usuarios',
        ['nome', 'usuario', 'email'],
        [{ field: 'id', column: 'id' }],
      )) || [];

    // regra é enum — filtrar valores que contenham o termo (case-insensitive)
    if (searchTerm) {
      const matchingRoles = Object.values(UsuarioRole).filter((r) =>
        r.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      if (matchingRoles.length > 0) {
        searchConditions.push({ regra: { in: matchingRoles } });
      }
    }

    if (searchConditions.length > 0) {
      andConditions.push({ OR: searchConditions });
    }

    for (const filter of filters) {
      switch (filter.field) {
        case 'nome':
          andConditions.push({
            nome: { contains: filter.value },
          });
          break;
        case 'usuario':
          andConditions.push({
            usuario: { contains: filter.value },
          });
          break;
        case 'email':
          andConditions.push({
            email: { contains: filter.value },
          });
          break;
        case 'regra':
          if (Array.isArray(filter.value) && filter.value.length > 0) {
            andConditions.push({ regra: { in: filter.value } });
          }
          break;
        case 'idFiliais':
          if (Array.isArray(filter.value) && filter.value.length > 0) {
            andConditions.push({
              filiaisPermitidas: {
                some: { idFilial: { in: filter.value.map(Number) } },
              },
            });
          }
          break;
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const recordsTotal = await this.prisma.usuario.count();
    const recordsFiltered = await this.prisma.usuario.count({ where });
    const select = parseDatatablesSelect(data);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- Prisma conditional select/include requires `as any`
    const records = await this.prisma.usuario.findMany({
      where,
      skip: Number(start),
      take: Number(length),
      orderBy,
      ...(select ? { select } : { include: this.includeRelations }),
    } as any);
    return {
      draw: draw || 1,
      recordsTotal,
      recordsFiltered,
      data: sanitizeDatatablesRecords(records.map(this.formatUsuario)),
    };
  }
}
