import * as bcrypt from 'bcrypt';
import type { PrismaClient } from '../src/generated/prisma/client';

/**
 * População de demonstração.
 *
 * Existe para que revisores externos — hoje o time de review da Google Play —
 * consigam navegar por todas as telas do app sem depender de dados reais de
 * cliente. Nada aqui representa empresa, pessoa ou produto existente.
 *
 * Só roda com SEED_DEMO=true. Nunca deve ser habilitada em ambiente de cliente.
 *
 * É idempotente: reexecutar não duplica nada. Como a maioria das tabelas não
 * tem chave única natural, a identificação é feita por nome dentro do escopo
 * (empresa/filial), que é o que distingue os registros na prática.
 */

/** Empresa fictícia. Não é dado sensível — é o rótulo da massa de demonstração. */
const DEMO_COMPANY = 'Indústria Demonstração Ltda.';

// ZPL de exemplo. O ^CI28 é obrigatório para os acentos saírem corretos —
// a impressora assume code page 850 por padrão e o payload vai em UTF-8.
const DEMO_ZPL = `^XA^CI28
^FO40,40^A0N,34,34^FD{{produto.nome}}^FS
^FO40,90^A0N,26,26^FDCód.: {{produto.codigo}}^FS
^FO40,130^BY2^BCN,70,Y,N,N^FD{{tag.codigoRfid}}^FS
^XZ`;

