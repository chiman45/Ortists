// Canvas sizes offered on commissions, grouped by canvas shape, with
// floating-frame prices (₹) from the client's price sheet. Inches, width × height.
// Circle and panoramic canvases are sold without a frame.

export interface CanvasSize { w: number; h: number; frame: number | null; note?: string }
export interface CanvasCategory { id: string; label: string; frameable: boolean; sizes: CanvasSize[] }

const s = (w: number, h: number, frame: number | null, note?: string): CanvasSize => ({ w, h, frame, note });

export const CANVAS_CATEGORIES: CanvasCategory[] = [
  {
    id: "square", label: "Square", frameable: true,
    sizes: [
      s(8, 8, 500), s(10, 10, 700), s(12, 12, 900), s(14, 14, 1100), s(16, 16, 1300),
      s(18, 18, 1500), s(20, 20, 1700), s(24, 24, 2100, "2' × 2'"), s(30, 30, 2800, "2.5' × 2.5'"),
      s(36, 36, 3400, "3' × 3'"), s(42, 42, 4000, "3.5' × 3.5'"), s(48, 48, 4800, "4' × 4'"),
      s(54, 54, 5400, "4.5' × 4.5'"),
    ],
  },
  {
    id: "popular", label: "Popular", frameable: true,
    sizes: [
      s(8, 8, 500), s(11, 14, 900), s(12, 12, 900), s(16, 16, 1300),
      s(18, 24, 1800), s(16, 20, 1700), s(24, 36, 2800), s(30, 40, 3400),
    ],
  },
  {
    id: "portrait", label: "Portrait", frameable: true,
    sizes: [
      s(8, 10, 550), s(8, 12, 800), s(12, 16, 1150), s(12, 18, 1250), s(16, 24, 1800),
      s(20, 30, 2250), s(24, 36, 2800), s(30, 40, 3400), s(36, 48, 4200), s(48, 72, 6600),
    ],
  },
  {
    id: "rectangle", label: "Rectangle", frameable: true,
    sizes: [
      s(8, 10, 550), s(8, 12, 800), s(11, 14, 900), s(12, 16, 1150),
      s(12, 18, 1250), s(16, 20, 1700), s(20, 30, 2250), s(36, 48, 4200),
    ],
  },
  {
    id: "circle", label: "Circle", frameable: false,
    sizes: [10, 12, 14, 16, 20, 24, 28, 32, 36].map(d => s(d, d, null, `${d}" diameter`)),
  },
  {
    id: "panoramic", label: "Panoramic", frameable: false,
    sizes: [s(8, 24, null), s(10, 40, null), s(10, 30, null), s(12, 36, null), s(15, 45, null), s(16, 48, null), s(18, 54, null), s(20, 54, null)],
  },
];

export const categoryById = (id: string) => CANVAS_CATEGORIES.find(c => c.id === id) ?? CANVAS_CATEGORIES[0];

// Options for the custom W × H dropdowns
export const CUSTOM_INCHES = [8, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 40, 42, 48, 54, 60, 72];

export const sizeLabel = (w: number, h: number) => `${w}" × ${h}"`;

/** Key into an artist's profiles.size_prices map, e.g. "square:16x16". */
export const sizeKey = (categoryId: string, w: number, h: number) => `${categoryId}:${w}x${h}`;

/** The artist's own (pre-fee, unframed) price for a size, or null if they haven't set one. */
export function artistSizePrice(
  prices: Record<string, number> | null | undefined, categoryId: string, w: number, h: number,
): number | null {
  const p = prices?.[sizeKey(categoryId, w, h)];
  return typeof p === "number" && p > 0 ? p : null;
}

/**
 * Floating-frame price for a size within a canvas shape.
 * - Shapes sold without a frame (circle, panoramic) → null.
 * - Listed sizes use the price sheet exactly (orientation-insensitive).
 * - Anything else is estimated from the sheet's trend (≈ ₹100 per inch of
 *   average side), rounded to ₹50 and flagged as approximate.
 */
export function framePrice(w: number, h: number, categoryId = "square"): { price: number; exact: boolean } | null {
  const cat = categoryById(categoryId);
  if (!cat.frameable) return null;
  const match = (x: CanvasSize) => (x.w === w && x.h === h) || (x.w === h && x.h === w);
  const listed = cat.sizes.find(match)
    ?? CANVAS_CATEGORIES.filter(c => c.frameable).flatMap(c => c.sizes).find(match);
  if (listed?.frame) return { price: listed.frame, exact: true };
  const avgSide = (w + h) / 2;
  return { price: Math.max(500, Math.round((100 * avgSide - 300) / 50) * 50), exact: false };
}
