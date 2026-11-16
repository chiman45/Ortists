"use client";

import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";
import MainHeader from "@/components/layout/MainHeader";
import { Search, SlidersHorizontal, ArrowRight, Heart } from "lucide-react";
import { parseImageUrls } from "@/lib/imageUrl";
import { buyerPriceAmount, buyerPriceLabel } from "@/lib/pricing";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// ── Types ────────────────────────────────────────────────────────────

interface RealPost {
  id: string; title: string; image_url: string; description: string | null;
  author_name: string; author_username: string; author_avatar: string | null;
  likes_count: number; comments_count: number; category: string | null;
  created_at?: string;
}

type SortOption = "featured" | "price-asc" | "price-desc" | "rating" | "newest";

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "featured",   label: "Featured" },
  { id: "newest",     label: "Newest" },
  { id: "rating",     label: "Most liked" },
  { id: "price-asc",  label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
];

interface RealArtist {
  clerk_id: string; display_name: string | null; username: string | null;
  avatar_url: string | null; tag: string | null; location: string | null;
  followers_count: number; available: boolean;
}

// Gallery posts embed the artist's price in the description as JSON
function rawPrice(description: string | null): string | null {
  if (!description) return null;
  try {
    const obj = JSON.parse(description);
    if (obj._price) return obj._price;
  } catch {}
  return null;
}

const postCategory = (post: RealPost) => post.category?.replace(/^gallery:/, "") ?? "";
const postCover    = (post: RealPost) => parseImageUrls(post.image_url)[0] ?? "";
// Buyer-facing price (artist price + platform fee, fee never itemised)
const postPrice    = (post: RealPost) => buyerPriceLabel(rawPrice(post.description));
const postAmount   = (post: RealPost) => buyerPriceAmount(rawPrice(post.description));
const postTime     = (post: RealPost) => new Date(post.created_at ?? 0).getTime();

// ── Shared primitives ────────────────────────────────────────────────

