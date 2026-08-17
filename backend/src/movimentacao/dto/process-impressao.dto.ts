import { IsArray, IsInt, IsString } from 'class-validator';

export class ValidateImpressaoDto {
  @IsInt()
  idFilial: number;

  @IsInt()
  idUsuario: number;
  @IsArray()
  @IsString({ each: true })
  codigos: string[];
}
