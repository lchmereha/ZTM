import type { Filial } from './filial';

export interface PosicaoEstoque {
  id: number;
  idFilial: number;
  nome: string;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
  filial?: Filial;
}
