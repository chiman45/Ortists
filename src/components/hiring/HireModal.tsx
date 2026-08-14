"use client";

import { useUser } from "@clerk/nextjs";
import { ChevronRight, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Artist } from "@/lib/hiringData";

interface Props {
  artist: Artist;
  artistClerkId?: string;
  onClose: () => void;
}

const INTENDED_USE_OPTIONS = [
  "Personal", "Social Media", "Brand / Business",
  "Advertising", "Editorial", "Commercial Product",
];

function Section({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
          {optional && <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>optional</span>}
        </div>
        <Plus size={13} style={{ color: "rgba(255,255,255,0.22)" }} />
      </div>
      <div className="h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
      {children}
    </div>
  );
}

export default function HireModal({ artist, artistClerkId, onClose }: Props) {
  const { user } = useUser();
  const router   = useRouter();

  const [brief, setBrief]             = useState("");
  const [description, setDescription] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [deadlineType, setDeadlineType] = useState<"specific" | "flexible">("specific");
  const [deadline, setDeadline]       = useState("");
  const [intendedUse, setIntendedUse] = useState<string[]>([]);
  const [refInput, setRefInput]       = useState("");
  const [references, setReferences]   = useState<string[]>([]);
  const [budget, setBudget]           = useState("");
  const [activeTab, setActiveTab]     = useState<"portfolio" | "reviews">("portfolio");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  function toggleUse(u: string) {
    setIntendedUse(prev => prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]);
  }

  function addRef() {
    const val = refInput.trim();
    if (val) { setReferences(prev => [...prev, val]); setRefInput(""); }
  }

  async function handleSubmit() {
    if (!user) return;
    if (deadlineType === "specific" && !deadline) {
      setError("Please set a project deadline.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fullDesc = [brief, description, deliverables ? `Deliverables: ${deliverables}` : "", references.length ? `References:\n${references.join("\n")}` : ""].filter(Boolean).join("\n\n");
      const res = await fetch("/api/hire-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:           user.id,
          client_name:         user.fullName ?? user.username ?? null,
          client_avatar:       user.imageUrl ?? null,
          artist_id:           artist.id,
          artist_clerk_id:     artistClerkId ?? null,
          artist_name:         artist.name,
          artist_avatar:       artist.avatar,
          artist_location:     artist.location,
          artist_rating:       artist.rating,
          project_title:       `Commission — ${artist.name}`,
          project_description: fullDesc || null,
          budget:              budget ? Number(budget) : null,
          deadline:            deadlineType === "specific" ? deadline || null : null,
          priority:            "High",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create request");
      router.push(`/hiring/projects/${json.request.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  // Estimated stats from artist data
  const followersNum = parseInt(artist.followers.replace(/[^0-9]/g, "")) * (artist.followers.includes("k") ? 1000 : 1);
  const reviewCount  = Math.max(5, Math.round(followersNum / 500));
  const projectCount = Math.max(8, Math.round(followersNum / 300));

  // Portfolio placeholder images seeded by artist name
  const portfolioImgs = Array.from({ length: 4 }, (_, i) =>
    `https://picsum.photos/seed/${encodeURIComponent(artist.name)}${i + 1}/400/300`
  );
  const heroImg = `https://picsum.photos/seed/${encodeURIComponent(artist.name)}hero/800/500`;

  return (
    <div className="flex h-full w-full">

      {/* ── Left panel: Artist profile ── */}
      <div
        className="hidden lg:flex flex-col overflow-y-auto shrink-0"
        style={{ width: 500, background: "#080413", scrollbarWidth: "none" }}
      >
        {/* Hero artwork */}
        <div className="relative shrink-0" style={{ height: 340 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImg} alt={artist.name} className="w-full h-full object-cover" draggable={false} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 35%, #080413 100%)" }} />

          {/* Available badge */}
          <div
            className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background:     artist.available ? "rgba(16,185,129,0.18)" : "rgba(245,158,11,0.18)",
              color:          artist.available ? "#10B981" : "#F59E0B",
              border:         `1px solid ${artist.available ? "rgba(16,185,129,0.35)" : "rgba(245,158,11,0.35)"}`,
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: artist.available ? "#10B981" : "#F59E0B" }} />
            {artist.available ? "Available now" : "Busy"}
          </div>

          {/* Artist info overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 flex flex-col gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artist.avatar}
              alt={artist.name}
              className="w-12 h-12 rounded-full object-cover"
              style={{ border: "2px solid rgba(255,255,255,0.18)" }}
            />
            <h2 className="text-2xl font-bold text-white leading-tight">{artist.name}</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              {artist.location}
              {artist.price ? <> · <span style={{ color: "#10B981" }}>From €{artist.price.toLocaleString()}</span></> : ""}
            </p>
          </div>
        </div>

        {/* Bio + stats + portfolio */}
        <div className="px-6 py-5 flex flex-col gap-5">

          {/* Bio */}
          {artist.bio && (
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>{artist.bio}</p>
          )}

          {/* Stats grid */}
          <div
            className="grid grid-cols-3 rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
          >
            {[
              { value: projectCount,                    label: "Projects"             },
              { value: `${artist.rating} ★`,            label: `${reviewCount} reviews` },
              { value: "< 12 h",                        label: "Response"             },
            ].map((s, i) => (
              <div
                key={i}
                className="p-4 text-center"
                style={{ borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none" }}
              >
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            {(["portfolio", "reviews"] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className="px-4 pb-2.5 pt-1 text-sm font-semibold uppercase tracking-wide transition-all"
                style={{
                  color:        activeTab === t ? "#fff" : "rgba(255,255,255,0.35)",
                  borderBottom: activeTab === t ? "2px solid #7C5BF5" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {t === "reviews" ? `Reviews (${reviewCount})` : "Portfolio"}
              </button>
            ))}
          </div>

          {/* Portfolio grid */}
          {activeTab === "portfolio" && (
            <div className="grid grid-cols-2 gap-2 pb-4">
              {portfolioImgs.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`Portfolio ${i + 1}`}
                  className="w-full rounded-xl object-cover"
                  style={{ height: 148 }}
                  draggable={false}
                />
              ))}
            </div>
          )}

          {activeTab === "reviews" && (
            <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.3)" }}>No reviews yet</p>
          )}
        </div>
      </div>

      {/* ── Right panel: Commission form ── */}
      <div
        className="flex-1 flex flex-col min-w-0 overflow-y-auto relative"
        style={{ background: "#06030f", borderLeft: "1px solid rgba(255,255,255,0.05)", scrollbarWidth: "none" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}
        >
          <X size={15} />
        </button>

        {/* Form body */}
        <div className="flex-1 px-8 pt-8 pb-6 flex flex-col gap-8 max-w-lg mx-auto w-full">

          {/* Heading */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold tracking-widest" style={{ color: "#7C5BF5" }}>HIRE REQUEST</p>
            <h1 className="text-4xl font-bold leading-snug" style={{ color: "var(--text-1)" }}>
              Commission<br />
              <em style={{ color: "#7C5BF5", fontStyle: "italic" }}>{artist.name}</em>
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
              Tell the artist about your project. They&apos;ll review your brief and come back with a proposal.
            </p>
          </div>

          {/* BRIEF */}
          <Section label="BRIEF">
            <textarea
              value={brief}
              onChange={e => setBrief(e.target.value)}
              placeholder="Tell the artist what you need..."
              rows={3}
              className="w-full bg-transparent text-sm outline-none resize-none"
              style={{ color: "rgba(255,255,255,0.82)", caretColor: "#7C5BF5" }}
            />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what you'd like them to create — the more context, the better."
              rows={2}
              className="w-full bg-transparent text-sm outline-none resize-none"
              style={{ color: "rgba(255,255,255,0.82)", caretColor: "#7C5BF5" }}
            />
          </Section>

          {/* DELIVERABLES */}
          <Section label="DELIVERABLES">
            <textarea
              value={deliverables}
              onChange={e => setDeliverables(e.target.value)}
              placeholder="What should the artist deliver?"
              rows={2}
              className="w-full bg-transparent text-sm outline-none resize-none"
              style={{ color: "rgba(255,255,255,0.82)", caretColor: "#7C5BF5" }}
            />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>e.g. 1 portrait illustration + source files</p>
          </Section>

          {/* DEADLINE */}
          <Section label="DEADLINE">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Toggle */}
              <div className="flex rounded-xl overflow-hidden shrink-0" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                {(["specific", "flexible"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setDeadlineType(t)}
                    className="px-4 py-2 text-xs font-semibold transition-all"
                    style={{
                      background: deadlineType === t ? "#7C5BF5" : "transparent",
                      color:      deadlineType === t ? "#fff"    : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {t === "specific" ? "Specific date" : "Flexible"}
                  </button>
                ))}
              </div>

              {/* Date picker */}
              {deadlineType === "specific" && (
                <input
                  type="date"
                  value={deadline}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setDeadline(e.target.value)}
                  className="bg-transparent text-sm outline-none"
                  style={{
                    color:       deadline ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.3)",
                    colorScheme: "dark",
                  }}
                />
              )}
            </div>
          </Section>

          {/* INTENDED USE */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>INTENDED USE</p>
            <div className="h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            <div className="flex flex-wrap gap-2">
              {INTENDED_USE_OPTIONS.map(u => {
                const active = intendedUse.includes(u);
                return (
                  <button
                    key={u}
                    onClick={() => toggleUse(u)}
                    className="px-4 py-2 rounded-full text-xs font-medium transition-all hover:opacity-80"
                    style={{
                      background: active ? "rgba(124,91,245,0.18)" : "transparent",
                      border:     `1px solid ${active ? "rgba(124,91,245,0.5)" : "rgba(255,255,255,0.14)"}`,
                      color:      active ? "#9B7CF5" : "rgba(255,255,255,0.55)",
                    }}
                  >
                    {u}
                  </button>
                );
              })}
            </div>
          </div>

          {/* REFERENCES */}
          <Section label="REFERENCES">
            <div className="flex items-center gap-3">
              <input
                value={refInput}
                onChange={e => setRefInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addRef())}
                placeholder="https://..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "rgba(255,255,255,0.82)", caretColor: "#7C5BF5" }}
              />
              <button
                onClick={addRef}
                className="text-xs font-bold shrink-0 transition-opacity hover:opacity-70"
                style={{ color: "#7C5BF5" }}
              >
                + Add
              </button>
            </div>
            {references.length > 0 && (
              <div className="flex flex-col gap-1">
                {references.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "#9B7CF5" }}>
                    <span className="flex-1 truncate">{r}</span>
                    <button onClick={() => setReferences(prev => prev.filter((_, j) => j !== i))} style={{ color: "rgba(255,255,255,0.3)" }}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>Moodboard, Pinterest, Drive link, or anything visual.</p>
          </Section>

          {/* BUDGET */}
          <Section label="BUDGET" optional>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>€</span>
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="—"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "rgba(255,255,255,0.82)", caretColor: "#7C5BF5" }}
              />
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>Leave blank and the artist will propose a price.</p>
          </Section>
        </div>

        {/* ── Sticky footer ── */}
        <div
          className="sticky bottom-0 px-8 py-4 flex items-center justify-between gap-4"
          style={{
            background:    "rgba(6,3,15,0.96)",
            borderTop:     "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
          }}
        >
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
            No payment yet. The artist responds with a proposal.
          </p>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {error && <p className="text-xs" style={{ color: "#F87171" }}>{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}
            >
              {loading ? "Sending…" : "Send hire request"}
              {!loading && <ChevronRight size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
