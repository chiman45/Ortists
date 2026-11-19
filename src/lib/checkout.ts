// Server-only: works out what a buyer pays. Prices and delivery charges are
// always computed here from the database — never taken from the browser.
import { adminDb } from "@/utils/supabase/admin";
import { buyerPriceAmount, galleryListing } from "@/lib/pricing";
import { firstImage } from "@/lib/imageUrl";
import { checkServiceability, ShiprocketNotConfigured } from "@/lib/shiprocket";

/** Packed weight assumed for one artwork until listings carry their own. */
export const DEFAULT_WEIGHT_KG = 1;
export const MAX_ITEMS = 20;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CheckoutItem {
  post_id:         string;
  title:           string;
  image:           string;
  artist_name:     string;
  /** Size and medium as the artist wrote them, for display only. */
  dimensions:      string | null;
  medium:          string | null;
  seller_clerk_id: string;
  price_paise:     number;        // buyer-facing price (includes platform fee)
  /** Why this artwork can't be bought, or null when it can. */
  unavailable:     string | null;
}

export interface QuotedItem extends CheckoutItem {
  deliverable:    boolean;
  shipping_paise: number;
  delivery_days:  number | null;
  courier_name:   string | null;
  /** Why it can't be delivered to the chosen address, or null. */
  delivery_note:  string | null;
  /** True when the courier can't reach the buyer's pincode (as opposed to a problem on our side). */
  pincode_issue:  boolean;
}

export interface Address {
  id: string; clerk_id: string; label: string; name: string; phone: string;
  address_line: string; city: string; state: string; pincode: string; country: string;
}

export interface DeliveryCheck {
  items:          QuotedItem[];
  pincode:        string;
  subtotal_paise: number;
  shipping_paise: number;
  total_paise:    number;
  /** True only when every artwork can be bought and delivered. */
  ok:             boolean;
}

export interface Quote {
  items:          QuotedItem[];
  address:        Address;
  subtotal_paise: number;
  shipping_paise: number;
  total_paise:    number;
  /** True only when every artwork can be bought and delivered. */
  ok:             boolean;
}

export class CheckoutError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

/** Keeps valid, distinct post ids in the order given. */
export function cleanIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const ids = raw.filter((v): v is string => typeof v === "string" && UUID_RE.test(v));
  return [...new Set(ids)].slice(0, MAX_ITEMS);
}

export async function loadItems(postIds: string[], buyerId: string): Promise<CheckoutItem[]> {
  if (!postIds.length) return [];
  const { data, error } = await adminDb
    .from("posts")
    .select("id, user_id, author_name, title, description, image_url, category, medium")
    .in("id", postIds);
  if (error) throw new CheckoutError("Could not load the artwork. Please try again.", 500);

  const byId = new Map((data ?? []).map(p => [p.id as string, p]));
  return postIds.map(id => {
    const p = byId.get(id);
    if (!p) {
      return { post_id: id, title: "Artwork", image: "", artist_name: "", seller_clerk_id: "", dimensions: null, medium: null,
               price_paise: 0, unavailable: "This artwork is no longer listed." };
    }
    const listing = galleryListing(p);
    const rawPrice = listing?.price ?? null;
    const rupees = buyerPriceAmount(rawPrice);
    let unavailable: string | null = null;
    if (!rupees) unavailable = "This artwork is not for sale.";
    // Payments are taken in rupees only
    else if (rawPrice && !/^\s*(₹|rs\.?|inr)?\s*\d/i.test(rawPrice)) unavailable = "This artwork is not priced in rupees.";
    else if (p.user_id === buyerId) unavailable = "This is your own artwork.";
    let dimensions: string | null = null;
    try { dimensions = JSON.parse(p.description ?? "")._dimensions || null; } catch { /* plain text */ }
    return {
      dimensions,
      medium:          p.medium ?? null,
      post_id:         id,
      title:           p.title || "Artwork",
      image:           firstImage(p.image_url) ?? "",
      artist_name:     p.author_name ?? "",
      seller_clerk_id: p.user_id,
      price_paise:     rupees ? Math.round(rupees * 100) : 0,
      unavailable,
    };
  });
}

