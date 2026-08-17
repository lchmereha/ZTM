import { Injectable } from '@nestjs/common';
import { TenantService } from '../../common/services/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConcluirTransferenciaDto } from '../dto/concluir-transferencia.dto';
import { BaseMovimentacaoService } from './base-movimentacao.service';

@Injectable()
export class TransferenciaService extends BaseMovimentacaoService {
  constructor(prisma: PrismaService, tenant: TenantService) {
    super(prisma, tenant);
  }

  // ── Listar Produtos para Transferência ───────────────────

  async listarProdutosTransferencia(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ) {
    const movimentacao = await this.fetchAndValidate(
      idMovimentacao,
      userId,
      regra,
      'TRANSFERENCIA',
    );

    const codigos = movimentacao.importacaoItens.map((i) => i.codigo);
    if (codigos.length === 0) return [];

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
        tagsAtivas = await this.prisma.tagRfid.findMany({
          where: { idProduto: produto.id, dataBaixa: null },
          select: { id: true, codigoRfid: true, codigoUnico: true },
        });

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
        posicaoEstoque: item.posicaoEstoque || null,
        codigoRfidEsperado,
        tagsAtivas,
        totalTagsAtivas: tagsAtivas.length,
      });
    }

    return results;
  }

  // ── Concluir Transferência ───────────────────────────────

  async concluirTransferencia(
    idMovimentacao: number,
    dto: ConcluirTransferenciaDto,
    userId: number,
    regra: string,
  ) {
    const movimentacao = await this.fetchAndValidate(
      idMovimentacao,
      userId,
      regra,
      'TRANSFERENCIA',
      'IMPORTADO',
    );

    if (!movimentacao.idFilialDestino) {
      this.throwValidationErrors('Erro de Transferência', [
        {
          campo: 'idFilialDestino',
          erros: [
            'Movimentação de Transferência precisa ter uma Filial Destino.',
          ],
        },
      ]);
    }

    const importacaoMap = new Map(
      movimentacao.importacaoItens.map((i) => [i.codigo, i]),
    );
    const codigos = movimentacao.importacaoItens.map((i) => i.codigo);
    const produtos = await this.prisma.produto.findMany({
      where: { codigo: { in: codigos } },
    });
    const produtoIdMap = new Map(produtos.map((p) => [p.id, p]));

    const errors: { campo: string; erros: string[] }[] = [];
    const vinculadoTagIds = new Set<number>();

    // Get all old tags
    const tagIds = dto.vinculacoes.map((v) => v.idTagRfid);
    const allTags = await this.prisma.tagRfid.findMany({
      where: { id: { in: tagIds } },
    });
    const tagMap = new Map(allTags.map((t) => [t.id, t]));

    for (const vinc of dto.vinculacoes) {
      const produto = produtoIdMap.get(vinc.idProduto);
      if (!produto) {
        errors.push({
          campo: `Produto ID ${vinc.idProduto}`,
          erros: [`Produto com ID ${vinc.idProduto} não encontrado.`],
        });
        continue;
      }

      if (!importacaoMap.has(produto.codigo)) {
        errors.push({
          campo: `Produto ${produto.codigo}`,
          erros: ['Produto não consta na importação.'],
        });
        continue;
      }

      const tag = tagMap.get(vinc.idTagRfid);
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
      this.throwValidationErrors('Erro na validação da transferência.', errors);
    }

    return this.prisma.$transaction(async (tx) => {
      // Find all posicoes estoque created/mapped for this movement in FilialDestino
      const posicoesEstoqueReq = [
        ...new Set(
          movimentacao.importacaoItens
            .map((i) => i.posicaoEstoque)
            .filter(Boolean) as string[],
        ),
      ];
      const posicoesDb = await tx.posicaoEstoque.findMany({
        where: {
          idFilial: movimentacao.idFilialDestino!,
          nome: { in: posicoesEstoqueReq },
        },
      });
      const posicaoMap = new Map(
        posicoesDb.map((p) => [p.nome.toUpperCase(), p.id]),
      );

      // Create missing stock positions dynamically in the destination branch
      for (const nomeReq of posicoesEstoqueReq) {
        const nomeUpper = nomeReq.toUpperCase();
        if (!posicaoMap.has(nomeUpper)) {
          const newPosicao = await tx.posicaoEstoque.create({
            data: {
              nome: nomeReq,
              idFilial: movimentacao.idFilialDestino!,
            },
          });
          posicaoMap.set(nomeUpper, newPosicao.id);
        }
      }

      let totalTransferidas = 0;

      for (const vinc of dto.vinculacoes) {
        const tagAntiga = tagMap.get(vinc.idTagRfid)!;
        const produto = produtoIdMap.get(vinc.idProduto)!;
        const impItem = importacaoMap.get(produto.codigo)!;

        const posicaoEstoqueNome = impItem.posicaoEstoque?.trim().toUpperCase();
        const idPosicaoEstoque = posicaoEstoqueNome
          ? posicaoMap.get(posicaoEstoqueNome)
          : undefined;

        // Baixa the old tag
        await tx.tagRfid.update({
          where: { id: tagAntiga.id },
          data: { dataBaixa: new Date() },
        });

        // Create the new transferred tag
        const novaTag = await tx.tagRfid.create({
          data: {
            idProduto: tagAntiga.idProduto,
            idFilial: movimentacao.idFilialDestino!,
            codigoRfid: tagAntiga.codigoRfid,
            codigoUnico: tagAntiga.codigoUnico,
            idPosicaoEstoque: idPosicaoEstoque,
          },
        });

        // Record the reading with old tag reference (SAÍDA)
        await tx.movimentacaoItem.create({
          data: {
            idMovimentacao,
            idTagRfid: tagAntiga.id,
            codigoRfid: vinc.codigoRfidLido,
            ocorrencia: 'LEITURA' as const,
          },
        });

        // Record the inclusion with new tag reference (ENTRADA)
        await tx.movimentacaoItem.create({
          data: {
            idMovimentacao,
            idTagRfid: novaTag.id,
            codigoRfid: vinc.codigoRfidLido,
            ocorrencia: 'INCLUSAO' as const,
          },
        });

        totalTransferidas++;
      }

      await this.finalizarMovimentacao(tx, idMovimentacao);

      return {
        movimentacaoId: idMovimentacao,
        totalTransferidas,
        totalProdutos: movimentacao.importacaoItens.length,
      };
    });
  }

  // ── Relatório de Transferência ───────────────────────────

  async relatorioTransferencia(
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

    const itens = await this.prisma.movimentacaoItem.findMany({
      where: { idMovimentacao },
      include: {
        tagRfid: {
          include: { produto: true, posicaoEstoque: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const codigos = movimentacao.importacaoItens.map((i) => i.codigo);
    const produtos = await this.prisma.produto.findMany({
      where: { codigo: { in: codigos } },
    });
    const produtoMap = new Map(produtos.map((p) => [p.codigo, p]));

    const result = [];
    let totalTransferidas = 0;
    let totalSolicitadas = 0;

    for (const importItem of movimentacao.importacaoItens) {
      const produto = produtoMap.get(importItem.codigo);
      if (!produto) continue;

      const quantidadeSolicitada = importItem.quantidade;
      totalSolicitadas += quantidadeSolicitada;

      const transferidas = itens
        .filter(
          (i) =>
            i.ocorrencia === 'LEITURA' &&
            i.tagRfid?.produto?.codigo === importItem.codigo,
        )
        .map((i) => ({
          id: i.tagRfid!.id,
          codigoRfid: i.tagRfid!.codigoRfid,
          codigoUnico: i.tagRfid!.codigoUnico,
          tagRfid: i.tagRfid, // Keep temporarily for mapping posicaoOrigem
        }));

      totalTransferidas += transferidas.length;

      const posicaoOrigem =
        transferidas.length > 0
          ? transferidas[0].tagRfid!.posicaoEstoque?.nome || null
          : null;

      result.push({
        codigo: importItem.codigo,
        nome: importItem.nome || produto.nome,
        quantidadeSolicitada,
        posicaoOrigem,
        posicaoDestino: importItem.posicaoEstoque || null,
        transferidas: transferidas.map((i) => ({
          id: i.id,
          codigoRfid: i.codigoRfid,
          codigoUnico: i.codigoUnico,
        })),
      });
    }

    return {
      movimentacaoId: idMovimentacao,
      totalSolicitadas,
      totalTransferidas,
      produtos: result,
    };
  }
}
