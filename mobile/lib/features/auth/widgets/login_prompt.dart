import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/auth/session.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/theme/widgets.dart';

/// Guests can browse; anything they *do* (like, follow, comment, buy, post)
/// goes through this. Returns true when signed in — otherwise shows the
/// "sign in to continue" sheet and returns false.
///
///     onPressed: () { if (!requireLogin(context, ref)) return; like(); }
bool requireLogin(BuildContext context, WidgetRef ref, {String action = 'do that'}) {
  if (ref.read(authRepositoryProvider).currentUser != null) return true;
  showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    backgroundColor: const Color(0xFF1C1C1C),
    builder: (_) => LoginPromptSheet(action: action),
  );
  return false;
}

class LoginPromptSheet extends StatelessWidget {
  const LoginPromptSheet({super.key, required this.action});

  final String action;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    void open({required bool signUp}) {
      final router = GoRouter.of(context);
      Navigator.of(context).pop();
      router.push(signUp ? Routes.signUp : Routes.login);
    }

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(Insets.xl, 0, Insets.xl, Insets.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Join Ortists',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: Insets.xs),
            Text(
              'Log in or create a free account to $action.',
              textAlign: TextAlign.center,
              style: TextStyle(color: c.text4),
            ),
            const SizedBox(height: Insets.xl),
            PrimaryButton(label: 'Log in', expand: true, onPressed: () => open(signUp: false)),
            const SizedBox(height: Insets.sm),
            SecondaryButton(label: 'Create account', onPressed: () => open(signUp: true)),
          ],
        ),
      ),
    );
  }
}
