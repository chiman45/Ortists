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

  if (action === "like") {
    await adminDb.from("likes").insert({ post_id: id, user_id: userId });
    const { data } = await adminDb.from("posts").select("likes_count").eq("id", id).single();
    if (data) await adminDb.from("posts").update({ likes_count: data.likes_count + 1 }).eq("id", id);
  } else if (action === "unlike") {
    await adminDb.from("likes").delete().eq("post_id", id).eq("user_id", userId);
    const { data } = await adminDb.from("posts").select("likes_count").eq("id", id).single();
    if (data) await adminDb.from("posts").update({ likes_count: Math.max(0, data.likes_count - 1) }).eq("id", id);
  } else if (action === "save") {
    await adminDb.from("saves").insert({ post_id: id, user_id: userId });
    const { data } = await adminDb.from("posts").select("saves_count").eq("id", id).single();
    if (data) await adminDb.from("posts").update({ saves_count: data.saves_count + 1 }).eq("id", id);
  } else if (action === "unsave") {
    await adminDb.from("saves").delete().eq("post_id", id).eq("user_id", userId);
    const { data } = await adminDb.from("posts").select("saves_count").eq("id", id).single();
    if (data) await adminDb.from("posts").update({ saves_count: Math.max(0, data.saves_count - 1) }).eq("id", id);
  }

  return NextResponse.json({ ok: true });
}
