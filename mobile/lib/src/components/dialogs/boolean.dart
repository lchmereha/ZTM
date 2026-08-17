import 'dart:async';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';

class BooleanDialog extends StatefulWidget {
  final Duration? countdown;
  final bool countdownResult;
  final String? title;
  final String? content;
  final Widget? contentWidget;
  final String? trueLabel;
  final String? falseLabel;

  const BooleanDialog({
    super.key,
    this.countdown,
    this.countdownResult = false,
    this.title,
    this.content,
    this.contentWidget,
    this.trueLabel,
    this.falseLabel,
  });

  @override
  State<BooleanDialog> createState() => _BooleanDialogState();
}

class _BooleanDialogState extends State<BooleanDialog> {
  Timer? _timer;
  int _secondsRemaining = 0;

  @override
  void initState() {
    super.initState();
    if (widget.countdown != null) {
      _secondsRemaining = widget.countdown!.inSeconds;
      _startTimer();
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining <= 1) {
        timer.cancel();
        Get.back(result: widget.countdownResult);
      } else {
        setState(() {
          _secondsRemaining--;
        });
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    String contentText = widget.content ?? '';
    if (widget.countdown != null) {
      final min = _secondsRemaining ~/ 60;
      final sec = _secondsRemaining % 60;
      final timeStr =
          ' (${min.toString().padLeft(2, '0')}:${sec.toString().padLeft(2, '0')})';
      contentText += contentText.isNotEmpty ? '\n\n$timeStr' : timeStr;
    }

    return AlertDialog(
      scrollable: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Constants.borderRadius),
      ),
      title: widget.title != null
          ? Text(
              widget.title!,
              style: Get.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            )
          : null,
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (contentText.isNotEmpty)
            Text(contentText, style: Get.textTheme.bodyMedium),
          if (widget.contentWidget != null) ...[
            if (contentText.isNotEmpty) const SizedBox(height: Sizes.md),
            widget.contentWidget!,
          ],
        ],
      ),
      actions: [
        TextButton(
          style: TextButton.styleFrom(padding: EdgeInsets.zero),
          onPressed: () => Get.back(result: false),
          child: Text(widget.falseLabel ?? 'Não'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(
            padding: EdgeInsets.zero,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(Constants.borderRadius / 2),
            ),
          ),
          onPressed: () => Get.back(result: true),
          child: Text(widget.trueLabel ?? 'Sim'),
        ),
      ],
    );
  }
}
