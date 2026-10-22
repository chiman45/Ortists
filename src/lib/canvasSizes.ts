// Canvas sizes offered on commissions, with floating-frame prices (₹) from the
// client's price sheet. Dimensions are inches, width × height.

export interface CanvasSize { w: number; h: number; frame: number; note?: string }

export const POPULAR_SIZES: CanvasSize[] = [
  { w: 8,  h: 8,  frame: 500  },
  { w: 11, h: 14, frame: 900  },
  { w: 12, h: 12, frame: 900  },
  { w: 16, h: 16, frame: 1300 },
  { w: 18, h: 24, frame: 1800 },
  { w: 16, h: 20, frame: 1700 },
  { w: 24, h: 36, frame: 2800 },
  { w: 30, h: 40, frame: 3400 },
];

export const SQUARE_SIZES: CanvasSize[] = [
  { w: 8,  h: 8,  frame: 500  },
  { w: 10, h: 10, frame: 700  },
  { w: 12, h: 12, frame: 900  },
  { w: 14, h: 14, frame: 1100 },
  { w: 16, h: 16, frame: 1300 },
  { w: 18, h: 18, frame: 1500 },
  { w: 20, h: 20, frame: 1700 },
  { w: 24, h: 24, frame: 2100, note: "2' × 2'" },
  { w: 30, h: 30, frame: 2800, note: "2.5' × 2.5'" },
  { w: 36, h: 36, frame: 3400, note: "3' × 3'" },
  { w: 42, h: 42, frame: 4000, note: "3.5' × 3.5'" },
  { w: 48, h: 48, frame: 4800, note: "4' × 4'" },
  { w: 54, h: 54, frame: 5400, note: "4.5' × 4.5'" },
];

// Options for the custom W × H dropdowns
export const CUSTOM_INCHES = [8, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 40, 42, 48, 54, 60];

export const sizeLabel = (w: number, h: number) => `${w}" × ${h}"`;

/**
 * Floating-frame price for any size. Listed sizes use the price sheet exactly;
 * anything else is estimated from the sheet's trend (≈ ₹100 per inch of
 * average side, which fits the listed prices within ~10%), rounded to ₹50.
 */
export function framePrice(w: number, h: number): { price: number; exact: boolean } {
  const listed = [...POPULAR_SIZES, ...SQUARE_SIZES].find(
    s => (s.w === w && s.h === h) || (s.w === h && s.h === w),
  );
  if (listed) return { price: listed.frame, exact: true };
  const avgSide = (w + h) / 2;
  const est = Math.max(500, Math.round((100 * avgSide - 300) / 50) * 50);
  return { price: est, exact: false };
}
