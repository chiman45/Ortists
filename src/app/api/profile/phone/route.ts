import { adminDb } from "@/utils/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import { NextRequest, NextResponse } from "next/server";

// GET /api/profile/phone?phone= → { available, phone }
// Public (no session yet during sign-up); only says whether a number is taken.
export async function GET(req: NextRequest) {
  const raw = new URL(req.url).searchParams.get("phone") ?? "";
  const { phone, valid } = normalizePhone(raw);
  if (!valid) return NextResponse.json({ available: false, error: "Enter a valid phone number (10–15 digits)." }, { status: 400 });

  const { data } = await adminDb.from("profiles").select("clerk_id").eq("phone", phone).maybeSingle();
  return NextResponse.json({ available: !data, phone });
}
