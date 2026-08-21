import 'dart:convert' show JsonEncoder;
import 'package:get/get.dart';

/// Configuração injetada em tempo de compilação via `--dart-define`.
///
/// Antes isso vinha de um `.env` empacotado como asset do Flutter, o que
/// deixava a senha das configurações manuais legível com um
/// `unzip app.apk && cat assets/.env`. Com `--dart-define` o valor é embutido
/// no snapshot AOT — não é segredo forte (ainda aparece em `strings` do
/// binário), mas deixa de ser texto puro dentro do pacote.
///
/// Build de produção:
///   flutter build appbundle \
///     --dart-define=BUILD_MODE=PRODUCTION \
///     --dart-define=SETTINGS_PASSWORD=`a-senha`
class EnvManager extends GetxService {
  static const _buildMode = String.fromEnvironment(
    'BUILD_MODE',
    defaultValue: 'PRODUCTION',
  );

  /// Sem valor padrão de propósito: um build que esqueça o `--dart-define`
  /// deve travar a aba Manual, não liberá-la com uma senha conhecida.
  static const _settingsPassword = String.fromEnvironment('SETTINGS_PASSWORD');

  // ── Servidor pré-carregado ─────────────────────────────────────────────
  //
  // Valor INICIAL do servidor, usado enquanto o operador não configurar nada.
  // Assim que ele salva pelo QR code ou pela aba Manual, o que está no
  // GetStorage prevalece — estes valores nunca sobrescrevem configuração
  // existente (ver `_Defaults` em settings/settings.dart).
  //
  // Existe para o build da Play Store: sem isso o revisor do Google precisaria
  // da SETTINGS_PASSWORD só para digitar o endereço do servidor, o que
  // obrigaria a informar a senha de configuração a terceiros. Um build de
  // cliente simplesmente não passa estas variáveis e o app começa sem
  // servidor, exatamente como antes.
  //
  //   flutter build appbundle \
  //     --dart-define=SERVER_PROTOCOL=https \
  //     --dart-define=SERVER_HOST=ztm.zztech.com.br \
  //     --dart-define=SERVER_ENDPOINT=/ztm/api

  static const _protocoloInformado = String.fromEnvironment(
    'SERVER_PROTOCOL',
    defaultValue: 'http',
  );

  /// Só http/https, pela mesma razão que `ServerConfig` rejeita outros
  /// esquemas no QR code: um valor arbitrário aqui iria direto para a URL base
  /// de todas as requisições. Um erro de digitação no build cai em `http` e
  /// aparece na primeira tentativa de conexão.
  static const serverProtocol =
      (_protocoloInformado == 'http' || _protocoloInformado == 'https')
      ? _protocoloInformado
      : 'http';

  static const serverHost = String.fromEnvironment('SERVER_HOST');

  static const serverEndpoint = String.fromEnvironment(
    'SERVER_ENDPOINT',
    defaultValue: '/',
  );

  /// `int.fromEnvironment` é const, `int.tryParse` não seria. O 0 representa
  /// "sem porta explícita" — a URL usa a porta padrão do esquema.
  static const _portaInformada = int.fromEnvironment('SERVER_PORT');
  static const int? serverPort = _portaInformada == 0 ? null : _portaInformada;

  /// `false` quando o build não recebeu `SERVER_HOST` — o app abre sem
  /// servidor e exige configuração por QR code ou pela aba Manual.
  bool get isServerPreconfigured => serverHost.isNotEmpty;

  String get buildMode => _buildMode;

  /// `false` quando o build não recebeu a senha — nesse caso a configuração
  /// manual fica indisponível em vez de aceitar qualquer entrada.
  bool get isSettingsPasswordConfigured => _settingsPassword.isNotEmpty;

  bool matchesSettingsPassword(String entrada) {
    if (!isSettingsPasswordConfigured) return false;
    return entrada.trim().toUpperCase() == _settingsPassword.toUpperCase();
  }

  Map<String, Object?> toMap() => {
    'BUILD_MODE': buildMode,
    'SETTINGS_PASSWORD_CONFIGURED': isSettingsPasswordConfigured,
    'SERVER_PRECONFIGURED': isServerPreconfigured,
    'SERVER_PROTOCOL': serverProtocol,
    'SERVER_HOST': serverHost,
    'SERVER_PORT': serverPort,
    'SERVER_ENDPOINT': serverEndpoint,
  };

  @override
  String toString() => JsonEncoder.withIndent('  ').convert(toMap());
}
