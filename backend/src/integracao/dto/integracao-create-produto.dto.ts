import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';

export class IntegracaoCategoriaDto {
  @ApiPropertyOptional({
    description:
      'ID da categoria existente. Se informado e encontrado, usa a existente.',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiPropertyOptional({
    description:
      'Nome da categoria. Usado para criar uma nova caso o ID não seja informado ou não exista.',
    example: 'Eletrônicos',
  })
  @IsOptional()
  @IsString()
  nome?: string;
}

export class IntegracaoEtiquetaDto {
  @ApiPropertyOptional({
    description:
      'ID do modelo de etiqueta existente. Se informado e encontrado, usa o existente.',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiPropertyOptional({
    description:
      'Nome do modelo de etiqueta. Usado para criar um novo caso o ID não seja informado ou não exista.',
    example: 'Etiqueta Padrão 50x30',
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description:
      'Código ZPL da etiqueta. Usado para criar uma nova caso o ID não seja informado ou não exista.',
    example: '^XA^FO50,50^ADN,36,20^FD{{produto.nome}}^FS^XZ',
  })
  @IsOptional()
  @IsString()
  codigoZPL?: string;
}

export class IntegracaoCreateProdutoDto {
  @ApiProperty({ description: 'Código do produto', example: 'PROD-100' })
  @IsString()
  codigo: string;

  @ApiProperty({
    description: 'Nome do produto',
    example: 'Notebook Dell XPS 13',
  })
  @IsString()
  nome: string;

  @ApiProperty({
    description: 'Unidade de medida',
    example: 'UN',
  })
  @IsString()
  unidadeMedida: string;

  @ApiPropertyOptional({
    description:
      'Categoria do produto. Se o ID existir no banco, usa a existente. Caso contrário, cria uma nova com o nome fornecido.',
    type: IntegracaoCategoriaDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => IntegracaoCategoriaDto)
  categoria?: IntegracaoCategoriaDto;

  @ApiPropertyOptional({
    description:
      'Modelo de etiqueta do produto. Se o ID existir no banco, usa o existente. Caso contrário, cria um novo com nome e codigoZPL fornecidos.',
    type: IntegracaoEtiquetaDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => IntegracaoEtiquetaDto)
  etiqueta?: IntegracaoEtiquetaDto;
}
