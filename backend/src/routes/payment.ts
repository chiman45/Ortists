import crypto from "crypto";
import Razorpay from "razorpay";
import { Router, Request, Response, NextFunction } from "express";

const router = Router();

const razorpay = new Razorpay({
  key_id:     process.env.Live_API_Key!,
  key_secret: process.env.Live_API_Secret!,
});

// ── POST /api/payment/create-order ────────────────────────────────
router.post("/create-order", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, currency = "INR", receipt } = req.body as {
      amount: number;
      currency?: string;
      receipt?: string;
    };

    if (!amount || typeof amount !== "number" || amount < 100) {
      res.status(400).json({ error: "Amount must be a number ≥ 100 paise (₹1)" });
      return;
    }

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: receipt ?? `rcpt_${Date.now()}`,
    });

    res.json({
      order_id: order.id,
      amount:   order.amount,
      currency: order.currency,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/payment/verify ──────────────────────────────────────
router.post("/verify", (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const body     = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac("sha256", process.env.Live_API_Secret!)
    .update(body)
    .digest("hex");

  if (expected !== razorpay_signature) {
    console.warn("[payment/verify] Signature mismatch for order", razorpay_order_id);
    res.status(400).json({ error: "Payment signature verification failed" });
    return;
  }

  // TODO: persist order to DB here (orders table)
  console.log(`[payment/verify] ✅ Payment verified — order: ${razorpay_order_id}, payment: ${razorpay_payment_id}`);
  res.json({ ok: true, payment_id: razorpay_payment_id });
});

// ── POST /api/payment/webhook ─────────────────────────────────────
// Razorpay sends raw body; must NOT be parsed by express.json() before this.
// Register this route BEFORE the global json middleware in index.ts using express.raw().
router.post(
  "/webhook",
  (req: Request, res: Response) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      // Webhook secret not configured yet — acknowledge and skip verification
      console.warn("[payment/webhook] RAZORPAY_WEBHOOK_SECRET not set, skipping verification");
      res.json({ ok: true });
      return;
    }

    const signature = req.headers["x-razorpay-signature"] as string;
    const rawBody   = (req as Request & { rawBody?: Buffer }).rawBody;

    if (!rawBody || !signature) {
      res.status(400).json({ error: "Missing body or signature" });
      return;
    }

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expected !== signature) {
      console.warn("[payment/webhook] Invalid webhook signature");
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    const event = req.body as { event: string; payload: Record<string, unknown> };
    console.log(`[payment/webhook] event=${event.event}`);

    switch (event.event) {
      case "payment.captured":
        // TODO: mark order as paid in DB
        break;
      case "payment.failed":
        // TODO: mark order as failed in DB
        break;
      case "refund.created":
        // TODO: handle refund
        break;
    }

    res.json({ ok: true });
  },
);

export default router;
