// Parses free-text artwork sizes into centimetres so they can be drawn to scale.
// Handles "40x60", "40 × 60 cm", "24 x 36 in", "12×16 inches", "A4", "A3 print".

export interface SizeCm { widthCm: number; heightCm: number; label: string }

const PAPER_MM: Record<string, [number, number]> = {
  A0: [841, 1189], A1: [594, 841], A2: [420, 594], A3: [297, 420],
  A4: [210, 297],  A5: [148, 210], A6: [105, 148],
};

export function parseDimensions(raw: string | null | undefined): SizeCm | null {
  if (!raw) return null;
  const text = raw.trim();

  const paper = text.match(/\b(A[0-6])\b/i);
  if (paper) {
    const [w, h] = PAPER_MM[paper[1].toUpperCase()];
    return { widthCm: w / 10, heightCm: h / 10, label: `${paper[1].toUpperCase()} · ${w / 10} × ${h / 10} cm` };
  }

  const m = text.match(/(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)\s*(cm|mm|in|inch|inches|"|ft|feet|')?/i);
  if (!m) return null;
  let w = parseFloat(m[1]);
  let h = parseFloat(m[2]);
  const unit = (m[3] ?? "").toLowerCase();
  let unitLabel = "cm";
  if (unit.startsWith("in") || unit === '"') { w *= 2.54; h *= 2.54; unitLabel = "in"; }
  else if (unit.startsWith("f") || unit === "'") { w *= 30.48; h *= 30.48; unitLabel = "ft"; }
  else if (unit === "mm") { w /= 10; h /= 10; unitLabel = "mm"; }
  if (!(w > 0 && h > 0) || w > 1000 || h > 1000) return null;

  const label = unitLabel === "cm"
    ? `${m[1]} × ${m[2]} cm`
    : `${m[1]} × ${m[2]} ${unitLabel} · ${Math.round(w)} × ${Math.round(h)} cm`;
  return { widthCm: w, heightCm: h, label };
}
