import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  usuario!: string;

  @IsString()
  @IsNotEmpty()
  senha!: string;
  @IsOptional()
  @IsIn(['USUARIO', 'EMAIL'])
  tipoLogin?: string;
  @IsOptional()
  rememberMe?: boolean;
}
