"use client";

import ArtworkCard from "@/components/marketplace/ArtworkCard";
import CommissionCard from "@/components/marketplace/CommissionCard";
import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import { marketplaceListings, featuredArtists, trendingListings, MARKETPLACE_CATEGORIES } from "@/lib/marketplaceData";
import { Search, SlidersHorizontal, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = marketplaceListings.filter(item => {
    const matchCat = activeCategory === "All" || item.category === activeCategory ||
      (activeCategory === "Commissions" && item.type === "commission");
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.artistName.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div
      className="flex min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 8% 50%, rgba(54,30,123,0.16) 0%, transparent 55%)," +
          "radial-gradient(ellipse 50% 40% at 92% 20%, rgba(124,91,245,0.08) 0%, transparent 50%)," +
          "var(--bg)",
      }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">

        {/* Sticky header with search + category chips */}
        <MainHeader>
          <div className="px-4 md:px-8 pb-3 flex flex-col gap-2">
            {/* Search + filter row */}
            <div className="flex gap-2">
              <div
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
              >
                <Search size={14} style={{ color: "var(--text-5)", flexShrink: 0 }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search artworks, commissions, creators…"
                  className="flex-1 bg-transparent text-sm outline-none min-w-0"
                  style={{ color: "var(--text-1)" }}
                />
              </div>
              <button
                onClick={() => setShowFilters(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all shrink-0"
                style={{
                  background: showFilters ? "rgba(124,91,245,0.15)" : "var(--bg-subtle)",
                  border: showFilters ? "1px solid rgba(124,91,245,0.4)" : "1px solid var(--border)",
                  color: showFilters ? "#9B7CF5" : "var(--text-4)",
                }}
              >
                <SlidersHorizontal size={13} />
                <span className="hidden sm:inline">Filter</span>
              </button>
            </div>

            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {MARKETPLACE_CATEGORIES.map(cat => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="shrink-0 px-3.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: active ? "linear-gradient(135deg, #361E7B, #7C5BF5)" : "var(--bg-card)",
                      color: active ? "#fff" : "var(--text-4)",
                      border: active ? "1px solid transparent" : "1px solid var(--border)",
                      boxShadow: active ? "0 0 10px rgba(124,91,245,0.3)" : "none",
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </MainHeader>

        <main className="flex-1 px-4 md:px-8 py-6 pb-24 lg:pb-8">

          {/* Page title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-1)" }}>Marketplace</h2>
            <p className="text-sm" style={{ color: "var(--text-5)" }}>Discover artworks, commissions & creative services</p>
          </div>

          {/* Filter drawer */}
          {showFilters && (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-6 p-4 rounded-2xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              {[
                "Physical Only", "Digital Only", "Commission Open",
                "Under $100", "$100–$300", "Over $300", "Fast Delivery", "Trending",
              ].map(f => (
                <button
                  key={f}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-left transition-all"
                  style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-3)" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#7C5BF5"; e.currentTarget.style.color = "#9B7CF5"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-3)"; }}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {/* Trending */}
          {activeCategory === "All" && !search && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>Trending Now</h3>
                <button className="flex items-center gap-1 text-xs font-medium" style={{ color: "#9B7CF5" }}>
                  See all <ChevronRight size={13} />
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                {trendingListings.map(item => (
                  <div key={item.id} className="shrink-0 w-44">
                    {item.type === "commission" ? <CommissionCard item={item} /> : <ArtworkCard item={item} />}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Featured Artists */}
          {activeCategory === "All" && !search && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>Featured Artists</h3>
                <button className="flex items-center gap-1 text-xs font-medium" style={{ color: "#9B7CF5" }}>
                  See all <ChevronRight size={13} />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                {featuredArtists.map(artist => (
                  <div
                    key={artist.id}
                    className="shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", minWidth: 128 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={artist.avatar} alt={artist.name}
                      className="w-12 h-12 rounded-full object-cover"
                      style={{ border: "2px solid rgba(124,91,245,0.4)" }}
                    />
                    <div className="text-center">
                      <p className="text-xs font-semibold truncate max-w-25" style={{ color: "var(--text-1)" }}>{artist.name}</p>
                      <p className="text-[10px] mb-1" style={{ color: "var(--text-5)" }}>{artist.specialty}</p>
                      <p className="text-[10px]" style={{ color: "#9B7CF5" }}>{artist.listingsCount} listings</p>
                    </div>
                    <button
                      className="text-[11px] font-semibold px-3 py-1 rounded-full transition-opacity hover:opacity-80"
                      style={{ background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.3)" }}
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Main grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>
                {activeCategory === "All" ? "All Listings" : activeCategory}
                <span className="text-sm font-normal ml-2" style={{ color: "var(--text-5)" }}>({filtered.length})</span>
              </h3>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20" style={{ color: "var(--text-5)" }}>
                No listings found{search ? ` for "${search}"` : ""}
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
                {filtered.map(item => (
                  <div key={item.id} className="break-inside-avoid mb-4">
                    {item.type === "commission" ? <CommissionCard item={item} /> : <ArtworkCard item={item} />}
                  </div>
                ))}
              </div>
            )}
          </section>

        </main>
      </div>

      <BottomNav />
    </div>
  );
}
