import type { OpcaoMenu } from './opcao-menu';
import type { Usuario } from './usuario';

export interface PermissaoUsuario {
  idUsuario: number;
  idOpcaoMenu: number;
  podeVisualizar: boolean;
  podeIncluir: boolean;
  podeAlterar: boolean;
  podeExcluir: boolean;
  usuario?: Usuario;
  opcaoMenu?: OpcaoMenu;
}
