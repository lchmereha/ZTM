import type { Filial } from './filial';
import type { Usuario } from './usuario';

export interface UsuarioFilial {
  idUsuario: number;
  idFilial: number;
  usuario?: Usuario;
  filial?: Filial;
}
