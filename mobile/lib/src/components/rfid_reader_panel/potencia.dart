import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:rfid_reader/bluetooth/rfid_bluetooth_connection_state.dart';
import 'package:rfid_reader/rfid_reader.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/services/rfid/rfid.dart';
import 'package:ztm/src/services/settings/settings.dart';

class Potencia extends StatefulWidget {
  final RxBool isReading;

  const Potencia({super.key, required this.isReading});

  @override
  State<Potencia> createState() => _PotenciaState();
}

class _PotenciaState extends State<Potencia> {
  late double _localValue;
  bool _dirty = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _localValue = Get.find<SettingsService>().potencia.value.toDouble();
  }

  Future<void> _save() async {
    if (_saving) return;
    setState(() => _saving = true);

    final intVal = _localValue.round();
    final settings = Get.find<SettingsService>();
    await settings.saveSettings({PrefEntry.potencia: intVal});
    await RfidReader.reader.setPower(intVal);

    if (mounted) {
      setState(() {
        _dirty = false;
        _saving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final settingsService = Get.find<SettingsService>();
    final colorScheme = Get.theme.colorScheme;

    return Obx(() {
      final savedValue = settingsService.potencia.value;
      final isConnected =
          Get.find<RfidService>().connectionState.value ==
          RfidBluetoothConnectionState.connected;
      final canInteract = isConnected && !widget.isReading.value;
      final disabled = _saving || !_dirty;
      final disabledColor = colorScheme.onSurface.withAlpha(
        (255 * 0.38).round(),
      );
      final enabledColor = colorScheme.onSecondaryContainer;

      // Sync if changed externally and not dirty
      if (!_dirty && _localValue.round() != savedValue) {
        _localValue = savedValue.toDouble();
      }

      return ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Icon(Symbols.signal_cellular_alt),
        title: Text('Potência RFID'),
        trailing: IconButton.filledTonal(
          color: disabled ? disabledColor : enabledColor,
          style: IconButton.styleFrom(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          icon: _saving
              ? SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: disabledColor,
                  ),
                )
              : Icon(Symbols.save, fill: 1),
          tooltip: 'Aplicar potência',
          onPressed: (disabled || !canInteract) ? null : _save,
        ),
        subtitle: Row(
          spacing: Sizes.sm,
          children: [
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(right: Sizes.sm),
                child: SliderTheme(
                  data: SliderTheme.of(
                    context,
                  ).copyWith(trackShape: _EdgeAlignedTrackShape()),
                  child: Slider(
                    min: Constants.rfidPowerMin.toDouble(),
                    max: Constants.rfidPowerMax.toDouble(),
                    divisions: Constants.rfidPowerMax - Constants.rfidPowerMin,
                    value: _localValue,
                    label: '${_localValue.round()} dBm',
                    onChanged: canInteract
                        ? (val) {
                            setState(() {
                              _localValue = val;
                              _dirty = val.round() != savedValue;
                            });
                          }
                        : null,
                  ),
                ),
              ),
            ),
            Text(
              '${_localValue.round()} dBm',
              style: TextStyle(
                color: colorScheme.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      );
    });
  }
}

class _EdgeAlignedTrackShape extends RoundedRectSliderTrackShape {
  @override
  Rect getPreferredRect({
    required RenderBox parentBox,
    Offset offset = Offset.zero,
    required SliderThemeData sliderTheme,
    bool isEnabled = false,
    bool isDiscrete = false,
  }) {
    final double trackHeight = sliderTheme.trackHeight ?? 4.0;
    final double trackLeft = offset.dx;
    final double trackTop =
        offset.dy + (parentBox.size.height - trackHeight) / 2;
    final double trackWidth = parentBox.size.width;
    return Rect.fromLTWH(trackLeft, trackTop, trackWidth, trackHeight);
  }
}
