import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/posts?userId=&savedBy=&category=&limit=&offset=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId   = searchParams.get("userId");
  const savedBy  = searchParams.get("savedBy");   // fetch posts saved by this user
  const category = searchParams.get("category");
  const limit    = parseInt(searchParams.get("limit") ?? "12");
  const offset   = parseInt(searchParams.get("offset") ?? "0");

  // Fetch saved posts: join saves → posts
  if (savedBy) {
    const { data: saveRows } = await adminDb
      .from("saves")
      .select("post_id")
      .eq("user_id", savedBy)
      .order("created_at", { ascending: false });

    const postIds = (saveRows ?? []).map((r: { post_id: string }) => r.post_id);
    if (!postIds.length) return NextResponse.json({ posts: [], hasMore: false });

    const { data, error } = await adminDb
      .from("posts")
      .select("*")
      .in("id", postIds);

    if (error) console.error("GET /api/posts savedBy:", error.message);
    const posts = data ?? [];

    if (posts.length > 0) {
      const userIds = [...new Set(posts.map((p: { user_id: string }) => p.user_id))];
      const { data: profiles } = await adminDb
        .from("profiles")
        .select("clerk_id, display_name, username, avatar_url")
        .in("clerk_id", userIds);
      const map = new Map((profiles ?? []).map((p: { clerk_id: string; display_name: string | null; username: string | null; avatar_url: string | null }) => [p.clerk_id, p]));
      const enriched = posts.map((p: { user_id: string; author_name: string; author_username: string; author_avatar: string | null }) => {
        const prof = map.get(p.user_id);
        return { ...p, author_name: prof?.display_name ?? p.author_name, author_username: prof?.username ?? p.author_username, author_avatar: prof?.avatar_url ?? p.author_avatar };
      });
      return NextResponse.json({ posts: enriched, hasMore: false });
    }
    return NextResponse.json({ posts, hasMore: false });
  }

  // Filters MUST be applied before .order()/.range() in Supabase JS v2
  let query = adminDb.from("posts").select("*");
  if (userId)   query = query.eq("user_id", userId);
  if (category) query = query.eq("category", category);

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) console.error("GET /api/posts:", error.message);

  const posts = data ?? [];

  // Enrich with live profile data so name/username/avatar always reflect latest profile
  if (posts.length > 0) {
    const userIds = [...new Set(posts.map((p: { user_id: string }) => p.user_id))];
    const { data: profiles } = await adminDb
      .from("profiles")
      .select("clerk_id, display_name, username, avatar_url")
      .in("clerk_id", userIds);

    const map = new Map(
      (profiles ?? []).map((p: { clerk_id: string; display_name: string | null; username: string | null; avatar_url: string | null }) =>
        [p.clerk_id, p]
      )
    );

    const enriched = posts.map((p: { user_id: string; author_name: string; author_username: string; author_avatar: string | null }) => {
      const prof = map.get(p.user_id);
      return {
        ...p,
        author_name:     prof?.display_name ?? p.author_name,
        author_username: prof?.username      ?? p.author_username,
        author_avatar:   prof?.avatar_url    ?? p.author_avatar,
      };
    });

    return NextResponse.json({ posts: enriched, hasMore: posts.length === limit });
  }

  return NextResponse.json({ posts, hasMore: false });
}

// POST /api/posts — create a new post
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await adminDb
    .from("posts")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ post: data });
}
