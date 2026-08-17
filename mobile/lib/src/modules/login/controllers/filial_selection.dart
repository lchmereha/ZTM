import 'dart:convert';

import 'package:get/get.dart';
import 'package:ztm/src/constants/endpoints.dart';
import 'package:ztm/src/models/login_response.dart';
import 'package:ztm/src/services/api/auth/auth_service.dart';
import 'package:ztm/src/services/http/http.dart';
import 'package:ztm/src/services/log/log.dart';

class FilialSelectionController extends GetxController {
  final _http = Get.find<HttpService>();
  final _authService = Get.find<AuthService>();
  final _log = Get.find<LogService>();

  final isLoading = true.obs;
  final filiais = <FilialModel>[].obs;

  @override
  void onInit() {
    super.onInit();
    _fetchFiliais();
  }

  Future<void> _fetchFiliais() async {
    try {
      isLoading.value = true;
      final res = await _http.get(Endpoints.filiais);
      final List<dynamic> jsonList = jsonDecode(res.body);
      final loadedFiliais = jsonList
          .map((e) => FilialModel.fromJson(e))
          .toList();
      filiais.assignAll(loadedFiliais);
    } catch (e) {
      _log.e(
        tag: 'FilialSelectionController',
        subTag: '_fetchFiliais',
        e: 'Erro ao buscar filiais: $e',
      );
      // Se falhar a busca, podemos usar o que já está salvo no AuthService como fallback
      final cachedFiliais = _authService.loginData.value?.user.filiais ?? [];
      filiais.assignAll(cachedFiliais);
    } finally {
      isLoading.value = false;
    }
  }

  void selectFilial(FilialModel filial) {
    _authService.selectFilial(filial);
  }
}
