import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/tokens.dart';

/// Bottom navigation: Feed · Gallery · Create (+) · Hiring · Profile.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.shell});

  final StatefulNavigationShell shell;

  static const createIndex = 2;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Scaffold(
      body: shell,
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: c.border)),
        ),
        child: NavigationBar(
          selectedIndex: shell.currentIndex,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysHide,
          height: 64,
          onDestinationSelected: (i) => shell.goBranch(i, initialLocation: i == shell.currentIndex),
          destinations: [
            const NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home_rounded),
              label: 'Feed',
            ),
            const NavigationDestination(
              icon: Icon(Icons.storefront_outlined),
              selectedIcon: Icon(Icons.storefront_rounded),
              label: 'Gallery',
            ),
            NavigationDestination(
              icon: _CreateIcon(colors: c),
              label: 'Create',
            ),
            const NavigationDestination(
              icon: Icon(Icons.work_outline_rounded),
              selectedIcon: Icon(Icons.work_rounded),
              label: 'Hiring',
            ),
            const NavigationDestination(
              icon: Icon(Icons.person_outline_rounded),
              selectedIcon: Icon(Icons.person_rounded),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}

/// The purple-gradient "+" in the middle of the bar, like the website's Create button.
class _CreateIcon extends StatelessWidget {
  const _CreateIcon({required this.colors});
  final OrtistsColors colors;

  @override
  Widget build(BuildContext context) => Container(
    width: 44,
    height: 44,
    decoration: BoxDecoration(gradient: colors.primaryGradient, borderRadius: BorderRadius.circular(14)),
    child: const Icon(Icons.add_rounded, color: Colors.white),
  );
}
