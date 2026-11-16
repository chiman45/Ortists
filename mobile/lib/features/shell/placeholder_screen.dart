import 'package:flutter/material.dart';

import '../../core/theme/tokens.dart';

/// Temporary screen for tabs that aren't built yet (replaced phase by phase).
class PlaceholderScreen extends StatelessWidget {
  const PlaceholderScreen({super.key, required this.title, required this.icon});

  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 40, color: c.accentText),
            const SizedBox(height: Insets.md),
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: Insets.xs),
            Text('Coming soon', style: TextStyle(color: c.text4)),
          ],
        ),
      ),
    );
  }
}
