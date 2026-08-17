import { BadRequestException, Injectable } from '@nestjs/common';
import { TenantService } from '../../common/services/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BaixaLeituraDto } from '../dto/baixa-leitura.dto';
import { BaseMovimentacaoService } from './base-movimentacao.service';

@Injectable()
export class LeituraService extends BaseMovimentacaoService {
  constructor(prisma: PrismaService, tenant: TenantService) {
    super(prisma, tenant);
  }

  // ── Validar Leitura ────────────────────────────────────

  async validarLeitura(
    id: number,
    dto: BaixaLeituraDto,
    userId: number,
    regra: string,
  ) {
    await this.ensureMovimentacaoAccess(id, userId, regra);

    const movimentacao = await this.prisma.movimentacao.findUnique({
      where: { id },
      include: { tipo: true },
    });
    if (!movimentacao) {
      throw new BadRequestException('Movimentação não encontrada');
    }

    const existingTags = await this.prisma.tagRfid.findMany({
      where: { codigoRfid: { in: dto.codigosRfid } },
      select: { codigoRfid: true, dataBaixa: true },
    });
    const existingSet = new Set(existingTags.map((t) => t.codigoRfid));

    const encontrados = dto.codigosRfid.filter((c) => existingSet.has(c));
    const naoEncontrados = dto.codigosRfid.filter((c) => !existingSet.has(c));
    const jaBaixados = existingTags
      .filter((t) => t.dataBaixa !== null)
      .map((t) => t.codigoRfid);

    return {
      total: dto.codigosRfid.length,
      encontrados: encontrados.length,
      naoEncontrados,
      jaBaixados,
    };
  }

  // ── Baixa Leitura ──────────────────────────────────────

  async baixaLeitura(
    id: number,
    dto: BaixaLeituraDto,
    userId: number,
    regra: string,
  ) {
    await this.fetchAndValidate(id, userId, regra, 'LEITURA');

    const existingTags = await this.prisma.tagRfid.findMany({
      where: { codigoRfid: { in: dto.codigosRfid } },
      select: { id: true, codigoRfid: true },
    });
    const existingMap = new Map(existingTags.map((t) => [t.codigoRfid, t]));

    const naoEncontrados = dto.codigosRfid.filter((c) => !existingMap.has(c));
    if (naoEncontrados.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `${naoEncontrados.length} ${naoEncontrados.length === 1 ? 'etiqueta não foi encontrada' : 'etiquetas não foram encontradas'} no banco de dados.`,
        naoEncontrados,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      await tx.tagRfid.updateMany({
        where: { codigoRfid: { in: dto.codigosRfid } },
        data: { dataBaixa: now },
      });

      await tx.movimentacaoItem.createMany({
        data: dto.codigosRfid.map((codigoRfid) => ({
          idMovimentacao: id,
          idTagRfid: existingMap.get(codigoRfid)!.id,
          codigoRfid,
          ocorrencia: 'LEITURA' as const,
        })),
      });

      // Leitura finalization does NOT set dataProcessamento (intentional)
      await tx.movimentacao.update({
        where: { id },
        data: { situacao: 'FINALIZADO' },
      });

      return {
        totalBaixa: dto.codigosRfid.length,
        movimentacaoId: id,
      };
    });
  }

  // ── Relatório de Baixa ────────────────────────────────

  async relatorioLeitura(id: number, userId: number, regra: string) {
    await this.ensureMovimentacaoAccess(id, userId, regra);

    const movimentacao = await this.prisma.movimentacao.findUnique({
      where: { id },
      include: { tipo: true },
    });
    if (!movimentacao) {
      throw new BadRequestException('Movimentação não encontrada');
    }

    const itens = await this.prisma.movimentacaoItem.findMany({
      where: {
        idMovimentacao: id,
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
          dataBaixa: Date | null;
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
        dataBaixa: tag.dataBaixa,
        dataValidade: tag.dataValidade,
        lote: tag.lote,
        dataFabricacao: tag.dataFabricacao,
      });
    }

    return {
      movimentacaoId: id,
      totalTags: itens.length,
      produtos: Array.from(produtoMap.values()),
    };
  }
}
