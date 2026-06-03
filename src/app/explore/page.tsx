"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import { type Profile } from "@/lib/db/profiles";
import { MapPin, Search, Star, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

async function fetchProfiles(q = ""): Promise<Profile[]> {
  const url = q.trim() ? `/api/profiles?q=${encodeURIComponent(q)}` : "/api/profiles";
  const res = await fetch(url);
  const json = await res.json();
  return json.profiles ?? [];
}

async function fetchCount(): Promise<number> {
  const res = await fetch("/api/profiles?count=1");
  const json = await res.json();
  return json.count ?? 0;
}

export default function ExplorePage() {
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<Profile[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading]       = useState(true);

  // Load total count + initial profiles
  useEffect(() => {
    fetchCount().then(setTotalCount);
    fetchProfiles().then(data => {
      setResults(data);
      setLoading(false);
    });
  }, []);

  // Search on query change
  useEffect(() => {
    if (!query.trim()) {
      fetchProfiles().then(data => {
        setResults(data);
        setLoading(false);
      });
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      fetchProfiles(query).then(data => {
        setResults(data);
        setLoading(false);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div
      className="flex min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 8% 50%, rgba(54,30,123,0.14) 0%, transparent 55%)," +
          "var(--bg)",
      }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">
        <MainHeader />

        <main className="flex-1 px-4 md:px-8 py-6 pb-24 lg:pb-8">
          {/* Header */}
          <div className="mb-7">
            <h1 className="text-2xl font-black mb-1" style={{ color: "var(--text-1)" }}>
              Explore Artists
            </h1>
            <p className="text-sm mb-5" style={{ color: "var(--text-5)" }}>
              Discover talented artists from around the world
            </p>

            {/* Search bar */}
            <div
              className="flex items-center gap-3 max-w-md px-4 py-3 rounded-2xl"
              style={{
                background: "var(--bg-card)",
                border: "1px solid rgba(124,91,245,0.3)",
                boxShadow: "0 0 20px rgba(124,91,245,0.08)",
              }}
            >
              <Search size={16} style={{ color: "var(--text-5)" }} />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name or username…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--text-1)" }}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-xs transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-5)" }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Stats (show when not searching) */}
          {!query && (
            <div className="flex gap-4 mb-7">
              {[
                {
                  label: "Total Artists",
                  value: totalCount === null ? "…" : totalCount.toLocaleString(),
                },
                {
                  label: "Available",
                  value: results.filter(p => p.available).length.toString(),
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="px-4 py-2 rounded-xl"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <p className="text-lg font-black" style={{ color: "#9B7CF5" }}>{value}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-5)" }}>{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Search result count */}
          {query && !loading && (
            <p className="text-xs mb-5" style={{ color: "var(--text-5)" }}>
              {results.length === 0
                ? `No results for "${query}"`
                : `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`}
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl animate-pulse"
                  style={{ height: 200, background: "var(--bg-card)" }}
                />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-2)" }}>
                No artists found
              </p>
              <p className="text-xs" style={{ color: "var(--text-5)" }}>
                Try a different name or username
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {results.map(p => (
                <Link
                  key={p.clerk_id}
                  href={`/u/${p.username ?? p.clerk_id}`}
                  className="rounded-2xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer block"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(124,91,245,0.4)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
                  }}
                >
                  {/* Cover */}
                  <div
                    className="relative h-24 w-full"
                    style={{ background: "linear-gradient(135deg, #1a0a3a, #2d1b69)" }}
                  >
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        background: `url(https://picsum.photos/seed/${p.clerk_id}/400/100) center/cover`,
                      }}
                    />
                    {p.available && (
                      <span
                        className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(16,185,129,0.85)", color: "#fff" }}
                      >
                        Available
                      </span>
                    )}
                    <div className="absolute -bottom-6 left-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.avatar_url ?? `https://i.pravatar.cc/80?u=${p.clerk_id}`}
                        alt={p.display_name ?? "Artist"}
                        className="w-12 h-12 rounded-full object-cover"
                        style={{ border: "3px solid var(--bg-card)" }}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="pt-8 px-4 pb-4">
                    <p
                      className="text-sm font-bold leading-none mb-0.5"
                      style={{ color: "var(--text-1)" }}
                    >
                      {p.display_name ?? p.username}
                    </p>
                    <p className="text-xs mb-1" style={{ color: "#9B7CF5" }}>
                      @{p.username}
                    </p>
                    {p.location && (
                      <div className="flex items-center gap-1 mb-2">
                        <MapPin size={10} style={{ color: "var(--text-5)" }} />
                        <span className="text-[11px]" style={{ color: "var(--text-5)" }}>
                          {p.location}
                        </span>
                      </div>
                    )}
                    {p.bio && (
                      <p
                        className="text-[11px] leading-relaxed mb-3 line-clamp-2"
                        style={{ color: "var(--text-4)" }}
                      >
                        {p.bio}
                      </p>
                    )}
                    <div
                      className="flex items-center gap-3 mb-3 text-[11px]"
                      style={{ color: "var(--text-5)" }}
                    >
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {p.followers_count.toLocaleString()}
                      </span>
                      {p.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star size={11} style={{ color: "#FBBF24" }} /> {p.rating}
                        </span>
                      )}
                    </div>
                    <span
                      className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        background: "rgba(124,91,245,0.12)",
                        color: "#9B7CF5",
                        border: "1px solid rgba(124,91,245,0.2)",
                      }}
                    >
                      {p.tag}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
