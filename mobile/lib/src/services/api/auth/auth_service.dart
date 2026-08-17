import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/constants/endpoints.dart';
import 'package:ztm/src/models/login_response.dart';
import 'package:ztm/src/routes/app_routes.dart';
import 'package:ztm/src/services/http/http.dart';
import 'package:ztm/src/services/log/log.dart';

class AuthService extends GetxService {
  final _http = Get.find<HttpService>();
  final _log = Get.find<LogService>();

  final loginData = Rx<LoginResponse?>(null);
  final selectedFilial = Rx<FilialModel?>(null);
  final selectedCompany = Rx<CompanyModel?>(null);

  bool get isLoggedIn => loginData.value != null;

  Color get themeColor {
    final company = selectedCompany.value;
    if (company != null && company.corEsquema != null) {
      try {
        return _parseHexColor(company.corEsquema!);
      } catch (e) {
        _log.e(
          tag: 'AuthService',
          subTag: 'themeColor',
          e: 'Erro ao parsear cor: ${company.corEsquema}',
        );
      }
    }
    return const Color(0xFFEE7D2D); // ZZTech default orange (same as ZWM)
  }

  String? get logo {
    final company = selectedCompany.value;
    return company?.logo;
  }

  Future<LoginResponse> login(String usuario, String senha) async {
    final body = {'usuario': usuario, 'senha': senha};

    final res = await _http.post(Endpoints.login, body: body);

    final jsonBody = jsonDecode(res.body);
    if (jsonBody is! Map || jsonBody['user'] is! Map) {
      _log.e(
        tag: 'AuthService',
        subTag: 'login',
        e: 'Resposta de login sem o objeto "user"',
      );
      throw const FormatException(
        'Resposta de login inválida. Verifique se o servidor configurado é '
        'mesmo a API do ZTM.',
      );
    }

    // O token chega no Set-Cookie ou no X-Refreshed-Token e é capturado pelo
    // HttpService. Se nenhum dos dois veio, o usuário ficaria "logado" com as
    // requisições seguintes todas sem autenticação.
    if (_http.token.value.isEmpty) {
      _log.e(
        tag: 'AuthService',
        subTag: 'login',
        e: 'Login sem token: nem Set-Cookie nem X-Refreshed-Token vieram',
      );
      throw const FormatException(
        'O servidor não devolveu um token de sessão.',
      );
    }

    final newLoginData = LoginResponse(
      accessToken: _http.token.value,
      user: UserModel.fromJson(Map<String, dynamic>.from(jsonBody['user'])),
    );

    loginData.value = newLoginData;
    return newLoginData;
  }

  void selectFilial(FilialModel filial) {
    selectedFilial.value = filial;

    // Resolve corresponding company to set logo/theme color
    final user = loginData.value?.user;
    if (user != null) {
      final company = user.empresas.firstWhereOrNull(
        (c) => c.id == filial.idEmpresa,
      );
      selectedCompany.value = company ?? user.empresa;
    }
  }

  void changeFilial() {
    selectedFilial.value = null;
    selectedCompany.value = null;
    Get.offAllNamed(AppRoutes.filialSelection);
  }

  Future<void> logout() async {
    try {
      await _http.post('/auth/logout');
    } catch (e) {
      _log.e(
        tag: 'AuthService',
        subTag: 'logout',
        e: 'Falha ao notificar logout no servidor: $e',
      );
    } finally {
      loginData.value = null;
      selectedFilial.value = null;
      selectedCompany.value = null;
      _http.token.value = '';
      Get.offAllNamed(AppRoutes.login);
    }
  }

  static Color _parseHexColor(String input) {
    String cleanHex = input.replaceAll('#', '').trim();
    if (cleanHex.length == 3) {
      cleanHex = cleanHex.split('').map((c) => '$c$c').join();
    }
    if (cleanHex.length == 6) {
      cleanHex = 'FF$cleanHex';
    }
    if (cleanHex.length == 8) {
      // already has alpha
      return Color(int.parse(cleanHex, radix: 16));
    }
    return Color(int.parse(cleanHex, radix: 16));
  }
}
