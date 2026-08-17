import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCategoriaDto {
  @IsInt()
  idEmpresa: number;

  @IsString()
  nome: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
