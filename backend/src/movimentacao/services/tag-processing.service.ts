import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TenantService } from '../../common/services/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TagProcessingService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  /**
   * Validates that a movimentação belongs to the user's tenant.
   * Delegates to centralized TenantService.
   */
  private ensureMovimentacaoAccess(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ) {
    return this.tenant.ensureMovimentacaoAccess(idMovimentacao, userId, regra);
  }

  // ── Processar Tags ──────────────────────────────────────

  async processarTags(idMovimentacao: number, userId: number, regra: string) {
    await this.ensureMovimentacaoAccess(idMovimentacao, userId, regra);

    const movimentacao = await this.prisma.movimentacao.findUnique({
      where: { id: idMovimentacao },
      include: { filial: true },
    });
    if (!movimentacao)
      throw new NotFoundException('Movimentação não encontrada');
    if (movimentacao.situacao !== 'IMPORTADO') {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `Movimentação não está na situação IMPORTADO (atual: ${movimentacao.situacao}).`,
      });
    }

    const idEmpresa = movimentacao.filial.idEmpresa;
    const idFilial = movimentacao.idFilial;

    const importacaoItems = await this.prisma.importacaoItem.findMany({
      where: { idMovimentacao },
      orderBy: { id: 'asc' },
    });

    if (importacaoItems.length === 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Nenhum item de importação encontrado para esta movimentação.',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const codigos = importacaoItems.map((i) => i.codigo);
      const produtosFound = await tx.produto.findMany({
        where: { codigo: { in: codigos } },
      });
      const produtoMap = new Map(produtosFound.map((p) => [p.codigo, p]));

      const resultado: {
        codigo: string;
        nome: string | null;
        tags: {
          id: number;
          codigoRfid: string;
          codigoUnico: string | null;
          dataValidade: Date | null;
          lote: string | null;
          dataFabricacao: Date | null;
        }[];
      }[] = [];

      // Collect all tags to create in a batch
      const pendingTags: {
        itemIndex: number;
        idProduto: number;
        codigoUnico: string | undefined;
        dataValidade: Date | undefined;
        lote: string | undefined;
        dataFabricacao: Date | undefined;
        qtdeUMVolume: (typeof importacaoItems)[0]['qtdeUMVolume'] | undefined;
      }[] = [];

      for (let idx = 0; idx < importacaoItems.length; idx++) {
        const item = importacaoItems[idx];
        const produto = produtoMap.get(item.codigo);
        if (!produto) {
          throw new BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message: `Produto com código "${item.codigo}" não encontrado. Execute a importação primeiro.`,
          });
        }

        for (let i = 0; i < item.quantidade; i++) {
          pendingTags.push({
            itemIndex: idx,
            idProduto: produto.id,
            codigoUnico: item.codigoUnico || undefined,
            dataValidade: item.dataValidade || undefined,
            lote: item.lote || undefined,
            dataFabricacao: item.dataFabricacao || undefined,
            qtdeUMVolume: item.qtdeUMVolume || undefined,
          });
        }

        resultado.push({
          codigo: item.codigo,
          nome: item.nome,
          tags: [],
        });
      }

      // Batch create all tags with temporary RFID codes
      // We still need individual creates to get auto-incremented IDs,
      // but we can batch the updates afterwards
      const createdTags: { id: number; itemIndex: number }[] = [];

      for (const pending of pendingTags) {
        const tag = await tx.tagRfid.create({
          data: {
            idFilial,
            idProduto: pending.idProduto,
            codigoRfid: `TEMP_${Date.now()}_${Math.random()}`,
            codigoUnico: pending.codigoUnico,
            dataValidade: pending.dataValidade,
            lote: pending.lote,
            dataFabricacao: pending.dataFabricacao,
            qtdeUMVolume: pending.qtdeUMVolume,
          },
        });
        createdTags.push({ id: tag.id, itemIndex: pending.itemIndex });
      }

      // Generate final RFID codes and batch update
      const now = new Date();
      const empresaPrefix = String(idEmpresa).padStart(4, '0');
      const filialPrefix = String(idFilial).padStart(4, '0');
      const yearPrefix = String(now.getFullYear()).padStart(4, '0');
      const monthPrefix = String(now.getMonth() + 1).padStart(2, '0');

      for (const created of createdTags) {
        const codigoRfid = [
          empresaPrefix,
          filialPrefix,
          yearPrefix,
          monthPrefix,
          String(created.id).padStart(14, '0'),
        ].join('');

        const updatedTag = await tx.tagRfid.update({
          where: { id: created.id },
          data: { codigoRfid },
        });

        resultado[created.itemIndex].tags.push({
          id: updatedTag.id,
          codigoRfid: updatedTag.codigoRfid,
          codigoUnico: updatedTag.codigoUnico,
          dataValidade: updatedTag.dataValidade,
          lote: updatedTag.lote,
          dataFabricacao: updatedTag.dataFabricacao,
        });
      }

      // Create MovimentacaoItem records linking tags to this movimentação
      await tx.movimentacaoItem.createMany({
        data: createdTags.map((ct) => {
          const tagData = resultado[ct.itemIndex].tags.find(
            (t) => t.id === ct.id,
          )!;
          return {
            idMovimentacao,
            idTagRfid: ct.id,
            codigoRfid: tagData.codigoRfid,
            ocorrencia: 'LEITURA' as const,
          };
        }),
      });

      await tx.movimentacao.update({
        where: { id: idMovimentacao },
        data: {
          situacao: 'PROCESSADO',
          dataProcessamento: new Date(),
        },
      });

      return {
        movimentacaoId: idMovimentacao,
        totalTags: resultado.reduce((acc, r) => acc + r.tags.length, 0),
        produtos: resultado,
      };
    });
  }

  // ── Get Processed Tags ─────────────────────────────────

  async getProcessedTags(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ) {
    await this.ensureMovimentacaoAccess(idMovimentacao, userId, regra);

    const movimentacao = await this.prisma.movimentacao.findUnique({
      where: { id: idMovimentacao },
      include: { importacaoItens: true },
    });
    if (!movimentacao)
      throw new NotFoundException('Movimentação não encontrada');

    if (
      movimentacao.situacao !== 'PROCESSADO' &&
      movimentacao.situacao !== 'FINALIZADO'
    ) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `Movimentação não está na situação PROCESSADO ou FINALIZADO (atual: ${movimentacao.situacao}).`,
      });
    }

    // Fetch tags via MovimentacaoItem — these are exactly the tags generated by this movimentação
    const itens = await this.prisma.movimentacaoItem.findMany({
      where: { idMovimentacao, ocorrencia: 'LEITURA' },
      include: {
        tagRfid: {
          include: { produto: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by produto code (from ImportacaoItem order for consistency)
    const produtoMap = new Map<
      string,
      {
        codigo: string;
        nome: string | null;
        tags: {
          id: number;
          codigoRfid: string;
          codigoUnico: string | null;
          dataValidade: Date | null;
          lote: string | null;
          dataFabricacao: Date | null;
        }[];
      }
    >();

    // Initialize in import order
    for (const item of movimentacao.importacaoItens) {
      if (!produtoMap.has(item.codigo)) {
        produtoMap.set(item.codigo, {
          codigo: item.codigo,
          nome: item.nome,
          tags: [],
        });
      }
    }

    // Populate with actual tags from MovimentacaoItem
    for (const mi of itens) {
      if (!mi.tagRfid) continue;
      const tag = mi.tagRfid;
      const codigo = tag.produto.codigo;
      const entry = produtoMap.get(codigo);
      if (entry) {
        entry.tags.push({
          id: tag.id,
          codigoRfid: tag.codigoRfid,
          codigoUnico: tag.codigoUnico,
          dataValidade: tag.dataValidade,
          lote: tag.lote,
          dataFabricacao: tag.dataFabricacao,
        });
      }
    }

    const resultado = Array.from(produtoMap.values()).filter(
      (p) => p.tags.length > 0,
    );

    return {
      movimentacaoId: idMovimentacao,
      totalTags: resultado.reduce((acc, r) => acc + r.tags.length, 0),
      produtos: resultado,
    };
  }

  // ── Finalizar ──────────────────────────────────────────

  async finalizarMovimentacao(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ) {
    await this.ensureMovimentacaoAccess(idMovimentacao, userId, regra);

    const movimentacao = await this.prisma.movimentacao.findUnique({
      where: { id: idMovimentacao },
    });

    if (!movimentacao)
      throw new NotFoundException('Movimentação não encontrada');

    if (movimentacao.situacao !== 'PROCESSADO') {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `Movimentação não está na situação PROCESSADO (atual: ${movimentacao.situacao}).`,
      });
    }

    await this.prisma.movimentacao.update({
      where: { id: idMovimentacao },
      data: { situacao: 'FINALIZADO' },
    });

    return { movimentacaoId: idMovimentacao, situacao: 'FINALIZADO' };
  }
}
