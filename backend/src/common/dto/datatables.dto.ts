import { Type } from 'class-transformer';
import {
  Allow,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class DatatablesFilter {
  @IsString()
  field: string;

  @Allow()
  type?: string | number;

  @Allow()
  value: string | number | boolean | string[] | number[];
}

export class DatatablesColumnSearch {
  @IsString()
  @IsOptional()
  value?: string;

  @IsOptional()
  regex?: boolean;

  @IsOptional()
  @IsArray()
  fixed?: string[];
}

export class DatatablesColumn {
  @Allow()
  @IsOptional()
  data?: string | null;

  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  searchable?: boolean;

  @IsOptional()
  orderable?: boolean;

  @ValidateNested()
  @Type(() => DatatablesColumnSearch)
  @IsOptional()
  search?: DatatablesColumnSearch;
}

export class DatatablesOrder {
  @IsNumber()
  column: number;

  @IsString()
  dir: 'asc' | 'desc';

  @IsString()
  @IsOptional()
  name?: string;
}

export class DatatablesSearch {
  @IsString()
  @IsOptional()
  value?: string;

  @IsOptional()
  regex?: boolean;

  @IsOptional()
  @IsArray()
  fixed?: string[];
}

export class DatatablesRequestDto {
  @IsNumber()
  @IsOptional()
  draw?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  start?: number;

  @IsNumber()
  @IsOptional()
  @Min(-1)
  @Max(100)
  length?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DatatablesFilter)
  @IsOptional()
  filters?: DatatablesFilter[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DatatablesColumn)
  @IsOptional()
  columns?: DatatablesColumn[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DatatablesOrder)
  @IsOptional()
  order?: DatatablesOrder[];

  @ValidateNested()
  @Type(() => DatatablesSearch)
  @IsOptional()
  search?: DatatablesSearch;
}

export class DatatablesResponse<T> {
  draw: number;

  recordsTotal: number;

  recordsFiltered: number;

  data: T[];
}
