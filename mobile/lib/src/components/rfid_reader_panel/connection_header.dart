import 'package:auto_size_text/auto_size_text.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rfid_reader/bluetooth/rfid_bluetooth_connection_state.dart';
import 'package:rfid_reader/bluetooth/rfid_bluetooth_device.dart';
import 'package:rfid_reader/rfid_devices.dart';
import 'package:ztm/src/components/dialogs/ble_scan.dart';
import 'package:ztm/src/components/rfid_reader_panel/buzzer.dart';
import 'package:ztm/src/components/rfid_reader_panel/filtro_rssi.dart';
import 'package:ztm/src/components/rfid_reader_panel/lotes_leitura.dart';
import 'package:ztm/src/components/rfid_reader_panel/potencia.dart';
import 'package:ztm/src/components/rfid_reader_panel/select_device.dart';
import 'package:ztm/src/components/rfid_reader_panel/tag_focus.dart';
import 'package:ztm/src/components/rfid_reader_panel/websocket_uri.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/services/rfid/rfid.dart';
import 'package:ztm/src/services/settings/settings.dart';

/// ExpansionTile showing device name/status as header, with all RFID
/// settings as expandable children.
class ConnectionHeader extends StatefulWidget {
  final RxBool isReading;
  final String? tipoEquipamento;

  const ConnectionHeader({
    super.key,
    required this.isReading,
    this.tipoEquipamento,
  });

  /// Web devices: R3 and UR4 use WebSocket interface.
  static const _webDevices = {RfidDevices.r3, RfidDevices.ur4};

  @override
  State<ConnectionHeader> createState() => _ConnectionHeaderState();
}

