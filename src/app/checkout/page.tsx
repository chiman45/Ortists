"use client";

import { useUser } from "@clerk/nextjs";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { INDIAN_STATES } from "@/components/address/AddressEditor";
import { Playfair_Display } from "next/font/google";
import {
  AlertTriangle, ArrowLeft, ArrowRight, Check, CreditCard, Landmark, Loader2, Plus, ShieldCheck,
  Smartphone, Truck, Wallet,
} from "lucide-react";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], display: "swap" });

// Checkout, in the order a buyer expects:
//   1. Delivery address  → checked with Shiprocket for this pincode
//   2. Order summary     → artwork + delivery charges, worked out on the server
//   3. Payment           → Razorpay
// Prices never come from this page: the server recomputes everything before charging.

interface Address {
  id: string; label: string; name: string; phone: string; address_line: string;
  city: string; state: string; pincode: string; country: string; is_default: boolean;
}

interface Item {
  post_id: string; title: string; image: string; artist_name: string; price_paise: number;
  unavailable: string | null;
  deliverable?: boolean; shipping_paise?: number; delivery_days?: number | null; delivery_note?: string | null;
  pincode_issue?: boolean;
}

interface Quote {
  items: Item[]; address: Address;
  subtotal_paise: number; shipping_paise: number; total_paise: number; ok: boolean;
}

/** Result of the Shiprocket check for one pincode. */
type Delivery =
  | { state: "checking" }
  | { state: "ok";    days: number | null; shipping_paise: number }
  // pincodeFault: the courier can't reach this pincode (false = the artwork itself can't be shipped yet)
  | { state: "bad";   notes: { post_id: string; title: string; note: string }[]; total: number; pincodeFault: boolean }
  | { state: "error"; message: string };

type AddressForm = Pick<Address, "label" | "name" | "phone" | "address_line" | "city" | "state" | "pincode">;
const EMPTY_FORM: AddressForm = { label: "Home", name: "", phone: "", address_line: "", city: "", state: "", pincode: "" };

const PAY_METHODS = [
  { key: "upi",        label: "UPI",                 hint: "Google Pay, PhonePe, Paytm, any UPI app", icon: Smartphone },
  { key: "card",       label: "Credit or debit card", hint: "Visa, Mastercard, RuPay",                 icon: CreditCard },
  { key: "netbanking", label: "Net banking",          hint: "All major banks",                         icon: Landmark },
  { key: "wallet",     label: "Wallet",               hint: "Paytm, Mobikwik and others",              icon: Wallet },
] as const;

const ACCENT = "#7C5BF5";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const rupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function loadRazorpay(): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).Razorpay) return Promise.resolve(true);
  return new Promise(resolve => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// useSearchParams() needs a Suspense boundary or `next build` fails on this page.
export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <Checkout />
    </Suspense>
  );
}

