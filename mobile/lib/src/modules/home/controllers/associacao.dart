import 'dart:async';

import 'package:get/get.dart';

import 'package:ztm/src/components/dialogs/boolean.dart';
import 'package:ztm/src/components/dialogs/error.dart';
import 'package:ztm/src/components/dialogs/loading.dart';
import 'package:ztm/src/models/scanned_tag_item.dart';
import 'package:ztm/src/services/api/movimentacao/movimentacao_api.dart';
import 'package:ztm/src/services/http/api_exception.dart';
import 'package:ztm/src/services/rfid/rfid.dart';
import 'package:ztm/src/services/snackbar/snackbar.dart';

class _TagBufferItem {
  int count = 0;
  String rssi = '';
}

class AssociacaoController extends GetxController {
  final _movApi = Get.find<MovimentacaoApiService>();
  final _rfidService = Get.find<RfidService>();
  final _snackbar = Get.find<SnackbarService>();

  final isLoading = false.obs;
  final isReading = false.obs;
  final isSubmitting = false.obs;
  final isValidating = false.obs;

  late final int movementId;
  final tipoEquipamento = Rxn<String>();

  // Products to associate
  // Elements contain: idProduto, codigo, nome, quantidadeEsperada, scannedTags (RxList<ScannedTagItem>)
  final products = <RxMap<String, dynamic>>[].obs;

  // All scanned tags in order
  final scannedTags = <ScannedTagItem>[].obs;
  final Map<String, ScannedTagItem> _scannedTagsMap = {};

  final excessTags = <ScannedTagItem>[].obs;

