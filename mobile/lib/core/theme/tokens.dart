import 'package:flutter/material.dart';

/// Ortists colours — mirror of the website's dark theme (`src/app/globals.css`)
/// and the "Ortists colors" variables in the Figma wireframes.
/// Widgets read these via `context.colors`; never hard-code colours in widgets.
@immutable
class OrtistsColors extends ThemeExtension<OrtistsColors> {
  const OrtistsColors({
    required this.bg,
    required this.card,
    required this.subtle,
    required this.muted,
    required this.input,
    required this.border,
    required this.text1,
    required this.text2,
    required this.text3,
    required this.text4,
    required this.text5,
    required this.text6,
    required this.accentDeep,
    required this.accent,
    required this.accentText,
    required this.pink,
    required this.followYellow,
    required this.onFollow,
    required this.danger,
    required this.success,
  });

  final Color bg, card, subtle, muted, input, border;
  final Color text1, text2, text3, text4, text5, text6;
  final Color accentDeep, accent, accentText, pink;
  final Color followYellow, onFollow, danger, success;

  static const dark = OrtistsColors(
    bg: Color(0xFF151515),
    card: Color(0x0AFFFFFF), // white 4%
    subtle: Color(0x12FFFFFF), // white 7%
    muted: Color(0x1FFFFFFF), // white 12%
    input: Color(0x0FFFFFFF), // white 6%
    border: Color(0x14FFFFFF), // white 8%
    text1: Color(0xFFFFFFFF),
    text2: Color(0xBFFFFFFF), // 75%
    text3: Color(0x8CFFFFFF), // 55%
    text4: Color(0x6BFFFFFF), // 42%
    text5: Color(0x59FFFFFF), // 35%
    text6: Color(0x47FFFFFF), // 28%
    accentDeep: Color(0xFF361E7B),
    accent: Color(0xFF7C5BF5),
    accentText: Color(0xFF9B7CF5),
    pink: Color(0xFFFF7EA0),
    followYellow: Color(0xFFFFB800),
    onFollow: Color(0xFF050505),
    danger: Color(0xFFEF4444),
    success: Color(0xFF22C55E),
  );

  /// Primary button / brand gradient (135°), same as the website.
  LinearGradient get primaryGradient =>
      LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [accentDeep, accent]);

  @override
  OrtistsColors copyWith() => this;

  @override
  OrtistsColors lerp(OrtistsColors? other, double t) => this;
}

/// Spacing and radius scale used across the app.
abstract final class Insets {
  static const xs = 4.0, sm = 8.0, md = 12.0, lg = 16.0, xl = 24.0, xxl = 32.0;
}

abstract final class Radii {
  static const button = 12.0, input = 12.0, card = 16.0, sheet = 24.0, pill = 999.0;
}

extension OrtistsThemeX on BuildContext {
  OrtistsColors get colors => Theme.of(this).extension<OrtistsColors>()!;
}
