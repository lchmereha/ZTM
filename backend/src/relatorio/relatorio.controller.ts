import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DatatablesRequestDto } from '../common/dto/datatables.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { RelatorioService } from './relatorio.service';

@Controller('relatorio')
@UseGuards(RolesGuard)
export class RelatorioController {
  constructor(private readonly relatorioService: RelatorioService) {}

  @Post('posicao-estoque/datatables')
  @HttpCode(HttpStatus.OK)
  posicaoEstoque(
    @Body() dto: DatatablesRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.relatorioService.posicaoEstoque(
      dto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Post('extrato-movimentacao/datatables')
  @HttpCode(HttpStatus.OK)
  extratoMovimentacao(
    @Body() dto: DatatablesRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.relatorioService.extratoMovimentacao(
      dto,
      req.user.sub,
      req.user.regra,
    );
  }

  @Post('entrada-saida/datatables')
  @HttpCode(HttpStatus.OK)
  entradaSaida(
    @Body() dto: DatatablesRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.relatorioService.entradaSaida(
      dto,
      req.user.sub,
      req.user.regra,
    );
  }
}
