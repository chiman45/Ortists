import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/stories/[id]/comments?requesterId= — story owner only
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requesterId = new URL(req.url).searchParams.get("requesterId");

  const { data: story } = await adminDb.from("stories").select("user_id").eq("id", id).single();
  if (!story || story.user_id !== requesterId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rows } = await adminDb
    .from("story_comments")
    .select("id, user_id, content, created_at")
    .eq("story_id", id)
    .order("created_at", { ascending: true });

  if (!rows?.length) return NextResponse.json({ comments: [] });

  const userIds = [...new Set(rows.map((c: { user_id: string }) => c.user_id))];
  const { data: profiles } = await adminDb
    .from("profiles")
    .select("clerk_id, display_name, username, avatar_url")
    .in("clerk_id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p: { clerk_id: string; display_name: string | null; username: string | null; avatar_url: string | null }) =>
      [p.clerk_id, p]
    )
  );

  return NextResponse.json({
    comments: rows.map((c: { id: string; user_id: string; content: string; created_at: string }) => ({
      id:        c.id,
      userId:    c.user_id,
      content:   c.content,
      createdAt: c.created_at,
      profile:   profileMap.get(c.user_id) ?? null,
    })),
  });
}

// POST /api/stories/[id]/comments — any viewer can reply
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, content } = await req.json();
  if (!userId || !content?.trim()) {
    return NextResponse.json({ error: "userId and content required" }, { status: 400 });
  }

  const { error } = await adminDb
    .from("story_comments")
    .insert({ story_id: id, user_id: userId, content: content.trim() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
