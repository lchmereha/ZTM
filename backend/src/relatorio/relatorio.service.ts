import { BadRequestException, Injectable } from '@nestjs/common';
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import { sanitizeDatatablesRecords } from '../common/helpers/datatables.helper';
import { TenantService } from '../common/services/tenant.service';
import { PrismaService } from '../prisma/prisma.service';

export interface EntradaSaidaRow {
  data: string;
  codigo: number;
  descricao: string | null;
  tipoMovimentacao: string;
  codigoProduto: string;
  nomeProduto: string;
  quantidade: number;
  tags?: string[];
}

function applyDatatablesOrder(rows: any[], data: DatatablesRequestDto) {
  const orderColIndex = data.order?.[0]?.column;
  const orderDir = data.order?.[0]?.dir === 'desc' ? -1 : 1;

  if (orderColIndex !== undefined && data.columns?.[orderColIndex]?.data) {
    const colName = data.columns[orderColIndex].data;
    rows.sort((a, b) => {
      let valA = a[colName];
      let valB = b[colName];

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB) * orderDir;
      }

      if (valA < valB) return -1 * orderDir;
      if (valA > valB) return 1 * orderDir;
      return 0;
    });
  }
}

@Injectable()
export class RelatorioService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  async posicaoEstoque(
    data: DatatablesRequestDto,
    userId: number,
    regra: string,
  ) {
    const { draw, start = 0, length = 10, filters = [] } = data;

    // ── Extract required filters ──────────────────────────
    const dataBaseFilter = filters.find((f) => f.field === 'dataBase');
    const idFilialFilter = filters.find((f) => f.field === 'idFilial');
    const idProdutoFilter = filters.find((f) => f.field === 'idProduto');
    const idPosicaoEstoqueFilter = filters.find(
      (f) => f.field === 'idPosicaoEstoque',
    );

    if (!dataBaseFilter?.value) {
      throw new BadRequestException('Filtro "dataBase" é obrigatório.');
    }
    if (!idFilialFilter?.value) {
      throw new BadRequestException('Filtro "idFilial" é obrigatório.');
    }

    const [year, month, day] = String(dataBaseFilter.value)
      .split('-')
      .map(Number);
    if (!year || !month || !day) {
      throw new BadRequestException('Data base inválida.');
    }

    // Limites do dia (ignora hora — comparação puramente por data)
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const startOfNextDay = new Date(
      Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0),
    );

    const idFilial = Number(idFilialFilter.value);
    await this.tenant.ensureFilialAccess(idFilial, userId, regra);

    // ── Build where clause ────────────────────────────────
    // createdAt < startOfNextDay  → tag existia naquela data (criada no dia ou antes)
    // dataBaixa IS NULL           → nunca recebeu baixa
    // dataBaixa >= startOfDay     → baixa no mesmo dia ou posterior (ainda contava no estoque)
    const where: Record<string, unknown> = {
      idFilial,
      createdAt: { lt: startOfNextDay },
      OR: [{ dataBaixa: null }, { dataBaixa: { gte: startOfDay } }],
    };

    if (idProdutoFilter?.value) {
      if (Array.isArray(idProdutoFilter.value)) {
        where.idProduto = { in: idProdutoFilter.value.map(Number) };
      } else {
        where.idProduto = Number(idProdutoFilter.value);
      }
    }

    if (idPosicaoEstoqueFilter?.value) {
      if (Array.isArray(idPosicaoEstoqueFilter.value)) {
        where.idPosicaoEstoque = {
          in: idPosicaoEstoqueFilter.value.map(Number),
        };
      } else {
        where.idPosicaoEstoque = Number(idPosicaoEstoqueFilter.value);
      }
    }

    // ── Group by idProduto and idPosicaoEstoque ───────────
    const grouped = await this.prisma.tagRfid.groupBy({
      by: ['idProduto', 'idPosicaoEstoque'],
      where,
      _count: { id: true },
    });

    if (grouped.length === 0) {
      return {
        draw: draw || 1,
        recordsTotal: 0,
        recordsFiltered: 0,
        data: [],
      };
    }

    // ── Fetch product and posicao details ─────────────────
    const produtoIds = [...new Set(grouped.map((g) => g.idProduto))];
    const produtos = await this.prisma.produto.findMany({
      where: { id: { in: produtoIds } },
      select: { id: true, codigo: true, nome: true },
    });
    const produtoMap = new Map(produtos.map((p) => [p.id, p]));

    const posicaoIds = [
      ...new Set(
        grouped
          .map((g) => g.idPosicaoEstoque)
          .filter((id): id is number => id !== null),
      ),
    ];
    const posicoes = await this.prisma.posicaoEstoque.findMany({
      where: { id: { in: posicaoIds } },
      select: { id: true, nome: true },
    });
    const posicaoMap = new Map(posicoes.map((p) => [p.id, p]));

    // ── Build result rows ─────────────────────────────────
    let rows = grouped
      .map((g) => {
        const produto = produtoMap.get(g.idProduto);
        const posicao = g.idPosicaoEstoque
          ? posicaoMap.get(g.idPosicaoEstoque)
          : null;
        return {
          idProduto: g.idProduto,
          codigoProduto: produto?.codigo ?? '',
          nomeProduto: produto?.nome ?? '',
          idPosicaoEstoque: g.idPosicaoEstoque,
          nomePosicaoEstoque: posicao?.nome ?? null,
          quantidade: g._count.id,
        };
      })
      .sort((a, b) => a.codigoProduto.localeCompare(b.codigoProduto));

    // ── Apply DataTables ordering ─────────────────────────
    applyDatatablesOrder(rows, data);

    // ── Apply global search ───────────────────────────────
    const searchTerm = data.search?.value?.trim()?.toUpperCase();
    if (searchTerm) {
      rows = rows.filter(
        (r) =>
          r.codigoProduto.toUpperCase().includes(searchTerm) ||
          r.nomeProduto.toUpperCase().includes(searchTerm) ||
          r.nomePosicaoEstoque?.toUpperCase().includes(searchTerm),
      );
    }

    const recordsTotal = grouped.length;
    const recordsFiltered = rows.length;

    // ── Paginate (length === -1 → sem paginação) ──────────
    const paginated =
      Number(length) === -1
        ? rows
        : rows.slice(Number(start), Number(start) + Number(length));

    // ── Fetch tags for paginated rows ─────────────────────
    const paginatedWithTags = await Promise.all(
      paginated.map(async (row) => {
        const tags = await this.prisma.tagRfid.findMany({
          where: {
            ...where,
            idProduto: row.idProduto,
            idPosicaoEstoque: row.idPosicaoEstoque,
          },
          select: { codigoRfid: true },
        });
        return {
          ...row,
          tags: tags.map((t) => t.codigoRfid),
        };
      }),
    );

    return {
      draw: draw || 1,
      recordsTotal,
      recordsFiltered,
      data: sanitizeDatatablesRecords(paginatedWithTags),
    };
  }

  // ════════════════════════════════════════════════════════════
  // Extrato de Movimentação
  // ════════════════════════════════════════════════════════════

  async extratoMovimentacao(
    data: DatatablesRequestDto,
    userId: number,
    regra: string,
  ) {
    const { draw, filters = [] } = data;

    // ── Extract required filters ──────────────────────────
    const dataInicioFilter = filters.find((f) => f.field === 'dataInicio');
    const dataFimFilter = filters.find((f) => f.field === 'dataFim');
    const idProdutoFilter = filters.find((f) => f.field === 'idProduto');
    const idFilialFilter = filters.find((f) => f.field === 'idFilial');
    const idPosicaoEstoqueFilter = filters.find(
      (f) => f.field === 'idPosicaoEstoque',
    );

    if (!dataInicioFilter?.value) {
      throw new BadRequestException('Filtro "dataInicio" é obrigatório.');
    }
    if (!dataFimFilter?.value) {
      throw new BadRequestException('Filtro "dataFim" é obrigatório.');
    }
    if (!idProdutoFilter?.value) {
      throw new BadRequestException('Filtro "idProduto" é obrigatório.');
    }
    if (!idFilialFilter?.value) {
      throw new BadRequestException('Filtro "idFilial" é obrigatório.');
    }

    // ── Parse dates ──────────────────────────────────────
    const parseDate = (
      val: string | number | boolean | string[] | number[],
    ) => {
      const [y, m, d] = String(val).split('-').map(Number);
      if (!y || !m || !d) return null;
      return { year: y, month: m, day: d };
    };

    const inicio = parseDate(dataInicioFilter.value);
    const fim = parseDate(dataFimFilter.value);
    if (!inicio) throw new BadRequestException('Data início inválida.');
    if (!fim) throw new BadRequestException('Data fim inválida.');

    const startOfInicio = new Date(
      Date.UTC(inicio.year, inicio.month - 1, inicio.day, 0, 0, 0, 0),
    );
    const startOfNextDayFim = new Date(
      Date.UTC(fim.year, fim.month - 1, fim.day + 1, 0, 0, 0, 0),
    );

    const idProduto = Number(idProdutoFilter.value);
    const idFilial = Number(idFilialFilter.value);
    await this.tenant.ensureFilialAccess(idFilial, userId, regra);

    // ── Build where clause for saldoInicial ──────────────
    const whereSaldo: any = {
      idFilial,
      idProduto,
      createdAt: { lt: startOfInicio },
      OR: [{ dataBaixa: null }, { dataBaixa: { gte: startOfInicio } }],
    };

    if (idPosicaoEstoqueFilter?.value) {
      if (Array.isArray(idPosicaoEstoqueFilter.value)) {
        whereSaldo.idPosicaoEstoque = {
          in: idPosicaoEstoqueFilter.value.map(Number),
        };
      } else {
        whereSaldo.idPosicaoEstoque = Number(idPosicaoEstoqueFilter.value);
      }
    }

    // ── Saldo Inicial ────────────────────────────────────
    const saldoInicial = await this.prisma.tagRfid.count({
      where: whereSaldo,
    });

    // ── Build where clause for movimentacoes ─────────────
    const whereMovimentacoes: any = {
      OR: [{ idFilial }, { idFilialDestino: idFilial }],
      dataProcessamento: { gte: startOfInicio, lt: startOfNextDayFim },
      situacao: 'FINALIZADO',
      itens: {
        some: { tagRfid: { idProduto } },
      },
    };

    if (idPosicaoEstoqueFilter?.value) {
      if (Array.isArray(idPosicaoEstoqueFilter.value)) {
        whereMovimentacoes.idPosicaoEstoque = {
          in: idPosicaoEstoqueFilter.value.map(Number),
        };
      } else {
        whereMovimentacoes.idPosicaoEstoque = Number(
          idPosicaoEstoqueFilter.value,
        );
      }
    }

    // ── Movimentações no período (somente com data de processamento) ──
    const movimentacoes = await this.prisma.movimentacao.findMany({
      where: whereMovimentacoes,
      include: {
        tipo: {
          select: { descricao: true, fazBaixa: true, tipo: true },
        },
        itens: {
          where: { tagRfid: { idProduto } },
          select: {
            ocorrencia: true,
            tagRfid: {
              select: {
                id: true,
                createdAt: true,
                dataBaixa: true,
                codigoRfid: true,
                idFilial: true,
                idPosicaoEstoque: true,
              },
            },
          },
        },
      },
      orderBy: { dataProcessamento: 'asc' },
    });

    // ── Contar com dedup (cada tag contabilizada no máx. 1x) ──
    const entradaCounted = new Set<number>();
    const saidaCounted = new Set<number>();

    const dayBounds = (d: Date) => {
      const s = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
      );
      const e = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1),
      );
      return { s, e };
    };

    interface ExtratoRow {
      dataMovimentacao: string;
      tipoMovimentacao: string;
      quantidadeEntrada: number;
      quantidadeSaida: number;
      saldo?: number;
      tagsEntrada?: string[];
      tagsSaida?: string[];
    }

    const rows: ExtratoRow[] = [];

    for (const mov of movimentacoes) {
      const dp = mov.dataProcessamento!;
      const { s: dayStart, e: dayEnd } = dayBounds(dp);

      const isCreationTipo =
        mov.tipo.tipo === 'IMPRESSAO' || mov.tipo.tipo === 'ASSOCIACAO';

      let entrada = 0;
      let saida = 0;
      const tagsEntrada: string[] = [];
      const tagsSaida: string[] = [];

      for (const item of mov.itens) {
        if (!item.tagRfid) continue;
        const tag = item.tagRfid;

        const isEntradaPorInclusao = item.ocorrencia === 'INCLUSAO';
        const isEntradaPorCriacao =
          isCreationTipo && tag.createdAt >= dayStart && tag.createdAt < dayEnd;

        const matchesFilial = tag.idFilial === idFilial;
        let matchesPosicao = true;
        if (idPosicaoEstoqueFilter?.value) {
          const val = idPosicaoEstoqueFilter.value;
          matchesPosicao = Array.isArray(val)
            ? val.map(Number).includes(tag.idPosicaoEstoque!)
            : Number(val) === tag.idPosicaoEstoque;
        }

        // Entrada
        if (
          (isEntradaPorInclusao || isEntradaPorCriacao) &&
          matchesFilial &&
          matchesPosicao &&
          !entradaCounted.has(tag.id)
        ) {
          entrada++;
          entradaCounted.add(tag.id);
          tagsEntrada.push(tag.codigoRfid);
        }

        // Saída
        const isSaidaTransferencia =
          mov.tipo.tipo === 'TRANSFERENCIA' && item.ocorrencia === 'LEITURA';
        const isSaidaBaixa =
          mov.tipo.fazBaixa &&
          tag.dataBaixa &&
          tag.dataBaixa >= dayStart &&
          tag.dataBaixa < dayEnd;

        if (
          (isSaidaBaixa || isSaidaTransferencia) &&
          matchesFilial &&
          matchesPosicao &&
          !saidaCounted.has(tag.id)
        ) {
          saida++;
          saidaCounted.add(tag.id);
          tagsSaida.push(tag.codigoRfid);
        }
      }

      if (entrada === 0 && saida === 0) continue;

      rows.push({
        dataMovimentacao: dp.toISOString(),
        tipoMovimentacao: mov.tipo.descricao,
        quantidadeEntrada: entrada,
        quantidadeSaida: saida,
        tagsEntrada,
        tagsSaida,
      });
    }

    // ── Fallback: entradas não cobertas por movimentações ──
    const totalEntradasExpected = await this.prisma.tagRfid.count({
      where: {
        idProduto,
        idFilial,
        createdAt: { gte: startOfInicio, lt: startOfNextDayFim },
      },
    });

    if (entradaCounted.size < totalEntradasExpected) {
      const uncounted = await this.prisma.tagRfid.findMany({
        where: {
          idProduto,
          idFilial,
          createdAt: { gte: startOfInicio, lt: startOfNextDayFim },
          id: { notIn: [...entradaCounted] },
        },
        select: { createdAt: true, codigoRfid: true },
      });

      const byDay = new Map<string, { count: number; tags: string[] }>();
      for (const t of uncounted) {
        const key = t.createdAt.toISOString().split('T')[0];
        const current = byDay.get(key) || { count: 0, tags: [] };
        current.count++;
        current.tags.push(t.codigoRfid);
        byDay.set(key, current);
      }
      for (const [day, { count, tags }] of byDay) {
        rows.push({
          dataMovimentacao: new Date(day + 'T00:00:00.000Z').toISOString(),
          tipoMovimentacao: 'Inclusão',
          quantidadeEntrada: count,
          quantidadeSaida: 0,
          tagsEntrada: tags,
          tagsSaida: [],
        });
      }
    }

    // ── Fallback: saídas não cobertas por movimentações ──
    const totalSaidasExpected = await this.prisma.tagRfid.count({
      where: {
        idProduto,
        idFilial,
        dataBaixa: { gte: startOfInicio, lt: startOfNextDayFim },
      },
    });

    if (saidaCounted.size < totalSaidasExpected) {
      const uncounted = await this.prisma.tagRfid.findMany({
        where: {
          idProduto,
          idFilial,
          dataBaixa: { gte: startOfInicio, lt: startOfNextDayFim },
          id: { notIn: [...saidaCounted] },
        },
        select: { dataBaixa: true, codigoRfid: true },
      });

      const byDay = new Map<string, { count: number; tags: string[] }>();
      for (const t of uncounted) {
        const key = t.dataBaixa!.toISOString().split('T')[0];
        const current = byDay.get(key) || { count: 0, tags: [] };
        current.count++;
        current.tags.push(t.codigoRfid);
        byDay.set(key, current);
      }
      for (const [day, { count, tags }] of byDay) {
        rows.push({
          dataMovimentacao: new Date(day + 'T00:00:00.000Z').toISOString(),
          tipoMovimentacao: 'Baixa',
          quantidadeEntrada: 0,
          quantidadeSaida: count,
          tagsEntrada: [],
          tagsSaida: tags,
        });
      }
    }

    // ── Ordenar cronologicamente ──────────────────────────
    rows.sort(
      (a, b) =>
        new Date(a.dataMovimentacao).getTime() -
        new Date(b.dataMovimentacao).getTime(),
    );

    // ── Calcular saldo acumulado ─────────────────────────
    let saldoCorrente = saldoInicial;
    const result = rows.map((row) => {
      saldoCorrente += row.quantidadeEntrada - row.quantidadeSaida;
      return { ...row, saldo: saldoCorrente };
    });

    const start = data.start || 0;
    const length = data.length || 25;
    const actualLength = length === -1 ? result.length : length;
    const paginatedRows = result.slice(start, start + actualLength);

    const saldoFinal =
      result.length > 0 ? result[result.length - 1].saldo : saldoInicial;

    return {
      draw: draw || 1,
      recordsTotal: result.length,
      recordsFiltered: result.length,
      saldoInicial,
      saldoFinal,
      data: paginatedRows,
    };
  }

  // ════════════════════════════════════════════════════════════
  // Entrada / Saída
  // ════════════════════════════════════════════════════════════

  async entradaSaida(
    data: DatatablesRequestDto,
    userId: number,
    regra: string,
  ) {
    const { draw, start = 0, length = 25, filters = [] } = data;

    // ── Extract required filters ──────────────────────────
    const tipoFilter = filters.find((f) => f.field === 'tipo');
    const tipoMovFilter = filters.find((f) => f.field === 'tipoMovimentacao');
    const produtoFilter = filters.find((f) => f.field === 'idProduto');
    const dataInicioFilter = filters.find((f) => f.field === 'dataInicio');
    const dataFimFilter = filters.find((f) => f.field === 'dataFim');
    const movimentacaoFilter = filters.find(
      (f) => f.field === 'idMovimentacao',
    );
    const idPosicaoEstoqueFilter = filters.find(
      (f) => f.field === 'idPosicaoEstoque',
    );
    const descricaoFilter = filters.find((f) => f.field === 'descricao');
    const idFilialFilter = filters.find((f) => f.field === 'idFilial');

    if (!tipoFilter?.value) {
      throw new BadRequestException('Filtro "tipo" é obrigatório.');
    }
    if (!dataInicioFilter?.value) {
      throw new BadRequestException('Filtro "dataInicio" é obrigatório.');
    }
    if (!dataFimFilter?.value) {
      throw new BadRequestException('Filtro "dataFim" é obrigatório.');
    }
    if (!idFilialFilter?.value) {
      throw new BadRequestException('Filtro "idFilial" é obrigatório.');
    }

    // ── Parse dates ──────────────────────────────────────
    const parseDate = (
      val: string | number | boolean | string[] | number[],
    ) => {
      const [y, m, d] = String(val).split('-').map(Number);
      if (!y || !m || !d) return null;
      return { year: y, month: m, day: d };
    };

    const inicio = parseDate(dataInicioFilter.value);
    const fim = parseDate(dataFimFilter.value);
    if (!inicio) throw new BadRequestException('Data início inválida.');
    if (!fim) throw new BadRequestException('Data fim inválida.');

    const startOfInicio = new Date(
      Date.UTC(inicio.year, inicio.month - 1, inicio.day, 0, 0, 0, 0),
    );
    const startOfNextDayFim = new Date(
      Date.UTC(fim.year, fim.month - 1, fim.day + 1, 0, 0, 0, 0),
    );

    const idFilial = Number(idFilialFilter.value);
    await this.tenant.ensureFilialAccess(idFilial, userId, regra);

    // ── Determine movement types ─────────────────────────
    const tipo = String(tipoFilter.value);
    const tiposEntrada: string[] = ['IMPRESSAO', 'ASSOCIACAO', 'TRANSFERENCIA'];
    const tiposSaida: string[] = ['CONFERENCIA', 'LEITURA', 'TRANSFERENCIA'];
    const tiposEnum = tipo === 'ENTRADA' ? tiposEntrada : tiposSaida;

    // ── Build where clause ───────────────────────────────
    const where: any = {
      OR: [{ idFilial }, { idFilialDestino: idFilial }],
      situacao: 'FINALIZADO',
      dataProcessamento: { gte: startOfInicio, lt: startOfNextDayFim },
      tipo: {
        tipo: { in: tiposEnum },
      },
    };

    // Optional: specific TipoOpcaoMovimentacao enum value
    if (tipoMovFilter?.value) {
      where.tipo.tipo = String(tipoMovFilter.value);
    }

    // Optional: specific movement IDs
    if (movimentacaoFilter?.value) {
      const ids = Array.isArray(movimentacaoFilter.value)
        ? movimentacaoFilter.value.map(Number)
        : [Number(movimentacaoFilter.value)];
      where.id = { in: ids };
    }

    // Optional: description loose match
    if (descricaoFilter?.value) {
      where.descricao = {
        contains: String(descricaoFilter.value),
        mode: 'insensitive',
      };
    }

    // (We apply the idPosicaoEstoque filter locally per-tag in the JS loop
    // to accurately distinguish origens from destinos on the same Transferência).

    // Optional: product filter on items
    const productIds: number[] = produtoFilter?.value
      ? Array.isArray(produtoFilter.value)
        ? (produtoFilter.value as (string | number)[]).map(Number)
        : [Number(produtoFilter.value)]
      : [];

    if (productIds.length > 0) {
      where.itens = { some: { tagRfid: { idProduto: { in: productIds } } } };
    }

    // ── Fetch movements ──────────────────────────────────
    const movimentacoes = await this.prisma.movimentacao.findMany({
      where,
      include: {
        tipo: { select: { descricao: true, tipo: true } },
        itens: {
          where:
            productIds.length > 0
              ? { tagRfid: { idProduto: { in: productIds } } }
              : undefined,
          select: {
            ocorrencia: true,
            tagRfid: {
              select: {
                idProduto: true,
                codigoRfid: true,
                idFilial: true,
                idPosicaoEstoque: true,
                produto: { select: { codigo: true, nome: true } },
              },
            },
          },
        },
      },
      orderBy: { dataProcessamento: 'asc' },
    });

    // ── Flatten: one row per movement × product ──────────
    const allRows: EntradaSaidaRow[] = [];

    for (const mov of movimentacoes) {
      const productCounts = new Map<
        number,
        { codigo: string; nome: string; count: number; tags: string[] }
      >();

      for (const item of mov.itens) {
        if (!item.tagRfid) continue;
        const tag = item.tagRfid;

        // Filter based on filial
        if (tag.idFilial !== idFilial) continue;

        // Filter based on posicao estoque
        let matchesPosicao = true;
        if (idPosicaoEstoqueFilter?.value) {
          const val = idPosicaoEstoqueFilter.value;
          matchesPosicao = Array.isArray(val)
            ? val.map(Number).includes(tag.idPosicaoEstoque!)
            : Number(val) === tag.idPosicaoEstoque;
        }
        if (!matchesPosicao) continue;

        // Determine if tag belongs to the requested direction
        const isEntrada = tipo === 'ENTRADA';
        const includeTag =
          mov.tipo.tipo === 'TRANSFERENCIA'
            ? isEntrada
              ? item.ocorrencia === 'INCLUSAO'
              : item.ocorrencia === 'LEITURA'
            : true;

        if (!includeTag) continue;

        const pId = tag.idProduto;
        if (!productCounts.has(pId)) {
          productCounts.set(pId, {
            codigo: tag.produto.codigo,
            nome: tag.produto.nome,
            count: 0,
            tags: [],
          });
        }
        const pc = productCounts.get(pId)!;
        pc.count++;
        pc.tags.push(tag.codigoRfid);
      }

      for (const [, prod] of productCounts) {
        allRows.push({
          data: mov.dataProcessamento!.toISOString(),
          codigo: mov.id,
          descricao: mov.descricao,
          tipoMovimentacao: mov.tipo.descricao,
          codigoProduto: prod.codigo,
          nomeProduto: prod.nome,
          quantidade: prod.count,
          tags: prod.tags,
        });
      }
    }

    applyDatatablesOrder(allRows, data);

    // ── Paginate ──────────────────────────────────────────
    const recordsTotal = allRows.length;
    const actualLength = length === -1 ? allRows.length : length;
    const paginatedRows = allRows.slice(start, start + actualLength);

    return {
      draw: draw || 1,
      recordsTotal,
      recordsFiltered: recordsTotal,
      data: paginatedRows,
    };
  }
}
