import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ortists/app/app.dart';
import 'package:ortists/core/auth/auth_repository.dart';
import 'package:ortists/core/auth/session.dart';
import 'package:ortists/core/theme/tokens.dart';
import 'package:ortists/data/models/profile.dart';
import 'package:ortists/data/repositories/post_repository.dart';
import 'package:ortists/data/repositories/profile_repository.dart';
import 'package:ortists/features/auth/screens/phone_screen.dart';
import 'package:ortists/features/auth/screens/welcome_screen.dart';
import 'package:ortists/features/auth/widgets/login_prompt.dart';

import '../helpers/fakes.dart';

const _ready = Profile(clerkId: 'user_1', agreementVersion: 'v2', phone: '9876543210');

void main() {
  late FakeAuthRepository auth;
  late FakeProfileRepository profiles;

  Future<void> pumpApp(WidgetTester tester, {Profile? profile, bool signedIn = false}) async {
    auth = FakeAuthRepository(user: signedIn ? testUser : null);
    profiles = FakeProfileRepository(profile: profile);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(auth),
          profileRepositoryProvider.overrideWithValue(profiles),
          postRepositoryProvider.overrideWithValue(FakePostRepository()),
        ],
        child: const OrtistsApp(googleFonts: false),
      ),
    );
    await tester.pumpAndSettle();
  }

  Future<void> openLogin(WidgetTester tester) async {
    await tester.tap(find.byIcon(Icons.person_outline_rounded));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('account-login')));
    await tester.pumpAndSettle();
  }

  Future<void> submit(WidgetTester tester) async {
    await tester.tap(find.byKey(const Key('submit')));
    await tester.pumpAndSettle();
  }

  String? errorText(WidgetTester tester) {
    final f = find.byKey(const Key('auth-error'));
    return f.evaluate().isEmpty ? null : tester.widget<Text>(f).data;
  }

  group('log in', () {
    testWidgets('guest logs in from the Profile tab and lands back on it, signed in', (tester) async {
      await pumpApp(tester, profile: _ready);
      await openLogin(tester);

      await tester.enterText(find.byKey(const Key('email')), 'asha@example.com');
      await tester.enterText(find.byKey(const Key('password')), 'secret123');
      await submit(tester);

      expect(auth.calls, ['signIn asha@example.com']);
      expect(find.text('Asha Rao'), findsOneWidget);
      expect(find.byKey(const Key('logout')), findsOneWidget);
    });

    testWidgets('validates before calling the server, and shows server errors', (tester) async {
      await pumpApp(tester, profile: _ready);
      await openLogin(tester);

      await submit(tester);
      expect(errorText(tester), 'Enter your email address.');
      expect(auth.calls, isEmpty);

      auth.signInError = 'Password is incorrect.';
      await tester.enterText(find.byKey(const Key('email')), 'asha@example.com');
      await tester.enterText(find.byKey(const Key('password')), 'wrong');
      await submit(tester);
      expect(errorText(tester), 'Password is incorrect.');
    });

    testWidgets('asks for the emailed code when the login service wants one', (tester) async {
      await pumpApp(tester, profile: _ready);
      await openLogin(tester);
      auth.signInResult = SignInResult.needsEmailCode;

      await tester.enterText(find.byKey(const Key('email')), 'asha@example.com');
      await tester.enterText(find.byKey(const Key('password')), 'secret123');
      await submit(tester);
      expect(find.text('Check your email'), findsOneWidget);

      await tester.enterText(find.byKey(const Key('code')), '123456');
      await tester.pump();
      await tester.tap(find.byKey(const Key('verify')));
      await tester.pumpAndSettle();

      expect(auth.calls.last, 'verifySignInCode 123456');
      expect(find.byKey(const Key('logout')), findsOneWidget);
    });

    testWidgets('log out returns to the guest view', (tester) async {
      await pumpApp(tester, profile: _ready, signedIn: true);
      await tester.tap(find.byIcon(Icons.person_outline_rounded));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('logout')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('account-login')), findsOneWidget);
    });
  });

  group('sign up', () {
    Future<void> openSignUp(WidgetTester tester) async {
      await openLogin(tester);
      await tester.tap(find.byKey(const Key('switch-mode')));
      await tester.pumpAndSettle();
    }

    testWidgets('checks phone and password before creating the account', (tester) async {
      await pumpApp(tester);
      await openSignUp(tester);

      await tester.enterText(find.byKey(const Key('email')), 'new@example.com');
      await tester.enterText(find.byKey(const Key('phone')), '12345');
      await tester.enterText(find.byKey(const Key('password')), 'secret123');
      await submit(tester);
      expect(errorText(tester), contains('valid phone number'));

      await tester.enterText(find.byKey(const Key('phone')), '98765 43210');
      await tester.enterText(find.byKey(const Key('password')), 'short');
      await submit(tester);
      expect(errorText(tester), contains('at least 8 characters'));

      profiles.takenPhones.add('9876543210');
      await tester.enterText(find.byKey(const Key('password')), 'secret123');
      await submit(tester);
      expect(errorText(tester), contains('already linked'));
      expect(auth.calls, isEmpty);
    });

    testWidgets('new account: code, then agreements, then straight into the app', (tester) async {
      await pumpApp(tester);
      await openSignUp(tester);

      await tester.enterText(find.byKey(const Key('email')), 'new@example.com');
      await tester.enterText(find.byKey(const Key('phone')), '98765 43210');
      await tester.enterText(find.byKey(const Key('password')), 'secret123');
      await submit(tester);
      expect(auth.calls, ['signUp new@example.com 9876543210']);

      await tester.enterText(find.byKey(const Key('code')), '123456');
      await tester.pump();
      await tester.tap(find.byKey(const Key('verify')));
      await tester.pumpAndSettle();

      // Phone was saved with the profile, so only the agreements step remains
      expect(profiles.profile.phone, '9876543210');
      expect(find.byType(WelcomeScreen), findsOneWidget);

      // Can't continue until a role is chosen and every document is accepted
      await tester.tap(find.byKey(const Key('role-artist')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('accept-artistAgreement')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('accept-continue')));
      await tester.pumpAndSettle();
      expect(find.byType(WelcomeScreen), findsOneWidget);

      await tester.tap(find.byKey(const Key('accept-platformTerms')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('accept-continue')));
      await tester.pumpAndSettle();

      expect(profiles.profile.role, 'artist');
      expect(profiles.profile.agreementVersion, 'v2');
      expect(find.byType(WelcomeScreen), findsNothing);
      expect(find.byType(NavigationBar), findsOneWidget);
    });
  });

  group('account set-up gates', () {
    testWidgets('an account without a phone number must add one', (tester) async {
      await pumpApp(
        tester,
        profile: const Profile(clerkId: 'user_1', agreementVersion: 'v2'),
        signedIn: true,
      );
      expect(find.byType(PhoneScreen), findsOneWidget);

      profiles.updateError = 'This phone number is already linked to another account.';
      await tester.enterText(find.byKey(const Key('phone')), '9876543210');
      await tester.tap(find.byKey(const Key('save-phone')));
      await tester.pumpAndSettle();
      expect(find.textContaining('already linked'), findsOneWidget);

      profiles.updateError = null;
      await tester.tap(find.byKey(const Key('save-phone')));
      await tester.pumpAndSettle();
      expect(find.byType(PhoneScreen), findsNothing);
      expect(find.byType(NavigationBar), findsOneWidget);
    });

    testWidgets('old agreement version sends a signed-in user back to the agreements step', (tester) async {
      await pumpApp(
        tester,
        profile: const Profile(clerkId: 'user_1', agreementVersion: 'v1', phone: '9876543210'),
        signedIn: true,
      );
      expect(find.byType(WelcomeScreen), findsOneWidget);
    });
  });

  group('requireLogin', () {
    Future<bool> ask(WidgetTester tester, FakeAuthRepository repo) async {
      late bool allowed;
      await tester.pumpWidget(
        ProviderScope(
          overrides: [authRepositoryProvider.overrideWithValue(repo)],
          child: MaterialApp(
            theme: ThemeData(extensions: const [OrtistsColors.dark]),
            home: Consumer(
              builder: (context, ref, _) => Scaffold(
                body: TextButton(
                  onPressed: () => allowed = requireLogin(context, ref, action: 'like this'),
                  child: const Text('like'),
                ),
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.text('like'));
      await tester.pumpAndSettle();
      return allowed;
    }

    testWidgets('guests get the join sheet and the action is blocked', (tester) async {
      expect(await ask(tester, FakeAuthRepository()), isFalse);
      expect(find.text('Log in or create a free account to like this.'), findsOneWidget);
    });

    testWidgets('signed-in users pass straight through', (tester) async {
      expect(await ask(tester, FakeAuthRepository(user: testUser)), isTrue);
      expect(find.text('Join Ortists'), findsNothing);
    });
  });
}
