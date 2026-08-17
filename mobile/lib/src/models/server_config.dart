import 'dart:convert' show jsonEncode;
import 'package:ztm/src/models/utils/parse_helpers.dart';

class _Keys {
  const _Keys._();

  static const servidor = 'servidor';
  static const servidor2 = 'host';
  static const servidor3 = 'endereco';
  static const servidor4 = 'address';

  static const porta = 'porta';
  static const porta2 = 'port';

  static const endpoint = 'endpoint';
  static const endpoint2 = 'path';
  static const endpoint3 = 'route';

  static const timeout = 'timeout';
  static const delim = 'delim';

  static const protocolo = 'protocolo';
  static const protocolo2 = 'protocol';
  static const protocolo3 = 'scheme';
}

/// Esquemas aceitos no QR code. Qualquer outro valor é rejeitado na leitura,
/// para que um QR adulterado não consiga injetar um esquema arbitrário.
const _protocolosSuportados = {'http', 'https'};

class ServerConfig {
  final String? servidor;
  final int? porta;
  final String? endpoint;
  final int? timeout;
  final String? delim;
  final String? protocolo;

  const ServerConfig({
    this.servidor,
    this.porta,
    this.endpoint,
    this.timeout,
    this.delim,
    this.protocolo,
  });

  factory ServerConfig.fromJson(Map? json) {
    Object? parser;

    parser =
        json?[_Keys.endpoint] ??
        json?[_Keys.endpoint2] ??
        json?[_Keys.endpoint3];
    final endpoint = parser is String
        ? parser
        : parser == null
        ? null
        : throw ArgumentError.value(
            parser,
            _Keys.endpoint,
            'Deve ser String ou Null',
          );

    parser = json?[_Keys.porta] ?? json?[_Keys.porta2];
    final porta = parser is int
        ? parser
        : int.tryParse('$parser') != null
        ? int.parse('$parser')
        : parser == null
        ? null
        : throw ArgumentError.value(
            parser,
            _Keys.porta,
            'Deve ser Int, String numérica ou Null',
          );

    parser =
        json?[_Keys.servidor] ??
        json?[_Keys.servidor2] ??
        json?[_Keys.servidor3] ??
        json?[_Keys.servidor4];
    final servidor = parser is String
        ? parser
        : parser == null
        ? null
        : throw ArgumentError.value(
            parser,
            _Keys.servidor,
            'Deve ser String ou Null',
          );

    parser =
        json?[_Keys.protocolo] ??
        json?[_Keys.protocolo2] ??
        json?[_Keys.protocolo3];
    final protocolo = parser == null
        ? null
        : parser is String &&
              _protocolosSuportados.contains(parser.toLowerCase())
        ? parser.toLowerCase()
        : throw ArgumentError.value(
            parser,
            _Keys.protocolo,
            'Deve ser "http", "https" ou Null',
          );

    return ServerConfig(
      servidor: servidor,
      porta: porta,
      endpoint: endpoint,
      timeout: parseNullableInt(json, _Keys.timeout),
      delim: parseNullableString(json, _Keys.delim),
      protocolo: protocolo,
    );
  }

  Map<String, Object?> toMap() => {
    _Keys.servidor: servidor,
    _Keys.porta: porta,
    _Keys.endpoint: endpoint,
    _Keys.timeout: timeout,
    _Keys.delim: delim,
    _Keys.protocolo: protocolo,
  };

  @override
  String toString() => jsonEncode(toMap());
}
