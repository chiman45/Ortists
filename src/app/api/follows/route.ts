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

// POST /api/follows — follow a user
export async function POST(req: NextRequest) {
  const { followerId, followingId } = await req.json();
  if (!followerId || !followingId) {
    return NextResponse.json({ error: "followerId and followingId required" }, { status: 400 });
  }

  const { error: insertError } = await adminDb
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });

  if (insertError) {
    // Duplicate = already following, treat as success
    if (insertError.code !== "23505") {
      console.error("POST /api/follows insert:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  // Update both sides: followers_count on the followed, following_count on the follower
  const [{ data: followedProfile }, { data: followerProfile }] = await Promise.all([
    adminDb.from("profiles").select("followers_count").eq("clerk_id", followingId).maybeSingle(),
    adminDb.from("profiles").select("following_count, display_name, avatar_url").eq("clerk_id", followerId).maybeSingle(),
  ]);

  await Promise.all([
    followedProfile && adminDb.from("profiles")
      .update({ followers_count: (followedProfile.followers_count ?? 0) + 1 })
      .eq("clerk_id", followingId),
    followerProfile && adminDb.from("profiles")
      .update({ following_count: (followerProfile.following_count ?? 0) + 1 })
      .eq("clerk_id", followerId),
  ]);

  // Notify the followed user
  await adminDb.from("notifications").insert({
    user_id:      followingId,
    actor_name:   followerProfile?.display_name ?? null,
    actor_avatar: followerProfile?.avatar_url ?? null,
    type:         "follow",
    text:         `${followerProfile?.display_name ?? "Someone"} started following you`,
    post_id:      followerId,
  });

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

  // Update both sides: decrement followers_count on the unfollowed, following_count on the unfollower
  const [{ data: followedProfile }, { data: followerProfile }] = await Promise.all([
    adminDb.from("profiles").select("followers_count").eq("clerk_id", followingId).maybeSingle(),
    adminDb.from("profiles").select("following_count").eq("clerk_id", followerId).maybeSingle(),
  ]);

  await Promise.all([
    followedProfile && adminDb.from("profiles")
      .update({ followers_count: Math.max(0, (followedProfile.followers_count ?? 1) - 1) })
      .eq("clerk_id", followingId),
    followerProfile && adminDb.from("profiles")
      .update({ following_count: Math.max(0, (followerProfile.following_count ?? 1) - 1) })
      .eq("clerk_id", followerId),
  ]);

  return NextResponse.json({ ok: true });
}
