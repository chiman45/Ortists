import { db } from "./client";

export interface Notification {
  id: string;
  user_id: string;
  actor_name: string | null;
  actor_avatar: string | null;
  type: string;
  text: string;
  sub_text: string | null;
  post_id: string | null;
  read: boolean;
  created_at: string;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await db
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) console.error("getNotifications:", error);
  return data ?? [];
}

export async function markNotificationRead(id: string) {
  await db.from("notifications").update({ read: true }).eq("id", id);
}

export async function markAllNotificationsRead(userId: string) {
  await db.from("notifications").update({ read: true }).eq("user_id", userId);
}

export async function createNotification(notif: {
  user_id: string;
  actor_name?: string;
  actor_avatar?: string;
  type: string;
  text: string;
  sub_text?: string;
  post_id?: string;
}) {
  const { error } = await db.from("notifications").insert(notif);
  if (error) console.error("createNotification:", error);
}
