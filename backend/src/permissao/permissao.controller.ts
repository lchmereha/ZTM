import {
  Body,
  Controller,
  Delete,
  Get,
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
import { CreatePermissaoDto } from './dto/create-permissao.dto';
import { UpdatePermissaoDto } from './dto/update-permissao.dto';
import { PermissaoService } from './permissao.service';

@Controller('permissao')
@UseGuards(RolesGuard)
@Roles(UsuarioRole.ADMIN)
export class PermissaoController {
  constructor(private readonly permissaoService: PermissaoService) {}

  @Post()
  @Roles(UsuarioRole.ADMIN)
  create(@Body() createPermissaoDto: CreatePermissaoDto) {
    return this.permissaoService.create(createPermissaoDto);
  }

  @Post('datatables')
  @Roles(UsuarioRole.ADMIN)
  datatables(@Body() body: DatatablesRequestDto) {
    return this.permissaoService.datatables(body);
  }

  @Get('usuario/:idUsuario')
  findByUser(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
    return this.permissaoService.findByUser(idUsuario);
  }

  @Get('opcoes-menu')
  findAllMenuOptions() {
    return this.permissaoService.findAllMenuOptions();
  }

  @Patch(':idUsuario/:idOpcaoMenu')
  @Roles(UsuarioRole.ADMIN)
  update(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Param('idOpcaoMenu', ParseIntPipe) idOpcaoMenu: number,
    @Body() updatePermissaoDto: UpdatePermissaoDto,
  ) {
    return this.permissaoService.update(
      idUsuario,
      idOpcaoMenu,
      updatePermissaoDto,
    );
  }

  @Delete(':idUsuario/:idOpcaoMenu')
  @Roles(UsuarioRole.ADMIN)
  remove(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Param('idOpcaoMenu', ParseIntPipe) idOpcaoMenu: number,
  ) {
    return this.permissaoService.remove(idUsuario, idOpcaoMenu);
  }
}
