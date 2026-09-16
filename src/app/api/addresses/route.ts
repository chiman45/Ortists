import { adminDb }      from "@/utils/supabase/admin";
import { auth }          from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/addresses — list all addresses for the logged-in user
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await adminDb
    .from("address_book")
    .select("*")
    .eq("clerk_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ addresses: data ?? [] });
}

// POST /api/addresses — add a new address
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { label, name, phone, address_line, city, state, pincode, country, is_default } = body;

  if (!name || !phone || !address_line || !city || !state || !pincode) {
    return NextResponse.json({ error: "All address fields are required" }, { status: 400 });
  }

  // If setting as default, unset all others first
  if (is_default) {
    await adminDb
      .from("address_book")
      .update({ is_default: false })
      .eq("clerk_id", userId);
  }

  // If this is the first address, make it default automatically
  const { count } = await adminDb
    .from("address_book")
    .select("*", { count: "exact", head: true })
    .eq("clerk_id", userId);

  const shouldBeDefault = is_default || count === 0;

  const { data, error } = await adminDb
    .from("address_book")
    .insert({
      clerk_id: userId,
      label:    label ?? "Home",
      name, phone, address_line, city, state, pincode,
      country:    country ?? "India",
      is_default: shouldBeDefault,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ address: data });
}
