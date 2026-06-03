import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/posts?userId=&category=&limit=&offset= — fetch posts with pagination
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId   = searchParams.get("userId");
  const category = searchParams.get("category");
  const limit    = parseInt(searchParams.get("limit") ?? "12");
  const offset   = parseInt(searchParams.get("offset") ?? "0");

  // Filters MUST be applied before .order()/.range() in Supabase JS v2
  let query = adminDb.from("posts").select("*");
  if (userId)   query = query.eq("user_id", userId);
  if (category) query = query.eq("category", category);

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) console.error("GET /api/posts:", error.message);
  return NextResponse.json({ posts: data ?? [], hasMore: (data?.length ?? 0) === limit });
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
