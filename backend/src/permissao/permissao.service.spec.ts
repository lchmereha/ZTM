import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PermissaoService } from './permissao.service';

describe('PermissaoService', () => {
  let service: PermissaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissaoService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<PermissaoService>(PermissaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
