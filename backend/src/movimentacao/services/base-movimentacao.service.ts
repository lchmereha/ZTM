import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TenantService } from '../../common/services/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Abstract base class for movement sub-services.
 * Provides shared boilerplate: tenant access checks, movimentação fetching
 * with type/situação validation, standard error formatting, and finalization.
 */
export abstract class BaseMovimentacaoService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly tenant: TenantService,
  ) {}

  /**
   * Validates that a movimentação belongs to the user's tenant.
   */
  protected ensureMovimentacaoAccess(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ) {
    return this.tenant.ensureMovimentacaoAccess(idMovimentacao, userId, regra);
  }

  /**
   * Fetches a movimentação with its tipo, filial, and importacaoItens.
   * Validates tenant access, tipo match, and optionally situação.
   *
   * @throws NotFoundException if movimentação not found
   * @throws BadRequestException if tipo or situação mismatch
   */
  protected async fetchAndValidate(
    idMovimentacao: number,
    userId: number,
    regra: string,
    expectedTipo: string,
    expectedSituacao?: string,
  ) {
    await this.ensureMovimentacaoAccess(idMovimentacao, userId, regra);

    const movimentacao = await this.prisma.movimentacao.findUnique({
      where: { id: idMovimentacao },
      include: { tipo: true, filial: true, importacaoItens: true },
    });

    if (!movimentacao) {
      throw new NotFoundException('Movimentação não encontrada');
    }
    if (movimentacao.tipo.tipo !== expectedTipo) {
      throw new BadRequestException(
        `Esta movimentação não é do tipo ${expectedTipo}.`,
      );
    }
    if (expectedSituacao && movimentacao.situacao !== expectedSituacao) {
      throw new BadRequestException(
        `Apenas movimentações com situação ${expectedSituacao} podem ser processadas.`,
      );
    }

    return movimentacao;
  }

  /**
   * Throws a BadRequestException with the standard validation error format.
   */
  protected throwValidationErrors(
    message: string,
    detalhes: { campo: string; erros: string[] }[],
  ): never {
    throw new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      message,
      detalhes,
    });
  }

  /**
   * Finalizes a movimentação within a transaction context.
   */

  protected async finalizarMovimentacao(tx: any, idMovimentacao: number) {
    await tx.movimentacao.update({
      where: { id: idMovimentacao },
      data: {
        situacao: 'FINALIZADO',
        dataProcessamento: new Date(),
      },
    });
  }
}
