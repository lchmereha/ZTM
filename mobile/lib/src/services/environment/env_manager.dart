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
  };

  @override
  String toString() => JsonEncoder.withIndent('  ').convert(toMap());
}
