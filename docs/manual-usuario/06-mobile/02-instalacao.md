# 06/02 — Instalação no Dispositivo

## Pré-requisitos

- Dispositivo Android 8.0+ (API 26+)
- Bluetooth 4.0+ (para leitores BLE)
- Conexão com a rede do servidor ZTM
- Permissões: Bluetooth, Localização, Armazenamento

## Instalação

### 1. Obter o APK

Solicite o arquivo APK à equipe de TI ou faça o download do link fornecido.

### 2. Permitir Instalação de Fontes Desconhecidas

1. ✏️ Acesse **Configurações > Segurança**
2. ✏️ Ative **"Instalar de fontes desconhecidas"**
3. ✏️ Confirme a instalação

### 3. Instalar o APK

1. ✏️ Localize o arquivo APK no dispositivo
2. ✏️ Toque para iniciar a instalação
3. ✏️ Aguarde a conclusão

### 4. Conceder Permissões

Ao abrir o app pela primeira vez, conceda as permissões solicitadas:

| Permissão | Motivo |
|-----------|--------|
| **Bluetooth** | Conectar ao leitor RFID |
| **Localização** | Necessário para escaneamento BLE no Android |
| **Armazenamento** | Salvar relatórios e configurações |

## Configuração Inicial

Após instalar, configure o servidor:

1. ✏️ Abra o app
2. ✏️ Toque no ícone de engrenagem na tela de login
3. ✏️ Informe a **URL do servidor** (ex: `http://192.168.1.100:3000`)
4. ✏️ Defina uma **senha de configurações** (protege o acesso às configurações)
5. ✏️ Salve as configurações

> 💡 A senha de configurações é definida pela variável `SETTINGS_PASSWORD` no ambiente do app.

<!-- SCREENSHOT: mobile-config-servidor -->

---
