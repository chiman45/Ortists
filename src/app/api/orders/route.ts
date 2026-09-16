import { adminDb }      from "@/utils/supabase/admin";
import { auth }          from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/orders — list orders for the logged-in buyer
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await adminDb
    .from("orders")
    .select("*")
    .eq("buyer_clerk_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
}

// POST /api/orders — create a new order record (called after Razorpay payment)
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      razorpay_order_id, razorpay_payment_id,
      seller_clerk_id, post_id, item_title, amount_paise,
      shipping_name, shipping_phone, shipping_email,
      shipping_address, shipping_city, shipping_state,
      shipping_pincode, shipping_country,
    } = body;

    const { data, error } = await adminDb
      .from("orders")
      .insert({
        razorpay_order_id,
        razorpay_payment_id,
        buyer_clerk_id: userId,
        seller_clerk_id,
        post_id,
        item_title,
        amount_paise,
        status: "paid",
        shipping_name, shipping_phone, shipping_email,
        shipping_address, shipping_city, shipping_state,
        shipping_pincode,
        shipping_country: shipping_country ?? "India",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ order: data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
