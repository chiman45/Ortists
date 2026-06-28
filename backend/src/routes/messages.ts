import { Router, Request, Response } from "express";
import { db } from "../lib/supabase";
import { requireAuth, getUser } from "../middleware/auth";

const router = Router();

// All message routes require auth
router.use(requireAuth);

// GET /api/messages?action=unread_count|conversations|messages
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const userId = getUser(req);
  const { action, conversationId } = req.query as Record<string, string>;

  if (action === "unread_count") {
    const { data: convs } = await db.from("conversations").select("id").contains("participant_ids", [userId]);
    if (!convs?.length) { res.json({ count: 0 }); return; }
    const { count } = await db
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", convs.map((c: { id: string }) => c.id))
      .eq("read", false)
      .neq("sender_id", userId);
    res.json({ count: count ?? 0 });
    return;
  }

  if (action === "conversations") {
    const { data, error } = await db
      .from("conversations")
      .select("*")
      .contains("participant_ids", [userId])
      .order("last_message_at", { ascending: false });
    if (error) { res.status(500).json({ conversations: [] }); return; }
    res.json({ conversations: data ?? [] });
    return;
  }

  if (action === "messages") {
    if (!conversationId) { res.json({ messages: [] }); return; }

    // Verify user is a participant before returning messages
    const { data: conv } = await db.from("conversations").select("participant_ids").eq("id", conversationId).single();
    if (!conv || !(conv.participant_ids as string[]).includes(userId)) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const { data, error } = await db
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) { res.status(500).json({ messages: [] }); return; }
    res.json({ messages: data ?? [] });
    return;
  }

  res.status(400).json({ error: "Invalid action" });
});

// POST /api/messages
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const userId = getUser(req);
  const body = req.body as Record<string, unknown>;
  const { action } = body;

  if (action === "get_or_create_conversation") {
    const { userId1, userId2 } = body as { userId1: string; userId2: string };

    // Caller must be one of the participants
    if (userId !== userId1 && userId !== userId2) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const { data: existing } = await db
      .from("conversations")
      .select("*")
      .contains("participant_ids", [userId1, userId2])
      .maybeSingle();

    if (existing) { res.json({ conversation: existing }); return; }

    const { data, error } = await db.from("conversations").insert({ participant_ids: [userId1, userId2] }).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ conversation: data });
    return;
  }

  if (action === "send_message") {
    const { conversation_id, sender_id, sender_name, sender_avatar, text } = body as Record<string, string>;

    // Only the authenticated user can send as themselves
    if (sender_id !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

    // Verify user is participant in this conversation
    const { data: conv } = await db.from("conversations").select("participant_ids").eq("id", conversation_id).single();
    if (!conv || !(conv.participant_ids as string[]).includes(userId)) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const { data, error } = await db
      .from("messages")
      .insert({ conversation_id, sender_id, sender_name, sender_avatar, text, type: "text" })
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }

    await db.from("conversations").update({ last_message: text, last_message_at: new Date().toISOString() }).eq("id", conversation_id);
    res.status(201).json({ message: data });
    return;
  }

  if (action === "mark_read") {
    const { conversationId, userId: bodyUserId } = body as { conversationId: string; userId: string };
    if (bodyUserId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

    await db.from("messages").update({ read: true }).eq("conversation_id", conversationId).neq("sender_id", userId);
    res.json({ ok: true });
    return;
  }

  res.status(400).json({ error: "Invalid action" });
});

export default router;
