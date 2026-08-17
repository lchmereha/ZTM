import { IsInt, IsBoolean } from 'class-validator';

export class CreatePermissaoDto {
  @IsInt()
  idUsuario: number;

  @IsInt()
  idOpcaoMenu: number;

  @IsBoolean()
  podeVisualizar: boolean;

  @IsBoolean()
  podeIncluir: boolean;

  @IsBoolean()
  podeAlterar: boolean;

  @IsBoolean()
  podeExcluir: boolean;
}
