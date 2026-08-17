# 05/03/04 — Tags RFID

## Sobre

Gerencia o vínculo entre tags RFID físicas e produtos no sistema. Cada tag representa uma etiqueta RFID única colada em um item.

<!-- SCREENSHOT: tela-tags-rfid -->

## Campos do Cadastro

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| **Filial** | Sim | Filial onde a tag está alocada |
| **Produto** | Sim | Produto vinculado à tag |
| **Código RFID** | Sim | Código EPC gravado na tag |
| **Código Único** | Não | Identificador adicional por unidade |
| **Posição de Estoque** | Não | Localização física |
| **Lote** | Não | Número do lote do produto |
| **Data de Validade** | Não | Data de validade |
| **Data de Fabricação** | Não | Data de fabricação |
| **Data de Baixa** | Não* | Preenchido automaticamente ao dar baixa |
| **Qtde por Volume** | Não | Quantidade de unidades por embalagem |

## Como Cadastrar

1. ✏️ Clique em **"Novo"**
2. ✏️ Selecione a **Filial**
3. ✏️ Selecione o **Produto**
4. ✏️ Informe o **Código RFID** (lido do leitor ou digitado)
5. ✏️ Opcional: preencha os demais campos (lote, validade, posição)
6. ✏️ Clique em **"Salvar"**

## Cadastro em Massa

Tags também podem ser criadas em lote durante uma movimentação do tipo **IMPRESSAO**, onde o sistema gera ou importa múltiplos registros de uma só vez.

## Filtros

<!-- SCREENSHOT: filtro-tags-rfid -->

- Código RFID
- Produto
- Filial
- Posição de Estoque
- Lote
- Data de Validade
- Com Baixa / Sem Baixa

> 💡 O código RFID é o EPC gravado na memória da tag. Utilize um leitor RFID para capturar o código automaticamente.

<!-- SCREENSHOT: leitor-rfid-lendo-tag -->

---
