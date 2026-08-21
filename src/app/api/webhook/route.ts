import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

// Razorpay sends the raw JSON body — we must read it as text for HMAC verification.
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("[webhook] RAZORPAY_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody  = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (expected !== signature) {
    console.warn("[webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    payload: {
      payment?: { entity: { id: string; order_id: string; amount: number; status: string } };
    };
  };

  console.log(`[webhook] event=${event.event}`);

  switch (event.event) {
    case "payment.captured": {
      const p = event.payload.payment?.entity;
      if (p) {
        console.log(`[webhook] Payment captured — payment_id=${p.id}, order_id=${p.order_id}, amount=${p.amount}`);
        // TODO: save confirmed order to DB (e.g. INSERT INTO orders ...)
      }
      break;
    }
    case "payment.failed": {
      const p = event.payload.payment?.entity;
      if (p) console.log(`[webhook] Payment failed — order_id=${p.order_id}`);
      break;
    }
    case "refund.created":
      console.log("[webhook] Refund created");
      break;
  }

  return NextResponse.json({ ok: true });
}
