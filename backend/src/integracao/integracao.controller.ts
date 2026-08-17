import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiKeyAuthenticatedRequest,
  ApiKeyGuard,
} from '../auth/guards/api-key.guard';
import { IntegracaoCreateMovimentacaoDto } from './dto/integracao-create-movimentacao.dto';
import { IntegracaoCreatePosicaoEstoqueDto } from './dto/integracao-create-posicao-estoque.dto';
import { IntegracaoCreateProdutoDto } from './dto/integracao-create-produto.dto';
import { IntegracaoUpdatePosicaoEstoqueDto } from './dto/integracao-update-posicao-estoque.dto';
import { IntegracaoService } from './integracao.service';

@ApiTags('Integração')
@ApiSecurity('api-key')
@Controller('integracao')
@Public()
@UseGuards(ApiKeyGuard)
export class IntegracaoController {
  constructor(private readonly integracaoService: IntegracaoService) {}

  @Post('produto')
  @ApiOperation({
    summary: 'Cadastrar Produto',
    description:
      'Cria um novo produto vinculado à filial/empresa da API Key fornecida. ' +
      'Categoria e etiqueta são opcionais. Se um ID for informado e existir no banco, ' +
      'o item cadastrado será utilizado. Caso o ID não exista ou não seja informado, ' +
      'e os demais campos estejam preenchidos, um novo item será criado automaticamente.',
  })
  @ApiBody({
    type: IntegracaoCreateProdutoDto,
    examples: {
      default: {
        summary: 'Exemplo em branco',
        value: {
          codigo: '',
          nome: '',
          unidadeMedida: '',
          categoria: { id: 0, nome: '' },
          etiqueta: { id: 0, nome: '', codigoZPL: '' },
        },
      },
      criandoNovos: {
        summary: 'Criar nova Categoria e Etiqueta',
        description:
          'Exemplo enviando nome para criar uma nova categoria e uma nova etiqueta (sem informar ID).',
        value: {
          codigo: 'PROD-100',
          nome: 'Notebook Dell XPS 13',
          unidadeMedida: 'UN',
          categoria: { nome: 'Eletrônicos' },
          etiqueta: {
            nome: 'Etiqueta Notebooks',
            codigoZPL: '^XA^FO50,50^ADN,36,20^FD{{produto.nome}}^FS^XZ',
          },
        },
      },
      usandoExistentes: {
        summary: 'Usar Categoria e Etiqueta existentes',
        description:
          'Exemplo utilizando o ID de uma categoria e modelo de etiqueta já cadastrados no banco.',
        value: {
          codigo: 'PROD-101',
          nome: 'Mouse Sem Fio Logitech',
          unidadeMedida: 'UN',
          categoria: { id: 10 },
          etiqueta: { id: 5 },
        },
      },
      usandoExistentesPorNome: {
        summary: 'Usar Categoria e Etiqueta por Nome',
        description:
          'Busca a categoria e a etiqueta pelo nome. Se a categoria não existir, será criada. Se a etiqueta existir na empresa, será usada; caso não exista, retornará erro por falta do "codigoZPL".',
        value: {
          codigo: 'PROD-102',
          nome: 'Teclado Mecânico',
          unidadeMedida: 'UN',
          categoria: { nome: 'Eletrônicos' },
          etiqueta: { nome: 'Etiqueta Padrão' },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Produto criado com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação nos dados enviados.',
  })
  @ApiResponse({
    status: 401,
    description: 'API Key inválida ou ausente.',
  })
  createProduto(
    @Body() dto: IntegracaoCreateProdutoDto,
    @Req() req: ApiKeyAuthenticatedRequest,
  ) {
    return this.integracaoService.createProduto(
      dto,
      req.apiKey,
      req.user!.regra,
    );
  }

  @Post('movimentacao')
  @ApiOperation({
    summary: 'Cadastrar Movimentação',
    description:
      'Cria uma nova movimentação vinculada à filial/empresa da API Key fornecida. ' +
      'O comportamento varia conforme o tipo de operação:\n\n' +
      '- **Impressão**: Produtos inexistentes serão criados automaticamente (nome e unidadeMedida obrigatórios).\n' +
      '- **Associação**: Todos os produtos devem estar previamente cadastrados.\n' +
      '- **Conferência**: Todos os produtos devem existir e a quantidade não pode exceder tags ativas.\n' +
      '- **Leitura**: Não possui etapa de importação — a movimentação é criada em situação CRIADO.\n' +
      '- **Transferência**: Move itens entre filiais ou posições de estoque. Se `idFilialDestino` não for informado, assume a mesma filial de origem (transferência interna).\n\n' +
      'Para os demais tipos, a movimentação é criada e automaticamente avançada para situação IMPORTADO, ' +
      'aguardando processamento.',
  })
  @ApiBody({
    type: IntegracaoCreateMovimentacaoDto,
    examples: {
      default: {
        summary: 'Exemplo em branco',
        value: {
          idTipoMovimentacao: 0,
          tipo: '',
          fazBaixa: true,
          descricao: '',
          codigoIntegracao: '',
          idFilialDestino: 0,
          filialDestino: '',
          equipamento: {
            id: 0,
            nome: '',
            tipo: '',
            ipConexao: '',
            portaConexao: 0,
            exibeConexaoSocket: false,
          },
          itens: [
            {
              codigo: '',
              nome: '',
              unidadeMedida: '',
              quantidade: 0,
              categoria: '',
              codigoUnico: '',
              dataValidade: '',
              lote: '',
              dataFabricacao: '',
              qtdeUMVolume: 0,
            },
          ],
        },
      },
      impressaoCriandoEquipamento: {
        summary: 'Impressão (Criando Equipamento)',
        description:
          'Impressão informando os dados do equipamento para criação e dados completos dos produtos caso não existam no sistema.',
        value: {
          tipo: 'I',
          fazBaixa: false,
          descricao: 'Impressão inicial de etiquetas',
          equipamento: {
            nome: 'Impressora ZT411',
            tipo: 'I',
            ipConexao: '192.168.1.50',
            portaConexao: 9100,
            exibeConexaoSocket: true,
          },
          itens: [
            {
              codigo: 'PROD-100',
              nome: 'Notebook Dell XPS 13',
              unidadeMedida: 'UN',
              quantidade: 10,
              categoria: 'Eletrônicos',
              lote: 'LOTE-A1',
            },
          ],
        },
      },
      leituraUsandoEquipamentoExistente: {
        summary: 'Leitura (Equip. Existente)',
        description:
          'Leitura (inventário cego) usando o ID de um equipamento que já está cadastrado.',
        value: {
          tipo: 'L',
          fazBaixa: false,
          descricao: 'Inventário da zona A',
          codigoIntegracao: 'INV-2026-001',
          equipamento: { id: 2 },
          itens: [],
        },
      },
      leituraUsandoEquipamentoExistentePorNome: {
        summary: 'Leitura (Equip. por Nome)',
        description:
          'Leitura usando apenas o nome de um equipamento que já está cadastrado. Se encontrado e pertencer à filial, será utilizado.',
        value: {
          tipo: 'L',
          fazBaixa: false,
          descricao: 'Inventário da zona B',
          codigoIntegracao: 'INV-2026-002',
          equipamento: { nome: 'Coletor Zona B' },
          itens: [],
        },
      },
      associacaoIdTipo: {
        summary: 'Associação (Por ID de Tipo)',
        description:
          'Importação para associação usando o idTipoMovimentacao em vez da letra do tipo.',
        value: {
          idTipoMovimentacao: 15,
          descricao: 'Recebimento NF 123',
          itens: [
            { codigo: 'PROD-100', quantidade: 50, codigoUnico: 'SN-001' },
          ],
        },
      },
      transferenciaEntreFiliais: {
        summary: 'Transferência (Entre Filiais)',
        description:
          'Transferência de itens para outra filial da mesma empresa. Informe o idFilialDestino com o ID da filial de destino.',
        value: {
          tipo: 'T',
          fazBaixa: true,
          descricao: 'Transferência para Filial SP',
          idFilialDestino: 3,
          itens: [
            { codigo: 'PROD-100', quantidade: 20 },
            { codigo: 'PROD-101', quantidade: 5 },
          ],
        },
      },
      transferenciaInterna: {
        summary: 'Transferência (Interna)',
        description:
          'Transferência interna entre posições de estoque dentro da mesma filial. Quando nem idFilialDestino nem filialDestino são informados, assume a mesma filial de origem.',
        value: {
          tipo: 'T',
          fazBaixa: false,
          descricao: 'Remanejamento Prateleira A → B',
          itens: [{ codigo: 'PROD-200', quantidade: 10 }],
        },
      },
      transferenciaPorNome: {
        summary: 'Transferência (Filial por Nome)',
        description:
          'Transferência informando o nome da filial de destino. O sistema busca a filial pelo nome dentro da mesma empresa da API Key.',
        value: {
          tipo: 'T',
          fazBaixa: true,
          descricao: 'Envio para Filial São Paulo',
          filialDestino: 'Filial São Paulo',
          itens: [
            { codigo: 'PROD-100', quantidade: 15 },
            { codigo: 'PROD-300', quantidade: 8 },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Movimentação criada com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação nos dados ou produtos não encontrados.',
  })
  @ApiResponse({
    status: 401,
    description: 'API Key inválida ou ausente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Tipo de movimentação não encontrado.',
  })
  createMovimentacao(
    @Body() dto: IntegracaoCreateMovimentacaoDto,
    @Req() req: ApiKeyAuthenticatedRequest,
  ) {
    return this.integracaoService.createMovimentacao(
      dto,
      req.apiKey,
      req.user!.regra,
    );
  }

  @Patch('movimentacao/:id/cancelar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar Movimentação',
    description:
      'Cancela uma movimentação. Só permite cancelar se a movimentação pertencer à filial da API Key.',
  })
  cancelarMovimentacao(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: ApiKeyAuthenticatedRequest,
  ) {
    return this.integracaoService.cancelarMovimentacao(
      id,
      req.apiKey,
      req.user!.regra,
    );
  }

  @Get('movimentacao')
  @ApiOperation({
    summary: 'Listar Movimentações',
    description:
      'Retorna todas as movimentações vinculadas à filial da API Key. ' +
      'Movimentações com a flag `ocultaIntegracao` ativada não são retornadas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de movimentações da filial.',
    schema: {
      example: [
        {
          id: 1,
          descricao: 'Import. NF 123',
          codigoIntegracao: 'ERP-NFE-998877',
          situacao: 'IMPORTADO',
          dataProcessamento: null,
          ocultaIntegracao: false,
          createdAt: '2026-06-18T12:00:00.000Z',
          updatedAt: '2026-06-18T12:00:00.000Z',
          tipo: {
            id: 1,
            descricao: 'Entrada Cega',
            tipo: 'CONFERENCIA',
            fazBaixa: false,
          },
          filialDestino: null,
          equipamento: {
            id: 2,
            nome: 'Coletor Zona A',
            tipo: 'ANTENA',
          },
          _count: { itens: 15 },
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'API Key inválida ou ausente.',
  })
  getMovimentacoes(@Req() req: ApiKeyAuthenticatedRequest) {
    return this.integracaoService.getMovimentacoes(req.apiKey, req.user!.regra);
  }

  @Patch('movimentacao/:id/lida')
  @ApiOperation({
    summary: 'Marcar Movimentação como Lida',
    description:
      'Marca uma movimentação como lida ou não lida. ' +
      'Quando marcada como lida, a movimentação deixa de ser retornada pelo GET de listagem da integração. ' +
      'Essa flag não afeta a API interna.',
  })
  @ApiQuery({
    name: 'lida',
    type: Boolean,
    required: true,
    description:
      '`true` para marcar como lida (ocultar da listagem); `false` para marcar como não lida (exibir novamente).',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Flag de leitura atualizada.',
    schema: {
      example: {
        id: 1,
        ocultaIntegracao: true,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'API Key inválida ou ausente.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Movimentação não encontrada ou não pertence à filial da API Key.',
  })
  ocultarMovimentacao(
    @Param('id', ParseIntPipe) id: number,
    @Query('lida', ParseBoolPipe) lida: boolean,
    @Req() req: ApiKeyAuthenticatedRequest,
  ) {
    return this.integracaoService.ocultarMovimentacao(
      id,
      lida,
      req.apiKey,
      req.user!.regra,
    );
  }

  @Get('tipo-movimentacao')
  @ApiOperation({
    summary: 'Listar Tipos de Movimentação',
    description:
      'Retorna todos os tipos de movimentação vinculados à empresa da API Key.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tipos de movimentação.',
    schema: {
      example: [
        {
          id: 1,
          descricao: 'Entrada Cega',
          tipo: 'CONFERENCIA',
          ativo: true,
          fazBaixa: false,
        },
      ],
    },
  })
  getTiposMovimentacao(@Req() req: ApiKeyAuthenticatedRequest) {
    return this.integracaoService.getTiposMovimentacao(
      req.apiKey,
      req.user!.regra,
    );
  }

  @Get('empresa')
  @ApiOperation({
    summary: 'Consultar Empresa',
    description: 'Retorna os dados da empresa vinculada à API Key.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados da empresa vinculada à API Key.',
    schema: {
      example: {
        id: 1,
        nome: 'Empresa Teste LTDA',
        logo: 'https://link-da-logo.com/img.png',
        corEsquema: '#FF0000',
      },
    },
  })
  getEmpresa(@Req() req: ApiKeyAuthenticatedRequest) {
    return this.integracaoService.getEmpresa(req.apiKey, req.user!.regra);
  }

  @Get('filial')
  @ApiOperation({
    summary: 'Consultar Filial',
    description: 'Retorna os dados da filial vinculada à API Key.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados da filial vinculada à API Key.',
    schema: {
      example: {
        id: 1,
        nome: 'Filial Central',
        documentoIdentificacao: '00.000.000/0002-00',
        endereco: 'Rua das Flores, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01000-000',
        telefone: '(11) 99999-9999',
      },
    },
  })
  getFilial(@Req() req: ApiKeyAuthenticatedRequest) {
    return this.integracaoService.getFilial(req.apiKey, req.user!.regra);
  }

  @Get('posicao-estoque')
  @ApiOperation({
    summary: 'Listar Posições de Estoque',
    description:
      'Retorna todas as posições de estoque cadastradas para a filial da API Key.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de posições de estoque da filial.',
    schema: {
      example: [
        {
          id: 1,
          nome: 'Prateleira A1',
          ativo: true,
        },
      ],
    },
  })
  getPosicoesEstoque(@Req() req: ApiKeyAuthenticatedRequest) {
    return this.integracaoService.getPosicoesEstoque(
      req.apiKey,
      req.user!.regra,
    );
  }

  @Post('posicao-estoque')
  @ApiOperation({
    summary: 'Cadastrar Posição de Estoque',
    description:
      'Cria uma nova posição de estoque vinculada à filial da API Key.',
  })
  @ApiBody({
    type: IntegracaoCreatePosicaoEstoqueDto,
    examples: {
      default: {
        summary: 'Exemplo em branco',
        value: {
          nome: '',
          ativo: false,
        },
      },
      preenchido: {
        summary: 'Exemplo preenchido',
        value: {
          nome: 'Prateleira A1',
          ativo: true,
        },
      },
    },
  })
  createPosicaoEstoque(
    @Body() dto: IntegracaoCreatePosicaoEstoqueDto,
    @Req() req: ApiKeyAuthenticatedRequest,
  ) {
    return this.integracaoService.createPosicaoEstoque(
      dto,
      req.apiKey,
      req.user!.regra,
    );
  }

  @Put('posicao-estoque/:id')
  @ApiOperation({
    summary: 'Atualizar Posição de Estoque',
    description:
      'Atualiza uma posição de estoque existente. Só permite alterar registros que pertencem à filial da API Key.',
  })
  @ApiBody({
    type: IntegracaoUpdatePosicaoEstoqueDto,
    examples: {
      default: {
        summary: 'Exemplo em branco',
        value: {
          nome: '',
          ativo: false,
        },
      },
      preenchido: {
        summary: 'Exemplo preenchido',
        value: {
          nome: 'Prateleira A1',
          ativo: true,
        },
      },
    },
  })
  updatePosicaoEstoque(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: IntegracaoUpdatePosicaoEstoqueDto,
    @Req() req: ApiKeyAuthenticatedRequest,
  ) {
    return this.integracaoService.updatePosicaoEstoque(
      id,
      dto,
      req.apiKey,
      req.user!.regra,
    );
  }
}
