import { IsOptional, IsString } from 'class-validator';

export class CreateEmpresaDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  corEsquema?: string;
}
