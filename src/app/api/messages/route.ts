import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// Broadcast an event to a Supabase Realtime channel without a WebSocket connection.
// Works in serverless/edge environments — no persistent connection needed.
async function realtimeBroadcast(channel: string, event: string, payload: unknown) {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  await fetch(`${url}/realtime/v1/api/broadcast`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "apikey": key, "Authorization": `Bearer ${key}` },
    body:    JSON.stringify({ messages: [{ topic: `realtime:${channel}`, event, payload }] }),
  }).catch(() => {});
}

// GET /api/messages?action=conversations&userId=
// GET /api/messages?action=messages&conversationId=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    console.log("[messages API] GET action:", action, "params:", Object.fromEntries(searchParams));

    if (action === "unread_count") {
      const userId = searchParams.get("userId");
      if (!userId) return NextResponse.json({ count: 0 });

      const { data: convs } = await adminDb
        .from("conversations")
        .select("id")
        .contains("participant_ids", [userId]);

      if (!convs || convs.length === 0) return NextResponse.json({ count: 0 });

      const convIds = convs.map((c: { id: string }) => c.id);

      const { count } = await adminDb
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", convIds)
        .eq("read", false)
        .neq("sender_id", userId);

      return NextResponse.json({ count: count ?? 0 });
    }

    if (action === "conversations") {
      const userId = searchParams.get("userId");
      if (!userId) return NextResponse.json({ conversations: [] });
      const { data, error } = await adminDb
        .from("conversations")
        .select("*")
        .contains("participant_ids", [userId])
        .order("last_message_at", { ascending: false });
      if (error) { console.error("conversations query:", error); return NextResponse.json({ conversations: [] }); }
      return NextResponse.json({ conversations: data ?? [] });
    }

    if (action === "messages") {
      const conversationId = searchParams.get("conversationId");
      if (!conversationId) return NextResponse.json({ messages: [] });
      const { data, error } = await adminDb
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) { console.error("messages query:", error); return NextResponse.json({ messages: [] }); }
      return NextResponse.json({ messages: data ?? [] });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("GET /api/messages:", e);
    return NextResponse.json({ count: 0, conversations: [], messages: [] });
  }
}

// POST /api/messages — multiple actions via body.action
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    console.log("[messages API] POST action:", action, "body:", body);

    if (action === "get_or_create_conversation") {
      const { userId1, userId2 } = body;
      const { data: existing, error: findErr } = await adminDb
        .from("conversations")
        .select("*")
        .contains("participant_ids", [userId1, userId2])
        .maybeSingle();
      console.log("[get_or_create_conversation] find:", { existing, findErr });
      if (existing) return NextResponse.json({ conversation: existing });

      const { data, error } = await adminDb
        .from("conversations")
        .insert({ participant_ids: [userId1, userId2] })
        .select()
        .single();
      console.log("[get_or_create_conversation] insert:", { data, error });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ conversation: data });
    }

    if (action === "send_message") {
      const { conversation_id, sender_id, sender_name, sender_avatar, text } = body;
      const { data, error } = await adminDb
        .from("messages")
        .insert({ conversation_id, sender_id, sender_name, sender_avatar, text, type: "text" })
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      await adminDb
        .from("conversations")
        .update({ last_message: text, last_message_at: new Date().toISOString() })
        .eq("id", conversation_id);

      // Notify the recipient (the other party in the hire request)
      const { data: hr } = await adminDb
        .from("hire_requests")
        .select("id, client_id, artist_clerk_id, project_title")
        .eq("conversation_id", conversation_id)
        .maybeSingle();
      if (hr) {
        const recipientId = hr.client_id === sender_id ? hr.artist_clerk_id : hr.client_id;
        if (recipientId && recipientId !== sender_id) {
          try {
            await adminDb.from("notifications").insert({
              user_id:      recipientId,
              actor_name:   sender_name ?? null,
              actor_avatar: sender_avatar ?? null,
              type:         "message",
              text:         `${sender_name ?? "Someone"} sent you a message`,
              sub_text:     hr.project_title ?? null,
              post_id:      hr.id,
            });
          } catch {}
        }
      }

      // Broadcast so the recipient sees the message without polling/refresh
      await realtimeBroadcast(`messages:${conversation_id}`, "new_message", data);

      return NextResponse.json({ message: data });
    }

    if (action === "mark_read") {
      const { conversationId, userId } = body;
      await adminDb
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId);

      // Broadcast so the sender sees the "Seen" indicator update in real-time
      await realtimeBroadcast(`messages:${conversationId}`, "mark_read", { conversationId, readBy: userId });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("[messages API] POST error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
