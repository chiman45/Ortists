import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/auth/session.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/theme/widgets.dart';
import '../../../core/utils/phone.dart';
import '../../../data/repositories/profile_repository.dart';

/// "One more thing": accounts without a phone number must add one
/// (website `PhoneGate`). The number is unique per account and never shown publicly.
class PhoneScreen extends ConsumerStatefulWidget {
  const PhoneScreen({super.key});

  @override
  ConsumerState<PhoneScreen> createState() => _PhoneScreenState();
}

class _PhoneScreenState extends ConsumerState<PhoneScreen> {
  final _phone = TextEditingController();
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _phone.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final phone = normalizePhone(_phone.text);
    if (!phone.valid) {
      setState(() => _error = 'Enter a valid phone number (10–15 digits).');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref.read(profileRepositoryProvider).update({'phone': phone.phone});
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
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text('One more thing'),
        actions: [
          TextButton(
            onPressed: () => ref.read(authRepositoryProvider).signOut(),
            child: const Text('Log out'),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Insets.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Add your phone number to finish setting up your account. We use it for order and '
                "commission updates — it's never shown publicly.",
                style: TextStyle(color: c.text3, fontSize: 14, height: 1.4),
              ),
              const SizedBox(height: Insets.xl),
              TextField(
                key: const Key('phone'),
                controller: _phone,
                autofocus: true,
                keyboardType: TextInputType.phone,
                autofillHints: const [AutofillHints.telephoneNumber],
                onSubmitted: (_) => _save(),
                decoration: InputDecoration(
                  labelText: 'Phone number',
                  hintText: '+91 98765 43210',
                  errorText: _error,
                  errorMaxLines: 2,
                ),
              ),
              const SizedBox(height: Insets.lg),
              PrimaryButton(
                key: const Key('save-phone'),
                label: 'Continue',
                loading: _saving,
                onPressed: _save,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
