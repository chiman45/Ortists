import { db } from "./client";

export interface Profile {
  id: string;
  clerk_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  tag: string;
  available: boolean;
  response_time: string;
  followers_count: number;
  following_count: number;
  total_likes: number;
  rating: number;
  created_at: string;
}

export async function getProfile(clerkId: string): Promise<Profile | null> {
  const { data } = await db
    .from("profiles")
    .select("*")
    .eq("clerk_id", clerkId)
    .single();
  return data;
}

export async function upsertProfile(profile: {
  clerk_id: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  tag?: string;
}) {
  // Try update first (avoids RLS/key issues with upsert on some key types)
  const { data: existing } = await db
    .from("profiles")
    .select("clerk_id")
    .eq("clerk_id", profile.clerk_id)
    .maybeSingle();

  if (existing) {
    const { error } = await db
      .from("profiles")
      .update({ ...profile, updated_at: new Date().toISOString() })
      .eq("clerk_id", profile.clerk_id);
    if (error) console.error("upsertProfile (update):", error.message ?? JSON.stringify(error));
  } else {
    const { error } = await db
      .from("profiles")
      .insert({ ...profile });
    if (error) console.error("upsertProfile (insert):", error.message ?? JSON.stringify(error));
  }
}

export async function updateProfile(
  clerkId: string,
  updates: Partial<Profile>
) {
  const { data, error } = await db
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("clerk_id", clerkId)
    .select()
    .single();
  if (error) console.error("updateProfile:", error);
  return data;
}

export async function followUser(followerId: string, followingId: string) {
  const { error } = await db
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });

  if (!error) {
    const { data } = await db
      .from("profiles")
      .select("followers_count")
      .eq("clerk_id", followingId)
      .single();
    if (data) {
      await db
        .from("profiles")
        .update({ followers_count: data.followers_count + 1 })
        .eq("clerk_id", followingId);
    }
  }
}

export async function unfollowUser(followerId: string, followingId: string) {
  await db
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data } = await db
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single();
  return !!data;
}

export async function getAllProfiles(limit = 48): Promise<Profile[]> {
  const { data } = await db
    .from("profiles")
    .select("*")
    .order("followers_count", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  if (!query.trim()) return getAllProfiles();
  const { data } = await db
    .from("profiles")
    .select("*")
    .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
    .limit(30);
  return data ?? [];
}

export async function getProfilesByIds(ids: string[]): Promise<Profile[]> {
  if (!ids.length) return [];
  const { data } = await db
    .from("profiles")
    .select("*")
    .in("clerk_id", ids);
  return data ?? [];
}
