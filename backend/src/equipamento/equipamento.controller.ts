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
  Query,
  Req,
} from '@nestjs/common';
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';
import { EquipamentoService } from './equipamento.service';

@Controller('equipamento')
export class EquipamentoController {
  constructor(private readonly equipamentoService: EquipamentoService) {}

  @Post()
  create(@Body() createEquipamentoDto: CreateEquipamentoDto) {
    return this.equipamentoService.create(createEquipamentoDto);
  }

  @Post('datatables')
  @HttpCode(HttpStatus.OK)
  datatables(
    @Body() datatablesRequest: DatatablesRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.equipamentoService.datatables(
      datatablesRequest,
      req.user.sub,
      req.user.regra,
    );
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('idFilial') idFilial?: string,
  ) {
    return this.equipamentoService.findAll(
      req.user.sub,
      req.user.regra,
      idFilial ? Number(idFilial) : undefined,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.equipamentoService.findOne(id, req.user.sub, req.user.regra);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipamentoDto: UpdateEquipamentoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.equipamentoService.update(
      id,
      updateEquipamentoDto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.equipamentoService.remove(id, req.user.sub, req.user.regra);
  }
}
