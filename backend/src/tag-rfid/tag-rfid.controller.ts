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
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';

import { RolesGuard } from '../auth/guards/roles.guard';
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { UsuarioRole } from '../generated/prisma/client';
import {
  ClearTagRfidSessionDto,
  CreateTagRfidBatchDto,
} from './dto/create-batch-rfid.dto';
import { CreateTagRfidDto } from './dto/create-tag-rfid.dto';
import { UpdateTagRfidDto } from './dto/update-tag-rfid.dto';
import { TagRfidService } from './tag-rfid.service';

@Controller('tag-rfid')
@UseGuards(RolesGuard)
export class TagRfidController {
  constructor(private readonly tagRfidService: TagRfidService) {}

  @Post()
  create(
    @Body() createTagRfidDto: CreateTagRfidDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tagRfidService.create(
      createTagRfidDto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Post('batch')
  createBatch(
    @Body() dto: CreateTagRfidBatchDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tagRfidService.createBatch(dto, req.user.sub, req.user.regra);
  }

  @Post('session/clear')
  @Roles(UsuarioRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  clearSession(
    @Body() dto: ClearTagRfidSessionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tagRfidService.clearByFilial(
      dto.idFilial,
      req.user.sub,
      req.user.regra,
    );
  }

  @Post('datatables')
  datatables(
    @Body() body: DatatablesRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tagRfidService.datatables(body, req.user.sub, req.user.regra);
  }

  @Get('produto/:idProduto/ativas')
  findAtivasByProduto(
    @Param('idProduto', ParseIntPipe) idProduto: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tagRfidService.findAtivasByProdutoId(
      idProduto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Post('produto/ativas-batch')
  @HttpCode(HttpStatus.OK)
  findAtivasBatch(
    @Body() dto: { codigos: string[]; idFilial?: number },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tagRfidService.findAtivasBatchByCodigos(
      dto.codigos,
      req.user.sub,
      req.user.regra,
      dto.idFilial,
    );
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.tagRfidService.findAll(req.user.sub, req.user.regra);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tagRfidService.findOne(id, req.user.sub, req.user.regra);
  }

  @Get('epc/:epc')
  findByEpc(@Param('epc') epc: string, @Req() req: AuthenticatedRequest) {
    return this.tagRfidService.findByEpc(epc, req.user.sub, req.user.regra);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTagRfidDto: UpdateTagRfidDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tagRfidService.update(
      id,
      updateTagRfidDto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tagRfidService.remove(id, req.user.sub, req.user.regra);
  }
}
