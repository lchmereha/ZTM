import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

class ConferenciaVinculacaoDto {
  @IsNumber()
  idProduto: number;

  @IsNumber()
  idTagRfid: number;

  @IsString()
  codigoRfidLido: string;
}

export class BatchConferenciaDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ConferenciaVinculacaoDto)
  vinculacoes: ConferenciaVinculacaoDto[];
}
