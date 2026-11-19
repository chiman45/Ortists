# Ortists Mobile App — Progress Tracker

> **For Claude:** Read `PRD.md` first. Pick the **first unchecked task** whose
> dependencies are done. When you finish one, tick it, add a line to the Log
> (date, task id, one sentence), and note any decision in Decisions.
> Status markers: `[ ]` todo · `[~]` in progress · `[x]` done · `BLOCKED: …` waiting on the user.

**Current phase:** Phase 4: Create post (Phases 2–3 built and tested with fakes + live guest API; still need a run on a real device)
**Last updated:** 2026-11-16

---

## Phase 0: Backend prerequisites (Next.js repo)

- [x] **P0-1** Secure the API: use Clerk `auth()` in every mutating or private route (see PRD §6). Ignore client-sent `userId`. Website must keep working.
  - [x] posts (`posts`, `posts/[id]`)
  - [x] comments, follows, follows/list
  - [x] profile/sync, settings, stats
  - [x] notifications (all 3)
  - [x] hire-requests (+ `[id]`), messages, ratings
  - [x] stories (all 4)
  - [x] create-order, verify-payment (check the webhook signature is verified)
  - [x] upload (old route), signed-url
- [~] **P0-2** (Guest checks done with curl; still needs one signed-in Bearer test from the app in P2-4.) Check that `auth()` accepts `Authorization: Bearer <token>` from a non-browser client (curl test with a real session token).
- [x] **P0-3** Push: `device_tokens` migration + `POST/DELETE /api/devices`.
- [ ] **P0-4** BLOCKED: Firebase project. Push: send FCM when a notification row is created (shared helper). Needs P2-8.
- [ ] **P0-5** BLOCKED: needs the Android signing SHA-256 and Apple Team ID (P8-2). Serve `/.well-known/assetlinks.json` and `/.well-known/apple-app-site-association` for deep links.
- [ ] **P0-6** BLOCKED: user must create the Clerk **production** instance (DNS, Google OAuth client, 30-day sessions). Then: user-ID migration script (old dev IDs → new prod IDs across all tables).
- [x] **P0-7** (2026-11-20: `create-order` removed. Use `POST /api/checkout/quote` and `POST /api/checkout/pay` with `{postIds, addressId}`; cart is `GET/POST/DELETE /api/cart`. Needs migration 020.) `create-order` took the amount from the client.
- [ ] **P0-8** Several routes insert notifications with `post_id` set to a non-post id (follows, hire requests, messages), which breaks the FK and silently drops them. Add `target_id`/`link` columns or stop setting `post_id`.
- [ ] **P0-9** `/api/signed-url` for the `deliverables` bucket only checks login, not project membership.
- [x] **P0-10** Middleware answers 404 (not 401) for signed-out calls to protected API routes. Make API routes return JSON 401 so the app can show "please sign in".

## Phase 1: Project setup

- [x] **P1-1** `flutter create` in `mobile/` with org `art.ortist` (confirm IDs first: PRD §12). Android + iOS only.
- [x] **P1-2** Add packages from PRD §3; strict lints; `dev` / `prod` flavors with `--dart-define` for the API base URL.
- [x] **P1-3** Folder structure (PRD §4), dio client + error mapping, auth interceptor stub.
- [x] **P1-4** Theme: tokens from PRD §8 as `ThemeExtension`, Inter font, primary gradient button, yellow Follow button, inputs, chips, cards.
- [x] **P1-5** go_router with bottom nav shell (Feed · Gallery · Create · Hiring · Profile) and placeholder screens.
- [x] **P1-6** CI-ready scripts: `flutter analyze`, `flutter test`, format check.

## Phase 2: Auth

