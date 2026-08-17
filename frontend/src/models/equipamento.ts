import type { TipoEquipamento } from './enums';
import type { Filial } from './filial';

export interface Equipamento {
  id: number;
  idFilial: number;
  nome: string;
  ipConexao?: string | null;
  portaConexao?: number | null;
  ativo: boolean;
  tipo: TipoEquipamento;
  exibeConexaoSocket: boolean;
  filial?: Filial;
}
