import { adminDb } from "@/utils/supabase/admin";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Public buckets the browser may upload into directly.
const ALLOWED = new Set(["post-media", "avatars", "artwork"]);

/**
 * POST /api/upload/sign  { bucket, name }
 * Returns a one-time signed upload URL so the browser uploads straight to
 * Supabase Storage. Large phone photos never pass through our server, so
 * they can't hit the 10 MB proxy body limit that made /api/upload fail.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const { bucket = "post-media", name = "" } = await req.json().catch(() => ({}));
  if (!ALLOWED.has(bucket)) return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });

  const ext  = (String(name).split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  await adminDb.storage.createBucket(bucket, { public: true }).catch(() => {});

  const { data, error } = await adminDb.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: error?.message ?? "Could not start upload" }, { status: 500 });

  const { data: pub } = adminDb.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ path: data.path, token: data.token, url: pub.publicUrl });
}
