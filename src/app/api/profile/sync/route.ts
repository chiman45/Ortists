import { adminDb } from "@/utils/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import { NextRequest, NextResponse } from "next/server";

// POST /api/profile/sync — create or sync basic clerk data
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clerk_id, display_name, username, avatar_url, phone } = body;

  if (!clerk_id) {
    return NextResponse.json({ error: "clerk_id required" }, { status: 400 });
  }

  // Phone entered on the sign-up form (Clerk unsafeMetadata). Only apply it if
  // it's valid and not already linked to another account — otherwise seed the
  // profile without it and let PhoneGate ask again, so sign-up never fails.
  let safePhone: string | null = null;
  if (typeof phone === "string" && phone) {
    const { phone: normalized, valid } = normalizePhone(phone);
    if (valid) {
      const { data: taken } = await adminDb
        .from("profiles").select("clerk_id").eq("phone", normalized).neq("clerk_id", clerk_id).maybeSingle();
      if (!taken) safePhone = normalized;
    }
  }

  const { data: existing } = await adminDb
    .from("profiles")
    .select("clerk_id, phone")
    .eq("clerk_id", clerk_id)
    .maybeSingle();

  if (existing) {
    // Don't overwrite display_name, username, avatar_url — the user manages
    // those via Edit Profile. Only backfill a missing phone.
    if (safePhone && !existing.phone) {
      await adminDb.from("profiles").update({ phone: safePhone }).eq("clerk_id", clerk_id);
    }
  } else {
    // First time: seed all fields from Clerk
    await adminDb
      .from("profiles")
      .insert({ clerk_id, display_name, username, avatar_url, phone: safePhone });
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

  // Phone numbers are unique per account (see migration 014). Normalise to
  // digits with an optional leading "+" so "98765 43210" and "9876543210" can't
  // both register, and reject anything that isn't a plausible number.
  if (typeof updates.phone === "string") {
    const phone = updates.phone.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) {
      return NextResponse.json({ error: "Enter a valid phone number (10–15 digits)." }, { status: 400 });
    }
    const { data: taken } = await adminDb
      .from("profiles")
      .select("clerk_id")
      .eq("phone", phone)
      .neq("clerk_id", clerk_id)
      .maybeSingle();
    if (taken) {
      return NextResponse.json({ error: "This phone number is already linked to another account." }, { status: 409 });
    }
    updates.phone = phone;
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