- [x] **P2-1** Spike (see Decisions): does `clerk_flutter` support email+password + email code, Google OAuth, session JWT, sign-out? Write the result in Decisions.
- [~] **P2-2** (Built + widget-tested with fakes. NOT yet run against real Clerk on a device.) Implement sign-up (email, phone, password; phone uniqueness check via `/api/profile/phone`; email code).
- [~] **P2-3** Email sign-in built (incl. emailed-code second step), same caveat as P2-2. **Google sign-in BLOCKED:** needs Google Cloud OAuth clients (Web + Android + iOS), part of the Clerk production setup.
- [~] **P2-4** (Done in code: Clerk persists the session, `tokenGetterProvider` sends the Bearer token, logout on the Profile tab. Real Bearer call against the API still unverified: finishes P0-2.) Session: secure storage, token refresh in the interceptor, logout.
- [x] **P2-5** Post-login gates: agreements (`agreement_version`) and phone required.
- [x] **P2-6** (`requireLogin(context, ref)` in `features/auth/widgets/login_prompt.dart` — call it before every like/follow/comment/buy/post.) Guest mode: browsing allowed, login sheet on any action.
- [x] **P2-7** Profile sync on first login (`POST /api/profile/sync`).
- [ ] **P2-9** Device test of the whole login flow. Run: `flutter run --dart-define=CLERK_PUBLISHABLE_KEY=pk_…` with `npm run dev` running. Needs **Native API** enabled in the Clerk dashboard. The local `Pixel_9` emulator hung at Vulkan init on 2026-11-16 (try `-gpu swiftshader_indirect` or a real phone).
- [ ] **P2-10** Forgot password (Clerk `reset_password_email_code`).
- [ ] **P2-8** BLOCKED: Firebase project (user). Then add FCM, register the device token after login, remove it on logout.

## Phase 3: Core: feed & posts

- [x] **P3-1** Models: Post, Profile, Comment, ReactionCounts (from the real `route.ts` responses).
- [x] **P3-2** Feed: masonry grid, Latest/Popular, pull to refresh, infinite scroll (`limit=24`).
- [ ] **P3-3** DEFERRED until the user answers PRD §12 (stories in v1?). Stories row (read only) — or skip if stories are out of v1 (PRD §12).
- [x] **P3-4** (Price is shown; the Buy button comes with checkout in P6-2. Tapping the artist opens their profile in P5-2.) Post detail: image zoom, artist row, title/meta, price block, related posts.
- [x] **P3-5** Reactions button: tap ❤️, long-press picker (6 reactions), optimistic + revert.
- [x] **P3-6** Save, share (`share_plus` with an `ortist.art/feed/{id}` link), comments list + add comment.
- [x] **P3-7** (`FollowChip(userId:)` in `post_detail_screen.dart`; used on posts and search results. Reuse it on profiles.) Follow button (yellow) everywhere, optimistic.
- [x] **P3-8** Search: posts + accounts.

## Phase 4: Create post

- [ ] **P4-1** Pick or take multiple photos, crop, compress (≤2560px, JPEG 88%).
- [ ] **P4-2** Upload via `/api/upload/sign` + signed URL, with progress and retry.
- [ ] **P4-3** Post form: caption/title/category/tags, "for sale" (price, size) → `POST /api/posts`. Clear error banner on failure.
- [ ] **P4-4** Edit + delete own post.

## Phase 5: Profiles

- [ ] **P5-1** My profile: header, stats, tabs (Posts / Gallery / Saved / Hires).
- [ ] **P5-2** Public profile `/u/{username}`: Follow / Hire / Share.
- [ ] **P5-3** Edit profile sheet: Basic Info, Services, Availability, Pricing; avatar upload.
- [ ] **P5-4** Followers / following lists.

## Phase 6: Commerce & hiring

- [ ] **P6-1** Gallery (shop) screen.
- [ ] **P6-2** Checkout: addresses, shipping rates, Razorpay, verify payment.
- [ ] **P6-3** Orders list + detail + tracking.
- [ ] **P6-4** Hiring: browse artists, hire request form.
- [ ] **P6-5** My hires / project detail: status stepper, chat (`/api/messages`), accept/decline for artists.
- [ ] **P6-6** Ratings.

## Phase 7: Notifications & polish

- [ ] **P7-1** Notifications screen.
- [ ] **P7-2** Push handling: tap opens the right screen (foreground, background, terminated).
- [ ] **P7-3** Deep links: `/feed/{id}`, `/u/{username}`.
- [ ] **P7-4** Settings: account, notification prefs, logout, delete account.
- [ ] **P7-5** Empty, loading and error states pass on every screen; accessibility pass.
- [ ] **P7-6** Crashlytics; performance check (cold start, feed fps).

## Phase 8: Release

- [ ] **P8-1** App icons, splash screen, store screenshots.
- [ ] **P8-2** BLOCKED: Play Console + Apple Developer accounts (user). Signing keys.
- [ ] **P8-3** Internal testing build (Play internal track + TestFlight) with Garav, Tribhuvan and others.
- [ ] **P8-4** Fix tester feedback.
- [ ] **P8-5** Store listings, privacy policy link (`/privacy`), data-safety forms. Submit.

---

## Decisions

