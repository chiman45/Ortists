// Platform pricing: Ortists adds a 30% platform fee ON TOP of the price the
// artist sets, and buyers/clients only ever see the combined figure — the fee
// is never shown as a separate line. Artists keep seeing their own price.
//
// Artist sets ₹1,000 → buyer sees (and pays) ₹1,300.

export const PLATFORM_FEE_RATE = 0.30;

/** Buyer-facing amount for an artist-set price. */
export function withPlatformFee(artistPrice: number): number {
  return Math.round(artistPrice * (1 + PLATFORM_FEE_RATE));
}

/**
 * Gallery posts store the artist's price as a string like "₹1000" or "$80".
 * Returns the same symbol with the buyer-facing amount, or null if unparseable.
 */
export function buyerPriceLabel(artistPrice: string | null | undefined): string | null {
  const parsed = splitPriceString(artistPrice);
  if (!parsed) return null;
  return `${parsed.symbol}${withPlatformFee(parsed.amount).toLocaleString("en-IN")}`;
}

/** Buyer-facing numeric amount from a stored "₹1000"-style string (for charging). */
export function buyerPriceAmount(artistPrice: string | null | undefined): number | null {
  const parsed = splitPriceString(artistPrice);
  return parsed ? withPlatformFee(parsed.amount) : null;
}

/**
 * A post is a gallery (for-sale) listing when its category carries the
 * "gallery:" prefix or its description embeds a price. `price` is the artist's
 * own "₹1000"-style string, or null when the listing has no price yet.
 */
export function galleryListing(post: { category?: string | null; description?: string | null }): { price: string | null } | null {
  let price: string | null = null;
  if (post.description) {
    try {
      const obj = JSON.parse(post.description);
      if (obj && typeof obj._price === "string" && obj._price) price = obj._price;
    } catch { /* plain-text description */ }
  }
  if (price || (post.category ?? "").startsWith("gallery:")) return { price };
  return null;
}

function splitPriceString(raw: string | null | undefined): { symbol: string; amount: number } | null {
  if (!raw) return null;
  const m = raw.trim().match(/^([^\d.]*)\s*([\d,]+(?:\.\d+)?)/);
  if (!m) return null;
  const amount = parseFloat(m[2].replace(/,/g, ""));
  if (!(amount > 0)) return null;
  return { symbol: m[1].trim() || "₹", amount };
}
