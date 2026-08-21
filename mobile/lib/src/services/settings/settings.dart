import 'dart:convert' show JsonEncoder;
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:rfid_reader/rfid_devices.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/services/environment/env_manager.dart';
import 'package:ztm/src/services/log/log.dart';

enum PrefEntry {
  servidor('servidor'),
  buzzer('buzzer'),
  delim('delim'),
  endpoint('path'),
  httpProtocol('http_protocol'),
  lotesDeLeitura('lotes_leitura'),
  pathAtualizacao('path_atual_apk'),
  porta('port'),
  potencia('potencia'),
  rfidDevice('rfid_device'),
  rssiMinimo('rssi_minimo'),
  rssiMaximo('rssi_maximo'),
  rssiMinimoEnabled('rssi_minimo_enabled'),
  tagFocus('tag_focus'),
  timeout('timeout'),
  wsProtocol('ws_protocol'),
  wsEndpoint('ws_endpoint'),
  themeMode('theme_mode');

  final String name;
  const PrefEntry(this.name);
}

abstract class _Defaults {
  const _Defaults._();

  // Os quatro campos de conexão vêm do EnvManager, que os resolve por
  // `--dart-define` no momento do build. Sem essas variáveis eles valem
  // exatamente o que valiam antes ('', '/', 'http', null), então um build de
  // cliente continua abrindo sem servidor configurado.
  //
  // São só o valor inicial: `init()` lê o GetStorage primeiro e só cai aqui
  // quando não há nada salvo, de modo que a configuração feita pelo operador
  // nunca é sobrescrita.
  static const servidor = EnvManager.serverHost;
  static const endpoint = EnvManager.serverEndpoint;
  static const httpProtocol = EnvManager.serverProtocol;
  static const int? porta = EnvManager.serverPort;

  static const buzzer = true;
  static const lotesDeLeitura = 100;
  static const pathAtualizacao = '';
  static const potencia = Constants.rfidPowerMax;
  static const RfidDevices? rfidDevice = null;
  static const rssiMinimo = 0.0;
  static const rssiMaximo = 100.0;
  static const rssiFilterEnabled = false;
  static const tagFocus = false;
  static const timeout = 20;
  static const wsProtocol = 'ws';
  static const wsEndpoint = 'RFID';
  static const themeMode = 'system';
}

const _httpProtocolsSuportados = {'http', 'https'};

class SettingsService extends GetxService {
  static const _container = 'ZTM_Settings';
  final _box = GetStorage(_container);

  Future<SettingsService> init() async {
    await GetStorage.init(_container);

    servidor.value = _box.read(PrefEntry.servidor.name) ?? _Defaults.servidor;
    // A porta é o único campo de conexão em que `null` é um valor legítimo
    // ("porta padrão do esquema"), então `?? _Defaults.porta` não serve: ele
    // não distingue "nunca configurado" de "configurado sem porta" e
    // reaplicaria a porta do build por cima de uma escolha do operador. O
    // fluxo de salvamento (QR e Manual) grava sempre a chave, mesmo nula, e o
    // GetStorage mantém chaves nulas no mapa — logo a presença da chave é o
    // sinal confiável de que o operador já configurou.
    porta.value = _jaConfigurado(PrefEntry.porta)
        ? _box.read(PrefEntry.porta.name)
        : _Defaults.porta;
    endpoint.value = _box.read(PrefEntry.endpoint.name) ?? _Defaults.endpoint;
    httpProtocol.value =
        _box.read(PrefEntry.httpProtocol.name) ?? _Defaults.httpProtocol;
    delim.value = _box.read(PrefEntry.delim.name);
    pathAtualizacao.value =
        _box.read(PrefEntry.pathAtualizacao.name) ?? _Defaults.pathAtualizacao;

    final savedRfidDevice = _box.read<String>(PrefEntry.rfidDevice.name);
    if (savedRfidDevice != null) {
      rfidDevice.value = RfidDevices.values.firstWhereOrNull(
        (e) => e.name == savedRfidDevice,
      );
    }

    buzzer.value = _box.read(PrefEntry.buzzer.name) ?? _Defaults.buzzer;
    tagFocus.value = _box.read(PrefEntry.tagFocus.name) ?? _Defaults.tagFocus;
    potencia.value = _box.read(PrefEntry.potencia.name) ?? _Defaults.potencia;
    lotesDeLeitura.value =
        _box.read(PrefEntry.lotesDeLeitura.name) ?? _Defaults.lotesDeLeitura;
    rssiMinimo.value =
        _box.read(PrefEntry.rssiMinimo.name) ?? _Defaults.rssiMinimo;
    rssiMaximo.value =
        _box.read(PrefEntry.rssiMaximo.name) ?? _Defaults.rssiMaximo;
    rssiMinimoEnabled.value =
        _box.read(PrefEntry.rssiMinimoEnabled.name) ??
        _Defaults.rssiFilterEnabled;
    timeoutVal.value = _box.read(PrefEntry.timeout.name) ?? _Defaults.timeout;
    wsProtocol.value =
        _box.read(PrefEntry.wsProtocol.name) ?? _Defaults.wsProtocol;
    wsEndpoint.value =
        _box.read(PrefEntry.wsEndpoint.name) ?? _Defaults.wsEndpoint;
    themeMode.value =
        _box.read(PrefEntry.themeMode.name) ?? _Defaults.themeMode;

    return this;
  }

  /// `true` se a chave já foi gravada alguma vez, mesmo que com valor nulo.
  /// Diferente de `_box.hasData`, que devolve `false` para chave nula e por
  /// isso não serve para distinguir "nunca salvo" de "salvo como vazio".
  bool _jaConfigurado(PrefEntry entry) =>
      _box.getKeys<Iterable<String>>().contains(entry.name);

