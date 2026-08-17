import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:get/get.dart';
import 'package:ztm/src/app.dart';
import 'package:ztm/src/services/api/auth/auth_service.dart';
import 'package:ztm/src/services/api/movimentacao/movimentacao_api.dart';
import 'package:ztm/src/services/environment/env_manager.dart';
import 'package:ztm/src/services/http/http.dart';
import 'package:ztm/src/services/log/log.dart';
import 'package:ztm/src/services/rfid/rfid.dart';
import 'package:ztm/src/services/scanner/scanner.dart';
import 'package:ztm/src/services/settings/settings.dart';
import 'package:ztm/src/services/snackbar/snackbar.dart';
import 'package:ztm/src/services/zpl/zpl_print_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initServices();
  runApp(const ZtmApp());
}

Future<void> initServices() async {
  // Initialize services using Get.put or Get.putAsync
  // O log agora grava em arquivo, então precisa resolver o diretório antes de
  // qualquer serviço que possa registrar erro na própria inicialização.
  await Get.putAsync(() => LogService().init());
  Get.put(EnvManager());
  await Get.putAsync(() => SettingsService().init());
  Get.put(HttpService());
  Get.put(AuthService());
  Get.put(SnackbarService());
  Get.put(MovimentacaoApiService());
  Get.put(ZplPrintService());
  await Get.putAsync(() => RfidService().init());
  Get.put(ScannerService());
  // Verbose despeja cada pacote BLE no logcat — custa CPU no coletor e polui
  // o log com endereços de dispositivo. Fica só em debug.
  FlutterBluePlus.setLogLevel(kDebugMode ? LogLevel.verbose : LogLevel.error);
}
