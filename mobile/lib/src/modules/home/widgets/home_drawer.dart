import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/services/api/auth/auth_service.dart';

class DrawerCategory {
  final String label;
  final IconData icon;
  final String type;

  const DrawerCategory({
    required this.label,
    required this.icon,
    required this.type,
  });
}

const homeCategories = [
  DrawerCategory(label: 'Associação', icon: Icons.link, type: 'ASSOCIACAO'),
  DrawerCategory(
    label: 'Conferência',
    icon: Icons.check_circle_outline,
    type: 'CONFERENCIA',
  ),
  DrawerCategory(
    label: 'Impressão',
    icon: Icons.print_outlined,
    type: 'IMPRESSAO',
  ),
  DrawerCategory(label: 'Leitura', icon: Icons.nfc_outlined, type: 'LEITURA'),
  DrawerCategory(
    label: 'Transferência',
    icon: Icons.swap_horiz,
    type: 'TRANSFERENCIA',
  ),
];

class HomeDrawer extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onSelectCategory;

  const HomeDrawer({
    super.key,
    required this.selectedIndex,
    required this.onSelectCategory,
  });

  @override
  Widget build(BuildContext context) {
    final authService = Get.find<AuthService>();

    return Obx(() {
      final logo = authService.logo;
      final filialName = authService.selectedFilial.value?.nome ?? 'ZTM';

      return SafeArea(
        child: Drawer(
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              // ── Logo & Filial Name ──
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  Sizes.lg,
                  Sizes.xl,
                  Sizes.lg,
                  Sizes.md,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (logo != null && logo.isNotEmpty) ...[
                      Builder(
                        builder: (_) {
                          try {
                            final isUrl =
                                logo.startsWith('http://') ||
                                logo.startsWith('https://');
                            return ConstrainedBox(
                              constraints: const BoxConstraints(maxHeight: 56),
                              child: isUrl
                                  ? Image.network(
                                      logo,
                                      fit: BoxFit.contain,
                                      alignment: Alignment.centerLeft,
                                      errorBuilder: (_, _, _) =>
                                          const SizedBox.shrink(),
                                    )
                                  : (() {
                                      final raw = logo.contains(',')
                                          ? logo.split(',').last
                                          : logo;
                                      return Image.memory(
                                        base64Decode(raw),
                                        fit: BoxFit.contain,
                                        alignment: Alignment.centerLeft,
                                        errorBuilder: (_, _, _) =>
                                            const SizedBox.shrink(),
                                      );
                                    })(),
                            );
                          } catch (_) {
                            return const SizedBox.shrink();
                          }
                        },
                      ),
                      const SizedBox(height: Sizes.sm),
                    ],
                    Text(
                      filialName,
                      style: Get.textTheme.titleSmall?.copyWith(
                        color: Get.theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(indent: Sizes.lg, endIndent: Sizes.lg),

              // ── Navigation Items ──
              ...List.generate(homeCategories.length, (index) {
                final cat = homeCategories[index];
                final isSelected = index == selectedIndex;

                return Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 2,
                  ),
                  child: Material(
                    color: isSelected
                        ? Get.theme.colorScheme.secondaryContainer
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(28),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(28),
                      onTap: () {
                        onSelectCategory(index);
                        Navigator.of(context).pop();
                      },
                      child: SizedBox(
                        height: 56,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Row(
                            spacing: 12,
                            children: [
                              Icon(
                                cat.icon,
                                color: isSelected
                                    ? Get.theme.colorScheme.onSecondaryContainer
                                    : Get.theme.colorScheme.onSurfaceVariant,
                              ),
                              Text(
                                cat.label,
                                style: Get.textTheme.labelLarge?.copyWith(
                                  color: isSelected
                                      ? Get
                                            .theme
                                            .colorScheme
                                            .onSecondaryContainer
                                      : Get.theme.colorScheme.onSurfaceVariant,
                                  fontWeight: isSelected
                                      ? FontWeight.bold
                                      : FontWeight.normal,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
      );
    });
  }
}
