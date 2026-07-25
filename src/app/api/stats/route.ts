import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/stats?userId=  — accurate stats computed from source tables
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const [
    { count: followers },
    { count: following },
    { count: postCount },
    postsResult,
  ] = await Promise.all([
    adminDb.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    adminDb.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    adminDb.from("posts").select("*", { count: "exact", head: true }).eq("user_id", userId),
    adminDb.from("posts").select("likes_count, saves_count").eq("user_id", userId),
  ]);

  const userPosts = postsResult.data ?? [];
  const totalLikes = userPosts.reduce((sum, p) => sum + (p.likes_count ?? 0), 0);
  const totalSaves = userPosts.reduce((sum, p) => sum + (p.saves_count ?? 0), 0);

  return NextResponse.json({
    followers:  followers  ?? 0,
    following:  following  ?? 0,
    posts:      postCount  ?? 0,
    totalLikes,
    totalSaves,
  });
}
