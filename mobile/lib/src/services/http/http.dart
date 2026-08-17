import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:ztm/src/components/dialogs/boolean.dart';
import 'package:ztm/src/services/environment/env_manager.dart';
import 'package:ztm/src/services/http/api_exception.dart';
import 'package:ztm/src/services/log/log.dart';
import 'package:ztm/src/services/settings/settings.dart';

class HttpException implements Exception {
  final String message;
  final String? details;
  final Uri? uri;
  HttpException(this.message, {this.uri, this.details});

  /// Inclui a causa quando existe. A mensagem sozinha ("Sem conexão com o
  /// servidor") não distingue host errado de porta fechada de DNS falho — e é
  /// ela que aparece no diálogo de detalhes e vai para o arquivo de log.
  @override
  String toString() => details == null ? message : '$message ($details)';
}

class NetworkException extends HttpException {
  NetworkException(super.message, {super.uri, super.details});
}

class TimeoutExceptionCustom extends HttpException {
  TimeoutExceptionCustom(super.message, {super.uri, super.details});
}

class HttpService extends GetxService {
  final _client = http.Client();
  final _settings = Get.find<SettingsService>();
  final _log = Get.find<LogService>();
  final _env = Get.find<EnvManager>();

  final token = ''.obs;

  String get baseUrl => buildBaseUrl(
    protocolo: _settings.httpProtocol.value,
    host: _settings.servidor.value,
    porta: _settings.porta.value,
    path: _settings.endpoint.value,
  );

