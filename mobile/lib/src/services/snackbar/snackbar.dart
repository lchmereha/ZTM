import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';

/// Severity levels for snackbar notifications.
enum SnackbarSeverity { success, warning, error, info }

/// Centralized snackbar service.
///
/// All snackbar styling is defined here so that changes to position,
/// margins, duration, colors, etc. only need to happen in one place.
class SnackbarService extends GetxService {
  static const _position = SnackPosition.TOP;
  static final _margin = EdgeInsets.all(
    Sizes.md,
  ).copyWith(left: Get.width * 0.25);
  static const _borderRadius = Constants.borderRadius;
  static const _duration = Duration(seconds: Constants.snackBarDefaultDuration);
  static const _forwardCurve = Curves.fastLinearToSlowEaseIn;
  static const _reverseCurve = Curves.easeInOutCubic;

  void show({
    required String title,
    required String message,
    SnackbarSeverity severity = SnackbarSeverity.info,
    Duration? duration,
  }) {
    final (bg, fg) = _resolveColors(severity);

    Get.snackbar(
      title,
      message,
      snackPosition: _position,
      backgroundColor: bg,
      colorText: fg,
      margin: _margin,
      borderRadius: _borderRadius,
      duration: duration ?? _duration,
      forwardAnimationCurve: _forwardCurve,
      reverseAnimationCurve: _reverseCurve,
    );
  }

  void success(String title, String message) {
    show(title: title, message: message, severity: SnackbarSeverity.success);
  }

  void warning(String title, String message) {
    show(title: title, message: message, severity: SnackbarSeverity.warning);
  }

  void error(String title, String message) {
    show(title: title, message: message, severity: SnackbarSeverity.error);
  }

  void info(String title, String message) {
    show(title: title, message: message, severity: SnackbarSeverity.info);
  }

  (Color bg, Color fg) _resolveColors(SnackbarSeverity severity) {
    return switch (severity) {
      SnackbarSeverity.success => (Colors.green, Colors.white),
      SnackbarSeverity.warning => (Colors.orange, Colors.white),
      SnackbarSeverity.error => (Colors.red, Colors.white),
      SnackbarSeverity.info => (Colors.blueGrey, Colors.white),
    };
  }
}
