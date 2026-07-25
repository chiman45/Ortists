import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Characters allowed in search: letters, numbers, spaces, hyphens, underscores, dots, @
const ALLOWED_RE = /^[\w\s\-_.@#]{1,100}$/;

/**
 * Escape LIKE wildcard characters so user input is treated as a literal string.
 * Supabase uses parameterized queries internally, but the % and _ chars inside
 * the pattern string are still interpreted as wildcards by Postgres ILIKE.
 */
function escapeLike(raw: string): string {
  return raw.replace(/[%_\\]/g, "\\$&");
}

/**
 * Validate and sanitize the search query.
 * Returns null if the input should be rejected.
 */
function sanitize(input: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return null;
  if (!ALLOWED_RE.test(trimmed)) return null;
  return escapeLike(trimmed);
}

// GET /api/search?q=&type=posts|accounts|all
export async function GET(req: NextRequest) {
  // Require authentication
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const raw  = searchParams.get("q");
  const type = searchParams.get("type") ?? "all"; // "posts" | "accounts" | "all"

  const q = sanitize(raw);
  if (!q) {
    return NextResponse.json({ posts: [], accounts: [] });
  }

  const pattern = `%${q}%`;

  const [postsResult, accountsResult] = await Promise.all([
    // --- Posts: search title, category, tags (tags is a text array) ---
    type !== "accounts"
      ? adminDb
          .from("posts")
          .select("id, title, image_url, likes_count, comments_count, category, user_id, author_username, author_avatar, author_name")
          .or(`title.ilike.${pattern},category.ilike.${pattern}`)
          .order("likes_count", { ascending: false })
          .limit(24)
      : Promise.resolve({ data: [], error: null }),

    // --- Accounts: search display_name, username, tag, location ---
    type !== "posts"
      ? adminDb
          .from("profiles")
          .select("clerk_id, display_name, username, avatar_url, tag, location, followers_count, available")
          .or(`display_name.ilike.${pattern},username.ilike.${pattern},tag.ilike.${pattern}`)
          .order("followers_count", { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (postsResult.error)    console.error("search posts:",    postsResult.error.message);
  if (accountsResult.error) console.error("search accounts:", accountsResult.error.message);

  return NextResponse.json({
    posts:    postsResult.data    ?? [],
    accounts: accountsResult.data ?? [],
  });
}
