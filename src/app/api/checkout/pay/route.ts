import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/supabase/admin";
import { requireUser } from "@/lib/apiAuth";
import { buildQuote, CheckoutError, cleanIds } from "@/lib/checkout";

// POST /api/checkout/pay { postIds, addressId }
// Re-checks price and delivery on the server, records the order as "pending"
// and opens a Razorpay order for exactly that total. The browser never sends an amount.
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (me.error) return me.error;

  const body = await req.json().catch(() => ({}));
  const postIds = cleanIds(body?.postIds);

  try {
    const quote = await buildQuote(me.userId, postIds, String(body?.addressId ?? ""));
    if (!quote.ok) {
      return NextResponse.json(
        { error: "Some artworks can't be delivered to this address. Please review your order.", quote },
        { status: 409 },
      );
    }

    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
    const order = await razorpay.orders.create({
      amount:   quote.total_paise,
      currency: "INR",
      receipt:  `ort_${Date.now()}`,
      notes:    { buyer: me.userId, items: String(quote.items.length) },
    });

    const a = quote.address;
    const { error } = await adminDb.from("orders").insert(quote.items.map(i => ({
      razorpay_order_id: order.id,
      buyer_clerk_id:    me.userId,
      seller_clerk_id:   i.seller_clerk_id,
      post_id:           i.post_id,
      item_title:        i.title,
      item_image:        i.image,
      item_paise:        i.price_paise,
      shipping_paise:    i.shipping_paise,
      amount_paise:      i.price_paise + i.shipping_paise,
      delivery_days:     i.delivery_days,
      status:            "pending",
      shipping_name:     a.name,
      shipping_phone:    a.phone,
      shipping_address:  a.address_line,
      shipping_city:     a.city,
      shipping_state:    a.state,
      shipping_pincode:  a.pincode,
      shipping_country:  a.country ?? "India",
    })));
    if (error) {
      // No order record means we must not take the money
      console.error("[checkout/pay] could not save order:", error.message);
      return NextResponse.json({ error: "Could not start your order. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      order_id: order.id,
      amount:   quote.total_paise,
      currency: "INR",
      name:     a.name,
      phone:    a.phone,
    });
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[checkout/pay]", e);
    return NextResponse.json({ error: "Could not start the payment. Please try again." }, { status: 500 });
  }
}
