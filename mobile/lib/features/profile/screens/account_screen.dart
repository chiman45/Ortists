import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/auth/session.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/theme/widgets.dart';

/// Profile tab until the real profile is built (Phase 5): shows who is signed
/// in with a log-out button, or invites guests to log in.
class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.colors;
    final session = ref.watch(sessionProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: session.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => Center(
          child: SecondaryButton(label: 'Try again', onPressed: () => ref.invalidate(sessionProvider)),
        ),
        data: (s) {
          final user = s.user;
          if (user == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(Insets.xl),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.person_outline_rounded, size: 44, color: c.accentText),
                    const SizedBox(height: Insets.md),
                    const Text(
                      'Your profile lives here',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: Insets.xs),
                    Text(
                      'Log in to post your work, follow artists and track orders.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: c.text4),
                    ),
                    const SizedBox(height: Insets.xl),
                    PrimaryButton(
                      key: const Key('account-login'),
                      label: 'Log in',
                      onPressed: () => context.push(Routes.login),
                    ),
                    const SizedBox(height: Insets.sm),
                    TextButton(
                      onPressed: () => context.push(Routes.signUp),
                      child: const Text('Create an account'),
                    ),
                  ],
                ),
              ),
            );
          }

          final avatar = s.profile?.avatarUrl ?? user.imageUrl;
          return ListView(
            padding: const EdgeInsets.all(Insets.xl),
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: c.muted,
                    backgroundImage: avatar == null ? null : CachedNetworkImageProvider(avatar),
                  ),
                  const SizedBox(width: Insets.lg),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          s.profile?.displayName ?? user.name,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                        ),
                        if (user.email != null)
                          Text(user.email!, style: TextStyle(color: c.text4, fontSize: 13)),
                      ],
                    ),
                  ),
                ],
              ),
              if (s.syncError != null) ...[
                const SizedBox(height: Insets.lg),
                GlassCard(
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(s.syncError!, style: TextStyle(color: c.danger, fontSize: 13)),
                      ),
                      TextButton(
                        onPressed: () => ref.read(sessionProvider.notifier).refresh(),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: Insets.xl),
              SecondaryButton(
                key: const Key('logout'),
                label: 'Log out',
                icon: Icons.logout_rounded,
                onPressed: () => ref.read(authRepositoryProvider).signOut(),
              ),
            ],
          );
        },
      ),
    );
  }
}
