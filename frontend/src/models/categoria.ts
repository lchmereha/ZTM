import type { Empresa } from './empresa';

export interface Categoria {
  id: number;
  idEmpresa: number;
  nome: string;
  ativo: boolean;
  empresa?: Empresa;
}
