import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { buildQuote, checkPincode, CheckoutError, cleanIds, loadItems } from "@/lib/checkout";

// POST /api/checkout/quote { postIds, addressId? }
// Without an address: the artworks and their prices.
// With an address: also checks delivery through Shiprocket and adds delivery charges.
// With { pincode } instead: the same check for an address that is not saved yet.
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (me.error) return me.error;

  const body = await req.json().catch(() => ({}));
  const postIds = cleanIds(body?.postIds);
  if (!postIds.length) return NextResponse.json({ error: "There is nothing to buy." }, { status: 400 });

  try {
    if (typeof body?.pincode === "string" && body.pincode) {
      return NextResponse.json(await checkPincode(me.userId, postIds, body.pincode.trim()));
    }
    if (typeof body?.addressId !== "string" || !body.addressId) {
      const items = await loadItems(postIds, me.userId);
      const subtotal = items.filter(i => !i.unavailable).reduce((s, i) => s + i.price_paise, 0);
      return NextResponse.json({ items, subtotal_paise: subtotal });
    }
    return NextResponse.json(await buildQuote(me.userId, postIds, body.addressId));
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[checkout/quote]", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
