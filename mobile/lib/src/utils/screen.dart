import 'package:get/get.dart';

/// Ajustes de densidade para os coletores industriais alvo.
///
/// Zebra TC25 e Chainway C72 são 480x800 físicos em ~217dpi, o que dá
/// **320x533 dp lógicos** — mais estreito que qualquer celular moderno.
/// Descontando barra de status e AppBar, sobram ~450dp de altura útil.
///
/// Usa `Get.width`/`Get.height` em vez de `MediaQuery` para acompanhar o
/// restante do app, que é todo GetX.
abstract class Screen {
  const Screen._();

  /// Abaixo disso a tela é considerada compacta. 360dp é a largura do menor
  /// celular comum; os coletores ficam bem abaixo, em 320dp.
  static const compactWidthThreshold = 360.0;

  static bool get isCompact => Get.width < compactWidthThreshold;

  /// Escolhe entre a variante compacta e a padrão de qualquer valor de layout.
  static T pick<T>(T compact, T regular) => isCompact ? compact : regular;

  /// Teto para a escala de fonte do sistema.
  ///
  /// Vários containers do app têm altura fixa (botão de login, FAB, barra de
  /// ações do leitor). Com a fonte do sistema em "Maior" (1.5x) eles estouram.
  /// 1.3x mantém um ganho real de legibilidade sem quebrar o layout.
  static const maxTextScale = 1.3;
}
