import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { createClient as createAnonClient } from "./client";

/**
 * Clerk → Supabase JWT integration (Supabase "Third-Party Auth").
 *
 * When NEXT_PUBLIC_SUPABASE_USE_CLERK_JWT=true the browser client sends the
 * signed-in user's Clerk session token as the Supabase access token, so
 * Row-Level Security and private Realtime channels see the real user:
 * `auth.jwt() ->> 'sub'` is the Clerk user id.
 *
 * Leave the flag unset/false until this one-time setup is done, otherwise
 * Supabase rejects the (not-yet-trusted) JWT and realtime/DB calls fail:
 *
 *   1. Supabase Dashboard → Authentication → Sign In / Providers →
 *      Third-Party Auth → Add provider → Clerk → enter your Clerk domain
 *      (e.g. xxxx.clerk.accounts.dev — Clerk Dashboard → API keys → Frontend API).
 *   2. Clerk Dashboard → Integrations → Supabase → Activate. This adds the
 *      `"role": "authenticated"` claim Supabase requires to every session
 *      token. (Manual equivalent: Configure → Sessions → Customize session
 *      token → `{ "role": "authenticated" }`.)
 *   3. Run supabase/migrations/013_realtime_clerk_jwt.sql, then set
 *      NEXT_PUBLIC_SUPABASE_USE_CLERK_JWT=true (locally and on Vercel).
 *
 * This uses plain supabase-js rather than @supabase/ssr on purpose: with the
 * `accessToken` option, supabase-js disables its own auth client and throws
 * on any `supabase.auth.*` access, which the ssr helper performs internally.
 */
export const SUPABASE_CLERK_JWT_ENABLED = process.env.NEXT_PUBLIC_SUPABASE_USE_CLERK_JWT === "true";

type TokenGetter = () => Promise<string | null>;

let jwtClient: SupabaseClient | null = null;
let tokenGetter: TokenGetter | null = null;

/**
 * Browser Supabase client. Pass Clerk's `getToken` (from `useAuth()`); the
 * client is a singleton so every caller shares one Realtime socket, and the
 * getter is swapped on each call so a fresh Clerk session is always used.
 * Falls back to the publishable-key client while the flag is off.
 */
export function getSupabaseBrowserClient(
  getToken: TokenGetter,
  enabled: boolean = SUPABASE_CLERK_JWT_ENABLED,
): SupabaseClient {
  if (!enabled) return createAnonClient();
  tokenGetter = getToken;
  if (!jwtClient) {
    jwtClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { accessToken: async () => (await tokenGetter?.()) ?? null },
    );
  }
  return jwtClient;
}
