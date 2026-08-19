import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:ztm/src/components/collapsable_fab.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/modules/login/controllers/login.dart';

class LoginView extends StatelessWidget {
  const LoginView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(LoginController());
    final theme = Get.theme;
    final colorScheme = theme.colorScheme;

    return PopScope(
      canPop: false,
      child: Scaffold(
        floatingActionButton: CollapsableFab(
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          onPressed: controller.launchSettings,
          icon: const Icon(Icons.dns_rounded),
          label: const Text('Configurações'),
        ),
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(Sizes.xl),
              child: ConstrainedBox(
                constraints: const BoxConstraints(
                  maxWidth: Constants.maxWidthLogin,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  spacing: Sizes.xl,
                  children: [
                    // Logo
                    Image.asset(
                      'assets/images/logo_completa.png',
                      filterQuality: FilterQuality.high,
                      isAntiAlias: true,
                    ),

                    // Login Form Card
                    Container(
                      decoration: BoxDecoration(
                        color: colorScheme.surfaceContainerHigh,
                        borderRadius: BorderRadius.circular(
                          Constants.borderRadiusWide,
                        ),
                      ),
                      padding: const EdgeInsets.all(Sizes.xl),
                      child: Form(
                        key: controller.formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          spacing: Sizes.lg,
                          children: [
                            // Caixa alta sempre: o backend normaliza `usuario`
                            // para maiúsculas no NormalizeInterceptor, então
                            // não há o que preservar em minúsculas aqui.
                            TextFormField(
                              autofocus: true,
                              controller: controller.userController,
                              decoration: InputDecoration(
                                filled: true,
                                fillColor: colorScheme.surface,
                                border: const OutlineInputBorder(),
                                labelText: 'Usuário',
                                hintText: 'USUARIO',
                                prefixIcon: const Icon(Icons.person_outline),
                              ),
                              inputFormatters: [
                                FilteringTextInputFormatter.deny(
                                  RegExp(r'\s+'),
                                ),
                              ],
                              keyboardType: TextInputType.name,
                              onTapOutside: (_) => Get.focusScope?.unfocus(),
                              textCapitalization: TextCapitalization.characters,
                              textInputAction: TextInputAction.next,
                              validator: controller.validateUsername,
                            ),

                            Obx(() {
                              return TextFormField(
                                controller: controller.passwordController,
                                decoration: InputDecoration(
                                  filled: true,
                                  fillColor: colorScheme.surface,
                                  border: const OutlineInputBorder(),
                                  labelText: 'Senha',
                                  hintText: '*****',
                                  prefixIcon: const Icon(Icons.lock_outline),
                                  suffixIcon: IconButton(
                                    icon: Icon(
                                      controller.isObscure.value
                                          ? Icons.visibility_outlined
                                          : Icons.visibility_off_outlined,
                                    ),
                                    onPressed: controller.toggleObscure,
                                  ),
                                ),
                                // Sem `textCapitalization`: a senha é
                                // case-sensitive (está em CASE_SENSITIVE_FIELDS
                                // no backend) e forçar caixa alta atrapalhava.
                                // Abrir em maiúsculas e depois obedecer o
                                // usuário não é possível — o Flutter só
                                // reenvia a configuração ao IME quando mudam
                                // readOnly, obscureText ou keyboardType.
                                keyboardType: TextInputType.visiblePassword,
                                obscureText: controller.isObscure.value,
                                onFieldSubmitted: (_) => controller.loginUser(),
                                onTapOutside: (_) => Get.focusScope?.unfocus(),
                                textInputAction: TextInputAction.done,
                                validator: controller.validatePassword,
                              );
                            }),

                            Obx(() {
                              return SizedBox(
                                height: Constants.buttonHeightLogin,
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: colorScheme.primary,
                                    foregroundColor: colorScheme.onPrimary,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(
                                        Constants.borderRadius / 2,
                                      ),
                                    ),
                                  ),
                                  onPressed: controller.isLoading.value
                                      ? null
                                      : controller.loginUser,
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    spacing: Sizes.sm,
                                    children: [
                                      Text(
                                        'ENTRAR',
                                        style: theme.textTheme.titleMedium
                                            ?.copyWith(
                                              color: colorScheme.onPrimary,
                                              fontWeight: FontWeight.bold,
                                              letterSpacing: 1.1,
                                            ),
                                      ),

                                      if (controller.isLoading.value)
                                        SizedBox.square(
                                          dimension: 12,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: colorScheme.onPrimary,
                                          ),
                                        ),

                                      if (!controller.isLoading.value)
                                        Icon(
                                          Icons.login,
                                          color: colorScheme.onPrimary,
                                        ),
                                    ],
                                  ),
                                ),
                              );
                            }),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
