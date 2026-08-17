import { Module } from '@nestjs/common';
import { CategoriaModule } from '../categoria/categoria.module';
import { ModeloEtiquetaModule } from '../modelo-etiqueta/modelo-etiqueta.module';
import { MovimentacaoModule } from '../movimentacao/movimentacao.module';
import { ProdutoModule } from '../produto/produto.module';
import { IntegracaoController } from './integracao.controller';
import { IntegracaoService } from './integracao.service';

@Module({
  imports: [
    ProdutoModule,
    CategoriaModule,
    ModeloEtiquetaModule,
    MovimentacaoModule,
  ],
  controllers: [IntegracaoController],
  providers: [IntegracaoService],
})
export class IntegracaoModule {}
