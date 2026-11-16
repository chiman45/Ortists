import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/theme/app_theme.dart';
import 'router.dart';

class OrtistsApp extends ConsumerWidget {
  const OrtistsApp({super.key, this.googleFonts = true});

  /// Off in widget tests (no network for font downloads).
  final bool googleFonts;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'Ortists',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(googleFonts: googleFonts),
      darkTheme: buildAppTheme(googleFonts: googleFonts),
      themeMode: ThemeMode.dark,
      routerConfig: ref.watch(routerProvider),
    );
  }
}
