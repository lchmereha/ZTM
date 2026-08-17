import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class IntegracaoImportacaoItemDto {
  @ApiProperty({ description: 'Código do produto', example: 'PROD-100' })
  @IsString()
  codigo: string;

  @ApiPropertyOptional({
    description:
      'Nome do produto. Obrigatório para Impressão quando o produto não existir no sistema.',
    example: 'Notebook Dell XPS 13',
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description:
      'Unidade de medida. Obrigatória para Impressão quando o produto não existir no sistema.',
    example: 'UN',
  })
  @IsOptional()
  @IsString()
  unidadeMedida?: string;

  @ApiProperty({ description: 'Quantidade de tags/itens', example: 10 })
  @IsInt()
  quantidade: number;

  @ApiPropertyOptional({
    description:
      'Nome da categoria. Para Impressão, caso não exista, será criada automaticamente.',
    example: 'Eletrônicos',
  })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({
    description: 'Código único do item (serial individual)',
    example: 'SN-123456789',
  })
  @IsOptional()
  @IsString()
  codigoUnico?: string;

  @ApiPropertyOptional({
    description: 'Data de validade (ISO 8601)',
    example: '2027-12-31T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  dataValidade?: string;

  @ApiPropertyOptional({
    description: 'Lote de fabricação',
    example: 'LOTE-2026A',
  })
  @IsOptional()
  @IsString()
  lote?: string;

  @ApiPropertyOptional({
    description: 'Data de fabricação (ISO 8601)',
    example: '2026-01-15T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  dataFabricacao?: string;

  @ApiPropertyOptional({
    description: 'Quantidade por unidade de medida/volume',
    example: 1.5,
  })
  @IsOptional()
  @IsNumber()
  qtdeUMVolume?: number;
}

export class IntegracaoEquipamentoDto {
  @ApiPropertyOptional({
    description:
      'ID do equipamento existente. Se informado e encontrado, usa o existente.',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiPropertyOptional({
    description:
      'Nome do equipamento. Usado para criar um novo caso o ID não seja informado ou não exista.',
    example: 'Antena Coletora 1',
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description:
      'Tipo do equipamento: "I" (Impressora), "A" (Antena), "S" (Sled). Usado para criar um novo caso o ID não seja informado ou não exista.',
    example: 'A',
    enum: ['I', 'A', 'S'],
  })
  @IsOptional()
  @IsString()
  tipo?: string;

  @ApiPropertyOptional({
    description: 'IP de conexão do equipamento.',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsString()
  ipConexao?: string;

  @ApiPropertyOptional({
    description: 'Porta de conexão do equipamento.',
    example: 8080,
  })
  @IsOptional()
  @IsInt()
  portaConexao?: number;

  @ApiPropertyOptional({
    description: 'Define se exibe status da conexão de socket na UI.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  exibeConexaoSocket?: boolean;
}

export class IntegracaoCreateMovimentacaoDto {
  @ApiPropertyOptional({
    description:
      'ID do tipo de movimentação cadastrado. Se informado, tem prioridade sobre o campo "tipo". ' +
      'Pelo menos um entre "idTipoMovimentacao" e "tipo" deve ser enviado.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  idTipoMovimentacao?: number;

  @ApiPropertyOptional({
    description:
      'Atalho para o tipo de operação: "A" (Associação), "C" (Conferência), "I" (Impressão), "L" (Leitura), "T" (Transferência). ' +
      'Quando enviado sem "idTipoMovimentacao", o sistema busca ou cria automaticamente um tipo compatível. ' +
      'Pelo menos um entre "idTipoMovimentacao" e "tipo" deve ser enviado.',
    example: 'L',
    enum: ['A', 'C', 'I', 'L', 'T'],
  })
  @IsOptional()
  @IsString()
  tipo?: string;

  @ApiPropertyOptional({
    description:
      'Indica se o tipo de movimentação faz baixa no estoque. Usado apenas quando "idTipoMovimentacao" não é enviado.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  fazBaixa?: boolean;

  @ApiPropertyOptional({
    description: 'Descrição / observação da movimentação',
    example: 'Importação inicial de estoque',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({
    description: 'Código de integração com ERP externo (informativo)',
    example: 'ERP-NFE-998877',
  })
  @IsOptional()
  @IsString()
  codigoIntegracao?: string;

  @ApiPropertyOptional({
    description:
      'ID da filial de destino para Transferências. Se informado, tem prioridade sobre "filialDestino". ' +
      'Se nenhum dos dois for enviado, assume a mesma filial de origem (transferência interna).',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  idFilialDestino?: number;

  @ApiPropertyOptional({
    description:
      'Nome da filial de destino para Transferências. Usado quando "idFilialDestino" não é informado. ' +
      'O sistema busca uma filial com este nome na mesma empresa da API Key.',
    example: 'Filial São Paulo',
  })
  @IsOptional()
  @IsString()
  filialDestino?: string;

  @ApiPropertyOptional({
    description:
      'Equipamento da movimentação. Se o ID existir no banco, usa o existente. Caso contrário, cria um novo com nome, tipo, ipConexao e portaConexao fornecidos.',
    type: IntegracaoEquipamentoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => IntegracaoEquipamentoDto)
  equipamento?: IntegracaoEquipamentoDto;

  @ApiPropertyOptional({
    description:
      'Itens da movimentação. Obrigatório para Associação, Conferência e Impressão. ' +
      'Opcional para Leitura (ignorado se enviado). ' +
      'Para Impressão, produtos inexistentes serão criados automaticamente. ' +
      'Para Associação e Conferência, todos os produtos devem estar previamente cadastrados.',
    type: [IntegracaoImportacaoItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IntegracaoImportacaoItemDto)
  itens?: IntegracaoImportacaoItemDto[];
}
