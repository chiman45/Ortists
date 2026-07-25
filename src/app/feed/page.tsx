"use client";

import MasonryGrid from "@/components/feed/MasonryGrid";
import StoriesRow from "@/components/feed/StoriesRow";
import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import FeedGridSkeleton from "@/components/ui/skeletons/FeedCardSkeleton";
import { type Post } from "@/lib/db/posts";
import { ArrowLeft, MapPin, Search, Users, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function toGridPost(p: Post) {
  return {
    id:          p.id,
    userId:      p.user_id,
    title:       p.title,
    imageUrl:    p.image_url,
    imageWidth:  400,
    imageHeight: 500,
    username:    p.author_username,
    avatar:      p.author_avatar ?? `https://i.pravatar.cc/80`,
    likes:       p.likes_count,
    comments:    p.comments_count,
    category:    p.category,
  };
}

interface SearchPost {
  id: string; title: string; image_url: string;
  likes_count: number; category: string | null;
  author_username: string; author_avatar: string | null; author_name: string;
}
interface SearchAccount {
  clerk_id: string; display_name: string | null; username: string | null;
  avatar_url: string | null; tag: string; location: string | null;
  followers_count: number; available: boolean;
}

type ResultTab = "All" | "Accounts" | "Posts";

function isQuerySafe(q: string) {
  return q.length <= 100 && /^[\w\s\-_.@#]*$/.test(q);
}

export default function FeedPage() {
  const [activeTab, setActiveTab]           = useState<"Latest" | "Popular">("Latest");
  const [search, setSearch]                 = useState("");
  const [query, setQuery]                   = useState("");
  const [dbPosts, setDbPosts]               = useState<Post[]>([]);
  const [loading, setLoading]               = useState(true);
  const [searchPosts, setSearchPosts]       = useState<SearchPost[]>([]);
  const [searchAccounts, setSearchAccounts] = useState<SearchAccount[]>([]);
  const [searching, setSearching]           = useState(false);
  const [searchOpen, setSearchOpen]         = useState(false);
  const [resultTab, setResultTab]           = useState<ResultTab>("All");
  const abortRef                            = useRef<AbortController | null>(null);
  const inputRef                            = useRef<HTMLInputElement>(null);

  function openSearch() {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 60);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearch("");
    setQuery("");
    setSearchPosts([]);
    setSearchAccounts([]);
    setResultTab("All");
  }

  // Lock body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = searchOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [searchOpen]);

  // Debounce input → query
  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = search.trim();
      setQuery(isQuerySafe(trimmed) ? trimmed : "");
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Load normal feed
  useEffect(() => {
    if (query) return;
    setLoading(true);
    setDbPosts([]);
    fetch("/api/posts?limit=24&offset=0")
      .then(r => r.json())
      .then(({ posts }: { posts: Post[] }) => { setDbPosts(posts ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [query]);

  // Search
  useEffect(() => {
    if (!query) { setSearchPosts([]); setSearchAccounts([]); return; }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSearching(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}&type=all`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(({ posts, accounts }) => {
        setSearchPosts(posts ?? []);
        setSearchAccounts(accounts ?? []);
        setSearching(false);
      })
      .catch(err => { if (err.name !== "AbortError") setSearching(false); });
  }, [query]);

  const feedPosts = loading ? [] : dbPosts.map(toGridPost);
  const hasResults = searchPosts.length > 0 || searchAccounts.length > 0;

  return (
    <div
      className="flex min-h-screen overflow-x-hidden"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 8% 50%, rgba(54,30,123,0.16) 0%, transparent 55%)," +
          "radial-gradient(ellipse 50% 40% at 92% 20%, rgba(124,91,245,0.08) 0%, transparent 50%)," +
          "var(--bg)",
      }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen min-w-0">
        <MainHeader>
          <div className="flex justify-end">
            <button
              onClick={openSearch}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm transition-all hover:opacity-80"
              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-5)" }}
            >
              <Search size={15} />
              <span className="hidden sm:inline text-xs">Search…</span>
            </button>
          </div>
        </MainHeader>

        <main className="flex-1 px-4 md:px-8 py-7 pb-24 lg:pb-7">
          <StoriesRow />

          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>Feed</h2>
            <div className="flex items-center gap-4">
              {(["Latest", "Popular"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="text-sm font-semibold transition-colors relative pb-0.5"
                  style={{ color: activeTab === tab ? "var(--text-1)" : "var(--text-5)" }}
                >
                  {tab}
                  {activeTab === tab && (
                    <span
                      className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: "linear-gradient(90deg, #361E7B, #7C5BF5)" }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <FeedGridSkeleton count={12} />
          ) : (
            <MasonryGrid
              posts={feedPosts as Parameters<typeof MasonryGrid>[0]["posts"]}
              category={null}
              loadFromDb={true}
            />
          )}
        </main>
      </div>

      <BottomNav />

      {/* ── Full-screen Search Overlay ── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: "var(--bg)" }}
        >
          {/* Search header bar */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <button
              onClick={closeSearch}
              className="p-2 rounded-xl transition-opacity hover:opacity-70 shrink-0"
              style={{ color: "var(--text-2)" }}
            >
              <ArrowLeft size={18} />
            </button>

            <div
              className="flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
            >
              <Search size={15} style={{ color: "var(--text-5)", shrink: 0 } as React.CSSProperties} />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search posts, artists, tags…"
                maxLength={100}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--text-1)" }}
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); setQuery(""); }}
                  className="transition-opacity hover:opacity-70 shrink-0"
                  style={{ color: "var(--text-5)" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Result-type tabs — only when there's a query */}
          {query && !searching && hasResults && (
            <div
              className="flex gap-1 px-4 py-2.5 shrink-0 overflow-x-auto"
              style={{ borderBottom: "1px solid var(--border)", scrollbarWidth: "none" }}
            >
              {(["All", "Accounts", "Posts"] as ResultTab[]).map(tab => {
                const count =
                  tab === "All"      ? searchAccounts.length + searchPosts.length :
                  tab === "Accounts" ? searchAccounts.length :
                                       searchPosts.length;
                const active = resultTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setResultTab(tab)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold shrink-0 transition-all"
                    style={{
                      background: active ? "#7C5BF5" : "var(--bg-subtle)",
                      color: active ? "#fff" : "var(--text-4)",
                      border: active ? "1px solid #7C5BF5" : "1px solid var(--border)",
                    }}
                  >
                    {tab}
                    {count > 0 && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: active ? "rgba(255,255,255,0.25)" : "rgba(124,91,245,0.15)",
                          color: active ? "#fff" : "#9B7CF5",
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Results body */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>

            {/* Loading spinner */}
            {searching && (
              <div className="flex items-center justify-center gap-3 py-20">
                <div className="w-5 h-5 rounded-full border-2 animate-spin"
                  style={{ borderColor: "var(--bg-subtle)", borderTopColor: "#7C5BF5" }} />
                <span className="text-sm" style={{ color: "var(--text-5)" }}>Searching…</span>
              </div>
            )}

            {/* No query yet — hint */}
            {!query && !searching && (
              <div className="flex flex-col items-center justify-center gap-3 py-24">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(124,91,245,0.12)" }}
                >
                  <Search size={28} style={{ color: "#7C5BF5" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>
                  Search Ortist
                </p>
                <p className="text-xs text-center max-w-xs" style={{ color: "var(--text-5)" }}>
                  Find artists by name, tag, or location. Find posts by title or category.
                </p>
              </div>
            )}

            {/* Empty results */}
            {query && !searching && !hasResults && (
              <div className="flex flex-col items-center justify-center gap-3 py-24">
                <p className="text-4xl">🔍</p>
                <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>
                  No results for &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs" style={{ color: "var(--text-5)" }}>
                  Try a different keyword, artist name, or tag
                </p>
              </div>
            )}

            {/* ── Accounts tab ── */}
            {!searching && (resultTab === "All" || resultTab === "Accounts") && searchAccounts.length > 0 && (
              <section className="px-4 pt-5">
                {resultTab === "All" && (
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={14} style={{ color: "var(--text-5)" }} />
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-5)" }}>
                      Accounts
                    </p>
                    <span className="text-xs" style={{ color: "var(--text-6)" }}>
                      {searchAccounts.length}
                    </span>
                  </div>
                )}
                <div className="flex flex-col">
                  {searchAccounts.map(a => (
                    <Link
                      key={a.clerk_id}
                      href={`/u/${a.username ?? a.clerk_id}`}
                      onClick={closeSearch}
                      className="flex items-center gap-3 py-3 transition-all"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.avatar_url ?? `https://i.pravatar.cc/80?u=${a.clerk_id}`}
                        alt={a.display_name ?? "Artist"}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                        style={{ border: "2px solid rgba(124,91,245,0.3)" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
                          {a.display_name ?? a.username}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: "var(--text-5)" }}>
                          <span>@{a.username}</span>
                          {a.location && (
                            <>
                              <span>·</span>
                              <MapPin size={10} />
                              <span className="truncate">{a.location}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(124,91,245,0.12)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.2)" }}
                          >
                            {a.tag}
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--text-6)" }}>
                            {a.followers_count.toLocaleString()} followers
                          </span>
                        </div>
                      </div>
                      <span className="text-xs shrink-0" style={{ color: "#9B7CF5" }}>View →</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── Posts tab ── */}
            {!searching && (resultTab === "All" || resultTab === "Posts") && searchPosts.length > 0 && (
              <section className={resultTab === "All" ? "px-4 pt-6 pb-8" : "px-4 pt-5 pb-8"}>
                {resultTab === "All" && (
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-5)" }}>
                      Posts
                    </p>
                    <span className="text-xs" style={{ color: "var(--text-6)" }}>
                      {searchPosts.length}
                    </span>
                  </div>
                )}
                <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3">
                  {searchPosts.map(p => (
                    <Link
                      key={p.id}
                      href={`/feed/${p.id}`}
                      onClick={closeSearch}
                      className="block break-inside-avoid mb-3 group"
                    >
                      <div className="relative overflow-hidden rounded-2xl"
                        style={{ boxShadow: "0 4px 20px var(--shadow)" }}>
                        <Image
                          src={p.image_url}
                          alt={p.title}
                          width={400}
                          height={500}
                          className="w-full object-cover transition-all duration-300 group-hover:scale-[1.03] group-hover:brightness-110"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                        {p.category && (
                          <span
                            className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(0,0,0,0.65)", color: "#fff", backdropFilter: "blur(4px)" }}
                          >
                            {p.category}
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-2xl" />
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 px-0.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.author_avatar ?? `https://i.pravatar.cc/40`}
                          alt={p.author_name}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                        <span className="text-xs truncate flex-1 min-w-0" style={{ color: "var(--text-4)" }}>
                          {p.author_name || p.author_username}
                        </span>
                        <span className="text-[10px] shrink-0" style={{ color: "var(--text-5)" }}>
                          ♥ {p.likes_count}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
