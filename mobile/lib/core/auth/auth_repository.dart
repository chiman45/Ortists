import 'auth_user.dart';

/// Login, behind our own interface so the provider (Clerk's beta Flutter SDK
/// today) can be swapped without touching screens.
abstract interface class AuthRepository {
  /// Null for guests.
  AuthUser? get currentUser;

  /// Emits whenever the signed-in user changes (sign in, sign out, profile edit).
  Stream<AuthUser?> get userChanges;

  /// Restores a saved session. Safe to call more than once.
  Future<void> init();

  /// Starts sign-up and emails a 6-digit code. Finish with [verifyEmailCode].
  Future<void> signUp({required String email, required String password, required String phone});

  /// Completes sign-up with the emailed code; the user is signed in afterwards.
  Future<void> verifyEmailCode(String code);

  /// Signs in. Returns [SignInResult.needsEmailCode] when the login service
  /// wants a code it just emailed (new device); finish with [verifySignInCode].
  Future<SignInResult> signIn({required String email, required String password});

  Future<void> verifySignInCode(String code);

  /// A fresh session token for `Authorization: Bearer …`, or null for guests.
  Future<String?> sessionToken();

  Future<void> signOut();

  void dispose();
}

enum SignInResult { signedIn, needsEmailCode }

/// A login failure with a message that can be shown to the user as-is.
class AuthException implements Exception {
  const AuthException(this.message);
  final String message;

  @override
  String toString() => 'AuthException: $message';
}
