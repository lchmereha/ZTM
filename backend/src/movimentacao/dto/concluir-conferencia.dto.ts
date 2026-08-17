import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

class ConferenciaVinculacaoDto {
  @IsNumber()
  idProduto: number;

  @IsNumber()
  idTagRfid: number;

  @IsString()
  codigoRfidLido: string;
}

export class ConcluirConferenciaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConferenciaVinculacaoDto)
  vinculacoes: ConferenciaVinculacaoDto[];
}
