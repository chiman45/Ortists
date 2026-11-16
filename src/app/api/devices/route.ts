import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

/**
 * Push-notification device tokens for the mobile app (migration 019).
 *
 * POST   /api/devices  { token, platform: "android" | "ios" }  — register this device after login
 * DELETE /api/devices  { token }                                — forget it on logout
 *
 * A token belongs to one install; if another account logs in on the same
 * phone, the row simply moves to that user.
 */
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (me.error) return me.error;

  const { token, platform } = await req.json().catch(() => ({}));
  if (typeof token !== "string" || token.length < 20 || token.length > 4096) {
    return NextResponse.json({ error: "Valid token required" }, { status: 400 });
  }
  if (platform !== "android" && platform !== "ios") {
    return NextResponse.json({ error: "platform must be android or ios" }, { status: 400 });
  }

  const { error } = await adminDb.from("device_tokens").upsert(
    { token, user_id: me.userId, platform, updated_at: new Date().toISOString() },
    { onConflict: "token" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const me = await requireUser();
  if (me.error) return me.error;

  const { token } = await req.json().catch(() => ({}));
  if (typeof token !== "string") return NextResponse.json({ error: "token required" }, { status: 400 });

  // Only remove the caller's own device
  await adminDb.from("device_tokens").delete().eq("token", token).eq("user_id", me.userId);
  return NextResponse.json({ ok: true });
}
