"use client";

import { useUser }       from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MapPin, Phone, Plus, Check, ChevronRight, X, Package, Truck } from "lucide-react";

interface Address {
  id:           string;
  label:        string;
  name:         string;
  phone:        string;
  address_line: string;
  city:         string;
  state:        string;
  pincode:      string;
  country:      string;
  is_default:   boolean;
}

interface AddressFormData {
  label:        string;
  name:         string;
  phone:        string;
  address_line: string;
  city:         string;
  state:        string;
  pincode:      string;
}

const EMPTY_FORM: AddressFormData = {
  label: "Home", name: "", phone: "", address_line: "", city: "", state: "", pincode: "",
};

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Chandigarh","Puducherry",
];

export default function CheckoutPage() {
  const { user } = useUser();
  const router   = useRouter();
  const params   = useSearchParams();

  const listingId   = params.get("listingId");
  const itemTitle   = params.get("title")   ?? "Artwork";
  const itemPrice   = parseFloat(params.get("price") ?? "0");
  const itemImage   = params.get("image")   ?? "";
  const artistName  = params.get("artist")  ?? "";
  const artistPincode = params.get("artistPin") ?? "";
  const weight      = parseFloat(params.get("weight") ?? "0.5");

  const [addresses, setAddresses]       = useState<Address[]>([]);
  const [selected, setSelected]         = useState<Address | null>(null);
  const [showSheet, setShowSheet]       = useState(false);
  const [showAddForm, setShowAddForm]   = useState(false);
  const [form, setForm]                 = useState<AddressFormData>(EMPTY_FORM);
  const [savingAddr, setSavingAddr]     = useState(false);

  const [phone, setPhone]               = useState("");
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [savingPhone, setSavingPhone]   = useState(false);

  const [deliveryRate, setDeliveryRate] = useState<number | null>(null);
  const [deliveryDays, setDeliveryDays] = useState<string>("5–7");
  const [loadingRate, setLoadingRate]   = useState(false);

  const [orderDone, setOrderDone]       = useState(false);
  const [placing, setPlacing]           = useState(false);

  const GST_RATE   = 0.18;
  const gst        = Math.round(itemPrice * GST_RATE * 100) / 100;
  const delivery   = deliveryRate ?? 0;
  const total      = itemPrice + gst + delivery;

  // Load addresses + check phone
  useEffect(() => {
    if (!user) return;
    fetch("/api/addresses")
      .then(r => r.json())
      .then(({ addresses: list }) => {
        setAddresses(list ?? []);
        const def = (list ?? []).find((a: Address) => a.is_default) ?? list?.[0] ?? null;
        setSelected(def);
      });

    fetch(`/api/profiles?username=${user.id}`)
      .then(r => r.json())
      .then(({ profile }) => {
        if (!profile?.phone) setShowPhonePrompt(true);
        else setPhone(profile.phone);
      });
  }, [user]);

  // Fetch delivery rate whenever selected address changes
  useEffect(() => {
    if (!selected?.pincode || !artistPincode) return;
    setLoadingRate(true);
    fetch(`/api/shiprocket/rates?pickup=${artistPincode}&delivery=${selected.pincode}&weight=${weight}`)
      .then(r => r.json())
      .then(({ rates }) => {
        if (rates?.length) {
          const cheapest = [...rates].sort((a: { rate: number }, b: { rate: number }) => a.rate - b.rate)[0];
          setDeliveryRate(cheapest.rate);
          setDeliveryDays(String(cheapest.estimated_delivery_days ?? "5–7"));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRate(false));
  }, [selected?.pincode, artistPincode, weight]);

  async function savePhone() {
    if (!user || !phone.trim()) return;
    setSavingPhone(true);
    await fetch("/api/profile/sync", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerk_id: user.id, phone: phone.trim() }),
    });
    setSavingPhone(false);
    setShowPhonePrompt(false);
  }

  async function saveAddress() {
    if (!form.name || !form.phone || !form.address_line || !form.city || !form.state || !form.pincode) return;
    setSavingAddr(true);
    const res  = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const { address } = await res.json();
    setSavingAddr(false);
    setAddresses(prev => [address, ...prev]);
    setSelected(address);
    setForm(EMPTY_FORM);
    setShowAddForm(false);
    setShowSheet(false);
  }

  async function setDefault(addr: Address) {
    await fetch(`/api/addresses/${addr.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_default: true }),
    });
    setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === addr.id })));
    setSelected(addr);
    setShowSheet(false);
  }

  async function deleteAddress(id: string) {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    if (selected?.id === id) setSelected(updated[0] ?? null);
  }

  function handlePlaceOrder() {
    if (!selected) return;
    setPlacing(true);
    // Simulate processing delay, then show mock success
    setTimeout(() => {
      setPlacing(false);
      setOrderDone(true);
    }, 1200);
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-1)" }}>

      {/* Phone prompt modal */}
      {showPhonePrompt && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 60,
          background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#1e1e2e", borderRadius: 20, padding: 32, width: "min(90vw,400px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <Phone size={20} color="#7C5BF5" />
              <span style={{ fontWeight: 600, fontSize: 18 }}>Add Phone Number</span>
            </div>
            <p style={{ color: "var(--text-3)", fontSize: 14, marginBottom: 20 }}>
              Required for delivery updates and courier communication.
            </p>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)",
                color: "var(--text-1)", fontSize: 15, marginBottom: 16, boxSizing: "border-box",
              }}
            />
            <button
              onClick={savePhone}
              disabled={savingPhone || !phone.trim()}
              style={{
                width: "100%", padding: "13px", borderRadius: 12,
                background: "#7C5BF5", color: "#fff", fontWeight: 600,
                fontSize: 15, border: "none", cursor: "pointer", opacity: savingPhone ? 0.6 : 1,
              }}
            >
              {savingPhone ? "Saving…" : "Continue"}
            </button>
          </div>
        </div>
      )}

      {/* Order placed success popup */}
      {orderDone && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 60,
          background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#1e1e2e", borderRadius: 24, padding: "40px 36px", width: "min(90vw,420px)",
            border: "1px solid rgba(124,91,245,0.3)", textAlign: "center",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", background: "rgba(124,91,245,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
            }}>
              <Check size={36} color="#7C5BF5" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Order Placed!</h2>
            <p style={{ color: "var(--text-3)", fontSize: 14, marginBottom: 28 }}>
              Your order has been confirmed. The artist will prepare and ship your artwork soon.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => router.push("/orders")}
                style={{
                  padding: "13px", borderRadius: 12, background: "#7C5BF5",
                  color: "#fff", fontWeight: 600, fontSize: 15, border: "none", cursor: "pointer",
                }}
              >
                Track Your Order
              </button>
              <button
                onClick={() => router.push("/")}
                style={{
                  padding: "13px", borderRadius: 12, background: "rgba(255,255,255,0.06)",
                  color: "var(--text-2)", fontWeight: 500, fontSize: 15, border: "none", cursor: "pointer",
                }}
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address sheet */}
      {showSheet && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end",
        }} onClick={e => { if (e.target === e.currentTarget) { setShowSheet(false); setShowAddForm(false); } }}>
          <div style={{
            width: "100%", maxHeight: "85vh", overflowY: "auto",
            background: "#1a1a2e", borderRadius: "24px 24px 0 0", padding: "24px 20px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontWeight: 700, fontSize: 18 }}>Select Delivery Address</span>
              <button onClick={() => { setShowSheet(false); setShowAddForm(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color="var(--text-3)" />
              </button>
            </div>

            {addresses.map(addr => (
              <div key={addr.id} style={{
                padding: "16px", borderRadius: 14, marginBottom: 10, cursor: "pointer",
                border: `1px solid ${selected?.id === addr.id ? "rgba(124,91,245,0.6)" : "rgba(255,255,255,0.09)"}`,
                background: selected?.id === addr.id ? "rgba(124,91,245,0.07)" : "rgba(255,255,255,0.03)",
                display: "flex", alignItems: "flex-start", gap: 12,
              }} onClick={() => setDefault(addr)}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", border: "2px solid",
                  borderColor: selected?.id === addr.id ? "#7C5BF5" : "rgba(255,255,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2,
                }}>
                  {selected?.id === addr.id && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#7C5BF5" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{addr.name}</span>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 99,
                      background: "rgba(124,91,245,0.15)", color: "#7C5BF5", fontWeight: 600,
                    }}>{addr.label}</span>
                    {addr.is_default && (
                      <span style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 99,
                        background: "rgba(52,211,153,0.12)", color: "#34d399", fontWeight: 600,
                      }}>Default</span>
                    )}
                  </div>
                  <p style={{ color: "var(--text-3)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                    {addr.address_line}, {addr.city}, {addr.state} – {addr.pincode}
                  </p>
                  <p style={{ color: "var(--text-4)", fontSize: 12, margin: "4px 0 0" }}>{addr.phone}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteAddress(addr.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                >
                  <X size={14} color="var(--text-4)" />
                </button>
              </div>
            ))}

            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  width: "100%", padding: "14px", borderRadius: 14, marginTop: 4,
                  border: "1.5px dashed rgba(124,91,245,0.4)", background: "rgba(124,91,245,0.05)",
                  color: "#7C5BF5", fontWeight: 600, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Plus size={16} /> Add New Address
              </button>
            ) : (
              <AddressForm
                form={form}
                setForm={setForm}
                onSave={saveAddress}
                onCancel={() => setShowAddForm(false)}
                saving={savingAddr}
              />
            )}
          </div>
        </div>
      )}

      {/* Main checkout layout */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 80px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Checkout</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>

          {/* Item card */}
          <Section title="Order Item">
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {itemImage && (
                <img src={itemImage} alt={itemTitle} style={{
                  width: 80, height: 80, objectFit: "cover", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                }} />
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{itemTitle}</div>
                {artistName && <div style={{ color: "var(--text-3)", fontSize: 13 }}>by {artistName}</div>}
                <div style={{ color: "#7C5BF5", fontWeight: 700, fontSize: 18, marginTop: 6 }}>
                  ₹{itemPrice.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </Section>

          {/* Delivery address */}
          <Section title="Deliver To">
            {selected ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{selected.name}</span>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 99,
                      background: "rgba(124,91,245,0.15)", color: "#7C5BF5", fontWeight: 600,
                    }}>{selected.label}</span>
                  </div>
                  <p style={{ color: "var(--text-3)", fontSize: 14, margin: 0 }}>
                    {selected.address_line}, {selected.city}, {selected.state} – {selected.pincode}
                  </p>
                  <p style={{ color: "var(--text-4)", fontSize: 13, marginTop: 4 }}>{selected.phone}</p>
                </div>
                <button
                  onClick={() => setShowSheet(true)}
                  style={{
                    padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(124,91,245,0.4)",
                    background: "rgba(124,91,245,0.08)", color: "#7C5BF5", fontSize: 13,
                    fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  Change <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setShowSheet(true); setShowAddForm(true); }}
                style={{
                  width: "100%", padding: "14px", borderRadius: 14,
                  border: "1.5px dashed rgba(124,91,245,0.4)", background: "rgba(124,91,245,0.05)",
                  color: "#7C5BF5", fontWeight: 600, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <MapPin size={16} /> Add Delivery Address
              </button>
            )}
          </Section>

          {/* Delivery info */}
          {selected && (
            <Section title="Delivery">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Truck size={18} color="var(--text-3)" />
                {loadingRate ? (
                  <span style={{ color: "var(--text-3)", fontSize: 14 }}>Calculating delivery…</span>
                ) : deliveryRate !== null ? (
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Standard Delivery</span>
                    <span style={{ color: "var(--text-3)", fontSize: 13 }}> — arrives in {deliveryDays} days</span>
                    <span style={{ color: "#7C5BF5", fontWeight: 700, marginLeft: 8 }}>₹{deliveryRate}</span>
                  </div>
                ) : (
                  <span style={{ color: "var(--text-4)", fontSize: 14 }}>Delivery charge unavailable for this pincode</span>
                )}
              </div>
            </Section>
          )}

          {/* Price breakdown */}
          <Section title="Price Details">
            <PriceLine label="Artwork Price"    value={`₹${itemPrice.toLocaleString("en-IN")}`} />
            <PriceLine label="Delivery Charge"  value={loadingRate ? "…" : `₹${delivery}`} />
            <PriceLine label={`GST (18%)`}      value={`₹${gst.toFixed(2)}`} muted />
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "12px 0" }} />
            <PriceLine label="Total Amount"     value={`₹${total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`} bold />
          </Section>

          {/* Package info */}
          <Section title="Package">
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-3)", fontSize: 13 }}>
              <Package size={16} />
              <span>Weight: {weight} kg · Packed securely by artist</span>
            </div>
          </Section>

          {/* Place order */}
          <button
            onClick={handlePlaceOrder}
            disabled={!selected || placing}
            style={{
              width: "100%", padding: "16px", borderRadius: 16,
              background: selected ? "#7C5BF5" : "rgba(255,255,255,0.08)",
              color: selected ? "#fff" : "var(--text-4)",
              fontWeight: 700, fontSize: 17, border: "none", cursor: selected ? "pointer" : "not-allowed",
              opacity: placing ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {placing ? "Processing…" : `Place Order · ₹${total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
          </button>
          <p style={{ textAlign: "center", color: "var(--text-4)", fontSize: 12, marginTop: -8 }}>
            Secured by Razorpay · Your data is safe
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.03)", padding: "18px 20px",
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-3)", letterSpacing: "0.08em", marginBottom: 14, textTransform: "uppercase" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function PriceLine({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
      <span style={{ color: muted ? "var(--text-4)" : "var(--text-2)", fontSize: 14 }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, fontSize: bold ? 16 : 14, color: bold ? "var(--text-1)" : "var(--text-2)" }}>
        {value}
      </span>
    </div>
  );
}

