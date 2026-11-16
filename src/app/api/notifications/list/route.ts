import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

// GET /api/notifications/list?userId=
export async function GET(req: NextRequest) {
  const me = await requireUser(new URL(req.url).searchParams.get("userId"));
  if (me.error) return me.error;
  const userId = me.userId;

  const { data, error } = await adminDb
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ notifications: [] });
  return NextResponse.json({ notifications: data ?? [] });
}

// POST /api/notifications/list
// { action: "mark_one", id } | { action: "mark_all", userId }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const me = await requireUser(body.userId);
  if (me.error) return me.error;

  if (body.action === "mark_one" && body.id) {
    // Only your own notifications
    await adminDb.from("notifications").update({ read: true }).eq("id", body.id).eq("user_id", me.userId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "mark_all") {
    await adminDb.from("notifications").update({ read: true }).eq("user_id", me.userId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
