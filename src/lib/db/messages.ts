import { db } from "./client";

export interface Conversation {
  id: string;
  participant_ids: string[];
  last_message: string | null;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string | null;
  sender_avatar: string | null;
  text: string | null;
  type: string;
  read: boolean;
  created_at: string;
}

export async function getOrCreateConversation(
  userId1: string,
  userId2: string
): Promise<Conversation | null> {
  // Check existing conversation between these two users
  const { data: existing } = await db
    .from("conversations")
    .select("*")
    .contains("participant_ids", [userId1, userId2])
    .single();

  if (existing) return existing;

  const { data, error } = await db
    .from("conversations")
    .insert({ participant_ids: [userId1, userId2] })
    .select()
    .single();

  if (error) console.error("getOrCreateConversation:", error);
  return data;
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await db
    .from("conversations")
    .select("*")
    .contains("participant_ids", [userId])
    .order("last_message_at", { ascending: false });

  if (error) console.error("getUserConversations:", error);
  return data ?? [];
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await db
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) console.error("getMessages:", error);
  return data ?? [];
}

export async function sendMessage(msg: {
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string;
  text: string;
  type?: string;
}): Promise<Message | null> {
  const { data, error } = await db
    .from("messages")
    .insert({ ...msg, type: msg.type ?? "text" })
    .select()
    .single();

  if (!error) {
    await db
      .from("conversations")
      .update({ last_message: msg.text, last_message_at: new Date().toISOString() })
      .eq("id", msg.conversation_id);
  }

  if (error) console.error("sendMessage:", error);
  return data;
}

export async function markMessagesRead(conversationId: string, userId: string) {
  await db
    .from("messages")
    .update({ read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId);
}
