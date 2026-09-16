"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import ArtworkCard from "@/components/gallery/ArtworkCard";
import { GalleryListings } from "@/lib/galleryData";
import type { GalleryListing } from "@/lib/types";
import { ArrowLeft, Bookmark, Check, Clock, Heart, Package, Share2, Star, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

// ── Purchase modal ─────────────────────────────────────────────

function PurchaseModal({ item, onClose }: { item: GalleryListing; onClose: () => void }) {
  const router  = useRouter();

  const sym     = "₹";
  const artwork = item.price;
  const fee     = Math.round(artwork * 0.05);

  function goToCheckout() {
    const params = new URLSearchParams({
      listingId: item.id,
      title:     item.title,
      price:     String(item.price),
      image:     item.imageUrl,
      artist:    item.artistName,
      weight:    "0.5",
    });
    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full flex flex-col rounded-2xl overflow-hidden"
        style={{ maxWidth: 480, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.55)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <p className="text-[10px] font-bold tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>ORDER SUMMARY</p>
            <h2 className="text-xl font-bold" style={{ color: "#fff" }}>Review Your Order</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Artwork card */}
          <div className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.title} className="rounded-xl object-cover shrink-0" style={{ width: 72, height: 72 }} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base truncate" style={{ color: "#fff" }}>{item.title}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
                by {item.artistName}{item.artistLocation ? ` · ${item.artistLocation.split(",")[0]}` : ""}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }}>
                  {item.physical ? "Physical" : "Digital"}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#10B981" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" /> Available
                </span>
              </div>
            </div>
            <p className="text-base font-bold shrink-0" style={{ color: "#fff" }}>{sym}{artwork.toLocaleString()}</p>
          </div>

          {/* Price rows */}
          <div className="flex flex-col">
            {[
              { label: "Artwork",          val: `${sym}${artwork.toLocaleString()}` },
              { label: "Platform fee (5%)", val: `${sym}${fee}` },
              ...(item.physical ? [{ label: "Delivery", val: "Calculated at checkout" }] : []),
            ].map(row => (
              <div key={row.label} className="flex justify-between py-3 text-sm" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}>
                <span>{row.label}</span>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>{row.val}</span>
              </div>
            ))}
          </div>

          {item.physical && (
            <p className="text-xs px-3 py-2.5 rounded-xl" style={{ background: "rgba(124,91,245,0.08)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(124,91,245,0.2)" }}>
              Delivery charge and GST will be shown on the next page based on your address.
            </p>
          )}

          <button
            onClick={goToCheckout}
            className="w-full py-4 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-85"
            style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}
          >
            Continue to Checkout →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Public rating ──────────────────────────────────────────────
// Open to any signed-in visitor — not just the artist's followers or
// connections. Average + count are visible to everyone; casting a star
// requires being signed in so one person can't stuff the average.

