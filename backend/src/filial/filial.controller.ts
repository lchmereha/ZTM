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
import { CreateFilialDto } from './dto/create-filial.dto';
import { UpdateFilialDto } from './dto/update-filial.dto';
import { FilialService } from './filial.service';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsuarioRole } from '../generated/prisma/client';

@Controller('filial')
@UseGuards(RolesGuard)
export class FilialController {
  constructor(private readonly filialService: FilialService) {}

  @Post()
  @Roles(UsuarioRole.ADMIN)
  create(@Body() createFilialDto: CreateFilialDto) {
    return this.filialService.create(createFilialDto);
  }

  @Post('datatables')
  @HttpCode(HttpStatus.OK)
  datatables(
    @Body() datatablesRequest: DatatablesRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.filialService.datatables(
      datatablesRequest,
      req.user.sub,
      req.user.regra,
    );
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.filialService.findAll(req.user.sub, req.user.regra);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.filialService.findOne(id, req.user.sub, req.user.regra);
  }

  @Patch(':id')
  @Roles(UsuarioRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFilialDto: UpdateFilialDto,
  ) {
    return this.filialService.update(id, updateFilialDto);
  }

  @Delete(':id')
  @Roles(UsuarioRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.filialService.remove(id);
  }
}
