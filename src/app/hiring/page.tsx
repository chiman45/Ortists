"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import { ARTISTS } from "@/lib/hiringData";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Search, SlidersHorizontal, Star, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const MEDIUM_TILES = [
  { label: "acrylic paint",   seeds: ["acrylic1","acrylic2","acrylic3"],   border: "#4F6EF7", bg: "rgba(79,110,247,0.12)"  },
  { label: "watercolours",    seeds: ["water1","water2","water3"],         border: "#C9A84C", bg: "rgba(201,168,76,0.12)"  },
  { label: "portraits",       seeds: ["portrait1","portrait2","portrait3"],border: "#9B7CF5", bg: "rgba(124,91,245,0.12)"  },
  { label: "ceramics",        seeds: ["ceramic1","ceramic2","ceramic3"],   border: "#E05252", bg: "rgba(224,82,82,0.12)"   },
  { label: "oil pastels",     seeds: ["oil1","oil2","oil3"],               border: "#3FBFA0", bg: "rgba(63,191,160,0.12)"  },
  { label: "pencil colours",  seeds: ["pencil1","pencil2","pencil3"],      border: "#4CAF50", bg: "rgba(76,175,80,0.12)"   },
  { label: "origami",         seeds: ["origami1","origami2","origami3"],   border: "#888",    bg: "rgba(136,136,136,0.10)" },
  { label: "charcoal sketch", seeds: ["charcoal1","charcoal2","charcoal3"],border: "#D04040", bg: "rgba(208,64,64,0.12)"   },
  { label: "graffiti",        seeds: ["graffiti1","graffiti2","graffiti3"],border: "#4F6EF7", bg: "rgba(79,110,247,0.12)"  },
  { label: "metal work",      seeds: ["metal1","metal2","metal3"],         border: "#777",    bg: "rgba(120,120,120,0.10)" },
];

type Artist = typeof ARTISTS[number];

interface ResultsProps {
  active: string; query: string; results: Artist[];
  onQueryChange: (q: string) => void;
  onBack: () => void;
}

