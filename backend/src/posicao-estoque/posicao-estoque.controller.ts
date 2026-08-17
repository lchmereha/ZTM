import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PosicaoEstoqueService } from './posicao-estoque.service';
import { CreatePosicaoEstoqueDto } from './dto/create-posicao-estoque.dto';
import { UpdatePosicaoEstoqueDto } from './dto/update-posicao-estoque.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('posicao-estoque')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('posicao-estoque')
export class PosicaoEstoqueController {
  constructor(private readonly posicaoEstoqueService: PosicaoEstoqueService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma Posição de Estoque' })
  create(@Body() createPosicaoEstoqueDto: CreatePosicaoEstoqueDto) {
    return this.posicaoEstoqueService.create(createPosicaoEstoqueDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as Posições de Estoque' })
  findAll(@Query('idFilial') idFilial?: string) {
    return this.posicaoEstoqueService.findAll(idFilial ? +idFilial : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar Posição de Estoque por ID' })
  findOne(@Param('id') id: string) {
    return this.posicaoEstoqueService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma Posição de Estoque' })
  update(
    @Param('id') id: string,
    @Body() updatePosicaoEstoqueDto: UpdatePosicaoEstoqueDto,
  ) {
    return this.posicaoEstoqueService.update(+id, updatePosicaoEstoqueDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar uma Posição de Estoque' })
  remove(@Param('id') id: string) {
    return this.posicaoEstoqueService.remove(+id);
  }
}
