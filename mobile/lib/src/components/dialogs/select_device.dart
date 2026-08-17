import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rfid_reader/rfid_devices.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';

/// Devices that use the WebSocket interface (ANTENA equipment type).
const _antennaDevices = {RfidDevices.r3, RfidDevices.ur4};

/// Devices that use Bluetooth/UART interface (SLED equipment type).
const _sledDevices = {RfidDevices.ih25, RfidDevices.r6, RfidDevices.c72};

class SelectDeviceDialog extends StatefulWidget {
  final RfidDevices? initialDevice;

  /// Optional equipment type filter. When set:
  /// - `'ANTENA'` → shows only web devices (R3, UR4)
  /// - `'SLED'`   → shows only BLE/UART devices (IH25, R6, C72)
  /// - `null`     → shows all devices
  final String? tipoEquipamento;

  const SelectDeviceDialog({
    super.key,
    this.initialDevice,
    this.tipoEquipamento,
  });

  @override
  State<SelectDeviceDialog> createState() => _SelectDeviceDialogState();
}

class _SelectDeviceDialogState extends State<SelectDeviceDialog> {
  RfidDevices? _selectedDevice;

  @override
  void initState() {
    super.initState();
    _selectedDevice = widget.initialDevice;
  }

  List<RfidDevices> get _filteredDevices {
    final devices = RfidDevices.values
        .where((d) => d != RfidDevices.ih25)
        .toList();
    switch (widget.tipoEquipamento) {
      case 'ANTENA':
        return devices.where((d) => _antennaDevices.contains(d)).toList();
      case 'SLED':
        return devices.where((d) => _sledDevices.contains(d)).toList();
      default:
        return devices;
    }
  }

  @override
  Widget build(BuildContext context) {
    final devices = _filteredDevices;

    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Constants.borderRadius),
      ),
      title: Text(
        'Dispositivos RFID',
        style: Get.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
      ),
      content: SizedBox(
        width: double.maxFinite,
        child: ListView.separated(
          shrinkWrap: true,
          itemCount: devices.length,
          separatorBuilder: (context, index) =>
              const SizedBox(height: Sizes.sm),
          itemBuilder: (context, index) {
            final device = devices[index];
            final isSelected = device == _selectedDevice;

            return InkWell(
              onTap: () {
                setState(() {
                  _selectedDevice = device;
                });
              },
              borderRadius: BorderRadius.circular(Constants.borderRadius / 2),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  vertical: Sizes.md,
                  horizontal: Sizes.lg,
                ),
                decoration: BoxDecoration(
                  color: isSelected
                      ? Get.theme.colorScheme.primary.withValues(alpha: 0.1)
                      : Get.theme.colorScheme.surfaceContainer,
                  border: Border.all(
                    color: isSelected
                        ? Get.theme.colorScheme.primary
                        : Colors.transparent,
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(
                    Constants.borderRadius / 2,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      isSelected
                          ? Icons.radio_button_checked
                          : Icons.radio_button_off,
                      color: isSelected
                          ? Get.theme.colorScheme.primary
                          : Get.theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: Sizes.lg),
                    Expanded(
                      child: Text(
                        device.fullName,
                        style: Get.textTheme.bodyMedium?.copyWith(
                          fontWeight: isSelected
                              ? FontWeight.bold
                              : FontWeight.normal,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
      actions: [
        TextButton(onPressed: () => Get.back(), child: const Text('Cancelar')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(Constants.borderRadius / 2),
            ),
          ),
          onPressed: _selectedDevice == null
              ? null
              : () => Get.back(result: _selectedDevice),
          child: const Text('Confirmar'),
        ),
      ],
    );
  }
}
