import 'dart:convert';

import 'package:get/get.dart';
import 'package:ztm/src/constants/endpoints.dart';
import 'package:ztm/src/models/movimentacao.dart';
import 'package:ztm/src/services/http/http.dart';
import 'package:ztm/src/services/settings/settings.dart';

class MovimentacaoApiService extends GetxService {
  final _http = Get.find<HttpService>();

  /// Busca todas as movimentações pendentes para o usuário.
  Future<List<Movimentacao>> getPendentes() async {
    final res = await _http.get(Endpoints.movimentacaoPendentes);
    final List list = jsonDecode(res.body);
    return list.map((item) => Movimentacao.fromJson(item)).toList();
  }

  /// Busca todas as movimentações disponíveis para o usuário.
  Future<List<Movimentacao>> getMovimentacoes() async {
    final res = await _http.get(Endpoints.movimentacao);
    final List list = jsonDecode(res.body);
    return list.map((item) => Movimentacao.fromJson(item)).toList();
  }

  /// Busca os detalhes de uma única movimentação.
  Future<Movimentacao> getMovimentacao(int id) async {
    final res = await _http.get(Endpoints.oneMovimentacao(id));
    final data = jsonDecode(res.body);
    // Em caso de array retornado pela API, pega o primeiro item.
    final record = data is List ? data.first : data;
    return Movimentacao.fromJson(record);
  }

  // ── IMPRESSÃO ──────────────────────────────────────────────────────────────

  /// Busca os itens importados da planilha na movimentação.
  Future<List<ImportacaoItemModel>> getImportacaoItems(int id) async {
    final res = await _http.get(Endpoints.importacaoItems(id));
    final List list = jsonDecode(res.body);
    return list.map((e) => ImportacaoItemModel.fromJson(e)).toList();
  }

