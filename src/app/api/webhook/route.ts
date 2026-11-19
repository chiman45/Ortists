import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/supabase/admin";

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
        // Backup for when the buyer's browser closes before /api/verify-payment runs
        const { error } = await adminDb
          .from("orders")
          .update({ status: "paid", razorpay_payment_id: p.id })
          .eq("razorpay_order_id", p.order_id)
          .in("status", ["pending", "failed"]);
        if (error) console.error("[webhook] could not mark order paid:", error.message);
      }
      break;
    }
    case "payment.failed": {
      const p = event.payload.payment?.entity;
      if (p) {
        console.log(`[webhook] Payment failed — order_id=${p.order_id}`);
        await adminDb.from("orders").update({ status: "failed" })
          .eq("razorpay_order_id", p.order_id).eq("status", "pending");
      }
      break;
    }
    case "refund.created":
      console.log("[webhook] Refund created");
      break;
  }

  return NextResponse.json({ ok: true });
}
