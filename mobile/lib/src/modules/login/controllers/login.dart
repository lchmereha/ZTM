import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/components/dialogs/error.dart';
import 'package:ztm/src/routes/app_routes.dart';
import 'package:ztm/src/services/api/auth/auth_service.dart';
import 'package:ztm/src/services/http/api_exception.dart';
import 'package:ztm/src/services/settings/settings.dart';
import 'package:ztm/src/services/snackbar/snackbar.dart';

class LoginController extends GetxController {
  final _authService = Get.find<AuthService>();
  final _settings = Get.find<SettingsService>();
  final _snackbar = Get.find<SnackbarService>();

  final formKey = GlobalKey<FormState>();
  final userController = TextEditingController();
  final passwordController = TextEditingController();

  final isLoading = false.obs;
  final isObscure = true.obs;

  @override
  void onClose() {
    userController.dispose();
    passwordController.dispose();
    super.onClose();
  }

  String? validateUsername(String? value) {
    if (value == null || value.trim().isEmpty) return 'O usuário é obrigatório';
    return null;
  }

  String? validatePassword(String? value) {
    if (value == null || value.trim().isEmpty) return 'A senha é obrigatória';
    return null;
  }

  void toggleObscure() => isObscure.value = !isObscure.value;
  void launchSettings() => Get.toNamed(AppRoutes.settings);

  Future<void> loginUser() async {
    if (isLoading.value || !formKey.currentState!.validate()) return;

    if (_settings.servidor.value.isEmpty) {
      _snackbar.warning('Atenção', 'Nenhum servidor configurado.');
      launchSettings();
      return;
    }

    isLoading.value = true;

    try {
      final user = userController.text.trim();
      final password = passwordController.text.trim();

      await _authService.login(user, password);

      // Successfully authenticated. Now route to filial selection.
      Get.offNamed(AppRoutes.filialSelection);
    } on ApiException catch (e) {
      Get.dialog(ErrorDialog.fromApiException(e));
    } catch (e) {
      Get.dialog(
        ErrorDialog(
          message:
              'Erro ao autenticar. Por favor, verifique a conexão e as configurações.',
          detalhes: e.toString(),
        ),
      );
    } finally {
      isLoading.value = false;
    }
  }
}
