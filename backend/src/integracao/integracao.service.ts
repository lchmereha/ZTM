import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApiKeyPayload } from '../auth/guards/api-key.guard';
import { CategoriaService } from '../categoria/categoria.service';
import { ModeloEtiquetaService } from '../modelo-etiqueta/modelo-etiqueta.service';
import { MovimentacaoService } from '../movimentacao/movimentacao.service';
import { ImportacaoService } from '../movimentacao/services/importacao.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProdutoService } from '../produto/produto.service';
import { IntegracaoCreateMovimentacaoDto } from './dto/integracao-create-movimentacao.dto';
import { IntegracaoCreatePosicaoEstoqueDto } from './dto/integracao-create-posicao-estoque.dto';
import { IntegracaoCreateProdutoDto } from './dto/integracao-create-produto.dto';
import { IntegracaoUpdatePosicaoEstoqueDto } from './dto/integracao-update-posicao-estoque.dto';

@Injectable()
export class IntegracaoService {
  constructor(
    private prisma: PrismaService,
    private produtoService: ProdutoService,
    private categoriaService: CategoriaService,
    private modeloEtiquetaService: ModeloEtiquetaService,
    private movimentacaoService: MovimentacaoService,
    private importacaoService: ImportacaoService,
  ) {}

  // ── Helpers ─────────────────────────────────────────────

  private async checkPermission(
    idUsuario: number,
    regra: string,
    chaveMenu: string,
    tipo: 'podeVisualizar' | 'podeIncluir' | 'podeAlterar' | 'podeExcluir',
  ) {
    if (regra === 'ADMIN') return;

    const permissao = await this.prisma.permissaoUsuario.findFirst({
      where: {
        idUsuario,
        opcaoMenu: { chave: chaveMenu },
      },
    });

    if (!permissao || !permissao[tipo]) {
      throw new ForbiddenException(
        'O usuário vinculado a esta API Key não possui permissão para realizar esta operação.',
      );
    }
  }

  // ── Produto ─────────────────────────────────────────────

