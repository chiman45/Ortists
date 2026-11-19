import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { adminDb } from "@/utils/supabase/admin";

export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (me.error) return me.error;
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json() as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const body     = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      console.warn("[verify-payment] Signature mismatch", razorpay_order_id);
      return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 });
    }

    // Payment is genuine: mark this buyer's order rows as paid
    const { data: paid, error } = await adminDb
      .from("orders")
      .update({ status: "paid", razorpay_payment_id })
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("buyer_clerk_id", me.userId)
      .in("status", ["pending", "failed", "paid"])
      .select("id, post_id");
    if (error || !paid?.length) {
      // Money was taken but the order is not recorded — needs a person to look at it
      console.error("[verify-payment] PAID BUT ORDER NOT UPDATED", razorpay_order_id, razorpay_payment_id, error?.message);
      return NextResponse.json({ ok: true, payment_id: razorpay_payment_id, orders: [], recorded: false });
    }

    // Bought artworks leave the cart
    await adminDb.from("cart_items").delete()
      .eq("clerk_id", me.userId)
      .in("post_id", paid.map(o => o.post_id));

    return NextResponse.json({ ok: true, payment_id: razorpay_payment_id, orders: paid.map(o => o.id), recorded: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    console.error("[verify-payment]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
