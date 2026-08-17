import { PartialType } from '@nestjs/swagger';
import { CreatePosicaoEstoqueDto } from './create-posicao-estoque.dto';

export class UpdatePosicaoEstoqueDto extends PartialType(
  CreatePosicaoEstoqueDto,
) {}
