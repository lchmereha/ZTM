import { PartialType } from '@nestjs/swagger';
import { CreateMovimentacaoDto } from './create-movimentacao.dto';

export class UpdateMovimentacaoDto extends PartialType(CreateMovimentacaoDto) {}
