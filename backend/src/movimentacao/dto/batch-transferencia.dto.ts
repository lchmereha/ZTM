import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

class TransferenciaVinculacaoDto {
  @IsNumber()
  idProduto: number;

  @IsNumber()
  idTagRfid: number;

  @IsString()
  codigoRfidLido: string;
}

export class BatchTransferenciaDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TransferenciaVinculacaoDto)
  vinculacoes: TransferenciaVinculacaoDto[];
}
