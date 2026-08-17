import type { Movimentacao } from 'models';

export type CreateMovimentacaoDto = Omit<
  Movimentacao,
  'id' | 'idUsuario' | 'situacao' | 'dataProcessamento' | 'filial' | 'usuario' | 'tipo' | 'equipamento' | 'filialDestino'
>;

export type UpdateMovimentacaoDto = Partial<Omit<CreateMovimentacaoDto, 'idFilial'>>;

/** Mirrors backend CreateImportacaoItemDto */
export interface CreateImportacaoItemDto {
  codigo: string;
  quantidade: number;
  qtdeUMVolume?: number;
  nome?: string;
  unidadeMedida?: string;
  categoria?: string;
}

/** Form interface for AssociacaoItemForm — extends DTO with UI-specific fields */
export interface IAssociacaoItemForm extends CreateImportacaoItemDto {
  id?: number;
  idMovimentacao: number;
  nome: string;
  unidadeMedida: string;
  categoria: string;
}

/** Form interface for ConferenciaItemForm */
export interface IConferenciaItemForm extends CreateImportacaoItemDto {
  id?: number;
  idMovimentacao: number;
  nome: string;
  unidadeMedida: string;
  categoria: string;
  codigoUnico?: string;
}
