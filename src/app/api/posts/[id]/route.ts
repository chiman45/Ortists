import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/posts/[id]?userId= — fetch single post + liked/saved state
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = new URL(req.url).searchParams.get("userId");

  const { data: post, error } = await adminDb
    .from("posts").select("*").eq("id", id).single();

  if (error || !post) {
    return NextResponse.json({ post: null }, { status: 404 });
  }

  let liked = false;
  let saved = false;

  if (userId) {
    const [{ data: likeRow }, { data: saveRow }] = await Promise.all([
      adminDb.from("likes").select("user_id").eq("post_id", id).eq("user_id", userId).maybeSingle(),
      adminDb.from("saves").select("user_id").eq("post_id", id).eq("user_id", userId).maybeSingle(),
    ]);
    liked = !!likeRow;
    saved = !!saveRow;
  }

  return NextResponse.json({ post, liked, saved });
}

// POST /api/posts/[id] — like/unlike/save/unsave
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { action, userId } = await req.json();

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Fetch post once to get category + tags for ML interaction logging
  const { data: post } = await adminDb
    .from("posts")
    .select("likes_count, saves_count, category, tags")
    .eq("id", id)
    .single();

  if (action === "like") {
    // Guard: skip if already liked (prevents duplicate rows)
    const { data: existing } = await adminDb
      .from("likes").select("user_id").eq("post_id", id).eq("user_id", userId).maybeSingle();
    if (existing) return NextResponse.json({ ok: true });

    await adminDb.from("likes").insert({ post_id: id, user_id: userId });
    if (post) {
      await Promise.all([
        adminDb.from("posts").update({ likes_count: post.likes_count + 1 }).eq("id", id),
        // ML signal: record what category/tags this user liked
        adminDb.from("user_interactions").insert({
          user_id: userId,
          post_id: id,
          action_type: "like",
          category: post.category ?? null,
          tags: post.tags ?? [],
        }),
      ]);
    }
  } else if (action === "unlike") {
    await adminDb.from("likes").delete().eq("post_id", id).eq("user_id", userId);
    if (post) {
      await adminDb.from("posts").update({ likes_count: Math.max(0, post.likes_count - 1) }).eq("id", id);
    }
    // Remove the interaction record on unlike
    await adminDb.from("user_interactions")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", id)
      .eq("action_type", "like");
  } else if (action === "save") {
    await adminDb.from("saves").insert({ post_id: id, user_id: userId });
    if (post) {
      await Promise.all([
        adminDb.from("posts").update({ saves_count: post.saves_count + 1 }).eq("id", id),
        // ML signal: saves = stronger interest than likes
        adminDb.from("user_interactions").insert({
          user_id: userId,
          post_id: id,
          action_type: "save",
          category: post.category ?? null,
          tags: post.tags ?? [],
        }),
      ]);
    }
  } else if (action === "unsave") {
    await adminDb.from("saves").delete().eq("post_id", id).eq("user_id", userId);
    if (post) {
      await adminDb.from("posts").update({ saves_count: Math.max(0, post.saves_count - 1) }).eq("id", id);
    }
    await adminDb.from("user_interactions")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", id)
      .eq("action_type", "save");
  }

  return NextResponse.json({ ok: true });
}
