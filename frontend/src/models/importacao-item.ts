export interface ImportacaoItem {
  id: number;
  idMovimentacao: number;
  codigo: string;
  nome?: string | null;
  unidadeMedida?: string | null;
  quantidade: number;
  qtdeUMVolume?: number | null;
  categoria?: string | null;
  codigoUnico?: string | null;
  posicaoEstoque?: string | null;
  dataValidade?: string | null;
  lote?: string | null;
  dataFabricacao?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
