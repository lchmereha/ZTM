import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from '../common/services/tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { MovimentacaoService } from './movimentacao.service';

describe('MovimentacaoService', () => {
  let service: MovimentacaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovimentacaoService,
        { provide: PrismaService, useValue: {} },
        { provide: TenantService, useValue: {} },
      ],
    }).compile();

    service = module.get<MovimentacaoService>(MovimentacaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
