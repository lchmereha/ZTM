import 'package:get/get.dart';
import 'package:ztm/src/components/dialogs/confirm_logout.dart';
import 'package:ztm/src/models/movimentacao.dart';
import 'package:ztm/src/services/api/auth/auth_service.dart';
import 'package:ztm/src/services/api/movimentacao/movimentacao_api.dart';
import 'package:ztm/src/services/snackbar/snackbar.dart';

class HomeController extends GetxController {
  final _movApi = Get.find<MovimentacaoApiService>();
  final _authService = Get.find<AuthService>();
  final _snackbar = Get.find<SnackbarService>();

  final isLoading = false.obs;
  final movements = <Movimentacao>[].obs;

  @override
  void onInit() {
    super.onInit();
    fetchMovements();
  }

  Future<void> fetchMovements() async {
    if (isLoading.value) return;
    isLoading.value = true;

    try {
      final allMovs = await _movApi.getPendentes();

      // Filter by the active filial
      final activeFilialId = _authService.selectedFilial.value?.idFilial;
      if (activeFilialId != null) {
        movements.assignAll(
          allMovs.where((m) => m.idFilial == activeFilialId).toList(),
        );
      } else {
        movements.assignAll(allMovs);
      }
    } catch (e) {
      _snackbar.error(
        'Erro',
        'Falha ao carregar as movimentações do servidor.',
      );
    } finally {
      isLoading.value = false;
    }
  }

  void changeFilial() {
    _authService.changeFilial();
  }

  Future<void> logout() => confirmAndLogout();
}
