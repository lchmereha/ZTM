import type { SituacaoMovimentacao } from './enums';
import type { Equipamento } from './equipamento';
import type { Filial } from './filial';
import type { TipoMovimentacao } from './tipo-movimentacao';
import type { Usuario } from './usuario';

export interface Movimentacao {
  id: number;
  idFilial: number;
  idUsuario: number;
  idTipoMovimentacao: number;
  idEquipamento?: number | null;
  descricao?: string | null;
  codigoIntegracao?: string | null;
  situacao: SituacaoMovimentacao;
  dataProcessamento?: string | null;
  filial?: Filial;
  usuario?: Usuario;
  tipo?: TipoMovimentacao;
  equipamento?: Equipamento | null;
  idFilialDestino?: number | null;
  filialDestino?: Filial | null;
}
