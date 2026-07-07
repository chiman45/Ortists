import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/hire-requests?clientId= | ?artistId=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const artistId = searchParams.get("artistId");

  if (clientId) {
    const { data } = await adminDb
      .from("hire_requests")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    return NextResponse.json({ requests: data ?? [] });
  }

  if (artistId) {
    const { data } = await adminDb
      .from("hire_requests")
      .select("*")
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false });
    return NextResponse.json({ requests: data ?? [] });
  }

  return NextResponse.json({ requests: [] });
}

// POST /api/hire-requests — create a hire request
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await adminDb
    .from("hire_requests")
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ request: data });
}
