import 'dart:async';
import 'package:get/get.dart';

import 'package:ztm/src/components/dialogs/boolean.dart';
import 'package:ztm/src/components/dialogs/error.dart';
import 'package:ztm/src/components/dialogs/loading.dart';
import 'package:ztm/src/services/api/movimentacao/movimentacao_api.dart';
import 'package:ztm/src/services/http/api_exception.dart';
import 'package:ztm/src/services/snackbar/snackbar.dart';

import 'package:ztm/src/services/rfid/rfid.dart';

class ConferenciaController extends GetxController {
  final _movApi = Get.find<MovimentacaoApiService>();
  final _rfidService = Get.find<RfidService>();
  final _snackbar = Get.find<SnackbarService>();

  final isLoading = false.obs;
  final isReading = false.obs;
  final isSubmitting = false.obs;

  late final int movementId;
  final tipoEquipamento = Rxn<String>();

  // Products to check
  // Elements contain: idProduto, codigo, nome, quantidadeConferencia, tagsAtivas (List of Map {id, codigoRfid}), matchedTags (RxList of Map {id, codigoRfid})
  final products = <RxMap<String, dynamic>>[].obs;

  // Tag lists for audit
  final matchedTags = <String, Map<String, dynamic>>{}
      .obs; // key: epc, value: {idProduto, idTagRfid}
  final invalidTags = <String, String>{}
      .obs; // key: epc, value: reason ('EXCEDENTE' or 'DESCONHECIDA')
  final scannedEpcs = <String>[].obs; // Order of scan

  StreamSubscription? _rfidSubscription;

  @override
  void onInit() {
    super.onInit();
    movementId = Get.arguments['id'] ?? 0;
    fetchProducts();
    _fetchEquipamentoType();
  }

  @override
  void onClose() {
    stopReading();
    _rfidService.disconnect();
    super.onClose();
  }

  Future<void> _fetchEquipamentoType() async {
    try {
      final mov = await _movApi.getMovimentacao(movementId);
      tipoEquipamento.value = mov.equipamento?.tipo;
      await _rfidService.checkAndResetDeviceIfMismatched(tipoEquipamento.value);
      final ip = mov.equipamento?.ipConexao;
      if (ip != null && ip.isNotEmpty) {
        _rfidService.setWebSocketUri(
          host: ip,
          port: mov.equipamento?.portaConexao,
        );
      }
    } catch (_) {
      // Non-critical
    }
  }

  Future<void> fetchProducts() async {
    isLoading.value = true;
    try {
      final list = await _movApi.getConferenciaProdutos(movementId);
      products.assignAll(
        list.map((item) {
          final tagsAtivasList = List.from(item['tagsAtivas'] ?? []);
          return {
            'idProduto': item['idProduto'] ?? 0,
            'codigo': item['codigo'] ?? '',
            'nome': item['nome'] ?? '',
            'quantidadeConferencia': item['quantidadeConferencia'] ?? 0,
            'tagsAtivas': tagsAtivasList,
            'matchedTags': <Map<String, dynamic>>[].obs,
          }.obs;
        }).toList(),
      );
    } on ApiException catch (e) {
      Get.dialog(ErrorDialog.fromApiException(e));
    } catch (e) {
      Get.dialog(
        ErrorDialog(
          message: 'Falha ao buscar produtos da conferência.',
          detalhes: e.toString(),
        ),
      );
    } finally {
      isLoading.value = false;
    }
  }

