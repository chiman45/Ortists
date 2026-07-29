import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// POST /api/upload — accepts multipart/form-data with a "file" field
// Optional form field: "bucket" (defaults to "artwork")
export async function POST(req: NextRequest) {
  const form   = await req.formData();
  const file   = form.get("file") as File | null;
  const bucket = (form.get("bucket") as string | null) ?? "artwork";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext  = file.name.split(".").pop() ?? "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer      = Buffer.from(arrayBuffer);

  // Ensure bucket exists (no-op if already present)
  await adminDb.storage.createBucket(bucket, { public: true }).catch(() => {});

  const { error } = await adminDb.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = adminDb.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, name: file.name, size: file.size, type: file.type });
}
