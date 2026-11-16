import 'dart:async';

import 'package:ortists/core/api/api_exception.dart';
import 'package:ortists/core/auth/auth_repository.dart';
import 'package:ortists/core/auth/auth_user.dart';
import 'package:ortists/data/models/agreements_info.dart';
import 'package:ortists/data/models/profile.dart';
import 'package:ortists/data/repositories/profile_repository.dart';

const testUser = AuthUser(id: 'user_1', name: 'Asha Rao', email: 'asha@example.com');

const testAgreements = AgreementsInfo(
  version: 'v2',
  required: {
    'artist': [
      AgreementDoc(key: 'artistAgreement', title: 'Artist Agreement', path: '/artists-agreement'),
      AgreementDoc(key: 'platformTerms', title: 'Platform Terms', path: '/terms'),
    ],
    'client': [AgreementDoc(key: 'clientTerms', title: 'Client Terms', path: '/client-agreement')],
  },
);

/// In-memory login. Set the `…Error` fields to make a call fail.
class FakeAuthRepository implements AuthRepository {
  FakeAuthRepository({AuthUser? user}) : _user = user; // ignore: prefer_initializing_formals

  AuthUser? _user;
  final _changes = StreamController<AuthUser?>.broadcast();
  final calls = <String>[];

  String? signInError;
  SignInResult signInResult = SignInResult.signedIn;
  String? signUpError;
  String? codeError;

  void _set(AuthUser? user) {
    _user = user;
    _changes.add(user);
  }

  @override
  AuthUser? get currentUser => _user;
  @override
  Stream<AuthUser?> get userChanges => _changes.stream;
  @override
  Future<void> init() async {}

  @override
  Future<void> signUp({required String email, required String password, required String phone}) async {
    calls.add('signUp $email $phone');
    if (signUpError != null) throw AuthException(signUpError!);
  }

  @override
  Future<void> verifyEmailCode(String code) async {
    calls.add('verifyEmailCode $code');
    if (codeError != null) throw AuthException(codeError!);
    _set(testUser);
  }

  @override
  Future<SignInResult> signIn({required String email, required String password}) async {
    calls.add('signIn $email');
    if (signInError != null) throw AuthException(signInError!);
    if (signInResult == SignInResult.signedIn) _set(testUser);
    return signInResult;
  }

  @override
  Future<void> verifySignInCode(String code) async {
    calls.add('verifySignInCode $code');
    if (codeError != null) throw AuthException(codeError!);
    _set(testUser);
  }

  @override
  Future<String?> sessionToken() async => _user == null ? null : 'token';

  @override
  Future<void> signOut() async {
    calls.add('signOut');
    _set(null);
  }

  @override
  void dispose() => unawaited(_changes.close());
}

/// In-memory profile API holding one profile for [testUser].
class FakeProfileRepository implements ProfileRepository {
  FakeProfileRepository({Profile? profile}) : profile = profile ?? const Profile(clerkId: 'user_1');

  Profile profile;
  final takenPhones = <String>{};
  final calls = <String>[];
  String? updateError;

  @override
  Future<Profile?> fetch(String idOrUsername) async => profile;

  @override
  Future<Profile> sync(AuthUser user, {String? phone}) async {
    calls.add('sync ${user.id} ${phone ?? '-'}');
    if (phone != null && (profile.phone ?? '').isEmpty) profile = profile.copyWith(phone: phone);
    return profile;
  }

  @override
  Future<Profile> update(Map<String, Object?> fields) async {
    calls.add('update ${fields.keys.join(',')}');
    if (updateError != null) throw ApiException(updateError!, statusCode: 409);
    profile = profile.copyWith(
      phone: fields['phone'] as String? ?? profile.phone,
      role: fields['role'] as String? ?? profile.role,
      agreementVersion: fields['agreement_version'] as String? ?? profile.agreementVersion,
    );
    return profile;
  }

  @override
  Future<bool> phoneAvailable(String phone) async => !takenPhones.contains(phone);

  @override
  Future<AgreementsInfo> agreements() async => testAgreements;
}
