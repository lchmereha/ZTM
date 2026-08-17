import 'package:get/get.dart';
import 'package:ztm/src/modules/home/views/associacao.dart';
import 'package:ztm/src/modules/home/views/conferencia.dart';
import 'package:ztm/src/modules/home/views/home.dart';
import 'package:ztm/src/modules/home/views/impressao.dart';
import 'package:ztm/src/modules/home/views/leitura.dart';
import 'package:ztm/src/modules/home/views/transferencia/transferencia.dart';
import 'package:ztm/src/modules/login/views/filial_selection.dart';
import 'package:ztm/src/modules/login/views/login.dart';
import 'package:ztm/src/modules/login/views/settings.dart';
import 'package:ztm/src/routes/app_routes.dart';

class AppPages {
  const AppPages._();

  static const initial = AppRoutes.login;

  static final routes = [
    GetPage(name: AppRoutes.login, page: () => const LoginView()),
    GetPage(
      name: AppRoutes.settings,
      page: () => const SettingsView(),
      fullscreenDialog: true,
    ),
    GetPage(
      name: AppRoutes.filialSelection,
      page: () => const FilialSelectionView(),
    ),
    GetPage(name: AppRoutes.home, page: () => const HomeView()),
    GetPage(name: AppRoutes.associacao, page: () => const AssociacaoView()),
    GetPage(name: AppRoutes.conferencia, page: () => const ConferenciaView()),
    GetPage(name: AppRoutes.impressao, page: () => const ImpressaoView()),
    GetPage(name: AppRoutes.leitura, page: () => const LeituraView()),
    GetPage(
      name: AppRoutes.transferencia,
      page: () => const TransferenciaView(),
    ),
  ];
}
