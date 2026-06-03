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
    const { data } = await adminDb
      .from("profiles")
      .select("*")
      .or(`username.eq.${username},clerk_id.eq.${username}`)
      .maybeSingle();
    return NextResponse.json({ profile: data ?? null });
  }

  if (query.trim()) {
    const { data } = await adminDb
      .from("profiles")
      .select("*")
      .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
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
