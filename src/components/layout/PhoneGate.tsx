"use client";

import { useUser } from "@clerk/nextjs";
import { Phone } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Required phone number on signup — our own field, not Clerk's.
 *
 * Clerk handles email + password (and that's the only way to log in); the
 * phone is stored on `profiles.phone`, unique per account (migration 014).
 * This gate shows a blocking modal to any signed-in user whose profile has no
 * phone yet, so every account — artist or client — ends up with one.
 */
export default function PhoneGate() {
  const { user, isLoaded } = useUser();
  const [needsPhone, setNeedsPhone] = useState(false);
  const [phone, setPhone]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    let cancelled = false;
    // ProfileSync creates the row on first login; wait for it before checking.
    const check = () =>
      fetch(`/api/profiles?username=${encodeURIComponent(user.id)}`)
        .then(r => r.json())
        .then(({ profile }) => {
          if (cancelled) return;
          if (!profile) { setTimeout(check, 1500); return; }
          setNeedsPhone(!profile.phone);
        })
        .catch(() => {});
    check();
    return () => { cancelled = true; };
  }, [isLoaded, user]);

  if (!needsPhone || !user) return null;

  async function save() {
    const trimmed = phone.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/sync", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerk_id: user!.id, phone: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not save your number. Please try again."); return; }
      setNeedsPhone(false);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full rounded-2xl p-7"
        style={{ maxWidth: 400, background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,91,245,0.15)" }}>
            <Phone size={18} style={{ color: "#9B7CF5" }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>One more thing</h2>
        </div>
        <p className="text-sm mb-5" style={{ color: "var(--text-4)" }}>
          Add your phone number to finish setting up your account. We use it for order and commission updates — it&apos;s never shown publicly.
        </p>

        <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-4)" }}>Phone number</label>
        <input
          type="tel"
          autoFocus
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") save(); }}
          placeholder="+91 98765 43210"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: "var(--bg-subtle)", border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "var(--border)"}`, color: "var(--text-1)" }}
        />
        {error && <p className="text-xs mt-2" style={{ color: "#EF4444" }}>{error}</p>}

        <button
          onClick={save}
          disabled={saving || !phone.trim()}
          className="w-full mt-4 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}
        >
          {saving ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
