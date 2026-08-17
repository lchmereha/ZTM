import type { TipoMovimentacao } from 'models';

export interface CreateTipoMovimentacaoDto extends Omit<TipoMovimentacao, 'id' | 'ativo' | 'fazBaixa' | 'empresa'> {
  ativo?: boolean;
  fazBaixa?: boolean;
}
export type UpdateTipoMovimentacaoDto = Partial<Omit<CreateTipoMovimentacaoDto, 'idEmpresa'>>;
