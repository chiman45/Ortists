import 'package:flutter_test/flutter_test.dart';
import 'package:ortists/app/router.dart';
import 'package:ortists/core/auth/session.dart';
import 'package:ortists/core/utils/phone.dart';
import 'package:ortists/data/models/agreements_info.dart';
import 'package:ortists/data/models/profile.dart';

import '../helpers/fakes.dart';

void main() {
  group('normalizePhone (same rule as the website)', () {
    test('keeps digits and a leading plus', () {
      expect(normalizePhone('+91 98765-43210'), (phone: '+919876543210', valid: true));
      expect(normalizePhone('98765 43210').phone, '9876543210');
    });

    test('rejects numbers that are too short or too long', () {
      expect(normalizePhone('12345').valid, isFalse);
      expect(normalizePhone('1234567890123456').valid, isFalse);
    });
  });

  group('models', () {
    test('Profile reads the API\'s snake_case fields', () {
      final p = Profile.fromJson({
        'clerk_id': 'user_1',
        'display_name': 'Asha',
        'avatar_url': 'https://x/a.jpg',
        'followers_count': 12,
        'agreement_version': 'v2',
        'size_prices': <String, dynamic>{}, // unknown fields are ignored
      });
      expect(p.clerkId, 'user_1');
      expect(p.displayName, 'Asha');
      expect(p.followersCount, 12);
      expect(p.agreementVersion, 'v2');
      expect(p.phone, isNull);
    });

    test('AgreementsInfo reads /api/agreements', () {
      final info = AgreementsInfo.fromJson({
        'version': '2026-11-04',
        'required': {
          'artist': [
            {'key': 'platformTerms', 'title': 'Platform Terms', 'path': '/terms'},
          ],
          'client': <Map<String, dynamic>>[],
        },
      });
      expect(info.version, '2026-11-04');
      expect(info.required['artist']!.single.path, '/terms');
    });
  });

  group('computeGate', () {
    const base = Profile(clerkId: 'user_1');

    test('agreements come first, then the phone number', () {
      expect(computeGate(base, 'v2'), Gate.agreements);
      expect(computeGate(base.copyWith(agreementVersion: 'v1', phone: '9876543210'), 'v2'), Gate.agreements);
      expect(computeGate(base.copyWith(agreementVersion: 'v2'), 'v2'), Gate.phone);
      expect(computeGate(base.copyWith(agreementVersion: 'v2', phone: '9876543210'), 'v2'), Gate.none);
    });
  });

  group('gateRedirect', () {
    const needsAgreements = Session(user: testUser, gate: Gate.agreements);
    const needsPhone = Session(user: testUser, gate: Gate.phone);
    const ready = Session(user: testUser);

    test('sends unfinished accounts to the right step and keeps them there', () {
      expect(gateRedirect(needsAgreements, Routes.feed), Routes.welcome);
      expect(gateRedirect(needsAgreements, Routes.welcome), isNull);
      expect(gateRedirect(needsPhone, Routes.profile), Routes.phone);
    });

    test('leaves the set-up screens once done, and never traps guests', () {
      expect(gateRedirect(ready, Routes.welcome), Routes.feed);
      expect(gateRedirect(ready, Routes.feed), isNull);
      expect(gateRedirect(Session.guest, Routes.feed), isNull);
      expect(gateRedirect(Session.guest, Routes.phone), Routes.feed);
      expect(gateRedirect(null, Routes.login), isNull);
    });
  });
}
