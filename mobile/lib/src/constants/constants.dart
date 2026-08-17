import 'package:flutter/foundation.dart';

abstract class Constants {
  const Constants._();

  static const double borderRadius = 12;
  static const double borderRadiusWide = 24;
  static const double buttonHeightLogin = 56;
  static const int bleTimeout = 5;
  static const String defaultErrorMessage = 'Ocorreu um erro na aplicação';
  static const double dragHandleSize = 32;
  static const double fontSizeLarge = 20;
  static const double fontSizeMedium = 18;

  /// Piso de legibilidade para dados densos (EPC em chips, códigos em badges).
  /// Nada operacional deve descer abaixo disso: nos coletores alvo (~217dpi,
  /// tela de 4"), operado com luva e sob luz de galpão, 10sp é ilegível.
  static const double fontSizeDenso = 13;
  static const double heightFAB = 56;
  static const double heightRatioDropdownMenu = 0.4;
  static const int hintAlpha = 80;
  static const double iconSize = 24;
  static const double iconSizeLarge = 35;
  static const double iconSizeTextField = 30;
  static const int logoutTimer = 5;
  static const int maxLinesMenu = 2;
  static const double maxWidthLogin = 400;
  static const double menuHeight = 300;
  static const int requestTimeout = kDebugMode ? 20 : 40;
  static const int rfidPowerMax = 30;
  static const int rfidPowerMin = 5;
  static const int snackBarDefaultDuration = 2;
  static const double strokeWidth = 3.5;
  static const double symbolsWeight = 500;
  static const int tagUpdateInterval = 500;
  static const int timeoutInatividade = 30;
  static const double widthCountField = 80;
}
