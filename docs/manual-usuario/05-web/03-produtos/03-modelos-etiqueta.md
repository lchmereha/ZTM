# 05/03/03 — Modelos de Etiqueta

## Sobre

Templates de etiqueta em linguagem ZPL (Zebra Programming Language) para impressão térmica. Cada modelo define o layout visual da etiqueta que será colada nos produtos.

<!-- SCREENSHOT: tela-modelos-etiqueta -->

## Campos do Cadastro

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| **Empresa** | Sim | Empresa proprietária |
| **Nome** | Sim | Nome do modelo |
| **Código ZPL** | Sim | Código ZPL da etiqueta (múltiplas linhas) |
| **Ativo** | Sim | Se o modelo está disponível |

## Variáveis ZPL

No código ZPL, utilize variáveis `{{variavel}}` que serão substituídas automaticamente na impressão:

| Variável | Descrição |
|----------|-----------|
| `{{produto.nome}}` | Nome do produto |
| `{{produto.codigo}}` | Código do produto |
| `{{produto.unidadeMedida}}` | Unidade de medida |
| `{{tag.codigoRfid}}` | Código RFID da tag |
| `{{tag.codigoUnico}}` | Código único opcional |
| `{{tag.lote}}` | Número do lote |
| `{{tag.dataValidade}}` | Data de validade |
| `{{tag.dataFabricacao}}` | Data de fabricação |
| `{{tag.posicaoEstoque}}` | Posição de estoque |
| `{{tag.qtdeUMVolume}}` | Quantidade por volume |
| `{{filial.nome}}` | Nome da filial |

## Exemplo de Código ZPL

```zpl
^XA
^FO50,50^A0N,40,40^FD{{produto.nome}}^FS
^FO50,100^BY2^BCN,80,N^FD{{tag.codigoRfid}}^FS
^FO50,200^A0N,30,30^FDLote: {{tag.lote}}^FS
^FO50,240^A0N,30,30^FDVal: {{tag.dataValidade}}^FS
^FO50,280^A0N,30,30^FD{{filial.nome}}^FS
^XZ
```

## Como Criar

1. ✏️ Clique em **"Novo"**
2. ✏️ Selecione a **Empresa**
3. ✏️ Informe o **Nome** do modelo
4. ✏️ Digite o **Código ZPL** com as variáveis desejadas
5. ✏️ Marque como **Ativo**
6. ✏️ Clique em **"Salvar"**

## Filtros

<!-- SCREENSHOT: filtro-modelos-etiqueta -->

- Nome
- Ativo / Inativo

> 💡 Teste o ZPL em uma impressora Zebra antes de usar em produção. Utilize o software ZebraDesigner para criar layouts visualmente.

<!-- SCREENSHOT: exemplo-etiqueta-impressa -->

---
