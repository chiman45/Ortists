import { adminDb }      from "@/utils/supabase/admin";
import { auth }          from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/addresses/[id] — update an address or set as default
export async function PATCH(req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await req.json();

  // If setting as default, clear others first
  if (body.is_default) {
    await adminDb
      .from("address_book")
      .update({ is_default: false })
      .eq("clerk_id", userId);
  }

  const { data, error } = await adminDb
    .from("address_book")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("clerk_id", userId) // safety: can only edit own addresses
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ address: data });
}

// DELETE /api/addresses/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { error } = await adminDb
    .from("address_book")
    .delete()
    .eq("id", id)
    .eq("clerk_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If deleted address was default, make the most recent one default
  const { data: remaining } = await adminDb
    .from("address_book")
    .select("id")
    .eq("clerk_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (remaining?.[0]) {
    await adminDb
      .from("address_book")
      .update({ is_default: true })
      .eq("id", remaining[0].id);
  }

  return NextResponse.json({ ok: true });
}
