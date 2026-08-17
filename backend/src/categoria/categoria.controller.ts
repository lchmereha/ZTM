import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { RolesGuard } from '../auth/guards/roles.guard';
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { CategoriaService } from './categoria.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Controller('categoria')
@UseGuards(RolesGuard)
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Post()
  create(@Body() createCategoriaDto: CreateCategoriaDto) {
    return this.categoriaService.create(createCategoriaDto);
  }

  @Post('datatables')
  datatables(
    @Body() body: DatatablesRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriaService.datatables(body, req.user.sub, req.user.regra);
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('idEmpresa') idEmpresa?: string,
  ) {
    return this.categoriaService.findAll(
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
    return this.categoriaService.findOne(id, req.user.sub, req.user.regra);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoriaDto: UpdateCategoriaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriaService.update(
      id,
      updateCategoriaDto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriaService.remove(id, req.user.sub, req.user.regra);
  }
}
