import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import {
  buildDatatablesSearch,
  parseDatatablesOrder,
  parseDatatablesSelect,
  sanitizeDatatablesRecords,
} from '../common/helpers/datatables.helper';
import { TenantService } from '../common/services/tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { BaixaLeituraDto } from './dto/baixa-leitura.dto';
import { ConcluirAssociacaoDto } from './dto/concluir-associacao.dto';
import { ConcluirConferenciaDto } from './dto/concluir-conferencia.dto';
import { ConcluirTransferenciaDto } from './dto/concluir-transferencia.dto';
import { CreateImportacaoItemDto } from './dto/create-importacao-item.dto';
import { CreateMovimentacaoDto } from './dto/create-movimentacao.dto';
import { ValidateImpressaoDto } from './dto/process-impressao.dto';
import { SaveImportacaoDto } from './dto/save-importacao.dto';
import { UpdateMovimentacaoDto } from './dto/update-movimentacao.dto';
import { AssociacaoService } from './services/associacao.service';
import { ConferenciaService } from './services/conferencia.service';
import { ImportacaoService } from './services/importacao.service';
import { LeituraService } from './services/leitura.service';
import { TagProcessingService } from './services/tag-processing.service';
import { TransferenciaService } from './services/transferencia.service';
import { ZplPrintService } from './services/zpl-print.service';

/**
 * Facade service for movimentação operations.
 * Delegates specialized work to focused sub-services while keeping
 * CRUD and datatables logic locally.
 */
