import type { Filial } from './filial';
import type { Produto } from './produto';
import type { PosicaoEstoque } from './posicao-estoque';

export interface TagRfid {
  id: number;
  idFilial: number;
  idProduto: number;
  codigoRfid: string;
  codigoUnico?: string | null;
  idPosicaoEstoque?: number | null;
  dataValidade?: string | null;
  lote?: string | null;
  dataFabricacao?: string | null;
  dataBaixa?: string | null;
  qtdeUMVolume?: number | null;
  filial?: Filial;
  produto?: Produto;
  posicaoEstoque?: PosicaoEstoque;
}
