import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show FilteringTextInputFormatter;
import 'package:get/get.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:ztm/src/services/settings/settings.dart';

class LotesLeitura extends StatefulWidget {
  const LotesLeitura({super.key});

  @override
  State<LotesLeitura> createState() => _LotesLeituraState();
}

class _LotesLeituraState extends State<LotesLeitura> {
  late final TextEditingController _controller;
  final _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    final settingsService = Get.find<SettingsService>();
    _controller = TextEditingController(
      text: settingsService.lotesDeLeitura.value.toString(),
    );
    _focusNode.addListener(() {
      if (!_focusNode.hasFocus) _save();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _save() {
    final parsed = int.tryParse(_controller.text);
    if (parsed != null && parsed > 0) {
      final settingsService = Get.find<SettingsService>();
      if (parsed != settingsService.lotesDeLeitura.value) {
        settingsService.saveSettings({PrefEntry.lotesDeLeitura: parsed});
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final settingsService = Get.find<SettingsService>();
      final currentValue = settingsService.lotesDeLeitura.value.toString();

      // Sync controller if value changed externally (e.g. cache expiry reset)
      if (_controller.text != currentValue && !_focusNode.hasFocus) {
        _controller.text = currentValue;
      }

      return ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Icon(Symbols.stacks),
        title: Text('Lotes de Leitura'),
        trailing: SizedBox(
          width: 80,
          child: TextFormField(
            controller: _controller,
            focusNode: _focusNode,
            decoration: const InputDecoration(
              isDense: true,
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            onFieldSubmitted: (_) => _save(),
            onTapOutside: (_) => _focusNode.unfocus(),
          ),
        ),
      );
    });
  }
}
