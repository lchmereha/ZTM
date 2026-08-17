import { Module } from '@nestjs/common';
import { TagRfidService } from './tag-rfid.service';
import { TagRfidController } from './tag-rfid.controller';

@Module({
  controllers: [TagRfidController],
  providers: [TagRfidService],
  exports: [TagRfidService],
})
export class TagRfidModule {}
