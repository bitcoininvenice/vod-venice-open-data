import 'package:flutter/material.dart';

/// Design system per Venice Open Data Mobile.
/// Palette calibrata su toni lagunari: fondo neutro, inchiostro leggibile,
/// accento ciano/acqua e semaforo standard CPSM per le maree.
class AppTheme {
  AppTheme._();

  // Colori primari e neutri
  static const Color primaryBlue = Color(0xFF0284C7); // Ciano Laguna
  static const Color darkBlue = Color(0xFF071F30);    // Blu Notte Lagunare
  static const Color backgroundLight = Color(0xFFF8FAFC);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color textMain = Color(0xFF0F172A);
  static const Color textMuted = Color(0xFF64748B);
  static const Color borderLight = Color(0xFFE2E8F0);

  // Scala Marea CPSM (Centro Previsioni e Segnalazioni Maree)
  static const Color tideNormal = Color(0xFF16A34A);      // < 80 cm
  static const Color tideSustained = Color(0xFFD97706);   // 80 - 109 cm
  static const Color tideVerySustained = Color(0xFFEA580C); // 110 - 139 cm
  static const Color tideExceptional = Color(0xFFDC2626); // >= 140 cm

  // Linee ACTV principali
  static const Color actvLine1 = Color(0xFF1E293B);
  static const Color actvLine2 = Color(0xFFDC2626);
  static const Color actvLine4 = Color(0xFFD97706);
  static const Color actvLine5 = Color(0xFF059669);
  static const Color alilagunaBlue = Color(0xFF0284C7);

  // Raggi card e pulsanti
  static const double cardRadius = 16.0;
  static const double buttonRadius = 12.0;
  static const double chipRadius = 8.0;

  // Ombra morbida
  static final List<BoxShadow> softShadow = [
    BoxShadow(
      color: Colors.black.withOpacity(0.04),
      blurRadius: 10,
      offset: const Offset(0, 3),
    ),
  ];

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: backgroundLight,
      colorScheme: const ColorScheme.light(
        primary: primaryBlue,
        onPrimary: Colors.white,
        surface: surfaceLight,
        onSurface: textMain,
        outline: borderLight,
      ),
      fontFamily: '-apple-system',
      appBarTheme: const AppBarTheme(
        backgroundColor: surfaceLight,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: textMain,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.3,
        ),
        iconTheme: IconThemeData(color: textMain),
      ),
      cardTheme: CardTheme(
        color: surfaceLight,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(cardRadius),
          side: const BorderSide(color: borderLight, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          minimumSize: const Size(44, 44),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(buttonRadius),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surfaceLight,
        selectedItemColor: primaryBlue,
        unselectedItemColor: textMuted,
        selectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        unselectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
        elevation: 8,
        type: BottomNavigationBarType.fixed,
      ),
    );
  }

  /// Restituisce il colore corrispondente al livello di marea CPSM
  static Color getTideColor(int levelCm) {
    if (levelCm < 80) return tideNormal;
    if (levelCm < 110) return tideSustained;
    if (levelCm < 140) return tideVerySustained;
    return tideExceptional;
  }
}
