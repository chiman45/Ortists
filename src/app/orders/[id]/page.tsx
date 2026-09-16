"use client";

import { useUser }      from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { use }          from "react";
import Link             from "next/link";
import { ArrowLeft, Package, MapPin, Truck, CheckCircle2, Circle, ExternalLink, Clock } from "lucide-react";

interface Order {
  id:                     string;
  item_title:             string;
  amount_paise:           number;
  status:                 string;
  courier_name:           string | null;
  awb_code:               string | null;
  tracking_url:           string | null;
  created_at:             string;
  shipping_name:          string | null;
  shipping_phone:         string | null;
  shipping_address:       string | null;
  shipping_city:          string | null;
  shipping_state:         string | null;
  shipping_pincode:       string | null;
  shiprocket_shipment_id: number | null;
}

const TIMELINE = [
  { key: "paid",       label: "Order Placed",      icon: Package },
  { key: "processing", label: "Artist Preparing",  icon: Clock },
  { key: "shipped",    label: "Picked Up by Courier", icon: Truck },
  { key: "delivered",  label: "Delivered",          icon: CheckCircle2 },
];

const STATUS_ORDER = ["pending", "paid", "processing", "shipped", "delivered"];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = use(params);
  const { user }  = useUser();

  const [order, setOrder]       = useState<Order | null>(null);
  const [tracking, setTracking] = useState<unknown>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(({ order: o, tracking: t }) => {
        setOrder(o ?? null);
        setTracking(t);
      })
      .finally(() => setLoading(false));
  }, [id, user]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "24px 16px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 120, borderRadius: 16, background: "rgba(255,255,255,0.04)", marginBottom: 12 }} className="skeleton-shimmer" />
        ))}
      </div>
    </div>
  );

  if (!order) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--text-3)" }}>Order not found.</p>
    </div>
  );

  const amount       = (order.amount_paise / 100).toLocaleString("en-IN");
  const date         = new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const currentStep  = STATUS_ORDER.indexOf(order.status);

  // Extract Shiprocket tracking activities if available
  const activities = (tracking as { tracking_data?: { shipment_track_activities?: Array<{ date: string; activity: string; location: string }> } })
    ?.tracking_data?.shipment_track_activities ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-1)" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* Back */}
        <Link href="/orders" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-3)", textDecoration: "none", marginBottom: 20, fontSize: 14 }}>
          <ArrowLeft size={16} /> My Orders
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{order.item_title}</h1>
            <p style={{ color: "var(--text-4)", fontSize: 13 }}>Ordered on {date}</p>
          </div>
          <div style={{ fontWeight: 700, fontSize: 20, color: "#7C5BF5" }}>₹{amount}</div>
        </div>

        {/* Status Timeline */}
        <Card title="Order Status">
          <div style={{ padding: "8px 0" }}>
            {TIMELINE.map((step, i) => {
              const stepIndex = STATUS_ORDER.indexOf(step.key);
              const done      = currentStep >= stepIndex;
              const active    = currentStep === stepIndex;
              const Icon      = step.icon;

              return (
                <div key={step.key} style={{ display: "flex", gap: 16, marginBottom: i < TIMELINE.length - 1 ? 0 : 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: done ? (active ? "rgba(124,91,245,0.2)" : "rgba(52,211,153,0.15)") : "rgba(255,255,255,0.05)",
                      border: `2px solid ${done ? (active ? "#7C5BF5" : "#34d399") : "rgba(255,255,255,0.12)"}`,
                      transition: "all 0.3s",
                    }}>
                      {done
                        ? <Icon size={16} color={active ? "#7C5BF5" : "#34d399"} />
                        : <Circle size={14} color="var(--text-5)" />
                      }
                    </div>
                    {i < TIMELINE.length - 1 && (
                      <div style={{
                        width: 2, flex: 1, minHeight: 32,
                        background: done && currentStep > stepIndex ? "#34d399" : "rgba(255,255,255,0.08)",
                        transition: "background 0.3s",
                      }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: i < TIMELINE.length - 1 ? 20 : 0, paddingTop: 6 }}>
                    <div style={{ fontWeight: active ? 700 : 500, fontSize: 14, color: done ? "var(--text-1)" : "var(--text-4)" }}>
                      {step.label}
                    </div>
                    {active && order.courier_name && (
                      <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>via {order.courier_name}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Tracking */}
        {(order.awb_code || order.shiprocket_shipment_id) && (
          <Card title="Tracking">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                {order.awb_code && (
                  <div style={{ fontSize: 13, color: "var(--text-3)" }}>
                    AWB: <span style={{ color: "var(--text-1)", fontWeight: 600, fontFamily: "monospace" }}>{order.awb_code}</span>
                  </div>
                )}
                {order.courier_name && (
                  <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>Courier: {order.courier_name}</div>
                )}
              </div>
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10,
                    background: "rgba(124,91,245,0.12)", color: "#7C5BF5", textDecoration: "none",
                    fontSize: 13, fontWeight: 600, border: "1px solid rgba(124,91,245,0.3)",
                  }}
                >
                  Track <ExternalLink size={13} />
                </a>
              )}
            </div>

            {activities.length > 0 && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14 }}>
                <div style={{ fontSize: 12, color: "var(--text-4)", marginBottom: 10, fontWeight: 600, letterSpacing: "0.06em" }}>
                  ACTIVITY
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {activities.slice(0, 6).map((act, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%", background: i === 0 ? "#34d399" : "rgba(255,255,255,0.2)",
                        marginTop: 5, flexShrink: 0,
                      }} />
                      <div>
                        <div style={{ fontSize: 13, color: "var(--text-2)" }}>{act.activity}</div>
                        <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>
                          {act.location} · {act.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Delivery Address */}
        {order.shipping_name && (
          <Card title="Delivery Address">
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <MapPin size={16} color="var(--text-3)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{order.shipping_name}</div>
                <div style={{ color: "var(--text-3)", fontSize: 13, lineHeight: 1.6 }}>
                  {order.shipping_address}<br />
                  {order.shipping_city}, {order.shipping_state} – {order.shipping_pincode}
                </div>
                {order.shipping_phone && (
                  <div style={{ color: "var(--text-4)", fontSize: 12, marginTop: 4 }}>{order.shipping_phone}</div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Price Summary */}
        <Card title="Payment">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-3)", fontSize: 14 }}>Amount Paid</span>
            <span style={{ fontWeight: 700, fontSize: 16 }}>₹{amount}</span>
          </div>
          <div style={{ color: "var(--text-5)", fontSize: 12, marginTop: 6 }}>via Razorpay · Prepaid</div>
        </Card>

      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.03)", padding: "18px 20px", marginBottom: 14,
    }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text-4)", letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase" }}>
        {title}
      </div>
      {children}
    </div>
  );
}
