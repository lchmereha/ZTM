import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:rfid_reader/rfid_reader.dart';
import 'package:ztm/src/services/settings/settings.dart';

class TagFocus extends StatelessWidget {
  final RxBool isReading;

  const TagFocus({super.key, required this.isReading});

  @override
  Widget build(BuildContext context) {
    final settingsService = Get.find<SettingsService>();
    final reader = RfidReader.reader;

    return Obx(() {
      return ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Icon(Symbols.point_scan),
        title: Text('Tag Focus'),
        trailing: Switch(
          value: settingsService.tagFocus.value,
          onChanged: isReading.value
              ? null
              : (val) async {
                  await settingsService.saveSettings({PrefEntry.tagFocus: val});
                  await reader.setTagFocus(val);
                },
        ),
        onTap: isReading.value
            ? null
            : () async {
                final newVal = !settingsService.tagFocus.value;
                await settingsService.saveSettings({
                  PrefEntry.tagFocus: newVal,
                });
                await reader.setTagFocus(newVal);
              },
      );
    });
  }
}
