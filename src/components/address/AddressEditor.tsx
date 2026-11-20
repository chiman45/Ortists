"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Loader2, Lock, MapPin, X } from "lucide-react";
import { getJSON } from "@/lib/clientCache";

// The artist's pickup address (also their default delivery address). It is
// private: only the owner and the courier ever see it, never other users.
//
// The address is collected in parts (house, area, landmark, pincode…) because
// the courier needs a complete address, and the pincode is checked with
// Shiprocket as soon as it is typed.

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

/** What Shiprocket says about a pincode. */
export interface PincodeInfo {
  pincode: string; found: boolean; city: string | null; state: string | null;
  localities: string[]; pickup: boolean;
}
type PinState =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "ok"; info: PincodeInfo }
  | { state: "error"; message: string };

/** Looks a 6-digit pincode up with Shiprocket (answers are remembered for 10 minutes). */
export function usePincode(pincode: string): PinState {
  const valid = /^\d{6}$/.test(pincode);
  const [result, setResult] = useState<{ pin: string; value: PinState } | null>(null);

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    const t = setTimeout(() => {
      getJSON<PincodeInfo>(`/api/shiprocket/pincode?pincode=${pincode}`, 600_000)
        .then(info => { if (!cancelled) setResult({ pin: pincode, value: { state: "ok", info } }); })
        .catch(() => { if (!cancelled) setResult({ pin: pincode, value: { state: "error", message: "We couldn't check this pincode right now." } }); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [pincode, valid]);

  if (!valid) return { state: "idle" };
  return result?.pin === pincode ? result.value : { state: "checking" };
}

/** One line telling the user what the pincode check found. */
export function PincodeStatus({ pin, pincode }: { pin: PinState; pincode: string }) {
  const row = "flex items-start gap-1.5 text-xs";
  if (pin.state === "idle") return null;
  if (pin.state === "checking") {
    return <p className={row} style={{ color: "var(--text-5)" }}><Loader2 size={13} className="animate-spin mt-px" /> Checking {pincode} with our courier partner…</p>;
  }
  if (pin.state === "error") {
    return <p className={row} style={{ color: "var(--text-4)" }}><AlertTriangle size={13} className="mt-px shrink-0" /> {pin.message} You can still save the address.</p>;
  }
  const { info } = pin;
  if (!info.found && !info.pickup) {
    return <p role="alert" className={row} style={{ color: "#F87171" }}><AlertTriangle size={13} className="mt-px shrink-0" /> We couldn&apos;t find pincode {pincode}. Please check it.</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      {info.found && (
        <p className={row} style={{ color: "var(--text-3)" }}>
          <MapPin size={13} className="mt-px shrink-0" /> {info.city}, {info.state}
        </p>
      )}
      {info.pickup ? (
        <p className={row} style={{ color: "#10B981" }}><Check size={13} className="mt-px shrink-0" /> Courier pickup and delivery are available at {pincode}.</p>
      ) : (
        <p role="alert" className={row} style={{ color: "#f59e0b" }}>
          <AlertTriangle size={13} className="mt-px shrink-0" />
          Couriers don&apos;t collect parcels from {pincode} yet, so artwork can&apos;t be shipped from this address.
        </p>
      )}
    </div>
  );
}

interface Fields {
  name: string; phone: string; house: string; area: string; landmark: string;
  city: string; state: string; pincode: string;
}
const EMPTY: Fields = { name: "", phone: "", house: "", area: "", landmark: "", city: "", state: "", pincode: "" };

/** "12, Sector 11, Zone 1, Landmark: Near SBI" → house / area / landmark */
function splitLine(line: string): Pick<Fields, "house" | "area" | "landmark"> {
  const m = line.match(/^(.*?),?\s*Landmark:\s*(.+)$/i);
  const body = (m ? m[1] : line).trim();
  const comma = body.indexOf(",");
  return {
    house:    comma === -1 ? body : body.slice(0, comma).trim(),
    area:     comma === -1 ? "" : body.slice(comma + 1).trim(),
    landmark: m ? m[2].trim() : "",
  };
}

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
    ? { name: initial.name, phone: initial.phone, ...splitLine(initial.address_line), city: initial.city, state: initial.state, pincode: initial.pincode }
    : { ...EMPTY, name: defaultName });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const pincode = form.pincode.trim();
  const pin = usePincode(pincode);
  const info = pin.state === "ok" ? pin.info : null;

  // Fill city and state in from the pincode (the user can still change them)
  const filledFor = info?.found ? info.pincode : null;
  useEffect(() => {
    if (!info?.found || !info.city || !info.state) return;
    const { city, state } = info;
    queueMicrotask(() => setForm(f => (f.pincode.trim() === info.pincode ? { ...f, city, state } : f)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filledFor]);

  const states = form.state && !INDIAN_STATES.includes(form.state) ? [form.state, ...INDIAN_STATES] : INDIAN_STATES;

  async function save() {
    const f = {
      name: form.name.trim(), house: form.house.trim(), area: form.area.trim(), landmark: form.landmark.trim(),
      city: form.city.trim(), state: form.state, pincode,
      phone: form.phone.replace(/\D/g, "").slice(-10),
    };
    if (!f.name) { setError("Enter the full name of the person at this address."); return; }
    if (f.phone.length !== 10) { setError("Enter a 10-digit phone number."); return; }
    if (!/^\d{6}$/.test(f.pincode)) { setError("Enter a 6-digit pincode."); return; }
    if (info && !info.found && !info.pickup) { setError(`We couldn't find pincode ${f.pincode}. Please check it.`); return; }
    if (!f.house) { setError("Enter the house or flat number and building."); return; }
    if (!f.area) { setError("Enter the street, area or locality."); return; }
    if (!f.city || !f.state) { setError("Enter the city and state."); return; }

    const address_line = [f.house, f.area, f.landmark ? `Landmark: ${f.landmark}` : ""].filter(Boolean).join(", ");
    setError(null); setSaving(true);
    try {
      const res = await fetch(initial ? `/api/addresses/${initial.id}` : "/api/addresses", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: f.name, phone: f.phone, address_line, city: f.city, state: f.state, pincode: f.pincode, is_default: true }),
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
  const field = (key: keyof Fields, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}, optional = false) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`pa-${key}`} className="text-xs font-semibold" style={{ color: "var(--text-4)" }}>
        {label}{optional && <span className="font-normal" style={{ color: "var(--text-6)" }}> (optional)</span>}
      </label>
      <input id={`pa-${key}`} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
        className={input} style={inputStyle} {...extra} />
    </div>
  );

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field("name", "Full name", { autoComplete: "name" })}
        {field("phone", "Phone number", { type: "tel", inputMode: "numeric", autoComplete: "tel", placeholder: "10-digit mobile number" })}
      </div>

      {/* Pincode first: it fills in the city and state and is checked with the courier */}
      <div className="flex flex-col gap-2">
        {field("pincode", "Pincode", { inputMode: "numeric", maxLength: 6, autoComplete: "postal-code", placeholder: "6 digits" })}
        <PincodeStatus pin={pin} pincode={pincode} />
      </div>

      {field("house", "House / flat no., building", { autoComplete: "address-line1", placeholder: "e.g. 24-B, Shanti Apartments" })}
      {field("area", "Street, area, locality", { autoComplete: "address-line2", placeholder: "e.g. Street 20, Sector 11", list: "pa-localities" })}
      <datalist id="pa-localities">
        {(info?.localities ?? []).map(l => <option key={l} value={l} />)}
      </datalist>
      {field("landmark", "Landmark", { placeholder: "e.g. Near the water tank" }, true)}

      <div className="grid grid-cols-2 gap-3">
        {field("city", "City / district", { autoComplete: "address-level2" })}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pa-state" className="text-xs font-semibold" style={{ color: "var(--text-4)" }}>State</label>
          <select id="pa-state" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
            className={input} style={{ ...inputStyle, background: "var(--bg-card)", color: form.state ? "var(--text-1)" : "var(--text-5)" }}>
            <option value="">Select state</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
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

/** Address shown line by line, with the courier check and the "only you can see this" note. */
export function AddressSummary({ address }: { address: Address }) {
  const pin = usePincode(address.pincode);
  const parts = splitLine(address.address_line);
  const rows = [
    { label: "Name",     value: address.name },
    { label: "Phone",    value: address.phone },
    { label: "House",    value: parts.house },
    { label: "Area",     value: parts.area },
    { label: "Landmark", value: parts.landmark },
    { label: "City",     value: address.city },
    { label: "State",    value: address.state },
    { label: "Pincode",  value: address.pincode },
  ].filter(r => !!r.value);

  return (
    <div className="flex flex-col gap-3">
      <dl>
        {rows.map(r => (
          <div key={r.label} className="flex items-baseline justify-between gap-4 py-1.5">
            <dt className="text-xs shrink-0" style={{ color: "var(--text-5)" }}>{r.label}</dt>
            <dd className="text-sm text-right break-words min-w-0" style={{ color: "var(--text-2)" }}>{r.value}</dd>
          </div>
        ))}
      </dl>
      <PincodeStatus pin={pin} pincode={address.pincode} />
      <p className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-5)" }}>
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
