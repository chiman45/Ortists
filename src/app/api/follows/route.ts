import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/follows?followerId=&followingId= — check if following
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const followerId  = searchParams.get("followerId");
  const followingId = searchParams.get("followingId");
  if (!followerId || !followingId) {
    return NextResponse.json({ following: false });
  }
  const { data } = await adminDb
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return NextResponse.json({ following: !!data });
}

// POST /api/follows — follow a user
export async function POST(req: NextRequest) {
  const { followerId, followingId } = await req.json();
  await adminDb.from("follows").insert({ follower_id: followerId, following_id: followingId });
  const { data } = await adminDb.from("profiles").select("followers_count").eq("clerk_id", followingId).single();
  if (data) {
    await adminDb.from("profiles").update({ followers_count: data.followers_count + 1 }).eq("clerk_id", followingId);
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/follows — unfollow a user
export async function DELETE(req: NextRequest) {
  const { followerId, followingId } = await req.json();
  await adminDb.from("follows").delete().eq("follower_id", followerId).eq("following_id", followingId);
  return NextResponse.json({ ok: true });
}
