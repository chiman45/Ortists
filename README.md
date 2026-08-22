# Ortist

A creative marketplace where artists display their work and buyers discover and purchase pieces that resonate with them.

**Live:** [ortists-chimans-projects-881b2a45.vercel.app](https://ortists-chimans-projects-881b2a45.vercel.app)

---

## Overview

Ortist is a full-stack art marketplace built on Next.js (App Router), with a separate Express API server, Supabase as the database, Clerk for authentication, and Razorpay for payments. The UI follows a Pinterest/Instagram pattern — masonry feed, stories, profiles, gallery, and a hiring board — across a fully responsive dark/light/themed design system.

---

## Features

| Area | What's built |
|---|---|
| **Feed** | Masonry grid, infinite scroll, stories with pause/play, like / save / comment, post detail page |
| **Gallery** | Artwork listings with price, Buy Now via Razorpay checkout, Pinterest recommendation grid |
| **Profile** | Portfolio grid, Gallery tab (priced posts), Services, Saved, About — three-dot delete on own posts |
| **Hiring** | Artist discovery board with commission request flow |
| **Upload** | Multi-image drag-and-drop, video support, Supabase Storage |
| **Auth** | Clerk sign-in/sign-up, protected routes, onboarding flow |
| **Payments** | Razorpay Standard Checkout (live mode), server-side HMAC signature verification, webhook endpoint |
| **Settings** | Privacy, notifications, preferences — persisted to Supabase; 6-theme picker with CSS view transitions |
| **Messaging** | WhatsApp-style two-panel chat, mobile full-screen view |
| **Themes** | Dark, Light, Midnight, Forest, Rose, Ocean — CSS variable token system, view transition animations |
| **Responsive** | Sidebar on desktop, glassmorphism bottom nav on mobile |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 15 (App Router) |
| UI library | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Icons | Lucide React |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| File storage | Supabase Storage |
| Payments | Razorpay Standard Checkout |
| Backend API | Express 4 + TypeScript (port 4000) |
| Deployment | Vercel (frontend) |

---

## Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing page
│   │   ├── feed/
│   │   │   ├── page.tsx              # Main feed
│   │   │   └── [id]/page.tsx         # Post detail (gallery-style layout)
│   │   ├── gallery/
│   │   │   ├── page.tsx              # Gallery listings
│   │   │   └── [id]/page.tsx         # Artwork detail + Razorpay checkout
│   │   ├── profile/page.tsx          # Own profile (Portfolio / Gallery / Services / Saved)
│   │   ├── u/[username]/page.tsx     # Public artist profile
│   │   ├── hiring/page.tsx           # Artist hiring board
│   │   ├── upload/page.tsx           # Artwork upload
│   │   ├── settings/page.tsx         # Account settings
│   │   ├── dashboard/page.tsx        # Analytics dashboard
│   │   ├── messages/page.tsx         # Messaging
│   │   ├── notifications/page.tsx    # Notifications
│   │   ├── onboarding/page.tsx       # New user onboarding
│   │   └── api/
│   │       ├── posts/[id]/route.ts   # Post CRUD + like/save
│   │       ├── comments/route.ts     # Comments
│   │       ├── follows/route.ts      # Follow/unfollow
│   │       ├── stories/route.ts      # Stories
│   │       ├── upload/route.ts       # File upload → Supabase Storage
│   │       ├── settings/route.ts     # User settings (GET/PATCH/DELETE)
│   │       ├── create-order/route.ts # Razorpay order creation
│   │       ├── verify-payment/route.ts # HMAC payment verification
│   │       └── webhook/route.ts      # Razorpay webhook receiver
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           # Desktop nav + logo + theme toggle
│   │   │   ├── BottomNav.tsx         # Mobile bottom nav
│   │   │   └── MainHeader.tsx        # Top header bar
│   │   ├── feed/
│   │   │   ├── MasonryGrid.tsx       # Infinite-scroll masonry
│   │   │   ├── FeedCard.tsx          # Post card (like / comment / open)
│   │   │   ├── StoriesRow.tsx        # Stories strip
│   │   │   └── StoryViewer.tsx       # Full-screen story viewer with pause/play
│   │   ├── gallery/
│   │   │   └── ArtworkCard.tsx
│   │   └── ui/
│   │       ├── PostModal.tsx         # Single-click post preview modal
│   │       ├── ArtworkViewer.tsx     # Full-screen image zoom
│   │       └── ShareModal.tsx
│   │
│   ├── contexts/
│   │   └── ThemeContext.tsx          # 6-theme system with view transitions
│   │
│   └── lib/
│       ├── db/                       # Supabase query helpers
│       ├── types.ts                  # Shared TypeScript types
│       ├── galleryData.ts            # Gallery listings seed data
│       └── imageUrl.ts               # Image URL helpers
│
├── backend/                          # Express API server (port 4000)
│   └── src/
│       ├── index.ts                  # App entry, middleware, route registration
│       ├── routes/
│       │   ├── payment.ts            # Razorpay create-order / verify / webhook
│       │   ├── posts.ts
│       │   ├── profiles.ts
│       │   ├── profileSync.ts
│       │   ├── follows.ts
│       │   ├── comments.ts
│       │   ├── stories.ts
│       │   ├── messages.ts
│       │   └── upload.ts
│       ├── middleware/
│       │   ├── auth.ts               # Clerk middleware
│       │   └── errorHandler.ts
│       └── lib/
│           └── supabase.ts
│
└── supabase/
    └── migrations/                   # SQL migration files
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Clerk](https://clerk.com) account
- A [Supabase](https://supabase.com) project
- A [Razorpay](https://razorpay.com) account

### Frontend setup

```bash
npm install
```

Create `.env.local` in the project root:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/feed
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Razorpay (secret stays server-side only)
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_WEBHOOK_SECRET=...
```

```bash
npm run dev        # http://localhost:3000
npm run build
npm start
```

### Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=4000
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
FRONTEND_URL=http://localhost:3000
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

```bash
npm run dev        # http://localhost:4000
npm run build
npm start
```

---

## Payments (Razorpay)

The checkout flow:

```
Browser → POST /api/create-order (Next.js)
       → POST /api/payment/create-order (Express, creates Razorpay order)
       ← { order_id, amount, currency }

Browser opens Razorpay checkout modal (uses NEXT_PUBLIC_RAZORPAY_KEY_ID)

User pays → Razorpay calls handler() in browser
          → POST /api/verify-payment (Next.js)
          → POST /api/payment/verify (Express, HMAC-SHA256 check)
          ← { ok: true }

Razorpay also POSTs to webhook:
  https://your-domain/api/webhook  (Next.js route, verified with RAZORPAY_WEBHOOK_SECRET)
```

### Razorpay webhook setup

1. [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → Webhooks → Add New
2. **URL:** `https://your-vercel-url.vercel.app/api/webhook`
3. **Events:** `payment.captured`, `payment.failed`, `refund.created`
4. Copy the generated secret → add to Vercel env vars and `backend/.env` as `RAZORPAY_WEBHOOK_SECRET`

---

## Deployment (Vercel)

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID
RAZORPAY_WEBHOOK_SECRET
```

---

## Design System

All theme colours are CSS custom properties defined in `globals.css`.

### Themes

| ID | Name | Base |
|---|---|---|
| `dark` | Dark | `#151515` |
| `light` | Light | `#EEE9FB` |
| `midnight` | Midnight | `#0a0a12` |
| `forest` | Forest | `#0d1a0f` |
| `rose` | Rose | `#1a0d12` |
| `ocean` | Ocean | `#0a1220` |

### Core tokens

| Token | Role |
|---|---|
| `--bg` | Page background |
| `--bg-card` | Card / panel background |
| `--text-1` | Primary text |
| `--text-4` | Secondary / muted text |
| `--border` | Dividers and outlines |
| `--shadow` | Drop shadow colour |

**Accent** (theme-independent): `#361E7B` deep purple · `#7C5BF5` purple glow · `#9B7CF5` soft purple

Theme switching uses `document.startViewTransition()` for a smooth cross-fade animation and persists to Supabase via `PATCH /api/settings`.

---

## Database Migrations

SQL migrations live in `supabase/migrations/`. Run them in order in the Supabase Dashboard SQL editor, or use the Supabase CLI:

```bash
supabase db push
```

Key migrations:

| File | What it adds |
|---|---|
| `001_initial.sql` | Core tables: profiles, posts, likes, saves, follows, comments |
| `008_hire_requests_tracking.sql` | Hire requests and tracking |
| `009_user_settings.sql` | `settings JSONB` column on profiles |

---

## Auth — Protected Routes

All routes require Clerk authentication **except**:

`/` · `/login` · `/feed` · `/api/posts` · `/hiring` · `/api/profiles` · `/u/[username]`