  // Buffer para agrupar as leituras
  final Map<String, _TagBufferItem> _tagBuffer = {};
  Timer? _flushTimer;

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
    _flushTimer?.cancel();
    _flushTimer = null;
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
      // Non-critical — device filter will show all devices
    }
  }

  Future<void> fetchProducts() async {
    isLoading.value = true;
    try {
      final list = await _movApi.getAssociacaoProdutos(movementId);
      products.assignAll(
        list.map((item) {
          return {
            'idProduto': item['idProduto'] ?? 0,
            'codigo': item['codigo'] ?? '',
            'nome': item['nome'] ?? '',
            'quantidadeEsperada': item['quantidadeEsperada'] ?? 0,
            'scannedTags': <ScannedTagItem>[].obs,
          }.obs;
        }).toList(),
      );
    } on ApiException catch (e) {
      Get.dialog(ErrorDialog.fromApiException(e));
    } catch (e) {
      Get.dialog(
        ErrorDialog(
          message: 'Falha ao buscar produtos da associação.',
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

        var item = _tagBuffer[epc];
        if (item == null) {
          item = _TagBufferItem();
          _tagBuffer[epc] = item;
        }
        item.count++;
        item.rssi = tag.rssi;

        _flushTimer ??= Timer(const Duration(milliseconds: 250), _flushTags);
      },
      onError: (e) {
        stopReading();
        Get.dialog(
          ErrorDialog(message: 'Erro no leitor RFID.', detalhes: e.toString()),
        );
      },
    );
  }

  void _flushTags() {
    _flushTimer = null;
    if (_tagBuffer.isEmpty) return;

    final newTags = <ScannedTagItem>[];

    for (final entry in _tagBuffer.entries) {
      final epc = entry.key;
      final data = entry.value;

      final existing = _scannedTagsMap[epc];
      if (existing != null) {
        existing.count.value += data.count;
        existing.rssi.value = data.rssi;
      } else {
        // If it's already in excessTags, skip it. (This shouldn't happen because it would be in _scannedTagsMap, but just in case)
        if (excessTags.any((t) => t.epc == epc)) continue;

        // Greedy Match
        bool matched = false;
        for (var product in products) {
          final expected = product['quantidadeEsperada'] as int;
          final list = product['scannedTags'] as RxList<ScannedTagItem>;
          if (list.length < expected) {
            final newTag = ScannedTagItem(
              epc: epc,
              rssi: data.rssi,
              count: data.count,
              status: 'PENDENTE',
            );
            list.add(newTag);
            _scannedTagsMap[epc] = newTag;
            newTags.add(newTag);
            matched = true;
            break;
          }
        }

        if (!matched) {
          // Tag is excess
          final excessTag = ScannedTagItem(
            epc: epc,
            rssi: data.rssi,
            count: data.count,
            status: 'EXCEDENTE',
          );
          excessTags.add(excessTag);
          _scannedTagsMap[epc] = excessTag;
          newTags.add(excessTag);
        }
      }
    }

    if (newTags.isNotEmpty) {
      scannedTags.addAll(newTags);
    }

    _tagBuffer.clear();
  }

  void stopReading() {
    _rfidSubscription?.cancel();
    isReading.value = false;

    _flushTimer?.cancel();
    _flushTags();

    if (scannedTags.isNotEmpty) {
      validateTags();
    }
  }

  Future<void> validateTags() async {
    if (scannedTags.isEmpty || isValidating.value) return;
    isValidating.value = true;

    final epcs = scannedTags.map((t) => t.epc).toList();

    try {
      final result = await _movApi.validarAssociacao(movementId, epcs);
      final List jaCadastrados = result['jaCadastrados'] ?? [];

      for (var t in scannedTags) {
        if (jaCadastrados.contains(t.epc)) {
          t.status.value = 'JA_CADASTRADA';
        } else {
          t.status.value = 'OK';
        }
      }
    } on ApiException catch (e) {
      _snackbar.warning('Erro na Validação', e.message);
    } catch (e) {
      _snackbar.warning(
        'Erro na Validação',
        'Falha ao validar etiquetas com o servidor.',
      );
    } finally {
      isValidating.value = false;
    }
  }

  void clearTags() {
    stopReading();
    scannedTags.clear();
    _scannedTagsMap.clear();
    _tagBuffer.clear();
    excessTags.clear();
    for (var product in products) {
      (product['scannedTags'] as RxList<ScannedTagItem>).clear();
    }
  }

  bool get canSubmit {
    if (products.isEmpty) return false;
    if (excessTags.isNotEmpty) return false;
    if (isValidating.value) return false;

    // Every product must have exactly its expected quantity
    for (var product in products) {
      final expected = product['quantidadeEsperada'] as int;
      final current = (product['scannedTags'] as RxList<ScannedTagItem>).length;
      if (current != expected) return false;
    }

    // Every tag must be valid
    for (var t in scannedTags) {
      if (t.status.value != 'OK') return false;
    }

    return true;
  }

  Future<void> submit() async {
    if (!canSubmit || isSubmitting.value) return;

    final confirm = await Get.dialog<bool>(
      const BooleanDialog(
        title: 'Confirmar Associação',
        content:
            'Deseja realmente concluir a associação das tags lidas aos produtos?',
      ),
    );

    if (confirm != true) return;

    isSubmitting.value = true;

    Get.dialog(
      const LoadingDialog(
        title: 'Enviando',
        content: 'Concluindo associação no servidor...',
      ),
      barrierDismissible: false,
    );

    // Map: [{ idProduto, codigoRfid }]
    final tagsList = <Map<String, dynamic>>[];
    for (var product in products) {
      final idProduto = product['idProduto'] as int;
      final list = product['scannedTags'] as RxList<ScannedTagItem>;
      for (var tagItem in list) {
        tagsList.add({'idProduto': idProduto, 'codigoRfid': tagItem.epc});
      }
    }

    try {
      await _movApi.concluirAssociacao(movementId, tagsList);
      if (Get.isDialogOpen == true) Get.back(); // close loading dialog
      Get.back(); // return to dashboard
      _snackbar.success('Sucesso', 'Associação concluída com sucesso.');
    } on ApiException catch (e) {
      if (Get.isDialogOpen == true) Get.back();
      Get.dialog(ErrorDialog.fromApiException(e));
    } catch (e) {
      if (Get.isDialogOpen == true) Get.back(); // close loading dialog
      Get.dialog(
        ErrorDialog(
          message: 'Falha ao concluir associação no servidor.',
          detalhes: e.toString(),
        ),
      );
    } finally {
      isSubmitting.value = false;
    }
  }
}