  /// Monta a URL base a partir dos parâmetros de conexão.
  ///
  /// Exposta como função pura para que a tela de configurações consiga validar
  /// um servidor ainda não salvo usando exatamente a mesma regra das
  /// requisições reais.
  static String buildBaseUrl({
    required String protocolo,
    required String host,
    required int? porta,
    required String path,
  }) {
    final portStr = porta != null ? ':$porta' : '';
    final formattedPath = path.isEmpty
        ? ''
        : path.startsWith('/')
        ? path
        : '/$path';

    final url = '$protocolo://$host$portStr$formattedPath';
    // Strip trailing slash to prevent double-slash when concatenating with endpoints
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  Future<bool> _shouldProceed(Uri uri, String method, {Object? body}) async {
    if (_env.buildMode != 'DEV') return true;

    final result = await Get.dialog<bool>(
      BooleanDialog(
        title: 'DEBUG: Confirmar Requisição',
        content:
            'Deseja realmente enviar esta requisição?\n\n'
            'Método: $method\n'
            'URL: $uri\n'
            'Body: ${body ?? 'N/A'}',
      ),
    );
    return result == true;
  }

  Map<String, String> _buildHeaders(
    Map<String, String>? customHeaders,
    bool isJson,
  ) {
    final headers = <String, String>{};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    if (token.value.isNotEmpty) {
      headers['Authorization'] = 'Bearer ${token.value}';
    }
    if (customHeaders != null) {
      headers.addAll(customHeaders);
    }
    return headers;
  }

  void _processResponse(
    http.Response response,
    String method, {
    Object? requestBody,
  }) {
    // 1. Sliding token check
    final refreshedToken = response.headers['x-refreshed-token'];
    if (refreshedToken != null && refreshedToken.isNotEmpty) {
      token.value = refreshedToken;
      _log.info(
        'HttpService',
        'slidingToken',
        'JWT renovado via X-Refreshed-Token',
      );
    }

    // 2. Cookie parsing for login access_token fallback
    final setCookie = response.headers['set-cookie'];
    if (setCookie != null) {
      final match = RegExp(r'access_token=([^;]+)').firstMatch(setCookie);
      if (match != null) {
        final cookieToken = match.group(1);
        if (cookieToken != null && cookieToken.isNotEmpty) {
          token.value = cookieToken;
          _log.info(
            'HttpService',
            'cookieToken',
            'JWT extraído via Set-Cookie',
          );
        }
      }
    }

    // 3. Throw ApiException for error responses (centralizes error handling)
    if (response.statusCode < 200 || response.statusCode >= 300) {
      _log.e(
        tag: 'HttpService',
        subTag: method,
        e:
            'Erro ${response.statusCode} na URL: ${response.request?.url}\n'
            'Corpo da Requisição: ${_redactBody(requestBody)}\n'
            'Resposta: ${response.body}',
      );

      if (response.statusCode >= 400) {
        throw ApiException.fromResponseBody(response.statusCode, response.body);
      }
    }
  }

  /// Campos que nunca podem aparecer em log. Um 401 no login logava o corpo
  /// inteiro da requisição — ou seja, usuário e senha em texto claro no
  /// logcat do coletor.
  static const _camposSensiveis = {'senha', 'password', 'token', 'chave'};

  static String _redactBody(Object? body) {
    if (body == null) return 'N/A';

    // O corpo já chega serializado (ver `requestBody` nos métodos abaixo).
    final texto = body.toString();
    return texto.replaceAllMapped(
      RegExp(
        '"(${_camposSensiveis.join('|')})"\\s*:\\s*"[^"]*"',
        caseSensitive: false,
      ),
      (m) => '"${m[1]}":"***"',
    );
  }

  Future<http.Response> get(
    String path, {
    Map<String, String>? headers,
    bool confirm = true,
  }) async {
    final fullUrl = '$baseUrl$path';
    final uri = Uri.parse(fullUrl);

    if (confirm && !await _shouldProceed(uri, 'GET')) {
      throw HttpException(
        'Requisição cancelada pelo usuário (DEBUG)',
        uri: uri,
      );
    }

    try {
      final response = await _client
          .get(uri, headers: _buildHeaders(headers, false))
          .timeout(Duration(seconds: _settings.timeout));
      _processResponse(response, 'GET');
      return response;
    } on SocketException catch (err) {
      _log.e(
        tag: 'HttpService',
        subTag: 'GET',
        e: 'Sem conexão com o servidor: $fullUrl — $err',
      );
      throw NetworkException(
        'Sem conexão com o servidor.',
        uri: uri,
        details: err.toString(),
      );
    } on TimeoutException catch (err) {
      _log.e(
        tag: 'HttpService',
        subTag: 'GET',
        e: 'Timeout na requisição: $fullUrl — $err',
      );
      throw TimeoutExceptionCustom(
        'O servidor demorou muito para responder.',
        uri: uri,
        details: err.toString(),
      );
    } on ApiException catch (_) {
      rethrow;
    } catch (e) {
      _log.e(tag: 'HttpService', subTag: 'GET', e: 'Erro inesperado: $e');
      throw HttpException(
        'Ocorreu um erro inesperado.',
        uri: uri,
        details: e.toString(),
      );
    }
  }

  Future<http.Response> post(
    String path, {
    Map<String, String>? headers,
    Object? body,
    bool confirm = true,
  }) async {
    final fullUrl = '$baseUrl$path';
    final uri = Uri.parse(fullUrl);

    final requestBody = body is Map || body is List ? jsonEncode(body) : body;

    if (confirm && !await _shouldProceed(uri, 'POST', body: requestBody)) {
      throw HttpException(
        'Requisição cancelada pelo usuário (DEBUG)',
        uri: uri,
      );
    }

    try {
      final response = await _client
          .post(
            uri,
            headers: _buildHeaders(headers, body != null),
            body: requestBody,
          )
          .timeout(Duration(seconds: _settings.timeout));
      _processResponse(response, 'POST', requestBody: requestBody);
      return response;
    } on SocketException catch (err) {
      _log.e(
        tag: 'HttpService',
        subTag: 'POST',
        e: 'Sem conexão com o servidor: $fullUrl — $err',
      );
      throw NetworkException(
        'Sem conexão com o servidor.',
        uri: uri,
        details: err.toString(),
      );
    } on TimeoutException catch (err) {
      _log.e(
        tag: 'HttpService',
        subTag: 'POST',
        e: 'Timeout na requisição: $fullUrl — $err',
      );
      throw TimeoutExceptionCustom(
        'O servidor demorou muito para responder.',
        uri: uri,
        details: err.toString(),
      );
    } on ApiException catch (_) {
      rethrow;
    } catch (e) {
      _log.e(tag: 'HttpService', subTag: 'POST', e: 'Erro inesperado: $e');
      throw HttpException(
        'Ocorreu um erro inesperado.',
        uri: uri,
        details: e.toString(),
      );
    }
  }

  Future<http.Response> patch(
    String path, {
    Map<String, String>? headers,
    Object? body,
    bool confirm = true,
  }) async {
    final fullUrl = '$baseUrl$path';
    final uri = Uri.parse(fullUrl);

    final requestBody = body is Map || body is List ? jsonEncode(body) : body;

    if (confirm && !await _shouldProceed(uri, 'PATCH', body: requestBody)) {
      throw HttpException(
        'Requisição cancelada pelo usuário (DEBUG)',
        uri: uri,
      );
    }

    try {
      final response = await _client
          .patch(
            uri,
            headers: _buildHeaders(headers, body != null),
            body: requestBody,
          )
          .timeout(Duration(seconds: _settings.timeout));
      _processResponse(response, 'PATCH', requestBody: requestBody);
      return response;
    } on SocketException catch (err) {
      _log.e(
        tag: 'HttpService',
        subTag: 'PATCH',
        e: 'Sem conexão com o servidor: $fullUrl — $err',
      );
      throw NetworkException(
        'Sem conexão com o servidor.',
        uri: uri,
        details: err.toString(),
      );
    } on TimeoutException catch (err) {
      _log.e(
        tag: 'HttpService',
        subTag: 'PATCH',
        e: 'Timeout na requisição: $fullUrl — $err',
      );
      throw TimeoutExceptionCustom(
        'O servidor demorou muito para responder.',
        uri: uri,
        details: err.toString(),
      );
    } on ApiException catch (_) {
      rethrow;
    } catch (e) {
      _log.e(tag: 'HttpService', subTag: 'PATCH', e: 'Erro inesperado: $e');
      throw HttpException(
        'Ocorreu um erro inesperado.',
        uri: uri,
        details: e.toString(),
      );
    }
  }

  Future<http.Response> delete(
    String path, {
    Map<String, String>? headers,
    bool confirm = true,
  }) async {
    final fullUrl = '$baseUrl$path';
    final uri = Uri.parse(fullUrl);

    if (confirm && !await _shouldProceed(uri, 'DELETE')) {
      throw HttpException(
        'Requisição cancelada pelo usuário (DEBUG)',
        uri: uri,
      );
    }

    try {
      final response = await _client
          .delete(uri, headers: _buildHeaders(headers, false))
          .timeout(Duration(seconds: _settings.timeout));
      _processResponse(response, 'DELETE');
      return response;
    } on SocketException catch (err) {
      _log.e(
        tag: 'HttpService',
        subTag: 'DELETE',
        e: 'Sem conexão com o servidor: $fullUrl — $err',
      );
      throw NetworkException(
        'Sem conexão com o servidor.',
        uri: uri,
        details: err.toString(),
      );
    } on TimeoutException catch (err) {
      _log.e(
        tag: 'HttpService',
        subTag: 'DELETE',
        e: 'Timeout na requisição: $fullUrl — $err',
      );
      throw TimeoutExceptionCustom(
        'O servidor demorou muito para responder.',
        uri: uri,
        details: err.toString(),
      );
    } on ApiException catch (_) {
      rethrow;
    } catch (e) {
      _log.e(tag: 'HttpService', subTag: 'DELETE', e: 'Erro inesperado: $e');
      throw HttpException(
        'Ocorreu um erro inesperado.',
        uri: uri,
        details: e.toString(),
      );
    }
  }

  Future<http.Response> head(
    String url, {
    Map<String, String>? headers,
    bool confirm = true,
  }) async {
    final uri = Uri.parse(url);

    if (confirm && !await _shouldProceed(uri, 'HEAD')) {
      throw HttpException(
        'Requisição cancelada pelo usuário (DEBUG)',
        uri: uri,
      );
    }

    try {
      final response = await _client
          .head(uri, headers: headers)
          .timeout(Duration(seconds: _settings.timeout));
      return response;
    } on SocketException catch (err) {
      // Este é o caminho da validação da tela de configurações — o chamado de
      // suporte mais comum. Sem log aqui, a falha não deixava rastro nenhum.
      _log.e(
        tag: 'HttpService',
        subTag: 'HEAD',
        e: 'Sem conexão com o servidor: $url — $err',
      );
      throw NetworkException(
        'Sem conexão com o servidor.',
        uri: uri,
        details: err.toString(),
      );
    } on TimeoutException catch (err) {
      _log.e(
        tag: 'HttpService',
        subTag: 'HEAD',
        e: 'Timeout na requisição: $url — $err',
      );
      throw TimeoutExceptionCustom(
        'O servidor demorou muito para responder.',
        uri: uri,
        details: err.toString(),
      );
    } catch (e) {
      _log.e(tag: 'HttpService', subTag: 'HEAD', e: 'Erro inesperado: $e');
      throw HttpException(
        'Ocorreu um erro inesperado.',
        uri: uri,
        details: e.toString(),
      );
    }
  }
}
