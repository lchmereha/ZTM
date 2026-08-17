import type { Filial } from 'models';

export type CreateFilialDto = Omit<Filial, 'id' | 'empresa' | 'etiquetaPadrao'>;
export type UpdateFilialDto = Partial<CreateFilialDto>;
