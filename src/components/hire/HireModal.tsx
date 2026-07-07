"use client";

import { useUser } from "@clerk/nextjs";
import { Briefcase, ChevronDown, ExternalLink, Loader2, Paperclip, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const CATEGORIES = [
  "Painting", "Illustration", "Watercolor", "Oil Painting", "Acrylic Painting",
  "Ink Art", "Portrait Art", "Landscape Art", "Abstract Art", "Sketch",
  "Digital Art", "Graphic Design", "Photography", "Mixed Media Art",
];

const BUDGETS = [
  "Under US$100", "US$100–250", "US$250–500",
  "US$500–1,000", "US$1,000–2,500", "US$2,500–5,000",
  "US$5,000–10,000", "US$10,000–25,000",
];

interface Props {
  authorUserId: string;
  authorName: string;
  authorAvatar?: string | null;
  onClose: () => void;
}

export default function HireModal({ authorUserId, authorName, authorAvatar, onClose }: Props) {
  const { user } = useUser();
  const [what, setWhat]             = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [catOpen, setCatOpen]       = useState(false);
  const [budget, setBudget]         = useState("");
  const [jobDesc, setJobDesc]       = useState("");
  const [note, setNote]             = useState("");
  const [hiringFor, setHiringFor]   = useState<"Personal Project" | "Company">("Personal Project");
  const [sending, setSending]       = useState(false);
  const [sent, setSent]             = useState(false);

  function toggleCat(c: string) {
    setCategories(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : prev.length < 3 ? [...prev, c] : prev
    );
  }

  async function handleSubmit() {
    if (!user || !what.trim()) return;
    setSending(true);
    try {
      // Save hire request to database
      await fetch("/api/hire-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:       user.id,
          artist_id:       authorUserId,
          client_name:     user.fullName ?? user.username ?? "Client",
          client_avatar:   user.imageUrl,
          artist_name:     authorName,
          artist_avatar:   authorAvatar ?? null,
          what:            what.trim(),
          categories,
          budget:          budget || null,
          job_description: jobDesc.trim() || null,
          personal_note:   note.trim() || null,
          hiring_for:      hiringFor,
          status:          "pending",
        }),
      });

      setSent(true);
    } catch {
      // silent fail
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl flex flex-col overflow-hidden"
        style={{
          background: "rgba(15,10,35,0.97)",
          border: "1px solid rgba(124,91,245,0.25)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
          maxHeight: "90vh",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "rgba(124,91,245,0.15)", color: "rgba(255,255,255,0.6)" }}
        >
          <X size={15} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 shrink-0" style={{ borderBottom: "1px solid rgba(124,91,245,0.15)" }}>
          {authorAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={authorAvatar} alt={authorName} className="w-11 h-11 rounded-full object-cover" style={{ border: "2px solid #7C5BF5" }} />
          ) : (
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", color: "#fff" }}>
              {authorName[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-lg font-black" style={{ color: "#fff" }}>
              Hire{" "}
              <span style={{ background: "linear-gradient(90deg,#9B7CF5,#F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {authorName}
              </span>
            </h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Fill in the details below to send a professional inquiry</p>
          </div>
        </div>

        {/* Success state */}
        {sent ? (
          <div className="flex flex-col items-center justify-center py-12 gap-5 px-6">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,rgba(54,30,123,0.5),rgba(124,91,245,0.3))", border: "1px solid rgba(124,91,245,0.4)" }}>
              <Briefcase size={36} style={{ color: "#9B7CF5" }} />
            </div>
            <div className="text-center">
              <p className="text-xl font-black mb-1.5" style={{ color: "#fff" }}>Request Sent!</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                Your hire request has been sent to{" "}
                <span style={{ color: "#9B7CF5", fontWeight: 600 }}>{authorName}</span>
                .<br />They&apos;ll review it in their hiring dashboard and get back to you.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              <Link
                href="/my-hires"
                onClick={onClose}
                className="w-full py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-85"
                style={{ background: "linear-gradient(135deg, #361E7B, #7C5BF5)", boxShadow: "0 4px 20px rgba(124,91,245,0.4)" }}
              >
                <Briefcase size={15} /> View My Hires
              </Link>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl text-sm font-medium transition-opacity hover:opacity-70"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>

              {/* What */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>
                  What are you hiring for? <span style={{ color: "#f43f5e" }}>*</span>
                </label>
                <input
                  value={what}
                  onChange={e => setWhat(e.target.value)}
                  placeholder="e.g. Illustration for book cover, Logo design, Portrait commission"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(124,91,245,0.08)", border: "1px solid rgba(124,91,245,0.2)", color: "#fff" }}
                />
              </div>

              {/* Categories */}
              <div className="relative">
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Art style / category <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>(up to 3)</span>
                </label>
                <button
                  onClick={() => setCatOpen(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: "rgba(124,91,245,0.08)", border: "1px solid rgba(124,91,245,0.2)", color: categories.length ? "#fff" : "rgba(255,255,255,0.35)" }}
                >
                  <span>{categories.length ? categories.join(", ") : "Select up to 3 categories"}</span>
                  <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.4)", transform: catOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                {catOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-20 max-h-48 overflow-y-auto"
                    style={{ background: "rgba(15,10,35,0.98)", border: "1px solid rgba(124,91,245,0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => toggleCat(c)}
                        className="w-full text-left px-3 py-2 text-sm transition-colors"
                        style={{
                          background: categories.includes(c) ? "rgba(124,91,245,0.2)" : "transparent",
                          color: categories.includes(c) ? "#9B7CF5" : "rgba(255,255,255,0.6)",
                        }}
                        onMouseEnter={e => { if (!categories.includes(c)) (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,91,245,0.08)"; }}
                        onMouseLeave={e => { if (!categories.includes(c)) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Budget */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: "rgba(255,255,255,0.5)" }}>Budget range</label>
                <div className="grid grid-cols-3 gap-2">
                  {BUDGETS.map(b => (
                    <button key={b} onClick={() => setBudget(b)}
                      className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs transition-all"
                      style={{
                        background: budget === b ? "rgba(124,91,245,0.2)" : "rgba(124,91,245,0.05)",
                        border: budget === b ? "1px solid #7C5BF5" : "1px solid rgba(124,91,245,0.15)",
                        color: budget === b ? "#9B7CF5" : "rgba(255,255,255,0.45)",
                      }}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0"
                        style={{ borderColor: budget === b ? "#7C5BF5" : "rgba(255,255,255,0.3)" }}>
                        {budget === b && <span className="w-2 h-2 rounded-full block" style={{ background: "#7C5BF5" }} />}
                      </span>
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job description */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>Project description</label>
                <textarea
                  value={jobDesc}
                  onChange={e => setJobDesc(e.target.value)}
                  placeholder={"- Overview of your project\n- Key deliverables expected\n- Ideal timeline\n- Any style references or mood board"}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "rgba(124,91,245,0.08)", border: "1px solid rgba(124,91,245,0.2)", color: "#fff" }}
                />
                <button className="flex items-center gap-1.5 mt-1.5 text-xs transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.35)" }}>
                  <Paperclip size={12} /> Add attachments
                </button>
              </div>

              {/* Personal note */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Personal note to {authorName}
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={`Hi ${authorName.split(" ")[0]}, I came across your work and think you'd be a perfect match for my project...`}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "rgba(124,91,245,0.08)", border: "1px solid rgba(124,91,245,0.2)", color: "#fff" }}
                />
              </div>

              {/* Hiring for */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: "rgba(255,255,255,0.5)" }}>Hiring on behalf of:</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["Personal Project", "Company"] as const).map(opt => (
                    <button key={opt} onClick={() => setHiringFor(opt)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: hiringFor === opt ? "rgba(124,91,245,0.15)" : "rgba(124,91,245,0.05)",
                        border: hiringFor === opt ? "1.5px solid #7C5BF5" : "1px solid rgba(124,91,245,0.15)",
                        color: hiringFor === opt ? "#9B7CF5" : "rgba(255,255,255,0.45)",
                      }}
                    >
                      <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: hiringFor === opt ? "#7C5BF5" : "rgba(255,255,255,0.3)" }}>
                        {hiringFor === opt && <span className="w-2 h-2 rounded-full block" style={{ background: "#7C5BF5" }} />}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info strip */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: "rgba(124,91,245,0.07)", border: "1px solid rgba(124,91,245,0.15)" }}>
                <ExternalLink size={13} style={{ color: "#9B7CF5", marginTop: 1, flexShrink: 0 }} />
                <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                  The artist will receive your request in their hiring dashboard only — no message will be sent. You can track your hire status in{" "}
                  <Link href="/my-hires" onClick={onClose} className="underline" style={{ color: "#9B7CF5" }}>My Hires</Link>.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 shrink-0" style={{ borderTop: "1px solid rgba(124,91,245,0.15)" }}>
              <button
                onClick={handleSubmit}
                disabled={sending || !what.trim()}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #361E7B, #7C5BF5)", boxShadow: "0 4px 20px rgba(124,91,245,0.4)" }}
              >
                {sending ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : "Send Hire Request"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
