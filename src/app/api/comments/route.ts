import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

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

// POST /api/comments — add comment
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await adminDb
    .from("comments")
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Increment comment count
  const { data: post } = await adminDb
    .from("posts").select("comments_count").eq("id", body.post_id).single();
  if (post) {
    await adminDb.from("posts")
      .update({ comments_count: post.comments_count + 1 })
      .eq("id", body.post_id);
  }

  return NextResponse.json({ comment: data });
}
