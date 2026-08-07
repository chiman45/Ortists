import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query     = searchParams.get("q") ?? "";
  const countOnly = searchParams.get("count") === "1";
  const ids       = searchParams.get("ids");   // comma-separated clerk_ids

  if (countOnly) {
    const { count } = await adminDb
      .from("profiles")
      .select("*", { count: "exact", head: true });
    return NextResponse.json({ count: count ?? 0 });
  }

  if (ids) {
    const idList = ids.split(",").filter(Boolean);
    const { data } = await adminDb
      .from("profiles")
      .select("*")
      .in("clerk_id", idList);
    return NextResponse.json({ profiles: data ?? [] });
  }

  const username = searchParams.get("username");
  if (username) {
    // 1. Exact clerk_id match
    const { data: byId } = await adminDb
      .from("profiles")
      .select("*")
      .eq("clerk_id", username)
      .maybeSingle();
    if (byId) return NextResponse.json({ profile: byId });

    // 2. Case-insensitive username match
    const { data: byUsername } = await adminDb
      .from("profiles")
      .select("*")
      .ilike("username", username)
      .maybeSingle();
    if (byUsername) return NextResponse.json({ profile: byUsername });

    // 3. Fallback: display_name match (e.g. someone navigated to /u/<display_name>)
    const { data: byName } = await adminDb
      .from("profiles")
      .select("*")
      .ilike("display_name", username)
      .maybeSingle();
    return NextResponse.json({ profile: byName ?? null });
  }

  if (query.trim()) {
    const { data } = await adminDb
      .from("profiles")
      .select("*")
      .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
      .order("followers_count", { ascending: false })
      .limit(30);
    return NextResponse.json({ profiles: data ?? [] });
  }

  const { data } = await adminDb
    .from("profiles")
    .select("*")
    .order("followers_count", { ascending: false })
    .limit(48);
  return NextResponse.json({ profiles: data ?? [] });
}