| Date | Decision | Why |
|---|---|---|
| 2026-11-16 | Flutter for the mobile app; no PWA | User's choice |
| 2026-11-16 | App uses the existing Next.js API, never the database directly | Keeps permission checks on the server; one backend |
| 2026-11-16 | Dark theme only in v1 | Matches website default; fewer screens to test |
| 2026-11-16 | App IDs `art.ortist.app` (Android + iOS), name "Ortists" | Proposed in PRD; change before first store upload if needed |
| 2026-11-16 | Plain Riverpod 3 providers, no codegen (yet) | Less build_runner churn; can add `riverpod_annotation` later |
| 2026-11-16 | `google_fonts` pinned to 8.x | 9.x depends on `material_ui`, whose `TextTheme` clashes with `flutter/material` |
| 2026-11-16 | Auth: `clerk_flutter` 0.0.18-beta with **custom UI** (`ClerkAuth.of(context)`: `attemptSignUp`, `attemptSignIn`, `sessionToken().jwt`, `signOut`) | Supports email+password+code, Google, session JWT. Beta + community-maintained: pin the exact version, wrap it behind our own `AuthRepository` so it can be swapped |
| 2026-11-16 | Google sign-in on Android uses native `google_sign_in` → `auth.idTokenSignIn(provider: google)`; WebView `ssoSignIn` only on iOS | Google blocks OAuth in in-app browsers. Needs Google Cloud OAuth clients (Web + Android + iOS), done with the Clerk production setup |
| 2026-11-16 | Phone goes in Clerk `unsafeMetadata` (`attemptSignUp(metadata:)`, found in the SDK source) **and** in `POST /api/profile/sync` right after the code is verified | Same as the website; the sync call means the phone step is skipped for app sign-ups |
| 2026-11-16 | Agreement version comes from new public `GET /api/agreements`, not a constant in the app | Old app versions must still re-ask when the documents change |
| 2026-11-16 | `ClerkAuthState` is created outside the widget tree and never has an `errorStream` listener | Without a listener Clerk throws `ClerkError`, which `ClerkAuthRepository` maps to `AuthException` |
| 2026-11-16 | Debug Android builds allow cleartext http (debug manifest only) | To reach `http://10.0.2.2:3000`; release stays https-only |
| 2026-11-16 | User must enable **Native API** in Clerk dashboard → Native applications | Required by clerk_flutter |

## Log

- 2026-11-16 — P0-1: added `src/lib/apiAuth.ts` (`requireUser`, `viewerId`); 25 route handlers now use the signed-in user instead of client-sent ids, whitelist writable fields, and check ownership/participation. Curl: guest writes blocked, guest browsing still 200.
- 2026-11-16 — P0-3: migration `019_device_tokens.sql` (user must run it) + `POST/DELETE /api/devices`.
- 2026-11-16 — P1-1…P1-6: Flutter 3.47.6 project in `mobile/`, packages, theme tokens + buttons, dio client with Bearer interceptor and error mapping, bottom-tab router with placeholders, README. `flutter analyze` clean, 8 tests pass, debug APK builds.
- 2026-11-16 — Phase 3: `Post`/`Comment` models, `Reaction` list (mirrors `src/lib/reactions.ts`), `PostRepository`, feed (masonry, Latest/Popular, pull-to-refresh, paging with de-dupe), post detail (zoom, reactions with hold-to-pick, save, share to `ortist.art/feed/{id}`, follow, comments, related), search with debounce. 40 tests pass. The data layer was also run against the local API as a guest: 60 posts, detail, comments, search, agreements and profiles all parse.
- 2026-11-16 — Web (P0-10): signed-out calls to protected `/api/*` now get JSON 401 `Please sign in.` instead of a 404 page.
- 2026-11-16 — Phase 2: `AuthRepository` + `ClerkAuthRepository`, `sessionProvider` (profile sync + gates), login/sign-up/code screen, agreements and phone screens, router redirects, account tab with logout, `requireLogin` sheet. Models with freezed (`dart run build_runner build`). 25 tests pass, analyze clean, debug APK builds with the Clerk key. Device run not done (emulator would not boot).
- 2026-11-16 — Web: `/api/profiles` no longer returns `phone`/`settings`/`agreements_accepted_at` to anyone but the owner; added public `GET /api/agreements`.
- 2026-11-16 — P2-1: clerk_flutter researched; decisions recorded. Next: P2-2 (sign-up screen).
- 2026-11-16 — Created PRD.md and PROGRESS.md. Figma wireframes with brand colours: https://www.figma.com/design/SuQmCBh7381vjPBGrQpJun
