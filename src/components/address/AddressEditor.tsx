"use client";

import { useEffect, useState } from "react";
import { Lock, MapPin, X } from "lucide-react";

// The artist's pickup address (also their default delivery address). It is
// private: only the owner and the courier ever see it, never other users.

export interface Address {
  id: string; label: string; name: string; phone: string; address_line: string;
  city: string; state: string; pincode: string; country: string; is_default: boolean;
}

export const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Chandigarh","Puducherry",
];

type Fields = Pick<Address, "name" | "phone" | "address_line" | "city" | "state" | "pincode">;
const EMPTY: Fields = { name: "", phone: "", address_line: "", city: "", state: "", pincode: "" };

/** The signed-in user's main address (default first), or null if they have none. */
export function useMyAddress(enabled: boolean) {
  const [address, setAddress] = useState<Address | null>(null);
  const [loaded, setLoaded]   = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch("/api/addresses")
      .then(r => (r.ok ? r.json() : { addresses: [] }))
      .then(({ addresses }) => { if (!cancelled) { setAddress(addresses?.[0] ?? null); setLoaded(true); } })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [enabled]);
  return { address, setAddress, loaded };
}

/** Add a new address, or edit `initial`. Saves by itself and reports the result. */
export default function AddressEditor({ initial, onSaved, onCancel, saveLabel = "Save address", defaultName = "" }: {
  initial?: Address | null;
  onSaved: (a: Address) => void;
  onCancel?: () => void;
  saveLabel?: string;
  defaultName?: string;
}) {
  const [form, setForm] = useState<Fields>(() => initial
    ? { name: initial.name, phone: initial.phone, address_line: initial.address_line, city: initial.city, state: initial.state, pincode: initial.pincode }
    : { ...EMPTY, name: defaultName });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function save() {
    const f: Fields = {
      name: form.name.trim(), address_line: form.address_line.trim(), city: form.city.trim(), state: form.state,
      phone: form.phone.replace(/\D/g, "").slice(-10), pincode: form.pincode.trim(),
    };
    if (!f.name || !f.address_line || !f.city || !f.state) { setError("Please fill in every field."); return; }
    if (f.phone.length !== 10) { setError("Enter a 10-digit phone number."); return; }
    if (!/^\d{6}$/.test(f.pincode)) { setError("Enter a 6-digit pincode."); return; }
    setError(null); setSaving(true);
    try {
      const res = await fetch(initial ? `/api/addresses/${initial.id}` : "/api/addresses", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, is_default: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.address) { setError(data.error ?? "Could not save this address. Please try again."); return; }
      onSaved(data.address as Address);
    } catch {
      setError("No internet connection. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const input = "w-full px-3.5 py-2.5 rounded-xl text-base md:text-sm outline-none";
  const inputStyle = { background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-1)" };
  const field = (key: keyof Fields, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`pa-${key}`} className="text-xs font-semibold" style={{ color: "var(--text-4)" }}>{label}</label>
      <input id={`pa-${key}`} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
        className={input} style={inputStyle} {...extra} />
    </div>
  );

  return (
    <div className="flex flex-col gap-3.5">
      {field("name", "Full name", { autoComplete: "name" })}
      {field("phone", "Phone number", { type: "tel", inputMode: "numeric", autoComplete: "tel", placeholder: "10-digit mobile number" })}
      {field("address_line", "House no., street, area", { autoComplete: "street-address" })}
      <div className="grid grid-cols-2 gap-3">
        {field("city", "City", { autoComplete: "address-level2" })}
        {field("pincode", "Pincode", { inputMode: "numeric", maxLength: 6, autoComplete: "postal-code" })}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pa-state" className="text-xs font-semibold" style={{ color: "var(--text-4)" }}>State</label>
        <select id="pa-state" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
          className={input} style={{ ...inputStyle, background: "var(--bg-card)", color: form.state ? "var(--text-1)" : "var(--text-5)" }}>
          <option value="">Select state</option>
          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <p role="alert" className="text-xs" style={{ color: "#EF4444" }}>{error}</p>}

      <div className="flex gap-3 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "var(--bg-subtle)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
            Cancel
          </button>
        )}
        <button type="button" onClick={save} disabled={saving}
          className="flex-[2] py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}>
          {saving ? "Saving…" : saveLabel}
        </button>
      </div>
    </div>
  );
}

/** Address shown as text, with the "only you can see this" note. */
export function AddressSummary({ address }: { address: Address }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{address.name}</p>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>
        {address.address_line}, {address.city}, {address.state} – {address.pincode}
      </p>
      <p className="text-xs" style={{ color: "var(--text-4)" }}>{address.phone}</p>
      <p className="flex items-center gap-1.5 text-[11px] mt-1" style={{ color: "var(--text-5)" }}>
        <Lock size={11} /> Only you and the courier can see this address.
      </p>
    </div>
  );
}

/** Popup asking for the pickup address, e.g. before listing an artwork for sale. */
export function AddressPopup({ title, message, onSaved, onClose, defaultName }: {
  title: string; message: string; onSaved: (a: Address) => void; onClose: () => void; defaultName?: string;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden"
        style={{ background: "var(--bg)", border: "1px solid var(--border)", maxHeight: "92dvh", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
        <div className="flex items-start gap-3 px-5 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(124,91,245,0.12)", border: "1px solid rgba(124,91,245,0.25)" }}>
            <MapPin size={18} style={{ color: "#9B7CF5" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold" style={{ color: "var(--text-1)" }}>{title}</h2>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-4)" }}>{message}</p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-opacity hover:opacity-70"
            style={{ background: "var(--bg-subtle)", color: "var(--text-4)" }}>
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5 overflow-y-auto" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
          <AddressEditor onSaved={onSaved} onCancel={onClose} saveLabel="Save and continue" defaultName={defaultName} />
        </div>
      </div>
    </div>
  );
}
