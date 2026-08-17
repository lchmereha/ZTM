import type { Categoria } from 'models';

export interface CreateCategoriaDto extends Omit<Categoria, 'id' | 'ativo' | 'empresa'> {
  ativo?: boolean;
}
export type UpdateCategoriaDto = Partial<CreateCategoriaDto>;
