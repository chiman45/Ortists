import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// POST /api/profile/sync — create or sync basic clerk data
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clerk_id, display_name, username, avatar_url } = body;

  if (!clerk_id) {
    return NextResponse.json({ error: "clerk_id required" }, { status: 400 });
  }

  const { data: existing } = await adminDb
    .from("profiles")
    .select("clerk_id")
    .eq("clerk_id", clerk_id)
    .maybeSingle();

  if (existing) {
    // Don't overwrite anything — display_name, username, avatar_url
    // are all managed by the user via the Edit Profile modal
  } else {
    // First time: seed all fields from Clerk
    await adminDb
      .from("profiles")
      .insert({ clerk_id, display_name, username, avatar_url });
  }

  const { data: profile } = await adminDb
    .from("profiles")
    .select("*")
    .eq("clerk_id", clerk_id)
    .single();

  return NextResponse.json({ ok: true, profile });
}

// PATCH /api/profile/sync — update editable profile fields
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { clerk_id, ...updates } = body;

  if (!clerk_id) {
    return NextResponse.json({ error: "clerk_id required" }, { status: 400 });
  }

  const { data: profile, error } = await adminDb
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("clerk_id", clerk_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profile });
}
