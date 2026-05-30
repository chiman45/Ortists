"use client";

import {
  ArrowLeft, ArrowRight, BookmarkCheck, Briefcase,
  Check, FileText, ImageIcon, MapPin, Send, ShoppingBag, Upload, X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

const STEPS = ["Type", "Media", "Details", "Options", "Preview"] as const;

const CONTENT_TYPES = [
  { id: "portfolio",   Icon: ImageIcon,   title: "Portfolio Post",       desc: "Showcase artwork, photography, designs, sketches, or creative projects." },
  { id: "story",       Icon: FileText,    title: "Story",                desc: "Share temporary creative updates, behind-the-scenes content, work-in-progress, or announcements." },
  { id: "marketplace", Icon: ShoppingBag, title: "Marketplace Listing",  desc: "List artwork, prints, digital assets, or products available for purchase." },
  { id: "commission",  Icon: Briefcase,   title: "Commission Service",   desc: "Offer custom creative services and accept hiring requests." },
] as const;

const PRESET_TAGS = ["Digital Art", "Portrait", "Photography", "3D Art", "Graphic Design", "Illustration", "Sketch", "Painting"];

interface Props { onClose: () => void }

export default function CreatePostModal({ onClose }: Props) {
  const [step, setStep]             = useState(0);
  const [type, setType]             = useState("portfolio");
  const [imageUrl, setImageUrl]     = useState<string | null>(null);
  const [dragging, setDragging]     = useState(false);
  const [title, setTitle]           = useState("");
  const [desc, setDesc]             = useState("");
  const [category, setCategory]     = useState("");
  const [tags, setTags]             = useState<string[]>([]);
  const [medium, setMedium]         = useState("");
  const [style, setStyle]           = useState("");
  const [location, setLocation]     = useState("");
  const [visibility, setVisibility] = useState<"Public" | "Followers" | "Private">("Public");
  const [comments, setComments]     = useState(true);
  const [downloads, setDownloads]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
    setImageUrl(URL.createObjectURL(file));
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  function toggleTag(t: string) {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
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
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className="w-full rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden"
                style={{
                  minHeight: imageUrl ? "auto" : 200,
                  border: `2px dashed ${dragging ? "#7C5BF5" : "var(--border)"}`,
                  background: dragging ? "rgba(124,91,245,0.06)" : "var(--bg-card)",
                }}
              >
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="preview" className="w-full rounded-2xl object-cover" style={{ maxHeight: 300 }} />
                ) : (
                  <div className="flex flex-col items-center py-10">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(124,91,245,0.15)" }}>
                      <Upload size={20} style={{ color: "#9B7CF5" }} />
                    </div>
                    <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-2)" }}>Drop your media here</p>
                    <p className="text-xs" style={{ color: "var(--text-5)" }}>or click to browse • Images and videos supported</p>
                  </div>
                )}
              </div>
              {imageUrl && (
                <button onClick={() => setImageUrl(null)} className="mt-2 text-xs transition-opacity hover:opacity-70 w-full text-center" style={{ color: "var(--text-5)" }}>
                  Remove and choose different file
                </button>
              )}
            </div>
          )}

          {/* Step 3: Details */}
          {step === 2 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-bold text-center mb-1" style={{ color: "var(--text-1)" }}>Add Details</h3>
              {[
                { label: "Title", value: title, set: setTitle, placeholder: "Give your work a title...", multi: false },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-4)" }}>{label}</label>
                  <input
                    value={value}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-4)" }}>Description</label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Describe your creative work..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-4)" }}>Category</label>
                <input
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="e.g. Illustration"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-4)" }}>Creative Tags</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TAGS.map(t => (
                    <button
                      key={t}
                      onClick={() => toggleTag(t)}
                      className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: tags.includes(t) ? "#7C5BF5" : "var(--bg-card)",
                        color: tags.includes(t) ? "#fff" : "var(--text-4)",
                        border: tags.includes(t) ? "1px solid #7C5BF5" : "1px solid var(--border)",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Medium", value: medium, set: setMedium, placeholder: "e.g. digital" },
                  { label: "Style",  value: style,  set: setStyle,  placeholder: "e.g. realistic" },
                ].map(({ label, value, set, placeholder }) => (
                  <div key={label}>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-4)" }}>{label}</label>
                    <input
                      value={value}
                      onChange={e => set(e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: "var(--text-4)" }}>
                  <MapPin size={11} /> Location (optional)
                </label>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. New York, NY"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                />
              </div>
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
                { label: "Allow Comments",   val: comments,   set: setComments  },
                { label: "Allow Downloads",  val: downloads,  set: setDownloads },
              ].map(({ label, val, set }) => (
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
              {type === "marketplace" && (
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-4)" }}>Price (USD)</label>
                  <input
                    placeholder="e.g. 250"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 5: Preview */}
          {step === 4 && (
            <div>
              <h3 className="text-base font-bold text-center mb-4" style={{ color: "var(--text-1)" }}>Preview</h3>
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="preview" className="w-full object-cover" style={{ maxHeight: 260 }} />
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
                    {(tags.length ? tags : ["Digital Art"]).map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(124,91,245,0.15)", color: "#9B7CF5" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <button className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#7C5BF5" }}>
                    View Full Post
                  </button>
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
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
                style={{ background: "#7C5BF5" }}
                onClick={onClose}
              >
                <Send size={14} /> Publish
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
