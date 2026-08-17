import type { Produto } from 'models';

export type CreateProdutoDto = Omit<Produto, 'id' | 'categoria' | 'modeloEtiqueta'>;
export type UpdateProdutoDto = Partial<CreateProdutoDto>;
