import 'dart:async';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:loading_animation_widget/loading_animation_widget.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/services/environment/env_manager.dart';
import 'package:ztm/src/services/scanner/scanner.dart';
import 'package:ztm/src/services/settings/settings.dart';

class BarcodeScanController extends GetxController {
  final _scanner = Get.find<ScannerService>();
  final _settings = Get.find<SettingsService>();
  final _env = Get.find<EnvManager>();

  final bool allowKeyboardParam;
  final FutureOr<void> Function(String)? onScan;

  final textController = TextEditingController();
  final focusNode = FocusNode();
  final isProcessing = false.obs;
  final isEmpty = true.obs;
  late final bool allowKeyboard;

  BarcodeScanController({this.allowKeyboardParam = false, this.onScan});

  @override
  void onInit() {
    super.onInit();
    allowKeyboard =
        allowKeyboardParam ||
        (_env.buildMode != 'PRODUCTION' && !_scanner.isSupported);

    textController.addListener(_textListener);

    if (_scanner.isSupported) {
      _scanner.listen(listenerId: hashCode, onScan: _onScanReceived);
    }
  }

  @override
  void onClose() {
    if (_scanner.isSupported) {
      _scanner.stop(listenerId: hashCode);
    }
    textController.removeListener(_textListener);
    textController.dispose();
    focusNode.dispose();
    super.onClose();
  }

  void _onScanReceived(String rawScan) {
    if (isClosed || isProcessing.value) return;

    final delimiter = _settings.delim.value ?? '';
    String processedScan = rawScan;

    if (delimiter.isNotEmpty &&
        rawScan.startsWith(delimiter) &&
        rawScan.endsWith(delimiter)) {
      processedScan = rawScan.substring(
        delimiter.length,
        rawScan.length - delimiter.length,
      );
    }

    textController.text = processedScan;
    submit(processedScan);
  }

  void _textListener() {
    isEmpty.value = textController.text.isEmpty;
  }

  void clear() {
    textController.clear();
    isEmpty.value = true;
  }

  Future<void> submit(String value) async {
    if (isProcessing.value || value.isEmpty) return;
    isProcessing.value = true;
    try {
      await Future.value(onScan?.call(value));
    } finally {
      isProcessing.value = false;
    }
  }
}

class BarcodeScanField extends StatelessWidget {
  final bool allowKeyboard;
  final bool listenOnly;
  final void Function(String)? onScan;
  final BarcodeScanController? controller;

  const BarcodeScanField({
    super.key,
    this.allowKeyboard = false,
    this.listenOnly = false,
    this.onScan,
    this.controller,
  });

  @override
  Widget build(BuildContext context) {
    if (controller != null) {
      return _buildContent(context, controller!);
    }

    return GetBuilder<BarcodeScanController>(
      tag: hashCode.toString(),
      init: BarcodeScanController(
        allowKeyboardParam: allowKeyboard,
        onScan: onScan,
      ),
      builder: (controller) {
        return _buildContent(context, controller);
      },
    );
  }

  Widget _buildContent(BuildContext context, BarcodeScanController controller) {
    if (listenOnly) {
      return _buildListenOnly(context, controller);
    }

    final isSupported = Get.find<ScannerService>().isSupported;
    final isProduction = Get.find<EnvManager>().buildMode == 'PRODUCTION';

    if (!isSupported && !controller.allowKeyboard && isProduction) {
      return _buildNotSupported(context);
    }

    return _buildFullField(context, controller);
  }

  Widget _buildFullField(
    BuildContext context,
    BarcodeScanController controller,
  ) {
    return Row(
      spacing: Sizes.sm,
      children: [
        Expanded(
          child: TextField(
            canRequestFocus: controller.allowKeyboard,
            controller: controller.textController,
            decoration: InputDecoration(
              border: const OutlineInputBorder(),
              labelText: 'Leitura',
              labelStyle: TextStyle(
                fontSize: Get.textTheme.titleMedium?.fontSize,
              ),
              prefixIcon: const Icon(
                Icons.qr_code_scanner,
                size: Constants.iconSize,
              ),
              suffixIcon: IconButton(
                onPressed: controller.clear,
                icon: const Icon(Icons.close),
              ),
            ),
            enableInteractiveSelection: controller.allowKeyboard,
            focusNode: controller.focusNode,
            keyboardType: controller.allowKeyboard
                ? TextInputType.number
                : TextInputType.none,
            readOnly: !controller.allowKeyboard,
            style: Get.textTheme.titleMedium,
            onSubmitted: controller.submit,
            onTapOutside: (_) => controller.focusNode.unfocus(),
          ),
        ),

        Obx(() {
          return ElevatedButton(
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.all(Sizes.md),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Constants.borderRadius / 2),
              ),
            ),
            onPressed: controller.isEmpty.value
                ? null
                : () => controller.submit(controller.textController.value.text),
            child: controller.isProcessing.value
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.send),
          );
        }),
      ],
    );
  }

  Widget _buildListenOnly(
    BuildContext context,
    BarcodeScanController controller,
  ) {
    const dimension = Constants.iconSize * 1.5;

    return Center(
      child: Obx(
        () => Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              controller.isProcessing.value
                  ? 'Processando...'
                  : 'Escaneie um código',
              style: Get.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(width: Sizes.md),
            SizedBox.square(
              dimension: dimension,
              child: controller.isProcessing.value
                  ? LoadingAnimationWidget.fourRotatingDots(
                      color: Get.theme.colorScheme.onSurface,
                      size: dimension,
                    )
                  : Stack(
                      alignment: Alignment.center,
                      children: [
                        LoadingAnimationWidget.threeArchedCircle(
                          color: Get.theme.colorScheme.onSurface,
                          size: dimension,
                        ),
                        const Icon(
                          Icons.qr_code_2_outlined,
                          size: dimension * 0.7,
                        ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotSupported(BuildContext context) {
    return Container(
      alignment: Alignment.center,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(Constants.borderRadius),
        color: Get.theme.colorScheme.errorContainer,
      ),
      padding: const EdgeInsets.all(Sizes.md),
      child: Text(
        'Este dispositivo não possui suporte para leitura de código de barras/QR.',
        style: Get.textTheme.bodyMedium?.copyWith(
          color: Get.theme.colorScheme.onErrorContainer,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}
