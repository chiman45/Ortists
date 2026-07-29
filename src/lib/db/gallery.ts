import { db } from "./client";

export interface GalleryListing {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_avatar: string | null;
  title: string;
  description: string | null;
  image_url: string;
  price: number | null;
  category: string | null;
  tags: string[];
  is_physical: boolean;
  is_limited: boolean;
  edition_total: number | null;
  status: string;
  likes_count: number;
  saves_count: number;
  created_at: string;
}

export async function getListings(options?: {
  category?: string;
  limit?: number;
  sellerId?: string;
}): Promise<GalleryListing[]> {
  let query = db
    .from("Gallery_listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (options?.category) query = query.eq("category", options.category);
  if (options?.sellerId) query = query.eq("seller_id", options.sellerId);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) console.error("getListings:", error);
  return data ?? [];
}

export async function getListing(id: string): Promise<GalleryListing | null> {
  const { data, error } = await db
    .from("Gallery_listings")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error("getListing:", error);
  return data;
}

export async function createListing(listing: {
  seller_id: string;
  seller_name: string;
  seller_avatar?: string;
  title: string;
  description?: string;
  image_url: string;
  price?: number;
  category?: string;
  tags?: string[];
  is_physical?: boolean;
  is_limited?: boolean;
  edition_total?: number;
}): Promise<GalleryListing | null> {
  const { data, error } = await db
    .from("Gallery_listings")
    .insert(listing)
    .select()
    .single();
  if (error) console.error("createListing:", error);
  return data;
}

export async function toggleListingLike(
  listingId: string,
  userId: string
): Promise<{ liked: boolean }> {
  const { data: existing } = await db
    .from("Gallery_likes")
    .select("user_id")
    .eq("listing_id", listingId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    await db.from("Gallery_likes").delete().eq("listing_id", listingId).eq("user_id", userId);
    const { data } = await db.from("Gallery_listings").select("likes_count").eq("id", listingId).single();
    if (data) await db.from("Gallery_listings").update({ likes_count: Math.max(0, data.likes_count - 1) }).eq("id", listingId);
    return { liked: false };
  } else {
    await db.from("Gallery_likes").insert({ listing_id: listingId, user_id: userId });
    const { data } = await db.from("Gallery_listings").select("likes_count").eq("id", listingId).single();
    if (data) await db.from("Gallery_listings").update({ likes_count: data.likes_count + 1 }).eq("id", listingId);
    return { liked: true };
  }
}

export async function isListingLiked(listingId: string, userId: string): Promise<boolean> {
  const { data } = await db
    .from("Gallery_likes")
    .select("user_id")
    .eq("listing_id", listingId)
    .eq("user_id", userId)
    .single();
  return !!data;
}
