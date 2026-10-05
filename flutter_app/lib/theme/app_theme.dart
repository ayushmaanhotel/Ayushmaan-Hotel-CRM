import 'package:flutter/material.dart';

class AppTheme {
  // Warm Luxury Heritage Beige Palette
  static const Color paperBg = Color(0xFFFAF8F5);
  static const Color surfaceWarm = Color(0xFFF4EFE6);
  static const Color cardBg = Colors.white;
  static const Color maroon = Color(0xFF7A1F2B);
  static const Color maroonDark = Color(0xFF5D1620);
  static const Color maroonLight = Color(0xFFFBF2F3);
  static const Color gold = Color(0xFFB98A2F);
  static const Color goldSoft = Color(0xFFD9BD7F);
  static const Color goldPale = Color(0xFFF7F3E9);
  static const Color ink = Color(0xFF1C1917);
  static const Color textMuted = Color(0xFF6F6759);
  static const Color borderHairline = Color(0xFFE6DCC6);
  static const Color borderLight = Color(0xFFE5DDD0);
  static const Color greenSuccess = Color(0xFF15803D);
  static const Color greenSoft = Color(0xFFDCFCE7);
  static const Color alertRed = Color(0xFFB91C1C);
  static const Color alertSoft = Color(0xFFFEE2E2);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: paperBg,
      colorScheme: ColorScheme.fromSeed(
        seedColor: maroon,
        primary: maroon,
        secondary: gold,
        surface: surfaceWarm,
        surfaceContainerHighest: borderHairline,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: paperBg,
        foregroundColor: ink,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: ink,
          fontSize: 18,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.2,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: paperBg,
        selectedItemColor: maroon,
        unselectedItemColor: textMuted,
        elevation: 8,
        type: BottomNavigationBarType.fixed,
      ),
      cardTheme: CardThemeData(
        color: cardBg,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: borderLight, width: 1),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: paperBg,
        elevation: 12,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: borderLight, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: maroon,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: maroon,
          side: const BorderSide(color: borderLight, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
