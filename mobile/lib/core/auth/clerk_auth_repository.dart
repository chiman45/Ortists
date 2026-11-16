import 'dart:async';

import 'package:clerk_auth/clerk_auth.dart' as clerk;
import 'package:clerk_flutter/clerk_flutter.dart';

import 'auth_repository.dart';
import 'auth_user.dart';

/// [AuthRepository] on top of `clerk_flutter` (beta — pinned to an exact version).
///
/// We never listen to Clerk's `errorStream`, so its calls throw [clerk.ClerkError],
/// which is turned into an [AuthException] with a readable message here.
class ClerkAuthRepository implements AuthRepository {
  ClerkAuthRepository({required this.publishableKey});

  final String publishableKey;

  ClerkAuthState? _clerk;
  Future<void>? _initializing;
  final _users = StreamController<AuthUser?>.broadcast();
  AuthUser? _last;

  @override
  AuthUser? get currentUser => _map(_clerk?.user);

  @override
  Stream<AuthUser?> get userChanges => _users.stream;

  @override
  Future<void> init() => _initializing ??= _init().catchError((Object e) {
    _initializing = null; // allow a retry (e.g. the phone was offline at launch)
    throw _toAuthException(e);
  });

  Future<void> _init() async {
    final state = await ClerkAuthState.create(config: ClerkAuthConfig(publishableKey: publishableKey));
    state.addListener(_emit);
    _clerk = state;
    _emit();
  }

  void _emit() {
    final user = currentUser;
    if (user == _last) return;
    _last = user;
    _users.add(user);
  }

  Future<T> _guard<T>(Future<T> Function(ClerkAuthState auth) run) async {
    await init();
    final auth = _clerk!;
    try {
      return await run(auth);
    } catch (e) {
      throw _toAuthException(e);
    } finally {
      _emit();
    }
  }

  @override
  Future<void> signUp({required String email, required String password, required String phone}) =>
      _guard((auth) async {
        // A half-finished earlier attempt would otherwise be resumed with stale data.
        if (auth.signUp != null || auth.signIn != null) await auth.resetClient();
        await auth.attemptSignUp(
          strategy: clerk.Strategy.emailCode,
          emailAddress: email,
          password: password,
          passwordConfirmation: password,
          // Same place the website keeps it; our API stores it on the profile.
          metadata: {'phone': phone},
        );
        final missing = auth.signUp?.missingFields ?? const [];
        if (missing.isNotEmpty) {
          throw AuthException(
            'Sign-up needs more details than the app collects (${missing.map((f) => f.name).join(', ')}). '
            'Please sign up on ortist.art for now.',
          );
        }
      });

  @override
  Future<void> verifyEmailCode(String code) => _guard((auth) async {
    await auth.attemptSignUp(strategy: clerk.Strategy.emailCode, code: code);
    if (!auth.isSignedIn) {
      throw const AuthException("That code didn't work. Please check it and try again.");
    }
  });

  @override
  Future<SignInResult> signIn({required String email, required String password}) => _guard((auth) async {
    if (auth.signUp != null || auth.signIn != null) await auth.resetClient();
    await auth.attemptSignIn(strategy: clerk.Strategy.password, identifier: email, password: password);
    if (auth.isSignedIn) return SignInResult.signedIn;

    // Password accepted but Clerk wants a second step (e.g. first login on a
    // new device). Ask it to email a code.
    if (auth.signIn?.status.needsFactor == true) {
      await auth.attemptSignIn(strategy: clerk.Strategy.emailCode);
      return SignInResult.needsEmailCode;
    }
    throw const AuthException('Could not sign you in. Please check your email and password.');
  });

  @override
  Future<void> verifySignInCode(String code) => _guard((auth) async {
    await auth.attemptSignIn(strategy: clerk.Strategy.emailCode, code: code);
    if (!auth.isSignedIn) {
      throw const AuthException("That code didn't work. Please check it and try again.");
    }
  });

  @override
  Future<String?> sessionToken() async {
    final auth = _clerk;
    if (auth == null || !auth.isSignedIn) return null;
    try {
      return (await auth.sessionToken()).jwt;
    } catch (_) {
      return null; // treated as a guest request; the server answers 401
    }
  }

  @override
  Future<void> signOut() => _guard((auth) => auth.signOut());

  @override
  void dispose() {
    _clerk?.removeListener(_emit);
    _clerk?.terminate();
    unawaited(_users.close());
  }

  static AuthUser? _map(clerk.User? u) {
    if (u == null) return null;
    final name = u.name.isNotEmpty ? u.name : (u.username ?? u.email?.split('@').first ?? 'Artist');
    return AuthUser(id: u.id, name: name, username: u.username, email: u.email, imageUrl: u.imageUrl);
  }

  static AuthException _toAuthException(Object e) {
    if (e is AuthException) return e;
    if (e is clerk.ClerkError) {
      final msg = e.errors?.errorMessage ?? e.argument ?? e.message;
      return AuthException(msg.isEmpty ? 'Something went wrong. Please try again.' : msg);
    }
    return const AuthException('Could not reach the login service. Check your connection and try again.');
  }
}

/// Used when the app was built without a Clerk key: browsing works, login explains why it can't.
class UnconfiguredAuthRepository implements AuthRepository {
  static const _error = AuthException('Login is not set up in this build (missing CLERK_PUBLISHABLE_KEY).');

  @override
  AuthUser? get currentUser => null;
  @override
  Stream<AuthUser?> get userChanges => const Stream.empty();
  @override
  Future<void> init() async {}
  @override
  Future<void> signUp({required String email, required String password, required String phone}) =>
      throw _error;
  @override
  Future<void> verifyEmailCode(String code) => throw _error;
  @override
  Future<SignInResult> signIn({required String email, required String password}) => throw _error;
  @override
  Future<void> verifySignInCode(String code) => throw _error;
  @override
  Future<String?> sessionToken() async => null;
  @override
  Future<void> signOut() async {}
  @override
  void dispose() {}
}
