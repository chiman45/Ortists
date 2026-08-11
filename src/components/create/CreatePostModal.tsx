"use client";

import {
  ArrowLeft, ArrowRight, BookmarkCheck,
  Check, Grid2X2, ImageIcon, MapPin, Send, Upload, X,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useCallback, useRef, useState } from "react";

const STEPS = ["Type", "Media", "Details", "Options", "Preview"] as const;

const CONTENT_TYPES = [
  { id: "portfolio", Icon: ImageIcon,  title: "Portfolio Post", desc: "Showcase your artwork — add multiple images in one post, like Instagram." },
  { id: "gallery",   Icon: Grid2X2,    title: "Gallery Post",   desc: "Share a single artwork to the gallery with a price tag." },
] as const;

const ARTWORK_TYPES = [
  "Portrait", "Landscape", "Still Life", "Character Art", "Concept Art",
  "Illustration", "Fine Art", "Abstract Art", "Decorative Art", "Mural", "Mixed Media",
];

const PHYSICAL_TECHNIQUES = [
  "Oil", "Acrylic", "Watercolor", "Charcoal", "Ink", "Pencil",
  "Pastel", "Gouache", "Mixed Media", "Sculpture",
];

const DIGITAL_TECHNIQUES = [
  "Digital Painting", "Digital Illustration", "3D", "Vector", "Pixel Art", "Digital Collage",
];

const STYLES = [
  "Realistic", "Photorealistic", "Semi-Realistic", "Stylized", "Abstract",
  "Impressionistic", "Expressionistic", "Minimalist", "Surreal", "Conceptual",
  "Cartoon", "Contemporary", "Pop Art", "Geometric", "Line Art", "Folk / Naïve",
];

interface Props { onClose: () => void }

// ── Location autocomplete (Nominatim / OpenStreetMap, no API key) ──
interface NominatimResult { display_name: string; }

