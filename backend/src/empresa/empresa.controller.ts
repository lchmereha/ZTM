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
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { EmpresaService } from './empresa.service';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsuarioRole } from '../generated/prisma/client';

@Controller('empresa')
@UseGuards(RolesGuard)
@Roles(UsuarioRole.ADMIN)
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Post()
  create(@Body() createEmpresaDto: CreateEmpresaDto) {
    return this.empresaService.create(createEmpresaDto);
  }

  @Post('datatables')
  @HttpCode(HttpStatus.OK)
  datatables(
    @Body() datatablesRequest: DatatablesRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.empresaService.datatables(
      datatablesRequest,
      req.user.sub,
      req.user.regra,
    );
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.empresaService.findAll(req.user.sub, req.user.regra);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.empresaService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmpresaDto: UpdateEmpresaDto,
  ) {
    return this.empresaService.update(id, updateEmpresaDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.empresaService.remove(id);
  }
}
