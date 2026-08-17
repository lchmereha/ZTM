import { PartialType } from '@nestjs/swagger';
import { CreateTagRfidDto } from './create-tag-rfid.dto';

export class UpdateTagRfidDto extends PartialType(CreateTagRfidDto) {}
