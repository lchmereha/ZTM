import 'dart:async';
import 'package:barcode_scanner/barcode_scanner.dart';
import 'package:get/get.dart';

class ScannerService extends GetxService {
  late final BarcodeScanner? _scanner;
  StreamSubscription? _subscription;
  int? _currentListenerId;

  bool get isSupported {
    try {
      return _scanner?.isSuported ?? false;
    } catch (_) {
      return false;
    }
  }

  @override
  void onInit() {
    super.onInit();
    try {
      _scanner = BarcodeScanner.scanner;
    } catch (_) {
      _scanner = null;
    }
  }

  Future<void> listen({
    required int listenerId,
    required void Function(String) onScan,
  }) async {
    await _subscription?.cancel();
    _currentListenerId = listenerId;
    _subscription = _scanner?.scanResult.listen(onScan);
  }

  Future<void> stop({required int listenerId}) async {
    if (_currentListenerId == listenerId) {
      await _subscription?.cancel();
      _subscription = null;
      _currentListenerId = null;
    }
  }
}
