import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/components/collapsable_fab.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/modules/home/controllers/impressao.dart';

class ImpressaoView extends StatelessWidget {
  const ImpressaoView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(ImpressaoController());

    return Scaffold(
      appBar: AppBar(
        title: Text('Impressão #${controller.movementId}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Atualizar',
            onPressed: () => controller.fetchMovementDetails(),
          ),
        ],
      ),
      body: SafeArea(
        child: Obx(() {
          if (controller.isLoading.value) {
            return const Center(child: CircularProgressIndicator());
          }

          final mov = controller.movement.value;
          if (mov == null) {
            return const Center(child: Text('Movimentação não encontrada.'));
          }

          final isFinalizado = mov.situacao == 'FINALIZADO';

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Info Card
              Padding(
                padding: const EdgeInsets.all(
                  Sizes.md,
                ).copyWith(bottom: Sizes.xs),
                child: Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(Constants.borderRadius),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(Sizes.md),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      spacing: Sizes.sm,
                      children: [
                        Text(
                          mov.tipo.descricao,
                          style: Get.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (mov.descricao != null &&
                            mov.descricao!.isNotEmpty) ...[
                          Text(mov.descricao!, style: Get.textTheme.bodyMedium),
                        ],
                        Text(
                          'Impressora Vinculada: ${mov.equipamento?.nome ?? 'Nenhuma'}',
                          style: Get.textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Products List
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(Sizes.md).copyWith(
                    bottom: 2 * Sizes.lg + 56,
                    top: Sizes.md - Sizes.xs,
                  ),
                  itemCount: controller.products.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: Sizes.md),
                  itemBuilder: (context, index) {
                    final p = controller.products[index];
                    final tags = List<String>.from(p['tags'] ?? []);

                    return Card(
                      elevation: 1,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(
                          Constants.borderRadius,
                        ),
                      ),
                      child: Theme(
                        data: Get.theme.copyWith(
                          dividerColor: Colors.transparent,
                        ),
                        child: ExpansionTile(
                          initiallyExpanded: false,
                          tilePadding: const EdgeInsets.only(
                            left: Sizes.md,
                            right: Sizes.md,
                            top: Sizes.md,
                            bottom: Sizes.sm,
                          ),
                          childrenPadding: const EdgeInsets.only(
                            left: Sizes.md,
                            right: Sizes.md,
                            bottom: Sizes.md,
                          ),
                          title: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                p['nome'],
                                style: Get.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),

                              Row(
                                spacing: Sizes.xs,
                                children: [
                                  Expanded(
                                    child: Text(
                                      'Código: ${p['codigo']}',
                                      style: Get.textTheme.bodySmall,
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: Sizes.sm,
                                      vertical: Sizes.xs,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Get
                                          .theme
                                          .colorScheme
                                          .secondaryContainer,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      'Qtd: ${p['quantidade']}',
                                      style: Get.textTheme.bodySmall?.copyWith(
                                        color: Get
                                            .theme
                                            .colorScheme
                                            .onSecondaryContainer,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          children: [
                            if (tags.isNotEmpty) ...[
                              const SizedBox(height: Sizes.xs),
                              Align(
                                alignment: Alignment.centerLeft,
                                child: Text(
                                  'Etiquetas Geradas:',
                                  style: Get.textTheme.bodySmall?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(height: Sizes.xs),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: tags.map((epc) {
                                  return Chip(
                                    label: Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            epc,
                                            style: const TextStyle(
                                              fontSize: Constants.fontSizeDenso,
                                              fontFamily: 'UbuntuMono',
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    visualDensity: VisualDensity.compact,
                                    backgroundColor: Get
                                        .theme
                                        .colorScheme
                                        .surfaceContainerHigh,
                                  );
                                }).toList(),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              // Action Button Bar
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (isFinalizado)
                    Container(
                      padding: const EdgeInsets.all(Sizes.md),
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.1),
                        border: Border.all(color: Colors.green),
                        borderRadius: BorderRadius.circular(
                          Constants.borderRadius / 2,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        spacing: Sizes.md,
                        children: [
                          const Icon(Icons.check_circle, color: Colors.green),
                          Text(
                            'MOVIMENTAÇÃO IMPRESSA E FINALIZADA',
                            style: Get.textTheme.bodyMedium?.copyWith(
                              color: Colors.green,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ],
          );
        }),
      ),
      floatingActionButton: Obx(() {
        if (controller.isLoading.value) return const SizedBox.shrink();
        final mov = controller.movement.value;
        if (mov == null) return const SizedBox.shrink();

        if (mov.situacao == 'IMPORTADO') {
          return CollapsableFab(
            icon: const Icon(Icons.settings),
            label: const Text('GERAR ETIQUETAS'),
            backgroundColor: Get.theme.colorScheme.primary,
            foregroundColor: Get.theme.colorScheme.onPrimary,
            initiallyExpanded: true,
            onPressed: () => controller.process(),
          );
        } else if (mov.situacao == 'PROCESSADO') {
          return CollapsableFab(
            icon: const Icon(Icons.print),
            label: const Text('IMPRIMIR'),
            backgroundColor: Colors.green,
            foregroundColor: Colors.white,
            initiallyExpanded: true,
            onPressed: () => controller.printTags(),
          );
        }

        return const SizedBox.shrink();
      }),
    );
  }
}
