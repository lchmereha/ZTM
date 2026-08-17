# 06/01 — App Mobile: Visão Geral

## Sobre

O **ZZTech Trace Module** é o aplicativo mobile do sistema ZTM, desenvolvido em Flutter para dispositivos Android. Ele permite a operação de inventário em campo utilizando leitores RFID e código de barras.

<!-- SCREENSHOT: mobile-home -->

## Funcionalidades

- **Leitura RFID** — Captura de tags via antena, sled ou dispositivo portátil
- **Leitura de Código de Barras** — Escaneamento de códigos de barras dos produtos
- **Criação de Movimentações** — Suporte aos 5 tipos: Impressão, Leitura, Associação, Conferência, Transferência
- **Impressão ZPL** — Impressão direta de etiquetas via TCP/IP
- **Dashboard Mobile** — Visualização de movimentações pendentes por categoria

## Equipamentos Suportados

### Leitores RFID

| Fabricante | Modelos | Conexão |
|-----------|---------|---------|
| Chainway | Dispositivos portáteis | BLE |
| Honeywell | IH25, R6, C72 | BLE |
| Impinj | R3, UR4 | WebSocket (antenas fixas) |

### Código de Barras

Leitores de código de barras acoplados via USB ou Bluetooth são suportados através do pacote `barcode_scanner`.

## Telas do App

| Rota | Tela | Função |
|------|------|--------|
| `/login` | Login | Autenticação do usuário |
| `/settings` | Configurações | Configuração do servidor e leitores |
| `/filial-selection` | Seleção de Filial | Escolha da filial ativa |
| `/home` | Home | Dashboard e lista de movimentações |
| `/impressao` | Impressão | Operação de impressão de tags |
| `/leitura` | Leitura | Leitura e baixa de tags |
| `/associacao` | Associação | Associação de tags a produtos |
| `/conferencia` | Conferência | Conferência de estoque |
| `/transferencia` | Transferência | Transferência entre filiais |

---
