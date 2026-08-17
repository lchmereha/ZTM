import 'package:get/get.dart';

enum TagValidationStatus { ok, warning, error }

class ScannedTagItem {
  final String epc;
  final RxString rssi;
  final RxInt count;
  final RxString
  status; // Internal status string (e.g. 'OK', 'PENDENTE', 'NAO_ENCONTRADA')

  ScannedTagItem({
    required this.epc,
    required String rssi,
    required int count,
    String status = 'PENDENTE',
  }) : rssi = rssi.obs,
       count = count.obs,
       status = status.obs;
}
