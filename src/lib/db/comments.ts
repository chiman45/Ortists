import { db } from "./client";

export interface Comment {
  id: string;
  user_id: string;
  author_name: string;
  author_avatar: string | null;
  post_id: string;
  text: string;
  created_at: string;
}

export async function getComments(postId: string): Promise<Comment[]> {
  const { data, error } = await db
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });
  if (error) console.error("getComments:", error);
  return data ?? [];
}

export async function addComment(comment: {
  user_id: string;
  author_name: string;
  author_avatar?: string;
  post_id: string;
  text: string;
}): Promise<Comment | null> {
  const { data, error } = await db
    .from("comments")
    .insert(comment)
    .select()
    .single();

  if (!error) {
    // increment comment count on post
    const { data: post } = await db
      .from("posts")
      .select("comments_count")
      .eq("id", comment.post_id)
      .single();
    if (post) {
      await db
        .from("posts")
        .update({ comments_count: post.comments_count + 1 })
        .eq("id", comment.post_id);
    }
  }

  if (error) console.error("addComment:", error);
  return data;
}
