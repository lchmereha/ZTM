# ZTM Mobile — ZZTech Trace Module

Aplicativo mobile Flutter para coleta RFID e leitura de código de barras,
integrado ao Sistema Direcional de Inventário (RFID).

---

## Stack

| Tecnologia | Versão | Finalidade |
|-----------|--------|-----------|
| Flutter | 3.x | Framework mobile |
| Dart SDK | ^3.12 | Linguagem |
| Get | ^4.7 | Gerenciamento de estado |
| Get Storage | ^2.1 | Armazenamento local |
| http | ^1.6 | HTTP client |
| flutter_blue_plus | ^2.3 | Bluetooth LE |
| permission_handler | ^12.0 | Permissões de dispositivo |
| Material Symbols | ^4.29 | Ícones |

### Pacotes Locais (Hardware)

| Pacote | Caminho | Função |
|--------|---------|--------|
| `rfid_reader` | `../../../Flutter/packages/rfid_reader` | Leitura de tags RFID |
| `barcode_scanner` | `../../../Flutter/packages/barcode_scanner` | Leitura de código de barras |

---

## Funcionalidades

- **Leitura RFID**: Coleta de tags via leitor acoplado (Bluetooth)
- **Código de Barras**: Leitura via câmera do dispositivo
- **Bluetooth LE**: Comunicação com dispositivos compatíveis
- **Dashboard**: Indicadores em tempo real
- **Movimentações**: Criação e acompanhamento de movimentações
- **Consulta de Estoque**: Visualização de posições e saldos

---

## Setup

### Pré-requisitos

- Flutter SDK 3.12+
- Pacotes locais nos caminhos:
  - `../../../Flutter/packages/rfid_reader`
  - `../../../Flutter/packages/barcode_scanner`

### Configuração

```bash
# Instalar dependências
flutter pub get

# Configurar ambiente
cp .env.example .env
# Edite .env com a URL do backend
```

### Executar

```bash
flutter run
```

---

## Estrutura

```
mobile/
├── lib/
│   ├── main.dart          # Entry point
│   └── src/               # Código fonte
├── assets/
│   ├── images/            # Imagens do app
│   └── fonts/             # Fontes (UbuntuMono)
├── android/               # Configuração Android
├── pubspec.yaml           # Dependências
├── flutter_launcher_icons.yaml  # Ícones do app
├── flutter_native_splash.yaml   # Splash screen
└── l10n.yaml              # Localização
```
