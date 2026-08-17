import 'package:flutter/material.dart';
import 'package:scrollable_text/scrollable_text.dart';

class TextScrollWrapper extends StatelessWidget {
  final String text;
  final TextStyle? style;

  const TextScrollWrapper(this.text, {super.key, this.style});

  @override
  Widget build(BuildContext context) {
    return ScrollableText(
      text,
      fadeBorderSide: FadeBorderSide.right,
      fadedBorder: true,
      fadedBorderWidth: 0.1,
      intervalSpaces: 10,
      pauseBetween: const Duration(seconds: 3),
      style: style,
      velocity: const Velocity(pixelsPerSecond: Offset(50, 0)),
    );
  }
}
