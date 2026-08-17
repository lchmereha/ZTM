import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/components/dialogs/error.dart';
import 'package:ztm/src/components/dialogs/loading.dart';
import 'package:ztm/src/models/server_config.dart';
import 'package:ztm/src/services/environment/env_manager.dart';
import 'package:ztm/src/services/http/http.dart';
import 'package:ztm/src/services/settings/settings.dart';
import 'package:ztm/src/services/snackbar/snackbar.dart';

class SettingsController extends GetxController {
  final SettingsService settings = Get.find<SettingsService>();
  final EnvManager _env = Get.find<EnvManager>();
  final HttpService _http = Get.find<HttpService>();
  final SnackbarService _snackbar = Get.find<SnackbarService>();

  final formKey = GlobalKey<FormState>();
  final passwordController = TextEditingController();
  final serverController = TextEditingController();
  final portController = TextEditingController();
  final pathController = TextEditingController();
  final timeoutController = TextEditingController();
  final delimController = TextEditingController();

  final passwordFocusNode = FocusNode();

  // Ficavam em `_buildForm()`, recriados a cada rebuild e nunca liberados.
  final portFocusNode = FocusNode();
  final pathFocusNode = FocusNode();
  final timeoutFocusNode = FocusNode();
  final delimFocusNode = FocusNode();

  final isAuthenticated = false.obs;
  final isPasswordObscured = true.obs;
  final isSaving = false.obs;
  final selectedIndex = 0.obs;

  @override
  void onInit() {
    super.onInit();
    _loadInitialValues();
  }

  @override
  void onClose() {
    passwordController.dispose();
    serverController.dispose();
    portController.dispose();
    pathController.dispose();
    timeoutController.dispose();
    delimController.dispose();
    passwordFocusNode.dispose();
    portFocusNode.dispose();
    pathFocusNode.dispose();
    timeoutFocusNode.dispose();
    delimFocusNode.dispose();
    super.onClose();
  }

  void _loadInitialValues() {
    serverController.text = settings.servidor.value;
    portController.text = settings.porta.value?.toString() ?? '';
    pathController.text = settings.endpoint.value;
    timeoutController.text = settings.timeoutVal.value.toString();
    delimController.text = settings.delim.value ?? '';
  }

  void changePage(int index) {
    selectedIndex.value = index;
    if (index == 1 && !isAuthenticated.value) {
      Future.delayed(const Duration(milliseconds: 100), () {
        passwordFocusNode.requestFocus();
      });
    }
  }

  void togglePasswordVisibility() {
    isPasswordObscured.value = !isPasswordObscured.value;
  }

  /// Reflete a escolha no formulário. Só é gravado em disco no `_submit`,
  /// junto com os demais parâmetros, depois que a conexão for validada.
  void changeHttpProtocol(String protocolo) {
    settings.httpProtocol.value = protocolo;
  }

  void authenticate() {
    if (!_env.isSettingsPasswordConfigured) {
      Get.dialog(
        const ErrorDialog(
          message: 'Configuração manual indisponível neste build.',
          detalhes:
              'Este APK foi compilado sem SETTINGS_PASSWORD. '
              'Use a configuração por QR Code.',
        ),
      );
      return;
    }

    if (_env.matchesSettingsPassword(passwordController.text)) {
      isAuthenticated.value = true;
    } else {
      Get.dialog(const ErrorDialog(message: 'Senha incorreta!'));
    }
  }

  Future<void> saveManualSettings() async {
    if (isSaving.value) return;
    isSaving.value = true;

    final config = ServerConfig(
      servidor: serverController.text.trim(),
      porta: int.tryParse(portController.text.trim()),
      endpoint: pathController.text.trim(),
      timeout: int.tryParse(timeoutController.text.trim()),
      delim: delimController.text,
      protocolo: settings.httpProtocol.value,
    );

    await _submit(config);
    isSaving.value = false;
  }

  Future<void> onScan(String qrData) async {
    try {
      final decoded = jsonDecode(qrData);
      if (decoded is Map) {
        final config = ServerConfig.fromJson(decoded);
        await _submit(config);
      } else {
        throw Exception('Formato inválido de JSON no QR code.');
      }
    } catch (e) {
      Get.dialog(
        ErrorDialog(
          message: 'Falha ao processar os dados do QR code.',
          detalhes: e.toString(),
        ),
      );
    }
  }

  Future<void> _submit(ServerConfig config) async {
    final server = config.servidor ?? settings.servidor.value;
    final protocolo = config.protocolo ?? settings.httpProtocol.value;
    final url = HttpService.buildBaseUrl(
      protocolo: protocolo,
      host: server,
      porta: config.porta,
      path: '',
    );

    Get.dialog(
      const LoadingDialog(
        title: 'Conectando',
        content: 'Verificando conexão com o servidor...',
      ),
      barrierDismissible: false,
    );

    try {
      await _http
          .head(url)
          .timeout(
            Duration(seconds: config.timeout ?? settings.timeoutVal.value),
          );

      // Any HTTP response (including 401/403) proves the server is reachable.
      // Real failures (wrong IP, offline) throw SocketException/TimeoutException
      // and are handled in the catch block below.
      if (Get.isDialogOpen == true) Get.back();

      await settings.saveSettings({
        PrefEntry.servidor: server,
        PrefEntry.porta: config.porta,
        PrefEntry.endpoint: config.endpoint ?? '',
        PrefEntry.httpProtocol: protocolo,
        PrefEntry.timeout: config.timeout ?? settings.timeoutVal.value,
        PrefEntry.delim: config.delim,
      });

      Get.back(); // Fecha a tela de configurações
      _snackbar.success(
        'Sucesso',
        'Configurações salvas e conexão verificada com sucesso.',
      );
    } catch (e) {
      if (Get.isDialogOpen == true) Get.back(); // Fecha o LoadingDialog
      Get.dialog(
        ErrorDialog(
          message: 'Falha ao conectar com o servidor.',
          detalhes: e.toString(),
        ),
      );
    }
  }
}
