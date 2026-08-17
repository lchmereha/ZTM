import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

class TransferenciaVinculacaoDto {
  @IsNumber()
  idProduto: number;

  @IsNumber()
  idTagRfid: number;

  @IsString()
  codigoRfidLido: string;
}

export class ConcluirTransferenciaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferenciaVinculacaoDto)
  vinculacoes: TransferenciaVinculacaoDto[];
}