function ArtworkRating({ artworkId }: { artworkId: string }) {
  const { user } = useUser();
  const [average,    setAverage]    = useState(0);
  const [count,      setCount]      = useState(0);
  const [myRating,   setMyRating]   = useState<number | null>(null);
  const [hover,      setHover]      = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const url = user?.id
      ? `/api/ratings?artworkId=${artworkId}&userId=${user.id}`
      : `/api/ratings?artworkId=${artworkId}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setAverage(d.average ?? 0); setCount(d.count ?? 0); setMyRating(d.myRating ?? null); })
      .catch(() => {});
  }, [artworkId, user?.id]);

  async function rate(n: number) {
    if (!user || submitting) return;
    setSubmitting(true);
    const prev = myRating;
    setMyRating(n);
    try {
      const res = await fetch("/api/ratings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ artworkId, userId: user.id, rating: n }),
      });
      const d = await res.json();
      if (res.ok) { setAverage(d.average ?? 0); setCount(d.count ?? 0); }
      else setMyRating(prev);
    } catch {
      setMyRating(prev);
    }
    setSubmitting(false);
  }

  const shown = hover ?? myRating ?? 0;

  return (
    <div className="p-4 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-xs font-semibold" style={{ color: "var(--text-4)" }}>Community Rating</p>
        <span className="text-xs" style={{ color: "var(--text-5)" }}>
          {count > 0 ? `${average.toFixed(1)} · ${count} rating${count !== 1 ? "s" : ""}` : "No ratings yet"}
        </span>
      </div>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            disabled={!user || submitting}
            onClick={() => rate(n)}
            onMouseEnter={() => setHover(n)}
            className="transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
          >
            <Star size={20} fill={shown >= n ? "#FBBF24" : "none"} color={shown >= n ? "#FBBF24" : "var(--text-5)"} />
          </button>
        ))}
      </div>
      {!user && (
        <p className="text-[11px] mt-1.5" style={{ color: "var(--text-5)" }}>
          <Link href="/login" className="underline hover:opacity-80">Sign in</Link> to rate this artwork — open to everyone.
        </p>
      )}
    </div>
  );
}

export default function GalleryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const item = GalleryListings.find(l => l.id === id) ?? GalleryListings[0];

  const moreFromArtist = GalleryListings.filter(l => l.id !== item.id && l.artistName === item.artistName);
  const similarWorks   = GalleryListings.filter(l => l.id !== item.id && l.category === item.category && l.artistName !== item.artistName);
  const otherWorks     = GalleryListings.filter(l => l.id !== item.id && l.category !== item.category && l.artistName !== item.artistName);

  // Right Pinterest column — as many as possible
  const rightGrid = [...moreFromArtist, ...similarWorks, ...otherWorks].slice(0, 20);
  // Below-post grid
  const belowGrid = [...similarWorks, ...otherWorks, ...moreFromArtist].slice(0, 12);

  const [liked,     setLiked]     = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [following, setFollowing] = useState(false);
  const [buyModal,  setBuyModal]  = useState(false);
  const [shared,    setShared]    = useState(false);

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, text: `${item.title} by ${item.artistName}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // user dismissed the native share sheet — nothing to do
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen min-w-0">
        <MainHeader />

        <main className="flex-1 pb-24 lg:pb-8">

          {/* Back link */}
          <div className="px-4 md:px-6 pt-5 pb-0">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 text-sm mb-2 transition-opacity hover:opacity-70"
              style={{ color: "var(--text-4)" }}
            >
              <ArrowLeft size={15} /> Back to Gallery
            </Link>
          </div>

          {/* ── Pinterest-style 2-column layout ── */}
          <div className="lg:flex lg:items-start">

            {/* ── Left: sticky image panel (flex-1) ── */}
            <div
              className="hidden lg:flex lg:items-center lg:justify-center shrink-0"
              style={{
                width: "55%",
                position: "sticky",
                top:      52,
                height:   "calc(100vh - 52px)",
                background: "var(--bg-card)",
                borderRight: "1px solid var(--border)",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.title}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
                draggable={false}
              />
            </div>

            {/* ── Right: flex-1 scrollable details panel ── */}
            <div className="flex flex-col flex-1 min-w-0 overflow-y-auto" style={{ height: "calc(100vh - 52px)", position: "sticky", top: 52 }}>

            {/* Mobile image */}
            <div className="lg:hidden px-4 pt-4 pb-0">
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt={item.title} className="w-full object-cover" draggable={false} />
              </div>
            </div>

            <div
              className="flex flex-col gap-5 flex-1 min-w-0 px-4 md:px-6 pt-4 pb-8"
            >
              {/* Artist */}
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.avatar}
                  alt={item.artistName}
                  className="w-10 h-10 rounded-full object-cover"
                  style={{ border: "2px solid rgba(124,91,245,0.4)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{item.artistName}</p>
                  <p className="text-xs" style={{ color: "var(--text-5)" }}>{item.category}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setFollowing(v => !v)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:opacity-80"
                    style={{
                      background: following ? "rgba(16,185,129,0.12)" : "rgba(124,91,245,0.15)",
                      color:      following ? "#10B981"                : "#9B7CF5",
                      border:     `1px solid ${following ? "rgba(16,185,129,0.3)" : "rgba(124,91,245,0.3)"}`,
                    }}
                  >
                    {following ? "Following" : "Follow"}
                  </button>
                </div>
              </div>

              {/* Title & description */}
              <div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-1)" }}>{item.title}</h1>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-4)" }}>{item.description}</p>
              </div>

              {/* Meta grid */}
              <div
                className="grid grid-cols-2 gap-3 p-4 rounded-2xl text-sm"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                {item.medium && (
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "var(--text-5)" }}>Medium</p>
                    <p style={{ color: "var(--text-2)" }}>{item.medium}</p>
                  </div>
                )}
                {item.dimensions && (
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "var(--text-5)" }}>Size</p>
                    <p style={{ color: "var(--text-2)" }}>{item.dimensions}</p>
                  </div>
                )}
                {item.deliveryTime && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} style={{ color: "var(--text-5)" }} />
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: "var(--text-5)" }}>Delivery</p>
                      <p style={{ color: "var(--text-2)" }}>{item.deliveryTime}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Package size={13} style={{ color: "var(--text-5)" }} />
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "var(--text-5)" }}>Type</p>
                    <p style={{ color: "var(--text-2)" }}>{item.physical ? "Physical" : "Digital"}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: "var(--bg-subtle)", color: "var(--text-4)", border: "1px solid var(--border)" }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Community rating — open to all signed-in visitors */}
              <ArtworkRating artworkId={item.id} />

              {/* Price & CTA */}
              <div
                className="p-4 rounded-2xl"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-xs" style={{ color: "var(--text-5)" }}>
                    {item.type === "commission" ? "Starting at" : "Price"}
                  </span>
                  <span className="text-3xl font-bold" style={{ color: "#9B7CF5" }}>{item.currency}{item.price}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setBuyModal(true)}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-85"
                    style={{ background: "linear-gradient(135deg, #361E7B, #7C5BF5)" }}
                  >
                    {item.type === "commission" ? "Request Commission" : "Buy Now"}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLiked(v => !v)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: liked ? "rgba(244,63,94,0.1)" : "var(--bg-subtle)",
                        border:     `1px solid ${liked ? "rgba(244,63,94,0.4)" : "var(--border)"}`,
                        color:      liked ? "#f43f5e" : "var(--text-4)",
                      }}
                    >
                      <Heart size={15} fill={liked ? "#f43f5e" : "none"} />
                      {item.likes + (liked ? 1 : 0)}
                    </button>
                    <button
                      onClick={() => setSaved(v => !v)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: saved ? "rgba(124,91,245,0.1)" : "var(--bg-subtle)",
                        border:     `1px solid ${saved ? "rgba(124,91,245,0.4)" : "var(--border)"}`,
                        color:      saved ? "#9B7CF5" : "var(--text-4)",
                      }}
                    >
                      <Bookmark size={15} fill={saved ? "#9B7CF5" : "none"} />
                      Save
                    </button>
                    <button
                      onClick={handleShare}
                      title={shared ? "Link copied!" : "Share"}
                      className="flex items-center justify-center w-11 rounded-xl transition-all hover:opacity-70"
                      style={{
                        background: shared ? "rgba(16,185,129,0.12)" : "var(--bg-subtle)",
                        border:     `1px solid ${shared ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
                        color:      shared ? "#10B981" : "var(--text-4)",
                      }}
                    >
                      {shared ? <Check size={15} /> : <Share2 size={15} />}
                    </button>
                  </div>
                </div>
              </div>

            </div>{/* end details gap-5 */}
            </div>{/* end right column */}
          </div>{/* end Pinterest 2-col */}

          {/* ── Below post: Recommendations grid ── */}
          {belowGrid.length > 0 && (
            <div className="px-4 md:px-6 mt-12 border-t" style={{ borderColor: "var(--border)", paddingTop: 40 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>More from the Gallery</h2>
                  <p className="text-sm mt-0.5" style={{ color: "var(--text-5)" }}>Works you might also love</p>
                </div>
                <Link
                  href="/gallery"
                  className="text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ color: "#9B7CF5" }}
                >
                  Browse all →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {belowGrid.map(work => (
                  <ArtworkCard key={work.id} item={work} />
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      <BottomNav />

      {buyModal && <PurchaseModal item={item} onClose={() => setBuyModal(false)} />}
    </div>
  );
}
