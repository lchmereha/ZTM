import { Injectable } from '@nestjs/common';
import { TenantService } from '../../common/services/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConcluirConferenciaDto } from '../dto/concluir-conferencia.dto';
import { BaseMovimentacaoService } from './base-movimentacao.service';

@Injectable()
export class ConferenciaService extends BaseMovimentacaoService {
  constructor(prisma: PrismaService, tenant: TenantService) {
    super(prisma, tenant);
  }

  // ── Listar Produtos para Conferência ───────────────────

  /**
   * Returns the imported products (from ImportacaoItem) for the given movimentação,
   * enriched with the active tags (dataBaixa === null) for each product.
   */
  async listarProdutosConferencia(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ) {
    const movimentacao = await this.fetchAndValidate(
      idMovimentacao,
      userId,
      regra,
      'CONFERENCIA',
    );

    const codigos = movimentacao.importacaoItens.map((i) => i.codigo);
    if (codigos.length === 0) return [];

    // Fetch products matching the imported codes
    const produtos = await this.prisma.produto.findMany({
      where: { codigo: { in: codigos } },
      include: {
        categoria: { select: { nome: true } },
      },
    });
    const produtoMap = new Map(produtos.map((p) => [p.codigo, p]));

    const results = [];

    for (const item of movimentacao.importacaoItens) {
      const produto = produtoMap.get(item.codigo);

      let tagsAtivas: Array<{
        id: number;
        codigoRfid: string;
        codigoUnico: string | null;
      }> = [];
      let codigoRfidEsperado: string | null = null;

      if (produto) {
        // Get active tags for this product
        tagsAtivas = await this.prisma.tagRfid.findMany({
          where: { idProduto: produto.id, dataBaixa: null },
          select: { id: true, codigoRfid: true, codigoUnico: true },
        });

        // If the import item has a codigoUnico, find the specific tag
        if (item.codigoUnico) {
          const tagEspecifica = await this.prisma.tagRfid.findFirst({
            where: {
              idProduto: produto.id,
              codigoUnico: item.codigoUnico,
              dataBaixa: null,
            },
            select: { codigoRfid: true },
          });
          codigoRfidEsperado = tagEspecifica?.codigoRfid ?? null;
        }
      }

      results.push({
        importacaoItemId: item.id,
        idProduto: produto?.id ?? null,
        codigo: item.codigo,
        nome: item.nome || produto?.nome || '',
        unidadeMedida: item.unidadeMedida || produto?.unidadeMedida || '',
        categoria: item.categoria || produto?.categoria?.nome || '',
        quantidadeConferencia: item.quantidade,
        codigoUnico: item.codigoUnico || null,
        codigoRfidEsperado,
        tagsAtivas,
        totalTagsAtivas: tagsAtivas.length,
      });
    }

    return results;
  }

  // ── Concluir Conferência ───────────────────────────────

