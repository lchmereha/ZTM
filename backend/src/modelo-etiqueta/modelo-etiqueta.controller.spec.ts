import { Test, TestingModule } from '@nestjs/testing';
import { ModeloEtiquetaController } from './modelo-etiqueta.controller';
import { ModeloEtiquetaService } from './modelo-etiqueta.service';

describe('ModeloEtiquetaController', () => {
  let controller: ModeloEtiquetaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModeloEtiquetaController],
      providers: [{ provide: ModeloEtiquetaService, useValue: {} }],
    }).compile();

    controller = module.get<ModeloEtiquetaController>(ModeloEtiquetaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
