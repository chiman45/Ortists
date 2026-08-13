import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/hire-requests/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await adminDb
    .from("hire_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ request: data });
}

// PATCH /api/hire-requests/[id]
// Artist: { artistId, status: "accepted" | "declined" }
// Client: { clientId, status?: "completed", progress?: number, phase?: string, milestones?: array }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const { data: hr } = await adminDb
    .from("hire_requests")
    .select("client_id, artist_id, artist_clerk_id")
    .eq("id", id)
    .single();

  if (!hr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Artist action — supports both numeric artistId and string artistClerkId
  if (body.artistId !== undefined || body.artistClerkId !== undefined) {
    const isArtist = body.artistClerkId
      ? hr.artist_clerk_id === body.artistClerkId
      : String(hr.artist_id) === String(body.artistId);
    if (!isArtist) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const allowed = ["accepted", "declined", "completed"];
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const artistPatch: Record<string, unknown> = { status: body.status, updated_at: now };
    if (body.status === "accepted")  artistPatch.accepted_at  = now;
    if (body.status === "completed") artistPatch.completed_at = now;

    const { data, error } = await adminDb
      .from("hire_requests")
      .update(artistPatch)
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // When accepting, ensure conversation exists and participant_ids uses real Clerk IDs
    if (body.status === "accepted") {
      const artistClerkId = body.artistClerkId ?? hr.artist_clerk_id;
      if (artistClerkId) {
        if (data.conversation_id) {
          // Fix participant_ids — replace any "artist:N" placeholder with actual Clerk ID
          const { data: conv } = await adminDb
            .from("conversations")
            .select("participant_ids")
            .eq("id", data.conversation_id)
            .single();
          if (conv) {
            const fixed = (conv.participant_ids as string[]).map((pid: string) =>
              pid.startsWith("artist:") ? artistClerkId : pid
            );
            await adminDb
              .from("conversations")
              .update({ participant_ids: fixed })
              .eq("id", data.conversation_id);
          }
        } else {
          // No conversation yet — create one now
          const { data: newConv } = await adminDb
            .from("conversations")
            .insert({ participant_ids: [hr.client_id, artistClerkId] })
            .select()
            .single();
          if (newConv) {
            await adminDb
              .from("hire_requests")
              .update({ conversation_id: newConv.id })
              .eq("id", id);
            data.conversation_id = newConv.id;
          }
        }
      }
    }

    // Notify the client about the accept/decline
    const verb = body.status === "accepted" ? "accepted" : "declined";
    try {
      await adminDb.from("notifications").insert({
        user_id:  hr.client_id,
        type:     "commission",
        text:     `Your commission request was ${verb}`,
        sub_text: data?.project_title ?? null,
        post_id:  id,
      });
    } catch {}

    return NextResponse.json({ request: data });
  }

  // Client action
  if (body.clientId !== undefined) {
    if (hr.client_id !== body.clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const now2 = new Date().toISOString();
    const patch: Record<string, unknown> = { updated_at: now2 };
    if (body.status === "completed") { patch.status = "completed"; patch.completed_at = now2; }
    if (typeof body.progress === "number") patch.progress = body.progress;
    if (body.phase) patch.phase = body.phase;
    if (body.milestones) patch.milestones = body.milestones;

    const { data, error } = await adminDb
      .from("hire_requests")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ request: data });
  }

  return NextResponse.json({ error: "Must provide clientId or artistId" }, { status: 400 });
}

// DELETE /api/hire-requests/[id]
// Body: { clientId: string } | { artistClerkId: string }
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const { data: hr } = await adminDb
    .from("hire_requests")
    .select("client_id, artist_clerk_id")
    .eq("id", id)
    .single();

  if (!hr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isClient = body.clientId && hr.client_id === body.clientId;
  const isArtist = body.artistClerkId && hr.artist_clerk_id === body.artistClerkId;

  if (!isClient && !isArtist) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await adminDb.from("hire_requests").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
