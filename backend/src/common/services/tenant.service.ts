import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Serviço utilitário para resolver IDs de empresas e filiais
 * permitidas para o usuário autenticado (multi-tenant).
 *
 * Usuários ADMIN não possuem restrição — retorna null para indicar
 * que nenhum filtro deve ser aplicado.
 */
@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna os IDs das filiais vinculadas ao usuário,
   * ou null se o usuário for ADMIN (sem restrição).
   */
  async getFilialIds(userId: number, regra: string): Promise<number[] | null> {
    if (regra === 'ADMIN') return null;

    const registros = await this.prisma.usuarioFilial.findMany({
      where: { idUsuario: userId },
      select: { idFilial: true },
    });
    return registros.map((r) => r.idFilial);
  }

  /**
   * Retorna os IDs das empresas matrizes das filiais vinculadas ao usuário,
   * ou null se o usuário for ADMIN (sem restrição).
   */
  async getEmpresaIds(userId: number, regra: string): Promise<number[] | null> {
    if (regra === 'ADMIN') return null;

    const registros = await this.prisma.usuarioFilial.findMany({
      where: { idUsuario: userId },
      include: { filial: { select: { idEmpresa: true } } },
    });
    const ids = new Set(registros.map((r) => r.filial.idEmpresa));
    return Array.from(ids);
  }

  /**
   * Validates that a filial belongs to the user's tenant.
   * Throws NotFoundException if access is denied (prevents enumeration).
   */
  async ensureFilialAccess(
    idFilial: number,
    userId: number,
    regra: string,
  ): Promise<void> {
    const filialIds = await this.getFilialIds(userId, regra);
    if (filialIds && !filialIds.includes(idFilial)) {
      throw new NotFoundException('Filial não encontrada ou sem permissão.');
    }
  }

  /**
   * Validates that a movimentação belongs to the user's tenant.
   * Returns the movimentação's idFilial for further use.
   * Throws NotFoundException if access is denied.
   */
  async ensureMovimentacaoAccess(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ): Promise<{ idFilial: number }> {
    const movimentacao = await this.prisma.movimentacao.findUnique({
      where: { id: idMovimentacao },
      select: { idFilial: true },
    });
    if (!movimentacao)
      throw new NotFoundException('Movimentação não encontrada');

    const filialIds = await this.getFilialIds(userId, regra);
    if (filialIds && !filialIds.includes(movimentacao.idFilial)) {
      throw new NotFoundException('Movimentação não encontrada');
    }
    return movimentacao;
  }
}
