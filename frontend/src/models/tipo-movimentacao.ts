import type { Empresa } from './empresa';
import type { TipoOpcaoMovimentacao } from './enums';

export interface TipoMovimentacao {
  id: number;
  idEmpresa: number;
  descricao: string;
  ativo: boolean;
  fazBaixa: boolean;
  tipo: TipoOpcaoMovimentacao;
  empresa?: Empresa;
}
