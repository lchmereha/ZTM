import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from '../common/services/tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { FilialService } from './filial.service';

describe('FilialService', () => {
  let service: FilialService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilialService,
        { provide: PrismaService, useValue: {} },
        { provide: TenantService, useValue: {} },
      ],
    }).compile();

    service = module.get<FilialService>(FilialService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
