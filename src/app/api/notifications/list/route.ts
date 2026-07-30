import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/notifications/list?userId=
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ notifications: [] });

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
  const body = await req.json();

  if (body.action === "mark_one" && body.id) {
    await adminDb.from("notifications").update({ read: true }).eq("id", body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "mark_all" && body.userId) {
    await adminDb.from("notifications").update({ read: true }).eq("user_id", body.userId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
