import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';

class ProductListItem extends StatelessWidget {
  final Map<String, dynamic> product;

  const ProductListItem({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final scanned = product['matchedTags'] as RxList<Map<String, dynamic>>;
      final expected = product['quantidadeConferencia'] as int;
      final isComplete = scanned.length == expected;

      return Card(
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Constants.borderRadius),
          side: BorderSide(
            color: isComplete
                ? Colors.green.withValues(alpha: 0.5)
                : Colors.transparent,
            width: 1.5,
          ),
        ),
        child: Theme(
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
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
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        product['nome'],
                        style: Get.textTheme.titleMedium?.copyWith(
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
                            ? Colors.green.withValues(alpha: 0.1)
                            : Get.theme.colorScheme.secondaryContainer,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${scanned.length} / $expected',
                        style: Get.textTheme.bodySmall?.copyWith(
                          color: isComplete
                              ? Colors.green
                              : Get.theme.colorScheme.onSecondaryContainer,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Sizes.xs),
                Text(
                  'Código: ${product['codigo']}',
                  style: Get.textTheme.bodySmall,
                ),
                const SizedBox(height: Sizes.sm),
                LinearProgressIndicator(
                  value: expected > 0 ? scanned.length / expected : 0,
                  backgroundColor:
                      Get.theme.colorScheme.surfaceContainerHighest,
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
                    'Transferidas:',
                    style: Get.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: Sizes.xs),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
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
  }
}