@Injectable()
export class MovimentacaoService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
    private importacaoService: ImportacaoService,
    private tagProcessingService: TagProcessingService,
    private zplPrintService: ZplPrintService,
    private leituraService: LeituraService,
    private associacaoService: AssociacaoService,
    private conferenciaService: ConferenciaService,
    private transferenciaService: TransferenciaService,
  ) {}

  /**
   * Validates that a filial belongs to the user's tenant.
   * Delegates to centralized TenantService.
   */
  private ensureFilialAccess(idFilial: number, userId: number, regra: string) {
    return this.tenant.ensureFilialAccess(idFilial, userId, regra);
  }

  // ── CRUD ────────────────────────────────────────────────

  async create(
    createMovimentacaoDto: CreateMovimentacaoDto,
    userId?: number,
    regra?: string,
  ) {
    // SEC: Validate tenant access (skip for external/system calls)
    if (userId != null && regra) {
      await this.ensureFilialAccess(
        createMovimentacaoDto.idFilial,
        userId,
        regra,
      );
    }

    return this.prisma.movimentacao.create({
      data: {
        ...createMovimentacaoDto,
        idUsuario: userId ?? null, // SEC-02: from JWT, or null for external integrations
        situacao: 'CRIADO', // SEC-03: enforced server-side
      },
    });
  }

  async findPendentes(userId: number, regra: string) {
    const filialIds = await this.tenant.getFilialIds(userId, regra);
    const baseWhere = filialIds ? { idFilial: { in: filialIds } } : {};

    return this.prisma.movimentacao.findMany({
      where: {
        ...baseWhere,
        OR: [
          { tipo: { tipo: 'ASSOCIACAO' }, situacao: 'IMPORTADO' },
          { tipo: { tipo: 'CONFERENCIA' }, situacao: 'IMPORTADO' },
          { tipo: { tipo: 'TRANSFERENCIA' }, situacao: 'IMPORTADO' },
          {
            tipo: { tipo: 'IMPRESSAO' },
            situacao: { in: ['IMPORTADO', 'PROCESSADO'] },
          },
          { tipo: { tipo: 'LEITURA' }, situacao: 'CRIADO' },
        ],
      },
      include: { tipo: true, itens: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(userId: number, regra: string) {
    const filialIds = await this.tenant.getFilialIds(userId, regra);
    return this.prisma.movimentacao.findMany({
      where: filialIds ? { idFilial: { in: filialIds } } : {},
      include: { tipo: true, itens: true },
      take: 1000,
    });
  }

  async findOne(id: number, userId?: number, regra?: string) {
    const movimentacao = await this.prisma.movimentacao.findUnique({
      where: { id },
      include: {
        tipo: true,
        filial: true,
        filialDestino: true,
        usuario: true,
        equipamento: true,
        itens: true,
      },
    });
    if (!movimentacao)
      throw new NotFoundException('Movimentação não encontrada');

    if (userId != null && regra) {
      const filialIds = await this.tenant.getFilialIds(userId, regra);
      if (filialIds && !filialIds.includes(movimentacao.idFilial)) {
        throw new NotFoundException('Movimentação não encontrada');
      }
    }

    return movimentacao;
  }

  async update(
    id: number,
    updateMovimentacaoDto: UpdateMovimentacaoDto,
    userId?: number,
    regra?: string,
  ) {
    await this.findOne(id, userId, regra);
    return this.prisma.movimentacao.update({
      where: { id },
      data: updateMovimentacaoDto,
    });
  }

  async cancelar(id: number, userId?: number, regra?: string) {
    const movimentacao = await this.findOne(id, userId, regra);

    if (movimentacao.situacao === 'FINALIZADO') {
      throw new BadRequestException(
        'Não é possível cancelar uma movimentação já finalizada.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (movimentacao.situacao === 'PROCESSADO') {
        const itens = await tx.movimentacaoItem.findMany({
          where: { idMovimentacao: id, idTagRfid: { not: null } },
          select: { idTagRfid: true },
        });
        const tagIds = itens
          .map((item) => item.idTagRfid)
          .filter((id): id is number => id !== null);

        if (tagIds.length > 0) {
          await tx.tagRfid.updateMany({
            where: { id: { in: tagIds }, dataBaixa: null },
            data: { dataBaixa: new Date() },
          });
        }
      }

      return tx.movimentacao.update({
        where: { id },
        data: {
          situacao: 'CANCELADO',
          dataCancelamento: new Date(),
          idUsuarioCancelamento: userId,
        },
      });
    });
  }

  async datatables(data: DatatablesRequestDto, userId: number, regra: string) {
    const { draw, start = 0, length = 10, filters = [] } = data;
    const filialIds = await this.tenant.getFilialIds(userId, regra);
    const orderBy = parseDatatablesOrder(data);
    const select = parseDatatablesSelect(data, [
      'tipo.tipo',
      'equipamento.tipo',
    ]);
    const where: any = filialIds ? { idFilial: { in: filialIds } } : {};
    const andConditions: any[] = [];

    const searchConditions = await buildDatatablesSearch(
      data,
      this.prisma,
      'movimentacoes',
      [
        'descricao',
        'situacao',
        'tipo.descricao',
        'filial.nome',
        'equipamento.nome',
        'usuario.nome',
      ],
      [{ field: 'id', column: 'id' }],
    );
    if (searchConditions) {
      andConditions.push({ OR: searchConditions });
    }

    // Filtros avançados
    for (const filter of filters) {
      if (filter.field === 'idFilial' && filter.type === 'equals') {
        andConditions.push({ idFilial: Number(filter.value) });
      }
      if (
        filter.field === 'idTipoMovimentacao' &&
        Array.isArray(filter.value)
      ) {
        andConditions.push({ idTipoMovimentacao: { in: filter.value } });
      }
      if (filter.field === 'situacao' && Array.isArray(filter.value)) {
        andConditions.push({ situacao: { in: filter.value } });
      }
      if (filter.field === 'descricao') {
        andConditions.push({ descricao: { contains: filter.value } });
      }
    }
    if (andConditions.length > 0) where.AND = andConditions;

    const baseWhere = filialIds ? { idFilial: { in: filialIds } } : {};
    const recordsTotal = await this.prisma.movimentacao.count({
      where: baseWhere,
    });
    const recordsFiltered = await this.prisma.movimentacao.count({ where });
    const records = await this.prisma.movimentacao.findMany({
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

  // ── Delegated to ImportacaoService ─────────────────────

  validateImpressao(dto: ValidateImpressaoDto, userId: number, regra: string) {
    return this.importacaoService.validateImpressao(dto, userId, regra);
  }

  saveImportacao(dto: SaveImportacaoDto, userId: number, regra: string) {
    return this.importacaoService.saveImportacao(dto, userId, regra);
  }

  getImportacaoItems(idMovimentacao: number, userId: number, regra: string) {
    return this.importacaoService.getImportacaoItems(
      idMovimentacao,
      userId,
      regra,
    );
  }

  updateImportacaoItem(
    itemId: number,
    data: {
      codigo?: string;
      nome?: string;
      unidadeMedida?: string;
      quantidade?: number;
      categoria?: string;
      codigoUnico?: string;
      dataValidade?: Date;
      lote?: string;
      dataFabricacao?: Date;
    },
    userId: number,
    regra: string,
  ) {
    return this.importacaoService.updateImportacaoItem(
      itemId,
      data,
      userId,
      regra,
    );
  }

  removeImportacaoItem(itemId: number, userId: number, regra: string) {
    return this.importacaoService.removeImportacaoItem(itemId, userId, regra);
  }

  createImportacaoItem(
    idMovimentacao: number,
    dto: CreateImportacaoItemDto,
    userId: number,
    regra: string,
  ) {
    return this.importacaoService.createImportacaoItem(
      idMovimentacao,
      dto,
      userId,
      regra,
    );
  }

  getMovimentacaoProdutos(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ) {
    return this.importacaoService.getMovimentacaoProdutos(
      idMovimentacao,
      userId,
      regra,
    );
  }

  // ── Delegated to TagProcessingService ──────────────────

  processarTags(idMovimentacao: number, userId: number, regra: string) {
    return this.tagProcessingService.processarTags(
      idMovimentacao,
      userId,
      regra,
    );
  }

  getProcessedTags(idMovimentacao: number, userId: number, regra: string) {
    return this.tagProcessingService.getProcessedTags(
      idMovimentacao,
      userId,
      regra,
    );
  }

  finalizarMovimentacao(idMovimentacao: number, userId: number, regra: string) {
    return this.tagProcessingService.finalizarMovimentacao(
      idMovimentacao,
      userId,
      regra,
    );
  }

  // ── Delegated to ZplPrintService ───────────────────────

  imprimirTags(
    idMovimentacao: number,
    userId: number,
    regra: string,
    clientSide = false,
  ) {
    return this.zplPrintService.imprimirTags(
      idMovimentacao,
      userId,
      regra,
      clientSide,
    );
  }

  // ── Delegated to LeituraService ────────────────────────

  validarLeitura(
    id: number,
    dto: BaixaLeituraDto,
    userId: number,
    regra: string,
  ) {
    return this.leituraService.validarLeitura(id, dto, userId, regra);
  }

  baixaLeitura(
    id: number,
    dto: BaixaLeituraDto,
    userId: number,
    regra: string,
  ) {
    return this.leituraService.baixaLeitura(id, dto, userId, regra);
  }

  relatorioLeitura(id: number, userId: number, regra: string) {
    return this.leituraService.relatorioLeitura(id, userId, regra);
  }

  // ── Delegated to AssociacaoService ───────────────────

  listarProdutosAssociacao(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ) {
    return this.associacaoService.listarProdutosAssociacao(
      idMovimentacao,
      userId,
      regra,
    );
  }

  validarAssociacao(
    idMovimentacao: number,
    codigosRfid: string[],
    userId: number,
    regra: string,
  ) {
    return this.associacaoService.validarAssociacao(
      idMovimentacao,
      codigosRfid,
      userId,
      regra,
    );
  }

  concluirAssociacao(
    id: number,
    dto: ConcluirAssociacaoDto,
    userId: number,
    regra: string,
  ) {
    return this.associacaoService.concluirAssociacao(id, dto, userId, regra);
  }

  relatorioAssociacao(id: number, userId: number, regra: string) {
    return this.associacaoService.relatorioAssociacao(id, userId, regra);
  }

  // ── Delegated to ConferenciaService ──────────────────

  listarProdutosConferencia(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ) {
    return this.conferenciaService.listarProdutosConferencia(
      idMovimentacao,
      userId,
      regra,
    );
  }

  concluirConferencia(
    id: number,
    dto: ConcluirConferenciaDto,
    userId: number,
    regra: string,
  ) {
    return this.conferenciaService.concluirConferencia(id, dto, userId, regra);
  }

  relatorioConferencia(id: number, userId: number, regra: string) {
    return this.conferenciaService.relatorioConferencia(id, userId, regra);
  }

  // ── Delegated to TransferenciaService ────────────────

  listarProdutosTransferencia(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ) {
    return this.transferenciaService.listarProdutosTransferencia(
      idMovimentacao,
      userId,
      regra,
    );
  }

  concluirTransferencia(
    id: number,
    dto: ConcluirTransferenciaDto,
    userId: number,
    regra: string,
  ) {
    return this.transferenciaService.concluirTransferencia(
      id,
      dto,
      userId,
      regra,
    );
  }

  relatorioTransferencia(id: number, userId: number, regra: string) {
    return this.transferenciaService.relatorioTransferencia(id, userId, regra);
  }
}
