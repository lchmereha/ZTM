# 05/03/02 — Produtos

## Sobre

Cadastro central dos itens gerenciados pelo sistema. Cada produto pode ter múltiplas tags RFID vinculadas.

<!-- SCREENSHOT: tela-produtos -->

## Campos do Cadastro

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| **Empresa** | Sim | Empresa proprietária |
| **Código** | Sim | Código único do produto (ex: SKU, EAN) |
| **Nome** | Sim | Nome/descrição do produto |
| **Unidade de Medida** | Sim | Ex: UN, KG, CX, LT |
| **Categoria** | Não | Categoria do produto |
| **Modelo de Etiqueta** | Não | Template ZPL para impressão |

## Como Cadastrar

1. ✏️ Clique em **"Novo"**
2. ✏️ Informe o **Código** (único no sistema)
3. ✏️ Informe o **Nome** do produto
4. ✏️ Selecione a **Unidade de Medida**
5. ✏️ Opcional: selecione a **Categoria**
6. ✏️ Opcional: selecione o **Modelo de Etiqueta** padrão
7. ✏️ Clique em **"Salvar"**

## Combos

O endpoint `GET /produto/combo` retorna produtos para seleção em formulários (movimentações, tags).

## Filtros

<!-- SCREENSHOT: filtro-produtos -->

- Código
- Nome
- Categoria
- Modelo de Etiqueta

> 💡 Use códigos padronizados (SKU/EAN) para facilitar integração com sistemas externos.

---
