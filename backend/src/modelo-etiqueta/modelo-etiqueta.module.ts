import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ModeloEtiquetaController } from './modelo-etiqueta.controller';
import { ModeloEtiquetaService } from './modelo-etiqueta.service';

@Module({
  imports: [PrismaModule],
  controllers: [ModeloEtiquetaController],
  providers: [ModeloEtiquetaService],
  exports: [ModeloEtiquetaService],
})
export class ModeloEtiquetaModule {}
