import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateProdutoDto {
  @IsInt()
  idEmpresa: number;

  @IsString()
  codigo: string;

  @IsString()
  nome: string;

  @IsString()
  unidadeMedida: string;

  @IsOptional()
  @IsInt()
  idCategoria?: number;

  @IsOptional()
  @IsInt()
  idModeloEtiqueta?: number;
}
