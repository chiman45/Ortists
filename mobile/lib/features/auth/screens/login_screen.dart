import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/auth/auth_repository.dart';
import '../../../core/auth/session.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/theme/widgets.dart';
import '../../../core/utils/phone.dart';
import '../../../data/repositories/profile_repository.dart';

enum _Mode { signIn, signUp }

enum _Step { form, signUpCode, signInCode }

/// Log in / create account with email + password (+ phone on sign-up),
/// then the emailed code. Same fields and rules as the website's sign-up form.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key, this.startWithSignUp = false});

  final bool startWithSignUp;

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  late _Mode _mode = widget.startWithSignUp ? _Mode.signUp : _Mode.signIn;
  _Step _step = _Step.form;
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _code = TextEditingController();
  bool _showPassword = false;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _code.dispose();
    super.dispose();
  }

  AuthRepository get _auth => ref.read(authRepositoryProvider);

  /// Runs [action], showing its error message if it fails.
  Future<void> _run(Future<void> Function() action) async {
    if (_busy) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
    } on AuthException catch (e) {
      _error = e.message;
    } on ApiException catch (e) {
      _error = e.message;
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _fail(String message) => setState(() => _error = message);

  Future<void> _submitForm() async {
    final email = _email.text.trim();
    final password = _password.text;
    if (!email.contains('@')) return _fail('Enter your email address.');

    if (_mode == _Mode.signIn) {
      if (password.isEmpty) return _fail('Enter your password.');
      return _run(() async {
        final result = await _auth.signIn(email: email, password: password);
        if (result == SignInResult.needsEmailCode) {
          if (mounted) setState(() => _step = _Step.signInCode);
        } else {
          _finish();
        }
      });
    }

    final phone = normalizePhone(_phone.text);
    if (!phone.valid) return _fail('Enter a valid phone number (10–15 digits).');
    if (password.length < 8) return _fail('Password must be at least 8 characters.');
    return _run(() async {
      // Phone numbers are unique per account — check before creating the user
      final free = await ref.read(profileRepositoryProvider).phoneAvailable(phone.phone);
      if (!free) throw const AuthException('This phone number is already linked to another account.');
      await _auth.signUp(email: email, password: password, phone: phone.phone);
      if (mounted) setState(() => _step = _Step.signUpCode);
    });
  }

  Future<void> _submitCode() => _run(() async {
    final code = _code.text.trim();
    if (_step == _Step.signUpCode) {
      await _auth.verifyEmailCode(code);
      // Save the phone on the new profile straight away, so the phone step is skipped.
      final user = _auth.currentUser;
      if (user != null) {
        await ref.read(profileRepositoryProvider).sync(user, phone: normalizePhone(_phone.text).phone);
      }
    } else {
      await _auth.verifySignInCode(code);
    }
    _finish();
  });

  /// Signed in: go back to where the user was. Unfinished account steps
  /// (agreements, phone) are handled by the router.
  void _finish() {
    if (!mounted) return;
    if (context.canPop()) {
      context.pop();
    } else {
      context.go(Routes.feed);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(Insets.xl),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  ..._step == _Step.form ? _form(c) : _codeStep(c),
                  if (_error != null) ...[
                    const SizedBox(height: Insets.md),
                    Text(
                      _error!,
                      key: const Key('auth-error'),
                      style: TextStyle(color: c.danger, fontSize: 13),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _form(OrtistsColors c) {
    final signUp = _mode == _Mode.signUp;
    return [
      Text(
        signUp ? 'Create your account' : 'Welcome back',
        textAlign: TextAlign.center,
        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
      ),
      const SizedBox(height: Insets.xs),
      Text(
        signUp ? 'Fill in the details to get started.' : 'Log in to like, follow, post and buy.',
        textAlign: TextAlign.center,
        style: TextStyle(color: c.text4, fontSize: 14),
      ),
      const SizedBox(height: Insets.xl),
      TextField(
        key: const Key('email'),
        controller: _email,
        keyboardType: TextInputType.emailAddress,
        autofillHints: const [AutofillHints.email],
        textInputAction: TextInputAction.next,
        decoration: const InputDecoration(labelText: 'Email address'),
      ),
      if (signUp) ...[
        const SizedBox(height: Insets.md),
        TextField(
          key: const Key('phone'),
          controller: _phone,
          keyboardType: TextInputType.phone,
          autofillHints: const [AutofillHints.telephoneNumber],
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(labelText: 'Phone number', hintText: '+91 98765 43210'),
        ),
      ],
      const SizedBox(height: Insets.md),
      TextField(
        key: const Key('password'),
        controller: _password,
        obscureText: !_showPassword,
        autofillHints: [signUp ? AutofillHints.newPassword : AutofillHints.password],
        onSubmitted: (_) => _submitForm(),
        decoration: InputDecoration(
          labelText: 'Password',
          suffixIcon: IconButton(
            tooltip: _showPassword ? 'Hide password' : 'Show password',
            icon: Icon(_showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20),
            onPressed: () => setState(() => _showPassword = !_showPassword),
          ),
        ),
      ),
      const SizedBox(height: Insets.xl),
      PrimaryButton(
        key: const Key('submit'),
        label: signUp ? 'Continue' : 'Log in',
        loading: _busy,
        expand: true,
        onPressed: _submitForm,
      ),
      const SizedBox(height: Insets.md),
      TextButton(
        key: const Key('switch-mode'),
        onPressed: _busy
            ? null
            : () => setState(() {
                _mode = signUp ? _Mode.signIn : _Mode.signUp;
                _error = null;
              }),
        child: Text(signUp ? 'Already have an account? Log in' : 'New here? Create an account'),
      ),
    ];
  }

  List<Widget> _codeStep(OrtistsColors c) => [
    const Text(
      'Check your email',
      textAlign: TextAlign.center,
      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
    ),
    const SizedBox(height: Insets.xs),
    Text(
      'We sent a 6-digit code to ${_email.text.trim()}',
      textAlign: TextAlign.center,
      style: TextStyle(color: c.text4, fontSize: 14),
    ),
    const SizedBox(height: Insets.xl),
    TextField(
      key: const Key('code'),
      controller: _code,
      autofocus: true,
      keyboardType: TextInputType.number,
      autofillHints: const [AutofillHints.oneTimeCode],
      textAlign: TextAlign.center,
      maxLength: 6,
      style: const TextStyle(fontSize: 20, letterSpacing: 8),
      onChanged: (_) => setState(() {}),
      onSubmitted: (_) => _submitCode(),
      decoration: const InputDecoration(hintText: '······', counterText: ''),
    ),
    const SizedBox(height: Insets.lg),
    PrimaryButton(
      key: const Key('verify'),
      label: 'Verify & continue',
      loading: _busy,
      expand: true,
      onPressed: _code.text.trim().length < 6 ? null : _submitCode,
    ),
    const SizedBox(height: Insets.md),
    TextButton(
      onPressed: _busy
          ? null
          : () => setState(() {
              _step = _Step.form;
              _code.clear();
              _error = null;
            }),
      child: const Text('Use a different email'),
    ),
  ];
}