function LocationField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery]       = useState(value);
  const [results, setResults]   = useState<string[]>([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function updateRect() {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    setDropdownRect({ top: r.bottom + 4, left: r.left, width: r.width });
  }

  function search(q: string) {
    setQuery(q);
    onChange(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=0`,
          { headers: { "Accept-Language": "en" } }
        );
        const data: NominatimResult[] = await res.json();
        const labels = data.map(d => {
          const parts = d.display_name.split(",").map(s => s.trim());
          return parts.slice(0, 3).join(", ");
        });
        setResults([...new Set(labels)]);
        updateRect();
        setOpen(true);
      } catch { setResults([]); }
      setLoading(false);
    }, 400);
  }

  function pick(label: string) {
    setQuery(label);
    onChange(label);
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: "var(--text-4)" }}>
        📍 Location (optional)
      </label>
      <input
        ref={inputRef}
        value={query}
        onChange={e => search(e.target.value)}
        onFocus={() => { if (results.length > 0) { updateRect(); setOpen(true); } }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="e.g. New York, NY"
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
      />
      {loading && (
        <div className="absolute right-3 top-9.5">
          <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(124,91,245,0.3)", borderTopColor: "#7C5BF5" }} />
        </div>
      )}
      {open && results.length > 0 && dropdownRect && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            position: "fixed",
            top: dropdownRect.top,
            left: dropdownRect.left,
            width: dropdownRect.width,
            zIndex: 9999,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
          }}
        >
          {results.map((r, i) => (
            <button
              key={i}
              onMouseDown={() => pick(r)}
              className="w-full text-left px-3 py-2 text-xs transition-all hover:opacity-80"
              style={{ color: "var(--text-2)", borderBottom: i < results.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreatePostModal({ onClose }: Props) {
  const { user } = useUser();
  const [step, setStep]               = useState(0);
  const [type, setType]               = useState("portfolio");
  const [imageUrl, setImageUrl]       = useState<string | null>(null);
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [isVideo, setIsVideo]         = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryUrls, setGalleryUrls]   = useState<string[]>([]);
  const [publishing, setPublishing]   = useState(false);
  const [dragging, setDragging]       = useState(false);
  const [title, setTitle]           = useState("");
  const [desc, setDesc]             = useState("");
  const [category, setCategory]     = useState("");
  const [artworkType, setArtworkType] = useState<string[]>([]);
  const [medium, setMedium]         = useState("");
  const [technique, setTechnique]   = useState("");
  const [styles, setStyles]         = useState<string[]>([]);
  const [location, setLocation]     = useState("");
  const [price, setPrice]           = useState("");
  const [currency, setCurrency]     = useState("£");
  const [visibility, setVisibility] = useState<"Public" | "Followers" | "Private">("Public");
  const [comments, setComments]     = useState(true);
  const [downloads, setDownloads]   = useState(false);
  const fileRef  = useRef<HTMLInputElement>(null);
  const extraRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setIsVideo(file.type.startsWith("video/"));
  }

  function handleGalleryFiles(files: FileList | File[]) {
    const imgs = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, 10);
    setGalleryFiles(prev => {
      const combined = [...prev, ...imgs].slice(0, 10);
      setGalleryUrls(combined.map(f => URL.createObjectURL(f)));
      return combined;
    });
  }

  function removeGalleryItem(idx: number) {
    setGalleryFiles(prev => {
      const next = prev.filter((_, i) => i !== idx);
      setGalleryUrls(next.map(f => URL.createObjectURL(f)));
      return next;
    });
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  function toggleArtworkType(t: string) {
    setArtworkType(prev =>
      prev.includes(t) ? prev.filter(x => x !== t)
        : prev.length < 3 ? [...prev, t] : prev
    );
  }

  function toggleStyle(s: string) {
    setStyles(prev =>
      prev.includes(s) ? prev.filter(x => x !== s)
        : prev.length < 2 ? [...prev, s] : prev
    );
  }

  const canContinue = [
    true,
    !!imageUrl,
    !!title.trim(),
    true,
    true,
  ][step];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl flex flex-col overflow-hidden"
        style={{ background: "var(--bg)", border: "1px solid var(--border)", maxHeight: "90vh" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "var(--bg-subtle)", color: "var(--text-4)" }}
        >
          <X size={15} />
        </button>

        {/* Header */}
        <div className="text-center pt-8 pb-4 px-8 shrink-0">
          <h2 className="text-2xl font-black mb-1" style={{ background: "linear-gradient(90deg,#9B7CF5,#F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Create Content
          </h2>
          <p className="text-xs" style={{ color: "var(--text-5)" }}>Share your creative work with the Ortist community</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 px-8 pb-6 shrink-0">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: i < step ? "#7C5BF5" : i === step ? "rgba(124,91,245,0.2)" : "var(--bg-subtle)",
                    color: i <= step ? "#9B7CF5" : "var(--text-5)",
                    border: i === step ? "2px solid #7C5BF5" : i < step ? "none" : "1px solid var(--border)",
                  }}
                >
                  {i < step ? <Check size={13} strokeWidth={2.5} style={{ color: "#fff" }} /> : i + 1}
                </div>
                <span className="text-[10px]" style={{ color: i === step ? "#9B7CF5" : "var(--text-5)" }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-10 h-px mx-1 mb-4" style={{ background: i < step ? "#7C5BF5" : "var(--border)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-8 pb-4" style={{ scrollbarWidth: "none" }}>

          {/* Step 1: Type */}
          {step === 0 && (
            <div>
              <h3 className="text-base font-bold text-center mb-4" style={{ color: "var(--text-1)" }}>Choose Content Type</h3>
              <div className="grid grid-cols-2 gap-3">
                {CONTENT_TYPES.map(({ id, Icon, title: t, desc: d }) => (
                  <button
                    key={id}
                    onClick={() => setType(id)}
                    className="text-left p-4 rounded-2xl transition-all"
                    style={{
                      background: type === id ? "rgba(124,91,245,0.12)" : "var(--bg-card)",
                      border: type === id ? "1.5px solid #7C5BF5" : "1px solid var(--border)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5"
                      style={{ background: type === id ? "#7C5BF5" : "var(--bg-subtle)" }}
                    >
                      <Icon size={17} style={{ color: type === id ? "#fff" : "var(--text-4)" }} />
                    </div>
                    <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-1)" }}>{t}</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-5)" }}>{d}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Media */}
          {step === 1 && (
            <div>
              <h3 className="text-base font-bold text-center mb-4" style={{ color: "var(--text-1)" }}>Upload Media</h3>

              {type === "gallery" ? (
                /* ── Gallery: single image only ── */
                <>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                  <div
                    onClick={() => !imageUrl && fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className="w-full rounded-2xl flex flex-col items-center justify-center transition-all overflow-hidden"
                    style={{
                      minHeight: imageUrl ? "auto" : 200,
                      cursor: imageUrl ? "default" : "pointer",
                      border: `2px dashed ${dragging ? "#7C5BF5" : "var(--border)"}`,
                      background: dragging ? "rgba(124,91,245,0.06)" : "var(--bg-card)",
                    }}
                  >
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt="preview" className="w-full rounded-2xl object-cover" style={{ maxHeight: 340 }} />
                    ) : (
                      <div className="flex flex-col items-center py-10">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(124,91,245,0.15)" }}>
                          <Upload size={20} style={{ color: "#9B7CF5" }} />
                        </div>
                        <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-2)" }}>Drop your artwork here</p>
                        <p className="text-xs" style={{ color: "var(--text-5)" }}>or click to browse · single image only</p>
                      </div>
                    )}
                  </div>
                  {imageUrl && (
                    <button onClick={() => { setImageUrl(null); setImageFile(null); }}
                      className="mt-2 text-xs transition-opacity hover:opacity-70 w-full text-center" style={{ color: "var(--text-5)" }}>
                      Remove and choose different image
                    </button>
                  )}
                </>
              ) : (
                /* ── Portfolio: cover + carousel (Instagram-style) ── */
                <>
                  <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                  <input ref={extraRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e => { if (e.target.files) handleGalleryFiles(e.target.files); }} />

                  {!imageUrl ? (
                    /* Drop zone — shown only before first image */
                    <div
                      onClick={() => fileRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={onDrop}
                      className="w-full rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden"
                      style={{
                        minHeight: 200,
                        border: `2px dashed ${dragging ? "#7C5BF5" : "var(--border)"}`,
                        background: dragging ? "rgba(124,91,245,0.06)" : "var(--bg-card)",
                      }}
                    >
                      <div className="flex flex-col items-center py-10">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(124,91,245,0.15)" }}>
                          <Upload size={20} style={{ color: "#9B7CF5" }} />
                        </div>
                        <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-2)" }}>Drop your media here</p>
                        <p className="text-xs" style={{ color: "var(--text-5)" }}>or click to browse · images &amp; video supported</p>
                      </div>
                    </div>
                  ) : isVideo ? (
                    /* Video preview */
                    <>
                      <video src={imageUrl} controls className="w-full rounded-2xl object-cover" style={{ maxHeight: 300 }} />
                      <button onClick={() => { setImageUrl(null); setImageFile(null); }}
                        className="mt-2 text-xs transition-opacity hover:opacity-70 w-full text-center" style={{ color: "var(--text-5)" }}>
                        Remove and choose different file
                      </button>
                    </>
                  ) : (
                    /* Image carousel grid */
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-3 gap-2">
                        {/* Cover */}
                        <div className="relative aspect-square rounded-xl overflow-hidden group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => { setImageUrl(null); setImageFile(null); setGalleryFiles([]); setGalleryUrls([]); }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: "rgba(0,0,0,0.7)" }}
                          >
                            <X size={10} color="#fff" />
                          </button>
                          <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#7C5BF5", color: "#fff" }}>Cover</span>
                        </div>

                        {/* Additional images */}
                        {galleryUrls.map((url, i) => (
                          <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeGalleryItem(i)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: "rgba(0,0,0,0.7)" }}
                            >
                              <X size={10} color="#fff" />
                            </button>
                          </div>
                        ))}

                        {/* Add more slot */}
                        {galleryUrls.length < 9 && (
                          <button
                            onClick={() => extraRef.current?.click()}
                            className="aspect-square rounded-xl flex flex-col items-center justify-center transition-colors"
                            style={{ background: "var(--bg-subtle)", border: "2px dashed var(--border)" }}
                          >
                            <Upload size={14} style={{ color: "var(--text-5)" }} />
                            <span className="text-[10px] mt-1" style={{ color: "var(--text-5)" }}>Add</span>
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-center" style={{ color: "var(--text-5)" }}>
                        {galleryUrls.length + 1}/10 · viewers swipe through all images
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Details */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-center mb-1" style={{ color: "var(--text-1)" }}>Add Details</h3>

              {/* Caption */}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-4)" }}>Caption</label>
                <textarea
                  value={desc}
                  onChange={e => { setDesc(e.target.value); setTitle(e.target.value.slice(0, 80)); }}
                  placeholder="Tell the story behind your work..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                />
              </div>

              {/* Artwork Type */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium" style={{ color: "var(--text-4)" }}>Artwork Type</label>
                  <span className="text-[10px]" style={{ color: artworkType.length === 3 ? "#9B7CF5" : "var(--text-5)" }}>
                    {artworkType.length}/3 selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ARTWORK_TYPES.map(t => {
                    const selected = artworkType.includes(t);
                    const maxed = !selected && artworkType.length >= 3;
                    return (
                      <button
                        key={t}
                        onClick={() => toggleArtworkType(t)}
                        disabled={maxed}
                        className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                        style={{
                          background: selected ? "#7C5BF5" : "var(--bg-card)",
                          color: selected ? "#fff" : maxed ? "var(--text-5)" : "var(--text-4)",
                          border: selected ? "1px solid #7C5BF5" : "1px solid var(--border)",
                          opacity: maxed ? 0.45 : 1,
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Medium */}
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-4)" }}>Medium</label>
                <div className="flex gap-2 mb-2">
                  {["Physical", "Digital"].map(m => (
                    <button
                      key={m}
                      onClick={() => { setMedium(medium === m ? "" : m); setTechnique(""); }}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: medium === m ? "#7C5BF5" : "var(--bg-card)",
                        color: medium === m ? "#fff" : "var(--text-4)",
                        border: medium === m ? "1px solid #7C5BF5" : "1px solid var(--border)",
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                {medium && (
                  <div>
                    <label className="text-xs mb-1.5 block" style={{ color: "var(--text-5)" }}>Technique</label>
                    <div className="flex flex-wrap gap-2">
                      {(medium === "Physical" ? PHYSICAL_TECHNIQUES : DIGITAL_TECHNIQUES).map(tech => (
                        <button
                          key={tech}
                          onClick={() => setTechnique(technique === tech ? "" : tech)}
                          className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                          style={{
                            background: technique === tech ? "rgba(124,91,245,0.2)" : "var(--bg-card)",
                            color: technique === tech ? "#9B7CF5" : "var(--text-4)",
                            border: technique === tech ? "1px solid rgba(124,91,245,0.5)" : "1px solid var(--border)",
                          }}
                        >
                          {tech}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Style */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium" style={{ color: "var(--text-4)" }}>Style</label>
                  <span className="text-[10px]" style={{ color: styles.length === 2 ? "#9B7CF5" : "var(--text-5)" }}>
                    up to 2
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map(s => {
                    const selected = styles.includes(s);
                    const maxed = !selected && styles.length >= 2;
                    return (
                      <button
                        key={s}
                        onClick={() => toggleStyle(s)}
                        disabled={maxed}
                        className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                        style={{
                          background: selected ? "#7C5BF5" : "var(--bg-card)",
                          color: selected ? "#fff" : maxed ? "var(--text-5)" : "var(--text-4)",
                          border: selected ? "1px solid #7C5BF5" : "1px solid var(--border)",
                          opacity: maxed ? 0.45 : 1,
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location — autocomplete via Nominatim */}
              <LocationField value={location} onChange={setLocation} />

              {/* Price — gallery posts only */}
              {type === "gallery" && (
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-4)" }}>
                    Price <span style={{ color: "rgba(124,91,245,0.7)" }}>*</span>
                  </label>
                  <div className="flex gap-2">
                    {/* Currency selector */}
                    <div className="relative">
                      <select
                        value={currency}
                        onChange={e => setCurrency(e.target.value)}
                        className="h-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none pr-7"
                        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                      >
                        {["£", "$", "€", "₹", "¥"].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                    />
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-5)" }}>Set the price buyers will see on your gallery listing</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Options */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-base font-bold text-center mb-1" style={{ color: "var(--text-1)" }}>Options</h3>
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-4)" }}>Visibility</label>
                <div className="flex gap-2">
                  {(["Public", "Followers", "Private"] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setVisibility(v)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: visibility === v ? "#7C5BF5" : "var(--bg-card)",
                        color: visibility === v ? "#fff" : "var(--text-4)",
                        border: visibility === v ? "1px solid #7C5BF5" : "1px solid var(--border)",
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              {[
                { label: "Allow Comments",  val: comments,  set: setComments,  show: true },
                { label: "Allow Downloads", val: downloads, set: setDownloads, show: type !== "gallery" },
              ].filter(({ show }) => show).map(({ label, val, set }) => (
                <div key={label} className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{label}</span>
                  <button
                    onClick={() => set((v: boolean) => !v)}
                    className="w-11 h-6 rounded-full relative transition-all"
                    style={{ background: val ? "#7C5BF5" : "var(--bg-subtle)" }}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                      style={{ background: "#fff", left: val ? "calc(100% - 22px)" : 2 }}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Step 5: Preview */}
          {step === 4 && (
            <div>
              <h3 className="text-base font-bold text-center mb-4" style={{ color: "var(--text-1)" }}>Preview</h3>
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                {type === "gallery" && galleryUrls.length > 0 ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={galleryUrls[0]} alt="cover" className="w-full object-cover" style={{ maxHeight: 220 }} />
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: "rgba(0,0,0,0.65)", color: "#fff", backdropFilter: "blur(6px)" }}>
                      <Grid2X2 size={10} /> {galleryUrls.length} photos
                    </div>
                  </div>
                ) : imageUrl ? (
                  isVideo ? (
                    <video src={imageUrl} controls className="w-full object-cover" style={{ maxHeight: 260 }} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="preview" className="w-full object-cover" style={{ maxHeight: 260 }} />
                  )
                ) : (
                  <div className="w-full flex items-center justify-center" style={{ height: 180, background: "var(--bg-subtle)" }}>
                    <ImageIcon size={32} style={{ color: "var(--text-5)" }} />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", color: "#fff" }}>Y</div>
                    <div>
                      <p className="text-xs font-semibold leading-none" style={{ color: "var(--text-1)" }}>Your Name</p>
                      <p className="text-[10px]" style={{ color: "var(--text-5)" }}>@yourhandle</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold mb-0.5" style={{ color: "var(--text-1)" }}>{title || "Your post title"}</p>
                  {desc && <p className="text-xs mb-2" style={{ color: "var(--text-4)" }}>{desc}</p>}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(artworkType.length ? artworkType : ["Artwork"]).map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(124,91,245,0.15)", color: "#9B7CF5" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <button className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#7C5BF5", pointerEvents: "none", opacity: 0.85 }}>
                    View Full Post
                  </button>
                  <p className="text-[10px] text-center mt-2" style={{ color: "var(--text-5)" }}>Preview — publish to make it live</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center gap-3 px-8 py-5 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: "var(--bg-card)", color: "var(--text-3)", border: "1px solid var(--border)" }}
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : <div className="flex-1" />}

          {step === STEPS.length - 1 ? (
            <div className="flex gap-2 ml-auto">
              <button
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: "var(--bg-card)", color: "var(--text-3)", border: "1px solid var(--border)" }}
                onClick={onClose}
              >
                <BookmarkCheck size={14} /> Save Draft
              </button>
              <button
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                style={{ background: "#7C5BF5" }}
                disabled={publishing}
                onClick={async () => {
                  if (!user) return;
                  const isGallery = type === "gallery";
                  if (!imageFile) return;
                  setPublishing(true);
                  try {
                    let finalImageUrl = imageUrl ?? "";

                    async function uploadFile(file: File): Promise<string> {
                      const form = new FormData();
                      form.append("file", file);
                      form.append("bucket", "post-media");
                      const res = await fetch("/api/upload", { method: "POST", body: form });
                      const { url } = await res.json();
                      return url as string;
                    }

                    if (isVideo && imageFile) {
                      // Videos stored as plain URL (not JSON array)
                      finalImageUrl = await uploadFile(imageFile);
                    } else if (isGallery) {
                      // Gallery: single image stored as JSON array with one URL
                      const uploaded = await uploadFile(imageFile);
                      finalImageUrl = JSON.stringify([uploaded]);
                    } else {
                      // Portfolio: cover + optional extra images as JSON array
                      const allFiles = [imageFile, ...galleryFiles].filter((f): f is File => !!f);
                      const uploadedUrls = await Promise.all(allFiles.map(uploadFile));
                      finalImageUrl = JSON.stringify(uploadedUrls);
                    }

                    // For gallery posts embed price into description as structured JSON
                    const descriptionPayload = isGallery && price
                      ? JSON.stringify({ _price: `${currency}${price}`, _desc: desc })
                      : (desc || undefined);

                    await fetch("/api/posts", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        user_id: user.id,
                        author_name: user.fullName ?? user.username ?? "Artist",
                        author_username: user.username ?? user.id.slice(0, 12),
                        author_avatar: user.imageUrl,
                        title: title || "Untitled",
                        description: descriptionPayload,
                        image_url: finalImageUrl,
                        category: isGallery ? `gallery:${category || "General"}` : (category || "General"),
                        tags: artworkType,
                        medium: technique ? `${medium} · ${technique}` : (medium || undefined),
                        style: styles.join(", ") || undefined,
                        location: location || undefined,
                        visibility,
                        allow_comments: comments,
                        allow_downloads: isGallery ? false : downloads,
                      }),
                    });
                    onClose();
                  } finally {
                    setPublishing(false);
                  }
                }}
              >
                <Send size={14} /> {publishing ? "Publishing…" : "Publish"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => canContinue && setStep(s => s + 1)}
              disabled={!canContinue}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40 hover:opacity-85 ml-auto"
              style={{ background: "#7C5BF5" }}
            >
              Continue <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
