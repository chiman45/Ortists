"use client";

import { useUser } from "@clerk/nextjs";
import { ChevronRight, ImagePlus, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Artist } from "@/lib/hiringData";
import WallPreview from "@/components/ui/WallPreview";
import { CANVAS_CATEGORIES, CUSTOM_INCHES, artistSizePrice, categoryById, framePrice, sizeLabel } from "@/lib/canvasSizes";
import { withPlatformFee } from "@/lib/pricing";

interface Props {
  artist: Artist;
  artistClerkId?: string;
  onClose: () => void;
}

const INTENDED_USE_OPTIONS = [
  "Personal", "Social Media", "Brand / Business",
  "Advertising", "Editorial", "Commercial Product",
];

function SectionLabel({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-[10px] font-bold tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
      {optional && <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>optional</span>}
    </div>
  );
}

function Field({ innerLabel, hint, children }: { innerLabel?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="hire-field px-4 py-3 flex flex-col gap-1.5">
      {innerLabel && (
        <p className="text-[10px] font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.32)" }}>{innerLabel}</p>
      )}
      {children}
      {hint && <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.22)" }}>{hint}</p>}
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
  const [uploadingRefs, setUploadingRefs] = useState(false);
  const refFileInput                  = useRef<HTMLInputElement>(null);
  const [budget, setBudget]           = useState("");
  // Canvas size (inches). Listed sizes come from the price sheet; custom = any W × H.
  const [sizeW, setSizeW]             = useState<number | null>(null);
  const [sizeH, setSizeH]             = useState<number | null>(null);
  const [sizeCat, setSizeCat]         = useState("square"); // canvas shape tab
  const [withFrame, setWithFrame]     = useState(true);  // floating frame is optional
  // Artist's own price per size (Edit Profile → Pricing). Missing size = quote.
  const [sizePrices, setSizePrices]   = useState<Record<string, number>>({});

  useEffect(() => {
    if (!artistClerkId) return;
    let cancelled = false;
    fetch(`/api/profiles?username=${encodeURIComponent(artistClerkId)}`)
      .then(r => r.json())
      .then(({ profile }) => { if (!cancelled) setSizePrices(profile?.size_prices ?? {}); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [artistClerkId]);
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

  // Reference images: upload to storage and keep the URL alongside pasted links,
  // so the artist receives them in the same References list.
  async function uploadRefImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingRefs(true);
    setError("");
    try {
      for (const file of Array.from(files).slice(0, 6)) {
        if (!file.type.startsWith("image/")) continue;
        const form = new FormData();
        form.append("file", file);
        form.append("bucket", "message-media");
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const { url, error: upErr } = await res.json();
        if (!res.ok || !url) throw new Error(upErr ?? `Could not upload ${file.name}`);
        setReferences(prev => [...prev, url as string]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingRefs(false);
      if (refFileInput.current) refFileInput.current.value = "";
    }
  }

  // Listed sizes have a fixed price; only a custom (unlisted) size goes to the
  // artist as a quote request with the client's own budget.
  const sizePicked   = !!(sizeW && sizeH);
  // Client-facing artwork price for the picked size: the artist's own price for
  // it + platform fee. null when the artist hasn't priced that size.
  const sizeArtPrice = sizePicked ? artistSizePrice(sizePrices, sizeCat, sizeW!, sizeH!) : null;
  const clientArtPrice = sizeArtPrice !== null ? withPlatformFee(sizeArtPrice) : null;
  // Quote request = a size we don't list, or one the artist hasn't priced
  const isCustomSize = sizePicked && clientArtPrice === null;
  const sizeFrame    = sizePicked && withFrame ? framePrice(sizeW!, sizeH!, sizeCat) : null;
  const fixedPrice   = clientArtPrice !== null ? clientArtPrice + (sizeFrame?.price ?? 0) : null;

  const isImageRef = (r: string) => /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(r) || /\/message-media\//.test(r);

  async function handleSubmit() {
    if (!user) return;
    if (!sizePicked) {
      setError("Please choose a canvas size.");
      return;
    }
    if (isCustomSize && !(Number(budget) > 0)) {
      setError("Enter your budget for this custom size.");
      return;
    }
    if (deadlineType === "specific" && !deadline) {
      setError("Please set a project deadline.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const submitFrame = sizeW && sizeH && withFrame ? framePrice(sizeW, sizeH, sizeCat) : null;
      const sizeLine = sizeW && sizeH
        ? `Canvas size: ${categoryById(sizeCat).label} ${sizeLabel(sizeW, sizeH)}` + (submitFrame
            ? ` (floating frame ₹${submitFrame.price.toLocaleString("en-IN")}${submitFrame.exact ? "" : ", approx."})`
            : categoryById(sizeCat).frameable ? " (no frame — artwork only)" : " (sold without a frame)")
        : "";
      const fullDesc = [brief, description, sizeLine, deliverables ? `Deliverables: ${deliverables}` : "", references.length ? `References:\n${references.join("\n")}` : ""].filter(Boolean).join("\n\n");
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
          // Listed size → its fixed price; custom size → the client's budget
          budget:              isCustomSize ? Number(budget) : fixedPrice,
          // Structured canvas size + framing choice (migration 015)
          canvas_width_in:     sizeW ?? null,
          canvas_height_in:    sizeH ?? null,
          with_frame:          sizeW && sizeH ? !!submitFrame : null,
          frame_price:         submitFrame?.price ?? null,
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
              {artist.price ? <> · <span style={{ color: "#10B981" }}>From ₹{artist.price.toLocaleString()}</span></> : ""}
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
          <div className="flex flex-col gap-3">
            <SectionLabel label="BRIEF" />
            <Field innerLabel="SUMMARY" hint="A short headline for what you need">
              <textarea
                value={brief}
                onChange={e => setBrief(e.target.value)}
                placeholder="e.g. Album cover illustration, dark fantasy style"
                rows={2}
                className="w-full bg-transparent text-sm outline-none resize-none"
                style={{ color: "rgba(255,255,255,0.82)", caretColor: "#7C5BF5" }}
              />
            </Field>
            <Field innerLabel="DETAILS" hint="The more context you give, the better the proposal">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the style, mood, references, and any specific requirements..."
                rows={4}
                className="w-full bg-transparent text-sm outline-none resize-none"
                style={{ color: "rgba(255,255,255,0.82)", caretColor: "#7C5BF5" }}
              />
            </Field>
          </div>

          {/* DELIVERABLES */}
          <div className="flex flex-col gap-3">
            <SectionLabel label="DELIVERABLES" />
            <Field hint="e.g. 1 portrait illustration + source files (.ai, .png)">
              <textarea
                value={deliverables}
                onChange={e => setDeliverables(e.target.value)}
                placeholder="What should the artist deliver?"
                rows={2}
                className="w-full bg-transparent text-sm outline-none resize-none"
                style={{ color: "rgba(255,255,255,0.82)", caretColor: "#7C5BF5" }}
              />
            </Field>
          </div>

          {/* DEADLINE */}
          <div className="flex flex-col gap-3">
            <SectionLabel label="DEADLINE" />
            <div className="hire-field px-4 py-3 flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">
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
                {deadlineType === "flexible" && (
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>The artist will suggest a timeline</p>
                )}
              </div>
              {deadlineType === "specific" && (
                <input
                  type="date"
                  value={deadline}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setDeadline(e.target.value)}
                  className="bg-transparent text-sm outline-none w-full"
                  style={{
                    color:       deadline ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.3)",
                    colorScheme: "dark",
                  }}
                />
              )}
            </div>
          </div>

          {/* INTENDED USE */}
          <div className="flex flex-col gap-3">
            <SectionLabel label="INTENDED USE" />
            <div className="hire-field px-4 py-3 flex flex-wrap gap-2">
              {INTENDED_USE_OPTIONS.map(u => {
                const active = intendedUse.includes(u);
                return (
                  <button
                    key={u}
                    onClick={() => toggleUse(u)}
                    className="px-4 py-2 rounded-full text-xs font-medium transition-all hover:opacity-80"
                    style={{
                      background: active ? "rgba(124,91,245,0.18)" : "rgba(255,255,255,0.04)",
                      border:     `1px solid ${active ? "rgba(124,91,245,0.5)" : "rgba(255,255,255,0.1)"}`,
                      color:      active ? "#9B7CF5" : "rgba(255,255,255,0.55)",
                    }}
                  >
                    {u}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CANVAS SIZE */}
          {(() => {
            const cat = categoryById(sizeCat);
            const sizes = cat.sizes;
            const isPicked = (w: number, h: number) => sizeW === w && sizeH === h;
            const picked = !!(sizeW && sizeH);
            // null for shapes sold without a frame (circle, panoramic)
            const frame = sizeW && sizeH ? framePrice(sizeW, sizeH, sizeCat) : null;
            const isListed = picked && sizes.some(s => s.w === sizeW && s.h === sizeH);
            const estimate = fixedPrice;
            const pill = (active: boolean) => ({
              background: active ? "rgba(124,91,245,0.18)" : "rgba(255,255,255,0.04)",
              border:     `1px solid ${active ? "rgba(124,91,245,0.5)" : "rgba(255,255,255,0.1)"}`,
              color:      active ? "#9B7CF5" : "rgba(255,255,255,0.55)",
            });
            const selectStyle = {
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.82)", colorScheme: "dark" as const,
            };
            // Native <option>s don't inherit the select's colours — without this the
            // browser paints them white-on-white in the popup list.
            const optStyle = { background: "#120c2a", color: "#ffffff" };
            return (
              <div className="flex flex-col gap-3">
                <SectionLabel label="CANVAS SIZE" />
                <div className="hire-field px-4 py-3 flex flex-col gap-3">
                  {/* Canvas shape tabs */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                    {CANVAS_CATEGORIES.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setSizeCat(c.id); setSizeW(null); setSizeH(null); }}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                        style={{
                          background: sizeCat === c.id ? "#7C5BF5" : "rgba(255,255,255,0.04)",
                          color:      sizeCat === c.id ? "#fff" : "rgba(255,255,255,0.5)",
                          border:     `1px solid ${sizeCat === c.id ? "#7C5BF5" : "rgba(255,255,255,0.08)"}`,
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  {!cat.frameable && (
                    <p className="text-[11px] -mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {cat.label} canvases are sold without a frame.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {sizes.map(s => (
                      <button
                        key={`${s.w}x${s.h}`}
                        onClick={() => { setSizeW(s.w); setSizeH(s.h); }}
                        className="px-4 py-2 rounded-full text-xs font-medium transition-all hover:opacity-80"
                        style={pill(isPicked(s.w, s.h))}
                        title={s.note}
                      >
                        {sizeLabel(s.w, s.h)}
                        {(() => {
                          const p = artistSizePrice(sizePrices, sizeCat, s.w, s.h);
                          return (
                            <span className="block text-[10px] font-semibold mt-0.5" style={{ color: p ? "#10B981" : "rgba(255,255,255,0.3)" }}>
                              {p ? `₹${withPlatformFee(p).toLocaleString("en-IN")}` : "Quote"}
                            </span>
                          );
                        })()}
                      </button>
                    ))}
                  </div>

                  {/* Custom size */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>Custom:</span>
                    <select value={sizeW ?? ""} onChange={e => setSizeW(Number(e.target.value) || null)}
                      className="px-3 py-1.5 rounded-full text-xs outline-none" style={selectStyle}>
                      <option value="" style={optStyle}>W</option>
                      {CUSTOM_INCHES.map(n => <option key={n} value={n} style={optStyle}>{n}&quot;</option>)}
                    </select>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>×</span>
                    <select value={sizeH ?? ""} onChange={e => setSizeH(Number(e.target.value) || null)}
                      className="px-3 py-1.5 rounded-full text-xs outline-none" style={selectStyle}>
                      <option value="" style={optStyle}>H</option>
                      {CUSTOM_INCHES.map(n => <option key={n} value={n} style={optStyle}>{n}&quot;</option>)}
                    </select>
                    {sizeW && sizeH && (
                      <button onClick={() => { setSizeW(null); setSizeH(null); }} className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Price for the chosen size */}
                  {sizeW && sizeH && (
                    <div className="flex flex-col gap-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: "rgba(255,255,255,0.45)" }}>Artwork · {sizeLabel(sizeW, sizeH)}</span>
                        <span className="font-semibold text-white">
                          {clientArtPrice !== null ? `₹${clientArtPrice.toLocaleString("en-IN")}` : "Quote"}
                        </span>
                      </div>
                      {/* Floating frame is optional — untick to get the artwork only */}
                      {frame ? (<>
                      <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                        <span className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.45)" }}>
                          <input
                            type="checkbox"
                            checked={withFrame}
                            onChange={e => setWithFrame(e.target.checked)}
                            className="w-3.5 h-3.5 rounded accent-[#7C5BF5]"
                          />
                          Floating frame · {sizeLabel(sizeW, sizeH)}{frame.exact ? "" : " (approx.)"}
                        </span>
                        <span className="font-semibold" style={{ color: withFrame ? "#fff" : "rgba(255,255,255,0.3)", textDecoration: withFrame ? "none" : "line-through" }}>
                          ₹{frame.price.toLocaleString("en-IN")}
                        </span>
                      </label>
                      {!withFrame && (
                        <p className="text-[11px] -mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                          Artwork only — no frame included.
                        </p>
                      )}
                      </>) : (
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: "rgba(255,255,255,0.45)" }}>Frame</span>
                          <span style={{ color: "rgba(255,255,255,0.35)" }}>Not available for {cat.label.toLowerCase()} canvas</span>
                        </div>
                      )}
                      {estimate !== null ? (
                        <div className="flex items-center justify-between text-sm pt-1">
                          <span className="font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>Price</span>
                          <span className="font-bold" style={{ color: "#10B981" }}>₹{estimate.toLocaleString("en-IN")}</span>
                        </div>
                      ) : (
                        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {isListed
                            ? "The artist hasn't set a price for this size yet — enter your budget below and they'll send a quote."
                            : "Custom size — enter your budget below; the artist will send a quote."}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* How it'd look on a wall at that size */}
                {sizeW && sizeH && (
                  <WallPreview imageUrl={heroImg} dimensions={`${sizeW} x ${sizeH} in`} />
                )}
              </div>
            );
          })()}

          {/* REFERENCES */}
          <div className="flex flex-col gap-3">
            <SectionLabel label="REFERENCES" />
            <Field hint="Paste a moodboard, Pinterest or Drive link — or upload images of what you have in mind">
              <div className="flex items-center gap-3">
                <input
                  value={refInput}
                  onChange={e => setRefInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addRef())}
                  placeholder="https://..."
                  className="flex-1 min-w-0 bg-transparent text-sm outline-none"
                  style={{ color: "rgba(255,255,255,0.82)", caretColor: "#7C5BF5" }}
                />
                <button
                  onClick={addRef}
                  className="text-xs font-bold shrink-0 px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.3)" }}
                >
                  + Add
                </button>
                {/* Upload reference images (up to 6 at a time) */}
                <input
                  ref={refFileInput}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => uploadRefImages(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => refFileInput.current?.click()}
                  disabled={uploadingRefs}
                  title="Upload reference images"
                  className="flex items-center gap-1.5 text-xs font-bold shrink-0 px-3 py-1.5 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  {uploadingRefs ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                  {uploadingRefs ? "Uploading…" : "Upload"}
                </button>
              </div>

              {references.length > 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  {/* Image references as thumbnails */}
                  {references.some(isImageRef) && (
                    <div className="flex flex-wrap gap-2">
                      {references.map((r, i) => isImageRef(r) && (
                        <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={r} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setReferences(prev => prev.filter((_, j) => j !== i))}
                            aria-label="Remove image"
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: "rgba(0,0,0,0.7)" }}
                          >
                            <X size={10} color="#fff" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Link references */}
                  {references.map((r, i) => !isImageRef(r) && (
                    <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "#9B7CF5" }}>
                      <span className="flex-1 truncate">{r}</span>
                      <button onClick={() => setReferences(prev => prev.filter((_, j) => j !== i))} style={{ color: "rgba(255,255,255,0.3)" }}>
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>
          </div>

          {/* BUDGET — only for custom sizes we don't list (listed sizes have a fixed price) */}
          {isCustomSize && (
          <div className="flex flex-col gap-3">
            <SectionLabel label="BUDGET" />
            <Field hint="Your budget for this custom size — the artist replies with a quote">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>₹</span>
                <input
                  type="number"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="Enter your budget"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "rgba(255,255,255,0.82)", caretColor: "#7C5BF5" }}
                />
              </div>
            </Field>
          </div>
          )}
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