function PricePill({ label }: { label: string }) {
  return (
    <span
      className="text-xs font-bold px-2.5 py-1 rounded-lg shrink-0"
      style={{ background: "rgba(0,0,0,0.60)", color: "#fff", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {label}
    </span>
  );
}

function Avatar({ post, size }: { post: RealPost; size: number }) {
  if (post.author_avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={post.author_avatar} alt={post.author_name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
    );
  }
  return (
    <span
      className="rounded-full flex items-center justify-center font-black shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.5, background: "linear-gradient(135deg,#361E7B,#7C5BF5)", color: "#fff" }}
    >
      {(post.author_name || "A")[0].toUpperCase()}
    </span>
  );
}

function LikeRow({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1" style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
      <Heart size={9} />
      <span>{count}</span>
    </div>
  );
}

// ── Card variants ────────────────────────────────────────────────────

// Portrait card used in the main grid and in filtered results
function PostCard({ post }: { post: RealPost }) {
  const count = parseImageUrls(post.image_url).length;
  const price = postPrice(post);
  return (
    <Link href={`/feed/${post.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "3/4", background: "var(--bg-card)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={postCover(post)} alt={post.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          draggable={false} onContextMenu={e => e.preventDefault()}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />
        {price && (
          <div className="absolute bottom-3 right-3">
            <PricePill label={price} />
          </div>
        )}
        {count > 1 && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(0,0,0,0.6)", color: "#fff", backdropFilter: "blur(6px)" }}>
            ⊞ {count}
          </div>
        )}
      </div>
      <div className="mt-2.5 px-0.5">
        <p className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--text-1)" }}>{post.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5 mb-1">
          <Avatar post={post} size={16} />
          <span className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{post.author_name}</span>
        </div>
        <LikeRow count={post.likes_count} />
      </div>
    </Link>
  );
}

// Overlay card used in the editorial featured grid
function FeatureCard({ post, className = "", large = false }: { post: RealPost; className?: string; large?: boolean }) {
  const price = postPrice(post);
  return (
    <Link href={`/feed/${post.id}`} className={`group relative rounded-2xl overflow-hidden block ${className}`} style={{ minHeight: large ? 280 : 134, background: "var(--bg-card)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={postCover(post)} alt={post.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        draggable={false} onContextMenu={e => e.preventDefault()}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 55%)" }} />
      <div className={`absolute ${large ? "bottom-4 left-4 right-4" : "bottom-3 left-3 right-3"}`}>
        <div className="flex items-end justify-between mb-1">
          <p className={`${large ? "text-sm" : "text-xs"} font-bold text-white leading-tight truncate pr-2`}>{post.title}</p>
          {price && <PricePill label={price} />}
        </div>
        <p className={`${large ? "text-[11px]" : "text-[10px]"} mb-1 truncate`} style={{ color: "rgba(255,255,255,0.6)" }}>
          {post.author_name}
        </p>
        <LikeRow count={post.likes_count} />
      </div>
    </Link>
  );
}

// ── Main page ────────────────────────────────────────────────────────

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch]                 = useState("");
  const [sortBy, setSortBy]                 = useState<SortOption>("featured");
  const [showFilters, setShowFilters]       = useState(false);
  const [posts, setPosts]                   = useState<RealPost[]>([]);
  const [loading, setLoading]               = useState(true);
  const [realArtists, setRealArtists]       = useState<RealArtist[]>([]);

  // Gallery posts uploaded by real users
  useEffect(() => {
    fetch("/api/posts?gallery=1&limit=60")
      .then(r => r.json())
      .then(({ posts }: { posts: RealPost[] }) => setPosts(posts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Real artist accounts ordered by followers
  useEffect(() => {
    fetch("/api/profiles")
      .then(r => r.json())
      .then(({ profiles }: { profiles: RealArtist[] }) => setRealArtists(profiles ?? []))
      .catch(() => {});
  }, []);

  // Category chips come from what artists have actually listed
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(posts.map(postCategory).filter(Boolean))).sort()],
    [posts],
  );

  const isFiltered = Boolean(search) || activeCategory !== "All" || sortBy !== "featured";

  const filtered = posts.filter(post => {
    const q = search.toLowerCase();
    const matchCat    = activeCategory === "All" || postCategory(post) === activeCategory;
    const matchSearch = !search
      || post.title.toLowerCase().includes(q)
      || post.author_name.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      // Works without a price sort last in both price orders
      case "price-asc":  return (postAmount(a) ?? Infinity) - (postAmount(b) ?? Infinity);
      case "price-desc": return (postAmount(b) ?? -Infinity) - (postAmount(a) ?? -Infinity);
      case "rating":     return b.likes_count - a.likes_count;
      case "newest":     return postTime(b) - postTime(a);
      default:           return 0;
    }
  });

  // Featured slots go to the most-liked works (newest wins ties); the rest stay newest-first.
  const ranked   = [...posts].sort((a, b) => b.likes_count - a.likes_count || postTime(b) - postTime(a));
  const hero     = ranked[0];
  const featured = posts.length >= 4 ? ranked.slice(1, 4) : [];
  const shownIds = new Set([hero, ...featured].filter(Boolean).map(p => p.id));
  const rest     = posts.filter(p => !shownIds.has(p.id));
  const heroPrice = hero ? postPrice(hero) : null;

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen min-w-0">

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
          {categories.map(cat => {
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
          <div className="relative ml-auto shrink-0">
            <button
              onClick={() => setShowFilters(v => !v)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
              style={{
                background: sortBy !== "featured" ? "rgba(124,91,245,0.18)" : "var(--bg-subtle)",
                border: `1px solid ${sortBy !== "featured" ? "rgba(124,91,245,0.4)" : "var(--border)"}`,
                color: sortBy !== "featured" ? "#9B7CF5" : "var(--text-4)",
              }}>
              <SlidersHorizontal size={14} />
            </button>
            {showFilters && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                <div
                  className="absolute right-0 top-10 z-20 w-52 rounded-xl overflow-hidden py-1.5"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 12px 32px rgba(0,0,0,0.35)" }}
                >
                  <p className="px-3 pt-1.5 pb-1 text-[10px] font-bold tracking-widest" style={{ color: "var(--text-5)" }}>SORT BY</p>
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setSortBy(opt.id); setShowFilters(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-medium transition-colors"
                      style={{
                        background: sortBy === opt.id ? "rgba(124,91,245,0.12)" : "transparent",
                        color: sortBy === opt.id ? "#9B7CF5" : "var(--text-2)",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <main className="flex-1 pb-24 lg:pb-8">

          {loading ? (
            /* ── Loading skeleton ── */
            <div className="px-4 md:px-6 py-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-7">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="rounded-xl animate-pulse" style={{ aspectRatio: "3/4", background: "var(--bg-card)" }} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            /* ── Nothing listed yet ── */
            <div className="text-center py-24 px-4">
              <p className="text-3xl mb-3">🎨</p>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-2)" }}>No artworks listed yet</p>
              <p className="text-xs" style={{ color: "var(--text-5)" }}>Gallery posts from artists will appear here.</p>
            </div>
          ) : isFiltered ? (
            /* ── Filtered results ── */
            <div className="px-4 md:px-6 py-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm" style={{ color: "var(--text-5)" }}>
                  {sortedFiltered.length} result{sortedFiltered.length !== 1 ? "s" : ""}
                  {search ? ` for "${search}"` : ""}
                  {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
                </p>
                {sortBy !== "featured" && (
                  <p className="text-xs font-medium" style={{ color: "#9B7CF5" }}>
                    Sorted by {SORT_OPTIONS.find(o => o.id === sortBy)?.label}
                  </p>
                )}
              </div>
              {sortedFiltered.length === 0 ? (
                <div className="text-center py-24">
                  <p className="text-3xl mb-3">🎨</p>
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-2)" }}>No artworks found</p>
                  <p className="text-xs" style={{ color: "var(--text-5)" }}>Try a different search or category</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                  {sortedFiltered.map(post => <PostCard key={post.id} post={post} />)}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ── 1. Hero — most-liked work ── */}
              <Link href={`/feed/${hero.id}`} className="group block relative overflow-hidden" style={{ height: "56vh", minHeight: 360, background: "var(--bg-card)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={postCover(hero)} alt={hero.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  style={{ position: "absolute", inset: 0 }}
                  draggable={false} onContextMenu={e => e.preventDefault()}
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 50%, transparent 80%)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 55%)" }} />

                <div className="absolute top-5 left-5">
                  <span className="text-[9px] font-black tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.5)" }}>FEATURED WORK</span>
                </div>

                {/* Bottom-left: title + artist */}
                <div className="absolute bottom-6 left-5" style={{ maxWidth: "55%" }}>
                  <p className="text-3xl font-black text-white leading-tight mb-1.5">{hero.title}</p>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Avatar post={hero} size={20} />
                    <span className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {hero.author_name}
                    </span>
                  </div>
                  <LikeRow count={hero.likes_count} />
                </div>

                {/* Bottom-right: price + category + CTA */}
                <div className="absolute bottom-6 right-5 flex flex-col items-end gap-2">
                  {heroPrice && <span className="text-2xl font-black text-white">{heroPrice}</span>}
                  {postCategory(hero) && (
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{postCategory(hero)}</span>
                  )}
                  <span
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-all hover:opacity-90"
                    style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(8px)" }}
                  >
                    View Work <ArrowRight size={11} />
                  </span>
                </div>
              </Link>

              {/* ── 2. Editorial featured grid ── */}
              {featured.length === 3 && (
                <section className="px-4 md:px-6 pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ minHeight: 300 }}>
                    <FeatureCard post={featured[0]} className="sm:col-span-2" large />
                    <div className="flex sm:flex-col gap-3" style={{ minHeight: 280 }}>
                      {featured.slice(1).map(post => (
                        <FeatureCard key={post.id} post={post} className="flex-1" />
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* ── 3. Recently Listed grid ── */}
              {rest.length > 0 && (
                <section className="px-4 md:px-6 pt-8">
                  <p className="text-[10px] font-black tracking-[0.2em] mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>RECENTLY LISTED</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-7">
                    {rest.map(post => <PostCard key={post.id} post={post} />)}
                  </div>
                </section>
              )}

              {/* ── 4. Artists to Watch — real accounts ── */}
              {realArtists.length > 0 && (
                <section className="px-4 md:px-6 pt-10 pb-10">
                  <p className="text-[10px] font-black tracking-[0.2em] mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>ARTISTS TO WATCH</p>
                  <div className="flex gap-6 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                    {realArtists.slice(0, 12).map(a => (
                      <Link
                        key={a.clerk_id}
                        href={`/u/${(a.username ?? a.clerk_id).replace(/^@+/, "")}`}
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
