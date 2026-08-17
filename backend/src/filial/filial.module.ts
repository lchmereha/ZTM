import { Module } from '@nestjs/common';
import { CepController } from './cep.controller';
import { FilialService } from './filial.service';
import { FilialController } from './filial.controller';

@Module({
  controllers: [FilialController, CepController],
  providers: [FilialService],
})
export class FilialModule {}
