"use client";

import { useUser }  from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link         from "next/link";
import { Package, ChevronRight, ShoppingBag } from "lucide-react";

interface Order {
  id:                   string;
  item_title:           string;
  amount_paise:         number;
  status:               string;
  courier_name:         string | null;
  awb_code:             string | null;
  created_at:           string;
  shipping_city:        string | null;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "Pending",        color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  paid:       { label: "Payment Done",   color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  processing: { label: "Preparing",      color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  shipped:    { label: "Shipped",        color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  delivered:  { label: "Delivered",      color: "#34d399", bg: "rgba(52,211,153,0.15)" },
  failed:     { label: "Failed",         color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  refunded:   { label: "Refunded",       color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
};

export default function OrdersPage() {
  const { user }             = useUser();
  const [orders, setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/orders")
      .then(r => r.json())
      .then(({ orders: list }) => setOrders(list ?? []))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-1)" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px 80px" }}>

        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>My Orders</h1>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 96, borderRadius: 16, background: "rgba(255,255,255,0.04)" }} className="skeleton-shimmer" />
            ))}
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <ShoppingBag size={48} color="var(--text-4)" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-3)", fontSize: 16, marginBottom: 8 }}>No orders yet</p>
            <p style={{ color: "var(--text-4)", fontSize: 14 }}>Your orders will appear here once you make a purchase.</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map(order => {
            const meta = STATUS_META[order.status] ?? STATUS_META.pending;
            const amount = (order.amount_paise / 100).toLocaleString("en-IN");
            const date   = new Date(order.created_at).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            });

            return (
              <Link key={order.id} href={`/orders/${order.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)", padding: "18px 20px",
                  display: "flex", alignItems: "center", gap: 16, cursor: "pointer",
                  transition: "border-color 0.15s",
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: "rgba(124,91,245,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Package size={22} color="#7C5BF5" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {order.item_title ?? "Order"}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ color: "var(--text-4)", fontSize: 12 }}>{date}</span>
                      {order.shipping_city && (
                        <span style={{ color: "var(--text-4)", fontSize: 12 }}>→ {order.shipping_city}</span>
                      )}
                      <span style={{
                        fontSize: 11, padding: "2px 9px", borderRadius: 99, fontWeight: 600,
                        color: meta.color, background: meta.bg,
                      }}>{meta.label}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>₹{amount}</div>
                    <ChevronRight size={16} color="var(--text-4)" style={{ marginTop: 4 }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
