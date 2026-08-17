import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/modules/login/controllers/filial_selection.dart';
import 'package:ztm/src/routes/app_routes.dart';
import 'package:ztm/src/services/api/auth/auth_service.dart';

class FilialSelectionView extends StatelessWidget {
  const FilialSelectionView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(FilialSelectionController());
    final authService = Get.find<AuthService>();

    final user = authService.loginData.value?.user;

    return PopScope(
      canPop: false,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Selecionar Filial'),
          actions: [
            IconButton(
              icon: const Icon(Icons.logout),
              tooltip: 'Sair / Logout',
              onPressed: () => authService.logout(),
            ),
          ],
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(Sizes.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: Sizes.md),
                Text(
                  'Olá, ${user?.nome ?? 'Operador'}',
                  style: Get.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: Sizes.xs),
                Text(
                  'Selecione a filial de atividade para continuar:',
                  style: Get.textTheme.bodyMedium?.copyWith(
                    color: Get.theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: Sizes.xl),
                Expanded(
                  child: Obx(() {
                    if (controller.isLoading.value) {
                      return const Center(child: CircularProgressIndicator());
                    }

                    final filiais = controller.filiais;

                    return filiais.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  Icons.warning_amber_rounded,
                                  size: 64,
                                  color: Colors.orange,
                                ),
                                const SizedBox(height: Sizes.md),
                                Text(
                                  'Nenhuma filial vinculada ao seu usuário.',
                                  style: Get.textTheme.titleMedium,
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: Sizes.lg),
                                ElevatedButton(
                                  onPressed: () => authService.logout(),
                                  child: const Text('Voltar para o Login'),
                                ),
                              ],
                            ),
                          )
                        : ListView.separated(
                            itemCount: filiais.length,
                            separatorBuilder: (context, index) =>
                                const SizedBox(height: Sizes.md),
                            itemBuilder: (context, index) {
                              final filial = filiais[index];

                              // Look up company name for subtitle if available
                              final company = user?.empresas.firstWhereOrNull(
                                (c) => c.id == filial.idEmpresa,
                              );

                              return Card(
                                elevation: 2,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(
                                    Constants.borderRadius,
                                  ),
                                ),
                                child: InkWell(
                                  onTap: () {
                                    authService.selectFilial(filial);
                                    // Redirect to dashboard
                                    Get.offAllNamed(AppRoutes.home);
                                  },
                                  borderRadius: BorderRadius.circular(
                                    Constants.borderRadius,
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: Sizes.lg,
                                      horizontal: Sizes.xl,
                                    ),
                                    child: Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(
                                            Sizes.md,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Get
                                                .theme
                                                .colorScheme
                                                .primaryContainer,
                                            shape: BoxShape.circle,
                                          ),
                                          child: Icon(
                                            Icons.business,
                                            color: Get
                                                .theme
                                                .colorScheme
                                                .onPrimaryContainer,
                                          ),
                                        ),
                                        const SizedBox(width: Sizes.lg),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                filial.nome,
                                                style: Get.textTheme.titleMedium
                                                    ?.copyWith(
                                                      fontWeight:
                                                          FontWeight.bold,
                                                    ),
                                              ),
                                              if (company != null) ...[
                                                const SizedBox(
                                                  height: Sizes.xxs,
                                                ),
                                                Text(
                                                  company.nome,
                                                  style: Get.textTheme.bodySmall
                                                      ?.copyWith(
                                                        color: Get
                                                            .theme
                                                            .colorScheme
                                                            .onSurfaceVariant,
                                                      ),
                                                ),
                                              ],
                                            ],
                                          ),
                                        ),
                                        Icon(
                                          Icons.chevron_right,
                                          color: Get
                                              .theme
                                              .colorScheme
                                              .onSurfaceVariant,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          );
                  }),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
