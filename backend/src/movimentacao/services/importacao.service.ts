import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoriaService } from '../../categoria/categoria.service';
import { TenantService } from '../../common/services/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProdutoDto } from '../../produto/dto/create-produto.dto';
import { ProdutoService } from '../../produto/produto.service';
import { CreateImportacaoItemDto } from '../dto/create-importacao-item.dto';
import { ValidateImpressaoDto } from '../dto/process-impressao.dto';
import { SaveImportacaoDto } from '../dto/save-importacao.dto';

@Injectable()
export class ImportacaoService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
    private produtoService: ProdutoService,
    private categoriaService: CategoriaService,
  ) {}

  /**
   * Validates that a movimentação belongs to the user's tenant.
   * Delegates to centralized TenantService.
   */
  private ensureMovimentacaoAccess(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ) {
    return this.tenant.ensureMovimentacaoAccess(idMovimentacao, userId, regra);
  }

  /**
   * Validates that a filial belongs to the user's tenant.
   * Delegates to centralized TenantService.
   */
  private ensureFilialAccess(idFilial: number, userId: number, regra: string) {
    return this.tenant.ensureFilialAccess(idFilial, userId, regra);
  }

  // ── Validate Impressão ──────────────────────────────────

  async validateImpressao(
    dto: ValidateImpressaoDto,
    userId: number,
    regra: string,
  ) {
    await this.ensureFilialAccess(dto.idFilial, userId, regra);

    const userEmpresaIds = await this.getUserEmpresaIds(dto.idUsuario);
    const idEmpresaFilial = await this.getIdEmpresaByFilial(dto.idFilial);

    const results: Array<{
      codigo: string;
      exists: boolean;
      hasPermission: boolean;
      existing?: {
        id: number;
        nome: string;
        unidadeMedida: string;
        categoria?: string | null;
      };
    }> = [];

    const produtos = await this.prisma.produto.findMany({
      where: { codigo: { in: dto.codigos } },
      include: { categoria: true },
    });
    const produtoMap = new Map(produtos.map((p) => [p.codigo, p]));

    for (const codigo of dto.codigos) {
      const produto = produtoMap.get(codigo);
      if (!produto) {
        results.push({ codigo, exists: false, hasPermission: true });
      } else {
        const hasPermission = userEmpresaIds.includes(produto.idEmpresa);
        results.push({
          codigo,
          exists: true,
          hasPermission,
          existing: {
            id: produto.id,
            nome: produto.nome,
            unidadeMedida: produto.unidadeMedida,
            categoria: produto.categoria?.nome || null,
          },
        });
      }
    }

    return { idEmpresa: idEmpresaFilial, results };
  }

  // ── Save Importação ────────────────────────────────────

  async saveImportacao(
    dto: SaveImportacaoDto,
    userId?: number,
    regra?: string,
  ) {
    // SEC: Validate tenant access (skip for external/system calls)
    if (userId != null && regra) {
      await this.ensureMovimentacaoAccess(dto.idMovimentacao, userId, regra);
    }

    const movimentacao = await this.prisma.movimentacao.findUnique({
      where: { id: dto.idMovimentacao },
      include: { filial: true, tipo: true },
    });
    if (!movimentacao)
      throw new NotFoundException('Movimentação não encontrada');

    const idEmpresa = movimentacao.filial.idEmpresa;
    /** Movement types that require existing products (no auto-creation) */
    const TIPOS_PRODUTOS_EXISTENTES = ['CONFERENCIA', 'TRANSFERENCIA'];
    const tipoOperacao = movimentacao.tipo?.tipo;
    const usaProdutosExistentes =
      TIPOS_PRODUTOS_EXISTENTES.includes(tipoOperacao);

    // ── Validações de integridade ────────────────────────────
    if (dto.items.length === 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'A lista de itens não pode ser vazia.',
        detalhes: [{ campo: 'items', erros: ['Nenhum item foi enviado.'] }],
      });
    }

    // Normalizar e validar cada item
    for (const item of dto.items) {
      if (!item.codigo || !item.codigo.trim()) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Todos os itens devem ter um código.',
          detalhes: [
            { campo: 'codigo', erros: ['Código do produto é obrigatório.'] },
          ],
        });
      }
      // Normalizar quantidade mínima
      item.quantidade = Math.max(1, item.quantidade ?? 1);

      if (
        tipoOperacao === 'TRANSFERENCIA' &&
        (!item.posicaoEstoque || !item.posicaoEstoque.trim())
      ) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message:
            'A Posição de Estoque é obrigatória na importação de Transferência.',
          detalhes: [
            {
              campo: 'posicaoEstoque',
              erros: ['Posição de Estoque é obrigatória.'],
            },
          ],
        });
      }

      // codigoUnico implica item individual
      if (item.codigoUnico && item.codigoUnico.trim() !== '') {
        item.quantidade = 1;
      }
    }

    // Validate items
    const detalhes: Array<{
      campo: string;
      erros: string[];
      index: number;
    }> = [];

    for (let i = 0; i < dto.items.length; i++) {
      const item = dto.items[i];
      const existing = await this.prisma.produto.findFirst({
        where: { codigo: item.codigo },
      });
      if (usaProdutosExistentes) {
        // Products MUST exist for these movement types
        if (!existing) {
          detalhes.push({
            campo: `Item ${i + 1} (${item.codigo})`,
            erros: [
              `Produto "${item.codigo}" não encontrado. Para ${tipoOperacao.toLowerCase()}, todos os produtos devem estar cadastrados.`,
            ],
            index: i,
          });
        } else if (tipoOperacao === 'CONFERENCIA') {
          // Validate quantity does not exceed active tags
          const activeTagCount = await this.prisma.tagRfid.count({
            where: {
              idProduto: existing.id,
              idFilial: movimentacao.idFilial,
              dataBaixa: null,
            },
          });
          if (item.quantidade > activeTagCount) {
            detalhes.push({
              campo: `Item ${i + 1} (${item.codigo})`,
              erros: [
                `Quantidade solicitada (${item.quantidade}) excede as tags ativas disponíveis (${activeTagCount}) para o produto "${item.codigo}".`,
              ],
              index: i,
            });
          }
        } else if (tipoOperacao === 'TRANSFERENCIA') {
          // Validate quantity does not exceed active tags
          const activeTagCount = await this.prisma.tagRfid.count({
            where: {
              idProduto: existing.id,
              idFilial: movimentacao.idFilial,
              dataBaixa: null,
            },
          });
          if (item.quantidade > activeTagCount) {
            detalhes.push({
              campo: `Item ${i + 1} (${item.codigo})`,
              erros: [
                `Quantidade solicitada (${item.quantidade}) excede as tags ativas disponíveis (${activeTagCount}) para o produto "${item.codigo}".`,
              ],
              index: i,
            });
          }
        }
      } else {
        // Impressão: new products need nome + unidadeMedida
        if (!existing && (!item.nome || !item.unidadeMedida)) {
          detalhes.push({
            campo: `Item ${i + 1} (${item.codigo})`,
            erros: [
              `Produto "${item.codigo}" é novo e precisa de nome e unidadeMedida.`,
            ],
            index: i,
          });
        }
      }
    }

    if (detalhes.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: usaProdutosExistentes
          ? `${detalhes.length} produto(s) não encontrado(s) no sistema.`
          : `${detalhes.length} produto(s) com dados incompletos.`,
        detalhes,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      // Clear previous import items
      await tx.importacaoItem.deleteMany({
        where: { idMovimentacao: dto.idMovimentacao },
      });

      // Only create products for non-CONFERENCIA types
      if (!usaProdutosExistentes) {
        // Batch fetch categories once
        const allCategorias = await tx.categoria.findMany({
          where: { idEmpresa },
        });
        const categoriaMap = new Map(
          allCategorias.map((c) => [c.nome.toLowerCase(), c]),
        );

        // Fetch existing products to avoid P2002 Conflict
        const codigosNaReq = dto.items.map((i) => i.codigo);
        const produtosExistentes = await tx.produto.findMany({
          where: { codigo: { in: codigosNaReq } },
        });
        const codigosExistentes = new Set(
          produtosExistentes.map((p) => p.codigo),
        );

        for (const item of dto.items) {
          if (codigosExistentes.has(item.codigo)) {
            continue;
          }

          let idCategoria: number | null = null;
          if (item.categoria && item.categoria.trim() !== '') {
            let categoria =
              categoriaMap.get(item.categoria.toLowerCase()) || null;
            if (!categoria) {
              categoria = await this.categoriaService.create(
                { idEmpresa, nome: item.categoria, ativo: true },
                tx,
              );
              categoriaMap.set(item.categoria.toLowerCase(), categoria);
            }
            idCategoria = categoria.id;
          }

          const produtoDto: CreateProdutoDto = {
            idEmpresa,
            codigo: item.codigo,
            nome: item.nome!,
            unidadeMedida: item.unidadeMedida!,
            ...(idCategoria != null ? { idCategoria } : {}),
          };
          await this.produtoService.create(
            produtoDto,
            undefined,
            undefined,
            tx,
          );

          // Add to set to prevent duplicate creation if same item comes twice in dto.items
          codigosExistentes.add(item.codigo);
        }
      }

      if (tipoOperacao === 'TRANSFERENCIA') {
        const idFilialDestino = movimentacao.idFilialDestino;
        if (!idFilialDestino) {
          throw new BadRequestException(
            'Filial Destino não informada na movimentação.',
          );
        }

        const posicoesNamesNaReq = [
          ...new Set(dto.items.map((i) => i.posicaoEstoque!.trim())),
        ];
        const posicoesExistentes = await tx.posicaoEstoque.findMany({
          where: {
            idFilial: idFilialDestino,
            nome: { in: posicoesNamesNaReq },
          },
        });
        const posicoesMap = new Set(
          posicoesExistentes.map((p) => p.nome.toUpperCase()),
        );

        for (const posName of posicoesNamesNaReq) {
          if (!posicoesMap.has(posName)) {
            await tx.posicaoEstoque.create({
              data: {
                idFilial: idFilialDestino,
                nome: posName,
                ativo: true,
              },
            });
            posicoesMap.add(posName);
          }
        }
      }

      await tx.importacaoItem.createMany({
        data: dto.items.map((item) => ({
          idMovimentacao: dto.idMovimentacao,
          codigo: item.codigo,
          nome: item.nome || null,
          unidadeMedida: item.unidadeMedida || null,
          quantidade: item.quantidade,
          categoria: item.categoria || null,
          codigoUnico: item.codigoUnico || null,
          dataValidade: item.dataValidade ? new Date(item.dataValidade) : null,
          lote: item.lote || null,
          dataFabricacao: item.dataFabricacao
            ? new Date(item.dataFabricacao)
            : null,
          qtdeUMVolume: item.qtdeUMVolume ?? null,
          posicaoEstoque: item.posicaoEstoque
            ? item.posicaoEstoque.trim()
            : null,
        })),
      });

      await tx.movimentacao.update({
        where: { id: dto.idMovimentacao },
        data: { situacao: 'IMPORTADO' },
      });

      return {
        movimentacaoId: dto.idMovimentacao,
        itemsSaved: dto.items.length,
      };
    });
  }

  // ── Importação Items CRUD ──────────────────────────────

  async getImportacaoItems(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ) {
    await this.ensureMovimentacaoAccess(idMovimentacao, userId, regra);
    return this.prisma.importacaoItem.findMany({
      where: { idMovimentacao },
      orderBy: { id: 'asc' },
    });
  }

  async updateImportacaoItem(
    itemId: number,
    data: {
      codigo?: string;
      nome?: string;
      unidadeMedida?: string;
      quantidade?: number;
      categoria?: string;
      codigoUnico?: string;
      dataValidade?: Date;
      lote?: string;
      dataFabricacao?: Date;
      qtdeUMVolume?: number;
      posicaoEstoque?: string;
    },
    userId: number,
    regra: string,
  ) {
    const item = await this.prisma.importacaoItem.findUnique({
      where: { id: itemId },
      include: { movimentacao: { include: { tipo: true } } },
    });
    if (!item) throw new NotFoundException('Item de importação não encontrado');
    await this.ensureMovimentacaoAccess(item.idMovimentacao, userId, regra);

    // For conferência/transferência: validate that updated quantity doesn't exceed active tags
    if (
      (item.movimentacao.tipo?.tipo === 'CONFERENCIA' ||
        item.movimentacao.tipo?.tipo === 'TRANSFERENCIA') &&
      data.quantidade !== undefined
    ) {
      const codigo = data.codigo ?? item.codigo;
      const produto = await this.prisma.produto.findFirst({
        where: { codigo },
      });
      if (produto) {
        const activeTagCount = await this.prisma.tagRfid.count({
          where: {
            idProduto: produto.id,
            idFilial: item.movimentacao.idFilial,
            dataBaixa: null,
          },
        });
        if (data.quantidade > activeTagCount) {
          throw new BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message: `Quantidade solicitada (${data.quantidade}) excede as tags ativas disponíveis (${activeTagCount}) para o produto "${codigo}".`,
          });
        }
      }
    }

    return this.prisma.importacaoItem.update({
      where: { id: itemId },
      data,
    });
  }

  async removeImportacaoItem(itemId: number, userId: number, regra: string) {
    const item = await this.prisma.importacaoItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('Item de importação não encontrado');
    await this.ensureMovimentacaoAccess(item.idMovimentacao, userId, regra);
    await this.prisma.importacaoItem.delete({ where: { id: itemId } });
  }

  // ── Produtos da Movimentação ───────────────────────────

  async getMovimentacaoProdutos(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ) {
    await this.ensureMovimentacaoAccess(idMovimentacao, userId, regra);

    const movimentacao = await this.prisma.movimentacao.findUnique({
      where: { id: idMovimentacao },
      include: { importacaoItens: true },
    });
    if (!movimentacao)
      throw new NotFoundException('Movimentação não encontrada');

    const codigos = movimentacao.importacaoItens.map((i) => i.codigo);
    if (codigos.length === 0) return [];

    return this.prisma.produto.findMany({
      where: { codigo: { in: codigos } },
      include: { categoria: true, modeloEtiqueta: true },
      orderBy: { codigo: 'asc' },
    });
  }

  // ── Create Individual ImportacaoItem ─────────────────────

  async createImportacaoItem(
    idMovimentacao: number,
    dto: CreateImportacaoItemDto,
    userId: number,
    regra: string,
  ) {
    await this.ensureMovimentacaoAccess(idMovimentacao, userId, regra);

    const movimentacao = await this.prisma.movimentacao.findUnique({
      where: { id: idMovimentacao },
      include: { tipo: true },
    });
    if (!movimentacao)
      throw new NotFoundException('Movimentação não encontrada');

    if (movimentacao.situacao !== 'IMPORTADO') {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message:
          'Itens só podem ser adicionados manualmente quando a movimentação está em situação IMPORTADO.',
      });
    }

    /** Movement types that require existing products (no auto-creation) */
    const TIPOS_PRODUTOS_EXISTENTES = ['CONFERENCIA', 'TRANSFERENCIA'];
    const tipoOperacao = movimentacao.tipo?.tipo;
    const usaProdutosExistentes =
      TIPOS_PRODUTOS_EXISTENTES.includes(tipoOperacao);

    if (
      tipoOperacao === 'TRANSFERENCIA' &&
      (!dto.posicaoEstoque || !dto.posicaoEstoque.trim())
    ) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message:
          'A Posição de Estoque é obrigatória na importação de Transferência.',
      });
    }

    if (usaProdutosExistentes) {
      const produto = await this.prisma.produto.findFirst({
        where: { codigo: dto.codigo },
      });
      if (!produto) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: `Produto "${dto.codigo}" não encontrado. Para ${tipoOperacao.toLowerCase()}, todos os produtos devem estar cadastrados.`,
        });
      }
      if (tipoOperacao === 'CONFERENCIA' || tipoOperacao === 'TRANSFERENCIA') {
        const activeTagCount = await this.prisma.tagRfid.count({
          where: {
            idProduto: produto.id,
            idFilial: movimentacao.idFilial,
            dataBaixa: null,
          },
        });
        if (dto.quantidade > activeTagCount) {
          throw new BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message: `Quantidade solicitada (${dto.quantidade}) excede as tags ativas disponíveis (${activeTagCount}) para o produto "${dto.codigo}".`,
          });
        }
      }
    }

    if (tipoOperacao === 'TRANSFERENCIA' && dto.posicaoEstoque) {
      const idFilialDestino = movimentacao.idFilialDestino;
      if (!idFilialDestino) {
        throw new BadRequestException(
          'Filial Destino não informada na movimentação.',
        );
      }
      const posName = dto.posicaoEstoque.trim().toUpperCase();
      const posicaoExists = await this.prisma.posicaoEstoque.findFirst({
        where: { idFilial: idFilialDestino, nome: posName },
      });
      if (!posicaoExists) {
        await this.prisma.posicaoEstoque.create({
          data: {
            idFilial: idFilialDestino,
            nome: posName,
            ativo: true,
          },
        });
      }
    }

    return this.prisma.importacaoItem.create({
      data: {
        idMovimentacao,
        codigo: dto.codigo,
        nome: dto.nome || null,
        unidadeMedida: dto.unidadeMedida || null,
        quantidade: dto.quantidade,
        categoria: dto.categoria || null,
        codigoUnico: null,
        dataValidade: null,
        lote: null,
        dataFabricacao: null,
        qtdeUMVolume: dto.qtdeUMVolume ?? null,
        posicaoEstoque: dto.posicaoEstoque?.trim().toUpperCase() || null,
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────

  private async getUserEmpresaIds(userId: number): Promise<number[]> {
    const userFiliais = await this.prisma.usuarioFilial.findMany({
      where: { idUsuario: userId },
      include: { filial: true },
    });
    return [...new Set(userFiliais.map((uf) => uf.filial.idEmpresa))];
  }

  private async getIdEmpresaByFilial(idFilial: number): Promise<number> {
    const filial = await this.prisma.filial.findUnique({
      where: { id: idFilial },
    });
    if (!filial) throw new NotFoundException('Filial não encontrada');
    return filial.idEmpresa;
  }
}
