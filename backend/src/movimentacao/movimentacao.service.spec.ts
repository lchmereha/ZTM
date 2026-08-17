import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from '../common/services/tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { MovimentacaoService } from './movimentacao.service';
import { AssociacaoService } from './services/associacao.service';
import { ConferenciaService } from './services/conferencia.service';
import { ImportacaoService } from './services/importacao.service';
import { LeituraService } from './services/leitura.service';
import { TagProcessingService } from './services/tag-processing.service';
import { TransferenciaService } from './services/transferencia.service';
import { ZplPrintService } from './services/zpl-print.service';

describe('MovimentacaoService', () => {
  let service: MovimentacaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovimentacaoService,
        { provide: PrismaService, useValue: {} },
        { provide: TenantService, useValue: {} },
        { provide: ImportacaoService, useValue: {} },
        { provide: TagProcessingService, useValue: {} },
        { provide: ZplPrintService, useValue: {} },
        { provide: LeituraService, useValue: {} },
        { provide: AssociacaoService, useValue: {} },
        { provide: ConferenciaService, useValue: {} },
        { provide: TransferenciaService, useValue: {} },
      ],
    }).compile();

    service = module.get<MovimentacaoService>(MovimentacaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