  // ------------------------ Variáveis Reativas (.obs) ------------------------
  final servidor = _Defaults.servidor.obs;
  final porta = _Defaults.porta.obs;
  final endpoint = _Defaults.endpoint.obs;
  final httpProtocol = _Defaults.httpProtocol.obs;
  final delim = Rx<String?>(null);
  final pathAtualizacao = _Defaults.pathAtualizacao.obs;

  final buzzer = _Defaults.buzzer.obs;
  final tagFocus = _Defaults.tagFocus.obs;
  final potencia = _Defaults.potencia.obs;
  final lotesDeLeitura = _Defaults.lotesDeLeitura.obs;
  final rssiMinimo = _Defaults.rssiMinimo.obs;
  final rssiMaximo = _Defaults.rssiMaximo.obs;
  final rssiMinimoEnabled = _Defaults.rssiFilterEnabled.obs;
  final rfidDevice = _Defaults.rfidDevice.obs;
  final timeoutVal = _Defaults.timeout.obs;
  final wsProtocol = _Defaults.wsProtocol.obs;
  final wsEndpoint = _Defaults.wsEndpoint.obs;
  final themeMode = _Defaults.themeMode.obs;

  int get timeout => timeoutVal.value;

  Future<void> saveSettings(Map<PrefEntry, Object?> settings) async {
    for (final entry in settings.entries) {
      final key = entry.key;
      final value = entry.value;
      bool isValid = false;

      switch (key) {
        case PrefEntry.servidor:
          if (value is String) {
            servidor.value = value;
            isValid = true;
          }
          break;
        case PrefEntry.endpoint:
          if (value is String) {
            endpoint.value = value;
            isValid = true;
          }
          break;
        case PrefEntry.httpProtocol:
          // Só http/https. Um QR code adulterado não pode injetar um esquema
          // arbitrário na URL base de todas as requisições.
          if (value is String && _httpProtocolsSuportados.contains(value)) {
            httpProtocol.value = value;
            isValid = true;
          }
          break;
        case PrefEntry.delim:
          if (value is String || value == null) {
            delim.value = value as String?;
            isValid = true;
          }
          break;
        case PrefEntry.pathAtualizacao:
          if (value is String) {
            pathAtualizacao.value = value;
            isValid = true;
          }
          break;
        case PrefEntry.porta:
          if (value is int || value == null) {
            porta.value = value as int?;
            isValid = true;
          }
          break;
        case PrefEntry.buzzer:
          if (value is bool) {
            buzzer.value = value;
            isValid = true;
          }
          break;
        case PrefEntry.tagFocus:
          if (value is bool) {
            tagFocus.value = value;
            isValid = true;
          }
          break;
        case PrefEntry.lotesDeLeitura:
          if (value is int) {
            lotesDeLeitura.value = value;
            isValid = true;
          }
          break;
        case PrefEntry.rssiMinimo:
          if (value is double) {
            rssiMinimo.value = value;
            isValid = true;
          }
          break;
        case PrefEntry.rssiMaximo:
          if (value is double) {
            rssiMaximo.value = value;
            isValid = true;
          }
          break;
        case PrefEntry.rssiMinimoEnabled:
          if (value is bool) {
            rssiMinimoEnabled.value = value;
            isValid = true;
          }
          break;
        case PrefEntry.potencia:
          if (value is int) {
            potencia.value = value;
            isValid = true;
          }
          break;
        case PrefEntry.timeout:
          if (value is int) {
            timeoutVal.value = value;
            isValid = true;
          }
          break;
        case PrefEntry.rfidDevice:
          if (value is RfidDevices || value == null) {
            rfidDevice.value = value as RfidDevices?;
            isValid = true;
          }
          break;
        case PrefEntry.wsProtocol:
          if (value is String) {
            wsProtocol.value = value;
            isValid = true;
          }
          break;

        case PrefEntry.wsEndpoint:
          if (value is String) {
            wsEndpoint.value = value;
            isValid = true;
          }
          break;
        case PrefEntry.themeMode:
          if (value is String) {
            themeMode.value = value;
            isValid = true;
          }
          break;
      }

      if (isValid) {
        if (value is Enum) {
          await _box.write(key.name, value.name);
        } else {
          await _box.write(key.name, value);
        }
      } else {
        Get.find<LogService>().w(
          'SettingsService',
          'saveSettings',
          'Tipo inválido para ${key.name}. Valor ignorado.',
        );
      }
    }
  }

  Map<String, Object?> toMap() => {
    PrefEntry.servidor.name: servidor.value,
    PrefEntry.porta.name: porta.value,
    PrefEntry.endpoint.name: endpoint.value,
    PrefEntry.httpProtocol.name: httpProtocol.value,
    PrefEntry.delim.name: delim.value,
    PrefEntry.pathAtualizacao.name: pathAtualizacao.value,
    PrefEntry.buzzer.name: buzzer.value,
    PrefEntry.tagFocus.name: tagFocus.value,
    PrefEntry.potencia.name: potencia.value,
    PrefEntry.lotesDeLeitura.name: lotesDeLeitura.value,
    PrefEntry.rssiMinimo.name: rssiMinimo.value,
    PrefEntry.rssiMaximo.name: rssiMaximo.value,
    PrefEntry.rssiMinimoEnabled.name: rssiMinimoEnabled.value,
    PrefEntry.rfidDevice.name: rfidDevice.value?.name,
    PrefEntry.timeout.name: timeoutVal.value,
    PrefEntry.wsProtocol.name: wsProtocol.value,
    PrefEntry.wsEndpoint.name: wsEndpoint.value,
    PrefEntry.themeMode.name: themeMode.value,
  };

  @override
  String toString() => JsonEncoder.withIndent('  ').convert(toMap());
}
