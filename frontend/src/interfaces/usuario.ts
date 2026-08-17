import type { Usuario } from 'models';

export interface PermissoesUsuario {
  visualizar: number[];
  incluir: number[];
  alterar: number[];
  excluir: number[];
}

export interface CreateUsuarioDto extends Omit<Usuario, 'id' | 'ativo'> {
  ativo?: boolean;
  idFiliais?: number[];
  permissoes?: PermissoesUsuario;
}
export type UpdateUsuarioDto = Partial<CreateUsuarioDto>;
