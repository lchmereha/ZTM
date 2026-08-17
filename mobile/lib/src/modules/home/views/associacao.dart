import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/components/collapsable_fab.dart';
import 'package:ztm/src/components/rfid_reader_panel/rfid_reader_panel.dart';
import 'package:ztm/src/components/tag_list/tag_list.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/models/scanned_tag_item.dart';
import 'package:ztm/src/modules/home/controllers/associacao.dart';

class AssociacaoView extends StatelessWidget {
  const AssociacaoView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(AssociacaoController());

    return Scaffold(
      appBar: AppBar(title: Text('Associação #${controller.movementId}')),
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
                      uniqueTagsCount: controller.scannedTags.length,
                      tipoEquipamento: controller.tipoEquipamento.value,
                    ),
                  ),
                ),
              ),

              // Excess Warning Section
              SliverToBoxAdapter(
                child: Obx(() {
                  if (controller.excessTags.isEmpty) {
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
                        child: Row(
                          spacing: Sizes.md,
                          children: [
                            Icon(
                              Icons.warning_amber_rounded,
                              color: Get.theme.colorScheme.onErrorContainer,
                            ),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Atenção: Etiquetas Excedentes!',
                                    style: Get.textTheme.bodyMedium?.copyWith(
                                      color: Get
                                          .theme
                                          .colorScheme
                                          .onErrorContainer,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    'Foram lidas ${controller.excessTags.length} tags a mais do que o esperado. Conclusão bloqueada.',
                                    style: Get.textTheme.bodySmall?.copyWith(
                                      color: Get
                                          .theme
                                          .colorScheme
                                          .onErrorContainer,
                                    ),
                                  ),
                                ],
                              ),
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
                  itemCount: controller.products.length + 1,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: Sizes.md),
                  itemBuilder: (context, index) {
                    if (index == controller.products.length) {
                      return Obx(() {
                        if (controller.excessTags.isEmpty) {
                          return const SizedBox.shrink();
                        }
                        return Card(
                          elevation: 1,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(
                              Constants.borderRadius,
                            ),
                            side: BorderSide(
                              color: Colors.orange.withValues(alpha: 0.5),
                              width: 1.5,
                            ),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(Sizes.md),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        'Tags Excedentes',
                                        style: Get.textTheme.titleMedium
                                            ?.copyWith(
                                              fontWeight: FontWeight.bold,
                                              color: Colors.orange,
                                            ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: Sizes.sm,
                                        vertical: Sizes.xs,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.orange.withValues(
                                          alpha: 0.1,
                                        ),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        '${controller.excessTags.length}',
                                        style: Get.textTheme.bodySmall
                                            ?.copyWith(
                                              color: Colors.orange,
                                              fontWeight: FontWeight.bold,
                                            ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: Sizes.xs),
                                Text(
                                  'Tags lidas a mais do que o esperado ou de código não reconhecido.',
                                  style: Get.textTheme.bodySmall?.copyWith(
                                    color:
                                        Get.theme.colorScheme.onSurfaceVariant,
                                  ),
                                ),
                                const SizedBox(height: Sizes.md),
                                TagListComponent(
                                  tags: controller.excessTags,
                                  validator: (t) => TagValidationStatus.warning,
                                ),
                              ],
                            ),
                          ),
                        );
                      });
                    }

                    final p = controller.products[index];
                    return Obx(() {
                      final scanned =
                          p['scannedTags'] as RxList<ScannedTagItem>;
                      final expected = p['quantidadeEsperada'] as int;
                      final isComplete = scanned.length == expected;
                      final hasError = scanned.any(
                        (t) =>
                            t.status.value != 'OK' &&
                            t.status.value != 'PENDENTE',
                      );

                      return Card(
                        elevation: 1,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(
                            Constants.borderRadius,
                          ),
                          side: BorderSide(
                            color: hasError
                                ? Get.theme.colorScheme.error.withValues(
                                    alpha: 0.8,
                                  )
                                : isComplete
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
                                        color: hasError
                                            ? Get
                                                  .theme
                                                  .colorScheme
                                                  .errorContainer
                                            : isComplete
                                            ? Colors.green.withValues(
                                                alpha: 0.1,
                                              )
                                            : Get
                                                  .theme
                                                  .colorScheme
                                                  .primaryContainer,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        '${scanned.length} / $expected',
                                        style: Get.textTheme.bodySmall
                                            ?.copyWith(
                                              color: hasError
                                                  ? Get
                                                        .theme
                                                        .colorScheme
                                                        .onErrorContainer
                                                  : isComplete
                                                  ? Colors.green
                                                  : Get
                                                        .theme
                                                        .colorScheme
                                                        .onPrimaryContainer,
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
                                  color: hasError
                                      ? Get.theme.colorScheme.error
                                      : isComplete
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
                                    'Tags Associadas:',
                                    style: Get.textTheme.bodySmall?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: Sizes.xs),
                                TagListComponent(
                                  tags: scanned,
                                  validator: (t) {
                                    if (t.status.value == 'JA_CADASTRADA') {
                                      return TagValidationStatus.error;
                                    }
                                    return TagValidationStatus.ok;
                                  },
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
          label: const Text('CONCLUIR ASSOCIAÇÃO'),
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          initiallyExpanded: true,
          onPressed: () => controller.submit(),
        );
      }),
    );
  }
}
