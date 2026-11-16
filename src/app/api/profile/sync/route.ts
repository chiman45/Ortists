import { adminDb } from "@/utils/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

// POST /api/profile/sync — create or sync basic clerk data
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const me = await requireUser(body.clerk_id);
  if (me.error) return me.error;
  const clerk_id = me.userId;
  const { display_name, username, avatar_url, phone, role, agreement_version, agreements_accepted_at } = body;
  // Consent recorded at sign-up (only trusted shapes are stored)
  const consent = (role === "artist" || role === "client") && typeof agreement_version === "string"
    ? { role, agreement_version, agreements_accepted_at: agreements_accepted_at ?? new Date().toISOString() }
    : null;

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
    .select("clerk_id, phone, agreement_version")
    .eq("clerk_id", clerk_id)
    .maybeSingle();

  if (existing) {
    // Don't overwrite display_name, username, avatar_url — the user manages
    // those via Edit Profile. Only backfill a missing phone.
    if (safePhone && !existing.phone) {
      await adminDb.from("profiles").update({ phone: safePhone }).eq("clerk_id", clerk_id);
    }
    if (consent && !existing.agreement_version) {
      await adminDb.from("profiles").update(consent).eq("clerk_id", clerk_id);
    }
  } else {
    // First time: seed all fields from Clerk
    await adminDb
      .from("profiles")
      .insert({ clerk_id, display_name, username, avatar_url, phone: safePhone, ...(consent ?? {}) });
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
  const body = await req.json().catch(() => ({}));
  const { clerk_id: claimed, ...updates } = body;
  const me = await requireUser(claimed);
  if (me.error) return me.error;
  const clerk_id = me.userId;

  // Server-managed columns can't be set from the client
  for (const k of ["id", "created_at", "updated_at", "followers_count", "following_count"]) delete updates[k];

  // Stray spaces in a handle or name break profile links ("/u/Designer" ≠ "Designer ")
  for (const k of ["username", "display_name"]) {
    if (typeof updates[k] === "string") updates[k] = updates[k].trim() || null;
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
