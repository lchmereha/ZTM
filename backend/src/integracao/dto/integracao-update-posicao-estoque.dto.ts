import { PartialType } from '@nestjs/swagger';
import { IntegracaoCreatePosicaoEstoqueDto } from './integracao-create-posicao-estoque.dto';

export class IntegracaoUpdatePosicaoEstoqueDto extends PartialType(
  IntegracaoCreatePosicaoEstoqueDto,
) {}