/** Pincode each artwork is collected from: the artist's default address, else the platform's. */
async function pickupPincodes(sellerIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (sellerIds.length) {
    const { data } = await adminDb
      .from("address_book")
      .select("clerk_id, pincode, is_default, created_at")
      .in("clerk_id", sellerIds)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    for (const a of data ?? []) {
      if (!out.has(a.clerk_id) && /^\d{6}$/.test(a.pincode ?? "")) out.set(a.clerk_id, a.pincode);
    }
  }
  const fallback = (process.env.SHIPROCKET_PICKUP_PINCODE ?? "").trim();
  if (/^\d{6}$/.test(fallback)) for (const id of sellerIds) if (!out.has(id)) out.set(id, fallback);
  return out;
}

/**
 * Price + delivery check for these artworks to one of the buyer's saved
 * addresses. Throws CheckoutError when the check itself can't be done.
 */
export async function buildQuote(buyerId: string, postIds: string[], addressId: string): Promise<Quote> {
  if (!postIds.length) throw new CheckoutError("There is nothing to buy.");
  if (!UUID_RE.test(addressId)) throw new CheckoutError("Please choose a delivery address.");

  const { data: address } = await adminDb
    .from("address_book").select("*").eq("id", addressId).eq("clerk_id", buyerId).maybeSingle();
  if (!address) throw new CheckoutError("Please choose a delivery address.");
  if (!/^\d{6}$/.test(address.pincode ?? "")) throw new CheckoutError("This address has an invalid pincode. Please correct it.");

  const check = await checkPincode(buyerId, postIds, address.pincode);
  return { ...check, address };
}

/**
 * Can these artworks be delivered to this pincode, and for how much? Used both
 * for a saved address and while the buyer is still typing a new one.
 */
export async function checkPincode(buyerId: string, postIds: string[], pincode: string): Promise<DeliveryCheck> {
  if (!postIds.length) throw new CheckoutError("There is nothing to buy.");
  if (!/^\d{6}$/.test(pincode)) throw new CheckoutError("Enter a 6-digit pincode.");
  const address = { pincode };

  const items = await loadItems(postIds, buyerId);
  const buyable = items.filter(i => !i.unavailable);
  const pickups = await pickupPincodes([...new Set(buyable.map(i => i.seller_clerk_id))]);

  // One Shiprocket check per pickup pincode (each artwork is its own parcel)
  const checks = new Map<string, Awaited<ReturnType<typeof checkServiceability>>>();
  try {
    await Promise.all([...new Set(pickups.values())].map(async pin => {
      checks.set(pin, await checkServiceability({
        pickup_postcode: pin, delivery_postcode: address.pincode, weight: DEFAULT_WEIGHT_KG,
      }));
    }));
  } catch (e) {
    console.error("[checkout] delivery check failed:", e instanceof Error ? e.message : e);
    throw new CheckoutError(
      e instanceof ShiprocketNotConfigured
        ? "Delivery checks are not set up yet, so orders can't be placed right now."
        : "We couldn't check delivery to this address. Please try again in a moment.",
      503,
    );
  }

  const quoted: QuotedItem[] = items.map(i => {
    const blank = { deliverable: false, shipping_paise: 0, delivery_days: null, courier_name: null, pincode_issue: false };
    if (i.unavailable) return { ...i, ...blank, delivery_note: i.unavailable };
    const pin = pickups.get(i.seller_clerk_id);
    if (!pin) return { ...i, ...blank, delivery_note: "This artwork can't be shipped yet because its pickup address has not been set up. Please try again later." };
    const c = checks.get(pin);
    if (!c?.serviceable || c.rate == null) {
      return { ...i, ...blank, pincode_issue: true, delivery_note: `Can't be delivered to pincode ${address.pincode}.` };
    }
    return {
      ...i, deliverable: true, shipping_paise: Math.round(c.rate * 100),
      delivery_days: c.delivery_days, courier_name: c.courier_name, delivery_note: null, pincode_issue: false,
    };
  });

  const good = quoted.filter(i => i.deliverable);
  const subtotal = good.reduce((s, i) => s + i.price_paise, 0);
  const shipping = good.reduce((s, i) => s + i.shipping_paise, 0);
  return {
    items: quoted, pincode,
    subtotal_paise: subtotal, shipping_paise: shipping, total_paise: subtotal + shipping,
    ok: quoted.length > 0 && quoted.every(i => i.deliverable),
  };
}