  /// Processa a movimentação gerando as etiquetas RFID.
  Future<Map<String, dynamic>> processarMovimentacao(int id) async {
    final res = await _http.post(Endpoints.processar(id));
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// Busca as tags processadas/geradas da movimentação.
  Future<Map<String, dynamic>> getProcessedTags(int id) async {
    final res = await _http.get(Endpoints.processedTags(id));
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// Solicita ao servidor os comandos ZPL para impressão client-side.
  Future<Map<String, dynamic>> imprimirTags(int id) async {
    final res = await _http.post(
      Endpoints.imprimir(id),
      body: {'clientSide': true},
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// Finaliza a movimentação de impressão.
  Future<void> finalizarMovimentacao(int id) async {
    await _http.post(Endpoints.finalizar(id));
  }

  // ── ASSOCIAÇÃO ─────────────────────────────────────────────────────────────

  /// Lista os produtos da associação.
  Future<List<Map<String, dynamic>>> getAssociacaoProdutos(int id) async {
    final res = await _http.get(Endpoints.associacaoProdutos(id));
    final List list = jsonDecode(res.body);
    return list.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  /// Conclui e finaliza o processo de associação de tags a produtos.
  Future<Map<String, dynamic>> concluirAssociacao(
    int id,
    List<Map<String, dynamic>> tagsList,
  ) async {
    final body = {'tags': tagsList};
    final res = await _http.post(Endpoints.concluirAssociacao(id), body: body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// Valida tags antes da associação (retorna as que já estão cadastradas)
  Future<Map<String, dynamic>> validarAssociacao(
    int id,
    List<String> codigosRfid,
  ) async {
    final body = {'codigosRfid': codigosRfid};
    final res = await _http.post(Endpoints.validarAssociacao(id), body: body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // ── CONFERÊNCIA ────────────────────────────────────────────────────────────

  /// Lista os produtos e as tags ativas da conferência.
  Future<List<Map<String, dynamic>>> getConferenciaProdutos(int id) async {
    final res = await _http.get(Endpoints.conferenciaProdutos(id));
    final List list = jsonDecode(res.body);
    return list.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  /// Conclui e finaliza o processo de conferência.
  Future<Map<String, dynamic>> concluirConferencia(
    int id,
    List<Map<String, dynamic>> vinculacoes,
  ) async {
    final body = {'vinculacoes': vinculacoes};
    final res = await _http.post(Endpoints.concluirConferencia(id), body: body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // ── TRANSFERÊNCIA ────────────────────────────────────────────────────────────

  /// Lista os produtos e as tags ativas da transferência.
  Future<List<Map<String, dynamic>>> getTransferenciaProdutos(int id) async {
    final res = await _http.get(Endpoints.transferenciaProdutos(id));
    final List list = jsonDecode(res.body);
    return list.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  /// Conclui e finaliza o processo de transferência.
  Future<Map<String, dynamic>> concluirTransferencia(
    int id,
    List<Map<String, dynamic>> vinculacoes,
  ) async {
    final body = {'vinculacoes': vinculacoes};
    final res = await _http.post(
      Endpoints.concluirTransferencia(id),
      body: body,
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // ── LEITURA / BAIXA ────────────────────────────────────────────────────────

  /// Valida as tags lidas para dar baixa (verifica inexistentes e já baixadas).
  Future<Map<String, dynamic>> validarLeitura(
    int id,
    List<String> codigosRfid,
  ) async {
    final body = {'codigosRfid': codigosRfid};
    final res = await _http.post(Endpoints.validarLeitura(id), body: body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// Dá baixa nas tags RFID da leitura.
  Future<Map<String, dynamic>> baixaLeitura(
    int id,
    List<String> codigosRfid,
  ) async {
    final body = {'codigosRfid': codigosRfid};
    final res = await _http.post(Endpoints.baixaLeitura(id), body: body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// Busca o relatório de baixa da movimentação de leitura finalizada.
  Future<Map<String, dynamic>> getRelatorioLeitura(int id) async {
    final res = await _http.get(Endpoints.relatorioLeitura(id));
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // ── BATCH / LOTES ──────────────────────────────────────────────────────────

  int get _batchSize => Get.find<SettingsService>().lotesDeLeitura.value;

  /// Envia tags de associação em lotes e conclui.
  Future<Map<String, dynamic>> concluirAssociacaoEmLotes(
    int id,
    List<Map<String, dynamic>> tagsList, {
    void Function(int sent, int total)? onProgress,
  }) async {
    final size = _batchSize;
    for (var i = 0; i < tagsList.length; i += size) {
      final end = (i + size > tagsList.length) ? tagsList.length : i + size;
      final batch = tagsList.sublist(i, end);
      await _http.post(Endpoints.lotesAssociacao(id), body: {'tags': batch});
      onProgress?.call(end, tagsList.length);
    }
    final res = await _http.post(Endpoints.concluirLotesAssociacao(id));
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// Envia vinculações de conferência em lotes e conclui.
  Future<Map<String, dynamic>> concluirConferenciaEmLotes(
    int id,
    List<Map<String, dynamic>> vinculacoes, {
    void Function(int sent, int total)? onProgress,
  }) async {
    final size = _batchSize;
    for (var i = 0; i < vinculacoes.length; i += size) {
      final end = (i + size > vinculacoes.length)
          ? vinculacoes.length
          : i + size;
      final batch = vinculacoes.sublist(i, end);
      await _http.post(
        Endpoints.lotesConferencia(id),
        body: {'vinculacoes': batch},
      );
      onProgress?.call(end, vinculacoes.length);
    }
    final res = await _http.post(Endpoints.concluirLotesConferencia(id));
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// Envia vinculações de transferência em lotes e conclui.
  Future<Map<String, dynamic>> concluirTransferenciaEmLotes(
    int id,
    List<Map<String, dynamic>> vinculacoes, {
    void Function(int sent, int total)? onProgress,
  }) async {
    final size = _batchSize;
    for (var i = 0; i < vinculacoes.length; i += size) {
      final end = (i + size > vinculacoes.length)
          ? vinculacoes.length
          : i + size;
      final batch = vinculacoes.sublist(i, end);
      await _http.post(
        Endpoints.lotesTransferencia(id),
        body: {'vinculacoes': batch},
      );
      onProgress?.call(end, vinculacoes.length);
    }
    final res = await _http.post(Endpoints.concluirLotesTransferencia(id));
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// Envia códigos RFID de leitura/baixa em lotes e conclui.
  Future<Map<String, dynamic>> baixaLeituraEmLotes(
    int id,
    List<String> codigosRfid, {
    void Function(int sent, int total)? onProgress,
  }) async {
    final size = _batchSize;
    for (var i = 0; i < codigosRfid.length; i += size) {
      final end = (i + size > codigosRfid.length)
          ? codigosRfid.length
          : i + size;
      final batch = codigosRfid.sublist(i, end);
      await _http.post(
        Endpoints.lotesLeitura(id),
        body: {'codigosRfid': batch},
      );
      onProgress?.call(end, codigosRfid.length);
    }
    final res = await _http.post(Endpoints.concluirLotesLeitura(id));
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// Cancela lotes pendentes de uma movimentação.
  Future<void> cancelarLotes(int id) async {
    await _http.delete(Endpoints.cancelarLotes(id));
  }
}
