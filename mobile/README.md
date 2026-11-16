# Ortists — mobile app (Flutter)

Android + iOS app for [ortist.art](https://ortist.art). It talks to the Next.js API in the repo root.
Plan: [PRD.md](PRD.md) · Status: [PROGRESS.md](PROGRESS.md)

## Run

```bash
# 1. Start the website/API from the repo root
npm run dev

# 2. Run the app (Android emulator reaches your PC's localhost as 10.0.2.2)
cd mobile
flutter run

# With login enabled (the key is the public pk_… one from the web app's .env.local)
flutter run --dart-define=CLERK_PUBLISHABLE_KEY=pk_test_xxx

# After changing a model in lib/data/models
dart run build_runner build --delete-conflicting-outputs

# Real phone on the same Wi-Fi: point it at your PC's LAN IP
flutter run --dart-define=API_BASE_URL=http://192.168.x.x:3000

# Against production
flutter run --dart-define=API_BASE_URL=https://ortist.art
```

## Check before every commit

```bash
dart format lib test -l 110
flutter analyze
flutter test
```

## Build

```bash
flutter build apk --debug                                              # quick test build
flutter build appbundle --dart-define=API_BASE_URL=https://ortist.art  # Play Store (needs signing, P8-2)
```

iOS builds need a Mac with Xcode (or a cloud build service like Codemagic).

## Layout

```
lib/
  app/        app widget + router (bottom tabs)
  core/       config (Env), api (dio client, errors), theme (tokens, buttons)
  features/   one folder per feature: screens/, widgets/, providers/
test/         mirrors lib/
```

Notes:
- Colours live in `lib/core/theme/tokens.dart` (copied from the website's `globals.css`). Don't hard-code colours in widgets.
- `google_fonts` is pinned to 8.x: 9.x uses Flutter's separate `material_ui` package and clashes with `flutter/material`.
