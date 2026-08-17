import type { Empresa } from 'models';

export type CreateEmpresaDto = Omit<Empresa, 'id'>;
export type UpdateEmpresaDto = Partial<CreateEmpresaDto>;
