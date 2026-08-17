import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';

class InvalidTagsCard extends StatelessWidget {
  final Map<String, String> invalidTags;

  const InvalidTagsCard({super.key, required this.invalidTags});

  @override
  Widget build(BuildContext context) {
    if (invalidTags.isEmpty) {
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
                        color: Get.theme.colorScheme.onErrorContainer,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              Column(
                children: invalidTags.entries.map((entry) {
                  final isExceeded = entry.value == 'EXCEDENTE';
                  return Tooltip(
                    message: isExceeded ? 'Tag Excedente' : 'Tag Desconhecida',
                    child: Chip(
                      label: Row(
                        children: [
                          Expanded(
                            child: Text(
                              '${entry.key} (${isExceeded ? 'Excesso' : 'Desconhecida'})',
                              style: TextStyle(
                                fontSize: Constants.fontSizeDenso,
                                fontFamily: 'UbuntuMono',
                                color: Get.theme.colorScheme.onErrorContainer,
                              ),
                            ),
                          ),
                        ],
                      ),
                      backgroundColor: Get.theme.colorScheme.error.withValues(
                        alpha: 0.2,
                      ),
                      shape: RoundedRectangleBorder(
                        side: BorderSide(color: Get.theme.colorScheme.error),
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
  }
}
