import { Module } from '@nestjs/common';
import { CategoriaModule } from '../categoria/categoria.module';
import { ProdutoModule } from '../produto/produto.module';
import { BatchAdapterController } from './batch-adapter.controller';
import { MovimentacaoController } from './movimentacao.controller';
import { MovimentacaoService } from './movimentacao.service';
import { AssociacaoService } from './services/associacao.service';
import { BatchAdapterService } from './services/batch-adapter.service';
import { ConferenciaService } from './services/conferencia.service';
import { ImportacaoService } from './services/importacao.service';
import { LeituraService } from './services/leitura.service';
import { TransferenciaService } from './services/transferencia.service';
import { TagProcessingService } from './services/tag-processing.service';
import { ZplPrintService } from './services/zpl-print.service';

@Module({
  imports: [CategoriaModule, ProdutoModule],
  controllers: [MovimentacaoController, BatchAdapterController],
  providers: [
    MovimentacaoService,
    ImportacaoService,
    TagProcessingService,
    ZplPrintService,
    LeituraService,
    AssociacaoService,
    ConferenciaService,
    TransferenciaService,
    BatchAdapterService,
  ],
  exports: [MovimentacaoService, ImportacaoService],
})
export class MovimentacaoModule {}
