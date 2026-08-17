import type { TagRfid } from 'models';

export type CreateTagRfidDto = Omit<TagRfid, 'id' | 'filial' | 'produto'>;
export type UpdateTagRfidDto = Partial<CreateTagRfidDto>;

export interface CreateTagRfidBatchDto {
  tags: string[];
  idFilial: number;
  idProduto?: number;
  idModeloEtiqueta?: number;
}

export interface ClearTagRfidSessionDto {
  idFilial: number;
}
