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

class LeituraController extends GetxController {
  final _movApi = Get.find<MovimentacaoApiService>();
  final _rfidService = Get.find<RfidService>();
  final _snackbar = Get.find<SnackbarService>();

  final isLoading = false.obs;
  final isReading = false.obs;
  final isValidating = false.obs;
  final isSubmitting = false.obs;

  late final int movementId;
  final tipoEquipamento = Rxn<String>();
  final selectedMode = RxString(''); // 'SIMPLES', 'BAIXA' ou vazio

  // Scanned tags
  final scannedTags = <ScannedTagItem>[].obs;
  final Map<String, ScannedTagItem> _scannedTagsMap =
      {}; // O(1) cache for performance

  // Buffer para agrupar as leituras e evitar rebuilds síncronos excessivos
  final Map<String, _TagBufferItem> _tagBuffer = {};
  Timer? _flushTimer;

  StreamSubscription? _rfidSubscription;

  @override
  void onInit() {
    super.onInit();
    movementId = Get.arguments['id'] ?? 0;
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
      // Non-critical
    }
  }

  void selectMode(String mode) {
    selectedMode.value = mode;
    clearTags();
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
        if (selectedMode.value == 'BAIXA' &&
            existing.status.value != 'PENDENTE') {
          existing.status.value = 'PENDENTE';
        }
      } else {
        final newTag = ScannedTagItem(
          epc: epc,
          rssi: data.rssi,
          count: data.count,
          status: selectedMode.value == 'SIMPLES' ? 'OK' : 'PENDENTE',
        );
        _scannedTagsMap[epc] = newTag;
        newTags.add(newTag);
      }
    }

    if (newTags.isNotEmpty) {
      scannedTags.addAll(
        newTags,
      ); // Adds all at once, triggering GetX only once!
    }

    _tagBuffer.clear();
  }

  void stopReading() {
    _rfidSubscription?.cancel();
    isReading.value = false;

    // Processar tags residuais se houver
    _flushTimer?.cancel();
    _flushTags();

    // Pro-actively validate tags when scan stops in BAIXA mode
    if (selectedMode.value == 'BAIXA' && scannedTags.isNotEmpty) {
      validateTags();
    }
  }

  void clearTags() {
    stopReading();
    scannedTags.clear();
    _scannedTagsMap.clear();
    _tagBuffer.clear();
  }

  Future<void> validateTags() async {
    if (scannedTags.isEmpty || isValidating.value) return;
    isValidating.value = true;

    final epcs = scannedTags.map((t) => t.epc).toList();

    try {
      final result = await _movApi.validarLeitura(movementId, epcs);
      final List naoEncontrados = result['naoEncontrados'] ?? [];
      final List jaBaixados = result['jaBaixados'] ?? [];

      for (var t in scannedTags) {
        if (naoEncontrados.contains(t.epc)) {
          t.status.value = 'NAO_ENCONTRADA';
        } else if (jaBaixados.contains(t.epc)) {
          t.status.value = 'JA_BAIXADA';
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

  bool get canSubmit {
    if (selectedMode.value != 'BAIXA') return false;
    if (scannedTags.isEmpty) return false;
    if (isValidating.value) return false;

    // Check if any tag has status other than 'OK'
    for (var t in scannedTags) {
      if (t.status.value != 'OK') return false;
    }
    return true;
  }

  Future<void> submit() async {
    if (isSubmitting.value) return;

    if (scannedTags.isEmpty) {
      _snackbar.warning(
        'Ação Inválida',
        'Nenhuma etiqueta lida para concluir a baixa.',
      );
      return;
    }
    if (isValidating.value) {
      _snackbar.info('Aguarde', 'Validação das etiquetas em andamento.');
      return;
    }
    for (var t in scannedTags) {
      if (t.status.value != 'OK') {
        _snackbar.warning(
          'Ação Inválida',
          'Existem etiquetas com status inválido na leitura.',
        );
        return;
      }
    }

    final confirm = await Get.dialog<bool>(
      const BooleanDialog(
        title: 'Confirmar Baixa',
        content:
            'Deseja realmente registrar a baixa das etiquetas lidas no servidor?',
      ),
    );

    if (confirm != true) return;

    isSubmitting.value = true;

    Get.dialog(
      const LoadingDialog(
        title: 'Enviando',
        content: 'Registrando baixa das etiquetas no servidor...',
      ),
      barrierDismissible: false,
    );

    final epcs = scannedTags.map((t) => t.epc).toList();

    try {
      await _movApi.baixaLeitura(movementId, epcs);
      if (Get.isDialogOpen == true) Get.back(); // close loading dialog
      Get.back(); // return to dashboard
      _snackbar.success('Sucesso', 'Baixa realizada com sucesso.');
    } on ApiException catch (e) {
      if (Get.isDialogOpen == true) Get.back();
      Get.dialog(ErrorDialog.fromApiException(e));
    } catch (e) {
      if (Get.isDialogOpen == true) Get.back(); // close loading dialog
      Get.dialog(
        ErrorDialog(
          message: 'Falha ao registrar a baixa no servidor.',
          detalhes: e.toString(),
        ),
      );
    } finally {
      isSubmitting.value = false;
    }
  }
}
