import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { getRates }                  from "@/lib/shiprocket";

// GET /api/shiprocket/rates?pickup=492001&delivery=400001&weight=0.5
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const pickup   = searchParams.get("pickup");
  const delivery = searchParams.get("delivery");
  const weight   = parseFloat(searchParams.get("weight") ?? "0.5");

  if (!pickup || !delivery) {
    return NextResponse.json({ error: "pickup and delivery pincodes are required" }, { status: 400 });
  }

  try {
    const rates = await getRates({ pickup_postcode: pickup, delivery_postcode: delivery, weight });
    return NextResponse.json({ rates });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rate check failed";
    console.error("[shiprocket/rates]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
