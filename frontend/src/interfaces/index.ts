export * from './api-key';
export * from './auth';
export * from './categoria';
export type { DashboardResumoResponse, MovimentacaoPorMes, TopProduto, UltimaMovimentacao } from './dashboard';
export * from './empresa';
export * from './equipamento';
export * from './filial';
export * from './modelo-etiqueta';
export * from './movimentacao';
export * from './produto';
export * from './relatorio';
export * from './tag-rfid';
export * from './tipo-movimentacao';
export * from './usuario';

export interface PosicaoEstoqueComboOption {
  id: number;
  nome: string;
}
