import 'dart:io';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/components/dialogs/boolean.dart';
import 'package:ztm/src/components/dialogs/error.dart';
import 'package:ztm/src/components/dialogs/loading.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/models/movimentacao.dart';
import 'package:ztm/src/services/api/movimentacao/movimentacao_api.dart';
import 'package:ztm/src/services/http/api_exception.dart';
import 'package:ztm/src/services/snackbar/snackbar.dart';
import 'package:ztm/src/services/zpl/zpl_print_service.dart';

class ImpressaoController extends GetxController {
  final _movApi = Get.find<MovimentacaoApiService>();
  final _zplPrint = Get.find<ZplPrintService>();
  final _snackbar = Get.find<SnackbarService>();

  final isLoading = false.obs;
  final isProcessing = false.obs;
  final isPrinting = false.obs;
  final isFinalizing = false.obs;

  late final int movementId;
  final movement = Rx<Movimentacao?>(null);

  // Grouped products containing: codigo, nome, quantity, tags (List of EPC strings)
  final products = <Map<String, dynamic>>[].obs;

  @override
  void onInit() {
    super.onInit();
    movementId = Get.arguments['id'] ?? 0;
    fetchMovementDetails();
  }

  Future<void> fetchMovementDetails() async {
    isLoading.value = true;
    try {
      final mov = await _movApi.getMovimentacao(movementId);
      movement.value = mov;

      products.clear();
      if (mov.situacao == 'IMPORTADO') {
        final items = await _movApi.getImportacaoItems(movementId);
        products.assignAll(
          items
              .map(
                (i) => {
                  'codigo': i.codigo,
                  'nome': i.nome ?? '',
                  'quantidade': i.quantidade,
                  'tags': <String>[],
                },
              )
              .toList(),
        );
      } else {
        // PROCESSADO or FINALIZADO
        final data = await _movApi.getProcessedTags(movementId);
        final list = List.from(data['produtos'] ?? []);
        products.assignAll(
          list.map((p) {
            final tags = List.from(p['tags'] ?? []);
            return {
              'codigo': p['codigo'] ?? '',
              'nome': p['nome'] ?? '',
              'quantidade': tags.length,
              'tags': tags
                  .map((t) => t['codigoRfid']?.toString() ?? '')
                  .toList(),
            };
          }).toList(),
        );
      }
    } on ApiException catch (e) {
      Get.dialog(ErrorDialog.fromApiException(e));
    } catch (e) {
      Get.dialog(
        ErrorDialog(
          message: 'Falha ao carregar detalhes da movimentação de impressão.',
          detalhes: e.toString(),
        ),
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> process() async {
    if (isProcessing.value) return;

    final widgets = products.map((p) {
      return Padding(
        padding: const EdgeInsets.only(bottom: Sizes.xs),
        child: Text('• ${p['nome']} (${p['codigo']}): ${p['quantidade']} tags'),
      );
    }).toList();

    final confirm = await Get.dialog<bool>(
      BooleanDialog(
        title: 'Confirmar Geração',
        content: 'Deseja gerar as etiquetas RFID para os itens abaixo?',
        contentWidget: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: widgets,
        ),
        trueLabel: 'Gerar',
        falseLabel: 'Cancelar',
      ),
    );

    if (confirm != true) return;

    isProcessing.value = true;

    Get.dialog(
      const LoadingDialog(
        title: 'Processando',
        content: 'Gerando etiquetas RFID no servidor...',
      ),
      barrierDismissible: false,
    );

    try {
      await _movApi.processarMovimentacao(movementId);
      if (Get.isDialogOpen == true) Get.back(); // close loading dialog
      await fetchMovementDetails();
      _snackbar.success('Sucesso', 'Etiquetas RFID geradas com sucesso.');
    } on ApiException catch (e) {
      if (Get.isDialogOpen == true) Get.back();
      Get.dialog(ErrorDialog.fromApiException(e));
    } catch (e) {
      if (Get.isDialogOpen == true) Get.back();
      Get.dialog(
        ErrorDialog(
          message: 'Falha ao processar etiquetas RFID.',
          detalhes: e.toString(),
        ),
      );
    } finally {
      isProcessing.value = false;
    }
  }

  Future<void> printTags() async {
    if (isPrinting.value) return;
    isPrinting.value = true;

    Get.dialog(
      const LoadingDialog(
        title: 'Preparando',
        content: 'Obtendo dados de impressão do servidor...',
      ),
      barrierDismissible: false,
    );

    try {
      // 1. Get ZPL commands from API (client-side mode)
      final data = await _movApi.imprimirTags(movementId);
      if (Get.isDialogOpen == true) Get.back();

      final ip = data['ipConexao'] as String;
      final port = data['portaConexao'] as int;
      final zplCommands = List<String>.from(data['zplCommands'] ?? []);

      // 2. Send ZPL to local printer via TCP
      Get.dialog(
        const LoadingDialog(
          title: 'Imprimindo',
          content: 'Enviando etiquetas para a impressora local...',
        ),
        barrierDismissible: false,
      );

      await _zplPrint.printZpl(ip: ip, port: port, zplCommands: zplCommands);
      if (Get.isDialogOpen == true) Get.back();

      // 3. Prompt confirmation dialog
      final printedCorrectly = await Get.dialog<bool>(
        const BooleanDialog(
          title: 'Confirmação de Impressão',
          content: 'As etiquetas foram impressas corretamente?',
          trueLabel: 'Sim, Concluir',
          falseLabel: 'Não, Reimprimir',
        ),
      );

      if (printedCorrectly == true) {
        await _finalize();
      }
    } on SocketException catch (e) {
      if (Get.isDialogOpen == true) Get.back();
      Get.dialog(
        ErrorDialog(
          message: 'Não foi possível conectar à impressora local.',
          detalhes:
              'Verifique se o equipamento está ligado e conectado à mesma rede Wi-Fi.\n\n'
              'Detalhes: ${e.message}',
        ),
      );
    } on ApiException catch (e) {
      if (Get.isDialogOpen == true) Get.back();
      Get.dialog(ErrorDialog.fromApiException(e));
    } catch (e) {
      if (Get.isDialogOpen == true) Get.back();
      Get.dialog(
        ErrorDialog(
          message: 'Falha ao emitir ordem de impressão.',
          detalhes: e.toString(),
        ),
      );
    } finally {
      isPrinting.value = false;
    }
  }

  Future<void> _finalize() async {
    isFinalizing.value = true;
    Get.dialog(
      const LoadingDialog(
        title: 'Finalizando',
        content: 'Finalizando movimentação de impressão...',
      ),
      barrierDismissible: false,
    );

    try {
      await _movApi.finalizarMovimentacao(movementId);
      if (Get.isDialogOpen == true) Get.back(); // close loading dialog
      Get.back(); // return to dashboard
      _snackbar.success('Sucesso', 'Movimentação finalizada com sucesso.');
    } on ApiException catch (e) {
      if (Get.isDialogOpen == true) Get.back();
      Get.dialog(ErrorDialog.fromApiException(e));
    } catch (e) {
      if (Get.isDialogOpen == true) Get.back(); // close loading dialog
      Get.dialog(
        ErrorDialog(
          message: 'Falha ao finalizar a movimentação.',
          detalhes: e.toString(),
        ),
      );
    } finally {
      isFinalizing.value = false;
    }
  }
}
