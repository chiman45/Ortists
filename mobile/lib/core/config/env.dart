/// Build-time configuration, passed with `--dart-define` (see README).
///
///   flutter run  --dart-define=API_BASE_URL=http://192.168.1.10:3000
///   flutter build appbundle --dart-define=API_BASE_URL=https://ortist.art
///
/// Only public values belong here — never secrets.
abstract final class Env {
  /// Where the Next.js app runs. Defaults to the Android emulator's alias for
  /// the host machine's localhost, so `npm run dev` + emulator works out of the box.
  static const apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:3000');

  /// Clerk publishable key (pk_test_… / pk_live_…). Public by design.
  static const clerkPublishableKey = String.fromEnvironment('CLERK_PUBLISHABLE_KEY');

  /// The public website. Shared links always point here (never at a dev server),
  /// so they open for anyone: `https://ortist.art/feed/{id}`, `/u/{username}`.
  static const siteUrl = 'https://ortist.art';

  static bool get isProd => apiBaseUrl.startsWith('https://ortist.art');
}
