/**
 * image_url can be stored as:
 *   - Plain URL string (legacy single-image posts, video posts)
 *   - JSON array string: '["url1","url2"]' (multi-image posts)
 *
 * Always use these helpers — never read image_url raw.
 */

export function parseImageUrls(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const s = raw.trim();
  if (s.startsWith("[")) {
    try {
      const a = JSON.parse(s);
      if (Array.isArray(a)) return (a as unknown[]).filter((x): x is string => typeof x === "string" && x.length > 0);
    } catch {}
  }
  return s ? [s] : [];
}

/** First (cover) image — safe for any format */
export const firstImage = (raw: string | null | undefined): string =>
  parseImageUrls(raw)[0] ?? "";
