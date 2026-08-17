import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/components/collapsable_fab.dart';
import 'package:ztm/src/components/rfid_reader_panel/rfid_reader_panel.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/modules/home/controllers/transferencia.dart';

import 'invalid_tags_card.dart';
import 'product_list_item.dart';

class TransferenciaView extends StatelessWidget {
  const TransferenciaView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(TransferenciaController());

    return Scaffold(
      appBar: AppBar(title: Text('Transferência #${controller.movementId}')),
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
                  return InvalidTagsCard(invalidTags: controller.invalidTags);
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
                    return ProductListItem(product: controller.products[index]);
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
          label: const Text('CONCLUIR TRANSFERÊNCIA'),
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          initiallyExpanded: true,
          onPressed: () => controller.submit(),
        );
      }),
    );
  }
}
