import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:get/get.dart';
import 'package:ztm/src/localization/app_localizations.dart';
import 'package:ztm/src/localization/app_localizations_pt.dart';
import 'package:ztm/src/routes/app_pages.dart';
import 'package:ztm/src/services/api/auth/auth_service.dart';
import 'package:ztm/src/services/settings/settings.dart';
import 'package:ztm/src/utils/screen.dart';

class ZtmApp extends StatelessWidget {
  const ZtmApp({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = Get.find<AuthService>();
    final settingsService = Get.find<SettingsService>();
    final l10n = AppLocalizationsPtBr();

    return Obx(() {
      final primaryColor = authService.themeColor;

      final lightColorScheme = ColorScheme.fromSeed(
        seedColor: primaryColor,
        primary: primaryColor,
        brightness: Brightness.light,
      );

      final darkColorScheme = ColorScheme.fromSeed(
        seedColor: primaryColor,
        primary: primaryColor,
        brightness: Brightness.dark,
      );

      final themeMode = switch (settingsService.themeMode.value) {
        'dark' => ThemeMode.dark,
        'light' => ThemeMode.light,
        _ => ThemeMode.system,
      };

      return GetMaterialApp(
        title: l10n.appTitle,
        localizationsDelegates: [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: [Locale('pt'), Locale('pt', 'BR')],
        themeMode: themeMode,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: lightColorScheme,
          appBarTheme: AppBarTheme(
            backgroundColor: primaryColor,
            foregroundColor: lightColorScheme.onPrimary,
            elevation: 2,
          ),
          cardTheme: const CardThemeData(elevation: 2, margin: EdgeInsets.zero),
        ),
        darkTheme: ThemeData(
          useMaterial3: true,
          colorScheme: darkColorScheme,
          appBarTheme: AppBarTheme(
            backgroundColor: darkColorScheme.surface,
            foregroundColor: darkColorScheme.onSurface,
            elevation: 2,
          ),
          cardTheme: const CardThemeData(elevation: 2, margin: EdgeInsets.zero),
        ),
        initialRoute: AppPages.initial,
        getPages: AppPages.routes,
        // Único uso de MediaQuery no app: o clamp de escala de fonte não tem
        // equivalente no GetX. O dimensionamento responsivo fica em `Screen`,
        // que usa Get.width/Get.height.
        builder: (context, child) => MediaQuery.withClampedTextScaling(
          maxScaleFactor: Screen.maxTextScale,
          child: child ?? const SizedBox.shrink(),
        ),
      );
    });
  }
}
