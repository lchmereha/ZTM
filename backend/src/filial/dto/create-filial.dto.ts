import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateFilialDto {
  @IsInt()
  idEmpresa: number;

  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  endereco?: string;
  @IsOptional()
  @IsString()
  documentoIdentificacao?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  cep?: string;

  @IsOptional()
  @IsString()
  numeroLogradouro?: string;

  @IsOptional()
  @IsString()
  telefone?: string;
  @IsOptional()
  @IsInt()
  idEtiquetaPadrao?: number;
}
