import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/auth/session.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/phone_screen.dart';
import '../features/auth/screens/welcome_screen.dart';
import '../features/feed/screens/feed_screen.dart';
import '../features/feed/screens/post_detail_screen.dart';
import '../features/search/screens/search_screen.dart';
import '../features/profile/screens/account_screen.dart';
import '../features/shell/app_shell.dart';
import '../features/shell/placeholder_screen.dart';

/// Route paths mirror the website where one exists, so shared links
/// (`ortist.art/feed/{id}`, `ortist.art/u/{username}`) map 1:1 later (P7-3).
abstract final class Routes {
  static const feed = '/feed';
  static const gallery = '/gallery';
  static const create = '/create';
  static const hiring = '/hiring';
  static const profile = '/profile';

  static const search = '/search';

  /// One artwork — same path as the website, so shared links map 1:1.
  static String post(String id) => '/feed/$id';

  static const login = '/login';
  static const signUp = '/sign-up';

  /// Account set-up steps a signed-in user can't skip.
  static const welcome = '/welcome';
  static const phone = '/phone';
}

/// Where the user must be, given unfinished account steps. Null = no change.
String? gateRedirect(Session? session, String location) {
  final gate = session?.gate ?? Gate.none;
  final target = switch (gate) {
    Gate.agreements => Routes.welcome,
    Gate.phone => Routes.phone,
    Gate.none => null,
  };
  if (target != null) return location == target ? null : target;
  // Steps done (or signed out): leave the set-up screens
  if (location == Routes.welcome || location == Routes.phone) return Routes.feed;
  return null;
}

final routerProvider = Provider<GoRouter>((ref) {
  // Re-run the redirect whenever the session changes
  final refresh = ValueNotifier(0);
  ref.listen(sessionProvider, (_, _) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: Routes.feed,
    refreshListenable: refresh,
    redirect: (context, state) => gateRedirect(ref.read(sessionProvider).value, state.matchedLocation),
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => AppShell(shell: shell),
        branches: [
          _branch(Routes.feed, (_, _) => const FeedScreen()),
          _branch(
            Routes.gallery,
            (_, _) => const PlaceholderScreen(title: 'Gallery', icon: Icons.storefront_rounded),
          ),
          _branch(Routes.create, (_, _) => const PlaceholderScreen(title: 'Create', icon: Icons.add_rounded)),
          _branch(
            Routes.hiring,
            (_, _) => const PlaceholderScreen(title: 'Hiring', icon: Icons.work_rounded),
          ),
          _branch(Routes.profile, (_, _) => const AccountScreen()),
        ],
      ),
      // Full-screen pages (no bottom tabs)
      GoRoute(
        path: '/feed/:id',
        builder: (_, state) => PostDetailScreen(postId: state.pathParameters['id']!),
      ),
      GoRoute(path: Routes.search, builder: (_, _) => const SearchScreen()),
      GoRoute(path: Routes.login, builder: (_, _) => const LoginScreen()),
      GoRoute(path: Routes.signUp, builder: (_, _) => const LoginScreen(startWithSignUp: true)),
      GoRoute(path: Routes.welcome, builder: (_, _) => const WelcomeScreen()),
      GoRoute(path: Routes.phone, builder: (_, _) => const PhoneScreen()),
    ],
  );
});

StatefulShellBranch _branch(String path, GoRouterWidgetBuilder builder) => StatefulShellBranch(
  routes: [GoRoute(path: path, builder: builder)],
);
