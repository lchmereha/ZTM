import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rfid_reader/bluetooth/rfid_bluetooth_connection_state.dart';
import 'package:rfid_reader/rfid_devices.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/services/rfid/rfid.dart';

/// Bottom bar: unique tag counter + clear button + start/stop button.
class ActionBar extends StatelessWidget {
  final RxBool isReading;
  final VoidCallback onStart;
  final VoidCallback onStop;
  final VoidCallback? onClear;
  final int uniqueTagsCount;
  final RfidDevices? device;

  const ActionBar({
    super.key,
    required this.isReading,
    required this.onStart,
    required this.onStop,
    this.onClear,
    required this.uniqueTagsCount,
    required this.device,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      spacing: Sizes.sm,
      children: [
        // ── Tag counter (flexible to avoid overflow) ──
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: Get.theme.colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(Constants.borderRadius / 2),
            ),
            height: 40,
            padding: const EdgeInsets.symmetric(horizontal: Sizes.sm),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              spacing: Sizes.xs,
              children: [
                Icon(
                  Icons.nfc,
                  size: 20,
                  color: Get.theme.colorScheme.onPrimaryContainer,
                ),
                Flexible(
                  child: Text(
                    'Lidas: $uniqueTagsCount',
                    style: Get.textTheme.titleSmall?.copyWith(
                      color: Get.theme.colorScheme.onPrimaryContainer,
                      fontWeight: FontWeight.bold,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),

        // ── Clear button ──
        if (onClear != null && uniqueTagsCount > 0)
          Obx(() {
            if (isReading.value) return const SizedBox.shrink();
            return IconButton(
              style: IconButton.styleFrom(
                backgroundColor: Get.theme.colorScheme.errorContainer,
                foregroundColor: Get.theme.colorScheme.onErrorContainer,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(
                    Constants.borderRadius / 2,
                  ),
                ),
              ),
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Limpar leituras',
              onPressed: onClear,
            );
          }),

        // ── Start / Stop button ──
        _ReadButton(
          isReading: isReading,
          onStart: onStart,
          onStop: onStop,
          enabled: device != null,
        ),
      ],
    );
  }
}

// ── Read / Stop button ───────────────────────────────────────────────────────

class _ReadButton extends StatelessWidget {
  final RxBool isReading;
  final VoidCallback onStart;
  final VoidCallback onStop;
  final bool enabled;

  const _ReadButton({
    required this.isReading,
    required this.onStart,
    required this.onStop,
    required this.enabled,
  });

  @override
  Widget build(BuildContext context) {
    final rfidService = Get.find<RfidService>();

    return Obx(() {
      final reading = isReading.value;
      final isConnected =
          rfidService.connectionState.value ==
          RfidBluetoothConnectionState.connected;
      final isActuallyEnabled = enabled && isConnected;

      return ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: reading
              ? Get.theme.colorScheme.error
              : Get.theme.colorScheme.primary,
          foregroundColor: reading
              ? Get.theme.colorScheme.onError
              : Get.theme.colorScheme.onPrimary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Constants.borderRadius / 2),
          ),
          padding: const EdgeInsets.symmetric(horizontal: Sizes.md),
        ),
        icon: Icon(reading ? Icons.stop : Icons.play_arrow),
        label: Text(reading ? 'PARAR' : 'LER'),
        onPressed: isActuallyEnabled ? (reading ? onStop : onStart) : null,
      );
    });
  }
}
