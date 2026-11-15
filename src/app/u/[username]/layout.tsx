import type { Metadata } from "next";
import { adminDb } from "@/utils/supabase/admin";

// Preview card for shared profile links (WhatsApp, LinkedIn, X…):
// shows the artist's name, bio and photo instead of a bare URL.
export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> },
): Promise<Metadata> {
  const { username: raw } = await params;
  const username = decodeURIComponent(raw).replace(/^@+/, "");

  const { data: profile } = await adminDb
    .from("profiles")
    .select("display_name, username, bio, avatar_url, tag")
    .or(`username.eq.${username},clerk_id.eq.${username}`)
    .maybeSingle();

  if (!profile) return { title: "Artist on Ortists" };

  const name = profile.display_name || profile.username || "Artist";
  const title = `${name} (@${profile.username ?? username}) · Ortists`;
  const description = profile.bio?.slice(0, 160)
    || `${profile.tag ?? "Artist"} on Ortists — see their work, follow and hire them.`;
  const images = profile.avatar_url ? [{ url: profile.avatar_url, alt: name }] : undefined;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile", siteName: "Ortists", images },
    twitter: { card: "summary", title, description, images: images?.map(i => i.url) },
  };
}

export default function ArtistProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
