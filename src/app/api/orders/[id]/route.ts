import { adminDb }      from "@/utils/supabase/admin";
import { auth }          from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { trackByShipmentId, trackByAwb } from "@/lib/shiprocket";

type Params = { params: Promise<{ id: string }> };

// GET /api/orders/[id] — order detail + live tracking
export async function GET(_req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: order, error } = await adminDb
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("buyer_clerk_id", userId) // can only view own orders
    .single();

  if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Fetch live tracking if shipment exists
  let tracking = null;
  if (order.awb_code) {
    tracking = await trackByAwb(order.awb_code).catch(() => null);
  } else if (order.shiprocket_shipment_id) {
    tracking = await trackByShipmentId(order.shiprocket_shipment_id).catch(() => null);
  }

  return NextResponse.json({ order, tracking });
}
