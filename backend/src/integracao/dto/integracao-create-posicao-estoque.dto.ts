import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class IntegracaoCreatePosicaoEstoqueDto {
  @ApiProperty({
    description: 'Nome da Posição de Estoque',
    example: 'Prateleira A1',
  })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    description: 'Status de ativação da posição de estoque',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
