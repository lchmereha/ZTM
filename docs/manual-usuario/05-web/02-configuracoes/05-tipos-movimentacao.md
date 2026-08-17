# 05/02/05 — Tipos de Movimentação

## Sobre

Classifica as movimentações do sistema. Cada tipo define uma operação diferente no fluxo de inventário.

<!-- SCREENSHOT: tela-tipos-movimentacao -->

## Tipos Padrão

| Tipo | Descrição | Faz Baixa |
|------|-----------|:---------:|
| **IMPRESSAO** | Impressão de novas tags RFID para produtos | ❌ |
| **ASSOCIACAO** | Associação de tags RFID a itens já existentes | ❌ |
| **LEITURA** | Leitura de tags para inventário/verificação | ❌ |
| **CONFERENCIA** | Conferência de itens em posição de estoque | ❌ |
| **TRANSFERENCIA** | Transferência de itens entre filiais | ✅ |

## Campos do Cadastro

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| **Empresa** | Sim | Empresa proprietária |
| **Descrição** | Sim | Nome do tipo de movimentação |
| **Tipo** | Sim | Tipo de operação (IMPRESSAO, LEITURA, etc.) |
| **Faz Baixa** | Sim | Se este tipo dá baixa automática no estoque |
| **Ativo** | Sim | Se o tipo está disponível para uso |

## Como Cadastrar

1. ✏️ Clique em **"Novo"**
2. ✏️ Selecione a **Empresa**
3. ✏️ Informe a **Descrição** (ex: "Inventário Mensal", "Entrada por Compra")
4. ✏️ Selecione o **Tipo** de operação
5. ✏️ Marque **"Faz Baixa"** se esta movimentação deve remover itens do estoque
6. ✏️ Marque como **Ativo**
7. ✏️ Clique em **"Salvar"**

> ⚠️ Tipos de movimentação com movimentações vinculadas não podem ser excluídos.

> 💡 É possível criar múltiplos tipos da mesma operação (ex: "Leitura Diária" e "Leitura Semanal" ambos tipo LEITURA).

---
