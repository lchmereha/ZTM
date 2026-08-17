import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TipoMovimentacaoController } from './tipo-movimentacao.controller';
import { TipoMovimentacaoService } from './tipo-movimentacao.service';

@Module({
  imports: [PrismaModule],
  controllers: [TipoMovimentacaoController],
  providers: [TipoMovimentacaoService],
  exports: [TipoMovimentacaoService],
})
export class TipoMovimentacaoModule {}
