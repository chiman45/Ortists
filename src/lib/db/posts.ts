import { db } from "./client";

export interface Post {
  id: string;
  user_id: string;
  author_name: string;
  author_username: string;
  author_avatar: string | null;
  title: string;
  description: string | null;
  image_url: string;
  category: string;
  tags: string[];
  medium: string | null;
  style: string | null;
  location: string | null;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  created_at: string;
}

export async function getPosts(options?: {
  category?: string;
  limit?: number;
  userId?: string;
}): Promise<Post[]> {
  let query = db.from("posts").select("*").order("created_at", { ascending: false });

  if (options?.category) query = query.eq("category", options.category);
  if (options?.userId) query = query.eq("user_id", options.userId);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) console.error("getPosts:", error);
  return data ?? [];
}

export async function getPost(id: string): Promise<Post | null> {
  const { data, error } = await db
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error("getPost:", error);
  return data;
}

export async function createPost(post: {
  user_id: string;
  author_name: string;
  author_username: string;
  author_avatar?: string;
  title: string;
  description?: string;
  image_url: string;
  category?: string;
  tags?: string[];
  medium?: string;
  style?: string;
  location?: string;
  visibility?: string;
  allow_comments?: boolean;
  allow_downloads?: boolean;
}): Promise<Post | null> {
  const { data, error } = await db.from("posts").insert(post).select().single();
  if (error) console.error("createPost:", error);
  return data;
}

export async function likePost(postId: string, userId: string): Promise<boolean> {
  const { error } = await db.from("likes").insert({ post_id: postId, user_id: userId });
  if (!error) {
    const { data } = await db.from("posts").select("likes_count").eq("id", postId).single();
    if (data) await db.from("posts").update({ likes_count: data.likes_count + 1 }).eq("id", postId);
    return true;
  }
  return false;
}

export async function unlikePost(postId: string, userId: string): Promise<boolean> {
  const { error } = await db.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
  if (!error) {
    const { data } = await db.from("posts").select("likes_count").eq("id", postId).single();
    if (data) {
      await db.from("posts")
        .update({ likes_count: Math.max(0, data.likes_count - 1) })
        .eq("id", postId);
    }
    return true;
  }
  return false;
}

export async function isLiked(postId: string, userId: string): Promise<boolean> {
  const { data } = await db
    .from("likes")
    .select("user_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();
  return !!data;
}

export async function savePost(postId: string, userId: string): Promise<boolean> {
  const { error } = await db.from("saves").insert({ post_id: postId, user_id: userId });
  if (!error) {
    const { data } = await db.from("posts").select("saves_count").eq("id", postId).single();
    if (data) {
      await db.from("posts").update({ saves_count: data.saves_count + 1 }).eq("id", postId);
    }
    return true;
  }
  return false;
}

export async function unsavePost(postId: string, userId: string): Promise<boolean> {
  const { error } = await db.from("saves").delete().eq("post_id", postId).eq("user_id", userId);
  if (!error) {
    const { data } = await db.from("posts").select("saves_count").eq("id", postId).single();
    if (data) {
      await db.from("posts")
        .update({ saves_count: Math.max(0, data.saves_count - 1) })
        .eq("id", postId);
    }
    return true;
  }
  return false;
}

export async function isSaved(postId: string, userId: string): Promise<boolean> {
  const { data } = await db
    .from("saves")
    .select("user_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();
  return !!data;
}

export async function uploadArtwork(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await db.storage.from("artwork").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) { console.error("uploadArtwork:", error); return null; }

  const { data } = db.storage.from("artwork").getPublicUrl(path);
  return data.publicUrl;
}
