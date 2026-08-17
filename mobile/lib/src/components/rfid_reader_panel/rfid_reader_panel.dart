import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/components/rfid_reader_panel/action_bar.dart';
import 'package:ztm/src/components/rfid_reader_panel/connection_header.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/services/settings/settings.dart';

/// Top-level RFID reader card: connection header + settings + action bar.
class RfidReaderPanel extends StatelessWidget {
  final RxBool isReading;
  final VoidCallback onStart;
  final VoidCallback onStop;
  final VoidCallback? onClear;
  final int uniqueTagsCount;
  final String? tipoEquipamento;

  const RfidReaderPanel({
    super.key,
    required this.isReading,
    required this.onStart,
    required this.onStop,
    this.onClear,
    required this.uniqueTagsCount,
    this.tipoEquipamento,
  });

  @override
  Widget build(BuildContext context) {
    final settingsService = Get.find<SettingsService>();

    return Obx(() {
      final device = settingsService.rfidDevice.value;

      return Card(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Constants.borderRadius),
        ),
        child: Padding(
          padding: const EdgeInsets.all(Sizes.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ConnectionHeader(
                isReading: isReading,
                tipoEquipamento: tipoEquipamento,
              ),

              if (device != null) const Divider(height: Sizes.lg),

              ActionBar(
                isReading: isReading,
                onStart: onStart,
                onStop: onStop,
                onClear: onClear,
                uniqueTagsCount: uniqueTagsCount,
                device: device,
              ),
            ],
          ),
        ),
      );
    });
  }
}
