import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/stories/[id]/like?userId= — like status + count
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = new URL(req.url).searchParams.get("userId");

  const { count } = await adminDb
    .from("story_likes")
    .select("*", { count: "exact", head: true })
    .eq("story_id", id);

  let liked = false;
  if (userId) {
    const { data } = await adminDb
      .from("story_likes")
      .select("id")
      .eq("story_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    liked = !!data;
  }

  return NextResponse.json({ liked, count: count ?? 0 });
}

// POST /api/stories/[id]/like — toggle like
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const { data: existing } = await adminDb
    .from("story_likes")
    .select("id")
    .eq("story_id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await adminDb.from("story_likes").delete().eq("id", existing.id);
  } else {
    await adminDb.from("story_likes").insert({ story_id: id, user_id: userId });
  }

  const { count } = await adminDb
    .from("story_likes")
    .select("*", { count: "exact", head: true })
    .eq("story_id", id);

  return NextResponse.json({ liked: !existing, count: count ?? 0 });
}
