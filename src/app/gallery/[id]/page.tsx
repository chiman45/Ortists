"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import ArtworkCard from "@/components/gallery/ArtworkCard";
import { GalleryListings } from "@/lib/galleryData";
import type { GalleryListing } from "@/lib/types";
import { ArrowLeft, Bookmark, Clock, Heart, MessageCircle, Package, Share2, X } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";

// ── Purchase modal ─────────────────────────────────────────────

function PurchaseModal({ item, onClose }: { item: GalleryListing; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail]     = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity]       = useState("");
  const [zip, setZip]         = useState("");
  const [country, setCountry] = useState("");
  const [done, setDone]       = useState(false);

  const sym      = item.currency === "GBP" ? "£" : item.currency === "EUR" ? "€" : "$";
  const artwork  = item.price;
  const shipping = item.physical ? 15 : 0;
  const fee      = Math.round(artwork * 0.05);
  const total    = artwork + shipping + fee;

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={handleBackdrop}
    >
      <div
        className="w-full flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxWidth: 520,
          background: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.55)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>PURCHASE</p>
            <h2 className="text-xl font-bold" style={{ color: "#fff" }}>
              {done ? "Order Placed!" : step === 1 ? "Summary" : "Delivery Details"}
            </h2>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {/* Step dots */}
            <div className="flex items-center gap-1.5">
              {[1, 2].map(s => (
                <div
                  key={s}
                  className="rounded-full transition-all"
                  style={{
                    width:  step === s || (done && s === 2) ? 24 : 8,
                    height: 8,
                    background: step >= s || done ? "#7C5BF5" : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">

          {/* ── Step 1: Summary ── */}
          {step === 1 && !done && (
            <>
              {/* Artwork card */}
              <div
                className="flex items-center gap-4 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="rounded-xl object-cover shrink-0"
                  style={{ width: 72, height: 72 }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base truncate" style={{ color: "#fff" }}>{item.title}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
                    by {item.artistName}{item.artistLocation ? ` · ${item.artistLocation.split(",")[0]}` : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                      style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }}
                    >
                      {item.physical ? "Physical" : "Digital"}
                    </span>
                    <span
                      className="flex items-center gap-1 text-[10px] font-semibold"
                      style={{ color: "#10B981" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      Available
                    </span>
                  </div>
                </div>
                <p className="text-base font-bold shrink-0" style={{ color: "#fff" }}>{sym}{artwork.toLocaleString()}</p>
              </div>

              {/* Price breakdown */}
              <div className="flex flex-col" style={{ gap: 0 }}>
                {[
                  { label: "Artwork",           val: `${sym}${artwork.toLocaleString()}` },
                  ...(item.physical ? [{ label: "Shipping", val: `${sym}${shipping}` }] : []),
                  { label: `Platform fee (5%)`, val: `${sym}${fee}` },
                ].map(row => (
                  <div
                    key={row.label}
                    className="flex justify-between py-3 text-sm"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}
                  >
                    <span>{row.label}</span>
                    <span style={{ color: "rgba(255,255,255,0.7)" }}>{row.val}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 text-base font-bold" style={{ color: "#fff" }}>
                  <span>Total</span>
                  <span>{sym}{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Info note */}
              {item.physical && (
                <p className="text-xs leading-relaxed px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  Physical artwork — you will provide a shipping address on the next step. Estimated delivery 7–14 days from dispatch.
                </p>
              )}

              <button
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-85"
                style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}
              >
                Continue →
              </button>
            </>
          )}

          {/* ── Step 2: Delivery / Payment ── */}
          {step === 2 && !done && (
            <>
              <div className="flex flex-col gap-3">
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  type="email"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                />
                {item.physical && (
                  <>
                    <input
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Street address"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                    />
                    <div className="flex gap-3">
                      <input
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="City"
                        className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                      />
                      <input
                        value={zip}
                        onChange={e => setZip(e.target.value)}
                        placeholder="ZIP / Postcode"
                        className="w-32 px-4 py-3 rounded-xl text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                      />
                    </div>
                    <input
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      placeholder="Country"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                    />
                  </>
                )}
                {/* Order total reminder */}
                <div
                  className="flex justify-between text-sm px-4 py-3 rounded-xl font-semibold"
                  style={{ background: "rgba(124,91,245,0.1)", border: "1px solid rgba(124,91,245,0.2)", color: "#9B7CF5" }}
                >
                  <span>Order total</span>
                  <span>{sym}{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-4 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => setDone(true)}
                  className="flex-1 py-4 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-85"
                  style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}
                >
                  Place Order →
                </button>
              </div>
            </>
          )}

          {/* ── Confirmation ── */}
          {done && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold mb-1" style={{ color: "#fff" }}>Order confirmed!</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                  A confirmation will be sent to {email || "your email"}.
                  {item.physical ? " Estimated delivery 7–14 days from dispatch." : " Your digital file will be delivered shortly."}
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-8 py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-85"
                style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
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

          {/* ── 3-column layout ── */}
          <div className="flex gap-0 items-start px-4 md:px-6 pt-4">

            {/* ── Left: Sticky artwork image ── */}
            <div
              className="hidden lg:block shrink-0 rounded-2xl overflow-hidden"
              style={{
                width:    420,
                position: "sticky",
                top:      80,
                border:   "1px solid var(--border)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.title}
                style={{ width: "100%", display: "block", objectFit: "cover" }}
                draggable={false}
              />
            </div>

            {/* ── Center: Post details + comments (original style) ── */}
            <div
              className="flex flex-col gap-5 flex-1 min-w-0 px-6"
              style={{ maxWidth: 420 }}
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
                  <button
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-4)" }}
                  >
                    <MessageCircle size={15} />
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

              {/* Price & CTA */}
              <div
                className="p-4 rounded-2xl"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-xs" style={{ color: "var(--text-5)" }}>
                    {item.type === "commission" ? "Starting at" : "Price"}
                  </span>
                  <span className="text-3xl font-bold" style={{ color: "#9B7CF5" }}>${item.price}</span>
                  <span className="text-xs" style={{ color: "var(--text-5)" }}>{item.currency}</span>
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
                      className="flex items-center justify-center w-11 rounded-xl transition-all hover:opacity-70"
                      style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-4)" }}
                    >
                      <Share2 size={15} />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* ── Right: Pinterest-style recommendation grid ── */}
            <div className="hidden xl:block flex-1 min-w-0 pl-4">
              <div className="columns-2 gap-4" style={{ columnGap: 16 }}>
                {rightGrid.map(work => (
                  <Link
                    key={work.id}
                    href={`/gallery/${work.id}`}
                    className="group relative block rounded-2xl overflow-hidden mb-4 break-inside-avoid"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={work.imageUrl}
                      alt={work.title}
                      className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Hover overlay */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 45%, rgba(0,0,0,0.08) 100%)" }}
                    >
                      <div className="flex justify-end">
                        <button
                          onClick={e => e.preventDefault()}
                          className="px-3 py-1 rounded-full text-[11px] font-bold text-white"
                          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)" }}
                        >
                          Save
                        </button>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white truncate">{work.title}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                          {work.artistName} · ${work.price}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Below post: Recommendations grid ── */}
          {belowGrid.length > 0 && (
            <div className="px-4 md:px-6 mt-12">
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