function AddressForm({
  form, setForm, onSave, onCancel, saving,
}: {
  form: AddressFormData;
  setForm: (f: AddressFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const field = (key: keyof AddressFormData, label: string, placeholder: string, type = "text") => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, color: "var(--text-4)", display: "block", marginBottom: 4 }}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "11px 14px", borderRadius: 10, boxSizing: "border-box",
          border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
          color: "var(--text-1)", fontSize: 14,
        }}
      />
    </div>
  );

  return (
    <div style={{ marginTop: 16, padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ fontWeight: 600, marginBottom: 14 }}>New Address</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {(["Home", "Work", "Other"] as const).map(l => (
          <button
            key={l}
            onClick={() => setForm({ ...form, label: l })}
            style={{
              padding: "6px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: "1px solid",
              borderColor: form.label === l ? "#7C5BF5" : "rgba(255,255,255,0.12)",
              background: form.label === l ? "rgba(124,91,245,0.15)" : "transparent",
              color: form.label === l ? "#7C5BF5" : "var(--text-3)",
            }}
          >{l}</button>
        ))}
      </div>
      {field("name", "Full Name", "John Doe")}
      {field("phone", "Phone", "+91 98765 43210", "tel")}
      {field("address_line", "Address Line", "House No., Street, Area")}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-4)", display: "block", marginBottom: 4 }}>City</label>
          <input
            value={form.city}
            onChange={e => setForm({ ...form, city: e.target.value })}
            placeholder="Raipur"
            style={{
              width: "100%", padding: "11px 14px", borderRadius: 10, boxSizing: "border-box",
              border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
              color: "var(--text-1)", fontSize: 14,
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-4)", display: "block", marginBottom: 4 }}>Pincode</label>
          <input
            value={form.pincode}
            onChange={e => setForm({ ...form, pincode: e.target.value })}
            placeholder="492001"
            maxLength={6}
            style={{
              width: "100%", padding: "11px 14px", borderRadius: 10, boxSizing: "border-box",
              border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
              color: "var(--text-1)", fontSize: 14,
            }}
          />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 12, color: "var(--text-4)", display: "block", marginBottom: 4 }}>State</label>
        <select
          value={form.state}
          onChange={e => setForm({ ...form, state: e.target.value })}
          style={{
            width: "100%", padding: "11px 14px", borderRadius: 10, boxSizing: "border-box",
            border: "1px solid rgba(255,255,255,0.12)", background: "#1a1a2e",
            color: form.state ? "var(--text-1)" : "var(--text-4)", fontSize: 14,
          }}
        >
          <option value="">Select State</option>
          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: "12px", borderRadius: 10, background: "rgba(255,255,255,0.06)",
            color: "var(--text-2)", fontWeight: 600, border: "none", cursor: "pointer",
          }}
        >Cancel</button>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            flex: 2, padding: "12px", borderRadius: 10, background: "#7C5BF5",
            color: "#fff", fontWeight: 600, border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1,
          }}
        >{saving ? "Saving…" : "Save Address"}</button>
      </div>
    </div>
  );
}
