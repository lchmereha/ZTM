import { IsBoolean, IsOptional } from 'class-validator';

export class ImprimirTagsDto {
  @IsOptional()
  @IsBoolean()
  clientSide?: boolean;
}