  void startReading() {
    if (isReading.value) return;
    isReading.value = true;

    _rfidSubscription = _rfidService.readTags.listen(
      (tag) {
        if (tag == null) return;
        final epc = tag.epc;
        if (scannedEpcs.contains(epc)) return;

        scannedEpcs.add(epc);

        // Check if tag matches any product's tagsAtivas
        Map<String, dynamic>? matchedTagInfo;
        RxMap<String, dynamic>? matchedProduct;

        for (var product in products) {
          final tagsAtivas = product['tagsAtivas'] as List;
          final match = tagsAtivas.firstWhereOrNull(
            (t) => t['codigoRfid'] == epc,
          );
          if (match != null) {
            matchedTagInfo = Map<String, dynamic>.from(match);
            matchedProduct = product;
            break;
          }
        }

        if (matchedProduct != null && matchedTagInfo != null) {
          final expected = matchedProduct['quantidadeConferencia'] as int;
          final matchedList =
              matchedProduct['matchedTags'] as RxList<Map<String, dynamic>>;

          if (matchedList.length < expected) {
            // Success match
            final item = {
              'idProduto': matchedProduct['idProduto'],
              'idTagRfid': matchedTagInfo['id'],
              'codigoRfidLido': epc,
            };
            matchedList.add(item);
            matchedTags[epc] = item;
          } else {
            // Exceeds expected limit
            invalidTags[epc] = 'EXCEDENTE';
          }
        } else {
          // Tag not found in active list
          invalidTags[epc] = 'DESCONHECIDA';
        }
      },
      onError: (e) {
        stopReading();
        Get.dialog(
          ErrorDialog(message: 'Erro no leitor RFID.', detalhes: e.toString()),
        );
      },
    );
  }

  void stopReading() {
    _rfidSubscription?.cancel();
    isReading.value = false;
  }

  void clearTags() {
    stopReading();
    scannedEpcs.clear();
    matchedTags.clear();
    invalidTags.clear();
    for (var product in products) {
      (product['matchedTags'] as RxList<Map<String, dynamic>>).clear();
    }
  }

  bool get hasDivergence {
    for (var product in products) {
      final expected = product['quantidadeConferencia'] as int;
      final current =
          (product['matchedTags'] as RxList<Map<String, dynamic>>).length;
      if (current != expected) return true;
    }
    return false;
  }

  bool get canSubmit {
    if (products.isEmpty) return false;
    if (invalidTags.isNotEmpty) return false;
    return true;
  }

  Future<void> submit() async {
    if (!canSubmit || isSubmitting.value) return;

    if (hasDivergence) {
      final confirm = await Get.dialog<bool>(
        const BooleanDialog(
          title: 'Aviso de Divergência',
          content:
              'Existem diferenças entre a quantidade conferida e a esperada. Deseja finalizar a conferência mesmo assim?',
          trueLabel: 'Finalizar',
          falseLabel: 'Cancelar',
        ),
      );
      if (confirm != true) return;
    } else {
      final confirm = await Get.dialog<bool>(
        const BooleanDialog(
          title: 'Confirmar Conferência',
          content:
              'Todas as quantidades conferem. Deseja concluir a conferência no servidor?',
        ),
      );
      if (confirm != true) return;
    }

    isSubmitting.value = true;

    Get.dialog(
      const LoadingDialog(
        title: 'Enviando',
        content: 'Concluindo conferência no servidor...',
      ),
      barrierDismissible: false,
    );

    // Map: [{ idProduto, idTagRfid, codigoRfidLido }]
    final vinculacoes = matchedTags.values.toList();

    try {
      await _movApi.concluirConferencia(movementId, vinculacoes);
      if (Get.isDialogOpen == true) Get.back(); // close loading dialog
      Get.back(); // return to dashboard
      _snackbar.success('Sucesso', 'Conferência concluída com sucesso.');
    } on ApiException catch (e) {
      if (Get.isDialogOpen == true) Get.back();
      Get.dialog(ErrorDialog.fromApiException(e));
    } catch (e) {
      if (Get.isDialogOpen == true) Get.back(); // close loading dialog
      Get.dialog(
        ErrorDialog(
          message: 'Falha ao concluir conferência no servidor.',
          detalhes: e.toString(),
        ),
      );
    } finally {
      isSubmitting.value = false;
    }
  }
}
