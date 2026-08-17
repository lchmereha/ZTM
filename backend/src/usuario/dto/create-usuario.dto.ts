import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { UsuarioRole } from '../../generated/prisma/client';

class PermissoesDto {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  visualizar?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  incluir?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  alterar?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  excluir?: number[];
}

export class CreateUsuarioDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsString()
  usuario: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (value === '' ? null : value))
  email?: string;

  @IsString()
  senha: string;

  @IsOptional()
  @IsEnum(UsuarioRole)
  regra?: UsuarioRole;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  idFiliais?: number[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PermissoesDto)
  permissoes?: PermissoesDto;
}
