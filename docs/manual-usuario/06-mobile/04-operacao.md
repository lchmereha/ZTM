# 06/04 — Operação no App Mobile

## Home — Tela Inicial

<!-- SCREENSHOT: mobile-home -->

A tela inicial exibe:
- **Menu lateral** com os 5 tipos de movimentação
- **Lista de movimentações pendentes** filtradas pelo tipo selecionado
- **Botão de refresh** para atualizar a lista

## Conectando o Leitor RFID

### Bluetooth (SLED / Portátil)

1. ✏️ No dispositivo Android, ative o **Bluetooth** e a **Localização**
2. ✏️ No app, acesse a tela de operação que utiliza RFID
3. ✏️ Toque no ícone de Bluetooth para **buscar dispositivos**
4. ✏️ Selecione o leitor na lista (ex: "Chainway-SLED-01")
5. ✏️ Aguarde a conexão (o indicador ficará verde)

### WebSocket (Antena Fixa)

Antenas Impinj (R3, UR4) conectam via WebSocket automaticamente quando configuradas no sistema.

## Operação por Tipo

### Impressão

1. ✏️ Selecione a movimentação de impressão na lista
2. ✏️ **Importe** itens (seleção manual ou leitura de código de barras)
3. ✏️ Confirme a **impressão** das etiquetas
4. ✏️ Cole as etiquetas nos produtos físicos

<!-- SCREENSHOT: mobile-impressao -->

### Leitura

1. ✏️ Selecione a movimentação de leitura
2. ✏️ Escolha o modo: **Simples** (local) ou **Baixa** (servidor)
3. ✏️ Inicie a leitura — aponte o leitor para as tags
4. ✏️ Acompanhe as tags lidas em tempo real
5. ✏️ Para baixa: confirme os itens selecionados
6. ✏️ Finalize

<!-- SCREENSHOT: mobile-leitura -->

### Associação

1. ✏️ Selecione a movimentação de associação
2. ✏️ Leia o **código de barras** do produto
3. ✏️ Leia a **tag RFID** a ser associada
4. ✏️ Confirme a associação
5. ✏️ Repita para cada item
6. ✏️ Conclua e finalize

### Conferência

1. ✏️ Selecione a movimentação de conferência
2. ✏️ Veja a lista de produtos esperados
3. ✏️ Leia as tags RFID — o sistema marca como **Encontrado** ou **Não Encontrado**
4. ✏️ Gere relatório de divergências
5. ✏️ Finalize

### Transferência

1. ✏️ Selecione a movimentação de transferência
2. ✏️ Confirme a filial destino
3. ✏️ Leia as tags dos itens a transferir
4. ✏️ Conclua — os itens são baixados da origem
5. ✏️ Finalize

## Indicadores de Leitura

Durante a leitura RFID, o app exibe:

| Indicador | Significado |
|-----------|-------------|
| ✅ Verde | Tag válida / encontrada |
| ⚠️ Amarelo | Tag com alerta (ex: produto diferente) |
| ❌ Vermelho | Tag não esperada / erro |
| 🔵 Azul | Lendo / em andamento |

<!-- SCREENSHOT: mobile-leitura-tags -->

> ⚠️ Mantenha o leitor RFID estável durante a leitura. Movimentos bruscos podem causar perda de leitura.

> 💡 Configure a potência do leitor nas configurações do app para ajustar o alcance de leitura.

---
