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
    .select("client_id, artist_id")
    .eq("id", id)
    .single();

  if (!hr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Artist action
  if (body.artistId !== undefined) {
    if (String(hr.artist_id) !== String(body.artistId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const allowed = ["accepted", "declined"];
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const { data, error } = await adminDb
      .from("hire_requests")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ request: data });
  }

  // Client action
  if (body.clientId !== undefined) {
    if (hr.client_id !== body.clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status === "completed") patch.status = "completed";
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
