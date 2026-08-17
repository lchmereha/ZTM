import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class BaixaLeituraDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  codigosRfid: string[];
}