export async function seedDemo(prisma: PrismaClient) {
  console.log('🎭 Semeando dados de DEMONSTRAÇÃO (SEED_DEMO=true)...');

  // Credenciais entregues à Google no campo "Acesso ao app" da Play Console.
  // Vêm do ambiente e nunca do código: uma senha literal aqui entra no
  // histórico do Git e não sai mais sem reescrever o histórico.
  const demoUser = process.env.DEMO_USERNAME;
  const demoPass = process.env.DEMO_PASSWORD;

  if (!demoUser || !demoPass) {
    throw new Error(
      'SEED_DEMO=true exige DEMO_USERNAME e DEMO_PASSWORD definidas no ambiente.',
    );
  }

  // ── Empresa ────────────────────────────────────────────────
  const empresa =
    (await prisma.empresa.findFirst({ where: { nome: DEMO_COMPANY } })) ??
    (await prisma.empresa.create({
      data: { nome: DEMO_COMPANY, corEsquema: '#F07E23' },
    }));

  // ── Filiais ────────────────────────────────────────────────
  const filiais = await upsertManyByName(
    'filial',
    [
      {
        nome: 'Matriz — Apucarana',
        cidade: 'Apucarana',
        estado: 'PR',
        cep: '86800000',
        endereco: 'Rua das Indústrias',
        numeroLogradouro: '1000',
        documentoIdentificacao: '11222333000181',
      },
      {
        nome: 'CD — Londrina',
        cidade: 'Londrina',
        estado: 'PR',
        cep: '86010000',
        endereco: 'Av. Logística',
        numeroLogradouro: '250',
        documentoIdentificacao: '11222333000262',
      },
    ],
    (nome) =>
      prisma.filial.findFirst({ where: { idEmpresa: empresa.id, nome } }),
    (data) =>
      prisma.filial.create({ data: { ...data, idEmpresa: empresa.id } }),
  );
  const [matriz, cd] = filiais;

  // ── Modelo de etiqueta ─────────────────────────────────────
  const [etiqueta] = await upsertManyByName(
    'modeloEtiqueta',
    [{ nome: 'Etiqueta Padrão 4x6', codigoZPL: DEMO_ZPL }],
    (nome) =>
      prisma.modeloEtiqueta.findFirst({
        where: { idEmpresa: empresa.id, nome },
      }),
    (data) =>
      prisma.modeloEtiqueta.create({
        data: { ...data, idEmpresa: empresa.id },
      }),
  );

  await prisma.filial.updateMany({
    where: { id: { in: [matriz.id, cd.id] }, idEtiquetaPadrao: null },
    data: { idEtiquetaPadrao: etiqueta.id },
  });

  // ── Categorias ─────────────────────────────────────────────
  const categorias = await upsertManyByName(
    'categoria',
    [
      { nome: 'Calçados de Segurança' },
      { nome: 'Proteção de Mãos' },
      { nome: 'Uniformes' },
    ],
    (nome) =>
      prisma.categoria.findFirst({ where: { idEmpresa: empresa.id, nome } }),
    (data) =>
      prisma.categoria.create({ data: { ...data, idEmpresa: empresa.id } }),
  );
  const [calcados, maos, uniformes] = categorias;

  // ── Produtos ───────────────────────────────────────────────
  const produtosSpec = [
    {
      codigo: 'DEMO-1001',
      nome: 'Botina de Segurança Bico Composite Nº 40',
      unidadeMedida: 'PAR',
      idCategoria: calcados.id,
    },
    {
      codigo: 'DEMO-1002',
      nome: 'Botina de Segurança Bico Composite Nº 42',
      unidadeMedida: 'PAR',
      idCategoria: calcados.id,
    },
    {
      codigo: 'DEMO-1003',
      nome: 'Sapato Ocupacional Antiderrapante Nº 39',
      unidadeMedida: 'PAR',
      idCategoria: calcados.id,
    },
    {
      codigo: 'DEMO-2001',
      nome: 'Luva de Proteção Anticorte Nível 5',
      unidadeMedida: 'PAR',
      idCategoria: maos.id,
    },
    {
      codigo: 'DEMO-2002',
      nome: 'Luva Nitrílica Cano Longo',
      unidadeMedida: 'PAR',
      idCategoria: maos.id,
    },
    {
      codigo: 'DEMO-3001',
      nome: 'Camisa Polo Uniforme Manga Curta — M',
      unidadeMedida: 'UN',
      idCategoria: uniformes.id,
    },
  ];

  const produtos = [];
  for (const p of produtosSpec) {
    produtos.push(
      await prisma.produto.upsert({
        where: { codigo: p.codigo },
        update: {
          nome: p.nome,
          unidadeMedida: p.unidadeMedida,
          idCategoria: p.idCategoria,
        },
        create: { ...p, idEmpresa: empresa.id, idModeloEtiqueta: etiqueta.id },
      }),
    );
  }

  // ── Posições de estoque ────────────────────────────────────
  const posicoes: Record<number, { id: number; nome: string }[]> = {};
  for (const filial of [matriz, cd]) {
    posicoes[filial.id] = await upsertManyByName(
      'posicaoEstoque',
      [
        { nome: 'Rua A — Nível 1' },
        { nome: 'Rua A — Nível 2' },
        { nome: 'Expedição' },
      ],
      (nome) =>
        prisma.posicaoEstoque.findFirst({
          where: { idFilial: filial.id, nome },
        }),
      (data) =>
        prisma.posicaoEstoque.create({
          data: { ...data, idFilial: filial.id },
        }),
    );
  }

  // ── Equipamentos ───────────────────────────────────────────
  const equipamentos = await upsertManyByName(
    'equipamento',
    [
      {
        nome: 'Impressora Zebra ZT411 (Demo)',
        tipo: 'IMPRESSORA' as const,
        ipConexao: '192.168.0.50',
        portaConexao: 9100,
      },
      {
        nome: 'Portal RFID Expedição (Demo)',
        tipo: 'ANTENA' as const,
        exibeConexaoSocket: true,
      },
      { nome: 'Coletor SLED (Demo)', tipo: 'SLED' as const },
    ],
    (nome) =>
      prisma.equipamento.findFirst({ where: { idFilial: matriz.id, nome } }),
    (data) =>
      prisma.equipamento.create({ data: { ...data, idFilial: matriz.id } }),
  );
  const impressora = equipamentos[0];

  // ── Tipos de movimentação (um por fluxo do app) ────────────
  const tipos = await upsertManyByName(
    'tipoMovimentacao',
    [
      { descricao: 'Impressão de Etiquetas', tipo: 'IMPRESSAO' as const },
      { descricao: 'Associação de Tags', tipo: 'ASSOCIACAO' as const },
      { descricao: 'Conferência de Estoque', tipo: 'CONFERENCIA' as const },
      {
        descricao: 'Transferência entre Filiais',
        tipo: 'TRANSFERENCIA' as const,
      },
      {
        descricao: 'Leitura / Baixa',
        tipo: 'LEITURA' as const,
        fazBaixa: true,
      },
    ],
    (descricao) =>
      prisma.tipoMovimentacao.findFirst({
        where: { idEmpresa: empresa.id, descricao },
      }),
    (data) =>
      prisma.tipoMovimentacao.create({
        data: { ...data, idEmpresa: empresa.id },
      }),
    'descricao',
  );
  const tipoPorFluxo = Object.fromEntries(tipos.map((t) => [t.tipo, t]));

  // ── Tags RFID ──────────────────────────────────────────────
  // EPCs de 24 hex, no mesmo formato das tags reais.
  const tags = [];
  for (let i = 0; i < produtos.length * 4; i++) {
    const produto = produtos[i % produtos.length];
    const codigoRfid = `E2801160600002${String(i).padStart(10, '0')}`.slice(
      0,
      24,
    );
    const posicoesFilial = posicoes[matriz.id];

    const existente = await prisma.tagRfid.findFirst({
      where: { idFilial: matriz.id, codigoRfid },
    });
    tags.push(
      existente ??
        (await prisma.tagRfid.create({
          data: {
            idFilial: matriz.id,
            idProduto: produto.id,
            codigoRfid,
            codigoUnico: `${produto.codigo}-${String(i).padStart(4, '0')}`,
            idPosicaoEstoque: posicoesFilial[i % posicoesFilial.length].id,
            lote: `LOTE-2026-${String((i % 3) + 1).padStart(2, '0')}`,
          },
        })),
    );
  }

  // ── Usuário de demonstração ────────────────────────────────
  const senhaHash = await bcrypt.hash(demoPass, 10);
  const demo = await prisma.usuario.upsert({
    where: { usuario: demoUser },
    update: { regra: 'OPERADOR', ativo: true },
    create: {
      nome: 'Usuário Demonstração',
      usuario: demoUser,
      senha: senhaHash,
      regra: 'OPERADOR',
      ativo: true,
    },
  });

  for (const filial of [matriz, cd]) {
    await prisma.usuarioFilial.upsert({
      where: {
        idUsuario_idFilial: { idUsuario: demo.id, idFilial: filial.id },
      },
      update: {},
      create: { idUsuario: demo.id, idFilial: filial.id },
    });
  }

  // Acesso de leitura a tudo, escrita nos módulos operacionais. O revisor
  // precisa navegar por todas as telas sem conseguir apagar nada.
  const menus = await prisma.opcaoMenu.findMany();
  for (const menu of menus) {
    const operacional = menu.chave.startsWith('MOV_');
    await prisma.permissaoUsuario.upsert({
      where: {
        idUsuario_idOpcaoMenu: { idUsuario: demo.id, idOpcaoMenu: menu.id },
      },
      update: {},
      create: {
        idUsuario: demo.id,
        idOpcaoMenu: menu.id,
        podeVisualizar: true,
        podeIncluir: operacional,
        podeAlterar: operacional,
        podeExcluir: false,
      },
    });
  }

  // ── Movimentações pendentes ────────────────────────────────
  // As situações abaixo não são decorativas: findPendentes() só devolve estas
  // combinações de tipo/situação, e é essa lista que o app mobile mostra na
  // home. Fora delas o revisor loga e encontra a tela vazia.
  //
  // São 12 por fluxo, e não uma: 8 cards já preenchem a tela do coletor, então
  // com 12 a lista rola. Um registro solitário por tela faz o app parecer
  // vazio nas capturas da loja e na navegação do revisor.
  const PENDENTES_POR_FLUXO = 12;

  /**
   * Monta as descrições de um fluxo. Elas precisam ser únicas porque o
   * controle de idempotência abaixo identifica a movimentação por `descricao`.
   */
  const serie = (rotulo: string, contexto: (i: number) => string) =>
    Array.from(
      { length: PENDENTES_POR_FLUXO },
      (_, i) => `${rotulo} — ${contexto(i)} (demo)`,
    );

  const fluxosPendentes = [
    {
      fluxo: 'IMPRESSAO',
      situacao: 'IMPORTADO' as const,
      descricoes: serie('Impressão', (i) => `lote de etiquetas OP ${1042 + i}`),
    },
    {
      fluxo: 'ASSOCIACAO',
      situacao: 'IMPORTADO' as const,
      descricoes: serie(
        'Associação',
        (i) => `entrada de produção OP ${2130 + i}`,
      ),
    },
    {
      fluxo: 'CONFERENCIA',
      situacao: 'IMPORTADO' as const,
      descricoes: serie(
        'Conferência',
        // A..L — uma rua por movimentação.
        (i) => `inventário Rua ${String.fromCharCode(65 + i)}`,
      ),
    },
    {
      fluxo: 'TRANSFERENCIA',
      situacao: 'IMPORTADO' as const,
      descricoes: serie('Transferência', (i) => `Matriz → CD, carga ${i + 1}`),
    },
    {
      fluxo: 'LEITURA',
      situacao: 'CRIADO' as const,
      descricoes: serie('Leitura', (i) => `baixa de expedição NF ${8801 + i}`),
    },
  ];

  const pendentes = fluxosPendentes.flatMap((f) =>
    f.descricoes.map((descricao, i) => ({
      fluxo: f.fluxo,
      situacao: f.situacao,
      descricao,
      // Número de linhas e de peças variando por registro: cards todos com a
      // mesma contagem denunciam massa gerada e deixam a tela artificial.
      totalItens: 2 + (i % Math.min(4, produtos.length - 1)),
      quantidade: 3 + (i % 5),
    })),
  );

  for (const p of pendentes) {
    const tipo = tipoPorFluxo[p.fluxo];
    const jaExiste = await prisma.movimentacao.findFirst({
      where: { idFilial: matriz.id, descricao: p.descricao },
    });
    if (jaExiste) continue;

    await prisma.movimentacao.create({
      data: {
        idFilial: matriz.id,
        idTipoMovimentacao: tipo.id,
        idUsuario: demo.id,
        idEquipamento: p.fluxo === 'IMPRESSAO' ? impressora.id : null,
        idFilialDestino: p.fluxo === 'TRANSFERENCIA' ? cd.id : null,
        situacao: p.situacao,
        descricao: p.descricao,
        importacaoItens: {
          create: produtos.slice(0, p.totalItens).map((produto) => ({
            codigo: produto.codigo,
            nome: produto.nome,
            unidadeMedida: produto.unidadeMedida,
            quantidade: p.quantidade,
          })),
        },
      },
    });
  }

  // Um histórico finalizado e um cancelado, para as telas de consulta e
  // relatório não aparecerem vazias.
  await criarHistorico(prisma, {
    idFilial: matriz.id,
    idTipoMovimentacao: tipoPorFluxo.CONFERENCIA.id,
    idUsuario: demo.id,
    tags: tags.slice(0, 6),
    descricao: 'Conferência concluída — semana anterior (demo)',
    situacao: 'FINALIZADO',
  });
  await criarHistorico(prisma, {
    idFilial: matriz.id,
    idTipoMovimentacao: tipoPorFluxo.LEITURA.id,
    idUsuario: demo.id,
    tags: [],
    descricao: 'Leitura cancelada — divergência de contagem (demo)',
    situacao: 'CANCELADO',
  });

  console.log(`   → Empresa: ${empresa.nome}`);
  console.log(`   → Filiais: ${matriz.nome}, ${cd.nome}`);
  console.log(`   → ${produtos.length} produtos, ${tags.length} tags RFID`);
  console.log(
    `   → ${pendentes.length} movimentações pendentes ` +
      `(${PENDENTES_POR_FLUXO} por fluxo do app)`,
  );
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Cria os registros que ainda não existem, identificando-os por um campo de
 * nome dentro do escopo já filtrado pelo `find`. A maioria das tabelas não tem
 * chave única natural, então `upsert` do Prisma não se aplica.
 */
async function upsertManyByName<T extends Record<string, unknown>, R>(
  _label: string,
  specs: T[],
  find: (nome: string) => Promise<R | null>,
  create: (data: T) => Promise<R>,
  nameField: keyof T = 'nome' as keyof T,
): Promise<R[]> {
  const out: R[] = [];
  for (const spec of specs) {
    const existente = await find(spec[nameField] as string);
    out.push(existente ?? (await create(spec)));
  }
  return out;
}

async function criarHistorico(
  prisma: PrismaClient,
  params: {
    idFilial: number;
    idTipoMovimentacao: number;
    idUsuario: number;
    tags: { id: number; codigoRfid: string }[];
    descricao: string;
    situacao: 'FINALIZADO' | 'CANCELADO';
  },
) {
  const jaExiste = await prisma.movimentacao.findFirst({
    where: { idFilial: params.idFilial, descricao: params.descricao },
  });
  if (jaExiste) return;

  await prisma.movimentacao.create({
    data: {
      idFilial: params.idFilial,
      idTipoMovimentacao: params.idTipoMovimentacao,
      idUsuario: params.idUsuario,
      situacao: params.situacao,
      descricao: params.descricao,
      dataProcessamento: params.situacao === 'FINALIZADO' ? new Date() : null,
      dataCancelamento: params.situacao === 'CANCELADO' ? new Date() : null,
      idUsuarioCancelamento:
        params.situacao === 'CANCELADO' ? params.idUsuario : null,
      itens: {
        create: params.tags.map((tag) => ({
          idTagRfid: tag.id,
          codigoRfid: tag.codigoRfid,
          ocorrencia: 'ENCONTRADO' as const,
        })),
      },
    },
  });
}
