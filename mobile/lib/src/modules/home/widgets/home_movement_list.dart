import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/components/text_scroll_wrapper.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/models/movimentacao.dart';
import 'package:ztm/src/modules/home/controllers/home.dart';
import 'package:ztm/src/routes/app_routes.dart';

class HomeMovementList extends StatelessWidget {
  final List<Movimentacao> list;

  const HomeMovementList({super.key, required this.list});

  @override
  Widget build(BuildContext context) {
    if (list.isEmpty) {
      return Center(
        child: Text(
          'Sem movimentações nesta categoria.',
          style: Get.textTheme.bodyMedium?.copyWith(
            color: Get.theme.colorScheme.onSurfaceVariant,
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => Get.find<HomeController>().fetchMovements(),
      child: ListView.separated(
        padding: const EdgeInsets.all(Sizes.md),
        itemCount: list.length,
        separatorBuilder: (context, index) => const SizedBox(height: Sizes.md),
        itemBuilder: (context, index) {
          final m = list[index];
          return Card(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(Constants.borderRadius),
            ),
            child: InkWell(
              onTap: () => _navigateToMovement(m),
              borderRadius: BorderRadius.circular(Constants.borderRadius),
              child: Padding(
                padding: const EdgeInsets.all(Sizes.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Movimentação #${m.id}',
                          style: Get.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),

                    if ((m.descricao ?? '').isNotEmpty)
                      Text(
                        m.descricao!,
                        style: Get.textTheme.bodyMedium?.copyWith(height: 1),
                      ),

                    if ((m.codigoIntegracao ?? '').isNotEmpty) ...[
                      const SizedBox(height: Sizes.xs),
                      Row(
                        children: [
                          Text(
                            'Cód. Integração: ',
                            style: Get.textTheme.bodySmall,
                          ),
                          Expanded(
                            child: TextScrollWrapper(
                              m.codigoIntegracao!,
                              style: Get.textTheme.bodySmall?.copyWith(
                                fontFamily: 'UbuntuMono',
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],

                    const Divider(),

                    Row(
                      children: [
                        Text(
                          'Tipo: ',
                          style: Get.textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Expanded(
                          child: TextScrollWrapper(
                            m.tipo.descricao,
                            style: Get.textTheme.bodySmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _navigateToMovement(Movimentacao m) async {
    final type = m.tipo.tipo;
    final args = {'id': m.id};

    if (type == 'ASSOCIACAO') {
      await Get.toNamed(AppRoutes.associacao, arguments: args);
    } else if (type == 'CONFERENCIA') {
      await Get.toNamed(AppRoutes.conferencia, arguments: args);
    } else if (type == 'IMPRESSAO') {
      await Get.toNamed(AppRoutes.impressao, arguments: args);
    } else if (type == 'LEITURA') {
      await Get.toNamed(AppRoutes.leitura, arguments: args);
    } else if (type == 'TRANSFERENCIA') {
      await Get.toNamed(AppRoutes.transferencia, arguments: args);
    }

    if (Get.isRegistered<HomeController>()) {
      Get.find<HomeController>().fetchMovements();
    }
  }
}
