import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { BaixaLeituraDto } from './dto/baixa-leitura.dto';
import { BatchAssociacaoDto } from './dto/batch-associacao.dto';
import { BatchConferenciaDto } from './dto/batch-conferencia.dto';
import { BatchLeituraDto } from './dto/batch-leitura.dto';
import { BatchTransferenciaDto } from './dto/batch-transferencia.dto';
import { ConcluirAssociacaoDto } from './dto/concluir-associacao.dto';
import { ConcluirConferenciaDto } from './dto/concluir-conferencia.dto';
import { ConcluirTransferenciaDto } from './dto/concluir-transferencia.dto';
import { MovimentacaoService } from './movimentacao.service';
import { BatchAdapterService } from './services/batch-adapter.service';

@Controller('movimentacao')
@UseGuards(RolesGuard)
export class BatchAdapterController {
  constructor(
    private readonly batchAdapter: BatchAdapterService,
    private readonly movimentacaoService: MovimentacaoService,
  ) {}

  // ── Associação ────────────────────────────────────────────

  @Post(':id/associacao/lotes')
  @HttpCode(HttpStatus.OK)
  appendAssociacao(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BatchAssociacaoDto,
  ) {
    return this.batchAdapter.appendAssociacao(id, dto.tags);
  }

  @Post(':id/associacao/concluir-lotes')
  @HttpCode(HttpStatus.OK)
  concluirLotesAssociacao(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const tags = this.batchAdapter.flushAssociacao(id);
    if (tags.length === 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Nenhum lote foi enviado para esta movimentação.',
      });
    }
    const dto = plainToInstance(ConcluirAssociacaoDto, { tags });
    return this.movimentacaoService.concluirAssociacao(
      id,
      dto,
      req.user.sub,
      req.user.regra,
    );
  }

  // ── Conferência ───────────────────────────────────────────

  @Post(':id/conferencia/lotes')
  @HttpCode(HttpStatus.OK)
  appendConferencia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BatchConferenciaDto,
  ) {
    return this.batchAdapter.appendConferencia(id, dto.vinculacoes);
  }

  @Post(':id/conferencia/concluir-lotes')
  @HttpCode(HttpStatus.OK)
  concluirLotesConferencia(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const vinculacoes = this.batchAdapter.flushConferencia(id);
    if (vinculacoes.length === 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Nenhum lote foi enviado para esta movimentação.',
      });
    }
    const dto = plainToInstance(ConcluirConferenciaDto, { vinculacoes });
    return this.movimentacaoService.concluirConferencia(
      id,
      dto,
      req.user.sub,
      req.user.regra,
    );
  }

  // ── Transferência ───────────────────────────────────────────

  @Post(':id/transferencia/lotes')
  @HttpCode(HttpStatus.OK)
  appendTransferencia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BatchTransferenciaDto,
  ) {
    return this.batchAdapter.appendTransferencia(id, dto.vinculacoes);
  }

  @Post(':id/transferencia/concluir-lotes')
  @HttpCode(HttpStatus.OK)
  concluirLotesTransferencia(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const vinculacoes = this.batchAdapter.flushTransferencia(id);
    if (vinculacoes.length === 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Nenhum lote foi enviado para esta movimentação.',
      });
    }
    const dto = plainToInstance(ConcluirTransferenciaDto, { vinculacoes });
    return this.movimentacaoService.concluirTransferencia(
      id,
      dto,
      req.user.sub,
      req.user.regra,
    );
  }

  // ── Leitura ───────────────────────────────────────────────

  @Post(':id/leitura/lotes')
  @HttpCode(HttpStatus.OK)
  appendLeitura(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BatchLeituraDto,
  ) {
    return this.batchAdapter.appendLeitura(id, dto.codigosRfid);
  }

  @Post(':id/leitura/concluir-lotes')
  @HttpCode(HttpStatus.OK)
  concluirLotesLeitura(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const codigosRfid = this.batchAdapter.flushLeitura(id);
    if (codigosRfid.length === 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Nenhum lote foi enviado para esta movimentação.',
      });
    }
    const dto = plainToInstance(BaixaLeituraDto, { codigosRfid });
    return this.movimentacaoService.baixaLeitura(
      id,
      dto,
      req.user.sub,
      req.user.regra,
    );
  }

  // ── Cancelar / Limpar Cache ───────────────────────────────

  @Delete(':id/lotes')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelarLotes(@Param('id', ParseIntPipe) id: number) {
    this.batchAdapter.clearCache(id);
  }
}
