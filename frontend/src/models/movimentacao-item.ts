import type { OcorrenciaItem } from './enums';
import type { Movimentacao } from './movimentacao';
import type { TagRfid } from './tag-rfid';

export interface MovimentacaoItem {
  id: number;
  idMovimentacao: number;
  idTagRfid?: number | null;
  codigoRfid?: string | null;
  ocorrencia: OcorrenciaItem;
  movimentacao?: Movimentacao;
  tagRfid?: TagRfid | null;
}
