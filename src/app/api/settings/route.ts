import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/settings?userId=... — fetch user settings object
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const { data } = await adminDb
    .from("profiles")
    .select("settings")
    .eq("clerk_id", userId)
    .maybeSingle();

  return NextResponse.json({ settings: data?.settings ?? {} });
}

// PATCH /api/settings — {userId, settings} — deep-merges and saves
export async function PATCH(req: NextRequest) {
  const { userId, settings } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const { data: existing } = await adminDb
    .from("profiles")
    .select("settings")
    .eq("clerk_id", userId)
    .maybeSingle();

  const merged = { ...(existing?.settings ?? {}), ...settings };

  const { error } = await adminDb
    .from("profiles")
    .update({ settings: merged, updated_at: new Date().toISOString() })
    .eq("clerk_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, settings: merged });
}

// DELETE /api/settings — {userId} — wipes all user data from Supabase
// Clerk account deletion is handled client-side via user.delete()
export async function DELETE(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Delete posts first — cascades to likes, saves, comments via FK
  await adminDb.from("posts").delete().eq("user_id", userId);

  // Delete follow relationships
  await adminDb.from("follows").delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`);

  // Delete notifications
  await adminDb.from("notifications").delete().eq("user_id", userId);

  // Delete stories
  await adminDb.from("stories").delete().eq("user_id", userId);

  // Delete profile last
  await adminDb.from("profiles").delete().eq("clerk_id", userId);

  return NextResponse.json({ ok: true });
}
