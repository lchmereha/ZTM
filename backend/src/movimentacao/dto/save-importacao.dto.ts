import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ImportacaoItemDto {
  @IsString()
  codigo: string;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  unidadeMedida?: string;

  @IsInt()
  quantidade: number;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  codigoUnico?: string;

  @IsOptional()
  @IsString()
  dataValidade?: string;

  @IsOptional()
  @IsString()
  lote?: string;

  @IsOptional()
  @IsString()
  dataFabricacao?: string;

  @IsOptional()
  @IsNumber()
  qtdeUMVolume?: number;

  @IsOptional()
  @IsString()
  posicaoEstoque?: string;
}

export class SaveImportacaoDto {
  @IsInt()
  idMovimentacao: number;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportacaoItemDto)
  items: ImportacaoItemDto[];
}
