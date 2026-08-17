export type TipoLogin = 'usuario' | 'email';

export interface LoginDto {
  usuario: string;
  senha: string;
  tipoLogin?: TipoLogin;
  rememberMe?: boolean;
}
