import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { viewerId } from "@/lib/apiAuth";

type Row = Record<string, unknown> & { clerk_id?: string };

// Columns only the profile's owner may see. This route is public, so everyone
// else gets the profile without them (phone numbers are never shown publicly).
const PRIVATE_FIELDS = ["phone", "settings", "agreements_accepted_at"];

function scrub<T extends Row | null>(row: T, viewer: string | null): T {
  if (!row || row.clerk_id === viewer) return row;
  const out: Row = { ...row };
  for (const k of PRIVATE_FIELDS) delete out[k];
  return out as T;
}

export const dynamic = "force-dynamic"; // never cache this route

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query     = searchParams.get("q") ?? "";
  const countOnly = searchParams.get("count") === "1";
  const ids       = searchParams.get("ids");
  const viewer    = await viewerId();
  const many = (rows: Row[] | null) => (rows ?? []).map(r => scrub(r, viewer));

  if (countOnly) {
    const { count } = await adminDb
      .from("profiles")
      .select("*", { count: "exact", head: true });
    return NextResponse.json({ count: count ?? 0 });
  }

  if (ids) {
    const idList = ids.split(",").filter(Boolean);
    const { data, error } = await adminDb
      .from("profiles")
      .select("*")
      .in("clerk_id", idList);
    if (error) console.error("[profiles] ids lookup error:", error.message);
    return NextResponse.json({ profiles: many(data) });
  }

  const username = searchParams.get("username");
  if (username) {
    // 1. Exact clerk_id match
    const { data: byId, error: e1 } = await adminDb
      .from("profiles")
      .select("*")
      .eq("clerk_id", username)
      .maybeSingle();
    if (e1) console.error("[profiles] clerk_id lookup error:", e1.message, "| param:", username);
    if (byId) return NextResponse.json({ profile: scrub(byId, viewer) });

    // Stored handles can carry an "@" prefix or stray spaces ("Designer "), while
    // the URL arrives trimmed — so fetch loose candidates and compare normalised.
    const norm = (s: unknown) => String(s ?? "").trim().replace(/^@+/, "").toLowerCase();
    const wanted = norm(username);
    // Escape LIKE wildcards so "user_3ab" only matches itself
    const like = `%${username.trim().replace(/^@+/, "").replace(/[\\%_]/g, "\\$&")}%`;
    const findBy = async (column: "username" | "display_name") => {
      const { data, error } = await adminDb
        .from("profiles")
        .select("*")
        .ilike(column, like)
        .order("followers_count", { ascending: false })
        .limit(50);
      if (error) console.error(`[profiles] ${column} lookup error:`, error.message, "| param:", username);
      return (data ?? []).find((r: Row) => norm(r[column]) === wanted) ?? null;
    };

    // 2. Case-insensitive username match
    const byUsername = wanted ? await findBy("username") : null;
    if (byUsername) return NextResponse.json({ profile: scrub(byUsername, viewer) });

    // 3. Fallback: display_name match
    const byName = wanted ? await findBy("display_name") : null;

    console.log(
      "[profiles] lookup for param:", username,
      "| byId:", !!byId, "| byUsername:", !!byUsername, "| byName:", !!byName
    );
    return NextResponse.json({ profile: scrub(byName ?? null, viewer) });
  }

  if (query.trim()) {
    const { data, error } = await adminDb
      .from("profiles")
      .select("*")
      .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
      .order("followers_count", { ascending: false })
      .limit(30);
    if (error) console.error("[profiles] search error:", error.message);
    return NextResponse.json({ profiles: many(data) });
  }

  const { data, error } = await adminDb
    .from("profiles")
    .select("*")
    .order("followers_count", { ascending: false })
    .limit(200);
  if (error) console.error("[profiles] list error:", error.message);
  return NextResponse.json({ profiles: many(data) });
}
