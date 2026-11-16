import { redirect } from "next/navigation";

// Gallery works are real posts now — their detail view (buy, rate, share)
// lives at /feed/[id]. Old /gallery/[id] links are forwarded there.
export default async function GalleryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/feed/${id}`);
}
