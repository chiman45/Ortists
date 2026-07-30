import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// Buckets that should never be publicly accessible.
// Files here are served via signed URLs only (/api/signed-url).
const PRIVATE_BUCKETS = new Set(["message-media", "deliverables"]);

// Cache-Control per bucket
const CACHE_CONTROL: Record<string, string> = {
  avatars:       "public, max-age=86400",   // 1 day
  "post-media":  "public, max-age=3600",    // 1 hour
  artwork:       "public, max-age=3600",    // legacy alias
  "message-media": "private, no-store",
  deliverables:  "private, no-store",
};

// POST /api/upload — accepts multipart/form-data with "file" field
// Optional: "bucket" field (defaults to "artwork")
export async function POST(req: NextRequest) {
  const form   = await req.formData();
  const file   = form.get("file") as File | null;
  const bucket = (form.get("bucket") as string | null) ?? "artwork";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext  = file.name.split(".").pop() ?? "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer      = Buffer.from(arrayBuffer);

  const isPrivate = PRIVATE_BUCKETS.has(bucket);

  // Ensure bucket exists with correct public/private setting
  await adminDb.storage
    .createBucket(bucket, { public: !isPrivate })
    .catch(() => {});

  const { error } = await adminDb.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType:  file.type || "application/octet-stream",
      cacheControl: CACHE_CONTROL[bucket] ?? "public, max-age=3600",
      upsert:       false,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (isPrivate) {
    // Return the storage path, not a public URL.
    // Callers must use /api/signed-url?path=...&bucket=... to get a time-limited URL.
    return NextResponse.json({
      path,
      bucket,
      name: file.name,
      size: file.size,
      type: file.type,
      private: true,
    });
  }

  const { data } = adminDb.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({
    url:  data.publicUrl,
    path,
    bucket,
    name: file.name,
    size: file.size,
    type: file.type,
  });
}
