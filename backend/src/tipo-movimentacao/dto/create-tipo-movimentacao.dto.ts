import { IsBoolean, IsEnum, IsInt, IsString } from 'class-validator';
import { TipoOpcaoMovimentacao } from '../../generated/prisma/client';

export class CreateTipoMovimentacaoDto {
  @IsInt()
  idEmpresa: number;

  @IsString()
  descricao: string;
  @IsEnum(TipoOpcaoMovimentacao)
  tipo: TipoOpcaoMovimentacao;

  @IsBoolean()
  ativo?: boolean;
  @IsBoolean()
  fazBaixa?: boolean;
}
