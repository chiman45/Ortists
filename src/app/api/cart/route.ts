import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/supabase/admin";
import { requireUser } from "@/lib/apiAuth";
import { cleanIds, loadItems, MAX_ITEMS } from "@/lib/checkout";

const fail = (message: string, status = 500) => NextResponse.json({ error: message }, { status });

// GET /api/cart — the signed-in buyer's cart, with current prices
export async function GET() {
  const me = await requireUser();
  if (me.error) return me.error;

  const { data, error } = await adminDb
    .from("cart_items")
    .select("post_id")
    .eq("clerk_id", me.userId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[cart]", error.message); return fail("Could not load your cart."); }

  const items = await loadItems(cleanIds((data ?? []).map(r => r.post_id)), me.userId);
  const subtotal = items.filter(i => !i.unavailable).reduce((s, i) => s + i.price_paise, 0);
  return NextResponse.json({ items, count: items.length, subtotal_paise: subtotal });
}

// POST /api/cart { postId } — add an artwork
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (me.error) return me.error;

  const body = await req.json().catch(() => ({}));
  const [postId] = cleanIds([body?.postId]);
  if (!postId) return fail("Unknown artwork.", 400);

  const [item] = await loadItems([postId], me.userId);
  if (item.unavailable) return fail(item.unavailable, 400);

  const { count } = await adminDb
    .from("cart_items").select("*", { count: "exact", head: true }).eq("clerk_id", me.userId);
  if ((count ?? 0) >= MAX_ITEMS) return fail(`Your cart can hold up to ${MAX_ITEMS} artworks.`, 400);

  const { error } = await adminDb
    .from("cart_items")
    .upsert({ clerk_id: me.userId, post_id: postId }, { onConflict: "clerk_id,post_id", ignoreDuplicates: true });
  if (error) { console.error("[cart]", error.message); return fail("Could not add this to your cart."); }

  const { count: after } = await adminDb
    .from("cart_items").select("*", { count: "exact", head: true }).eq("clerk_id", me.userId);
  return NextResponse.json({ ok: true, count: after ?? 0 });
}

// DELETE /api/cart?postId=… — remove one artwork
export async function DELETE(req: NextRequest) {
  const me = await requireUser();
  if (me.error) return me.error;

  const [postId] = cleanIds([req.nextUrl.searchParams.get("postId")]);
  if (!postId) return fail("Unknown artwork.", 400);

  const { error } = await adminDb
    .from("cart_items").delete().eq("clerk_id", me.userId).eq("post_id", postId);
  if (error) { console.error("[cart]", error.message); return fail("Could not remove this from your cart."); }
  return NextResponse.json({ ok: true });
}
