import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumo')
  getResumo(
    @Query('idFilial') idFilial: string,
    @Query('meses') meses: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!idFilial) {
      throw new BadRequestException('Parâmetro "idFilial" é obrigatório.');
    }
    return this.dashboardService.getResumo(
      Number(idFilial),
      Number(meses) || 6,
      req.user.sub,
      req.user.regra,
    );
  }
}
