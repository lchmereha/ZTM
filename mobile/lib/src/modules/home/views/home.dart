import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/modules/home/controllers/home.dart';
import 'package:ztm/src/modules/home/widgets/home_drawer.dart';
import 'package:ztm/src/modules/home/widgets/home_movement_list.dart';
import 'package:ztm/src/modules/home/widgets/home_popup_menu.dart';

class HomeView extends StatefulWidget {
  const HomeView({super.key});

  @override
  State<HomeView> createState() => _HomeViewState();
}

class _HomeViewState extends State<HomeView> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(HomeController());

    return PopScope(
      canPop: false,
      child: Scaffold(
        appBar: AppBar(
          title: Text(homeCategories[_selectedIndex].label),
          actions: [
            IconButton(
              visualDensity: VisualDensity.compact,
              icon: const Icon(Icons.refresh),
              tooltip: 'Recarregar',
              onPressed: () => controller.fetchMovements(),
            ),
            const HomePopupMenu(),
          ],
        ),
        drawer: HomeDrawer(
          selectedIndex: _selectedIndex,
          onSelectCategory: (index) {
            setState(() {
              _selectedIndex = index;
            });
            controller.fetchMovements();
          },
        ),
        body: Obx(() {
          if (controller.isLoading.value) {
            return const Center(child: CircularProgressIndicator());
          }

          final movs = controller.movements;
          if (movs.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(Sizes.xl),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  spacing: Sizes.md,
                  children: [
                    Icon(
                      Icons.inventory_2_outlined,
                      size: 64,
                      color: Get.theme.colorScheme.onSurfaceVariant,
                    ),
                    Text(
                      'Nenhuma movimentação pendente encontrada para esta filial.',
                      style: Get.textTheme.titleMedium,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }

          final filteredList = movs
              .where((m) => m.tipo.tipo == homeCategories[_selectedIndex].type)
              .toList();

          return HomeMovementList(list: filteredList);
        }),
      ),
    );
  }
}