function ResultsView({ active, query, results, onQueryChange, onBack }: ResultsProps) {
  const [fi, setFi] = useState(Math.min(1, results.length - 1));
  const featured = results.slice(0, Math.min(5, results.length));

  const label = active
    ? active.charAt(0).toUpperCase() + active.slice(1) + " Artists"
    : "All Artists";

  return (
    <div className="pt-6 pb-10">

      {/* Page header */}
      <div className="mb-6">
        <button onClick={onBack} className="text-xs mb-3 transition-opacity hover:opacity-70 inline-block" style={{ color: "var(--text-5)" }}>← Back</button>
        <h1 className="text-2xl font-black mb-1" style={{ color: "var(--text-1)" }}>{label}</h1>
        <p className="text-sm mb-4" style={{ color: "var(--text-5)" }}>
          Discover exceptional {active || "creative"} artists for your next project
        </p>
        <div className="flex gap-3">
          <div
            className="flex items-center gap-2 flex-1 max-w-sm px-4 py-2.5 rounded-full"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <Search size={13} style={{ color: "var(--text-5)" }} />
            <input
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              placeholder="Search artists..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--text-1)" }}
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium shrink-0"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-3)" }}
          >
            <SlidersHorizontal size={14} /> Filter
          </button>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--text-5)" }}>No artists found for "{active}"</div>
      ) : (
        <>
          {/* ── Featured Artists carousel ── */}
          {featured.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>Featured Artists</h2>
                <button className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: "#9B7CF5" }}>View All</button>
              </div>

              <div className="relative" style={{ height: 300 }}>
                {/* Prev arrow */}
                <button
                  onClick={() => setFi(f => Math.max(0, f - 1))}
                  disabled={fi === 0}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-opacity disabled:opacity-20 hover:opacity-80"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-3)" }}
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Cards track */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ overflow: "hidden" }}>
                  {featured.map((a, i) => {
                    const dist = i - fi;
                    const abs  = Math.abs(dist);
                    if (abs > 2) return null;
                    const isActive = dist === 0;
                    return (
                      <div
                        key={a.id}
                        onClick={() => setFi(i)}
                        className="absolute cursor-pointer"
                        style={{
                          width: isActive ? 200 : 155,
                          height: isActive ? 280 : 230,
                          borderRadius: 18,
                          overflow: "hidden",
                          transform: `translateX(${dist * 195}px)`,
                          zIndex: 10 - abs,
                          transition: "all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
                          boxShadow: isActive
                            ? "0 0 40px rgba(124,91,245,0.45), 0 8px 32px rgba(0,0,0,0.4)"
                            : "0 4px 16px rgba(0,0,0,0.3)",
                          border: isActive ? "1.5px solid rgba(124,91,245,0.6)" : "1px solid var(--border)",
                        }}
                      >
                        {/* Cover image */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://picsum.photos/seed/${a.cover}/400/600`}
                          alt={a.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Dark overlay */}
                        <div
                          className="absolute inset-0"
                          style={{ background: isActive ? "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)" : "rgba(0,0,0,0.45)" }}
                        />
                        {/* Info at bottom */}
                        <div className="absolute bottom-0 inset-x-0 p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={a.avatar} alt={a.name} className="w-7 h-7 rounded-full object-cover shrink-0" style={{ border: "1.5px solid rgba(255,255,255,0.7)" }} />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate leading-none">{a.name}</p>
                              <p className="text-[10px] text-white/60 truncate capitalize">{a.medium[0]}</p>
                            </div>
                          </div>
                          {isActive && (
                            <>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="flex items-center gap-0.5 text-[11px] text-white/80">
                                  <Star size={10} fill="currentColor" className="text-yellow-400" style={{ color: "#FBBF24" }} />
                                  {a.rating}
                                </span>
                                <span className="text-[11px] text-white/60">From ${a.price.toLocaleString()}</span>
                              </div>
                              <Link
                                href={`/artists/${a.id}`}
                                className="w-full py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-85 text-center block"
                                style={{ background: "#7C5BF5" }}
                              >
                                View Profile
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Next arrow */}
                <button
                  onClick={() => setFi(f => Math.min(featured.length - 1, f + 1))}
                  disabled={fi === featured.length - 1}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-opacity disabled:opacity-20 hover:opacity-80"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-3)" }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </section>
          )}

          {/* ── All Artists grid ── */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>All Artists</h2>
              <span className="text-sm" style={{ color: "var(--text-5)" }}>{results.length} results</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.map(a => (
                <div
                  key={a.id}
                  className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.01]"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 2px 16px rgba(0,0,0,0.15)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,91,245,0.4)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
                >
                  {/* Artwork image */}
                  <div className="relative" style={{ height: 160 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://picsum.photos/seed/${a.cover}/400/300`}
                      alt={a.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Commission badge */}
                    {a.available && (
                      <span
                        className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
                        style={{ background: "rgba(124,91,245,0.85)", backdropFilter: "blur(8px)" }}
                      >
                        Open for Commission
                      </span>
                    )}
                    {/* Avatar overlap */}
                    <div className="absolute -bottom-5 left-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.avatar}
                        alt={a.name}
                        className="w-10 h-10 rounded-full object-cover"
                        style={{ border: "2.5px solid var(--bg-card)" }}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="pt-7 px-4 pb-4">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="text-sm font-bold leading-none mb-0.5" style={{ color: "var(--text-1)" }}>{a.name}</p>
                        <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-5)" }}>
                          <MapPin size={10} /> {a.location}
                        </div>
                      </div>
                      <span className="text-sm font-bold" style={{ color: "var(--text-1)" }}>${a.price.toLocaleString()}</span>
                    </div>

                    {/* Medium tags */}
                    <div className="flex flex-wrap gap-1 mt-2 mb-3">
                      {a.medium.map(m => (
                        <span key={m} className="text-[10px] capitalize px-2 py-0.5 rounded-full" style={{ background: "var(--bg-subtle)", color: "var(--text-4)", border: "1px solid var(--border)" }}>{m}</span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 mb-3 text-[11px]" style={{ color: "var(--text-5)" }}>
                      <span className="flex items-center gap-1"><Users size={11} /> {a.followers}</span>
                      <span className="flex items-center gap-1"><Star size={11} fill="currentColor" style={{ color: "#FBBF24" }} /> {a.rating}</span>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                      <Link
                        href={`/artists/${a.id}`}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 text-center block"
                        style={{ background: "var(--bg-subtle)", color: "var(--text-2)", border: "1px solid var(--border)" }}
                      >
                        View
                      </Link>
                      <button
                        className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-85"
                        style={{ background: "#7C5BF5" }}
                      >
                        Request
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function HiringPage() {
  const [query, setQuery]       = useState("");
  const [searched, setSearched] = useState(false);
  const [active, setActive]     = useState("");

  function doSearch(term: string) {
    setQuery(term);
    setActive(term);
    setSearched(true);
  }

  const results = ARTISTS.filter(a =>
    !active ||
    a.name.toLowerCase().includes(active.toLowerCase()) ||
    a.medium.some(m => m.toLowerCase().includes(active.toLowerCase())) ||
    a.location.toLowerCase().includes(active.toLowerCase())
  );

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
        <MainHeader />

        <main className="flex-1 px-4 md:px-8 pb-24 lg:pb-8">
          {!searched ? (

            /* ── Landing: search + tiles ── */
            <div className="flex flex-col items-center pt-16 pb-10">
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#9B7CF5" }}>
                Hire on ORTISTS
              </p>
              <h1 className="text-4xl md:text-5xl font-black text-center mb-3" style={{ color: "var(--text-1)" }}>
                Who are you looking for?
              </h1>
              <p className="text-base text-center mb-10 max-w-md" style={{ color: "var(--text-4)" }}>
                Browse artists by medium and find the right person for your project.
              </p>

              {/* Search */}
              <div
                className="flex items-center w-full max-w-xl rounded-full px-5 py-3.5 mb-10 gap-3"
                style={{ background: "var(--bg-card)", border: "1px solid rgba(124,91,245,0.35)", boxShadow: "0 0 32px rgba(124,91,245,0.12)" }}
              >
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && query.trim() && doSearch(query.trim())}
                  placeholder="search a medium – acrylic, watercolours, portraits"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--text-2)" }}
                />
                <button
                  onClick={() => query.trim() && doSearch(query.trim())}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-opacity hover:opacity-80"
                  style={{ background: "#7C5BF5" }}
                >
                  <ArrowRight size={16} color="#fff" />
                </button>
              </div>

              <p className="text-xs mb-6" style={{ color: "var(--text-5)" }}>or select a category to browse freelancers:</p>

              {/* Tiles */}
              <div className="grid gap-3 w-full max-w-2xl" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))" }}>
                {MEDIUM_TILES.map(({ label, seeds, border, bg }) => (
                  <button
                    key={label}
                    onClick={() => doSearch(label)}
                    className="relative overflow-hidden rounded-2xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                    style={{ height: 96, border: `1.5px solid ${border}`, background: bg }}
                  >
                    {/* Stacked images filling upper area */}
                    <div className="absolute inset-0 flex items-center justify-center gap-0" style={{ paddingBottom: 28 }}>
                      <div className="relative" style={{ width: 110, height: 64 }}>
                        {seeds.map((seed, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={seed}
                            src={`https://picsum.photos/seed/${seed}/120/160`}
                            alt=""
                            className="absolute object-cover"
                            style={{
                              width: 46,
                              height: 58,
                              borderRadius: 10,
                              border: "1.5px solid rgba(255,255,255,0.22)",
                              left: "50%",
                              top: "50%",
                              transform: `translate(calc(-50% + ${(i - 1) * 22}px), -50%) rotate(${(i - 1) * 7}deg)`,
                              zIndex: i === 1 ? 3 : i === 0 ? 2 : 1,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Glass text strip at bottom */}
                    <div
                      className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-3 py-1.5 z-10"
                      style={{
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 12,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
                      }}
                    >
                      <span className="text-[11px] font-semibold text-white leading-tight">{label}</span>
                      <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                        <ArrowRight size={9} color="#111" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          ) : (

            /* ── Results view ── */
            <ResultsView
              active={active}
              query={query}
              results={results}
              onQueryChange={q => { setQuery(q); setActive(q); }}
              onBack={() => { setSearched(false); setQuery(""); setActive(""); }}
            />
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
