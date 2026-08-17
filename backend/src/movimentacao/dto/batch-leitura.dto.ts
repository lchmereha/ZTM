import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class BatchLeituraDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  codigosRfid: string[];
}
