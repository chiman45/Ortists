import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/hire-requests/[id] — update status (artist accepts/declines)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, artistId } = await req.json();

  const allowed = ["pending", "accepted", "declined", "completed"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Verify requester is the artist on this request
  const { data: hr } = await adminDb
    .from("hire_requests")
    .select("artist_id")
    .eq("id", id)
    .single();

  if (!hr || hr.artist_id !== artistId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await adminDb
    .from("hire_requests")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ request: data });
}
