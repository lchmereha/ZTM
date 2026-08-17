# 06/05 — Impressão de Etiquetas ZPL

## Sobre

O app mobile pode imprimir etiquetas diretamente em impressoras Zebra (ou compatíveis ZPL) via conexão TCP/IP.

<!-- SCREENSHOT: mobile-impressao-zpl -->

## Pré-requisitos

- Impressora térmica ZPL configurada no sistema (tipo IMPRESSORA)
- Dispositivo mobile na mesma rede da impressora
- Modelo de etiqueta cadastrado no sistema

## Fluxo de Impressão

1. ✏️ Crie uma movimentação do tipo **IMPRESSAO** no sistema
2. ✏️ Importe os itens (CSV ou manual)
3. ✏️ Processe os itens para gerar as tags RFID
4. ✏️ No app mobile, acesse a movimentação de impressão
5. ✏️ Selecione a **impressora** configurada
6. ✏️ O app envia o comando ZPL via TCP/IP
7. ✏️ A etiqueta é impressa com os dados do produto e código RFID

## Exemplo de Etiqueta Impressa

<!-- SCREENSHOT: etiqueta-impressa-fisica -->

A etiqueta pode conter:
- Nome do produto
- Código RFID (em texto e/ou código de barras)
- Lote e data de validade
- Código de barras do produto
- Logotipo da empresa
- Nome da filial

## Troubleshooting

| Problema | Causa Provável | Solução |
|----------|---------------|---------|
| Impressora não aparece | IP incorreto | Verifique IP configurado no sistema |
| Etiqueta sai em branco | ZPL inválido | Verifique o modelo de etiqueta |
| Impressão cortada | Template muito grande | Reduza o tamanho dos elementos ZPL |
| Não imprime | Porta errada | Padrão ZPL é porta 9100 |

> 💡 Mantenha as impressoras na mesma sub-rede do dispositivo móvel para evitar problemas de conectividade.

---
