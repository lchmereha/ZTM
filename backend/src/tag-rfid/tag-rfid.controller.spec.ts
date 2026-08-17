import { Test, TestingModule } from '@nestjs/testing';
import { TagRfidController } from './tag-rfid.controller';
import { TagRfidService } from './tag-rfid.service';

describe('TagRfidController', () => {
  let controller: TagRfidController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagRfidController],
      providers: [{ provide: TagRfidService, useValue: {} }],
    }).compile();

    controller = module.get<TagRfidController>(TagRfidController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
