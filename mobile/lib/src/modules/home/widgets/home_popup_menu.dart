import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/modules/home/controllers/home.dart';
import 'package:ztm/src/services/settings/settings.dart';

class HomePopupMenu extends StatelessWidget {
  const HomePopupMenu({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<HomeController>();
    final settingsService = Get.find<SettingsService>();

    return Obx(() {
      final currentMode = settingsService.themeMode.value;
      final themeIcon = switch (currentMode) {
        'dark' => Icons.dark_mode,
        'light' => Icons.light_mode,
        _ => Icons.brightness_auto,
      };
      final themeLabel = switch (currentMode) {
        'dark' => 'Tema: Escuro',
        'light' => 'Tema: Claro',
        _ => 'Tema: Sistema',
      };

      return PopupMenuButton<String>(
        icon: const Icon(Icons.more_vert),
        tooltip: 'Mais opções',
        onSelected: (value) async {
          switch (value) {
            case 'theme':
              final nextMode = switch (currentMode) {
                'system' => 'light',
                'light' => 'dark',
                _ => 'system',
              };
              await settingsService.saveSettings({
                PrefEntry.themeMode: nextMode,
              });
              break;
            case 'filial':
              controller.changeFilial();
              break;
            case 'logout':
              controller.logout();
              break;
          }
        },
        itemBuilder: (context) => [
          PopupMenuItem(
            value: 'theme',
            child: ListTile(
              leading: Icon(themeIcon),
              title: Text(themeLabel),
              dense: true,
              contentPadding: EdgeInsets.zero,
            ),
          ),
          const PopupMenuDivider(),
          PopupMenuItem(
            value: 'filial',
            child: ListTile(
              leading: const Icon(Icons.swap_horiz),
              title: const Text('Trocar Filial'),
              dense: true,
              contentPadding: EdgeInsets.zero,
            ),
          ),
          PopupMenuItem(
            value: 'logout',
            child: ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Sair'),
              dense: true,
              contentPadding: EdgeInsets.zero,
            ),
          ),
        ],
      );
    });
  }
}
