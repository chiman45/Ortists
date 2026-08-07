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
  const { data, error } = await adminDb
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  if (error) console.error("GET /api/follows:", error.message);
  return NextResponse.json({ following: !!data });
}

// Recount and sync both sides from the follows table — avoids read-then-write race condition.
async function resyncCounts(followerId: string, followingId: string) {
  const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
    adminDb.from("follows").select("*", { count: "exact", head: true }).eq("following_id", followingId),
    adminDb.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", followerId),
  ]);
  await Promise.all([
    adminDb.from("profiles").update({ followers_count: followersCount ?? 0 }).eq("clerk_id", followingId),
    adminDb.from("profiles").update({ following_count: followingCount ?? 0 }).eq("clerk_id", followerId),
  ]);
}

// POST /api/follows — follow a user
export async function POST(req: NextRequest) {
  const { followerId, followingId } = await req.json();
  if (!followerId || !followingId) {
    return NextResponse.json({ error: "followerId and followingId required" }, { status: 400 });
  }
  if (followerId === followingId) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const { error: insertError } = await adminDb
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });

  if (insertError) {
    // 23505 = unique_violation (already following) — treat as success
    if (insertError.code !== "23505") {
      console.error("POST /api/follows insert:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  // Recount from the follows table (atomic-safe)
  await resyncCounts(followerId, followingId);

  // Notify the followed user (best-effort)
  const { data: followerProfile } = await adminDb
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("clerk_id", followerId)
    .maybeSingle();

  await adminDb.from("notifications").insert({
    user_id:      followingId,
    actor_name:   followerProfile?.display_name ?? null,
    actor_avatar: followerProfile?.avatar_url ?? null,
    type:         "follow",
    text:         `${followerProfile?.display_name ?? "Someone"} started following you`,
    post_id:      followerId,
  }).then(() => {}).catch(() => {}); // ignore notification errors

  return NextResponse.json({ ok: true });
}

// DELETE /api/follows — unfollow a user
export async function DELETE(req: NextRequest) {
  const { followerId, followingId } = await req.json();
  if (!followerId || !followingId) {
    return NextResponse.json({ error: "followerId and followingId required" }, { status: 400 });
  }

  const { error: deleteError } = await adminDb
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (deleteError) {
    console.error("DELETE /api/follows:", deleteError.message);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Recount from the follows table (atomic-safe)
  await resyncCounts(followerId, followingId);

  return NextResponse.json({ ok: true });
}
