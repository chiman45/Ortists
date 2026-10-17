"use client";

import {
  ArrowLeft, ArrowRight, BookmarkCheck,
  Check, Grid2X2, ImageIcon, MapPin, Send, Upload, X,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { useCallback, useRef, useState } from "react";

// Same editorial serif the landing page uses — warmer than the gradient display text
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], display: "swap" });

const STEPS = ["Type", "Media", "Details", "Options", "Preview"] as const;

const CONTENT_TYPES = [
  { id: "portfolio", Icon: ImageIcon,  title: "Portfolio post", desc: "Share a finished piece or a whole series. It goes on your portfolio and into the feed." },
  { id: "gallery",   Icon: Grid2X2,    title: "Gallery post",   desc: "List one artwork for sale. Add the main photo plus close-ups, then its title, price and size." },
] as const;

// "Other" on every taxonomy lets artists describe work the preset lists miss;
// the free-text value replaces the literal "Other" when the post is saved.
const OTHER = "Other";

const ARTWORK_TYPES = [
  "Portrait", "Landscape", "Still Life", "Character Art", "Concept Art",
  "Illustration", "Fine Art", "Abstract Art", "Decorative Art", "Mural", "Mixed Media", OTHER,
];

const PHYSICAL_TECHNIQUES = [
  "Oil", "Acrylic", "Watercolor", "Charcoal", "Ink", "Pencil",
  "Pastel", "Gouache", "Mixed Media", "Sculpture", OTHER,
];

const DIGITAL_TECHNIQUES = [
  "Digital Painting", "Digital Illustration", "3D", "Vector", "Pixel Art", "Digital Collage", OTHER,
];

const STYLES = [
  "Realistic", "Photorealistic", "Semi-Realistic", "Stylized", "Abstract",
  "Impressionistic", "Expressionistic", "Minimalist", "Surreal", "Conceptual",
  "Cartoon", "Contemporary", "Pop Art", "Geometric", "Line Art", "Folk / Naïve", OTHER,
];

const otherInputStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" } as const;

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
  const router = useRouter();
  const [step, setStep]               = useState(0);
  const [type, setType]               = useState("portfolio");
  const [imageUrl, setImageUrl]       = useState<string | null>(null);
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [isVideo, setIsVideo]         = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryUrls, setGalleryUrls]   = useState<string[]>([]);
  const [publishing, setPublishing]   = useState(false);
  // Preview step: which image is showing, and whether the full-post overlay is open
  const [previewIdx, setPreviewIdx]   = useState(0);
  const [fullPreview, setFullPreview] = useState(false);
  const previewImages = isVideo ? [] : [imageUrl, ...galleryUrls].filter((u): u is string => !!u);
  const safePreviewIdx = Math.min(previewIdx, Math.max(0, previewImages.length - 1));
  const prevPreview = () => setPreviewIdx(i => (i - 1 + previewImages.length) % previewImages.length);
  const nextPreview = () => setPreviewIdx(i => (i + 1) % previewImages.length);
  const [dragging, setDragging]       = useState(false);
  const [title, setTitle]           = useState("");
  const [desc, setDesc]             = useState("");
  const [artworkType, setArtworkType] = useState<string[]>([]);
  const [medium, setMedium]         = useState("");
  const [technique, setTechnique]   = useState("");
  const [styles, setStyles]         = useState<string[]>([]);
  // Free-text values shown when "Other" is picked in the matching group
  const [artworkTypeOther, setArtworkTypeOther] = useState("");
  const [techniqueOther, setTechniqueOther]     = useState("");
  const [styleOther, setStyleOther]             = useState("");
  const [location, setLocation]     = useState("");
  const [price, setPrice]           = useState("");
  const [currency, setCurrency]     = useState("₹");
  const [dimensions, setDimensions] = useState("");
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
    // Gallery listings need a title and a price; portfolio titles come from the caption
    !!title.trim() && (type !== "gallery" || Number(price) > 0),
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
          <h2 className={`${playfair.className} text-[26px] font-semibold mb-1`} style={{ color: "var(--text-1)", letterSpacing: "-0.01em" }}>
            New post
          </h2>
          <p className="text-[13px]" style={{ color: "var(--text-5)" }}>What have you been working on?</p>
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
              <h3 className="text-base font-bold text-center mb-4" style={{ color: "var(--text-1)" }}>What are you posting?</h3>
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
              <h3 className="text-base font-bold text-center mb-4" style={{ color: "var(--text-1)" }}>Add your images</h3>

              {type === "gallery" ? (
                /* ── Gallery: multiple photos supported ── */
                <>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                  <input ref={extraRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e => { if (e.target.files) handleGalleryFiles(e.target.files); }} />

                  {!imageUrl ? (
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
                        <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-2)" }}>Drag in photos of the artwork</p>
                        <p className="text-xs" style={{ color: "var(--text-5)" }}>main image first, then close-ups or other angles — up to 10</p>
                      </div>
                    </div>
                  ) : (
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
                        {galleryUrls.length + 1}/10 · buyers can browse all photos of this piece
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* ── Portfolio: cover + additional images of the work ── */
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
                        <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-2)" }}>Drag your work in here</p>
                        <p className="text-xs" style={{ color: "var(--text-5)" }}>or click to pick a file — photos and video both work</p>
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
                        {galleryUrls.length + 1} of 10 · the first photo is the main image
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
              <h3 className="text-base font-bold text-center mb-1" style={{ color: "var(--text-1)" }}>
                {type === "gallery" ? "About this artwork" : "Tell us about it"}
              </h3>
              <p className="text-xs text-center -mt-1" style={{ color: "var(--text-5)" }}>
                {type === "gallery"
                  ? "One post, one artwork. Buyers see everything you fill in here."
                  : "This goes on your portfolio and into the feed."}
              </p>

              {/* Gallery: the artwork's listing details come first — title, price, size */}
              {type === "gallery" && (
                <div className="flex flex-col gap-4 p-4 rounded-2xl" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-4)" }}>
                      Title <span style={{ color: "rgba(124,91,245,0.7)" }}>*</span>
                    </label>
                    <input
                      value={title}
                      onChange={e => setTitle(e.target.value.slice(0, 80))}
                      placeholder="What's the piece called?"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-4)" }}>
                        Price <span style={{ color: "rgba(124,91,245,0.7)" }}>*</span>
                      </label>
                      <div className="flex gap-2">
                        {/* Currency selector — display symbol only; checkout always charges in ₹ via Razorpay */}
                        <select
                          value={currency}
                          onChange={e => setCurrency(e.target.value)}
                          className="px-3 py-2.5 rounded-xl text-sm outline-none appearance-none pr-7"
                          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                        >
                          {["₹", "$", "£", "€", "¥"].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input
                          type="number"
                          min="0"
                          value={price}
                          onChange={e => setPrice(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                        />
                      </div>
                      <p className="text-[10px] mt-1" style={{ color: "var(--text-5)" }}>Payments always go through in ₹.</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-4)" }}>Size</label>
                      <input
                        value={dimensions}
                        onChange={e => setDimensions(e.target.value)}
                        placeholder="40 × 60 cm, A3 print…"
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Caption / description */}
              <div>
                <label className="text-xs font-medium mb-0.5 block" style={{ color: "var(--text-4)" }}>
                  {type === "gallery" ? "Description" : "Caption"}
                </label>
                <p className="text-[11px] mb-1.5" style={{ color: "var(--text-5)" }}>
                  {type === "gallery"
                    ? "What is it, how was it made, anything a buyer should know."
                    : <>What&apos;s the story behind it? Mention the size too.</>}
                </p>
                <textarea
                  value={desc}
                  // Portfolio posts have no title field, so the caption doubles as the title
                  onChange={e => { setDesc(e.target.value); if (type !== "gallery") setTitle(e.target.value.slice(0, 80)); }}
                  placeholder={type === "gallery"
                    ? "Original acrylic on stretched canvas, ready to hang. Ships rolled or framed."
                    : "Started as a sketch on a train to Jaipur and took three weeks to finish. 24 × 36 in, oil on canvas."}
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
                {artworkType.includes(OTHER) && (
                  <input
                    value={artworkTypeOther}
                    onChange={e => setArtworkTypeOther(e.target.value)}
                    placeholder="What kind of work is it?"
                    className="w-full mt-2 px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={otherInputStyle}
                  />
                )}
              </div>

              {/* Medium */}
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-4)" }}>Medium</label>
                <div className="flex gap-2 mb-2">
                  {["Physical", "Digital", "Other"].map(m => (
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
                {medium === "Other" ? (
                  <div>
                    <label className="text-xs mb-1.5 block" style={{ color: "var(--text-5)" }}>What did you make it with?</label>
                    <input
                      value={technique}
                      onChange={e => setTechnique(e.target.value)}
                      placeholder="Embroidery, clay, found objects…"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                    />
                  </div>
                ) : medium && (
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
                    {technique === OTHER && (
                      <input
                        value={techniqueOther}
                        onChange={e => setTechniqueOther(e.target.value)}
                        placeholder="How did you make it?"
                        className="w-full mt-2 px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={otherInputStyle}
                      />
                    )}
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
                {styles.includes(OTHER) && (
                  <input
                    value={styleOther}
                    onChange={e => setStyleOther(e.target.value)}
                    placeholder="How would you describe the look?"
                    className="w-full mt-2 px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={otherInputStyle}
                  />
                )}
              </div>

              {/* Location — autocomplete via Nominatim */}
              <LocationField value={location} onChange={setLocation} />
            </div>
          )}

          {/* Step 4: Options */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-base font-bold text-center mb-1" style={{ color: "var(--text-1)" }}>A few settings</h3>
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
              <h3 className="text-base font-bold text-center mb-4" style={{ color: "var(--text-1)" }}>One last look</h3>
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                {isVideo && imageUrl ? (
                  <video src={imageUrl} controls className="w-full object-cover" style={{ maxHeight: 260 }} />
                ) : previewImages.length > 0 ? (
                  /* All images of the artwork, with prev/next arrows when there's more than one */
                  <div className="relative" style={{ background: "#000" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewImages[safePreviewIdx]} alt={`Preview ${safePreviewIdx + 1}`} className="w-full object-contain" style={{ maxHeight: 280 }} />
                    {previewImages.length > 1 && (
                      <>
                        <button type="button" onClick={prevPreview} aria-label="Previous image"
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                          style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}>
                          <ArrowLeft size={14} color="#fff" />
                        </button>
                        <button type="button" onClick={nextPreview} aria-label="Next image"
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                          style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}>
                          <ArrowRight size={14} color="#fff" />
                        </button>
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: "rgba(0,0,0,0.65)", color: "#fff", backdropFilter: "blur(6px)" }}>
                          <Grid2X2 size={10} /> {safePreviewIdx + 1} / {previewImages.length}
                        </div>
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                          {previewImages.map((_, i) => (
                            <button key={i} type="button" onClick={() => setPreviewIdx(i)} aria-label={`Image ${i + 1}`}
                              className="rounded-full transition-all"
                              style={{ width: i === safePreviewIdx ? 14 : 5, height: 5, background: i === safePreviewIdx ? "#fff" : "rgba(255,255,255,0.45)" }} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-center" style={{ height: 180, background: "var(--bg-subtle)" }}>
                    <ImageIcon size={32} style={{ color: "var(--text-5)" }} />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold" style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", color: "#fff" }}>
                      {user?.imageUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                        : (user?.firstName?.[0] ?? "Y")}
                    </div>
                    <div>
                      <p className="text-xs font-semibold leading-none" style={{ color: "var(--text-1)" }}>{user?.fullName ?? user?.username ?? "You"}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-5)" }}>@{user?.username ?? user?.id.slice(0, 12) ?? "you"}</p>
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
                  <button
                    type="button"
                    onClick={() => setFullPreview(true)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
                    style={{ background: "#7C5BF5" }}
                  >
                    View Full Post
                  </button>
                  <p className="text-[10px] text-center mt-2" style={{ color: "var(--text-5)" }}>
                    Nothing&apos;s posted yet — hit Publish when it looks right
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Full post preview — exactly what gets published, opened from "View Full Post" */}
        {fullPreview && (
          <div
            className="fixed inset-0 z-70 flex items-center justify-center p-3 md:p-6"
            style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)" }}
            onClick={e => { if (e.target === e.currentTarget) setFullPreview(false); }}
          >
            <div className="w-full flex flex-col md:flex-row rounded-2xl overflow-hidden"
              style={{ maxWidth: 980, maxHeight: "92vh", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              {/* Images */}
              <div className="flex-1 relative flex items-center justify-center" style={{ background: "#060606", minHeight: 280, maxHeight: "60vh" }}>
                {isVideo && imageUrl ? (
                  <video src={imageUrl} controls className="max-w-full max-h-full" />
                ) : previewImages.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewImages[safePreviewIdx]} alt={title || "Artwork"} className="max-w-full max-h-full object-contain" style={{ maxHeight: "60vh" }} />
                ) : null}
                {previewImages.length > 1 && (
                  <>
                    <button type="button" onClick={prevPreview} aria-label="Previous image"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80"
                      style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}>
                      <ArrowLeft size={16} color="#fff" />
                    </button>
                    <button type="button" onClick={nextPreview} aria-label="Next image"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80"
                      style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}>
                      <ArrowRight size={16} color="#fff" />
                    </button>
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-white" style={{ background: "rgba(0,0,0,0.65)" }}>
                      {safePreviewIdx + 1} / {previewImages.length}
                    </div>
                  </>
                )}
              </div>

              {/* Details */}
              <div className="w-full md:w-[320px] shrink-0 flex flex-col" style={{ borderLeft: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 px-4 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <p className="flex-1 text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>{title || "Untitled"}</p>
                  <button type="button" onClick={() => setFullPreview(false)} aria-label="Close preview"
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70" style={{ color: "var(--text-4)" }}>
                    <X size={15} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}>
                      {user?.imageUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                        : (user?.firstName?.[0] ?? "Y")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text-1)" }}>{user?.fullName ?? user?.username ?? "You"}</p>
                      {location && <p className="text-[10px] truncate" style={{ color: "var(--text-5)" }}>{location}</p>}
                    </div>
                  </div>
                  {desc && <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-3)" }}>{desc}</p>}
                  {type === "gallery" && price && (
                    <p className="text-lg font-bold" style={{ color: "#9B7CF5" }}>{currency}{price}{dimensions ? <span className="text-xs font-normal ml-2" style={{ color: "var(--text-5)" }}>{dimensions}</span> : null}</p>
                  )}
                  {(artworkType.length > 0 || styles.length > 0) && (
                    <div className="flex flex-wrap gap-1.5">
                      {[...artworkType, ...styles].map(t => (
                        <span key={t} className="px-2.5 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "rgba(124,91,245,0.15)", color: "#9B7CF5" }}>
                          {t === OTHER ? (artworkType.includes(t) ? artworkTypeOther || t : styleOther || t) : t}
                        </span>
                      ))}
                    </div>
                  )}
                  {medium && (
                    <p className="text-xs" style={{ color: "var(--text-5)" }}>
                      Medium: <strong style={{ color: "var(--text-3)" }}>{medium}{technique ? ` · ${technique === OTHER ? techniqueOther || technique : technique}` : ""}</strong>
                    </p>
                  )}
                  <p className="text-[11px]" style={{ color: "var(--text-5)" }}>
                    That&apos;s how it&apos;ll look to everyone else. Close this and hit Publish when you&apos;re happy with it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    } else {
                      // Gallery & Portfolio: cover + optional extra images as JSON array
                      const allFiles = [imageFile, ...galleryFiles].filter((f): f is File => !!f);
                      const uploadedUrls = await Promise.all(allFiles.map(uploadFile));
                      finalImageUrl = JSON.stringify(uploadedUrls);
                    }

                    // Swap any "Other" pick for the artist's own description (dropped if left blank)
                    const swapOther = (list: string[], custom: string) =>
                      list.flatMap(v => v !== OTHER ? [v] : custom.trim() ? [custom.trim()] : []);
                    const finalTypes     = swapOther(artworkType, artworkTypeOther);
                    const finalStyles    = swapOther(styles, styleOther);
                    const finalTechnique = technique === OTHER ? techniqueOther.trim() : technique;

                    // For gallery posts embed price + dimensions into description as structured JSON
                    const descriptionPayload = isGallery && (price || dimensions)
                      ? JSON.stringify({ _price: price ? `${currency}${price}` : undefined, _dimensions: dimensions || undefined, _desc: desc })
                      : (desc || undefined);

                    const res = await fetch("/api/posts", {
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
                        category: isGallery ? `gallery:${finalTypes[0] || "General"}` : (finalTypes[0] || "General"),
                        tags: finalTypes,
                        medium: finalTechnique ? `${medium} · ${finalTechnique}` : (medium || undefined),
                        style: finalStyles.join(", ") || undefined,
                        location: location || undefined,
                        visibility,
                        allow_comments: comments,
                        allow_downloads: isGallery ? false : downloads,
                      }),
                    });
                    const { post: created } = await res.json();
                    onClose();
                    if (created?.id) router.push(`/feed/${created.id}`);
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
