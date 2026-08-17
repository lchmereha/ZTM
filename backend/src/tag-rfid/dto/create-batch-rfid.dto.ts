import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTagRfidBatchDto {
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsNumber()
  idFilial: number;

  @IsOptional()
  @IsNumber()
  idProduto?: number;
  @IsOptional()
  @IsNumber()
  idModeloEtiqueta?: number;
}

export class ClearTagRfidSessionDto {
  @IsNumber()
  idFilial: number;
}
