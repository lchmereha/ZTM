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
import { CreateTipoMovimentacaoDto } from './dto/create-tipo-movimentacao.dto';
import {
  TipoMovimentacaoService,
  UpdateTipoMovimentacaoDto,
} from './tipo-movimentacao.service';

@Controller('tipo-movimentacao')
export class TipoMovimentacaoController {
  constructor(
    private readonly tipoMovimentacaoService: TipoMovimentacaoService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateTipoMovimentacaoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tipoMovimentacaoService.create(
      dto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Post('datatables')
  @HttpCode(HttpStatus.OK)
  datatables(
    @Body() datatablesRequest: DatatablesRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tipoMovimentacaoService.datatables(
      datatablesRequest,
      req.user.sub,
      req.user.regra,
    );
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('idEmpresa') idEmpresa?: string,
  ) {
    return this.tipoMovimentacaoService.findAll(
      req.user.sub,
      req.user.regra,
      idEmpresa ? Number(idEmpresa) : undefined,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tipoMovimentacaoService.findOne(
      id,
      req.user.sub,
      req.user.regra,
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoMovimentacaoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tipoMovimentacaoService.update(
      id,
      dto,
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
    return this.tipoMovimentacaoService.remove(
      id,
      req.user.sub,
      req.user.regra,
    );
  }
}
