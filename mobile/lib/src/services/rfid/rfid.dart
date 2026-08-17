import 'dart:async';

import 'package:get/get.dart';
import 'package:rfid_reader/bluetooth/rfid_bluetooth_connection_state.dart';
import 'package:rfid_reader/bluetooth/rfid_bluetooth_device.dart';
import 'package:rfid_reader/rfid_devices.dart';
import 'package:rfid_reader/rfid_reader.dart';
import 'package:ztm/src/services/settings/settings.dart';

class RfidService extends GetxService {
  final _settings = Get.find<SettingsService>();
  final _reader = RfidReader.reader;

  final connectionState = RfidBluetoothConnectionState.unknown.obs;
  final selectedDevice = Rx<RfidBluetoothDevice?>(null);

  /// The current WebSocket URI (built from equipamento + settings).
  final webSocketUri = Rxn<String>();

  // Host and port from the movimentação's equipamento, stored for URI rebuilds.
  String? _wsHost;
  int? _wsPort;

  /// Initializes the RFID interface with the saved device from settings.
  Future<RfidService> init() async {
    // We do NOT call setInterface here on startup because initializing the
    // Chainway/Honeywell native SDK blocks the standard Android BluetoothLeScanner
    // which we use for finding BLE devices before connecting.
    // Interface will be set when actually connecting.
    _reader.addListener(_onReaderStateChanged);
    return this;
  }

  void _onReaderStateChanged() async {
    connectionState.value = await _reader.getStatus();
  }

  @override
  void onClose() {
    _reader.removeListener(_onReaderStateChanged);
    super.onClose();
  }

  /// Sets the RFID reader interface for the given device.
  Future<bool> setDevice(RfidDevices? device) async {
    return _reader.setInterface(device);
  }

  /// Checks if the current selected device matches the given equipment type.
  /// If it mismatches (e.g. equipment is ANTENA but device is SLED), resets the device.
  Future<void> checkAndResetDeviceIfMismatched(String? equipmentType) async {
    if (equipmentType == null) return;
    final currentDevice = _settings.rfidDevice.value;
    if (currentDevice == null) return;

    final isAntenna =
        currentDevice == RfidDevices.r3 || currentDevice == RfidDevices.ur4;
    final isSled =
        currentDevice == RfidDevices.ih25 ||
        currentDevice == RfidDevices.r6 ||
        currentDevice == RfidDevices.c72;

    if ((equipmentType == 'ANTENA' && !isAntenna) ||
        (equipmentType == 'SLED' && !isSled)) {
      await _settings.saveSettings({PrefEntry.rfidDevice: null});
      await setDevice(null);
      await disconnect();
    }
  }

  /// Stores the equipamento host/port and builds the WebSocket URI.
  ///
  /// [host] and [port] come from the movimentação's equipamento
  /// (`ipConexao` / `portaConexao`). Protocol and endpoint come from
  /// user settings (`wsProtocol` / `wsEndpoint`).
  void setWebSocketUri({required String host, int? port}) {
    _wsHost = host;
    _wsPort = port;
    _buildWebSocketUri();
  }

  /// Rebuilds the WebSocket URI using stored host/port and current settings.
  void refreshWebSocketUri() {
    if (_wsHost != null) _buildWebSocketUri();
  }

  void _buildWebSocketUri() {
    final protocol = _settings.wsProtocol.value;
    final endpoint = _settings.wsEndpoint.value;
    final portPart = _wsPort != null ? ':$_wsPort' : '';
    final endpointPart = endpoint.isNotEmpty ? '/$endpoint' : '';
    webSocketUri.value = '$protocol://$_wsHost$portPart$endpointPart';
  }

  /// Provides a stream of tags, automatically filtering them based on current Settings
  Stream<dynamic> get readTags {
    final filterEnabled = _settings.rssiMinimoEnabled.value;
    final rssiMin = _settings.rssiMinimo.value;
    final rssiMax = _settings.rssiMaximo.value;

    return _reader.readTags().where((tag) {
      if (tag == null) return false;

      if (filterEnabled) {
        final absVal =
            double.tryParse(tag.rssi.replaceAll(',', '.'))?.abs() ?? 0.0;
        if (absVal < rssiMin || absVal > rssiMax) {
          return false;
        }
      }
      return true;
    });
  }

  /// Connects to the RFID device.
  ///
  /// For BLE devices, pass [mac]. For WebSocket devices, uses the URI
  /// previously set via [setWebSocketUri].
  Future<bool> connect({String? mac}) async {
    if (connectionState.value == RfidBluetoothConnectionState.connected) {
      return false;
    }

    // Set the interface right before connecting!
    final rfidDeviceEnum = _settings.rfidDevice.value;
    if (rfidDeviceEnum != null) {
      final initSuccess = await setDevice(rfidDeviceEnum);
      if (!initSuccess) {
        connectionState.value = RfidBluetoothConnectionState.disconnected;
        return false;
      }
    }

    connectionState.value = RfidBluetoothConnectionState.connecting;

    bool success = false;
    try {
      if (_reader.isWebDevice) {
        final uri = webSocketUri.value;
        if (uri == null) {
          connectionState.value = RfidBluetoothConnectionState.disconnected;
          return false;
        }
        success = await _reader.connect(url: uri);
      } else {
        if (mac == null) {
          connectionState.value = RfidBluetoothConnectionState.disconnected;
          return false;
        }
        success = await _reader.connect(mac: mac);
      }

      if (success) {
        await _reader.setBuzzer(_settings.buzzer.value);
        await _reader.setPower(_settings.potencia.value);
        await _reader.setTagFocus(_settings.tagFocus.value);
      }
    } catch (e) {
      success = false;
    } finally {
      connectionState.value = await _reader.getStatus();
    }
    return success;
  }

  /// Desconecta do dispositivo RFID.
  Future<bool> disconnect() async {
    connectionState.value = RfidBluetoothConnectionState.connecting;
    final success = await _reader.disconnect();
    connectionState.value = await _reader.getStatus();
    selectedDevice.value = null;
    return success;
  }

  /// Searches for nearby Bluetooth devices.
  Stream<RfidBluetoothDevice?> searchBTDevices({List<String>? arguments}) {
    return _reader.searchBTDevices(arguments: arguments);
  }

  /// Stops searching for Bluetooth devices.
  Future<void> stopScan() async {
    await _reader.stopScan();
  }
}
