export interface DashboardResumoResponse {
  movimentacoesHoje: number;
  movimentacoesPendentes: number;
  movimentacoesPorMes: MovimentacaoPorMes[];
  topProdutos: TopProduto[];
  totalProdutosComEstoque: number;
  totalTagsAtivas: number;
  ultimasMovimentacoes: UltimaMovimentacao[];
}

export interface MovimentacaoPorMes {
  associacao: number;
  conferencia: number;
  impressao: number;
  leitura: number;
  mes: string; // 'YYYY-MM' format
  transferencia: number;
}

export interface TopProduto {
  codigoProduto: string;
  nomeProduto: string;
  quantidade: number;
}

export interface UltimaMovimentacao {
  createdAt: string;
  dataProcessamento: string | null;
  descricao: string | null;
  id: number;
  situacao: string;
  tipoMovimentacao: string;
  tipoOpcao: string;
}
