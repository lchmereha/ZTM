import type { UsuarioRole } from './enums';

export interface Usuario {
  id: number;
  nome?: string | null;
  usuario: string;
  email?: string | null;
  senha: string;
  regra: UsuarioRole;
  ativo: boolean;
}
