import type { Equipamento } from 'models';

export interface CreateEquipamentoDto extends Omit<Equipamento, 'id' | 'ativo' | 'exibeConexaoSocket' | 'filial'> {
  ativo?: boolean;
  exibeConexaoSocket?: boolean;
}
export type UpdateEquipamentoDto = Partial<CreateEquipamentoDto>;
