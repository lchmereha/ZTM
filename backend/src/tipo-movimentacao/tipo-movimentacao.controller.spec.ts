import { Test, TestingModule } from '@nestjs/testing';
import { TipoMovimentacaoController } from './tipo-movimentacao.controller';
import { TipoMovimentacaoService } from './tipo-movimentacao.service';

describe('TipoMovimentacaoController', () => {
  let controller: TipoMovimentacaoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TipoMovimentacaoController],
      providers: [{ provide: TipoMovimentacaoService, useValue: {} }],
    }).compile();

    controller = module.get<TipoMovimentacaoController>(
      TipoMovimentacaoController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