  async createProduto(
    dto: IntegracaoCreateProdutoDto,
    apiKey: ApiKeyPayload,
    regra: string,
  ) {
    await this.checkPermission(
      apiKey.idUsuario,
      regra,
      'CAD_PRODUTO',
      'podeIncluir',
    );
    const { idEmpresa } = apiKey;

    // ── Resolver Categoria (lógica exclusiva da integração) ──
    let idCategoria: number | undefined;

    if (dto.categoria) {
      if (dto.categoria.id) {
        const existing = await this.prisma.categoria.findUnique({
          where: { id: dto.categoria.id },
        });
        if (!existing) {
          throw new BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message: `Categoria com o ID=${dto.categoria.id} não foi encontrada.`,
          });
        }
        if (existing.idEmpresa !== idEmpresa) {
          throw new ForbiddenException({
            statusCode: 403,
            error: 'Forbidden',
            message: 'A categoria não pertence à empresa da filial da API Key.',
          });
        }
        idCategoria = existing.id;
      } else if (dto.categoria.nome) {
        const existingSameEmpresa = await this.prisma.categoria.findFirst({
          where: { nome: dto.categoria.nome, idEmpresa },
        });
        if (existingSameEmpresa) {
          idCategoria = existingSameEmpresa.id;
        } else {
          const nova = await this.categoriaService.create({
            idEmpresa,
            nome: dto.categoria.nome,
            ativo: true,
          });
          idCategoria = nova.id;
        }
      }
    }

    // ── Resolver Etiqueta (lógica exclusiva da integração) ───
    let idModeloEtiqueta: number | undefined;

    if (dto.etiqueta) {
      if (dto.etiqueta.id) {
        const existing = await this.prisma.modeloEtiqueta.findUnique({
          where: { id: dto.etiqueta.id },
        });
        if (!existing) {
          throw new BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message: `Modelo de etiqueta com id=${dto.etiqueta.id} não encontrado.`,
          });
        }
        if (existing.idEmpresa !== idEmpresa) {
          throw new ForbiddenException({
            statusCode: 403,
            error: 'Forbidden',
            message: 'A etiqueta não pertence à empresa da filial da API Key.',
          });
        }
        idModeloEtiqueta = existing.id;
      } else if (dto.etiqueta.nome && !dto.etiqueta.codigoZPL) {
        const existingSameEmpresa = await this.prisma.modeloEtiqueta.findFirst({
          where: { nome: dto.etiqueta.nome, idEmpresa },
        });
        if (existingSameEmpresa) {
          idModeloEtiqueta = existingSameEmpresa.id;
        } else {
          const existingAnywhere = await this.prisma.modeloEtiqueta.findFirst({
            where: { nome: dto.etiqueta.nome },
          });
          if (existingAnywhere) {
            throw new ForbiddenException({
              statusCode: 403,
              error: 'Forbidden',
              message:
                'A etiqueta já existe no sistema, mas em outra empresa a qual a filial do token não tem acesso.',
            });
          }
          throw new BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message:
              'Etiqueta não encontrada. Para criar uma nova, é obrigatório enviar o "codigoZPL".',
          });
        }
      } else if (dto.etiqueta.nome && dto.etiqueta.codigoZPL) {
        const novo = await this.modeloEtiquetaService.create({
          idEmpresa,
          nome: dto.etiqueta.nome,
          codigoZPL: dto.etiqueta.codigoZPL,
          ativo: true,
        });
        idModeloEtiqueta = novo.id;
      }
    }

    // ── Delegar criação ao ProdutoService ────────────────────
    return this.produtoService.create({
      idEmpresa,
      codigo: dto.codigo,
      nome: dto.nome,
      unidadeMedida: dto.unidadeMedida,
      ...(idCategoria != null ? { idCategoria } : {}),
      ...(idModeloEtiqueta != null ? { idModeloEtiqueta } : {}),
    });
  }

  // ── Movimentação ────────────────────────────────────────

  async createMovimentacao(
    dto: IntegracaoCreateMovimentacaoDto,
    apiKey: ApiKeyPayload,
    regra: string,
  ) {
    await this.checkPermission(
      apiKey.idUsuario,
      regra,
      'MOV_RFID',
      'podeIncluir',
    );
    const { idFilial, idEmpresa } = apiKey;

    // ── Mapa de atalhos → TipoOpcaoMovimentacao ─────────────
    const TIPO_MAP: Record<string, string> = {
      A: 'ASSOCIACAO',
      C: 'CONFERENCIA',
      I: 'IMPRESSAO',
      L: 'LEITURA',
      T: 'TRANSFERENCIA',
    };

    // ── Validação: pelo menos um deve ser informado ─────────
    if (dto.idTipoMovimentacao == null && !dto.tipo) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message:
          'Pelo menos um entre "idTipoMovimentacao" e "tipo" deve ser informado.',
        detalhes: [
          {
            campo: 'idTipoMovimentacao / tipo',
            erros: [
              'Nenhum identificador de tipo de movimentação foi enviado.',
            ],
          },
        ],
      });
    }

    let tipoMov: any;

    if (dto.idTipoMovimentacao != null) {
      // ── Caminho 1: idTipoMovimentacao informado (prioridade) ──
      tipoMov = await this.prisma.tipoMovimentacao.findUnique({
        where: { id: dto.idTipoMovimentacao },
      });
      if (!tipoMov) {
        throw new NotFoundException({
          statusCode: 404,
          error: 'Not Found',
          message: 'Tipo de movimentação não encontrado.',
          detalhes: [
            {
              campo: 'idTipoMovimentacao',
              erros: [
                `Tipo de movimentação com id=${dto.idTipoMovimentacao} não encontrado.`,
              ],
            },
          ],
        });
      }

      if (tipoMov.idEmpresa !== idEmpresa) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          message:
            'O tipo de movimentação não pertence à empresa da filial da API Key.',
        });
      }
    } else {
      // ── Caminho 2: resolver pelo atalho "tipo" ────────────
      const tipoUpper = dto.tipo!.toUpperCase();
      const tipoOpcao = TIPO_MAP[tipoUpper];
      if (!tipoOpcao) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: `Valor inválido para "tipo": "${dto.tipo}". Valores aceitos: A, C, I, L, T.`,
          detalhes: [
            {
              campo: 'tipo',
              erros: [
                'Valores aceitos: "A" (Associação), "C" (Conferência), "I" (Impressão), "L" (Leitura), "T" (Transferência).',
              ],
            },
          ],
        });
      }

      const fazBaixa = dto.fazBaixa ?? true;

      // Buscar um TipoMovimentacao existente na mesma empresa
      tipoMov = await this.prisma.tipoMovimentacao.findFirst({
        where: { idEmpresa, tipo: tipoOpcao as any, fazBaixa },
      });

      // Se não existir, criar automaticamente
      if (!tipoMov) {
        tipoMov = await this.prisma.tipoMovimentacao.create({
          data: {
            idEmpresa,
            descricao: 'NOVO TIPO API',
            ativo: true,
            fazBaixa,
            tipo: tipoOpcao as any,
          },
        });
      }
    }

    const tipoOperacao = tipoMov.tipo;
    const isLeitura = tipoOperacao === 'LEITURA';
    const isTransferencia = tipoOperacao === 'TRANSFERENCIA';

    // ── Resolver filial destino para Transferência ───────────
    let idFilialDestino: number | undefined;
    if (isTransferencia) {
      if (dto.idFilialDestino != null) {
        // ── Caminho 1: idFilialDestino informado (prioridade) ──
        const filialDestino = await this.prisma.filial.findUnique({
          where: { id: dto.idFilialDestino },
        });
        if (!filialDestino) {
          throw new BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message: `Filial de destino com id=${dto.idFilialDestino} não encontrada.`,
            detalhes: [
              {
                campo: 'idFilialDestino',
                erros: ['A filial de destino informada não existe.'],
              },
            ],
          });
        }
        if (filialDestino.idEmpresa !== idEmpresa) {
          throw new ForbiddenException({
            statusCode: 403,
            error: 'Forbidden',
            message:
              'A filial de destino não pertence à mesma empresa da API Key.',
          });
        }
        idFilialDestino = filialDestino.id;
      } else if (dto.filialDestino) {
        // ── Caminho 2: resolver pelo nome da filial ──
        const filialDestino = await this.prisma.filial.findFirst({
          where: { nome: dto.filialDestino, idEmpresa },
        });
        if (!filialDestino) {
          throw new BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message: `Filial de destino com nome "${dto.filialDestino}" não encontrada na empresa.`,
            detalhes: [
              {
                campo: 'filialDestino',
                erros: [
                  'Nenhuma filial com esse nome foi encontrada na empresa da API Key.',
                ],
              },
            ],
          });
        }
        idFilialDestino = filialDestino.id;
      } else {
        // ── Caminho 3: Transferência interna — mesma filial de origem ──
        idFilialDestino = idFilial;
      }
    }

    // ── Resolver Equipamento (lógica exclusiva da integração) ──
    let idEquipamento: number | undefined;

    if (dto.equipamento) {
      // ── Mapa de atalhos → TipoEquipamento ─────────────
      const EQUIP_TIPO_MAP: Record<string, string> = {
        I: 'IMPRESSORA',
        A: 'ANTENA',
        S: 'SLED',
      };

      let tipoEquip: string | undefined;
      if (dto.equipamento.tipo) {
        const tipoUpper = dto.equipamento.tipo.toUpperCase();
        tipoEquip = EQUIP_TIPO_MAP[tipoUpper];
        if (!tipoEquip) {
          throw new BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message: `Valor inválido para o tipo do equipamento: "${dto.equipamento.tipo}". Valores aceitos: I, A, S.`,
            detalhes: [
              {
                campo: 'equipamento.tipo',
                erros: [
                  'Valores aceitos: "I" (Impressora), "A" (Antena), "S" (Sled).',
                ],
              },
            ],
          });
        }
      }

      if (dto.equipamento.id) {
        const existing = await this.prisma.equipamento.findUnique({
          where: { id: dto.equipamento.id },
        });
        if (!existing) {
          throw new BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message: `Equipamento com o ID=${dto.equipamento.id} não foi encontrado.`,
          });
        }
        if (existing.idFilial !== idFilial) {
          throw new ForbiddenException({
            statusCode: 403,
            error: 'Forbidden',
            message: 'O equipamento não pertence à filial da API Key.',
          });
        }
        idEquipamento = existing.id;
      } else if (dto.equipamento.nome && !tipoEquip) {
        const existingSameFilial = await this.prisma.equipamento.findFirst({
          where: { nome: dto.equipamento.nome, idFilial },
        });
        if (existingSameFilial) {
          idEquipamento = existingSameFilial.id;
        } else {
          const existingAnywhere = await this.prisma.equipamento.findFirst({
            where: { nome: dto.equipamento.nome },
          });
          if (existingAnywhere) {
            throw new ForbiddenException({
              statusCode: 403,
              error: 'Forbidden',
              message:
                'O equipamento já existe no sistema, mas em outra filial a qual a API Key não tem acesso.',
            });
          }
          throw new BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message:
              'Equipamento não encontrado. Para criar um novo, é obrigatório enviar o "tipo" (I, A, S).',
          });
        }
      } else if (dto.equipamento.nome && tipoEquip) {
        const novo = await this.prisma.equipamento.create({
          data: {
            idFilial,
            nome: dto.equipamento.nome,
            tipo: tipoEquip as any,
            ipConexao: dto.equipamento.ipConexao,
            portaConexao: dto.equipamento.portaConexao,
            exibeConexaoSocket: dto.equipamento.exibeConexaoSocket,
            ativo: true,
          },
        });
        idEquipamento = novo.id;
      } else {
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message:
            'Para criar um novo equipamento, informe pelo menos "nome" e "tipo" (I, A, S).',
        });
      }
    }

    // ── 1) Delegar criação da movimentação ao MovimentacaoService ──
    const movimentacao = await this.movimentacaoService.create({
      idFilial,
      idTipoMovimentacao: tipoMov.id,
      descricao: dto.descricao,
      codigoIntegracao: dto.codigoIntegracao,
      ...(idEquipamento != null ? { idEquipamento } : {}),
      ...(idFilialDestino != null ? { idFilialDestino } : {}),
    });

    if (isLeitura) {
      // LEITURA: não tem importação — fica em CRIADO
      return {
        id: movimentacao.id,
        situacao: 'CRIADO',
        tipoMovimentacao: tipoMov.descricao,
        tipoOperacao,
        codigoIntegracao: movimentacao.codigoIntegracao,
        itemsCount: 0,
        message:
          'Movimentação de leitura criada. Não possui etapa de importação.',
      };
    }

    // ── Validar itens obrigatórios para tipos não-Leitura ──
    if (!dto.itens || dto.itens.length === 0) {
      await this.prisma.movimentacao.delete({
        where: { id: movimentacao.id },
      });
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message:
          'O campo "itens" é obrigatório para movimentações de Associação, Conferência, Impressão e Transferência.',
        detalhes: [
          {
            campo: 'itens',
            erros: [
              'Nenhum item foi enviado. Informe ao menos um item para este tipo de movimentação.',
            ],
          },
        ],
      });
    }

    // ── 2) Delegar importação ao ImportacaoService ──────────
    try {
      const importResult = await this.importacaoService.saveImportacao({
        idMovimentacao: movimentacao.id,
        items: dto.itens.map((item) => ({
          codigo: item.codigo,
          nome: item.nome,
          unidadeMedida: item.unidadeMedida,
          quantidade: item.quantidade,
          categoria: item.categoria,
          codigoUnico: item.codigoUnico,
          dataValidade: item.dataValidade,
          lote: item.lote,
          dataFabricacao: item.dataFabricacao,
          qtdeUMVolume: item.qtdeUMVolume,
        })),
      });

      return {
        id: movimentacao.id,
        situacao: 'IMPORTADO',
        tipoMovimentacao: tipoMov.descricao,
        tipoOperacao,
        codigoIntegracao: movimentacao.codigoIntegracao,
        itemsCount: importResult.itemsSaved,
        message:
          'Movimentação criada e importação concluída. Aguardando processamento.',
      };
    } catch (error) {
      await this.prisma.movimentacao.delete({
        where: { id: movimentacao.id },
      });
      throw error;
    }
  }

  // ── Endpoints Públicos de Leitura/Consulta e Gerenciamento ──

  async getTiposMovimentacao(apiKey: ApiKeyPayload, regra: string) {
    await this.checkPermission(
      apiKey.idUsuario,
      regra,
      'MOV_RFID',
      'podeVisualizar',
    );
    return this.prisma.tipoMovimentacao.findMany({
      where: { idEmpresa: apiKey.idEmpresa },
      select: {
        id: true,
        descricao: true,
        tipo: true,
        ativo: true,
        fazBaixa: true,
      },
    });
  }

  async getEmpresa(apiKey: ApiKeyPayload, regra: string) {
    await this.checkPermission(
      apiKey.idUsuario,
      regra,
      'CAD_EMPRESA',
      'podeVisualizar',
    );
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: apiKey.idEmpresa },
      select: {
        id: true,
        nome: true,
        logo: true,
        corEsquema: true,
      },
    });
    if (!empresa) throw new NotFoundException('Empresa não encontrada.');
    return empresa;
  }

  async getFilial(apiKey: ApiKeyPayload, regra: string) {
    await this.checkPermission(
      apiKey.idUsuario,
      regra,
      'CAD_FILIAL',
      'podeVisualizar',
    );
    const filial = await this.prisma.filial.findUnique({
      where: { id: apiKey.idFilial },
      select: {
        id: true,
        nome: true,
        documentoIdentificacao: true,
        endereco: true,
        cidade: true,
        estado: true,
        cep: true,
        telefone: true,
      },
    });
    if (!filial) throw new NotFoundException('Filial não encontrada.');
    return filial;
  }

  async getPosicoesEstoque(apiKey: ApiKeyPayload, regra: string) {
    await this.checkPermission(
      apiKey.idUsuario,
      regra,
      'CAD_POSICAO_ESTOQUE',
      'podeVisualizar',
    );
    return this.prisma.posicaoEstoque.findMany({
      where: { idFilial: apiKey.idFilial },
      select: { id: true, nome: true, ativo: true },
    });
  }

  async createPosicaoEstoque(
    dto: IntegracaoCreatePosicaoEstoqueDto,
    apiKey: ApiKeyPayload,
    regra: string,
  ) {
    await this.checkPermission(
      apiKey.idUsuario,
      regra,
      'CAD_POSICAO_ESTOQUE',
      'podeIncluir',
    );
    return this.prisma.posicaoEstoque.create({
      data: {
        nome: dto.nome,
        ativo: dto.ativo ?? true,
        idFilial: apiKey.idFilial,
      },
      select: { id: true, nome: true, ativo: true },
    });
  }

  async updatePosicaoEstoque(
    id: number,
    dto: IntegracaoUpdatePosicaoEstoqueDto,
    apiKey: ApiKeyPayload,
    regra: string,
  ) {
    await this.checkPermission(
      apiKey.idUsuario,
      regra,
      'CAD_POSICAO_ESTOQUE',
      'podeAlterar',
    );
    const posicao = await this.prisma.posicaoEstoque.findUnique({
      where: { id },
    });
    if (!posicao || posicao.idFilial !== apiKey.idFilial) {
      throw new NotFoundException('Posição de estoque não encontrada.');
    }
    return this.prisma.posicaoEstoque.update({
      where: { id },
      data: dto,
      select: { id: true, nome: true, ativo: true },
    });
  }

  async cancelarMovimentacao(id: number, apiKey: ApiKeyPayload, regra: string) {
    await this.checkPermission(
      apiKey.idUsuario,
      regra,
      'MOV_RFID',
      'podeExcluir',
    );
    const movimentacao = await this.prisma.movimentacao.findUnique({
      where: { id },
    });
    if (!movimentacao || movimentacao.idFilial !== apiKey.idFilial) {
      throw new NotFoundException('Movimentação não encontrada.');
    }

    return this.movimentacaoService.cancelar(id, apiKey.idUsuario);
  }

  async getMovimentacoes(apiKey: ApiKeyPayload, regra: string) {
    await this.checkPermission(
      apiKey.idUsuario,
      regra,
      'MOV_RFID',
      'podeVisualizar',
    );
    return this.prisma.movimentacao.findMany({
      where: {
        idFilial: apiKey.idFilial,
        ocultaIntegracao: false,
      },
      select: {
        id: true,
        descricao: true,
        codigoIntegracao: true,
        situacao: true,
        dataProcessamento: true,
        ocultaIntegracao: true,
        createdAt: true,
        updatedAt: true,
        tipo: {
          select: {
            id: true,
            descricao: true,
            tipo: true,
            fazBaixa: true,
          },
        },
        filialDestino: {
          select: {
            id: true,
            nome: true,
          },
        },
        equipamento: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
        _count: {
          select: { itens: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async ocultarMovimentacao(
    id: number,
    ocultar: boolean,
    apiKey: ApiKeyPayload,
    regra: string,
  ) {
    await this.checkPermission(
      apiKey.idUsuario,
      regra,
      'MOV_RFID',
      'podeAlterar',
    );
    const movimentacao = await this.prisma.movimentacao.findUnique({
      where: { id },
    });
    if (!movimentacao || movimentacao.idFilial !== apiKey.idFilial) {
      throw new NotFoundException('Movimentação não encontrada.');
    }

    return this.prisma.movimentacao.update({
      where: { id },
      data: { ocultaIntegracao: ocultar },
      select: {
        id: true,
        ocultaIntegracao: true,
      },
    });
  }
}
