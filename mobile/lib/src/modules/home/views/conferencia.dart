import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/components/collapsable_fab.dart';
import 'package:ztm/src/components/rfid_reader_panel/rfid_reader_panel.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/modules/home/controllers/conferencia.dart';

class ConferenciaView extends StatelessWidget {
  const ConferenciaView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(ConferenciaController());

    return Scaffold(
      appBar: AppBar(title: Text('Conferência #${controller.movementId}')),
      body: SafeArea(
        child: Obx(() {
          if (controller.isLoading.value) {
            return const Center(child: CircularProgressIndicator());
          }

          return CustomScrollView(
            slivers: [
              // Connection & Scan Panel
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: Sizes.md,
                    vertical: Sizes.sm,
                  ),
                  child: Obx(
                    () => RfidReaderPanel(
                      isReading: controller.isReading,
                      onStart: () => controller.startReading(),
                      onStop: () => controller.stopReading(),
                      onClear: () => controller.clearTags(),
                      uniqueTagsCount: controller.scannedEpcs.length,
                      tipoEquipamento: controller.tipoEquipamento.value,
                    ),
                  ),
                ),
              ),

              // Invalid/Unknown/Exceeded Tags Warnings
              SliverToBoxAdapter(
                child: Obx(() {
                  if (controller.invalidTags.isEmpty) {
                    return const SizedBox.shrink();
                  }
                  return Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Sizes.md,
                      vertical: Sizes.xs,
                    ),
                    child: Card(
                      color: Get.theme.colorScheme.errorContainer,
                      child: Padding(
                        padding: const EdgeInsets.all(Sizes.md),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          spacing: Sizes.sm,
                          children: [
                            Row(
                              spacing: Sizes.md,
                              children: [
                                Icon(
                                  Icons.error_outline,
                                  color: Get.theme.colorScheme.onErrorContainer,
                                ),
                                Expanded(
                                  child: Text(
                                    'Atenção: Etiquetas Inválidas Encontradas!',
                                    style: Get.textTheme.bodyMedium?.copyWith(
                                      color: Get
                                          .theme
                                          .colorScheme
                                          .onErrorContainer,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            Column(
                              children: controller.invalidTags.entries.map((
                                entry,
                              ) {
                                final isExceeded = entry.value == 'EXCEDENTE';
                                return Tooltip(
                                  message: isExceeded
                                      ? 'Tag Excedente'
                                      : 'Tag Desconhecida',
                                  child: Chip(
                                    label: Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            '${entry.key} (${isExceeded ? 'Excesso' : 'Desconhecida'})',
                                            style: TextStyle(
                                              fontSize: Constants.fontSizeDenso,
                                              fontFamily: 'UbuntuMono',
                                              color: Get
                                                  .theme
                                                  .colorScheme
                                                  .onErrorContainer,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    backgroundColor: Get.theme.colorScheme.error
                                        .withValues(alpha: 0.2),
                                    shape: RoundedRectangleBorder(
                                      side: BorderSide(
                                        color: Get.theme.colorScheme.error,
                                      ),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    visualDensity: VisualDensity.compact,
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ),

              // Products List
              SliverPadding(
                padding: const EdgeInsets.all(Sizes.md),
                sliver: SliverList.separated(
                  itemCount: controller.products.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: Sizes.md),
                  itemBuilder: (context, index) {
                    final p = controller.products[index];
                    return Obx(() {
                      final scanned =
                          p['matchedTags'] as RxList<Map<String, dynamic>>;
                      final expected = p['quantidadeConferencia'] as int;
                      final isComplete = scanned.length == expected;

                      return Card(
                        elevation: 1,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(
                            Constants.borderRadius,
                          ),
                          side: BorderSide(
                            color: isComplete
                                ? Colors.green.withValues(alpha: 0.5)
                                : Colors.transparent,
                            width: 1.5,
                          ),
                        ),
                        child: Theme(
                          data: Theme.of(
                            context,
                          ).copyWith(dividerColor: Colors.transparent),
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
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        p['nome'],
                                        style: Get.textTheme.titleMedium
                                            ?.copyWith(
                                              fontWeight: FontWeight.bold,
                                            ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: Sizes.sm,
                                        vertical: Sizes.xs,
                                      ),
                                      decoration: BoxDecoration(
                                        color: isComplete
                                            ? Colors.green.withValues(
                                                alpha: 0.1,
                                              )
                                            : Get
                                                  .theme
                                                  .colorScheme
                                                  .secondaryContainer,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        '${scanned.length} / $expected',
                                        style: Get.textTheme.bodySmall
                                            ?.copyWith(
                                              color: isComplete
                                                  ? Colors.green
                                                  : Get
                                                        .theme
                                                        .colorScheme
                                                        .onSecondaryContainer,
                                              fontWeight: FontWeight.bold,
                                            ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: Sizes.xs),
                                Text(
                                  'Código: ${p['codigo']}',
                                  style: Get.textTheme.bodySmall,
                                ),
                                const SizedBox(height: Sizes.sm),
                                LinearProgressIndicator(
                                  value: expected > 0
                                      ? scanned.length / expected
                                      : 0,
                                  backgroundColor: Get
                                      .theme
                                      .colorScheme
                                      .surfaceContainerHighest,
                                  color: isComplete
                                      ? Colors.green
                                      : Get.theme.colorScheme.primary,
                                  minHeight: 6,
                                  borderRadius: BorderRadius.circular(3),
                                ),
                              ],
                            ),
                            children: [
                              if (scanned.isNotEmpty) ...[
                                const SizedBox(height: Sizes.sm),
                                Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    'Conferidas:',
                                    style: Get.textTheme.bodySmall?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: Sizes.xs),
                                Align(
                                  alignment: Alignment.centerLeft,
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: scanned.map((vinc) {
                                      return Chip(
                                        avatar: const Icon(
                                          Icons.check,
                                          size: 12,
                                          color: Colors.green,
                                        ),
                                        label: Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                vinc['codigoRfidLido'],
                                                style: const TextStyle(
                                                  fontSize: Constants.fontSizeDenso,
                                                  fontFamily: 'UbuntuMono',
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        visualDensity: VisualDensity.compact,
                                        padding: EdgeInsets.zero,
                                      );
                                    }).toList(),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    });
                  },
                ),
              ),
              const SliverPadding(
                padding: EdgeInsets.only(bottom: 2 * Sizes.lg + 56),
              ),
            ],
          );
        }),
      ),
      floatingActionButton: Obx(() {
        if (!controller.canSubmit) {
          return const SizedBox.shrink();
        }

        return CollapsableFab(
          icon: const Icon(Icons.check_circle_outline),
          label: const Text('CONCLUIR CONFERÊNCIA'),
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          initiallyExpanded: true,
          onPressed: () => controller.submit(),
        );
      }),
    );
  }
}
