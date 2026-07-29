import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/notifications?userId=
// Returns unread message count across all hire-request conversations the user is part of.
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ unreadMessages: 0 }, { status: 400 });

  // 1. Find all conversation_ids from accepted hire requests the user is involved in
  const { data: hrs } = await adminDb
    .from("hire_requests")
    .select("conversation_id")
    .not("conversation_id", "is", null)
    .or(`client_id.eq.${userId},artist_clerk_id.eq.${userId}`);

  const convIds = (hrs ?? [])
    .map(r => r.conversation_id as string)
    .filter(Boolean);

  if (!convIds.length) return NextResponse.json({ unreadMessages: 0 });

  // 2. Count messages that are unread and not sent by this user
  const { count } = await adminDb
    .from("messages")
    .select("*", { count: "exact", head: true })
    .in("conversation_id", convIds)
    .eq("read", false)
    .neq("sender_id", userId);

  return NextResponse.json({ unreadMessages: count ?? 0 });
}
