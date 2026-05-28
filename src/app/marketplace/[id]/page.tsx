"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import { marketplaceListings } from "@/lib/marketplaceData";
import { Heart, Bookmark, Share2, MessageCircle, ArrowLeft, Clock, Package } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import ArtworkCard from "@/components/marketplace/ArtworkCard";

export default function MarketplaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const item = marketplaceListings.find(l => l.id === id) ?? marketplaceListings[0];
  const similar = marketplaceListings.filter(l => l.id !== item.id && l.category === item.category).slice(0, 6);

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div
      className="flex min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 8% 50%, rgba(54,30,123,0.16) 0%, transparent 55%)," +
          "var(--bg)",
      }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">
        <MainHeader />

        <main className="flex-1 px-4 md:px-8 py-6 pb-24 lg:pb-8 max-w-5xl">

          {/* Back */}
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-sm mb-6 transition-opacity hover:opacity-70"
            style={{ color: "var(--text-4)" }}
          >
            <ArrowLeft size={15} /> Back to Marketplace
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Left: image */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={item.title} style={{ width: "100%", display: "block", objectFit: "cover" }} />
            </div>

            {/* Right: details */}
            <div className="flex flex-col gap-5">
              {/* Artist */}
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.avatar} alt={item.artistName} className="w-10 h-10 rounded-full object-cover" style={{ border: "2px solid rgba(124,91,245,0.4)" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{item.artistName}</p>
                  <p className="text-xs" style={{ color: "var(--text-5)" }}>{item.category}</p>
                </div>
                <div className="ml-auto flex gap-2">
                  <button
                    className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:opacity-80"
                    style={{ background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.3)" }}
                  >
                    Follow
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

              {/* Meta */}
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
                        border: `1px solid ${liked ? "rgba(244,63,94,0.4)" : "var(--border)"}`,
                        color: liked ? "#f43f5e" : "var(--text-4)",
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
                        border: `1px solid ${saved ? "rgba(124,91,245,0.4)" : "var(--border)"}`,
                        color: saved ? "#9B7CF5" : "var(--text-4)",
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
          </div>

          {/* Similar works */}
          {similar.length > 0 && (
            <section>
              <h3 className="text-lg font-bold mb-5" style={{ color: "var(--text-1)" }}>Similar Works</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {similar.map(item => <ArtworkCard key={item.id} item={item} />)}
              </div>
            </section>
          )}

        </main>
      </div>

      <BottomNav />
    </div>
  );
}
