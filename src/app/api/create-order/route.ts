import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = "INR", receipt } = await req.json() as {
      amount: number;
      currency?: string;
      receipt?: string;
    };

    if (!amount || typeof amount !== "number" || amount < 100) {
      return NextResponse.json({ error: "Amount must be ≥ 100 paise (₹1)" }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: receipt ?? `rcpt_${Date.now()}`,
    });

    return NextResponse.json({
      order_id: order.id,
      amount:   order.amount,
      currency: order.currency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Order creation failed";
    console.error("[create-order]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
