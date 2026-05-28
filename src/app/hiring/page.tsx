"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import { ArrowRight, Search } from "lucide-react";
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

const JOBS = [
  { id: 1,  role: "Senior Product Designer",  company: "Airbnb",       location: "Remote",        type: "Full-time", medium: "UI/UX"          },
  { id: 2,  role: "Brand Designer",           company: "Spotify",      location: "New York, US",  type: "Full-time", medium: "Branding"       },
  { id: 3,  role: "Motion Designer",          company: "Netflix",      location: "Remote",        type: "Contract",  medium: "Motion"         },
  { id: 4,  role: "UI Designer",              company: "Figma",        location: "San Francisco", type: "Full-time", medium: "UI/UX"          },
  { id: 5,  role: "Illustrator",              company: "Adobe",        location: "Remote",        type: "Part-time", medium: "Illustration"   },
  { id: 6,  role: "Creative Director",        company: "Meta",         location: "London, UK",    type: "Full-time", medium: "Branding"       },
  { id: 7,  role: "Watercolour Artist",       company: "Etsy",         location: "Remote",        type: "Freelance", medium: "watercolours"   },
  { id: 8,  role: "Portrait Photographer",    company: "Shutterstock", location: "Remote",        type: "Contract",  medium: "portraits"      },
  { id: 9,  role: "Graffiti Artist",          company: "Nike",         location: "Berlin, DE",    type: "Contract",  medium: "graffiti"       },
  { id: 10, role: "Ceramic Designer",         company: "West Elm",     location: "Austin, TX",    type: "Full-time", medium: "ceramics"       },
  { id: 11, role: "Charcoal Illustrator",     company: "Penguin",      location: "Remote",        type: "Freelance", medium: "charcoal sketch" },
  { id: 12, role: "Metal Sculptor",           company: "Etsy",         location: "Remote",        type: "Freelance", medium: "metal work"     },
];

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  "Full-time": { bg: "rgba(54,30,123,0.2)",   color: "#9B7CF5" },
  "Contract":  { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" },
  "Part-time": { bg: "rgba(16,185,129,0.15)", color: "#10B981" },
  "Freelance": { bg: "rgba(59,130,246,0.15)", color: "#60A5FA" },
};

export default function HiringPage() {
  const [query, setQuery]       = useState("");
  const [searched, setSearched] = useState(false);
  const [active, setActive]     = useState("");

  function doSearch(term: string) {
    setQuery(term);
    setActive(term);
    setSearched(true);
  }

  const results = JOBS.filter(j =>
    !active ||
    j.role.toLowerCase().includes(active.toLowerCase()) ||
    j.medium.toLowerCase().includes(active.toLowerCase()) ||
    j.company.toLowerCase().includes(active.toLowerCase())
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
            <div className="pt-6">
              {/* Back + live search */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => { setSearched(false); setQuery(""); setActive(""); }}
                  className="text-sm transition-opacity hover:opacity-70 shrink-0"
                  style={{ color: "var(--text-4)" }}
                >
                  ← Back
                </button>
                <div
                  className="flex items-center gap-2 flex-1 max-w-sm px-4 py-2 rounded-full"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <Search size={13} style={{ color: "var(--text-5)" }} />
                  <input
                    value={query}
                    onChange={e => { setQuery(e.target.value); setActive(e.target.value); }}
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: "var(--text-1)" }}
                  />
                </div>
              </div>

              {/* Category pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: "none" }}>
                {MEDIUM_TILES.map(({ label }: { label: string; seeds: string[]; border: string; bg: string }) => (
                  <button
                    key={label}
                    onClick={() => { setActive(label); setQuery(label); }}
                    className="shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: active === label ? "linear-gradient(135deg,#361E7B,#7C5BF5)" : "var(--bg-card)",
                      color:      active === label ? "#fff" : "var(--text-4)",
                      border:     active === label ? "1px solid transparent" : "1px solid var(--border)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-1)" }}>
                Open Roles
                <span className="text-sm font-normal ml-2" style={{ color: "var(--text-5)" }}>({results.length})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map(({ id, role, company, location, type }) => {
                  const tc = TYPE_COLORS[type] ?? TYPE_COLORS["Full-time"];
                  return (
                    <div
                      key={id}
                      className="flex flex-col gap-4 p-5 rounded-2xl transition-all hover:scale-[1.01] cursor-pointer"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 2px 16px rgba(0,0,0,0.12)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,91,245,0.4)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold"
                          style={{ background: "rgba(124,91,245,0.12)", border: "1px solid rgba(124,91,245,0.2)", color: "#9B7CF5" }}
                        >
                          {company[0]}
                        </div>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: tc.bg, color: tc.color }}>
                          {type}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-[15px] mb-0.5" style={{ color: "var(--text-1)" }}>{role}</p>
                        <p className="text-sm" style={{ color: "var(--text-4)" }}>{company}</p>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs" style={{ color: "var(--text-5)" }}>{location}</span>
                        <button
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80"
                          style={{ background: "#361E7B" }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {results.length === 0 && (
                <div className="text-center py-20" style={{ color: "var(--text-5)" }}>No roles found for "{active}"</div>
              )}
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