class _ConnectionHeaderState extends State<ConnectionHeader>
    with SingleTickerProviderStateMixin {
  late AnimationController _iconController;
  late Worker _readingWorker;
  bool _isExpanded = false;

  @override
  void initState() {
    super.initState();
    _iconController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _readingWorker = ever(widget.isReading, (bool reading) {
      if (reading && _isExpanded) {
        setState(() {
          _isExpanded = false;
          _iconController.reverse();
        });
      }
    });
  }

  @override
  void dispose() {
    _readingWorker.dispose();
    _iconController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final rfidService = Get.find<RfidService>();
    final settingsService = Get.find<SettingsService>();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Obx(() {
          final isReading = widget.isReading.value;
          final connection = rfidService.connectionState.value;
          final device = settingsService.rfidDevice.value;
          final statusColor = _colorFor(connection);

          return ListTile(
            contentPadding: EdgeInsets.zero,
            onTap: isReading
                ? null
                : () {
                    setState(() {
                      _isExpanded = !_isExpanded;
                      if (_isExpanded) {
                        _iconController.forward();
                      } else {
                        _iconController.reverse();
                      }
                    });
                  },
            leading: _iconFor(connection, device, statusColor),
            trailing: RotationTransition(
              turns: Tween(begin: 0.0, end: 0.25).animate(
                CurvedAnimation(
                  parent: _iconController,
                  curve: Curves.easeInOut,
                ),
              ),
              child: Icon(
                _isExpanded ? Icons.settings : Icons.settings_outlined,
                color: _isExpanded ? Get.theme.colorScheme.primary : null,
              ),
            ),
            title: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        device?.fullName ?? 'Nenhum leitor selecionado',
                        style: Get.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (_subtitleFor(device, connection, rfidService)
                          case final subtitle?)
                        AutoSizeText(
                          subtitle,
                          maxLines:
                              (device == RfidDevices.r3 ||
                                  device == RfidDevices.ur4)
                              ? 1
                              : null,
                          minFontSize: 4,
                          style: Get.textTheme.bodySmall?.copyWith(
                            color: Get.theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                    ],
                  ),
                ),
                if (device != null && device != RfidDevices.c72)
                  _ConnectButton(
                    connection: connection,
                    device: device,
                    isReading: widget.isReading,
                    rfidService: rfidService,
                  ),
              ],
            ),
          );
        }),
        SizeTransition(
          sizeFactor: CurvedAnimation(
            parent: _iconController,
            curve: Curves.easeInOut,
          ),
          alignment: Alignment.topCenter,
          child: Padding(
            padding: const EdgeInsets.only(bottom: Sizes.sm),
            child: Column(
              children: [
                SelectDevice(
                  isReading: widget.isReading,
                  tipoEquipamento: widget.tipoEquipamento,
                ),
                Obx(() {
                  final device = settingsService.rfidDevice.value;
                  if (device != null) {
                    return Column(
                      children: [
                        LotesLeitura(),
                        Buzzer(isReading: widget.isReading),
                        TagFocus(isReading: widget.isReading),
                        FiltroRssi(isReading: widget.isReading),
                        Potencia(isReading: widget.isReading),
                        if (ConnectionHeader._webDevices.contains(device))
                          WebSocketUri(isReading: widget.isReading),
                      ],
                    );
                  }
                  return const SizedBox.shrink();
                }),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ── Subtitle: device-specific info ─────────────────────────────────────

  static String? _subtitleFor(
    RfidDevices? device,
    RfidBluetoothConnectionState connection,
    RfidService rfidService,
  ) {
    if (device == null) return null;

    if (device == RfidDevices.c72) return 'Leitor integrado';

    final isWebDevice = device == RfidDevices.r3 || device == RfidDevices.ur4;
    if (isWebDevice) {
      return rfidService.webSocketUri.value ?? 'WebSocket não configurado';
    }

    // BLE device
    if (connection == RfidBluetoothConnectionState.connecting) {
      return 'Conectando...';
    }

    final connectedDevice = rfidService.selectedDevice.value;
    if (connection != RfidBluetoothConnectionState.connected ||
        connectedDevice == null) {
      return 'Desconectado';
    }

    final name = connectedDevice.name.isNotEmpty
        ? connectedDevice.name
        : 'Dispositivo';
    final mac = connectedDevice.address;
    return mac.isNotEmpty ? '$name\n$mac' : name;
  }

  // ── Connection state → visual mapping ──────────────────────────────────

  static Widget _iconFor(
    RfidBluetoothConnectionState state,
    RfidDevices? device,
    Color color,
  ) {
    if (device == RfidDevices.c72) {
      return const Icon(Icons.nfc, color: Colors.green);
    }

    final isBle = device == RfidDevices.r6 || device == RfidDevices.ih25;
    return switch (state) {
      RfidBluetoothConnectionState.connected => Icon(
        isBle ? Icons.bluetooth_connected : Icons.sensors,
        color: color,
      ),
      RfidBluetoothConnectionState.connecting => Padding(
        padding: EdgeInsets.only(left: 2),
        child: SizedBox.square(
          dimension: 20,
          child: CircularProgressIndicator(color: color, strokeWidth: 3),
        ),
      ),
      _ => Icon(
        isBle ? Icons.bluetooth_disabled : Icons.sensors_off,
        color: color,
      ),
    };
  }

  static Color _colorFor(RfidBluetoothConnectionState state) {
    return switch (state) {
      RfidBluetoothConnectionState.connected => Colors.green,
      RfidBluetoothConnectionState.connecting =>
        Get.theme.colorScheme.onSurfaceVariant,
      _ => Get.theme.colorScheme.error,
    };
  }
}

// ── Connect / Disconnect button ──────────────────────────────────────────────

class _ConnectButton extends StatelessWidget {
  final RfidBluetoothConnectionState connection;
  final RfidDevices device;
  final RxBool isReading;
  final RfidService rfidService;

  const _ConnectButton({
    required this.connection,
    required this.device,
    required this.isReading,
    required this.rfidService,
  });

  bool get _isConnected => connection == RfidBluetoothConnectionState.connected;

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      return IconButton(
        style: IconButton.styleFrom(visualDensity: VisualDensity.compact),
        icon: Icon(
          (device == RfidDevices.r6 || device == RfidDevices.ih25)
              ? (_isConnected
                    ? Icons.bluetooth_disabled
                    : Icons.bluetooth_connected)
              : (_isConnected ? Icons.sensors_off : Icons.sensors),
          color: Get.theme.colorScheme.onSurfaceVariant,
        ),
        tooltip: _isConnected ? 'Desconectar' : 'Conectar',
        onPressed: isReading.value ? null : _onPressed,
      );
    });
  }

  Future<void> _onPressed() async {
    if (_isConnected) {
      await rfidService.disconnect();
    } else {
      if (device == RfidDevices.r6 || device == RfidDevices.ih25) {
        final selectedBleDevice = await Get.dialog<RfidBluetoothDevice>(
          const BleScanDialog(),
        );
        if (selectedBleDevice != null) {
          final success = await rfidService.connect(
            mac: selectedBleDevice.address,
          );
          if (success) {
            rfidService.selectedDevice.value = selectedBleDevice;
          }
        }
      } else {
        await rfidService.connect();
      }
    }
  }
}
