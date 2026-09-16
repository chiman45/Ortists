import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/ratings?artworkId=&userId= → { average, count, myRating }
export async function GET(req: NextRequest) {
  const url       = new URL(req.url);
  const artworkId = url.searchParams.get("artworkId");
  const userId    = url.searchParams.get("userId");
  if (!artworkId) return NextResponse.json({ average: 0, count: 0, myRating: null });

  const { data } = await adminDb
    .from("artwork_ratings")
    .select("rating, user_id")
    .eq("artwork_id", artworkId);

  const ratings  = data ?? [];
  const count    = ratings.length;
  const average  = count ? ratings.reduce((sum, r) => sum + r.rating, 0) / count : 0;
  const myRating = userId ? ratings.find(r => r.user_id === userId)?.rating ?? null : null;

  return NextResponse.json({ average, count, myRating });
}

// POST /api/ratings — { artworkId, userId, rating } upsert one rating per user per artwork
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { artworkId, userId, rating } = body;

  if (!artworkId || !userId || !rating) {
    return NextResponse.json({ error: "artworkId, userId and rating are required" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be between 1 and 5" }, { status: 400 });
  }

  const { error } = await adminDb
    .from("artwork_ratings")
    .upsert({ artwork_id: artworkId, user_id: userId, rating }, { onConflict: "artwork_id,user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await adminDb
    .from("artwork_ratings")
    .select("rating")
    .eq("artwork_id", artworkId);
  const ratings = data ?? [];
  const average = ratings.length ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

  return NextResponse.json({ ok: true, average, count: ratings.length });
}
