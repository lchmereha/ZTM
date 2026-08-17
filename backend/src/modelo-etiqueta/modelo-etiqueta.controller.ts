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
import { CreateModeloEtiquetaDto } from './dto/create-modelo-etiqueta.dto';
import {
  ModeloEtiquetaService,
  UpdateModeloEtiquetaDto,
} from './modelo-etiqueta.service';

@Controller('modelo-etiqueta')
export class ModeloEtiquetaController {
  constructor(private readonly modeloEtiquetaService: ModeloEtiquetaService) {}

  @Post()
  create(
    @Body() dto: CreateModeloEtiquetaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.modeloEtiquetaService.create(dto, req.user.sub, req.user.regra);
  }

  @Post('datatables')
  @HttpCode(HttpStatus.OK)
  datatables(
    @Body() datatablesRequest: DatatablesRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.modeloEtiquetaService.datatables(
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
    return this.modeloEtiquetaService.findAll(
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
    return this.modeloEtiquetaService.findOne(id, req.user.sub, req.user.regra);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateModeloEtiquetaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.modeloEtiquetaService.update(
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
    return this.modeloEtiquetaService.remove(id, req.user.sub, req.user.regra);
  }
}
