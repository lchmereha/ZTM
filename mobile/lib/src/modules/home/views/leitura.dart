import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/components/collapsable_fab.dart';
import 'package:ztm/src/components/rfid_reader_panel/rfid_reader_panel.dart';
import 'package:ztm/src/components/tag_list/tag_list.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/models/scanned_tag_item.dart';
import 'package:ztm/src/modules/home/controllers/leitura.dart';
import 'package:ztm/src/services/snackbar/snackbar.dart';
import 'package:ztm/src/utils/screen.dart';

class LeituraView extends StatelessWidget {
  const LeituraView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(LeituraController());

    return Obx(() {
      final isReading = controller.isReading.value;

      return PopScope(
        canPop: !isReading,
        onPopInvokedWithResult: (didPop, result) {
          if (!didPop && isReading) {
            Get.find<SnackbarService>().warning(
              'Ação Bloqueada',
              'Pare a leitura antes de sair da tela.',
            );
          }
        },
        child: Scaffold(
          resizeToAvoidBottomInset: false,
          appBar: AppBar(
            title: Obx(() {
              final mode = controller.selectedMode.value;
              if (mode == 'SIMPLES') {
                return const Text('Leitura Simples');
              } else if (mode == 'BAIXA') {
                return Text('Baixa #${controller.movementId}');
              }
              return const Text('Processo de Leitura');
            }),
            actions: [
              Obx(() {
                if (controller.selectedMode.value.isEmpty) {
                  return const SizedBox.shrink();
                }
                return Tooltip(
                  message: 'Trocar modo',
                  child: IconButton(
                    icon: const Icon(Icons.swap_horiz),
                    onPressed: isReading
                        ? null
                        : () => controller.selectMode(''),
                  ),
                );
              }),
            ],
          ),
          body: SafeArea(
            child: Obx(() {
              final mode = controller.selectedMode.value;
              if (mode.isEmpty) {
                return _buildModeSelector(controller);
              }
              return _buildLeituraPanel(controller);
            }),
          ),
          floatingActionButton: Obx(() {
            if (controller.selectedMode.value != 'BAIXA') {
              return const SizedBox.shrink();
            }

            return CollapsableFab(
              icon: const Icon(Icons.check_circle_outline),
              label: const Text('CONCLUIR BAIXA'),
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
              initiallyExpanded: true,
              onPressed: () => controller.submit(),
            );
          }),
        ),
      );
    });
  }

  Widget _buildLeituraPanel(LeituraController controller) {
    return CustomScrollView(
      slivers: [
        // Reader Control Panel
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

        // Scanned Tags List
        //
        // `scannedTags` é RxList: passar a referência não conta como leitura de
        // observável, então este Obx não registrava dependência nenhuma. O GetX
        // aborta nesse caso ("improper use of a GetX has been detected") e o
        // erro derruba o CustomScrollView inteiro — no release a tela de
        // Leitura ficava em branco. `toList()` percorre a lista aqui dentro,
        // criando o vínculo, e ela volta a reconstruir a cada lote lido.
        // (`.value` resolveria também, mas é `@protected` no RxList.)
        Obx(
          () => TagListSliver(
            tags: controller.scannedTags.toList(),
            validator: (t) {
              switch (t.status.value) {
                case 'NAO_ENCONTRADA':
                  return TagValidationStatus.error;
                case 'JA_BAIXADA':
                  return TagValidationStatus.warning;
                default:
                  return TagValidationStatus.ok;
              }
            },
          ),
        ),
        const SliverPadding(
          padding: EdgeInsets.only(bottom: 2 * Sizes.lg + 56),
        ),
      ],
    );
  }

  Widget _buildModeSelector(LeituraController controller) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(Sizes.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Selecione o tipo de leitura que deseja realizar:',
              style: Get.textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Sizes.xl),

            // Simple Scan Button Card
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Constants.borderRadius),
              ),
              child: InkWell(
                onTap: () => controller.selectMode('SIMPLES'),
                borderRadius: BorderRadius.circular(Constants.borderRadius),
                child: Padding(
                  padding: EdgeInsets.all(Screen.pick(Sizes.md, Sizes.xl)),
                  child: Column(
                    children: [
                      Icon(
                        Icons.nfc_outlined,
                        size: Screen.pick(36.0, 48.0),
                        color: Get.theme.colorScheme.primary,
                      ),
                      const SizedBox(height: Sizes.md),
                      Text(
                        'Leitura Simples',
                        style: Get.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: Sizes.xs),
                      Text(
                        'Apenas monitora as tags RFID lidas na tela. Sem conexão ou alteração no servidor.',
                        style: Get.textTheme.bodySmall?.copyWith(
                          color: Get.theme.colorScheme.onSurfaceVariant,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: Sizes.md),

            // Checkout (Baixa) Button Card
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Constants.borderRadius),
              ),
              child: InkWell(
                onTap: () => controller.selectMode('BAIXA'),
                borderRadius: BorderRadius.circular(Constants.borderRadius),
                child: Padding(
                  padding: EdgeInsets.all(Screen.pick(Sizes.md, Sizes.xl)),
                  child: Column(
                    children: [
                      Icon(
                        Icons.check_circle_outline,
                        size: Screen.pick(36.0, 48.0),
                        color: Colors.green,
                      ),
                      const SizedBox(height: Sizes.md),
                      Text(
                        'Baixa nas Etiquetas',
                        style: Get.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: Sizes.xs),
                      Text(
                        'Escaneia as tags, valida com o banco de dados e registra a baixa física delas no servidor.',
                        style: Get.textTheme.bodySmall?.copyWith(
                          color: Get.theme.colorScheme.onSurfaceVariant,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
