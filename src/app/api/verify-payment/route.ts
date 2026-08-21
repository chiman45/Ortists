import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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

    return NextResponse.json({ ok: true, payment_id: razorpay_payment_id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    console.error("[verify-payment]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
