import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/signed-url?path=<storage-path>&bucket=<bucket>&userId=<clerkId>&convId=<conversationId>
//
// Returns a signed URL valid for 1 hour.
// For message-media: verifies the requesting user is a participant in convId first.
// For post-media / avatars: no auth check needed (but they're public anyway).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path   = searchParams.get("path");
  const bucket = searchParams.get("bucket") ?? "message-media";
  const userId = searchParams.get("userId");
  const convId = searchParams.get("convId");

  if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

  // For private message-media, verify the user belongs to the conversation
  if (bucket === "message-media") {
    if (!userId || !convId) {
      return NextResponse.json({ error: "userId and convId required for message-media" }, { status: 400 });
    }

    // Check user is a participant in this conversation via hire_requests
    const { data: hr } = await adminDb
      .from("hire_requests")
      .select("id")
      .eq("conversation_id", convId)
      .or(`client_id.eq.${userId},artist_clerk_id.eq.${userId}`)
      .maybeSingle();

    if (!hr) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Generate signed URL — valid for 1 hour (3600 seconds)
  const { data, error } = await adminDb.storage
    .from(bucket)
    .createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? "Failed to sign URL" }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
