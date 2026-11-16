# Ortists Mobile App — Product Requirements (PRD)

> **For Claude:** This is the source of truth for building the Ortists Flutter app.
> Read this file and `PROGRESS.md` at the start of every session. Work on the
> next unchecked task in `PROGRESS.md`, and update it when you finish. If this
> PRD and the code disagree, ask the user before changing either.

---

## 1. What we are building

A native **Android + iOS app** for **Ortists** (ortist.art). Ortists is a platform where artists post their work, sell original artwork, and get hired for commissions. Buyers and clients discover art and hire artists.

The website (Next.js 16, in this repo's root) already exists and is live. The app is a **second client for the same backend**. It must not change how the website works.

**Goals**
- Artists can post work from their phone camera or gallery in under 30 seconds.
- Everyone can browse the feed, react, comment, follow, share, and buy.
- Real push notifications for likes, comments, follows, orders and hire requests.
- The app feels like the website: same dark theme, same purple and yellow accents.

**Non-goals (v1)**
- No offline mode beyond cached images.
- No in-app chat outside hiring projects (the website doesn't have it either).
- No light theme in v1. Dark only, matching the website's default.
- No tablet-specific layouts. Phone first; tablets get the phone layout scaled.

---

## 2. Users

| User | Main jobs in the app |
|---|---|
| **Artist** | Post work, manage profile, reply to comments, accept or decline hire requests, track orders |
| **Buyer / client** | Browse the feed and gallery, react, save, follow artists, buy artwork, hire an artist |
| **Guest (not logged in)** | Browse the feed, posts and profiles. Any action (like, follow, comment, buy) asks them to log in. This matches the website. |

---

## 3. Tech stack (decided)

| Area | Choice |
|---|---|
| Framework | Flutter (latest stable), Dart 3, null safety |
| State | `flutter_riverpod` 3 (plain providers; codegen optional later) |
| Navigation | `go_router` (with deep links) |
| Networking | `dio`, with an auth interceptor that adds `Authorization: Bearer <Clerk session token>` |
| Models | `freezed` + `json_serializable` |
| Images | `cached_network_image` |
| Feed grid | `flutter_staggered_grid_view` (masonry) |
| Photo picking | `image_picker`, `image_cropper`, plus `flutter_image_compress` (max 2560px, JPEG ~88%, same as the website) |
| Sharing | `share_plus` |
| Push | `firebase_messaging` (FCM; APNs through FCM on iOS) |
| Secure storage | `flutter_secure_storage` |
| Payments | `razorpay_flutter` (the website uses Razorpay) |
| Auth | Clerk (see §5) |
| Lint | `flutter_lints` (strict), plus `dart format` |
| Tests | `flutter_test`, `mocktail`; widget tests for every screen |

**App IDs (proposed; confirm with the user before Phase 1):** Android `art.ortist.app`, iOS `art.ortist.app`, display name "Ortists".

---

## 4. Architecture

```
Flutter app ──HTTPS──▶ Next.js API routes (ortist.art/api/*) ──▶ Supabase (Postgres + Storage)
     │                         ▲
     │ direct upload           │ verifies Clerk token with auth()
     └──signed URL──▶ Supabase Storage
```

Rules:
1. **The app never talks to the Supabase database directly.** All reads and writes go through `/api/*`, so the server keeps doing the permission checks. The only direct Supabase call allowed is uploading a file to a **signed upload URL** returned by `/api/upload/sign`.
2. **No secrets in the app.** Only public values: the API base URL, the Clerk publishable key, the Razorpay key id, and the Firebase config.
3. The base URL is set per build flavor: `dev` (local Next.js via LAN IP or ngrok) and `prod` (`https://ortist.art`).

**Folder layout** (inside `mobile/`):
```
lib/
  main.dart, app.dart            # bootstrap, router, theme
  core/  api/ (dio client, interceptors, errors), auth/, theme/ (tokens), utils/
  data/  models/ (freezed), repositories/ (one per API area)
  features/<feature>/  screens/, widgets/, providers/
test/   mirrors lib/
```

---

## 5. Auth (highest-risk area; do it first)

- The website uses **Clerk** with email + password (+ phone, stored in our own `profiles.phone`) and **Google sign-in**.
- **Decided (P2-1):** `clerk_flutter` (beta) with our own screens. See PROGRESS.md → Decisions for the exact APIs and the Android Google sign-in approach. Hide it behind an `AuthRepository` so it can be swapped.
- **Fallback (if the SDK breaks):** if the SDK can't do this, open Clerk's hosted sign-in page in an in-app browser (`flutter_web_auth_2`), return to the app through a deep link, and get the session token through Clerk's Frontend API.
- Sessions must last **at least 30 days** (a Clerk dashboard setting on the production instance).
- After the first login the app must handle the same gates as the website:
  - `/welcome` agreements (`profiles.agreement_version` must equal the current `AGREEMENT_VERSION` in `src/lib/agreements.ts`)
  - phone number required (`profiles.phone`)
- **Prerequisite:** Clerk must be on a **production instance** (`pk_live`) before store release. Moving there changes user IDs; see `PROGRESS.md` Phase 0.

---

## 6. Backend prerequisites (Phase 0 — in the Next.js repo)

**Security fix, required before any app traffic.** Most API routes trust a `userId` sent in the request body or query, so anyone can act as any user. Only these route files verify the caller with Clerk `auth()` today: `addresses`, `addresses/[id]`, `orders`, `orders/[id]`, the three `shiprocket` routes, and `upload/sign`.

For every mutating route, and every route returning private data:
- Get the user from `const { userId } = await auth()` (this works for website cookies **and** mobile `Authorization: Bearer` tokens).
- Ignore or reject a body or query `userId` that doesn't match. Keep accepting the field so the website keeps working, but always use the verified id.
- Return 401 when not signed in, and 403 when signed in as someone else.
- The website must keep working unchanged. Test both.

Also needed:
- **Push notifications:** a `device_tokens` table (`user_id`, `token`, `platform`, `updated_at`), a `POST/DELETE /api/devices` route, and sending FCM from wherever `notifications` rows are inserted (likes, comments, follows, orders, hire requests).
- **Pagination:** `/api/posts` already supports `limit` and `offset`. The app uses infinite scroll with `limit=24`.

---

## 7. API the app uses (existing routes)

Base: `https://ortist.art/api`. All JSON. Auth header on every request when logged in.

| Area | Endpoint | Notes |
|---|---|---|
| Feed | `GET /posts?limit&offset` | newest first; includes gallery (for-sale) posts |
| Feed by user | `GET /posts?userId=` | profile grid |
| Saved | `GET /posts?savedBy=` | |
| Gallery | `GET /posts?gallery=1` | category starts with `gallery:`; strip that prefix in the UI |
| Post | `GET /posts/{id}?userId=` | returns `{post, liked, saved, reaction, reactions}` |
| React / save | `POST /posts/{id}` `{action: like\|unlike\|save\|unsave, reaction?}` | reactions: `like, fire, funny, wow, clap, inspire` (see `src/lib/reactions.ts`) |
| Create post | `POST /posts` | after uploading media |
| Edit / delete post | `PATCH`, `DELETE /posts/{id}` | owner only |
| Upload | `POST /upload/sign {bucket, name}` → `{path, token, url}` | then upload to the signed URL; buckets: `post-media`, `avatars`, `artwork` |
| Comments | `GET/POST /comments` | |
| Follows | `GET/POST/DELETE /follows`, `GET /follows/list` | |
| Profiles | `GET /profiles?username=` | `username` or clerk id |
| Profile sync / edit | `POST/PATCH /profile/sync` | phone, bio, size prices, etc. |
| Phone check | `GET /profile/phone?phone=` | uniqueness check at sign-up |
| Search | `GET /search?q=&type=all` | public |
| Notifications | `GET /notifications`, `/notifications/list`, `/notifications/panel` | |
| Stats | `GET /stats?userId=` | |
| Stories | `GET/POST /stories`, `/stories/{id}`, `/stories/{id}/like`, `/stories/{id}/comments` | |
| Hiring | `GET/POST /hire-requests`, `GET/PATCH/DELETE /hire-requests/{id}`, `GET/POST /messages` | project chat lives inside hire requests |
| Ratings | `GET/POST /ratings` | |
| Orders | `GET/POST /orders`, `GET /orders/{id}` | |
| Payments | `POST /create-order` → Razorpay checkout → `POST /verify-payment` | |
| Addresses | `GET/POST /addresses`, `PATCH/DELETE /addresses/{id}` | |
| Shipping | `GET /shiprocket/rates`, `GET /shiprocket/track/{id}` | |
| Settings | `GET/PATCH/DELETE /settings` | |

**Before coding each feature, read the matching `route.ts`** for exact request and response shapes, and write the freezed models from it. Don't guess fields.

---

## 8. Design system (match the website)

Source: `src/app/globals.css` and the Figma wireframes (https://www.figma.com/design/SuQmCBh7381vjPBGrQpJun, "Ortists colors" variables).

| Token | Value |
|---|---|
| bg | `#151515` |
| surface/card | white 4% |
| surface/subtle | white 7% |
| surface/input | white 6% |
| border | white 8% |
| text/1 | `#FFFFFF` |
| text/2 – text/6 | white 75%, 55%, 42%, 35%, 28% |
| accent deep → purple | `#361E7B` → `#7C5BF5` (primary button gradient, 135°) |
| accent purple text | `#9B7CF5` |
| pink | `#FF7EA0` |
| Follow button | `#FFB800` bg + `#050505` text; following = 12% yellow bg + yellow text + 45% yellow border |
| Font | Inter |
| Radius | cards 16–24, buttons and inputs 12, chips 20 (pill) |

Put all tokens in `lib/core/theme/` as `ThemeExtension`s. **No hard-coded colours in widgets.**

---

## 9. Screens (v1)

Mobile layouts are in the Figma file (frames M1–M4); desktop frames show the full content of each page.

1. **Splash / auth gate:** shows the feed to guests; any action opens a login sheet.
2. **Login / Sign up:** email, phone, password, Google. Email code verification. Agreements step. Phone gate.
3. **Feed:** stories row, Latest / Popular tabs, masonry grid, pull to refresh, infinite scroll.
4. **Post detail:** image (pinch to zoom), reactions (tap = ❤️, long-press = picker), comment, share, save, artist row + yellow Follow, title/description/meta, price + Buy (gallery posts), comments, "More like this".
5. **Create post:** pick or take photos (multiple), crop, caption/title/category/tags, "for sale" toggle with price and size, upload progress, clear error messages.
6. **Profile (mine):** cover, avatar, name, @username + share, stats, bio, tabs (Posts / Gallery / Saved / Hires), Edit Profile.
7. **Edit profile:** full-screen sheet; section tabs Basic Info / Services / Availability / Pricing; avatar upload.
8. **Artist profile (public):** same as mine, plus Follow / Message / Hire; share profile.
9. **Gallery (shop):** category chips, hero, featured, "On view" grid.
10. **Checkout:** address, shipping rate, Razorpay, order confirmation.
11. **Orders:** list and detail with tracking.
12. **Hiring:** browse artists, hire request form, my hires, project detail with chat and status stepper.
13. **Notifications:** list, plus push notifications that open the right screen.
14. **Search:** posts and accounts.
15. **Settings:** account, notifications, logout, delete account.

**Bottom nav:** Feed · Gallery · Create (+) · Hiring · Profile.

**Deep links:** `ortist.art/feed/{id}` → Post detail, `ortist.art/u/{username}` → Profile. Use Android App Links and iOS Universal Links, which need `assetlinks.json` and `apple-app-site-association` files served by the Next.js app.

---

## 10. Quality bar

- Cold start under 2.5 s on a mid-range Android phone; feed scrolls at 60 fps.
- Every network action has loading, success and error states with readable messages. No silent failures (the website had several).
- Optimistic UI for reactions, save and follow, reverted on failure.
- Accessibility: tap targets ≥ 44 px, semantic labels on icon buttons, text scales to 130%.
- Crash reporting: Firebase Crashlytics.
- Analytics are optional in v1.

---

## 11. Rules for Claude while building

1. Work in small tasks from `PROGRESS.md`. One task = one focused change that you can verify.
2. After each task run `flutter analyze` and `flutter test`, and fix anything you introduced.
3. Don't change website behaviour without saying so. Backend changes must keep the website working.
4. Only commit or push when the user asks. Use the commit attribution line given in the session.
5. Never print or commit secrets. Keys go in `--dart-define` / `.env` files that are gitignored.
6. When a task is blocked on the user (store accounts, Firebase project, Clerk dashboard, signing keys), mark it **BLOCKED: <what you need>** in `PROGRESS.md` and move to the next task you can do.
7. Keep answers to the user short and plain.

---

## 12. Open questions (ask the user)

- Confirm the app IDs (`art.ortist.app`) and the store display name.
- Apple Developer account ($99/year) and Google Play account ($25 once): who owns them?
- Is the Firebase project for push notifications created? Which Google account?
- Should stories be in v1, or later?
- Should "Message" on profiles open hiring, or be hidden until real direct messages exist?
