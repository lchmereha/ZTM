import { Injectable } from '@nestjs/common';
import { TenantService } from '../common/services/tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  DashboardResumoResponse,
  MovimentacaoPorMes,
} from './dto/dashboard-resumo.dto';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  async getResumo(
    idFilial: number,
    meses: number,
    userId: number,
    regra: string,
  ): Promise<DashboardResumoResponse> {
    await this.tenant.ensureFilialAccess(idFilial, userId, regra);

    // ── Date boundaries ──────────────────────────────────
    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const startMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - meses + 1, 1),
    );

    // ── Execute all queries in parallel ──────────────────
    const [
      totalTagsAtivas,
      produtosAgrupados,
      movimentacoesHoje,
      movimentacoesPendentes,
      movimentacoesFinalizadas,
      topProdutosAgrupados,
      ultimasMovimentacoesRaw,
    ] = await Promise.all([
      // 1. Total active tags
      this.prisma.tagRfid.count({
        where: { dataBaixa: null, idFilial },
      }),

      // 2. Distinct products with active tags
      this.prisma.tagRfid.groupBy({
        by: ['idProduto'],
        where: { dataBaixa: null, idFilial },
        _count: { id: true },
      }),

      // 3. Finalized movements today
      this.prisma.movimentacao.count({
        where: {
          dataProcessamento: { gte: startOfToday },
          idFilial,
          situacao: 'FINALIZADO',
        },
      }),

      // 4. Pending movements
      this.prisma.movimentacao.count({
        where: {
          idFilial,
          situacao: { in: ['CRIADO', 'IMPORTADO', 'PROCESSADO'] },
        },
      }),

      // 5. Finalized movements in the last N months (for chart)
      this.prisma.movimentacao.findMany({
        include: { tipo: { select: { tipo: true } } },
        where: {
          dataProcessamento: { gte: startMonth },
          idFilial,
          situacao: 'FINALIZADO',
        },
      }),

      // 6. Top 10 products by active tag count
      this.prisma.tagRfid.groupBy({
        _count: { id: true },
        by: ['idProduto'],
        orderBy: { _count: { id: 'desc' } },
        take: 10,
        where: { dataBaixa: null, idFilial },
      }),

      // 7. Last 5 finalized movements
      this.prisma.movimentacao.findMany({
        include: { tipo: { select: { descricao: true, tipo: true } } },
        orderBy: { dataProcessamento: 'desc' },
        take: 5,
        where: { idFilial, situacao: 'FINALIZADO' },
      }),
    ]);

    // ── movimentacoesPorMes: group by YYYY-MM + tipo ─────
    const movimentacoesPorMes = this.buildMovimentacoesPorMes(
      movimentacoesFinalizadas,
      startMonth,
      now,
    );

    // ── topProdutos: fetch product details ───────────────
    const produtoIds = topProdutosAgrupados.map((g) => g.idProduto);
    const produtos =
      produtoIds.length > 0
        ? await this.prisma.produto.findMany({
            select: { codigo: true, id: true, nome: true },
            where: { id: { in: produtoIds } },
          })
        : [];

    const produtoMap = new Map(produtos.map((p) => [p.id, p]));

    const topProdutos = topProdutosAgrupados.map((g) => {
      const produto = produtoMap.get(g.idProduto);
      return {
        codigoProduto: produto?.codigo ?? '',
        nomeProduto: produto?.nome ?? '',
        quantidade: g._count.id,
      };
    });

    // ── ultimasMovimentacoes: format response ────────────
    const ultimasMovimentacoes = ultimasMovimentacoesRaw.map((m) => ({
      createdAt: m.createdAt.toISOString(),
      dataProcessamento: m.dataProcessamento?.toISOString() ?? null,
      descricao: m.descricao,
      id: m.id,
      situacao: m.situacao,
      tipoMovimentacao: m.tipo.descricao,
      tipoOpcao: m.tipo.tipo,
    }));

    return {
      movimentacoesHoje,
      movimentacoesPendentes,
      movimentacoesPorMes,
      topProdutos,
      totalProdutosComEstoque: produtosAgrupados.length,
      totalTagsAtivas,
      ultimasMovimentacoes,
    };
  }

  // ── Private helpers ──────────────────────────────────────

  /**
   * Groups finalized movements by YYYY-MM and TipoOpcaoMovimentacao,
   * generating all months in the range (even empty ones) for continuous
   * chart data.
   */
  private buildMovimentacoesPorMes(
    movimentacoes: Array<{
      dataProcessamento: Date | null;
      tipo: { tipo: string };
    }>,
    startMonth: Date,
    endDate: Date,
  ): MovimentacaoPorMes[] {
    // Generate all month keys in range
    const monthKeys: string[] = [];
    const cursor = new Date(
      Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth(), 1),
    );
    const endMonthLimit = new Date(
      Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1),
    );

    while (cursor <= endMonthLimit) {
      const year = cursor.getUTCFullYear();
      const month = String(cursor.getUTCMonth() + 1).padStart(2, '0');
      monthKeys.push(`${year}-${month}`);
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    // Initialize all months with zeros
    const emptyMonth = (): Omit<MovimentacaoPorMes, 'mes'> => ({
      associacao: 0,
      conferencia: 0,
      impressao: 0,
      leitura: 0,
      transferencia: 0,
    });

    const grouped = new Map<string, Omit<MovimentacaoPorMes, 'mes'>>();
    for (const key of monthKeys) {
      grouped.set(key, emptyMonth());
    }

    // Populate from actual data
    for (const mov of movimentacoes) {
      if (!mov.dataProcessamento) continue;

      const d = mov.dataProcessamento;
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;

      let entry = grouped.get(key);
      if (!entry) {
        entry = emptyMonth();
        grouped.set(key, entry);
      }

      const tipo = mov.tipo.tipo.toLowerCase() as keyof Omit<
        MovimentacaoPorMes,
        'mes'
      >;
      if (tipo in entry) {
        entry[tipo]++;
      }
    }

    // Convert to sorted array
    return monthKeys.map((mes) => ({
      mes,
      ...grouped.get(mes)!,
    }));
  }
}
