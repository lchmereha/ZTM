import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from '../common/services/tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { ModeloEtiquetaService } from './modelo-etiqueta.service';

describe('ModeloEtiquetaService', () => {
  let service: ModeloEtiquetaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModeloEtiquetaService,
        { provide: PrismaService, useValue: {} },
        { provide: TenantService, useValue: {} },
      ],
    }).compile();

    service = module.get<ModeloEtiquetaService>(ModeloEtiquetaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
