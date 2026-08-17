import 'package:flutter/material.dart';

Color getForegroundColor(Color backgroundColor, [double contrastRatio = 4.5]) {
  final isDark = backgroundColor.computeLuminance() < 0.5;

  final hsl = HSLColor.fromColor(backgroundColor);
  const step = 0.05;
  int i = 1;
  while (true) {
    final offset = i * step;
    final lightness =
        (isDark
                ? (hsl.lightness + offset).clamp(0, 1)
                : (hsl.lightness - offset).clamp(0, 1))
            .toDouble();

    if (_getContrastRatio(lightness, hsl.lightness) >= contrastRatio ||
        lightness >= 1 ||
        lightness <= 0) {
      return hsl.withLightness(lightness).toColor();
    }
    i++;
  }
}

double _getContrastRatio(double a, double b) {
  final double lighter;
  double darker;
  if (a > b) {
    lighter = a;
    darker = b;
  } else {
    darker = a;
    lighter = b;
  }
  if (darker == 0) darker = 1e-9;

  return lighter / darker;
}
