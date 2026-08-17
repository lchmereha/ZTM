import type { ModeloEtiqueta } from 'models';

export interface CreateModeloEtiquetaDto extends Omit<ModeloEtiqueta, 'id' | 'ativo' | 'empresa'> {
  ativo?: boolean;
}
export type UpdateModeloEtiquetaDto = Partial<CreateModeloEtiquetaDto>;
