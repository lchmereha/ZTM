import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';

class LoadingDialog extends StatelessWidget {
  final String? title;
  final String? content;
  final VoidCallback? onCancel;

  const LoadingDialog({super.key, this.title, this.content, this.onCancel});

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: onCancel != null,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop && onCancel != null) {
          onCancel!();
        }
      },
      child: AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Constants.borderRadius),
        ),
        title: title != null
            ? Text(
                title!,
                style: Get.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              )
            : null,
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (content != null) ...[
              Text(
                content!,
                style: Get.textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: Sizes.lg),
            ],
            const Center(child: CircularProgressIndicator()),
          ],
        ),
        actions: onCancel != null
            ? [
                TextButton(
                  onPressed: () {
                    onCancel!();
                    Navigator.of(context).pop();
                  },
                  child: const Text('Cancelar'),
                ),
              ]
            : null,
      ),
    );
  }
}
