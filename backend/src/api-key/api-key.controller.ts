import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import { UsuarioRole } from '../generated/prisma/client';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';

@Controller('api-key')
@UseGuards(RolesGuard)
@Roles(UsuarioRole.ADMIN)
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  create(@Body() createApiKeyDto: CreateApiKeyDto) {
    return this.apiKeyService.create(createApiKeyDto);
  }

  @Post('datatables')
  @HttpCode(HttpStatus.OK)
  datatables(@Body() datatablesRequest: DatatablesRequestDto) {
    return this.apiKeyService.datatables(datatablesRequest);
  }

  @Get()
  findAll() {
    return this.apiKeyService.findAll();
  }

  @Get('generate-key')
  generateKey() {
    return { chave: this.apiKeyService.generateKey() };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.apiKeyService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateApiKeyDto: UpdateApiKeyDto,
  ) {
    return this.apiKeyService.update(id, updateApiKeyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.apiKeyService.remove(id);
  }
}