  /**
   * Receives a list of {idProduto, idTagRfid, codigoRfidLido} vinculações
   * and creates MovimentacaoItem records. If TipoMovimentacao.fazBaixa is true,
   * deactivates (dataBaixa) tags not found in the vinculações.
   */
  async concluirConferencia(
    idMovimentacao: number,
    dto: ConcluirConferenciaDto,
    userId: number,
    regra: string,
  ) {
    const movimentacao = await this.fetchAndValidate(
      idMovimentacao,
      userId,
      regra,
      'CONFERENCIA',
      'IMPORTADO',
    );

    // Build maps for validation
    const importacaoMap = new Map(
      movimentacao.importacaoItens.map((i) => [i.codigo, i]),
    );
    const codigos = movimentacao.importacaoItens.map((i) => i.codigo);
    const produtos = await this.prisma.produto.findMany({
      where: { codigo: { in: codigos } },
    });
    const produtoIdMap = new Map(produtos.map((p) => [p.id, p]));

    // Validate each vinculação
    const errors: { campo: string; erros: string[] }[] = [];
    const vinculadoTagIds = new Set<number>();

    for (const vinc of dto.vinculacoes) {
      const produto = produtoIdMap.get(vinc.idProduto);
      if (!produto) {
        errors.push({
          campo: `Produto ID ${vinc.idProduto}`,
          erros: [
            `Produto com ID ${vinc.idProduto} não encontrado na importação.`,
          ],
        });
        continue;
      }

      // Validate import item exists for this product
      if (!importacaoMap.has(produto.codigo)) {
        errors.push({
          campo: `Produto ${produto.codigo}`,
          erros: ['Produto não consta na importação desta movimentação.'],
        });
        continue;
      }

      // Validate tag exists and is active
      const tag = await this.prisma.tagRfid.findUnique({
        where: { id: vinc.idTagRfid },
      });
      if (!tag) {
        errors.push({
          campo: `Tag ID ${vinc.idTagRfid}`,
          erros: [`Tag RFID com ID ${vinc.idTagRfid} não encontrada.`],
        });
        continue;
      }
      if (tag.dataBaixa !== null) {
        errors.push({
          campo: `Tag ${tag.codigoRfid}`,
          erros: ['Esta tag já foi baixada e não está ativa.'],
        });
        continue;
      }

      vinculadoTagIds.add(vinc.idTagRfid);
    }

    if (errors.length > 0) {
      this.throwValidationErrors('Erro na validação da conferência.', errors);
    }

    // All validations passed — process in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Create MovimentacaoItem for each vinculação (ocorrencia: 'LEITURA')
      await tx.movimentacaoItem.createMany({
        data: dto.vinculacoes.map((vinc) => ({
          idMovimentacao,
          idTagRfid: vinc.idTagRfid,
          codigoRfid: vinc.codigoRfidLido,
          ocorrencia: 'LEITURA' as const,
        })),
      });

      let totalBaixadas = 0;

      // Check if TipoMovimentacao.fazBaixa is true
      if (movimentacao.tipo.fazBaixa) {
        // For each imported product, find active tags NOT in vinculacoes
        for (const item of movimentacao.importacaoItens) {
          const produto = produtos.find((p) => p.codigo === item.codigo);
          if (!produto) continue;

          const tagsNaoEncontradas = await tx.tagRfid.findMany({
            where: {
              idProduto: produto.id,
              dataBaixa: null,
              id: { notIn: [...vinculadoTagIds] },
            },
          });

          if (tagsNaoEncontradas.length > 0) {
            // Set dataBaixa on unmatched tags
            await tx.tagRfid.updateMany({
              where: {
                id: { in: tagsNaoEncontradas.map((t) => t.id) },
              },
              data: { dataBaixa: new Date() },
            });

            // Create MovimentacaoItem for baixa'd tags (ocorrencia: 'NAO_ENCONTRADO')
            await tx.movimentacaoItem.createMany({
              data: tagsNaoEncontradas.map((tag) => ({
                idMovimentacao,
                idTagRfid: tag.id,
                codigoRfid: tag.codigoRfid,
                ocorrencia: 'NAO_ENCONTRADO' as const,
              })),
            });

            totalBaixadas += tagsNaoEncontradas.length;
          }
        }
      }

      // Finalize movimentação
      await this.finalizarMovimentacao(tx, idMovimentacao);

      return {
        movimentacaoId: idMovimentacao,
        totalConferidas: dto.vinculacoes.length,
        totalBaixadas,
        totalProdutos: movimentacao.importacaoItens.length,
      };
    });
  }

  // ── Relatório de Conferência ───────────────────────────

  /**
   * Returns a detailed report of the conference outcome.
   *
   * Per product, tags are split into three categories:
   * - conferidas: MovimentacaoItem with ocorrencia LEITURA
   * - naoEncontradas: MovimentacaoItem with ocorrencia NAO_ENCONTRADO (baixadas by this movement)
   * - ignoradas: tags of the product with NO MovimentacaoItem in this movement (outside scope)
   *
   * Also includes quantidadeSolicitada (from ImportacaoItem) and fazBaixa (from TipoMovimentacao).
   */
  async relatorioConferencia(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ) {
    await this.ensureMovimentacaoAccess(idMovimentacao, userId, regra);

    const movimentacao = await this.prisma.movimentacao.findUnique({
      where: { id: idMovimentacao },
      include: {
        tipo: true,
        importacaoItens: true,
      },
    });
    if (!movimentacao) {
      throw new Error('Movimentação não encontrada');
    }

    const fazBaixa = movimentacao.tipo.fazBaixa;

    // All MovimentacaoItem records for this movement
    const itens = await this.prisma.movimentacaoItem.findMany({
      where: { idMovimentacao },
      include: {
        tagRfid: {
          include: { produto: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Collect tag IDs that have a MovimentacaoItem in this movement
    const tagIdsInMovimentacao = new Set(
      itens.filter((i) => i.idTagRfid !== null).map((i) => i.idTagRfid!),
    );

    // Find all referenced product codes from the import
    const codigos = movimentacao.importacaoItens.map((i) => i.codigo);
    const produtos = await this.prisma.produto.findMany({
      where: { codigo: { in: codigos } },
    });
    const produtoMap = new Map(produtos.map((p) => [p.codigo, p]));

    // Build result per product
    const result = [];
    let totalConferidas = 0;
    let totalNaoEncontradas = 0;
    let totalIgnoradas = 0;
    let totalSolicitadas = 0;

    for (const importItem of movimentacao.importacaoItens) {
      const produto = produtoMap.get(importItem.codigo);
      if (!produto) continue;

      const quantidadeSolicitada = importItem.quantidade;
      totalSolicitadas += quantidadeSolicitada;

      // Tags conferidas (LEITURA) for this product
      const conferidas = itens
        .filter(
          (i) =>
            i.ocorrencia === 'LEITURA' &&
            i.tagRfid?.produto?.codigo === importItem.codigo,
        )
        .map((i) => ({
          id: i.tagRfid!.id,
          codigoRfid: i.tagRfid!.codigoRfid,
          codigoUnico: i.tagRfid!.codigoUnico,
        }));

      // Tags não encontradas (NAO_ENCONTRADO) — baixadas by this movement
      const naoEncontradas = itens
        .filter(
          (i) =>
            i.ocorrencia === 'NAO_ENCONTRADO' &&
            i.tagRfid?.produto?.codigo === importItem.codigo,
        )
        .map((i) => ({
          id: i.tagRfid!.id,
          codigoRfid: i.tagRfid!.codigoRfid,
          codigoUnico: i.tagRfid!.codigoUnico,
        }));

      // Tags ignoradas — all tags of this product that have NO MovimentacaoItem
      // These are tags that were outside the conference scope entirely
      const todasTagsProduto = await this.prisma.tagRfid.findMany({
        where: { idProduto: produto.id },
        select: {
          id: true,
          codigoRfid: true,
          codigoUnico: true,
          dataBaixa: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      const ignoradas = todasTagsProduto
        .filter((t) => !tagIdsInMovimentacao.has(t.id))
        .map((t) => ({
          id: t.id,
          codigoRfid: t.codigoRfid,
          codigoUnico: t.codigoUnico,
          ativa: t.dataBaixa === null,
        }));

      totalConferidas += conferidas.length;
      totalNaoEncontradas += naoEncontradas.length;
      totalIgnoradas += ignoradas.length;

      result.push({
        codigo: importItem.codigo,
        nome: importItem.nome || produto.nome,
        quantidadeSolicitada,
        totalTagsProduto: todasTagsProduto.length,
        conferidas,
        naoEncontradas,
        ignoradas,
      });
    }

    return {
      movimentacaoId: idMovimentacao,
      fazBaixa,
      totalSolicitadas,
      totalConferidas,
      totalNaoEncontradas,
      totalIgnoradas,
      produtos: result,
    };
  }
}
