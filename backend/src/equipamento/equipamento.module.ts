import { Module } from '@nestjs/common';
import { EquipamentoService } from './equipamento.service';
import { EquipamentoController } from './equipamento.controller';

@Module({
  controllers: [EquipamentoController],
  providers: [EquipamentoService],
})
export class EquipamentoModule {}
