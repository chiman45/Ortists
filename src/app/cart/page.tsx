"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { ArrowRight, Check, Loader2, Plus, ShieldCheck, Truck } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import { buyerPriceAmount, galleryListing } from "@/lib/pricing";
import { firstImage } from "@/lib/imageUrl";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], display: "swap" });

interface Item {
  post_id: string; title: string; image: string; artist_name: string; price_paise: number;
  dimensions: string | null; medium: string | null; seller_clerk_id: string;
  unavailable: string | null;
}

/** A for-sale artwork the buyer could add next. */
interface Suggestion { id: string; title: string; image: string; artist: string; artistId: string; rupees: number }

interface FeedPost {
  id: string; user_id: string; title: string; author_name: string; image_url: string;
  description: string | null; category: string | null;
}

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function CartPage() {
  const { user } = useUser();
  const router = useRouter();
  const [items, setItems]       = useState<Item[] | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [forSale, setForSale]   = useState<Suggestion[]>([]);
  const [adding, setAdding]     = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    try {
      const r = await fetch("/api/cart");
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Could not load your cart.");
      setItems(d.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your cart.");
      setItems(prev => prev ?? []);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(loadCart, 0);
    return () => clearTimeout(t);
  }, [user, loadCart]);

  // Artworks that can be added straight from this page
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/posts?limit=100&offset=0")
      .then(r => r.json())
      .then(({ posts }: { posts?: FeedPost[] }) => {
        if (cancelled) return;
        const list: Suggestion[] = [];
        for (const p of posts ?? []) {
          const price = galleryListing(p)?.price ?? null;
          const amount = buyerPriceAmount(price);
          // Rupee-priced listings from other artists only
          if (!amount || !price || !/^\s*(₹|rs\.?|inr)?\s*\d/i.test(price) || p.user_id === user.id) continue;
          list.push({ id: p.id, title: p.title || "Untitled", image: firstImage(p.image_url), artist: p.author_name, artistId: p.user_id, rupees: amount });
        }
        setForSale(list);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  async function remove(postId: string) {
    setRemoving(postId); setError(null);
    const res = await fetch(`/api/cart?postId=${postId}`, { method: "DELETE" }).catch(() => null);
    setRemoving(null);
    if (!res?.ok) { setError("Could not remove this artwork. Please try again."); return; }
    setItems(prev => (prev ?? []).filter(i => i.post_id !== postId));
    window.dispatchEvent(new Event("ortists:cart-changed"));
  }

  async function add(postId: string) {
    setAdding(postId); setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? "Could not add this artwork.");
      await loadCart();
      window.dispatchEvent(new Event("ortists:cart-changed"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add this artwork.");
    } finally {
      setAdding(null);
    }
  }

  const buyable  = (items ?? []).filter(i => !i.unavailable);
  const subtotal = buyable.reduce((s, i) => s + i.price_paise, 0);

  // Not already in the cart; works by the same artists come first
  const suggestions = useMemo(() => {
    const inCart  = new Set((items ?? []).map(i => i.post_id));
    const artists = new Set((items ?? []).map(i => i.seller_clerk_id));
    return forSale
      .filter(s => !inCart.has(s.id))
      .sort((a, b) => Number(artists.has(b.artistId)) - Number(artists.has(a.artistId)))
      .slice(0, 8);
  }, [forSale, items]);

  if (!user) return null;

  const empty = items?.length === 0;

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen min-w-0">
        <MainHeader />

        <main className="flex-1 pb-28 lg:pb-12">
          <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10">

            {/* Heading */}
            <div className="flex items-end justify-between gap-4 pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-1.5" style={{ color: "#9B7CF5" }}>Your selection</p>
                <h1 className={`${playfair.className} text-3xl md:text-4xl font-semibold`} style={{ color: "var(--text-1)", letterSpacing: "-0.01em" }}>
                  Cart
                  {!!items?.length && (
                    <span className="text-base md:text-lg font-normal ml-3 align-middle" style={{ color: "var(--text-5)", fontFamily: "inherit" }}>
                      {items.length} {items.length === 1 ? "artwork" : "artworks"}
                    </span>
                  )}
                </h1>
              </div>
              <Link href="/gallery" className="flex items-center gap-1.5 text-sm font-semibold shrink-0 pb-1 transition-opacity hover:opacity-75" style={{ color: "#9B7CF5" }}>
                <Plus size={15} /> Add more artworks
              </Link>
            </div>

            {error && (
              <p role="alert" className="text-sm rounded-xl px-4 py-3 mt-5"
                style={{ color: "#EF4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                {error}
              </p>
            )}

            {/* Loading */}
            {items === null && (
              <div className="flex flex-col gap-4 mt-6">
                {[1, 2].map(i => <div key={i} className="skeleton-shimmer rounded-2xl" style={{ height: 132, background: "var(--bg-card)" }} />)}
              </div>
            )}

            {/* Empty */}
            {empty && (
              <div className="py-16 md:py-20 text-center">
                <h2 className={`${playfair.className} text-2xl font-semibold mb-2`} style={{ color: "var(--text-1)" }}>Nothing here yet</h2>
                <p className="text-sm mb-7" style={{ color: "var(--text-4)" }}>
                  Find an original you love and add it. It will wait here until you are ready.
                </p>
                <Link href="/gallery" className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold transition-opacity hover:opacity-90"
                  style={{ background: "var(--buy-bg)", color: "var(--buy-text)" }}>
                  Browse the gallery <ArrowRight size={15} />
                </Link>
              </div>
            )}

            {/* Items + summary */}
            {!!items?.length && (
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 lg:gap-12 items-start">
                <ul className="flex flex-col">
                  {items.map(i => (
                    <li key={i.post_id} className="flex gap-4 md:gap-6 py-6" style={{ borderBottom: "1px solid var(--border)", opacity: i.unavailable ? 0.55 : 1 }}>
                      <Link href={`/feed/${i.post_id}`} className="shrink-0 block overflow-hidden rounded-lg"
                        style={{ background: "var(--bg-subtle)", boxShadow: "0 8px 28px var(--shadow)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={i.image} alt={i.title} className="block object-cover w-24 h-28 md:w-36 md:h-44 transition-transform duration-500 hover:scale-105" />
                      </Link>

                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link href={`/feed/${i.post_id}`} className={`${playfair.className} block text-lg md:text-xl font-semibold capitalize truncate transition-opacity hover:opacity-80`}
                              style={{ color: "var(--text-1)" }}>
                              {i.title}
                            </Link>
                            {i.artist_name && <p className="text-sm mt-0.5" style={{ color: "var(--text-4)" }}>{i.artist_name}</p>}
                          </div>
                          {!i.unavailable && (
                            <p className="text-base md:text-lg font-bold shrink-0" style={{ color: "var(--text-1)" }}>{rupees(i.price_paise)}</p>
                          )}
                        </div>

                        {(i.medium || i.dimensions) && (
                          <p className="text-xs mt-2" style={{ color: "var(--text-5)" }}>
                            {[i.medium, i.dimensions].filter(Boolean).join("  ·  ")}
                          </p>
                        )}

                        {i.unavailable
                          ? <p className="text-xs mt-2 font-medium" style={{ color: "#f59e0b" }}>{i.unavailable}</p>
                          : <p className="hidden md:flex items-center gap-1.5 text-xs mt-2" style={{ color: "var(--text-5)" }}>
                              <Truck size={13} /> Original artwork, packed and shipped by the artist
                            </p>}

                        <div className="mt-auto pt-3">
                          <button onClick={() => remove(i.post_id)} disabled={removing === i.post_id}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold underline underline-offset-4 py-2 transition-opacity hover:opacity-70 disabled:opacity-50"
                            style={{ color: "var(--text-4)" }}>
                            {removing === i.post_id && <Loader2 size={12} className="animate-spin" />}
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Summary */}
                <aside className="rounded-2xl p-6 lg:sticky lg:top-24 mt-2 lg:mt-6"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", boxShadow: "0 4px 24px var(--shadow)" }}>
                  <h2 className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-5" style={{ color: "var(--text-4)" }}>Order summary</h2>

                  <div className="flex justify-between text-sm mb-3">
                    <span style={{ color: "var(--text-3)" }}>{buyable.length} {buyable.length === 1 ? "artwork" : "artworks"}</span>
                    <span style={{ color: "var(--text-2)" }}>{rupees(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-5">
                    <span style={{ color: "var(--text-3)" }}>Delivery</span>
                    <span style={{ color: "var(--text-5)" }}>Added at checkout</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-5 mb-6" style={{ borderTop: "1px solid var(--border)" }}>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Subtotal</span>
                    <span className={`${playfair.className} text-2xl font-semibold`} style={{ color: "var(--text-1)" }}>{rupees(subtotal)}</span>
                  </div>

                  <button onClick={() => router.push("/checkout")} disabled={!buyable.length}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "var(--buy-bg)", color: "var(--buy-text)" }}>
                    Proceed to buy <ArrowRight size={15} />
                  </button>

                  <p className="flex items-start gap-2 text-xs mt-5 leading-relaxed" style={{ color: "var(--text-5)" }}>
                    <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                    We confirm delivery to your pincode before you pay. Payments are secured by Razorpay.
                  </p>
                </aside>
              </div>
            )}

            {/* Add more, right from the cart */}
            {items !== null && suggestions.length > 0 && (
              <section className="mt-12 md:mt-16" aria-labelledby="add-more">
                <div className="flex items-end justify-between gap-4 mb-5">
                  <h2 id="add-more" className={`${playfair.className} text-xl md:text-2xl font-semibold`} style={{ color: "var(--text-1)" }}>
                    {empty ? "Available now" : "Add to your collection"}
                  </h2>
                  <Link href="/gallery" className="text-sm font-semibold shrink-0 transition-opacity hover:opacity-75" style={{ color: "#9B7CF5" }}>
                    View all
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-7 md:gap-x-6">
                  {suggestions.map(s => (
                    <div key={s.id} className="flex flex-col min-w-0">
                      <Link href={`/feed/${s.id}`} className="block overflow-hidden rounded-lg" style={{ background: "var(--bg-subtle)", aspectRatio: "4 / 5" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.image} alt={s.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                      </Link>
                      <p className="text-sm font-semibold capitalize truncate mt-3" style={{ color: "var(--text-1)" }}>{s.title}</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-5)" }}>{s.artist}</p>
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <span className="text-sm font-bold" style={{ color: "var(--text-2)" }}>₹{s.rupees.toLocaleString("en-IN")}</span>
                        <button onClick={() => add(s.id)} disabled={adding !== null} aria-label={`Add ${s.title} to cart`}
                          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
                          style={{ color: "var(--buy-bg)", border: "1px solid var(--buy-bg)" }}>
                          {adding === s.id ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {items !== null && !empty && suggestions.length === 0 && forSale.length > 0 && (
              <p className="flex items-center gap-2 text-sm mt-10" style={{ color: "var(--text-5)" }}>
                <Check size={15} /> Every artwork on sale right now is already in your cart.
              </p>
            )}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
