# 05/04 — Movimentações

## Visão Geral

As movimentações são o coração do sistema. Representam qualquer evento de entrada, saída ou movimentação de itens no estoque.

<!-- SCREENSHOT: tela-movimentacoes -->

## Ciclo de Vida

```
CRIADO → IMPORTADO → PROCESSADO → FINALIZADO
```

| Situação | Descrição |
|----------|-----------|
| **CRIADO** | Movimentação criada, aguardando dados |
| **IMPORTADO** | Itens importados (CSV ou manual) |
| **PROCESSADO** | Tags validadas e processadas |
| **FINALIZADO** | Operação concluída |

## Tipos de Movimentação

### IMPRESSAO — Impressão de Tags

Cria novas tags RFID para produtos existentes.

**Fluxo:**
1. ✏️ Crie a movimentação selecionando filial, tipo IMPRESSAO e equipamento
2. ✏️ **Importe** os itens (CSV ou manualmente)
3. ✏️ **Processe** os itens — o sistema gera as tags RFID
4. ✏️ **Imprima** as etiquetas ZPL (via impressora térmica)
5. ✏️ **Finalize** a movimentação

**Opções de Importação:**
- **CSV:** Faça upload de arquivo com colunas: código, nome, quantidade, lote, validade
- **Manual:** Adicione itens um a um via formulário

<!-- SCREENSHOT: movimentacao-impressao -->

### LEITURA — Leitura de Tags

Leitura de tags RFID para inventário ou verificação.

**Sub-tipos:**

| Sub-tipo | Descrição |
|----------|-----------|
| **Simples** | Apenas leitura local, sem alteração no servidor |
| **Baixa** | Leitura com baixa automática no estoque |
| **Relatório** | Geração de relatório comparativo |

**Fluxo (Baixa):**
1. ✏️ Crie a movimentação tipo LEITURA com `fazBaixa` ativo
2. ✏️ Selecione equipamento e inicie a leitura
3. ✏️ O sistema valida as tags lidas contra o esperado
4. ✏️ Confirme a baixa dos itens selecionados
5. ✏️ Finalize a movimentação

<!-- SCREENSHOT: movimentacao-leitura -->

### ASSOCIACAO — Associação de Tags

Vincula tags RFID a itens que já estão no estoque mas ainda não possuem tag.

**Fluxo:**
1. ✏️ Crie a movimentação tipo ASSOCIACAO
2. ✏️ Selecione os produtos que receberão tags
3. ✏️ Leia as tags RFID com o leitor
4. ✏️ O sistema associa cada tag a um produto
5. ✏️ Conclua e finalize

<!-- SCREENSHOT: movimentacao-associacao -->

### CONFERENCIA — Conferência de Itens

Confronta o estoque registrado com a leitura física.

**Fluxo:**
1. ✏️ Crie a movimentação tipo CONFERENCIA
2. ✏️ Selecione os produtos a conferir
3. ✏️ Leia as tags RFID dos itens físicos
4. ✏️ O sistema compara: encontrados vs. não encontrados
5. ✏️ Gere relatório de divergências
6. ✏️ Finalize

<!-- SCREENSHOT: movimentacao-conferencia -->

### TRANSFERENCIA — Transferência entre Filiais

Move itens de uma filial para outra, com baixa automática na origem.

**Fluxo:**
1. ✏️ Crie a movimentação tipo TRANSFERENCIA
2. ✏️ Selecione a **filial destino**
3. ✏️ Selecione os itens a transferir
4. ✏️ Leia as tags RFID para confirmar
5. ✏️ Conclua — os itens recebem baixa na origem
6. ✏️ Finalize

> ⚠️ Transferência sempre dá baixa nos itens da filial de origem.

<!-- SCREENSHOT: movimentacao-transferencia -->

## Criando uma Movimentação

### Passo 1: Dados Básicos

✏️ Clique em **"Nova Movimentação"** e preencha:

| Campo | Descrição |
|-------|-----------|
| **Filial** | Filial de origem |
| **Tipo** | Tipo de movimentação (configurado em Tipos de Movimentação) |
| **Equipamento** | Equipamento utilizado (opcional) |
| **Descrição** | Descrição da movimentação |

### Passo 2: Importar Itens

Dependendo do tipo, importe os itens via **CSV** ou **manual**.

**Formato CSV:**
```csv
codigo,nome,unidadeMedida,quantidade,lote,dataValidade
PROD001,Parafuso 10mm,UN,100,LOTE001,2026-12-31
PROD002,Porca 8mm,UN,200,LOTE001,2026-12-31
```

> 💡 Use o template disponível no sistema para garantir o formato correto.

### Passo 3: Processar

O sistema valida os itens importados e, para IMPRESSAO, gera as tags RFID automaticamente.

### Passo 4: Imprimir (IMPRESSAO)

Para movimentações de impressão, selecione uma impressora ZPL configurada e imprima as etiquetas.

### Passo 5: Finalizar

Confirme a finalização. Movimentações finalizadas não podem ser alteradas.

## Filtros

<!-- SCREENSHOT: filtro-movimentacoes -->

- Descrição
- Tipo de Movimentação
- Situação (CRIADO, IMPORTADO, PROCESSADO, FINALIZADO)
- Equipamento
- Filial
- Período (data de criação)
- Código de Integração

## Ações em Massa

- **Importar CSV** — Upload de arquivo com itens
- **Processar Lote** — Processar múltiplas tags de uma vez
- **Imprimir Lote** — Imprimir etiquetas em lote

## Integração

Movimentações podem ser criadas automaticamente via API de integração. Consulte a [documentação da API](../09-api-integracao.md) para detalhes.

---
