import { IsBoolean, IsInt, IsString } from 'class-validator';

export class CreateModeloEtiquetaDto {
  @IsInt()
  idEmpresa: number;

  @IsString()
  nome: string;

  @IsString()
  codigoZPL: string;

  @IsBoolean()
  ativo?: boolean;
}
