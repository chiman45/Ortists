"use client";

import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";
import MainHeader from "@/components/layout/MainHeader";
import {
  GalleryListings, GALLERY_CATEGORIES,
  heroListing, featuredGrid, newListings, collectionFeatured, mainGrid,
} from "@/lib/galleryData";
import type { GalleryListing } from "@/lib/types";
import { Search, SlidersHorizontal, Star, ChevronRight, ArrowRight, Heart } from "lucide-react";
import { parseImageUrls } from "@/lib/imageUrl";
import Link from "next/link";
import { useEffect, useState } from "react";

// ── Real post types ──────────────────────────────────────────────────

interface RealPost {
  id: string; title: string; image_url: string; description: string | null;
  author_name: string; author_username: string; author_avatar: string | null;
  likes_count: number; comments_count: number; category: string | null;
}

interface RealArtist {
  clerk_id: string; display_name: string | null; username: string | null;
  avatar_url: string | null; tag: string | null; location: string | null;
  followers_count: number; available: boolean;
}


function parsePostPrice(description: string | null): { price: string | null; desc: string } {
  if (!description) return { price: null, desc: "" };
  try {
    const obj = JSON.parse(description);
    if (obj._price) return { price: obj._price, desc: obj._desc ?? "" };
  } catch {}
  return { price: null, desc: description };
}

// ── Shared primitives ────────────────────────────────────────────────

function PricePill({ price, currency = "£" }: { price: number; currency?: string }) {
  return (
    <span
      className="text-xs font-bold px-2.5 py-1 rounded-lg shrink-0"
      style={{ background: "rgba(0,0,0,0.60)", color: "#fff", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {currency}{price}
    </span>
  );
}

function StarRow({ rating, commissions, link = true }: { rating: number; commissions: number; link?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap" style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
      <Star size={9} fill="#FBBF24" color="#FBBF24" />
      <span>{rating.toFixed(1)}</span>
      <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
      <span>{commissions} commissions</span>
      {link && (
        <>
          <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
          <span className="hover:text-white transition-colors cursor-pointer" style={{ color: "rgba(255,255,255,0.55)" }}>
            View Artist Profile →
          </span>
        </>
      )}
    </div>
  );
}

// ── Card variants ────────────────────────────────────────────────────

// Used in ON VIEW 4-col grid — landscape crop with full meta below
function OnViewCard({ item }: { item: GalleryListing }) {
  return (
    <Link href={`/gallery/${item.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "4/3" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl} alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          draggable={false} onContextMenu={e => e.preventDefault()}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />
        <div className="absolute bottom-2.5 right-2.5">
          <PricePill price={item.price} currency={item.currency} />
        </div>
      </div>
      <div className="mt-2.5 px-0.5">
        <p className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--text-1)" }}>{item.title}</p>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
          {item.artistName} · {item.artistLocation}
        </p>
        <StarRow rating={item.rating} commissions={item.commissions} />
      </div>
    </Link>
  );
}

// Used in main RECENTLY LISTED grid — portrait crop
function ArtworkCard({ item, className = "" }: { item: GalleryListing; className?: string }) {
  return (
    <Link href={`/gallery/${item.id}`} className={`group block ${className}`}>
      <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "3/4" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl} alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          draggable={false} onContextMenu={e => e.preventDefault()}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 45%)" }} />
        <div className="absolute bottom-3 right-3">
          <PricePill price={item.price} currency={item.currency} />
        </div>
      </div>
      <div className="mt-2.5 px-0.5">
        <p className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--text-1)" }}>{item.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.avatar} alt={item.artistName} className="w-4 h-4 rounded-full object-cover shrink-0" />
          <span className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
            {item.artistName} · {item.artistLocation}
          </span>
        </div>
        <StarRow rating={item.rating} commissions={item.commissions} />
      </div>
    </Link>
  );
}

// Community card — for real user-uploaded gallery posts
function CommunityCard({ post }: { post: RealPost }) {
  const urls  = parseImageUrls(post.image_url);
  const cover = urls[0] ?? "";
  const { price } = parsePostPrice(post.description);
  return (
    <Link href={`/feed/${post.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "3/4" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover} alt={post.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          draggable={false} onContextMenu={e => e.preventDefault()}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />
        {price && (
          <div className="absolute bottom-3 right-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: "rgba(0,0,0,0.65)", color: "#fff", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {price}
            </span>
          </div>
        )}
        {urls.length > 1 && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(0,0,0,0.6)", color: "#fff", backdropFilter: "blur(6px)" }}>
            ⊞ {urls.length}
          </div>
        )}
      </div>
      <div className="mt-2.5 px-0.5">
        <p className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--text-1)" }}>{post.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {post.author_avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author_avatar} alt={post.author_name} className="w-4 h-4 rounded-full object-cover shrink-0" />
          )}
          <span className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{post.author_name}</span>
        </div>
        <div className="flex items-center gap-1 mt-1" style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
          <Heart size={9} />
          <span>{post.likes_count}</span>
        </div>
      </div>
    </Link>
  );
}

