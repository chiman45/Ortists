"use client";

import { useUser } from "@clerk/nextjs";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Artist } from "@/lib/hiringData";

interface Props {
  artist: Artist;
  onClose: () => void;
}

export default function HireModal({ artist, onClose }: Props) {
  const { user } = useUser();
  const router = useRouter();
  const [title, setTitle]   = useState(`Commission — ${artist.name}`);
  const [desc, setDesc]     = useState("");
  const [budget, setBudget] = useState(String(artist.price));
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("High");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/hire-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:           user.id,
          artist_id:           artist.id,
          artist_name:         artist.name,
          artist_avatar:       artist.avatar,
          artist_location:     artist.location,
          artist_rating:       artist.rating,
          project_title:       title.trim(),
          project_description: desc.trim() || null,
          budget:              budget ? Number(budget) : null,
          deadline:            deadline || null,
          priority,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create request");
      router.push(`/hiring/projects/${json.request.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={artist.avatar} alt={artist.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>Hire {artist.name}</p>
            <p className="text-xs" style={{ color: "var(--text-5)" }}>{artist.location} · ${artist.price.toLocaleString()} base rate</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70 shrink-0"
            style={{ background: "var(--bg-subtle)", color: "var(--text-4)" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-4)" }}>Project Title *</label>
            <input
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give your project a title…"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-4)" }}>Brief / Description</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Describe what you need…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-4)" }}>Budget (USD)</label>
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="e.g. 2500"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-4)" }}>Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-4)" }}>Priority</label>
            <div className="flex gap-2">
              {(["Low", "Medium", "High"] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: priority === p ? "rgba(124,91,245,0.15)" : "var(--bg-card)",
                    color: priority === p ? "#9B7CF5" : "var(--text-4)",
                    border: priority === p ? "1px solid rgba(124,91,245,0.5)" : "1px solid var(--border)",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-center" style={{ color: "#F87171" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50 hover:opacity-90"
            style={{ background: "#7C5BF5" }}
          >
            {loading ? "Sending Request…" : "Send Hire Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
