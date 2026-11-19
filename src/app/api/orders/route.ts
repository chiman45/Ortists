import { adminDb }      from "@/utils/supabase/admin";
import { auth }          from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// GET /api/orders — list orders for the logged-in buyer.
// Orders are created only by /api/checkout/pay, never from the browser.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await adminDb
    .from("orders")
    .select("*")
    .eq("buyer_clerk_id", userId)
    // Unpaid attempts (payment window closed or failed) are not orders
    .not("status", "in", "(pending,failed)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
}
