import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client that acts *as the signed-in user* by sending
 * their Clerk session JWT as the access token (Supabase Third-Party Auth —
 * see clerk-client.ts for the one-time dashboard setup).
 *
 * Use this in Route Handlers / Server Components for user-scoped reads and
 * writes that should be enforced by Row-Level Security. Keep using `adminDb`
 * (service role) only for trusted, cross-user operations such as the
 * Realtime REST broadcasts.
 */
export async function createClerkSupabaseServerClient(): Promise<SupabaseClient> {
  const { getToken } = await auth();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { accessToken: async () => (await getToken()) ?? null },
  );
}
