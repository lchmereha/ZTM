import { IsInt, IsString, Matches } from 'class-validator';
import { IsValidKeyLength } from '../validators/is-valid-key-length.validator';

export class CreateApiKeyDto {
  @IsInt()
  idFilial: number;

  @IsInt()
  idUsuario: number;

  @IsString()
  @Matches(/^[a-fA-F0-9]+$/, {
    message: 'A chave deve conter apenas caracteres hexadecimais',
  })
  @IsValidKeyLength()
  chave: string;
}
