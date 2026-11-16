import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'tokens.dart';

/// Dark theme only in v1 (matches the website default).
/// [googleFonts] is off in tests, which can't download the Inter font.
ThemeData buildAppTheme({bool googleFonts = true}) {
  const c = OrtistsColors.dark;
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: c.bg,
    colorScheme: ColorScheme.dark(
      primary: c.accent,
      secondary: c.pink,
      surface: c.bg,
      error: c.danger,
      onPrimary: Colors.white,
      onSurface: c.text1,
    ),
    extensions: const [c],
  );

  final TextTheme raw = googleFonts ? GoogleFonts.interTextTheme(base.textTheme) : base.textTheme;
  final text = raw.apply(bodyColor: c.text1, displayColor: c.text1);

  final inputBorder = OutlineInputBorder(
    borderRadius: BorderRadius.circular(Radii.input),
    borderSide: BorderSide(color: c.border),
  );

  return base.copyWith(
    textTheme: text,
    appBarTheme: AppBarTheme(
      backgroundColor: c.bg,
      foregroundColor: c.text1,
      elevation: 0,
      scrolledUnderElevation: 0,
      titleTextStyle: text.titleMedium?.copyWith(fontWeight: FontWeight.w700),
    ),
    dividerColor: c.border,
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: c.input,
      hintStyle: TextStyle(color: c.text5),
      labelStyle: TextStyle(color: c.text4),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: inputBorder,
      enabledBorder: inputBorder,
      focusedBorder: inputBorder.copyWith(borderSide: BorderSide(color: c.accent)),
      errorBorder: inputBorder.copyWith(borderSide: BorderSide(color: c.danger)),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: c.bg,
      indicatorColor: c.accent.withValues(alpha: 0.18),
      labelTextStyle: WidgetStatePropertyAll(text.labelSmall),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: const Color(0xFF242424),
      contentTextStyle: TextStyle(color: c.text1),
    ),
  );
}
