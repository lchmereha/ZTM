import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateImportacaoItemDto {
  @IsString()
  codigo: string;

  @IsInt()
  @Min(1)
  quantidade: number;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  unidadeMedida?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsNumber()
  qtdeUMVolume?: number;

  @IsOptional()
  @IsString()
  posicaoEstoque?: string;
}
