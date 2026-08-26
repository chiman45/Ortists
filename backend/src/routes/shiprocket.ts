import { Router, Request, Response, NextFunction } from "express";
import { requireAuth }         from "@clerk/express";
import { createOrder, trackByShipmentId, trackByAwb, ShiprocketOrderInput } from "../lib/shiprocket";

const router = Router();

// All Shiprocket routes require a signed-in user
router.use(requireAuth());

// POST /api/shiprocket/create-order
router.post("/create-order", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body as ShiprocketOrderInput;

    // Basic required-field guard
    if (!input.order_id || !input.order_items?.length || !input.billing_phone) {
      res.status(400).json({ error: "Missing required order fields" });
      return;
    }

    const result = await createOrder(input);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/shiprocket/track/shipment/:id
router.get("/track/shipment/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await trackByShipmentId(String(req.params.id));
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/shiprocket/track/awb/:awb
router.get("/track/awb/:awb", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await trackByAwb(req.params.awb);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
