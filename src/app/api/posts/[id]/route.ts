import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { requireUser, viewerId } from "@/lib/apiAuth";
import { DEFAULT_REACTION, isReaction, reactionMeta, type ReactionCounts } from "@/lib/reactions";

// Until migration 018 adds likes.reaction, fall back to plain likes.
const missingReactionCol = (e: { message?: string } | null) => !!e && /reaction/i.test(e.message ?? "");

/** Reaction totals for a post, e.g. { like: 4, funny: 1 }. */
async function reactionCounts(postId: string): Promise<ReactionCounts> {
  const { data, error } = await adminDb.from("likes").select("reaction").eq("post_id", postId);
  if (error) {
    const { count } = await adminDb.from("likes").select("user_id", { count: "exact", head: true }).eq("post_id", postId);
    return count ? { like: count } : {};
  }
  const out: ReactionCounts = {};
  for (const r of data ?? []) {
    const k = isReaction(r.reaction) ? r.reaction : DEFAULT_REACTION;
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

// PATCH /api/posts/[id] — owner-only edit (title, description, category)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId: claimed, title, description, category } = await req.json().catch(() => ({}));
  const me = await requireUser(claimed);
  if (me.error) return me.error;

  const { data: post } = await adminDb.from("posts").select("user_id").eq("id", id).single();
  if (!post || post.user_id !== me.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: updated, error } = await adminDb
    .from("posts")
    .update({ title, description, category })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: updated });
}

