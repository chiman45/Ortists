import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // never cache this route

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query     = searchParams.get("q") ?? "";
  const countOnly = searchParams.get("count") === "1";
  const ids       = searchParams.get("ids");

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
    return NextResponse.json({ profiles: data ?? [] });
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
    if (byId) return NextResponse.json({ profile: byId });

    // 2. Case-insensitive username match (also try with @ prefix — usernames may be stored as @handle)
    const usernameVariants = [username, `@${username}`];
    let byUsername = null;
    for (const variant of usernameVariants) {
      const { data, error: e2 } = await adminDb
        .from("profiles")
        .select("*")
        .ilike("username", variant)
        .maybeSingle();
      if (e2) console.error("[profiles] username lookup error:", e2.message, "| variant:", variant);
      if (data) { byUsername = data; break; }
    }
    if (byUsername) return NextResponse.json({ profile: byUsername });

    // 3. Fallback: display_name match
    const { data: byName, error: e3 } = await adminDb
      .from("profiles")
      .select("*")
      .ilike("display_name", username)
      .maybeSingle();
    if (e3) console.error("[profiles] display_name lookup error:", e3.message, "| param:", username);

    console.log(
      "[profiles] lookup for param:", username,
      "| byId:", !!byId, "| byUsername:", !!byUsername, "| byName:", !!byName
    );
    return NextResponse.json({ profile: byName ?? null });
  }

  if (query.trim()) {
    const { data, error } = await adminDb
      .from("profiles")
      .select("*")
      .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
      .order("followers_count", { ascending: false })
      .limit(30);
    if (error) console.error("[profiles] search error:", error.message);
    return NextResponse.json({ profiles: data ?? [] });
  }

  const { data, error } = await adminDb
    .from("profiles")
    .select("*")
    .order("followers_count", { ascending: false })
    .limit(200);
  if (error) console.error("[profiles] list error:", error.message);
  return NextResponse.json({ profiles: data ?? [] });
}
