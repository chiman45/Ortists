"use client";

import { useUser } from "@clerk/nextjs";
import { ChevronDown, Loader2, Paperclip, X } from "lucide-react";
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
  const [what, setWhat]           = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [catOpen, setCatOpen]     = useState(false);
  const [budget, setBudget]       = useState("");
  const [jobDesc, setJobDesc]     = useState("");
  const [note, setNote]           = useState("");
  const [hiringFor, setHiringFor] = useState<"Personal Project" | "Company">("Personal Project");
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState(false);

  function toggleCat(c: string) {
    setCategories(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : prev.length < 3 ? [...prev, c] : prev
    );
  }

  async function handleSubmit() {
    if (!user || !what.trim()) return;
    setSending(true);
    try {
      // Mock posts don't have a real authorUserId — just show success
      if (!authorUserId) { await new Promise(r => setTimeout(r, 600)); setSent(true); setSending(false); return; }

      // Get or create conversation with the artist
      const convRes = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_or_create_conversation", userId1: user.id, userId2: authorUserId }),
      });
      const { conversation } = await convRes.json();
      if (!conversation) throw new Error("Could not open conversation");

      // Send structured inquiry message
      const lines = [
        `💼 **Job Inquiry**`,
        `**What:** ${what}`,
        categories.length ? `**Categories:** ${categories.join(", ")}` : null,
        budget ? `**Budget:** ${budget}` : null,
        jobDesc.trim() ? `**Job Description:**\n${jobDesc}` : null,
        note.trim() ? `**Personal Note:** ${note}` : null,
        `**Hiring for:** ${hiringFor}`,
      ].filter(Boolean).join("\n");

      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_message",
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_name: user.fullName ?? user.username ?? "Hirer",
          sender_avatar: user.imageUrl,
          text: lines,
        }),
      });
      setSent(true);
    } catch {
      // silent
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
          style={{ background: "rgba(124,91,245,0.15)", color: "var(--text-4)" }}
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
            <h2 className="text-lg font-black" style={{ color: "var(--text-1)" }}>
              Invite{" "}
              <span style={{ background: "linear-gradient(90deg,#9B7CF5,#F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {authorName}
              </span>
            </h2>
            <p className="text-xs" style={{ color: "var(--text-5)" }}>Send a job inquiry directly</p>
          </div>
        </div>

        {sent ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 px-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ background: "rgba(124,91,245,0.2)", border: "1px solid rgba(124,91,245,0.4)" }}>
              ✅
            </div>
            <p className="text-lg font-bold text-center" style={{ color: "var(--text-1)" }}>Inquiry Sent!</p>
            <p className="text-sm text-center" style={{ color: "var(--text-5)" }}>
              Your job inquiry has been sent to {authorName} via messages.
            </p>
            <button onClick={onClose}
              className="mt-2 px-8 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#7C5BF5" }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>

              {/* What */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-4)" }}>
                  What are you hiring for? <span style={{ color: "#f43f5e" }}>*</span>
                </label>
                <input
                  value={what}
                  onChange={e => setWhat(e.target.value)}
                  placeholder="Illustration for book, Logo for new startup, etc"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(124,91,245,0.08)", border: "1px solid rgba(124,91,245,0.2)", color: "var(--text-1)" }}
                />
              </div>

              {/* Categories */}
              <div className="relative">
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-4)" }}>
                  Categories <span style={{ color: "var(--text-5)", fontWeight: 400 }}>(up to 3)</span>
                </label>
                <button
                  onClick={() => setCatOpen(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: "rgba(124,91,245,0.08)", border: "1px solid rgba(124,91,245,0.2)", color: categories.length ? "var(--text-1)" : "var(--text-5)" }}
                >
                  <span>{categories.length ? categories.join(", ") : "Select up to 3 categories"}</span>
                  <ChevronDown size={14} style={{ color: "var(--text-5)", transform: catOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                {catOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-20 max-h-48 overflow-y-auto"
                    style={{ background: "rgba(15,10,35,0.98)", border: "1px solid rgba(124,91,245,0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => toggleCat(c)}
                        className="w-full text-left px-3 py-2 text-sm transition-colors"
                        style={{
                          background: categories.includes(c) ? "rgba(124,91,245,0.2)" : "transparent",
                          color: categories.includes(c) ? "#9B7CF5" : "var(--text-3)",
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
                <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-4)" }}>What is your budget?</label>
                <div className="grid grid-cols-3 gap-2">
                  {BUDGETS.map(b => (
                    <button key={b} onClick={() => setBudget(b)}
                      className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs transition-all"
                      style={{
                        background: budget === b ? "rgba(124,91,245,0.2)" : "rgba(124,91,245,0.05)",
                        border: budget === b ? "1px solid #7C5BF5" : "1px solid rgba(124,91,245,0.15)",
                        color: budget === b ? "#9B7CF5" : "var(--text-4)",
                      }}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0"
                        style={{ borderColor: budget === b ? "#7C5BF5" : "var(--text-5)" }}
                      >
                        {budget === b && <span className="w-2 h-2 rounded-full block" style={{ background: "#7C5BF5" }} />}
                      </span>
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job description */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-4)" }}>Job description</label>
                <textarea
                  value={jobDesc}
                  onChange={e => setJobDesc(e.target.value)}
                  placeholder={"- Overview of your job\n- Key deliverables\n- Ideal timeline\n- etc..."}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "rgba(124,91,245,0.08)", border: "1px solid rgba(124,91,245,0.2)", color: "var(--text-1)" }}
                />
                <button className="flex items-center gap-1.5 mt-1.5 text-xs transition-opacity hover:opacity-70" style={{ color: "var(--text-5)" }}>
                  <Paperclip size={12} /> Add attachments...
                </button>
              </div>

              {/* Personal note */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-4)" }}>
                  Add a personal note to {authorName}
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={`Hi, I think you're a great match for a freelance job I'm hiring for.`}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "rgba(124,91,245,0.08)", border: "1px solid rgba(124,91,245,0.2)", color: "var(--text-1)" }}
                />
              </div>

              {/* Hiring for */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-4)" }}>I'm hiring for:</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["Personal Project", "Company"] as const).map(opt => (
                    <button key={opt} onClick={() => setHiringFor(opt)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: hiringFor === opt ? "rgba(124,91,245,0.15)" : "rgba(124,91,245,0.05)",
                        border: hiringFor === opt ? "1.5px solid #7C5BF5" : "1px solid rgba(124,91,245,0.15)",
                        color: hiringFor === opt ? "#9B7CF5" : "var(--text-4)",
                      }}
                    >
                      <span
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: hiringFor === opt ? "#7C5BF5" : "var(--text-5)" }}
                      >
                        {hiringFor === opt && <span className="w-2 h-2 rounded-full block" style={{ background: "#7C5BF5" }} />}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
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
                {sending ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : "Create Job & Send Inquiry"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
