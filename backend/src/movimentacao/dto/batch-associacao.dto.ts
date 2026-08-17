import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

class AssociacaoTagDto {
  @IsNumber()
  idProduto: number;

  @IsString()
  codigoRfid: string;
}

export class BatchAssociacaoDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AssociacaoTagDto)
  tags: AssociacaoTagDto[];
}
