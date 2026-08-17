import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from '../common/services/tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { TagRfidService } from './tag-rfid.service';

describe('TagRfidService', () => {
  let service: TagRfidService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagRfidService,
        { provide: PrismaService, useValue: {} },
        { provide: TenantService, useValue: {} },
      ],
    }).compile();

    service = module.get<TagRfidService>(TagRfidService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
