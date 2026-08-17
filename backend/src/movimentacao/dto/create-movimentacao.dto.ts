import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMovimentacaoDto {
  @IsNumber()
  idFilial: number;

  // idUsuario is injected from JWT (req.user.sub) — never from client payload

  @IsNumber()
  idTipoMovimentacao: number;

  @IsOptional()
  @IsNumber()
  idEquipamento?: number;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  codigoIntegracao?: string;

  @IsOptional()
  @IsNumber()
  idFilialDestino?: number;
}