function Checkout() {
  const { user } = useUser();
  const router = useRouter();
  const buyNowId = useSearchParams().get("buy"); // set by "Buy Now"; otherwise we check out the cart

  const [step, setStep]           = useState<1 | 2 | 3>(1);
  const [postIds, setPostIds]     = useState<string[] | null>(null); // null = still loading
  const [items, setItems]         = useState<Item[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState<AddressForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [savingAddr, setSavingAddr] = useState(false);

  const [quote, setQuote]         = useState<Quote | null>(null);
  const [checking, setChecking]   = useState(false);
  // Delivery answer per pincode, filled in as soon as an address is on screen
  const [delivery, setDelivery]   = useState<Record<string, Delivery>>({});
  const [error, setError]         = useState<string | null>(null);
  const [method, setMethod]       = useState<(typeof PAY_METHODS)[number]["key"]>("upi");
  const [paying, setPaying]       = useState(false);
  const [done, setDone]           = useState<{ recorded: boolean; paymentId: string } | null>(null);

  // What are we buying?
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      let ids: string[] = [];
      if (buyNowId && UUID_RE.test(buyNowId)) ids = [buyNowId];
      else {
        const cart = await fetch("/api/cart").then(r => r.json()).catch(() => null);
        ids = ((cart?.items ?? []) as Item[]).filter(i => !i.unavailable).map(i => i.post_id);
      }
      if (cancelled) return;
      setPostIds(ids);
      if (!ids.length) return;
      const res = await fetch("/api/checkout/quote", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds: ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) setError(data.error ?? "Could not load your order.");
      else setItems(data.items ?? []);
    })();
    return () => { cancelled = true; };
  }, [user, buyNowId]);

  // Saved addresses
  useEffect(() => {
    if (!user) return;
    fetch("/api/addresses").then(r => r.json()).then(({ addresses: list }) => {
      const all: Address[] = list ?? [];
      setAddresses(all);
      setSelectedId((all.find(a => a.is_default) ?? all[0])?.id ?? null);
      if (!all.length) setShowForm(true);
    }).catch(() => {});
  }, [user]);

  const selected = useMemo(() => addresses.find(a => a.id === selectedId) ?? null, [addresses, selectedId]);
  const blocked  = items.filter(i => i.unavailable);

  /** Ask Shiprocket (through our server) whether this pincode can be reached. */
  const checkPin = useCallback(async (ids: string[], pincode: string) => {
    setDelivery(d => ({ ...d, [pincode]: { state: "checking" } }));
    let result: Delivery;
    try {
      const res = await fetch("/api/checkout/quote", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds: ids, pincode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) result = { state: "error", message: data.error ?? "We couldn't check delivery. Please try again." };
      else if (data.ok) {
        const days = (data.items as Item[]).map(i => i.delivery_days ?? 0);
        result = { state: "ok", days: Math.max(...days) || null, shipping_paise: data.shipping_paise };
      } else {
        const bad = (data.items as Item[]).filter(i => !i.deliverable);
        result = {
          state: "bad", total: data.items.length, pincodeFault: bad.every(i => i.pincode_issue),
          notes: bad.map(i => ({ post_id: i.post_id, title: i.title, note: i.delivery_note ?? "Can't be delivered here." })),
        };
      }
    } catch {
      result = { state: "error", message: "No internet connection. Please try again." };
    }
    setDelivery(d => ({ ...d, [pincode]: result }));
  }, []);

  // Check every saved address as soon as we know what is being bought
  const idsKey = (postIds ?? []).join(",");
  const pinsKey = [...new Set(addresses.map(a => a.pincode))].filter(p => /^\d{6}$/.test(p)).join(",");
  useEffect(() => {
    if (!idsKey || !pinsKey) return;
    const ids = idsKey.split(",");
    const t = setTimeout(() => { for (const pin of pinsKey.split(",")) checkPin(ids, pin); }, 0);
    return () => clearTimeout(t);
  }, [idsKey, pinsKey, checkPin]);

  // …and the pincode in the new-address form, once all 6 digits are typed
  const formPin = showForm && /^\d{6}$/.test(form.pincode.trim()) ? form.pincode.trim() : "";
  useEffect(() => {
    if (!idsKey || !formPin) return;
    const t = setTimeout(() => checkPin(idsKey.split(","), formPin), 300);
    return () => clearTimeout(t);
  }, [idsKey, formPin, checkPin]);

  /** Step 1 → 2: price the order for the chosen address (the server checks delivery again). */
  const toSummary = useCallback(async (ids: string[], addressId: string) => {
    setChecking(true); setError(null); setQuote(null);
    try {
      const res = await fetch("/api/checkout/quote", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds: ids, addressId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "We couldn't check delivery. Please try again."); return; }
      setQuote(data as Quote);
      if ((data as Quote).ok) setStep(2);
    } catch {
      setError("No internet connection. Please try again.");
    } finally {
      setChecking(false);
    }
  }, []);

  async function saveAddress() {
    const f = { ...form, name: form.name.trim(), address_line: form.address_line.trim(), city: form.city.trim(),
                phone: form.phone.replace(/\D/g, "").slice(-10), pincode: form.pincode.trim() };
    if (!f.name || !f.address_line || !f.city || !f.state) { setFormError("Please fill in every field."); return; }
    if (f.phone.length !== 10) { setFormError("Enter a 10-digit phone number."); return; }
    if (!/^\d{6}$/.test(f.pincode)) { setFormError("Enter a 6-digit pincode."); return; }
    const dl = delivery[f.pincode];
    if (dl?.state === "bad" && dl.pincodeFault && dl.notes.length === dl.total) {
      setFormError(`We can't deliver to pincode ${f.pincode}. Please use a different address.`); return;
    }
    setFormError(null); setSavingAddr(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.address) { setFormError(data.error ?? "Could not save this address."); return; }
      setAddresses(prev => [data.address, ...prev]);
      setSelectedId(data.address.id);
      setForm(EMPTY_FORM); setShowForm(false); setQuote(null); setError(null);
    } finally {
      setSavingAddr(false);
    }
  }

  async function deleteAddress(id: string) {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    setAddresses(prev => {
      const next = prev.filter(a => a.id !== id);
      if (selectedId === id) { setSelectedId(next[0]?.id ?? null); setQuote(null); }
      return next;
    });
  }

  /** Drop the artworks that can't go to this address; the checks run again for what is left. */
  function continueWithout(badIds: string[]) {
    if (!postIds) return;
    const next = postIds.filter(id => !badIds.includes(id));
    setPostIds(next);
    setItems(prev => prev.filter(i => next.includes(i.post_id)));
    setDelivery({}); setQuote(null);
  }

  async function pay() {
    if (!quote || !postIds || paying) return;
    setPaying(true); setError(null);
    try {
      if (!(await loadRazorpay())) throw new Error("Could not load the payment window. Please try again.");
      const res = await fetch("/api/checkout/pay", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds, addressId: quote.address.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.quote) {
        // Something changed since the summary (price, delivery) — show it again
        setQuote(null); setDelivery({}); setStep(1);
        if (postIds.length) for (const pin of pinsKey.split(",")) if (pin) checkPin(postIds, pin);
        throw new Error(data.error);
      }
      if (!res.ok) throw new Error(data.error ?? "Could not start the payment.");

      await new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rzp = new (window as any).Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          order_id: data.order_id,
          amount: data.amount,
          currency: data.currency,
          name: "Ortists",
          description: postIds.length === 1 ? (quote.items[0]?.title ?? "Artwork") : `${postIds.length} artworks`,
          image: "/logo.jpeg",
          prefill: {
            name:    data.name,
            contact: data.phone,
            email:   user?.primaryEmailAddress?.emailAddress ?? undefined,
            method,
          },
          theme: { color: ACCENT },
          handler: async (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            const v = await fetch("/api/verify-payment", {
              method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r),
            });
            const vd = await v.json().catch(() => ({}));
            if (!v.ok) { reject(new Error("We could not confirm your payment. If money was deducted, contact support with payment ID " + r.razorpay_payment_id + ".")); return; }
            setDone({ recorded: vd.recorded !== false, paymentId: r.razorpay_payment_id });
            window.dispatchEvent(new Event("ortists:cart-changed"));
            resolve();
          },
          modal: { ondismiss: () => reject(new Error("__dismissed__")) },
        });
        rzp.open();
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Payment failed.";
      if (msg !== "__dismissed__") setError(msg);
    } finally {
      setPaying(false);
    }
  }

  if (!user) return null;

  // ── Payment done ──
  if (done) {
    return (
      <Page>
        <div className="max-w-md mx-auto text-center py-16 md:py-24">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(16,185,129,0.14)" }}>
            <Check size={26} color="#10B981" />
          </div>
          <h1 className={`${playfair.className} text-3xl md:text-4xl font-semibold mb-3`} style={{ color: "var(--text-1)" }}>Thank you</h1>
          <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--text-3)" }}>
            {done.recorded
              ? "Your payment was received. The artist will pack and ship your artwork."
              : "Your payment was received, but we could not update your order automatically. Our team will confirm it shortly."}
          </p>
          <p className="text-xs mb-9" style={{ color: "var(--text-5)" }}>Payment ID {done.paymentId}</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push("/orders")} className={BTN} style={btnStyle(true)}>View your orders</button>
            <button onClick={() => router.push("/gallery")} className="text-sm font-semibold py-2 underline underline-offset-4 transition-opacity hover:opacity-75" style={{ color: "var(--text-3)" }}>
              Continue browsing
            </button>
          </div>
        </div>
      </Page>
    );
  }

  // ── Nothing to buy ──
  if (postIds && postIds.length === 0) {
    return (
      <Page>
        <div className="max-w-md mx-auto text-center py-16 md:py-24">
          <h1 className={`${playfair.className} text-2xl md:text-3xl font-semibold mb-3`} style={{ color: "var(--text-1)" }}>Nothing to check out</h1>
          <p className="text-sm mb-8" style={{ color: "var(--text-4)" }}>Add an artwork to your cart, or choose Buy Now on a listing.</p>
          <Link href="/gallery" className={`${BTN} inline-flex w-auto px-8`} style={btnStyle(true)}>Browse the gallery</Link>
        </div>
      </Page>
    );
  }

  const selectedDelivery = selected ? delivery[selected.pincode] : undefined;
  const canContinue = !!selected && !showForm && !checking && selectedDelivery?.state === "ok";
  const summaryItems = step > 1 && quote ? quote.items : items;
  const subtotalPaise = summaryItems.filter(i => !i.unavailable).reduce((s, i) => s + i.price_paise, 0);

  return (
    <Page>
      <button onClick={() => (step === 1 ? router.back() : setStep((step - 1) as 1 | 2))}
        className="inline-flex items-center gap-1.5 text-sm py-2 mb-4 transition-opacity hover:opacity-75" style={{ color: "var(--text-4)" }}>
        <ArrowLeft size={15} /> {step === 1 ? "Back" : step === 2 ? "Change address" : "Back to summary"}
      </button>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-1.5" style={{ color: "#9B7CF5" }}>Secure checkout</p>
          <h1 className={`${playfair.className} text-3xl md:text-4xl font-semibold`} style={{ color: "var(--text-1)", letterSpacing: "-0.01em" }}>Checkout</h1>
        </div>
        <Steps step={step} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-10 lg:gap-14 items-start pt-8">
        <div className="min-w-0">
          {error && (
            <div role="alert" className="flex items-start gap-2.5 text-sm rounded-xl px-4 py-3 mb-6"
              style={{ color: "#EF4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <AlertTriangle size={16} className="shrink-0 mt-0.5" /> <span>{error}</span>
            </div>
          )}

          {/* ───────── Step 1: address ───────── */}
          {step === 1 && (
            <>
              <Heading title="Delivery address" note="We check each address with our courier partner before you pay." />

              <div role="radiogroup" aria-label="Delivery address">
                {addresses.map(a => {
                  const on = selectedId === a.id;
                  return (
                    <label key={a.id} className="flex items-start gap-4 py-5 cursor-pointer" style={{ borderBottom: "1px solid var(--border)" }}>
                      <input type="radio" name="address" checked={on} className="mt-1 w-4 h-4 shrink-0"
                        onChange={() => { setSelectedId(a.id); setQuote(null); setError(null); }}
                        style={{ accentColor: ACCENT }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold" style={{ color: on ? "var(--text-1)" : "var(--text-2)" }}>
                          {a.name}
                          <span className="text-[11px] font-medium uppercase tracking-wider ml-2.5" style={{ color: "var(--text-5)" }}>{a.label}</span>
                        </p>
                        <p className="text-sm leading-relaxed mt-1" style={{ color: "var(--text-3)" }}>
                          {a.address_line}, {a.city}, {a.state} – {a.pincode}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "var(--text-5)" }}>{a.phone}</p>
                        <DeliveryStatus d={delivery[a.pincode]} pincode={a.pincode}
                          onRetry={() => postIds && checkPin(postIds, a.pincode)}
                          onDrop={on ? continueWithout : undefined} />
                      </div>
                      <button type="button" onClick={e => { e.preventDefault(); deleteAddress(a.id); }}
                        className="text-xs font-medium underline underline-offset-4 py-1 shrink-0 transition-opacity hover:opacity-70" style={{ color: "var(--text-5)" }}>
                        Remove
                      </button>
                    </label>
                  );
                })}
              </div>

              {showForm ? (
                <AddressFormView form={form} setForm={setForm} error={formError} saving={savingAddr}
                  delivery={formPin ? delivery[formPin] : undefined}
                  onSave={saveAddress} onCancel={addresses.length ? () => { setShowForm(false); setFormError(null); } : undefined} />
              ) : (
                <button onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold py-4 transition-opacity hover:opacity-75" style={{ color: "#9B7CF5" }}>
                  <Plus size={15} /> Add a new address
                </button>
              )}

              {blocked.length > 0 && (
                <p className="flex items-start gap-2 text-sm mt-2" style={{ color: "#f59e0b" }}>
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span>{blocked.map(i => `${i.title}: ${i.unavailable}`).join(" ")}</span>
                </p>
              )}

              {!showForm && (
                <button disabled={!canContinue} onClick={() => selected && postIds && toSummary(postIds, selected.id)}
                  className={`${BTN} mt-8`} style={btnStyle(canContinue)}>
                  {checking ? <><Loader2 size={16} className="animate-spin" /> One moment…</>
                    : selectedDelivery?.state === "checking" ? <><Loader2 size={16} className="animate-spin" /> Checking delivery to {selected?.pincode}…</>
                    : selectedDelivery?.state === "bad" ? (selectedDelivery.pincodeFault ? "Choose an address we can deliver to" : "This order can't be shipped yet")
                    : <>Deliver to this address <ArrowRight size={16} /></>}
                </button>
              )}
            </>
          )}

          {/* ───────── Step 2: summary ───────── */}
          {step === 2 && quote && (
            <>
              <Heading title="Review your order" />

              <div className="flex items-start justify-between gap-4 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="min-w-0">
                  <p className={LABEL} style={{ color: "var(--text-5)" }}>Delivering to</p>
                  <p className="text-[15px] font-semibold mt-2" style={{ color: "var(--text-1)" }}>{quote.address.name}</p>
                  <p className="text-sm leading-relaxed mt-1" style={{ color: "var(--text-3)" }}>
                    {quote.address.address_line}, {quote.address.city}, {quote.address.state} – {quote.address.pincode}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-5)" }}>{quote.address.phone}</p>
                </div>
                <button onClick={() => setStep(1)} className="text-sm font-semibold shrink-0 transition-opacity hover:opacity-75" style={{ color: "#9B7CF5" }}>Change</button>
              </div>

              <div className="py-5" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className={LABEL} style={{ color: "var(--text-5)" }}>Delivery</p>
                {quote.items.map(i => (
                  <div key={i.post_id} className="flex items-center justify-between gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-2 min-w-0" style={{ color: "var(--text-2)" }}>
                      <Truck size={15} className="shrink-0" style={{ color: "var(--text-5)" }} />
                      <span className="truncate">
                        <span className="capitalize">{i.title}</span>
                        <span style={{ color: "var(--text-5)" }}>{i.delivery_days ? `  ·  about ${i.delivery_days} days` : "  ·  standard delivery"}</span>
                      </span>
                    </span>
                    <span className="shrink-0" style={{ color: "var(--text-2)" }}>{rupees(i.shipping_paise ?? 0)}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => { setError(null); setStep(3); }} className={`${BTN} mt-8`} style={btnStyle(true)}>
                Continue to payment <ArrowRight size={16} />
              </button>
            </>
          )}

          {/* ───────── Step 3: payment ───────── */}
          {step === 3 && quote && (
            <>
              <Heading title="Payment method" note="You can still switch method inside the payment window." />

              <div role="radiogroup" aria-label="Payment method">
                {PAY_METHODS.map(m => (
                  <label key={m.key} className="flex items-center gap-4 py-4 cursor-pointer" style={{ borderBottom: "1px solid var(--border)" }}>
                    <input type="radio" name="method" checked={method === m.key} onChange={() => setMethod(m.key)}
                      className="w-4 h-4 shrink-0" style={{ accentColor: ACCENT }} />
                    <m.icon size={18} className="shrink-0" style={{ color: method === m.key ? "#9B7CF5" : "var(--text-5)" }} />
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold" style={{ color: method === m.key ? "var(--text-1)" : "var(--text-2)" }}>{m.label}</span>
                      <span className="block text-xs mt-0.5" style={{ color: "var(--text-5)" }}>{m.hint}</span>
                    </span>
                  </label>
                ))}
              </div>

              <button onClick={pay} disabled={paying} className={`${BTN} mt-8`} style={btnStyle(!paying)}>
                {paying ? <><Loader2 size={16} className="animate-spin" /> Opening payment…</> : `Pay ${rupees(quote.total_paise)}`}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-xs mt-4" style={{ color: "var(--text-5)" }}>
                <ShieldCheck size={13} /> Secured by Razorpay
              </p>
            </>
          )}
        </div>

        {/* ───────── Order summary (always visible) ───────── */}
        <aside className="rounded-2xl p-6 lg:sticky lg:top-8"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", boxShadow: "0 4px 24px var(--shadow)" }}>
          <h2 className={`${LABEL} mb-5`} style={{ color: "var(--text-4)" }}>
            Your order{summaryItems.length > 1 ? ` · ${summaryItems.length} artworks` : ""}
          </h2>

          <ul className="flex flex-col gap-4 pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
            {summaryItems.map(i => (
              <li key={i.post_id} className="flex items-center gap-3.5" style={{ opacity: i.unavailable ? 0.55 : 1 }}>
                {i.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.image} alt="" className="w-14 h-16 object-cover rounded-md shrink-0" style={{ background: "var(--bg-subtle)" }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`${playfair.className} text-[15px] font-semibold capitalize truncate`} style={{ color: "var(--text-1)" }}>{i.title}</p>
                  {i.artist_name && <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-5)" }}>{i.artist_name}</p>}
                </div>
                <p className="text-sm font-semibold shrink-0" style={{ color: i.unavailable ? "var(--text-5)" : "var(--text-2)" }}>
                  {i.unavailable ? "Unavailable" : rupees(i.price_paise)}
                </p>
              </li>
            ))}
            {!summaryItems.length && <li className="skeleton-shimmer rounded-md h-16" style={{ background: "var(--bg-subtle)" }} />}
          </ul>

          <div className="flex justify-between text-sm mt-5">
            <span style={{ color: "var(--text-3)" }}>Subtotal</span>
            <span style={{ color: "var(--text-2)" }}>{rupees(step > 1 && quote ? quote.subtotal_paise : subtotalPaise)}</span>
          </div>
          <div className="flex justify-between text-sm mt-3">
            <span style={{ color: "var(--text-3)" }}>Delivery</span>
            <span style={{ color: step > 1 && quote ? "var(--text-2)" : "var(--text-5)" }}>
              {step > 1 && quote ? rupees(quote.shipping_paise)
                : selectedDelivery?.state === "ok" ? rupees(selectedDelivery.shipping_paise) : "After address"}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-3">
            <span style={{ color: "var(--text-3)" }}>Service charges and taxes</span>
            <span style={{ color: "var(--text-5)" }}>Included</span>
          </div>

          <div className="flex justify-between items-baseline mt-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Total</span>
            <span className={`${playfair.className} text-2xl font-semibold`} style={{ color: "var(--text-1)" }}>
              {rupees(step > 1 && quote ? quote.total_paise
                : subtotalPaise + (selectedDelivery?.state === "ok" ? selectedDelivery.shipping_paise : 0))}
            </span>
          </div>
        </aside>
      </div>
    </Page>
  );
}

/* ───────────────────────── pieces ───────────────────────── */

const LABEL = "text-[11px] font-semibold tracking-[0.18em] uppercase";
const BTN = "w-full flex items-center justify-center gap-2 py-4 rounded-full text-[15px] font-bold transition-opacity hover:opacity-90";
const INPUT = "w-full px-3.5 py-3 rounded-xl text-base outline-none"; // 16px stops iOS zooming on focus

const btnStyle = (on: boolean): React.CSSProperties => ({
  background: on ? "var(--buy-bg)" : "var(--bg-subtle)",
  color: on ? "var(--buy-text)" : "var(--text-4)",
  cursor: on ? "pointer" : "not-allowed",
});
const inputStyle: React.CSSProperties = { background: "var(--bg-input)", border: "1px solid var(--border-card)", color: "var(--text-1)" };

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text-1)" }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-5 md:pt-8" style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom))" }}>{children}</div>
    </div>
  );
}

