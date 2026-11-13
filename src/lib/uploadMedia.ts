import { createClient } from "@/utils/supabase/client";

/**
 * Upload a file straight from the browser to a public Supabase bucket via a
 * signed upload URL (see /api/upload/sign). Throws an Error with a readable
 * message on any failure, so callers can show it to the user.
 */
export async function uploadMedia(file: File, bucket = "post-media"): Promise<string> {
  const signRes = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket, name: file.name }),
  });
  const sign = await signRes.json().catch(() => ({}));
  if (!signRes.ok || !sign.token) throw new Error(sign.error ?? `Upload could not start (${signRes.status}).`);

  const { error } = await createClient()
    .storage.from(bucket)
    .uploadToSignedUrl(sign.path, sign.token, file, {
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
    });
  if (error) throw new Error(`Upload failed for "${file.name}": ${error.message}`);

  return sign.url as string;
}
