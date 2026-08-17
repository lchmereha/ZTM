import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePosicaoEstoqueDto {
  @IsInt()
  @IsNotEmpty()
  idFilial: number;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
