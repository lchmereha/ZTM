import { Module } from '@nestjs/common';
import { PosicaoEstoqueService } from './posicao-estoque.service';
import { PosicaoEstoqueController } from './posicao-estoque.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PosicaoEstoqueController],
  providers: [PosicaoEstoqueService],
})
export class PosicaoEstoqueModule {}
