import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-only client — uses service role key, bypasses RLS
// Lazy singleton so missing env vars at build time don't crash the module
let _adminDb: SupabaseClient | null = null;

export function getAdminDb(): SupabaseClient {
  if (!_adminDb) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    _adminDb = createClient(url, key);
  }
  return _adminDb;
}

// Convenience proxy — behaves like the old `adminDb` but initialises lazily
export const adminDb = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getAdminDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
