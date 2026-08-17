import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTagRfidDto {
  @IsInt()
  idFilial: number;

  @IsInt()
  idProduto: number;

  @IsString()
  codigoRfid: string;

  @IsOptional()
  @IsString()
  codigoUnico?: string;

  @IsOptional()
  @IsInt()
  idPosicaoEstoque?: number;

  @IsOptional()
  @IsDateString()
  dataValidade?: string;

  @IsOptional()
  @IsString()
  lote?: string;

  @IsOptional()
  @IsDateString()
  dataFabricacao?: string;

  @IsOptional()
  @IsDateString()
  dataBaixa?: string;

  @IsOptional()
  @IsNumber()
  qtdeUMVolume?: number;
}