function Heading({ title, note }: { title: string; note?: string }) {
  return (
    <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
      <h2 className={`${playfair.className} text-xl md:text-2xl font-semibold`} style={{ color: "var(--text-1)" }}>{title}</h2>
      {note && <p className="text-sm mt-1.5" style={{ color: "var(--text-4)" }}>{note}</p>}
    </div>
  );
}

/** "Address — Summary — Payment", with the current step marked. */
function Steps({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Address", "Summary", "Payment"];
  return (
    <ol aria-label="Checkout steps" className="flex items-center gap-3 md:gap-4 text-sm">
      {labels.map((l, i) => {
        const n = i + 1, isDone = n < step, active = n === step;
        return (
          <li key={l} aria-current={active ? "step" : undefined} className="flex items-center gap-3 md:gap-4">
            <span className="flex items-center gap-2 pb-1.5"
              style={{ borderBottom: `2px solid ${active ? "var(--buy-bg)" : "transparent"}`, color: active ? "var(--text-1)" : isDone ? "var(--text-3)" : "var(--text-5)", fontWeight: active ? 700 : 500 }}>
              {isDone
                ? <Check size={14} color="#10B981" />
                : <span className="text-xs tabular-nums" style={{ color: active ? "#9B7CF5" : "var(--text-6)" }}>0{n}</span>}
              {l}
            </span>
            {i < 2 && <span aria-hidden className="w-5 md:w-8 h-px mb-1.5" style={{ background: "var(--border-card)" }} />}
          </li>
        );
      })}
    </ol>
  );
}

/** One line under an address: can Shiprocket's couriers reach this pincode? */
function DeliveryStatus({ d, pincode, onRetry, onDrop }: {
  d: Delivery | undefined; pincode: string; onRetry?: () => void; onDrop?: (badIds: string[]) => void;
}) {
  const row = "flex items-start gap-1.5 text-xs mt-2.5";
  const link = "text-xs font-semibold underline underline-offset-4";
  if (!d) return null;
  if (d.state === "checking") {
    return <p className={row} style={{ color: "var(--text-5)" }}><Loader2 size={13} className="animate-spin" /> Checking delivery to {pincode}…</p>;
  }
  if (d.state === "ok") {
    return (
      <p className={row} style={{ color: "#10B981" }}>
        <Check size={13} className="mt-px" />
        <span>Delivers here{d.days ? ` in about ${d.days} days` : ""}  ·  {rupees(d.shipping_paise)} delivery</span>
      </p>
    );
  }
  if (d.state === "error") {
    return (
      <p role="alert" className={`${row} flex-wrap`} style={{ color: "#EF4444" }}>
        <AlertTriangle size={13} className="mt-px" /> <span>{d.message}</span>
        {onRetry && <button type="button" onClick={e => { e.preventDefault(); onRetry(); }} className={link} style={{ color: "#9B7CF5" }}>Try again</button>}
      </p>
    );
  }
  const all = d.notes.length === d.total;
  return (
    <div role="alert" className="mt-2.5 text-xs">
      <p className="flex items-start gap-1.5 font-semibold" style={{ color: "#f59e0b" }}>
        <AlertTriangle size={13} className="mt-px shrink-0" />
        {!d.pincodeFault ? (d.total === 1 ? "This artwork can't be shipped yet" : `${d.notes.length} of ${d.total} artworks can't be shipped yet`)
          : all ? `We don't deliver to ${pincode} yet` : `${d.notes.length} of ${d.total} artworks can't be delivered to ${pincode}`}
      </p>
      {(!all || d.total === 1) && d.notes.map(n => (
        <p key={n.post_id} className="mt-1 leading-relaxed" style={{ color: "var(--text-4)" }}>{d.total > 1 ? `${n.title}: ` : ""}{n.note}</p>
      ))}
      {!all && onDrop && (
        <button type="button" onClick={e => { e.preventDefault(); onDrop(d.notes.map(n => n.post_id)); }} className={`${link} mt-2`} style={{ color: "#9B7CF5" }}>
          Continue without {d.notes.length === 1 ? "it" : "them"}
        </button>
      )}
    </div>
  );
}

function AddressFormView({ form, setForm, onSave, onCancel, saving, error, delivery }: {
  form: AddressForm; setForm: (f: AddressForm) => void; onSave: () => void; onCancel?: () => void; saving: boolean; error: string | null;
  delivery?: Delivery;
}) {
  const field = (key: keyof AddressForm, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`addr-${key}`} className="text-xs font-semibold" style={{ color: "var(--text-4)" }}>{label}</label>
      <input id={`addr-${key}`} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className={INPUT} style={inputStyle} {...extra} />
    </div>
  );
  return (
    <div className="pt-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-1)" }}>New address</h3>
        <div className="flex gap-1.5" role="radiogroup" aria-label="Address type">
          {(["Home", "Work", "Other"] as const).map(l => (
            <button key={l} type="button" role="radio" aria-checked={form.label === l} onClick={() => setForm({ ...form, label: l })}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{
                border: `1px solid ${form.label === l ? "var(--buy-bg)" : "var(--border-card)"}`,
                background: form.label === l ? "var(--buy-bg)" : "transparent",
                color: form.label === l ? "var(--buy-text)" : "var(--text-4)",
              }}>{l}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field("name", "Full name", { autoComplete: "name" })}
        {field("phone", "Phone number", { type: "tel", inputMode: "numeric", autoComplete: "tel", placeholder: "10-digit mobile number" })}
      </div>
      {field("address_line", "House no., street, area", { autoComplete: "street-address" })}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {field("pincode", "Pincode", { inputMode: "numeric", maxLength: 6, autoComplete: "postal-code" })}
        {field("city", "City", { autoComplete: "address-level2" })}
        <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
          <label htmlFor="addr-state" className="text-xs font-semibold" style={{ color: "var(--text-4)" }}>State</label>
          <select id="addr-state" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
            className={INPUT} style={{ ...inputStyle, background: "var(--bg)", color: form.state ? "var(--text-1)" : "var(--text-5)" }}>
            <option value="">Select state</option>
            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {/* The answer appears as soon as the pincode is complete, before the address is saved */}
      <div className="-mt-2"><DeliveryStatus d={delivery} pincode={form.pincode.trim()} /></div>

      {error && <p role="alert" className="text-sm" style={{ color: "#EF4444" }}>{error}</p>}

      <div className="flex items-center gap-5 pt-1">
        <button type="button" onClick={onSave} disabled={saving}
          className="px-7 py-3 rounded-full text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--buy-bg)", color: "var(--buy-text)" }}>
          {saving ? "Saving…" : "Save address"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm font-semibold transition-opacity hover:opacity-75" style={{ color: "var(--text-4)" }}>Cancel</button>
        )}
      </div>
    </div>
  );
}
