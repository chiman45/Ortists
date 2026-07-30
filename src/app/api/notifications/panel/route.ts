import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

interface NotifItem {
  id: string;
  type: "message" | "hire_request";
  title: string;
  body: string;
  link: string;
  created_at: string;
}

// GET /api/notifications/panel?userId=
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ notifications: [] });

  const notifications: NotifItem[] = [];

  // 1. Pending hire requests where user is the artist (new commissions)
  const { data: pendingHires } = await adminDb
    .from("hire_requests")
    .select("id, project_title, created_at")
    .eq("artist_clerk_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  for (const hr of pendingHires ?? []) {
    notifications.push({
      id: `hr-${hr.id}`,
      type: "hire_request",
      title: "New commission request",
      body: hr.project_title,
      link: `/hiring?tab=requests`,
      created_at: hr.created_at,
    });
  }

  // 2. Unread messages across all hire-request conversations
  const { data: hrs } = await adminDb
    .from("hire_requests")
    .select("id, project_title, conversation_id")
    .not("conversation_id", "is", null)
    .or(`client_id.eq.${userId},artist_clerk_id.eq.${userId}`);

  for (const hr of (hrs ?? []).slice(0, 15)) {
    if (!hr.conversation_id) continue;
    const { data: msgs, count } = await adminDb
      .from("messages")
      .select("sender_name, created_at", { count: "exact" })
      .eq("conversation_id", hr.conversation_id)
      .eq("read", false)
      .neq("sender_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!count || count === 0) continue;
    notifications.push({
      id: `msg-${hr.id}`,
      type: "message",
      title: msgs?.[0]?.sender_name
        ? `${msgs[0].sender_name} sent a message`
        : "New message",
      body: `${count} unread in "${hr.project_title}"`,
      link: `/hiring/projects/${hr.id}`,
      created_at: msgs?.[0]?.created_at ?? new Date().toISOString(),
    });
  }

  notifications.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return NextResponse.json({ notifications: notifications.slice(0, 20) });
}
