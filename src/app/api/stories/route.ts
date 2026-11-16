import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

export interface DbStory {
  id: string;
  user_id: string;
  author_name: string;
  author_username: string;
  author_avatar: string | null;
  image_url: string;
  created_at: string;
  expires_at: string;
}

// GET /api/stories — all active (non-expired) stories with live profile data
export async function GET() {
  const { data, error } = await adminDb
    .from("stories")
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ stories: [] });
  const stories = data ?? [];
  if (stories.length === 0) return NextResponse.json({ stories: [] });

  // Fetch current profiles so names/avatars are always up to date
  const userIds = [...new Set(stories.map((s: DbStory) => s.user_id))];
  const { data: profiles } = await adminDb
    .from("profiles")
    .select("clerk_id, display_name, username, avatar_url")
    .in("clerk_id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p: { clerk_id: string; display_name: string | null; username: string | null; avatar_url: string | null }) =>
      [p.clerk_id, p]
    )
  );

  const enriched = stories.map((s: DbStory) => {
    const profile = profileMap.get(s.user_id);
    return {
      ...s,
      author_name:     profile?.display_name ?? s.author_name,
      author_username: profile?.username      ?? s.author_username,
      author_avatar:   profile?.avatar_url    ?? s.author_avatar,
    };
  });

  return NextResponse.json({ stories: enriched });
}

// POST /api/stories — create a story
export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => ({}));
  const me = await requireUser(raw.user_id);
  if (me.error) return me.error;
  if (!raw.image_url) return NextResponse.json({ error: "image_url required" }, { status: 400 });

  // Stories last at most 24 hours
  const maxExpiry = Date.now() + 24 * 60 * 60 * 1000;
  const asked = raw.expires_at ? Date.parse(raw.expires_at) : NaN;
  const body = {
    user_id:         me.userId,
    author_name:     raw.author_name ?? "Artist",
    author_username: raw.author_username ?? me.userId.slice(0, 12),
    author_avatar:   raw.author_avatar ?? null,
    image_url:       raw.image_url,
    expires_at:      new Date(Number.isFinite(asked) ? Math.min(asked, maxExpiry) : maxExpiry).toISOString(),
  };
  const { data, error } = await adminDb
    .from("stories")
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ story: data });
}