// DELETE /api/posts/[id]?userId= — owner-only post deletion
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser(new URL(req.url).searchParams.get("userId"));
  if (me.error) return me.error;

  const { data: post } = await adminDb.from("posts").select("user_id").eq("id", id).single();
  if (!post || post.user_id !== me.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Clean up related rows before deleting the post (handles DBs without cascade)
  await Promise.all([
    adminDb.from("likes").delete().eq("post_id", id),
    adminDb.from("saves").delete().eq("post_id", id),
    adminDb.from("user_interactions").delete().eq("post_id", id),
    adminDb.from("comments").delete().eq("post_id", id),
  ]);

  const { error } = await adminDb.from("posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// GET /api/posts/[id]?userId= — fetch single post + liked/saved state
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // "Did I like/save this?" is answered for the signed-in viewer only
  const userId = await viewerId();

  const { data: post, error } = await adminDb
    .from("posts").select("*").eq("id", id).single();

  if (error || !post) {
    return NextResponse.json({ post: null }, { status: 404 });
  }

  let liked = false;
  let saved = false;
  let reaction: string | null = null;

  if (userId) {
    const [likeRes, { data: saveRow }] = await Promise.all([
      adminDb.from("likes").select("*").eq("post_id", id).eq("user_id", userId).maybeSingle(),
      adminDb.from("saves").select("user_id").eq("post_id", id).eq("user_id", userId).maybeSingle(),
    ]);
    liked = !!likeRes.data;
    reaction = liked ? (isReaction(likeRes.data?.reaction) ? likeRes.data.reaction : DEFAULT_REACTION) : null;
    saved = !!saveRow;
  }

  const reactions = await reactionCounts(id);
  return NextResponse.json({ post, liked, saved, reaction, reactions });
}

// POST /api/posts/[id] — like/unlike/save/unsave
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { action, userId: claimed, reaction: rawReaction } = await req.json().catch(() => ({}));
  const reaction = isReaction(rawReaction) ? rawReaction : DEFAULT_REACTION;

  const me = await requireUser(claimed);
  if (me.error) return me.error;
  const userId = me.userId;

  // Fetch post once to get category + tags for ML interaction logging
  const { data: post } = await adminDb
    .from("posts")
    .select("likes_count, saves_count, category, tags, user_id, title")
    .eq("id", id)
    .single();

  // Recount from the likes table instead of +1/-1, so double taps and
  // races can never leave the shown number out of step with real likes.
  async function syncLikeCount() {
    const { count } = await adminDb
      .from("likes").select("user_id", { count: "exact", head: true }).eq("post_id", id);
    const likes_count = count ?? 0;
    await adminDb.from("posts").update({ likes_count }).eq("id", id);
    return likes_count;
  }

  // Same for saves: recount so repeat taps can't inflate the number.
  async function syncSaveCount() {
    const { count } = await adminDb
      .from("saves").select("user_id", { count: "exact", head: true }).eq("post_id", id);
    const saves_count = count ?? 0;
    await adminDb.from("posts").update({ saves_count }).eq("id", id);
    return saves_count;
  }

  if (action === "like") {
    // Guard: skip if already liked (prevents duplicate rows)
    const { data: existing } = await adminDb
      .from("likes").select("user_id").eq("post_id", id).eq("user_id", userId).maybeSingle();
    if (existing) {
      // Already reacted — switching reaction (e.g. ❤️ → 😂) just updates the row
      const { error: upErr } = await adminDb.from("likes").update({ reaction })
        .eq("post_id", id).eq("user_id", userId);
      if (upErr && !missingReactionCol(upErr)) return NextResponse.json({ error: upErr.message }, { status: 500 });
      return NextResponse.json({ ok: true, liked: true, reaction, likes_count: await syncLikeCount(), reactions: await reactionCounts(id) });
    }

    let { error: likeErr } = await adminDb.from("likes").insert({ post_id: id, user_id: userId, reaction });
    if (missingReactionCol(likeErr)) {
      ({ error: likeErr } = await adminDb.from("likes").insert({ post_id: id, user_id: userId }));
    }
    if (likeErr) return NextResponse.json({ error: likeErr.message }, { status: 500 });
    const likes_count = await syncLikeCount();

    if (post) {
      await adminDb.from("user_interactions").insert({
        user_id: userId, post_id: id, action_type: "like",
        category: post.category ?? null, tags: post.tags ?? [],
      });
    }
    // Notify post owner (not self-likes)
    if (post?.user_id && post.user_id !== userId) {
      const { data: liker } = await adminDb
        .from("profiles").select("display_name, avatar_url").eq("clerk_id", userId).maybeSingle();
      await adminDb.from("notifications").insert({
        user_id:      post.user_id,
        actor_name:   liker?.display_name ?? null,
        actor_avatar: liker?.avatar_url ?? null,
        type:         "like",
        text:         reaction === DEFAULT_REACTION
          ? `${liker?.display_name ?? "Someone"} liked your artwork`
          : `${liker?.display_name ?? "Someone"} reacted ${reactionMeta(reaction).emoji} to your artwork`,
        sub_text:     post.title ?? null,
        post_id:      id,
      });
    }
    return NextResponse.json({ ok: true, liked: true, reaction, likes_count, reactions: await reactionCounts(id) });
  } else if (action === "unlike") {
    const { error: unlikeErr } = await adminDb.from("likes").delete().eq("post_id", id).eq("user_id", userId);
    if (unlikeErr) return NextResponse.json({ error: unlikeErr.message }, { status: 500 });
    const likes_count = await syncLikeCount();
    // Remove the interaction record on unlike
    await adminDb.from("user_interactions")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", id)
      .eq("action_type", "like");
    return NextResponse.json({ ok: true, liked: false, reaction: null, likes_count, reactions: await reactionCounts(id) });
  } else if (action === "save") {
    const { error: saveErr } = await adminDb.from("saves").insert({ post_id: id, user_id: userId });
    // 23505 = already saved (primary key) — fine, anything else is a real failure
    const alreadySaved = saveErr?.code === "23505";
    if (saveErr && !alreadySaved) {
      console.error("POST /api/posts/[id] save:", saveErr.message);
      return NextResponse.json({ error: saveErr.message }, { status: 500 });
    }
    const saves_count = await syncSaveCount();
    if (post && !alreadySaved) {
      // ML signal: saves = stronger interest than likes
      await adminDb.from("user_interactions").insert({
        user_id: userId,
        post_id: id,
        action_type: "save",
        category: post.category ?? null,
        tags: post.tags ?? [],
      });
    }
    return NextResponse.json({ ok: true, saved: true, saves_count });
  } else if (action === "unsave") {
    const { error: unsaveErr } = await adminDb.from("saves").delete().eq("post_id", id).eq("user_id", userId);
    if (unsaveErr) {
      console.error("POST /api/posts/[id] unsave:", unsaveErr.message);
      return NextResponse.json({ error: unsaveErr.message }, { status: 500 });
    }
    const saves_count = await syncSaveCount();
    await adminDb.from("user_interactions")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", id)
      .eq("action_type", "save");
    return NextResponse.json({ ok: true, saved: false, saves_count });
  }

  return NextResponse.json({ ok: true });
}
