import { Injectable } from '@nestjs/common';
import { TenantService } from '../../common/services/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConcluirAssociacaoDto } from '../dto/concluir-associacao.dto';
import { BaseMovimentacaoService } from './base-movimentacao.service';

@Injectable()
export class AssociacaoService extends BaseMovimentacaoService {
  constructor(prisma: PrismaService, tenant: TenantService) {
    super(prisma, tenant);
  }

  // ── Listar Produtos para Associação ────────────────────

  async validarAssociacao(
    idMovimentacao: number,
    codigosRfid: string[],
    userId: number,
    regra: string,
  ) {
    await this.ensureMovimentacaoAccess(idMovimentacao, userId, regra);

    const existingTags = await this.prisma.tagRfid.findMany({
      where: { codigoRfid: { in: codigosRfid } },
      select: { codigoRfid: true },
    });

    return {
      jaCadastrados: existingTags.map((t) => t.codigoRfid),
    };
  }

  /**
   * Returns the imported products (from ImportacaoItem) for the given movimentação,
   * enriched with the count of tags already associated to each product.
   */
  async listarProdutosAssociacao(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ) {
    const movimentacao = await this.fetchAndValidate(
      idMovimentacao,
      userId,
      regra,
      'ASSOCIACAO',
    );

    // Fetch the actual Produto records for each imported code
    const codigos = movimentacao.importacaoItens.map((i) => i.codigo);
    if (codigos.length === 0) return [];

    const produtos = await this.prisma.produto.findMany({
      where: { codigo: { in: codigos } },
      include: {
        _count: { select: { tagsRfid: true } },
        categoria: { select: { nome: true } },
      },
    });
    const produtoMap = new Map(produtos.map((p) => [p.codigo, p]));

    return movimentacao.importacaoItens.map((item) => {
      const produto = produtoMap.get(item.codigo);
      return {
        importacaoItemId: item.id,
        idProduto: produto?.id ?? null,
        codigo: item.codigo,
        nome: item.nome || produto?.nome || '',
        unidadeMedida: item.unidadeMedida || produto?.unidadeMedida || '',
        categoria: item.categoria || produto?.categoria?.nome || '',
        quantidadeEsperada: item.quantidade,
        tagsAssociadas: produto?._count?.tagsRfid ?? 0,
      };
    });
  }

  // ── Concluir Associação ────────────────────────────────

