import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import {
  buildDatatablesSearch,
  parseDatatablesOrder,
  sanitizeDatatablesRecords,
} from '../common/helpers/datatables.helper';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';

@Injectable()
export class ApiKeyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Gera uma chave hexadecimal de 128 caracteres (512 bits).
   */
  generateKey(): string {
    return randomBytes(64).toString('hex');
  }

  async create(createApiKeyDto: CreateApiKeyDto) {
    // Verificar se a filial existe
    const filial = await this.prisma.filial.findUnique({
      where: { id: createApiKeyDto.idFilial },
    });
    if (!filial) {
      throw new NotFoundException('Filial não encontrada');
    }

    // Verificar se o usuário existe e carregar filiais permitidas
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: createApiKeyDto.idUsuario },
      include: { filiaisPermitidas: true },
    });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se a filial solicitada está nas filiais permitidas do usuário
    const temAcessoFilial = usuario.filiaisPermitidas.some(
      (f) => f.idFilial === createApiKeyDto.idFilial,
    );
    if (!temAcessoFilial) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'A filial selecionada não está vinculada a este usuário.',
        detalhes: [
          {
            campo: 'idFilial',
            erros: ['Usuário não tem acesso a esta filial.'],
          },
        ],
      });
    }

    // Verificar unicidade da chave
    const existing = await this.prisma.apiKey.findUnique({
      where: { chave: createApiKeyDto.chave },
    });
    if (existing) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Esta chave já está em uso.',
        detalhes: [
          { campo: 'chave', erros: ['Já existe uma API Key com esta chave.'] },
        ],
      });
    }

    return this.prisma.apiKey.create({
      data: createApiKeyDto,
      include: {
        filial: { select: { id: true, nome: true } },
        usuario: { select: { id: true, nome: true, usuario: true } },
      },
    });
  }

  async findAll() {
    return this.prisma.apiKey.findMany({
      include: {
        filial: { select: { id: true, nome: true } },
        usuario: { select: { id: true, nome: true, usuario: true } },
      },
      take: 1000,
    });
  }

  async findOne(id: number) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id },
      include: {
        filial: { select: { id: true, nome: true } },
        usuario: { select: { id: true, nome: true, usuario: true } },
      },
    });
    if (!apiKey) throw new NotFoundException('API Key não encontrada');
    return apiKey;
  }

  async update(id: number, updateApiKeyDto: UpdateApiKeyDto) {
    const apiKey = await this.findOne(id);

    // Se estiver atualizando a chave, verificar unicidade
    if (updateApiKeyDto.chave) {
      const existing = await this.prisma.apiKey.findUnique({
        where: { chave: updateApiKeyDto.chave },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Esta chave já está em uso.',
          detalhes: [
            {
              campo: 'chave',
              erros: ['Já existe uma API Key com esta chave.'],
            },
          ],
        });
      }
    }

    // Precisamos validar se a filial final pertence ao usuário final
    const idUsuarioFinal = updateApiKeyDto.idUsuario ?? apiKey.idUsuario;
    const idFilialFinal = updateApiKeyDto.idFilial ?? apiKey.idFilial;

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: idUsuarioFinal },
      include: { filiaisPermitidas: true },
    });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const temAcessoFilial = usuario.filiaisPermitidas.some(
      (f) => f.idFilial === idFilialFinal,
    );
    if (!temAcessoFilial) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'A filial selecionada não está vinculada a este usuário.',
        detalhes: [
          {
            campo: 'idFilial',
            erros: ['Usuário não tem acesso a esta filial.'],
          },
        ],
      });
    }

    return this.prisma.apiKey.update({
      where: { id },
      data: updateApiKeyDto,
      include: {
        filial: { select: { id: true, nome: true } },
        usuario: { select: { id: true, nome: true, usuario: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.apiKey.delete({ where: { id } });
  }

  async datatables(data: DatatablesRequestDto) {
    const { draw, start = 0, length = 10, filters = [] } = data;
    const orderBy = parseDatatablesOrder(data);
    const where: any = {};
    const andConditions: any[] = [];

    const searchConditions = await buildDatatablesSearch(
      data,
      this.prisma,
      'api_keys',
      ['chave', 'filial.nome', 'usuario.nome', 'usuario.usuario'],
      [{ field: 'id', column: 'id' }],
    );
    if (searchConditions) {
      andConditions.push({ OR: searchConditions });
    }

    for (const filter of filters) {
      if (filter.field === 'idFilial' && filter.type === 'equals') {
        andConditions.push({ idFilial: Number(filter.value) });
      }
      if (
        filter.field === 'idFilial' &&
        filter.type === 'in' &&
        Array.isArray(filter.value)
      ) {
        andConditions.push({ idFilial: { in: filter.value } });
      }
    }
    if (andConditions.length > 0) where.AND = andConditions;

    const recordsTotal = await this.prisma.apiKey.count();
    const recordsFiltered = await this.prisma.apiKey.count({ where });
    // Ignora select dinâmico para ApiKey — sempre inclui filial e usuario
    const records = await this.prisma.apiKey.findMany({
      where,
      skip: Number(start),
      take: Number(length),
      orderBy,
      include: {
        filial: { select: { id: true, nome: true } },
        usuario: { select: { id: true, nome: true, usuario: true } },
      },
    });
    return {
      draw: draw || 1,
      recordsTotal,
      recordsFiltered,
      // A chave é o conteúdo da tela — o admin precisa copiá-la para entregar
      // ao cliente. O `select` aqui é fixo (ver comentário acima), então o
      // cliente não consegue pedir outros campos.
      data: sanitizeDatatablesRecords(records, { except: ['chave'] }),
    };
  }
}
