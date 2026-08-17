import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show FilteringTextInputFormatter;
import 'package:get/get.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/services/settings/settings.dart';

class FiltroRssi extends StatefulWidget {
  final RxBool isReading;

  const FiltroRssi({super.key, required this.isReading});

  @override
  State<FiltroRssi> createState() => _FiltroRssiState();
}

class _FiltroRssiState extends State<FiltroRssi> {
  late final TextEditingController _minController;
  late final TextEditingController _maxController;
  final _minFocus = FocusNode();
  final _maxFocus = FocusNode();

  @override
  void initState() {
    super.initState();
    final s = Get.find<SettingsService>();
    _minController = TextEditingController(
      text: s.rssiMinimo.value.toInt().toString(),
    );
    _maxController = TextEditingController(
      text: s.rssiMaximo.value.toInt().toString(),
    );
    _minFocus.addListener(() {
      if (!_minFocus.hasFocus) _saveMin();
    });
    _maxFocus.addListener(() {
      if (!_maxFocus.hasFocus) _saveMax();
    });
  }

  @override
  void dispose() {
    _minController.dispose();
    _maxController.dispose();
    _minFocus.dispose();
    _maxFocus.dispose();
    super.dispose();
  }

  void _saveMin() {
    final parsed = int.tryParse(_minController.text);
    if (parsed != null) {
      final s = Get.find<SettingsService>();
      if (parsed.toDouble() != s.rssiMinimo.value) {
        s.saveSettings({PrefEntry.rssiMinimo: parsed.toDouble()});
      }
    }
  }

  void _saveMax() {
    final parsed = int.tryParse(_maxController.text);
    if (parsed != null) {
      final s = Get.find<SettingsService>();
      if (parsed.toDouble() != s.rssiMaximo.value) {
        s.saveSettings({PrefEntry.rssiMaximo: parsed.toDouble()});
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final settingsService = Get.find<SettingsService>();

    return Obx(() {
      final enabled = settingsService.rssiMinimoEnabled.value;

      // Sync controllers if values changed externally
      final curMin = settingsService.rssiMinimo.value.toInt().toString();
      final curMax = settingsService.rssiMaximo.value.toInt().toString();
      if (_minController.text != curMin && !_minFocus.hasFocus) {
        _minController.text = curMin;
      }
      if (_maxController.text != curMax && !_maxFocus.hasFocus) {
        _maxController.text = curMax;
      }

      return Column(
        children: [
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Transform.rotate(
              angle: pi / 2,
              child: Icon(Symbols.compress),
            ),
            title: Text('Filtro RSSI'),
            trailing: Switch(
              value: enabled,
              onChanged: widget.isReading.value
                  ? null
                  : (val) async {
                      await settingsService.saveSettings({
                        PrefEntry.rssiMinimoEnabled: val,
                      });
                    },
            ),
            onTap: widget.isReading.value
                ? null
                : () async {
                    await settingsService.saveSettings({
                      PrefEntry.rssiMinimoEnabled: !enabled,
                    });
                  },
          ),
          if (enabled)
            Padding(
              padding: const EdgeInsets.only(
                left: 40 + Sizes.md, // align with ListTile content
                right: Sizes.md,
                bottom: Sizes.sm,
              ),
              child: Row(
                spacing: Sizes.md,
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _minController,
                      focusNode: _minFocus,
                      decoration: const InputDecoration(
                        labelText: 'RSSI Mín.',
                        isDense: true,
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                      ),
                      keyboardType: TextInputType.numberWithOptions(
                        signed: true,
                      ),
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'^-?\d*')),
                      ],
                      enabled: !widget.isReading.value,
                      onFieldSubmitted: (_) => _saveMin(),
                      onTapOutside: (_) => _minFocus.unfocus(),
                    ),
                  ),
                  Expanded(
                    child: TextFormField(
                      controller: _maxController,
                      focusNode: _maxFocus,
                      decoration: const InputDecoration(
                        labelText: 'RSSI Máx.',
                        isDense: true,
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                      ),
                      keyboardType: TextInputType.numberWithOptions(
                        signed: true,
                      ),
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'^-?\d*')),
                      ],
                      enabled: !widget.isReading.value,
                      onFieldSubmitted: (_) => _saveMax(),
                      onTapOutside: (_) => _maxFocus.unfocus(),
                    ),
                  ),
                ],
              ),
            ),
        ],
      );
    });
  }
}
