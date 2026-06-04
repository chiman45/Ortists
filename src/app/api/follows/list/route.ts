import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/follows/list?userId=&type=followers|following
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const type   = searchParams.get("type"); // "followers" | "following"

  if (!userId || !type) return NextResponse.json({ users: [] });

  let clerkIds: string[] = [];

  if (type === "followers") {
    // people who follow userId
    const { data } = await adminDb
      .from("follows")
      .select("follower_id")
      .eq("following_id", userId);
    clerkIds = (data ?? []).map((r: { follower_id: string }) => r.follower_id);
  } else {
    // people userId is following
    const { data } = await adminDb
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);
    clerkIds = (data ?? []).map((r: { following_id: string }) => r.following_id);
  }

  if (clerkIds.length === 0) return NextResponse.json({ users: [] });

  const { data: profiles } = await adminDb
    .from("profiles")
    .select("clerk_id, display_name, username, avatar_url, tag")
    .in("clerk_id", clerkIds);

  return NextResponse.json({ users: profiles ?? [] });
}
