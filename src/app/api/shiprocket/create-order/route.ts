import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { createOrder, ShiprocketOrderInput } from "@/lib/shiprocket";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const input = await req.json() as ShiprocketOrderInput;

    if (!input.order_id || !input.order_items?.length || !input.billing_phone) {
      return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
    }

    const result = await createOrder(input);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Shiprocket order failed";
    console.error("[shiprocket/create-order]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
