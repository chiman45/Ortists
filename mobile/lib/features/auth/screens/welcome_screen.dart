import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/auth/session.dart';
import '../../../core/config/env.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/theme/widgets.dart';
import '../../../data/models/agreements_info.dart';
import '../../../data/repositories/profile_repository.dart';

final agreementsProvider = FutureProvider.autoDispose<AgreementsInfo>(
  (ref) => ref.watch(profileRepositoryProvider).agreements(),
);

/// Agreements step (website `/welcome`): choose artist or client, accept each
/// required document. Shown after sign-up and again whenever the documents change.
class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  String? _role;
  final _accepted = <String>{};
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final role = ref.read(sessionProvider).value?.profile?.role;
    if (role == 'artist' || role == 'client') _role = role;
  }

  Future<void> _save(AgreementsInfo info) async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref.read(profileRepositoryProvider).update({
        'role': _role,
        'agreement_version': info.version,
        'agreements_accepted_at': DateTime.now().toUtc().toIso8601String(),
      });
      await ref.read(sessionProvider.notifier).refresh(); // router moves on
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final info = ref.watch(agreementsProvider);
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text('Welcome to Ortists'),
        actions: [
          TextButton(
            onPressed: () => ref.read(authRepositoryProvider).signOut(),
            child: const Text('Log out'),
          ),
        ],
      ),
      body: SafeArea(
        child: info.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  e is ApiException ? e.message : 'Could not load the agreements.',
                  style: TextStyle(color: c.text3),
                ),
                const SizedBox(height: Insets.md),
                SecondaryButton(label: 'Try again', onPressed: () => ref.invalidate(agreementsProvider)),
              ],
            ),
          ),
          data: (info) {
            final docs = _role == null
                ? const <AgreementDoc>[]
                : (info.required[_role] ?? const <AgreementDoc>[]);
            final ready = _role != null && docs.every((d) => _accepted.contains(d.key));
            return ListView(
              padding: const EdgeInsets.all(Insets.xl),
              children: [
                Text('How will you use Ortists?', style: TextStyle(color: c.text3, fontSize: 14)),
                const SizedBox(height: Insets.md),
                Row(
                  children: [
                    Expanded(child: _roleCard('artist', "I'm an artist", Icons.brush_rounded)),
                    const SizedBox(width: Insets.md),
                    Expanded(child: _roleCard('client', 'I want to buy or hire', Icons.shopping_bag_rounded)),
                  ],
                ),
                if (_role != null) ...[
                  const SizedBox(height: Insets.xl),
                  Text('Please read and accept', style: TextStyle(color: c.text3, fontSize: 14)),
                  const SizedBox(height: Insets.sm),
                  for (final d in docs) _docRow(d),
                ],
                if (_error != null) ...[
                  const SizedBox(height: Insets.md),
                  Text(_error!, style: TextStyle(color: c.danger, fontSize: 13)),
                ],
                const SizedBox(height: Insets.xl),
                PrimaryButton(
                  key: const Key('accept-continue'),
                  label: ready
                      ? 'Continue to Ortists'
                      : _role == null
                      ? "Choose how you'll use Ortists"
                      : 'Accept all agreements to continue',
                  expand: true,
                  loading: _saving,
                  onPressed: ready ? () => _save(info) : null,
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _roleCard(String role, String label, IconData icon) {
    final c = context.colors;
    final on = _role == role;
    return InkWell(
      key: Key('role-$role'),
      borderRadius: BorderRadius.circular(Radii.card),
      onTap: () => setState(() {
        _role = role;
        _accepted.clear();
      }),
      child: Container(
        padding: const EdgeInsets.all(Insets.lg),
        decoration: BoxDecoration(
          color: on ? c.accent.withValues(alpha: 0.15) : c.card,
          borderRadius: BorderRadius.circular(Radii.card),
          border: Border.all(color: on ? c.accent : c.border),
        ),
        child: Column(
          children: [
            Icon(icon, color: on ? c.accentText : c.text3),
            const SizedBox(height: Insets.sm),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(fontWeight: FontWeight.w600, color: on ? c.text1 : c.text2),
            ),
          ],
        ),
      ),
    );
  }

  Widget _docRow(AgreementDoc doc) {
    final c = context.colors;
    return Row(
      children: [
        Checkbox(
          key: Key('accept-${doc.key}'),
          value: _accepted.contains(doc.key),
          onChanged: (v) => setState(() => v == true ? _accepted.add(doc.key) : _accepted.remove(doc.key)),
        ),
        Expanded(child: Text(doc.title, style: const TextStyle(fontSize: 14))),
        TextButton(
          onPressed: () =>
              launchUrl(Uri.parse('${Env.apiBaseUrl}${doc.path}'), mode: LaunchMode.inAppBrowserView),
          child: Text('Read', style: TextStyle(color: c.accentText)),
        ),
      ],
    );
  }
}
