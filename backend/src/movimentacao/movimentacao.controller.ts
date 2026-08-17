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
import { BaixaLeituraDto } from './dto/baixa-leitura.dto';
import { ConcluirAssociacaoDto } from './dto/concluir-associacao.dto';
import { ConcluirConferenciaDto } from './dto/concluir-conferencia.dto';
import { CreateImportacaoItemDto } from './dto/create-importacao-item.dto';
import { CreateMovimentacaoDto } from './dto/create-movimentacao.dto';
import { ImprimirTagsDto } from './dto/imprimir-tags.dto';
import { ConcluirTransferenciaDto } from './dto/concluir-transferencia.dto';
import { ValidateImpressaoDto } from './dto/process-impressao.dto';
import { SaveImportacaoDto } from './dto/save-importacao.dto';
import { UpdateImportacaoItemDto } from './dto/update-importacao-item.dto';
import { UpdateMovimentacaoDto } from './dto/update-movimentacao.dto';
import { MovimentacaoService } from './movimentacao.service';

@Controller('movimentacao')
@UseGuards(RolesGuard)
export class MovimentacaoController {
  constructor(private readonly movimentacaoService: MovimentacaoService) {}

  @Post()
  create(
    @Body() createMovimentacaoDto: CreateMovimentacaoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.create(
      createMovimentacaoDto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Post('impressao/validate')
  @HttpCode(HttpStatus.OK)
  validateImpressao(
    @Body() dto: ValidateImpressaoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.validateImpressao(
      dto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Post('importacao')
  @HttpCode(HttpStatus.OK)
  saveImportacao(
    @Body() dto: SaveImportacaoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.saveImportacao(
      dto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Get(':id/importacao-items')
  getImportacaoItems(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.getImportacaoItems(
      id,
      req.user.sub,
      req.user.regra,
    );
  }

  @Patch('importacao-item/:itemId')
  updateImportacaoItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() data: UpdateImportacaoItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.updateImportacaoItem(
      itemId,
      data,
      req.user.sub,
      req.user.regra,
    );
  }

  @Delete('importacao-item/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeImportacaoItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.removeImportacaoItem(
      itemId,
      req.user.sub,
      req.user.regra,
    );
  }

  @Post(':id/importacao-item')
  createImportacaoItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateImportacaoItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.createImportacaoItem(
      id,
      dto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Get(':id/produtos')
  getMovimentacaoProdutos(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.getMovimentacaoProdutos(
      id,
      req.user.sub,
      req.user.regra,
    );
  }

  @Post(':id/processar')
  processarTags(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.processarTags(
      id,
      req.user.sub,
      req.user.regra,
    );
  }

  @Get(':id/tags-processadas')
  getProcessedTags(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.getProcessedTags(
      id,
      req.user.sub,
      req.user.regra,
    );
  }

  @Post(':id/imprimir')
  imprimirTags(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ImprimirTagsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.imprimirTags(
      id,
      req.user.sub,
      req.user.regra,
      dto.clientSide,
    );
  }

  @Post(':id/finalizar')
  finalizarMovimentacao(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.finalizarMovimentacao(
      id,
      req.user.sub,
      req.user.regra,
    );
  }

  // ── Leitura ────────────────────────────────────────────────

  @Post(':id/leitura/validar')
  @HttpCode(HttpStatus.OK)
  validarLeitura(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BaixaLeituraDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.validarLeitura(
      id,
      dto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Post(':id/leitura/baixa')
  @HttpCode(HttpStatus.OK)
  baixaLeitura(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BaixaLeituraDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.baixaLeitura(
      id,
      dto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Get(':id/leitura/relatorio')
  relatorioLeitura(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.relatorioLeitura(
      id,
      req.user.sub,
      req.user.regra,
    );
  }

  // ── Associação ────────────────────────────────────────────

  @Post(':id/associacao/validar')
  @HttpCode(HttpStatus.OK)
  validarAssociacao(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { codigosRfid: string[] },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.validarAssociacao(
      id,
      dto.codigosRfid,
      req.user.sub,
      req.user.regra,
    );
  }

  @Get(':id/associacao/produtos')
  listarProdutosAssociacao(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.listarProdutosAssociacao(
      id,
      req.user.sub,
      req.user.regra,
    );
  }

  @Post(':id/associacao/concluir')
  @HttpCode(HttpStatus.OK)
  concluirAssociacao(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConcluirAssociacaoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.concluirAssociacao(
      id,
      dto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Get(':id/associacao/relatorio')
  relatorioAssociacao(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.relatorioAssociacao(
      id,
      req.user.sub,
      req.user.regra,
    );
  }

  // ── Conferência ─────────────────────────────────────────────

  @Get(':id/conferencia/produtos')
  listarProdutosConferencia(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.listarProdutosConferencia(
      id,
      req.user.sub,
      req.user.regra,
    );
  }

  @Post(':id/conferencia/concluir')
  @HttpCode(HttpStatus.OK)
  concluirConferencia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConcluirConferenciaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.concluirConferencia(
      id,
      dto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Get(':id/conferencia/relatorio')
  relatorioConferencia(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.relatorioConferencia(
      id,
      req.user.sub,
      req.user.regra,
    );
  }

  // ── Transferência ─────────────────────────────────────────────

  @Get(':id/transferencia/produtos')
  listarProdutosTransferencia(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.listarProdutosTransferencia(
      id,
      req.user.sub,
      req.user.regra,
    );
  }

  @Post(':id/transferencia/concluir')
  @HttpCode(HttpStatus.OK)
  concluirTransferencia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConcluirTransferenciaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.concluirTransferencia(
      id,
      dto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Get(':id/transferencia/relatorio')
  relatorioTransferencia(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.relatorioTransferencia(
      id,
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
    return this.movimentacaoService.datatables(
      datatablesRequest,
      req.user.sub,
      req.user.regra,
    );
  }

  @Get('pendentes')
  findPendentes(@Req() req: AuthenticatedRequest) {
    return this.movimentacaoService.findPendentes(req.user.sub, req.user.regra);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.movimentacaoService.findAll(req.user.sub, req.user.regra);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.findOne(id, req.user.sub, req.user.regra);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMovimentacaoDto: UpdateMovimentacaoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.update(
      id,
      updateMovimentacaoDto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Patch(':id/cancelar')
  @Roles(UsuarioRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  cancelar(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movimentacaoService.cancelar(id, req.user.sub, req.user.regra);
  }
}