  /**
   * Receives a list of {idProduto, codigoRfid} mappings and creates
   * TagRfid records linking each EPC to its product. Also creates
   * MovimentacaoItem records and finalizes the movimentação.
   *
   * Validates:
   * - movimentação type is ASSOCIACAO
   * - each product belongs to the same empresa
   * - quantity of tags per product matches the expected count from ImportacaoItem
   * - no duplicate EPC codes
   */
  async concluirAssociacao(
    idMovimentacao: number,
    dto: ConcluirAssociacaoDto,
    userId: number,
    regra: string,
  ) {
    const movimentacao = await this.fetchAndValidate(
      idMovimentacao,
      userId,
      regra,
      'ASSOCIACAO',
      'IMPORTADO',
    );

    // Build expected quantities from ImportacaoItem
    const importacaoMap = new Map(
      movimentacao.importacaoItens.map((i) => [i.codigo, i]),
    );

    // Find Produto records for all imported codes
    const codigos = movimentacao.importacaoItens.map((i) => i.codigo);
    const produtos = await this.prisma.produto.findMany({
      where: { codigo: { in: codigos } },
    });
    const produtoIdMap = new Map(produtos.map((p) => [p.id, p]));

    // Validate: all tags reference valid products
    const errors: { campo: string; erros: string[] }[] = [];
    const tagsByProduct = new Map<number, string[]>();

    for (const tag of dto.tags) {
      const produto = produtoIdMap.get(tag.idProduto);
      if (!produto) {
        errors.push({
          campo: `Tag ${tag.codigoRfid}`,
          erros: [`Produto com ID ${tag.idProduto} não encontrado.`],
        });
        continue;
      }

      if (!tagsByProduct.has(tag.idProduto)) {
        tagsByProduct.set(tag.idProduto, []);
      }
      tagsByProduct.get(tag.idProduto)!.push(tag.codigoRfid);
    }

    // Validate: quantity per product matches expected
    for (const [produtoId, epcs] of tagsByProduct.entries()) {
      const produto = produtoIdMap.get(produtoId);
      if (!produto) continue;

      const importItem = importacaoMap.get(produto.codigo);
      if (!importItem) {
        errors.push({
          campo: `Produto ${produto.codigo}`,
          erros: ['Produto não consta na importação desta movimentação.'],
        });
        continue;
      }

      if (epcs.length !== importItem.quantidade) {
        errors.push({
          campo: `Produto ${produto.codigo} (${produto.nome})`,
          erros: [
            `Esperado ${importItem.quantidade} ${importItem.quantidade === 1 ? 'tag' : 'tags'}, mas ${epcs.length} ${epcs.length === 1 ? 'foi enviada' : 'foram enviadas'}.`,
          ],
        });
      }
    }

    // Validate: all products from import have been covered
    for (const item of movimentacao.importacaoItens) {
      const produto = produtos.find((p) => p.codigo === item.codigo);
      if (!produto) {
        errors.push({
          campo: `Produto ${item.codigo}`,
          erros: ['Produto não encontrado no banco de dados.'],
        });
        continue;
      }
      if (!tagsByProduct.has(produto.id)) {
        errors.push({
          campo: `Produto ${item.codigo} (${item.nome || produto.nome})`,
          erros: [
            `Nenhuma tag foi enviada para este produto. Esperado: ${item.quantidade}.`,
          ],
        });
      }
    }

    // Check for duplicate EPCs in the request
    const allEpcs = dto.tags.map((t) => t.codigoRfid);
    const duplicates = allEpcs.filter(
      (epc, idx) => allEpcs.indexOf(epc) !== idx,
    );
    if (duplicates.length > 0) {
      errors.push({
        campo: 'Tags Duplicadas',
        erros: [
          `Os seguintes EPCs estão duplicados: ${[...new Set(duplicates)].join(', ')}`,
        ],
      });
    }

    // Check for EPCs that already exist in the database
    const existingTags = await this.prisma.tagRfid.findMany({
      where: { codigoRfid: { in: allEpcs } },
      select: { codigoRfid: true },
    });
    if (existingTags.length > 0) {
      errors.push({
        campo: 'Tags já existentes',
        erros: [
          `Os seguintes EPCs já estão cadastrados: ${existingTags.map((t) => t.codigoRfid).join(', ')}`,
        ],
      });
    }

    if (errors.length > 0) {
      this.throwValidationErrors('Erro na validação da associação.', errors);
    }

    // All validations passed — create records in a transaction
    return this.prisma.$transaction(async (tx) => {
      const idFilial = movimentacao.idFilial;
      const createdTags: { id: number; codigoRfid: string }[] = [];

      for (const tag of dto.tags) {
        const produto = produtoIdMap.get(tag.idProduto)!;
        const importItem = importacaoMap.get(produto.codigo)!;

        const created = await tx.tagRfid.create({
          data: {
            idFilial,
            idProduto: tag.idProduto,
            codigoRfid: tag.codigoRfid,
            codigoUnico: importItem.codigoUnico || null,
            dataValidade: importItem.dataValidade || null,
            lote: importItem.lote || null,
            dataFabricacao: importItem.dataFabricacao || null,
            qtdeUMVolume: importItem.qtdeUMVolume || null,
          },
        });
        createdTags.push({ id: created.id, codigoRfid: created.codigoRfid });
      }

      // Create MovimentacaoItem records
      await tx.movimentacaoItem.createMany({
        data: createdTags.map((tag) => ({
          idMovimentacao,
          idTagRfid: tag.id,
          codigoRfid: tag.codigoRfid,
          ocorrencia: 'LEITURA' as const,
        })),
      });

      // Finalize movimentação
      await this.finalizarMovimentacao(tx, idMovimentacao);

      return {
        movimentacaoId: idMovimentacao,
        totalTags: createdTags.length,
        tags: createdTags,
      };
    });
  }

  // ── Relatório de Associação ────────────────────────────

  /**
   * Returns a report of the tags that were associated in this movimentação,
   * grouped by product.
   */
  async relatorioAssociacao(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ) {
    await this.ensureMovimentacaoAccess(idMovimentacao, userId, regra);

    const movimentacao = await this.prisma.movimentacao.findUnique({
      where: { id: idMovimentacao },
      include: { tipo: true },
    });
    if (!movimentacao) {
      throw new Error('Movimentação não encontrada');
    }

    const itens = await this.prisma.movimentacaoItem.findMany({
      where: {
        idMovimentacao,
        ocorrencia: 'LEITURA',
      },
      include: {
        tagRfid: {
          include: {
            produto: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by produto
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

    for (const item of itens) {
      if (!item.tagRfid) continue;
      const tag = item.tagRfid;
      const produto = tag.produto;
      const key = produto.codigo;

      if (!produtoMap.has(key)) {
        produtoMap.set(key, {
          codigo: produto.codigo,
          nome: produto.nome,
          tags: [],
        });
      }

      produtoMap.get(key)!.tags.push({
        id: tag.id,
        codigoRfid: tag.codigoRfid,
        codigoUnico: tag.codigoUnico,
        dataValidade: tag.dataValidade,
        lote: tag.lote,
        dataFabricacao: tag.dataFabricacao,
      });
    }

    return {
      movimentacaoId: idMovimentacao,
      totalTags: itens.length,
      produtos: Array.from(produtoMap.values()),
    };
  }
}
