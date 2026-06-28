import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/stories/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await adminDb.from("stories").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}

// POST /api/stories/[id] — record a view (idempotent; skips own stories)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { viewerId } = await req.json();
  if (!viewerId) return NextResponse.json({ error: "viewerId required" }, { status: 400 });

  // Don't count self-views
  const { data: story } = await adminDb.from("stories").select("user_id").eq("id", id).single();
  if (!story || story.user_id === viewerId) return NextResponse.json({ ok: true });

  await adminDb
    .from("story_views")
    .upsert({ story_id: id, viewer_id: viewerId }, { onConflict: "story_id,viewer_id" });

  return NextResponse.json({ ok: true });
}

// GET /api/stories/[id]?requesterId= — return viewers list (story owner only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requesterId = new URL(req.url).searchParams.get("requesterId");

  const { data: story } = await adminDb.from("stories").select("user_id").eq("id", id).single();
  if (!story || story.user_id !== requesterId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: views } = await adminDb
    .from("story_views")
    .select("viewer_id, viewed_at")
    .eq("story_id", id)
    .order("viewed_at", { ascending: false });

  if (!views?.length) return NextResponse.json({ viewers: [], count: 0 });

  const viewerIds = views.map((v: { viewer_id: string }) => v.viewer_id);
  const { data: profiles } = await adminDb
    .from("profiles")
    .select("clerk_id, display_name, username, avatar_url")
    .in("clerk_id", viewerIds);

  const profileMap = new Map((profiles ?? []).map((p: { clerk_id: string; display_name: string | null; username: string | null; avatar_url: string | null }) => [p.clerk_id, p]));

  const viewers = views.map((v: { viewer_id: string; viewed_at: string }) => ({
    viewerId:  v.viewer_id,
    viewedAt:  v.viewed_at,
    profile:   profileMap.get(v.viewer_id) ?? null,
  }));

  return NextResponse.json({ viewers, count: views.length });
}
