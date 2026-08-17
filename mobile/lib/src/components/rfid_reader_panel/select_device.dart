import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rfid_reader/rfid_devices.dart';
import 'package:ztm/src/components/dialogs/select_device.dart';
import 'package:ztm/src/services/rfid/rfid.dart';
import 'package:ztm/src/services/settings/settings.dart';

class SelectDevice extends StatelessWidget {
  final RxBool isReading;
  final String? tipoEquipamento;

  const SelectDevice({
    super.key,
    required this.isReading,
    this.tipoEquipamento,
  });

  @override
  Widget build(BuildContext context) {
    final rfidService = Get.find<RfidService>();
    final settingsService = Get.find<SettingsService>();

    return Obx(() {
      final device = settingsService.rfidDevice.value;

      return ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Icon(Icons.barcode_reader),
        title: Text('Selecionar Dispositivo'),
        trailing: Icon(Icons.open_in_new),

        onTap: isReading.value
            ? null
            : () async {
                final selected = await Get.dialog<RfidDevices>(
                  SelectDeviceDialog(
                    initialDevice: device,
                    tipoEquipamento: tipoEquipamento,
                  ),
                );
                if (selected != null && selected != device) {
                  await settingsService.saveSettings({
                    PrefEntry.rfidDevice: selected,
                  });
                  if (rfidService.selectedDevice.value != null) {
                    await rfidService.disconnect();
                    rfidService.selectedDevice.value = null;
                  }
                }
              },
      );
    });
  }
}
