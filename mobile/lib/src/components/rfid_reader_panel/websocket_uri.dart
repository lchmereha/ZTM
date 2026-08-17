import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/services/rfid/rfid.dart';
import 'package:ztm/src/services/settings/settings.dart';

class WebSocketUri extends StatefulWidget {
  final RxBool isReading;

  const WebSocketUri({super.key, required this.isReading});

  @override
  State<WebSocketUri> createState() => _WebSocketUriState();
}

class _WebSocketUriState extends State<WebSocketUri> {
  late final TextEditingController _endpointController;
  final _endpointFocus = FocusNode();

  @override
  void initState() {
    super.initState();
    final s = Get.find<SettingsService>();
    _endpointController = TextEditingController(text: s.wsEndpoint.value);
    _endpointFocus.addListener(() {
      if (!_endpointFocus.hasFocus) _saveEndpoint();
    });
  }

  @override
  void dispose() {
    _endpointController.dispose();
    _endpointFocus.dispose();
    super.dispose();
  }

  void _saveEndpoint() {
    final value = _endpointController.text;
    final s = Get.find<SettingsService>();
    if (value != s.wsEndpoint.value) {
      s.saveSettings({PrefEntry.wsEndpoint: value});
      Get.find<RfidService>().refreshWebSocketUri();
    }
  }

  @override
  Widget build(BuildContext context) {
    final settingsService = Get.find<SettingsService>();

    return Obx(() {
      // Sync controller if value changed externally
      final curEndpoint = settingsService.wsEndpoint.value;
      if (_endpointController.text != curEndpoint && !_endpointFocus.hasFocus) {
        _endpointController.text = curEndpoint;
      }

      return ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Icon(Symbols.cable),
        title: Text('URI do WebSocket'),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: Sizes.sm),
          child: Row(
            spacing: Sizes.sm,
            children: [
              SizedBox(
                width: 90,
                child: DropdownButtonFormField<String>(
                  initialValue: settingsService.wsProtocol.value,
                  decoration: const InputDecoration(
                    labelText: 'Protocolo',
                    isDense: true,
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'ws', child: Text('ws')),
                    DropdownMenuItem(value: 'wss', child: Text('wss')),
                  ],
                  onChanged: widget.isReading.value
                      ? null
                      : (val) async {
                          if (val != null) {
                            await settingsService.saveSettings({
                              PrefEntry.wsProtocol: val,
                            });
                            Get.find<RfidService>().refreshWebSocketUri();
                          }
                        },
                ),
              ),
              Expanded(
                child: TextFormField(
                  controller: _endpointController,
                  focusNode: _endpointFocus,
                  decoration: const InputDecoration(
                    labelText: 'Endpoint',
                    isDense: true,
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                  ),
                  enabled: !widget.isReading.value,
                  onFieldSubmitted: (_) => _saveEndpoint(),
                  onTapOutside: (_) => _endpointFocus.unfocus(),
                ),
              ),
            ],
          ),
        ),
      );
    });
  }
}
