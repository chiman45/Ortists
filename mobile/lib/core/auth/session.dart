import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/agreements_info.dart';
import '../../data/models/profile.dart';
import '../../data/repositories/profile_repository.dart';
import '../api/api_exception.dart';
import '../config/env.dart';
import 'auth_repository.dart';
import 'auth_user.dart';
import 'clerk_auth_repository.dart';

/// The login provider. Tests override this with a fake.
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final AuthRepository repo = Env.clerkPublishableKey.isEmpty
      ? UnconfiguredAuthRepository()
      : ClerkAuthRepository(publishableKey: Env.clerkPublishableKey);
  ref.onDispose(repo.dispose);
  return repo;
});

/// A step the user must finish before using the app (same rules as the
/// website's `PhoneGate`): accept the current agreements, then add a phone number.
enum Gate { none, agreements, phone }

@immutable
class Session {
  const Session({this.user, this.profile, this.gate = Gate.none, this.syncError});

  static const guest = Session();

  final AuthUser? user;
  final Profile? profile;
  final Gate gate;

  /// Set when the user is signed in but their profile couldn't be loaded.
  final String? syncError;

  bool get isSignedIn => user != null;
}

Gate computeGate(Profile profile, String currentAgreementVersion) {
  if (profile.agreementVersion != currentAgreementVersion) return Gate.agreements;
  if ((profile.phone ?? '').isEmpty) return Gate.phone;
  return Gate.none;
}

final sessionProvider = AsyncNotifierProvider<SessionNotifier, Session>(SessionNotifier.new);

class SessionNotifier extends AsyncNotifier<Session> {
  @override
  Future<Session> build() async {
    final auth = ref.watch(authRepositoryProvider);
    final sub = auth.userChanges.listen((_) => ref.invalidateSelf());
    ref.onDispose(sub.cancel);

    try {
      await auth.init();
    } on AuthException {
      return Session.guest; // offline at launch: browse as a guest, login retries init
    }

    final user = auth.currentUser;
    if (user == null) return Session.guest;

    try {
      final profiles = ref.read(profileRepositoryProvider);
      // Future.wait rethrows the first failure as-is (an ApiException)
      final results = await Future.wait<Object>([profiles.sync(user), profiles.agreements()]);
      final profile = results[0] as Profile;
      final info = results[1] as AgreementsInfo;
      return Session(user: user, profile: profile, gate: computeGate(profile, info.version));
    } on ApiException catch (e) {
      return Session(user: user, syncError: e.message);
    }
  }

  /// Re-checks the profile (after accepting agreements, saving a phone number, or a retry).
  Future<void> refresh() async {
    ref.invalidateSelf();
    await future;
  }
}
