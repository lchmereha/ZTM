import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ApiKeyModule } from './api-key/api-key.module';
import { IntegracaoModule } from './integracao/integracao.module';
import { CategoriaModule } from './categoria/categoria.module';
import { CommonModule } from './common/common.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';
import { SlidingTokenInterceptor } from './common/interceptors/sliding-token.interceptor';
import { EmpresaModule } from './empresa/empresa.module';
import { EquipamentoModule } from './equipamento/equipamento.module';
import { FilialModule } from './filial/filial.module';
import { ModeloEtiquetaModule } from './modelo-etiqueta/modelo-etiqueta.module';
import { MovimentacaoModule } from './movimentacao/movimentacao.module';
import { PermissaoModule } from './permissao/permissao.module';
import { PosicaoEstoqueModule } from './posicao-estoque/posicao-estoque.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProdutoModule } from './produto/produto.module';
import { RelatorioModule } from './relatorio/relatorio.module';
import { TagRfidModule } from './tag-rfid/tag-rfid.module';
import { TipoMovimentacaoModule } from './tipo-movimentacao/tipo-movimentacao.module';
import { UsuarioModule } from './usuario/usuario.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    DashboardModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000,
          limit: 60,
        },
      ],
    }),
    AuthModule,
    ApiKeyModule,
    IntegracaoModule,
    EmpresaModule,
    FilialModule,
    EquipamentoModule,
    ProdutoModule,
    MovimentacaoModule,
    UsuarioModule,
    CategoriaModule,
    TagRfidModule,
    PermissaoModule,
    ModeloEtiquetaModule,
    TipoMovimentacaoModule,
    RelatorioModule,
    PosicaoEstoqueModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SlidingTokenInterceptor,
    },
  ],
})
export class AppModule {}
