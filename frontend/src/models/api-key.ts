import type { Filial } from './filial';

export interface ApiKey {
  id: number;
  idFilial: number;
  chave: string;
  filial?: Filial;
}
