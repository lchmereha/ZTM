// ── Combo / select options (shared across reports) ──────────

/** Option shape for the Produto combo (GET /produto/combo) */
export interface ProdutoComboOption {
  id: number;
  codigo: string;
  nome: string;
}

/** Option shape for the Movimentacao combo (GET /movimentacao) */
export interface MovimentacaoComboOption {
  id: number;
  descricao: string | null;
  codigoIntegracao: string | null;
}

// ── Posição de Estoque ──────────────────────────────────────

/** Row returned by POST /relatorio/posicao-estoque/datatables */
export interface PosicaoEstoqueRow {
  codigoProduto: string;
  nomeProduto: string;
  idPosicaoEstoque: number | null;
  nomePosicaoEstoque: string | null;
  quantidade: number;
  tags?: string[];
}

// ── Extrato de Movimentação ─────────────────────────────────

/** Row returned by POST /relatorio/extrato-movimentacao/datatables */
export interface ExtratoMovimentacaoRow {
  dataMovimentacao: string;
  tipoMovimentacao: string;
  quantidadeEntrada: number;
  quantidadeSaida: number;
  saldo: number;
  tagsEntrada?: string[];
  tagsSaida?: string[];
}

/** Full response from POST /relatorio/extrato-movimentacao/datatables */
export interface ExtratoMovimentacaoResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  saldoInicial: number;
  saldoFinal: number;
  data: ExtratoMovimentacaoRow[];
}

// ── Entrada / Saída ─────────────────────────────────────────

/** Row returned by POST /relatorio/entrada-saida/datatables */
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
