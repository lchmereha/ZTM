import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:rfid_reader/rfid_reader.dart';
import 'package:ztm/src/services/settings/settings.dart';

class Buzzer extends StatelessWidget {
  final RxBool isReading;

  const Buzzer({super.key, required this.isReading});

  @override
  Widget build(BuildContext context) {
    final settingsService = Get.find<SettingsService>();
    final reader = RfidReader.reader;

    return Obx(() {
      return ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Icon(Symbols.brand_awareness),
        title: Text('Sinal Sonoro'),
        trailing: Switch(
          value: settingsService.buzzer.value,
          onChanged: isReading.value
              ? null
              : (val) async {
                  await settingsService.saveSettings({PrefEntry.buzzer: val});
                  await reader.setBuzzer(val);
                },
        ),
        onTap: isReading.value
            ? null
            : () async {
                final newVal = !settingsService.buzzer.value;
                await settingsService.saveSettings({PrefEntry.buzzer: newVal});
                await reader.setBuzzer(newVal);
              },
      );
    });
  }
}
