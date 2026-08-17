# 05/02/04 — Equipamentos

## Sobre

Cadastro dos equipamentos utilizados nas operações. Cada filial pode ter múltiplos equipamentos de diferentes tipos.

<!-- SCREENSHOT: tela-equipamentos -->

## Tipos de Equipamento

| Tipo | Descrição | Conexão |
|------|-----------|---------|
| **IMPRESSORA** | Impressora térmica ZPL | Rede (TCP/IP) |
| **ANTENA** | Leitor RFID fixo (Impinj) | Rede (WebSocket) |
| **SLED** | Leitor RFID portátil | Bluetooth (BLE) |

## Campos do Cadastro

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| **Filial** | Sim | Filial onde o equipamento está alocado |
| **Nome** | Sim | Nome de identificação do equipamento |
| **Tipo** | Sim | Tipo: IMPRESSORA, ANTENA ou SLED |
| **IP** | Não | Endereço IP do equipamento |
| **Porta** | Não | Porta de conexão |
| **Ativo** | Sim | Se o equipamento está disponível para uso |

## Como Cadastrar

1. ✏️ Clique em **"Novo"**
2. ✏️ Selecione a **Filial**
3. ✏️ Informe o **Nome** (ex: "Impressora Galpão 1", "Antena Docas")
4. ✏️ Selecione o **Tipo**
5. ✏️ Informe **IP** e **Porta** (para impressoras e antenas)
6. ✏️ Marque como **Ativo**
7. ✏️ Clique em **"Salvar"**

> 💡 Equipamentos ativos aparecem como opção na criação de movimentações.

## Filtros

- Nome
- Tipo (IMPRESSORA / ANTENA / SLED)
- Filial
- Ativo / Inativo

---
