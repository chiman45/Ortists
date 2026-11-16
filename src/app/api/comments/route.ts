import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

// GET /api/comments?postId=
export async function GET(req: NextRequest) {
  const postId = new URL(req.url).searchParams.get("postId");
  if (!postId) return NextResponse.json({ comments: [] });

  const { data } = await adminDb
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ comments: data ?? [] });
}

// POST /api/comments — add comment as the signed-in user
export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => ({}));
  const me = await requireUser(raw.user_id);
  if (me.error) return me.error;

  const text = String(raw.text ?? "").trim().slice(0, 2000);
  if (!raw.post_id || !text) return NextResponse.json({ error: "post_id and text required" }, { status: 400 });

  // Only these columns may be written; author comes from the verified session
  const body = {
    user_id:       me.userId,
    author_name:   String(raw.author_name ?? "Someone").slice(0, 120),
    author_avatar: raw.author_avatar ?? null,
    post_id:       raw.post_id,
    text,
  };
  const { data, error } = await adminDb
    .from("comments")
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Increment comment count + notify post owner
  const { data: post } = await adminDb
    .from("posts").select("comments_count, user_id, title").eq("id", body.post_id).single();
  if (post) {
    await adminDb.from("posts")
      .update({ comments_count: post.comments_count + 1 })
      .eq("id", body.post_id);
    // Notify owner (skip self-comments)
    if (post.user_id && post.user_id !== body.user_id) {
      await adminDb.from("notifications").insert({
        user_id:      post.user_id,
        actor_name:   body.author_name,
        actor_avatar: body.author_avatar,
        type:         "comment",
        text:         `${body.author_name} commented on your artwork`,
        sub_text:     post.title ?? null,
        post_id:      body.post_id,
      });
    }
  }

  return NextResponse.json({ comment: data });
}
