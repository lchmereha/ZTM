import type { Empresa } from './empresa';

export interface ModeloEtiqueta {
  id: number;
  idEmpresa: number;
  nome: string;
  codigoZPL: string;
  ativo: boolean;
  empresa?: Empresa;
}
