import { NextRequest, NextResponse } from "next/server";

// GET /api/link-preview?url=https://...
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OrtistBot/1.0; +https://ortist.art)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return NextResponse.json({ error: "fetch failed" }, { status: 502 });

    const contentType = res.headers.get("content-type") ?? "";
    // If the URL itself is an image, return it directly
    if (contentType.startsWith("image/")) {
      return NextResponse.json({ image: url, title: new URL(url).hostname, description: "", siteName: new URL(url).hostname });
    }

    const html = await res.text();

    function getMeta(property: string): string {
      const patterns = [
        new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`, "i"),
        new RegExp(`<meta[^>]+name=["']twitter:${property}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:${property}["']`, "i"),
      ];
      for (const re of patterns) {
        const m = html.match(re);
        if (m?.[1]) return m[1].trim();
      }
      return "";
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    const image       = getMeta("image") || getMeta("image:src");
    const title       = getMeta("title") || titleMatch?.[1]?.trim() || new URL(url).hostname;
    const description = getMeta("description");
    const siteName    = getMeta("site_name") || new URL(url).hostname;

    return NextResponse.json({ image, title, description, siteName, url });
  } catch {
    return NextResponse.json({ error: "Failed to fetch preview" }, { status: 502 });
  }
}
