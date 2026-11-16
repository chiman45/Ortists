import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ortists/app/app.dart';

void main() {
  Future<void> pumpApp(WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: OrtistsApp(googleFonts: false)));
    await tester.pumpAndSettle();
  }

  testWidgets('starts on the Feed tab with five bottom-nav destinations', (tester) async {
    await pumpApp(tester);

    expect(find.byType(NavigationBar), findsOneWidget);
    expect(find.byType(NavigationDestination), findsNWidgets(5));
    expect(find.widgetWithText(AppBar, 'Feed'), findsOneWidget);
  });

  testWidgets('switching tabs shows that screen', (tester) async {
    await pumpApp(tester);

    await tester.tap(find.byIcon(Icons.storefront_outlined));
    await tester.pumpAndSettle();
    expect(find.widgetWithText(AppBar, 'Gallery'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.person_outline_rounded));
    await tester.pumpAndSettle();
    expect(find.widgetWithText(AppBar, 'Profile'), findsOneWidget);
  });

  testWidgets('uses the dark Ortists background', (tester) async {
    await pumpApp(tester);
    final theme = Theme.of(tester.element(find.byType(NavigationBar)));
    expect(theme.scaffoldBackgroundColor, const Color(0xFF151515));
  });
}
