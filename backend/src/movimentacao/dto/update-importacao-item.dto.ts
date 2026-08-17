import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateImportacaoItemDto {
  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  unidadeMedida?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantidade?: number;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  codigoUnico?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataValidade?: Date;

  @IsOptional()
  @IsString()
  lote?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataFabricacao?: Date;

  @IsOptional()
  @IsNumber()
  qtdeUMVolume?: number;
}
