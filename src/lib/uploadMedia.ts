import { createClient } from "@/utils/supabase/client";

/**
 * Upload a file straight from the browser to a public Supabase bucket via a
 * signed upload URL (see /api/upload/sign). Throws an Error with a readable
 * message on any failure, so callers can show it to the user.
 */
const MAX_EDGE   = 2560;              // px — still sharp on retina screens
const SHRINK_IF  = 1.5 * 1024 * 1024; // only touch photos bigger than 1.5 MB

/**
 * Phone photos are often 4–12 MB. Served full size, they made the feed slow
 * and timed out the image optimizer, so big photos are resized to at most
 * 2560px and re-encoded as JPEG before upload. Anything that can't be safely
 * re-encoded (GIF, SVG, video, decode failure) is uploaded untouched.
 */
async function shrinkImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) || file.size <= SHRINK_IF) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff"; // transparent PNG areas would turn black in JPEG
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/jpeg", 0.88));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export async function uploadMedia(original: File, bucket = "post-media"): Promise<string> {
  const file = await shrinkImage(original);
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
