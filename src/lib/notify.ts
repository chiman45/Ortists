// Server-only: create an in-app notification.
import { adminDb } from "@/utils/supabase/admin";

export interface NotifyInput {
  user_id:       string;             // who receives it
  type:          string;             // like | comment | follow | commission | message | …
  text:          string;
  sub_text?:     string | null;
  actor_name?:   string | null;
  actor_avatar?: string | null;
  /** Only for notifications about a post (`post_id` must be a real post). */
  post_id?:      string | null;
  /** Where the notification opens, for everything that is not a post. */
  link?:         string | null;
}

/**
 * `notifications.post_id` is a foreign key to posts, so putting a hire-request
 * or user id there made the database reject the row — those notifications were
 * silently lost. Non-post targets go in `link` (migration 021) instead.
 * Never throws: a failed notification must not fail the action that caused it.
 */
export async function notify(n: NotifyInput): Promise<void> {
  try {
    const row: Record<string, string | null> = {
      user_id: n.user_id, type: n.type, text: n.text, sub_text: n.sub_text ?? null,
      actor_name: n.actor_name ?? null, actor_avatar: n.actor_avatar ?? null, post_id: n.post_id ?? null,
    };
    const { error } = await adminDb.from("notifications").insert(n.link ? { ...row, link: n.link } : row);
    if (!error) return;
    // Before migration 021 is run there is no `link` column: still deliver the notification
    if (n.link) {
      const retry = await adminDb.from("notifications").insert(row);
      if (!retry.error) return;
      console.error("[notify]", retry.error.message);
    } else {
      console.error("[notify]", error.message);
    }
  } catch (e) {
    console.error("[notify]", e);
  }
}
