import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

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
    // Saved posts are private to their owner
    const me = await requireUser(savedBy);
    if (me.error) return me.error;
    const { data: saveRows, error: savesErr } = await adminDb
      .from("saves")
      .select("post_id")
      .eq("user_id", me.userId)
      .order("created_at", { ascending: false });
    if (savesErr) {
      console.error("GET /api/posts savedBy (saves):", savesErr.message);
      return NextResponse.json({ error: savesErr.message, posts: [], hasMore: false }, { status: 500 });
    }

    const postIds = (saveRows ?? []).map((r: { post_id: string }) => r.post_id);
    if (!postIds.length) return NextResponse.json({ posts: [], hasMore: false });

    const { data, error } = await adminDb
      .from("posts")
      .select("*")
      .in("id", postIds);

    if (error) console.error("GET /api/posts savedBy:", error.message);
    // .in() returns rows in table order — put the most recently saved first
    const order = new Map(postIds.map((pid, i) => [pid, i]));
    const posts = (data ?? []).sort((a: { id: string }, b: { id: string }) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

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

  const galleryOnly = searchParams.get("gallery") === "1";

  // Filters MUST be applied before .order()/.range() in Supabase JS v2
  let query = adminDb.from("posts").select("*");
  if (userId)      query = query.eq("user_id", userId);
  if (category)    query = query.eq("category", category);
  if (galleryOnly) {
    // Gallery page: only posts whose category starts with "gallery:"
    query = query.ilike("category", "gallery:%");
  }
  // Regular feed shows everything, gallery (for-sale) works included,
  // so an artist's full body of work appears in the feed.

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

// Columns a client may set when creating a post. Counters, id and created_at stay server-controlled.
const POST_FIELDS = [
  "author_name", "author_username", "author_avatar", "title", "description", "image_url",
  "category", "tags", "medium", "style", "location", "visibility",
  "allow_comments", "allow_downloads", "post_type", "gallery_urls",
] as const;

// POST /api/posts — create a new post as the signed-in user
export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => ({}));
  const me = await requireUser(raw.user_id);
  if (me.error) return me.error;

  const body: Record<string, unknown> = { user_id: me.userId };
  for (const k of POST_FIELDS) if (raw[k] !== undefined) body[k] = raw[k];

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