// ── Main page ────────────────────────────────────────────────────────

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch]                 = useState("");
  const [realPosts, setRealPosts]     = useState<RealPost[]>([]);
  const [realArtists, setRealArtists] = useState<RealArtist[]>([]);

  // Fetch real user-uploaded gallery posts
  useEffect(() => {
    fetch("/api/posts?gallery=1&limit=24")
      .then(r => r.json())
      .then(({ posts }: { posts: RealPost[] }) => setRealPosts(posts ?? []))
      .catch(() => {});
  }, []);

  // Fetch real artist accounts ordered by followers
  useEffect(() => {
    fetch("/api/profiles")
      .then(r => r.json())
      .then(({ profiles }: { profiles: RealArtist[] }) => setRealArtists(profiles ?? []))
      .catch(() => {});
  }, []);

  const isFiltered = search || activeCategory !== "All";

  const filtered = GalleryListings.filter(item => {
    const matchCat    = activeCategory === "All" || item.category === activeCategory;
    const matchSearch = !search
      || item.title.toLowerCase().includes(search.toLowerCase())
      || item.artistName.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Filter community (real DB) posts for search
  const filteredReal = realPosts.filter(post => {
    const postCat = post.category?.replace(/^gallery:/, "") ?? "";
    const matchCat = activeCategory === "All" || postCat.toLowerCase() === activeCategory.toLowerCase();
    const matchSearch = !search
      || post.title.toLowerCase().includes(search.toLowerCase())
      || post.author_name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalFiltered = filtered.length + filteredReal.length;

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">

        {/* ── Top bar: search + Settings/Bell via MainHeader ── */}
        <MainHeader>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl max-w-xs"
            style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
            <Search size={14} style={{ color: "var(--text-5)", flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search artworks…"
              className="flex-1 bg-transparent text-sm outline-none min-w-0"
              style={{ color: "var(--text-1)" }}
            />
          </div>
        </MainHeader>

        {/* ── Category filter row ── */}
        <div className="sticky top-12 z-20 flex items-center gap-2 px-4 md:px-6 py-2 overflow-x-auto"
          style={{ background: "var(--bg-header)", backdropFilter: "blur(24px)", borderBottom: "1px solid var(--border)", scrollbarWidth: "none" }}>
          {GALLERY_CATEGORIES.map(cat => {
            const active = activeCategory === cat;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: active ? "linear-gradient(135deg,#361E7B,#7C5BF5)" : "transparent",
                  color: active ? "#fff" : "var(--text-4)",
                  border: "1px solid transparent",
                }}>
                {cat}
              </button>
            );
          })}
          <button className="ml-auto w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-opacity hover:opacity-70"
            style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-4)" }}>
            <SlidersHorizontal size={14} />
          </button>
        </div>

        {/* ── Content ── */}
        <main className="flex-1 pb-24 lg:pb-8">

          {isFiltered ? (
            /* ── Filtered results (static + community) ── */
            <div className="px-4 md:px-6 py-6">
              <p className="text-sm mb-5" style={{ color: "var(--text-5)" }}>
                {totalFiltered} result{totalFiltered !== 1 ? "s" : ""}
                {search ? ` for "${search}"` : ""}
                {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
              </p>
              {totalFiltered === 0 ? (
                <div className="text-center py-24">
                  <p className="text-3xl mb-3">🎨</p>
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-2)" }}>No artworks found</p>
                  <p className="text-xs" style={{ color: "var(--text-5)" }}>Try a different search or category</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filtered.map(item => <ArtworkCard key={item.id} item={item} />)}
                  {filteredReal.map(post => <CommunityCard key={post.id} post={post} />)}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ── 1. Hero ── */}
              <Link href={`/gallery/${heroListing.id}`} className="group block relative" style={{ height: "56vh", minHeight: 360 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroListing.imageUrl} alt={heroListing.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  style={{ position: "absolute", inset: 0 }}
                  draggable={false} onContextMenu={e => e.preventDefault()}
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 50%, transparent 80%)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 55%)" }} />

                {/* Top-left label */}
                <div className="absolute top-5 left-5">
                  <span className="text-[9px] font-black tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.5)" }}>FEATURED WORK</span>
                </div>

                {/* Bottom-left: title + artist */}
                <div className="absolute bottom-6 left-5" style={{ maxWidth: "55%" }}>
                  <p className="text-3xl font-black text-white leading-tight mb-1.5">{heroListing.title}</p>
                  <div className="flex items-center gap-2 mb-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={heroListing.avatar} alt={heroListing.artistName} className="w-5 h-5 rounded-full object-cover" />
                    <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {heroListing.artistName}
                    </span>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {heroListing.artistLocation}
                    </span>
                  </div>
                  <StarRow rating={heroListing.rating} commissions={heroListing.commissions} />
                </div>

                {/* Bottom-right: price + meta + CTA */}
                <div className="absolute bottom-6 right-5 flex flex-col items-end gap-2">
                  <span className="text-2xl font-black text-white">{heroListing.currency}{heroListing.price}</span>
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {heroListing.medium} · {heroListing.dimensions} · 2025
                  </span>
                  <span
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-all hover:opacity-90"
                    style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(8px)" }}
                  >
                    View Work <ArrowRight size={11} />
                  </span>
                </div>
              </Link>

              {/* ── 2. Editorial featured grid ── */}
              <section className="px-4 md:px-6 py-6">
                <div className="grid grid-cols-3 gap-3" style={{ height: 400 }}>
                  {/* Left: large card — img absolute so it fills the grid cell height */}
                  <Link href={`/gallery/${featuredGrid[0].id}`} className="group col-span-2 relative rounded-2xl overflow-hidden block" style={{ minHeight: 400 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featuredGrid[0].imageUrl} alt={featuredGrid[0].title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      draggable={false} onContextMenu={e => e.preventDefault()}
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 55%)" }} />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-end justify-between mb-1.5">
                        <p className="text-sm font-bold text-white">{featuredGrid[0].title}</p>
                        <PricePill price={featuredGrid[0].price} currency={featuredGrid[0].currency} />
                      </div>
                      <p className="text-[11px] mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {featuredGrid[0].artistName} · {featuredGrid[0].artistLocation}
                      </p>
                      <StarRow rating={featuredGrid[0].rating} commissions={featuredGrid[0].commissions} />
                    </div>
                  </Link>

                  {/* Right: 2 stacked — each Link fills its flex-1 slot */}
                  <div className="flex flex-col gap-3" style={{ height: 400 }}>
                    {featuredGrid.slice(1, 3).map(item => (
                      <Link key={item.id} href={`/gallery/${item.id}`} className="group relative flex-1 rounded-2xl overflow-hidden block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl} alt={item.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          draggable={false} onContextMenu={e => e.preventDefault()}
                        />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)" }} />
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="flex items-end justify-between mb-1">
                            <p className="text-xs font-bold text-white leading-tight truncate pr-2">{item.title}</p>
                            <PricePill price={item.price} currency={item.currency} />
                          </div>
                          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                            {item.artistName} · {item.artistLocation}
                          </p>
                          <StarRow rating={item.rating} commissions={item.commissions} link={false} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>

              {/* ── 3. ON VIEW — 4-col grid ── */}
              <section className="px-4 md:px-6 pb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>ON VIEW</span>
                  <button className="flex items-center gap-1 text-xs font-medium" style={{ color: "#9B7CF5" }}>
                    View all <ChevronRight size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {newListings.map(item => <OnViewCard key={item.id} item={item} />)}
                </div>
              </section>

              {/* ── 4. "From the Collection" promo ── */}
              <section
                className="mx-4 md:mx-6 mb-8 rounded-2xl overflow-hidden grid grid-cols-5"
                style={{ background: "rgba(8,5,20,0.95)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="col-span-2 flex flex-col justify-center px-8 py-10 gap-4">
                  <p className="text-[9px] font-black tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.35)" }}>FROM THE COLLECTION</p>
                  <h3 className="text-2xl font-black leading-tight" style={{ color: "#fff" }}>
                    Works that challenge<br />how we see.
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Independent artists from 40 countries. Collected by museums, private collectors, and people who simply love art.
                  </p>
                  <button className="self-start flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: "#9B7CF5" }}>
                    Explore the collection <ArrowRight size={13} />
                  </button>
                </div>

                <Link href={`/gallery/${collectionFeatured.id}`} className="group col-span-3 relative block" style={{ minHeight: 300 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={collectionFeatured.imageUrl} alt={collectionFeatured.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    style={{ position: "absolute", inset: 0 }}
                    draggable={false} onContextMenu={e => e.preventDefault()}
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.70) 0%, transparent 50%)" }} />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-end justify-between mb-1">
                      <p className="text-sm font-bold text-white">{collectionFeatured.title}</p>
                      <PricePill price={collectionFeatured.price} currency={collectionFeatured.currency} />
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={collectionFeatured.avatar} alt={collectionFeatured.artistName} className="w-4 h-4 rounded-full object-cover" />
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {collectionFeatured.artistName} · {collectionFeatured.artistLocation}
                      </span>
                    </div>
                    <StarRow rating={collectionFeatured.rating} commissions={collectionFeatured.commissions} />
                  </div>
                </Link>
              </section>

              {/* ── 5. Recently Listed grid ── */}
              <section className="px-4 md:px-6 pb-8">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-[10px] font-black tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>RECENTLY LISTED</p>
                  <button className="flex items-center gap-1 text-xs font-medium" style={{ color: "#9B7CF5" }}>
                    View all <ChevronRight size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-7">
                  {mainGrid.map(item => <ArtworkCard key={item.id} item={item} />)}
                </div>
              </section>

              {/* ── 6. Community Gallery — real user uploads ── */}
              {realPosts.length > 0 && (
                <section className="px-4 md:px-6 pb-8">
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-[10px] font-black tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>COMMUNITY GALLERY</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-7">
                    {realPosts.map(post => <CommunityCard key={post.id} post={post} />)}
                  </div>
                </section>
              )}

              {/* ── 7. Artists to Watch — real accounts ── */}
              {realArtists.length > 0 && (
                <section className="px-4 md:px-6 pb-10">
                  <p className="text-[10px] font-black tracking-[0.2em] mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>ARTISTS TO WATCH</p>
                  <div className="flex gap-6 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                    {realArtists.slice(0, 12).map(a => (
                      <Link
                        key={a.clerk_id}
                        href={`/profile/${a.username ?? a.clerk_id}`}
                        className="shrink-0 flex flex-col items-center gap-2 group"
                        style={{ width: 120 }}
                      >
                        {a.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={a.avatar_url} alt={a.display_name ?? "Artist"}
                            className="w-16 h-16 rounded-full object-cover transition-all group-hover:scale-[1.06]"
                            style={{ border: "2px solid rgba(124,91,245,0.4)" }}
                          />
                        ) : (
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-black transition-all group-hover:scale-[1.06]"
                            style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", color: "#fff", border: "2px solid rgba(124,91,245,0.4)" }}
                          >
                            {(a.display_name ?? a.username ?? "A")[0].toUpperCase()}
                          </div>
                        )}
                        <div className="text-center w-full">
                          <p className="text-xs font-bold leading-tight truncate" style={{ color: "var(--text-1)" }}>
                            {a.display_name ?? a.username ?? "Artist"}
                          </p>
                          {a.location && (
                            <p className="text-[10px] truncate mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{a.location}</p>
                          )}
                          {a.tag && (
                            <p className="text-[10px] truncate mt-0.5" style={{ color: "rgba(124,91,245,0.7)" }}>{a.tag}</p>
                          )}
                          <div className="flex items-center justify-center gap-1 mt-1" style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
                            <span>{a.followers_count.toLocaleString()} followers</span>
                          </div>
                          {a.available && (
                            <span className="inline-block mt-1 text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>
                              Available
                            </span>
                          )}
                          <p className="mt-1.5 text-[10px] font-semibold group-hover:opacity-80 transition-opacity" style={{ color: "#9B7CF5" }}>
                            View Profile →
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
