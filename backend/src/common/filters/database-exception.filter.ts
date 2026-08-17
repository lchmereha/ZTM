import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Inject,
  Logger,
} from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/client';
import { Request, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Maps FK constraint names to:
 * - label: user-friendly name of the dependent entity
 * - model: Prisma model name for querying dependents
 * - fk: foreign key column in the dependent table
 * - display: field(s) to show as identifier in the error details
 */
interface DependencyInfo {
  label: string;
  model: string;
  fk: string;
  display: string[];
}

const DEPENDENCY_MAP: Record<string, DependencyInfo> = {
  // TagRfid → Produto / Filial
  tags_rfid_idProduto_fkey: {
    label: 'Tags RFID',
    model: 'tagRfid',
    fk: 'idProduto',
    display: ['codigoRfid'],
  },
  tags_rfid_idFilial_fkey: {
    label: 'Tags RFID',
    model: 'tagRfid',
    fk: 'idFilial',
    display: ['codigoRfid'],
  },
  // Produto → Categoria / ModeloEtiqueta
  produtos_idCategoria_fkey: {
    label: 'Produtos',
    model: 'produto',
    fk: 'idCategoria',
    display: ['nome'],
  },
  produtos_id_modelo_etiqueta_fkey: {
    label: 'Produtos',
    model: 'produto',
    fk: 'idModeloEtiqueta',
    display: ['nome'],
  },
  // Equipamento → Filial
  equipamentos_idFilial_fkey: {
    label: 'Equipamentos',
    model: 'equipamento',
    fk: 'idFilial',
    display: ['nome'],
  },
  // Filial → Empresa / ModeloEtiqueta
  filiais_idEmpresa_fkey: {
    label: 'Filiais',
    model: 'filial',
    fk: 'idEmpresa',
    display: ['nome'],
  },
  filiais_id_etiqueta_padrao_fkey: {
    label: 'Filiais',
    model: 'filial',
    fk: 'idEtiquetaPadrao',
    display: ['nome'],
  },
  // Movimentacao → Filial / Equipamento / TipoMovimentacao / Usuario
  movimentacoes_idFilial_fkey: {
    label: 'Movimentações',
    model: 'movimentacao',
    fk: 'idFilial',
    display: ['id', 'descricao'],
  },
  movimentacoes_idEquipamento_fkey: {
    label: 'Movimentações',
    model: 'movimentacao',
    fk: 'idEquipamento',
    display: ['id', 'descricao'],
  },
  movimentacoes_idTipoMovimentacao_fkey: {
    label: 'Movimentações',
    model: 'movimentacao',
    fk: 'idTipoMovimentacao',
    display: ['id', 'descricao'],
  },
  movimentacoes_idUsuario_fkey: {
    label: 'Movimentações',
    model: 'movimentacao',
    fk: 'idUsuario',
    display: ['id', 'descricao'],
  },
  // MovimentacaoItem → Movimentacao / TagRfid
  movimentacao_itens_idMovimentacao_fkey: {
    label: 'Itens de Movimentação',
    model: 'movimentacaoItem',
    fk: 'idMovimentacao',
    display: ['codigoRfid', 'ocorrencia'],
  },
  movimentacao_itens_id_tag_rfid_fkey: {
    label: 'Itens de Movimentação',
    model: 'movimentacaoItem',
    fk: 'idTagRfid',
    display: ['codigoRfid', 'ocorrencia'],
  },
  // ImportacaoItem → Movimentacao
  importacao_itens_idMovimentacao_fkey: {
    label: 'Itens de Importação',
    model: 'importacaoItem',
    fk: 'idMovimentacao',
    display: ['codigo', 'nome'],
  },
  // Categoria → Empresa
  categorias_idEmpresa_fkey: {
    label: 'Categorias',
    model: 'categoria',
    fk: 'idEmpresa',
    display: ['nome'],
  },
  // ModeloEtiqueta → Empresa
  modelos_etiqueta_idEmpresa_fkey: {
    label: 'Modelos de Etiqueta',
    model: 'modeloEtiqueta',
    fk: 'idEmpresa',
    display: ['nome'],
  },
  // TipoMovimentacao → Empresa
  tipos_movimentacao_idEmpresa_fkey: {
    label: 'Tipos de Movimentação',
    model: 'tipoMovimentacao',
    fk: 'idEmpresa',
    display: ['descricao'],
  },
  // UsuarioFilial → Filial / Usuario
  usuarios_filiais_idFilial_fkey: {
    label: 'Vínculos de Usuário',
    model: 'usuarioFilial',
    fk: 'idFilial',
    display: ['id'],
  },
  usuarios_filiais_idUsuario_fkey: {
    label: 'Vínculos de Filial',
    model: 'usuarioFilial',
    fk: 'idUsuario',
    display: ['id'],
  },
  // PermissaoUsuario → Usuario / OpcaoMenu
  permissoes_usuarios_idUsuario_fkey: {
    label: 'Permissões de Usuário',
    model: 'permissaoUsuario',
    fk: 'idUsuario',
    display: ['id'],
  },
  permissoes_usuarios_idOpcaoMenu_fkey: {
    label: 'Permissões de Usuário',
    model: 'permissaoUsuario',
    fk: 'idOpcaoMenu',
    display: ['id'],
  },
};

/**
 * Intercepta erros de conexão com o banco de dados (Prisma/MariaDB)
 * e retorna mensagens amigáveis em vez de 500 Internal Server Error genérico.
 */
@Catch(PrismaClientKnownRequestError, PrismaClientValidationError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async catch(
    exception: PrismaClientKnownRequestError | PrismaClientValidationError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const message = exception.message || '';
    const causeObj = exception.cause as Record<string, unknown> | undefined;
    const cause = String(
      (causeObj as any)?.cause || (causeObj as any)?.message || '',
    );

    // Pool timeout / Connection refused → banco de dados indisponível
    if (
      message.includes('pool timeout') ||
      message.includes('ECONNREFUSED') ||
      cause.includes('ECONNREFUSED') ||
      cause.includes('pool timeout')
    ) {
      this.logger.error(`Banco de dados indisponível: ${cause || message}`);
      return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: 'Service Unavailable',
        message:
          'Não foi possível conectar ao banco de dados. Verifique se o serviço está em execução.',
      });
    }

    // Connection lost / Connection reset → conexão caiu durante operação
    if (
      message.includes('Connection lost') ||
      message.includes('EPIPE') ||
      message.includes('ECONNRESET')
    ) {
      this.logger.error(`Conexão com o banco perdida: ${message}`);
      return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: 'Service Unavailable',
        message:
          'A conexão com o banco de dados foi perdida. Tente novamente em instantes.',
      });
    }

    // Prisma: erros de negócio conhecidos → retornar status HTTP adequado
    if (exception instanceof PrismaClientKnownRequestError) {
      const code = exception.code;
      const meta = exception.meta;

      // P2002 — Unique constraint violation
      if (code === 'P2002') {
        const rawTarget = meta?.target;
        const fields = Array.isArray(rawTarget)
          ? (rawTarget as string[]).join(', ')
          : typeof rawTarget === 'string'
            ? rawTarget
            : 'desconhecido';
        this.logger.warn(`P2002 Unique violation on fields: ${fields}`);
        const label =
          Array.isArray(rawTarget) && rawTarget.length > 1
            ? 'os campos'
            : 'o campo';
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: `Já existe um registro com ${label}: ${fields}.`,
        });
      }

      // P2003 — Foreign key constraint violation
      if (code === 'P2003') {
        // MariaDB driver adapter: field_name is empty, real info is in driverAdapterError
        let field = typeof meta?.field_name === 'string' ? meta.field_name : '';
        if (!field || field === 'desconhecido') {
          const driverErr = meta?.driverAdapterError as
            | Record<string, any>
            | undefined;
          const originalMsg: string = String(
            driverErr?.cause?.originalMessage || '',
          );
          const constraintMatch = originalMsg.match(/CONSTRAINT `(\w+)`/i);
          if (constraintMatch) {
            field = constraintMatch[1];
          }
        }
        if (!field) field = 'desconhecido';

        const request = ctx.getRequest<Request>();
        const httpMethod = request?.method?.toUpperCase();

        // DELETE blocked by child records
        if (httpMethod === 'DELETE') {
          const depInfo = DEPENDENCY_MAP[field] || null;

          // Try to query for the specific dependent records
          let detalhes: string[] | undefined;
          if (depInfo) {
            try {
              // Extract the parent ID from the URL (last segment: /resource/:id)
              const urlParts = request.url.split('/').filter(Boolean);
              const parentId = parseInt(urlParts[urlParts.length - 1], 10);

              if (!isNaN(parentId)) {
                const model = (this.prisma as any)[depInfo.model];
                if (model) {
                  const dependents = await model.findMany({
                    where: { [depInfo.fk]: parentId },
                    take: 10,
                    select: depInfo.display.reduce(
                      (acc: Record<string, boolean>, f: string) => {
                        acc[f] = true;
                        return acc;
                      },
                      {},
                    ),
                  });

                  const total = await model.count({
                    where: { [depInfo.fk]: parentId },
                  });

                  if (dependents.length > 0) {
                    detalhes = dependents.map((d: any) => {
                      const values = depInfo.display
                        .map((f: string) => d[f])
                        .filter(Boolean);
                      return values.join(' - ') || `ID: ${d.id || '?'}`;
                    });

                    if (total > dependents.length) {
                      const remaining = total - dependents.length;
                      detalhes?.push(
                        `... e mais ${remaining} ${remaining === 1 ? 'registro' : 'registros'}.`,
                      );
                    }
                  }
                }
              }
            } catch (queryErr) {
              this.logger.warn(
                `Falha ao buscar dependentes para constraint ${field}: ${queryErr instanceof Error ? queryErr.message : String(queryErr)}`,
              );
            }
          }

          const depLabel = depInfo?.label || 'outros cadastros';
          const userMessage = `Este registro possui ${depLabel} vinculados e não pode ser excluído. Remova as dependências antes de tentar novamente.`;

          this.logger.warn(
            `P2003 FK violation on DELETE — constraint: ${field}, dependents: ${depLabel}`,
          );

          return response.status(HttpStatus.CONFLICT).json({
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            message: userMessage,
            ...(detalhes && detalhes.length > 0 && { detalhes }),
          });
        }

        // CREATE/UPDATE with invalid FK reference
        this.logger.warn(
          `P2003 FK violation — invalid reference on field: ${field}`,
        );
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: `Referência inválida no campo: ${field}. Verifique se o registro relacionado existe.`,
        });
      }

      // P2025 — Record not found
      if (code === 'P2025') {
        const cause = typeof meta?.cause === 'string' ? meta.cause : 'unknown';
        this.logger.warn(`P2025 Record not found: ${cause}`);
        return response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message:
            typeof meta?.cause === 'string'
              ? meta.cause
              : 'Registro não encontrado.',
        });
      }
    }

    // Prisma: erros de validação (campo obrigatório faltando, tipo inválido, etc.)
    if (exception instanceof PrismaClientValidationError) {
      // Tentar extrair campos inválidos da mensagem do Prisma
      const lines = message.split('\n').filter((l: string) => l.trim());
      const fieldErrors: string[] = [];

      for (const line of lines) {
        // Padrão: "Argument `xyz` ..." ou "Unknown argument `xyz`"
        const unknownMatch = line.match(/Unknown argument `(\w+)`/i);
        const invalidMatch = line.match(/Argument `(\w+)`.*?expected.*?(\w+)/i);
        const missingMatch = line.match(/Missing.*?argument.*?`(\w+)`/i);

        if (unknownMatch) {
          fieldErrors.push(`Campo "${unknownMatch[1]}" não é reconhecido.`);
        } else if (invalidMatch) {
          fieldErrors.push(
            `Campo "${invalidMatch[1]}" possui tipo inválido (esperado: ${invalidMatch[2]}).`,
          );
        } else if (missingMatch) {
          fieldErrors.push(
            `Campo obrigatório "${missingMatch[1]}" está ausente.`,
          );
        }
      }

      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message:
          fieldErrors.length > 0
            ? 'Erro de validação nos dados enviados.'
            : 'Dados inválidos enviados para o servidor. Verifique os campos obrigatórios.',
        ...(fieldErrors.length > 0 && { detalhes: fieldErrors }),
      });
    }

    // Qualquer outro erro não tratado
    this.logger.error(`Erro não tratado: ${message}`, exception?.stack);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Ocorreu um erro interno no servidor.',
    });
  }
}
