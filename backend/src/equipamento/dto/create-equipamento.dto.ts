import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TipoEquipamento } from '../../generated/prisma/client';

export class CreateEquipamentoDto {
  @IsNumber()
  idFilial: number;

  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  ipConexao?: string;

  @IsOptional()
  @IsNumber()
  portaConexao?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsEnum(TipoEquipamento)
  tipo: TipoEquipamento;
  @IsOptional()
  @IsBoolean()
  exibeConexaoSocket?: boolean;
}
