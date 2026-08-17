import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from '../common/services/tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { TipoMovimentacaoService } from './tipo-movimentacao.service';

describe('TipoMovimentacaoService', () => {
  let service: TipoMovimentacaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TipoMovimentacaoService,
        { provide: PrismaService, useValue: {} },
        { provide: TenantService, useValue: {} },
      ],
    }).compile();

    service = module.get<TipoMovimentacaoService>(TipoMovimentacaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
