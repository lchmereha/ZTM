# 05/02/03 — Filiais

## Sobre

Unidades operacionais do sistema (galpões, lojas, centros de distribuição). Cada filial opera de forma independente com seu próprio estoque e equipamentos.

<!-- SCREENSHOT: tela-filiais -->

## Campos do Cadastro

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| **Empresa** | Sim | Empresa proprietária |
| **Nome** | Sim | Nome da filial |
| **CEP** | Não | CEP para preenchimento automático do endereço |
| **Endereço** | Não | Logradouro |
| **Número** | Não | Número do endereço |
| **Cidade** | Não | Cidade |
| **Estado** | Não | Estado (UF) |
| **Telefone** | Não | Telefone de contato |
| **Documento** | Não | CNPJ/CPF da filial |
| **Etiqueta Padrão** | Não | Modelo de etiqueta padrão para impressão |

## Como Cadastrar

1. ✏️ Clique em **"Novo"**
2. ✏️ Selecione a **Empresa**
3. ✏️ Informe o **Nome** da filial
4. ✏️ Digite o **CEP** — o endereço é preenchido automaticamente (via API ViaCEP)
5. ✏️ Complete **Número** e outros campos se necessário
6. ✏️ Selecione a **Etiqueta Padrão** (se houver modelos cadastrados)
7. ✏️ Clique em **"Salvar"**

## Filtros

<!-- SCREENSHOT: filtro-filiais -->

- Nome da filial
- Empresa
- Cidade / Estado

> ⚠️ Filiais com movimentações ou tags vinculadas não podem ser excluídas. Para desativar, utilize o campo **ativo** (em implementação).

---
