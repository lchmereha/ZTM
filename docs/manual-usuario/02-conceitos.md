# 02 — Conceitos e Glossário

## Glossário de Termos

### RFID

| Termo | Descrição |
|-------|-----------|
| **RFID** | Radio-Frequency Identification — tecnologia de identificação por radiofrequência |
| **Tag RFID** | Etiqueta eletrônica com chip que armazena um código único (EPC) |
| **EPC** | Electronic Product Code — código gravado na tag RFID |
| **Antena RFID** | Dispositivo fixo que emite sinal de rádio para ler tags a distância |
| **Sled RFID** | Leitor portátil acoplado a um celular para leitura em campo |
| **Impinj** | Marca de leitores RFID profissionais (modelos R3, UR4) |
| **Chainway** | Marca de coletores RFID portáteis |
| **Honeywell** | Marca de coletores RFID (modelos IH25, R6, C72) |
| **BLE** | Bluetooth Low Energy — conexão sem fio usada pelos leitores portáteis |
| **RSSI** | Received Signal Strength Indicator — intensidade do sinal da tag |
| **Tempo de Leitura** | Período contínuo em que o leitor captura tags |

### ZPL

| Termo | Descrição |
|-------|-----------|
| **ZPL** | Zebra Programming Language — linguagem de impressão de etiquetas |
| **Impressora ZPL** | Impressora térmica que interpreta comandos ZPL |
| **Modelo de Etiqueta** | Template ZPL com variáveis para impressão personalizada |

### Inventário e Movimentação

| Termo | Descrição |
|-------|-----------|
| **Filial** | Unidade operacional (galpão, loja, centro de distribuição) |
| **Posição de Estoque** | Localização física dentro da filial (prateleira, dock, sala) |
| **Movimentação** | Evento de entrada/saída/transferência de itens no estoque |
| **Tipo de Movimentação** | Classificação: Impressão, Associação, Leitura, Conferência, Transferência |
| **Baixa** | Ação de dar baixa em um item (remover do estoque ativo) |
| **Lote** | Conjunto de itens produzidos em mesma data/fabricação |
| **Unidade de Medida** | Ex: UN (unidade), KG (quilo), CX (caixa) |
| **Código de Barras** | Código numérico impresso em produtos (código de fábrica) |
| **Código Único** | Identificador opcional adicional por unidade |

### Situações de Movimentação

| Situação | Descrição |
|----------|-----------|
| **CRIADO** | Movimentação criada, aguardando dados |
| **IMPORTADO** | Dados de importação carregados (CSV ou manual) |
| **PROCESSADO** | Tags RFID processadas/validadas |
| **FINALIZADO** | Movimentação concluída |

### Perfis e Segurança

| Termo | Descrição |
|-------|-----------|
| **ADMIN** | Perfil com acesso total ao sistema |
| **OPERADOR** | Perfil com acesso restrito por permissões |
| **API Key** | Chave de autenticação para integração via API REST |
| **JWT** | JSON Web Token — token de autenticação |
| **Sliding Token** | Renovação automática do token a cada requisição |

### Equipamentos

| Tipo | Descrição |
|------|-----------|
| **IMPRESSORA** | Impressora térmica ZPL para etiquetas |
| **ANTENA** | Leitor RFID fixo (Impinj) conectado via rede |
| **SLED** | Leitor RFID portátil conectado via Bluetooth |

---
