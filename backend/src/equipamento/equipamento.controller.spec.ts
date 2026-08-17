import { Test, TestingModule } from '@nestjs/testing';
import { EquipamentoController } from './equipamento.controller';
import { EquipamentoService } from './equipamento.service';

describe('EquipamentoController', () => {
  let controller: EquipamentoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipamentoController],
      providers: [{ provide: EquipamentoService, useValue: {} }],
    }).compile();

    controller = module.get<EquipamentoController>(EquipamentoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
