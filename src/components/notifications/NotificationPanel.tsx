"use client";

import { useUser } from "@clerk/nextjs";
import { Bell, Briefcase, MessageSquare, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface NotifItem {
  id: string;
  type: "message" | "hire_request";
  title: string;
  body: string;
  link: string;
  created_at: string;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type Tab = "all" | "messages" | "requests";

export function NotificationPanel({
  onClose,
  style,
}: {
  onClose: () => void;
  style?: React.CSSProperties;
}) {
  const { user } = useUser();
  const [items, setItems]   = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState<Tab>("all");

  useEffect(() => {
    if (!user) return;
    fetch(`/api/notifications/panel?userId=${user.id}`)
      .then(r => r.json())
      .then(({ notifications }) => { setItems(notifications ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  const filtered =
    tab === "all"      ? items :
    tab === "messages" ? items.filter(i => i.type === "message") :
                         items.filter(i => i.type === "hire_request");

  const TABS: { key: Tab; label: string }[] = [
    { key: "all",      label: "All" },
    { key: "messages", label: "Messages" },
    { key: "requests", label: "Requests" },
  ];

  return (
    <>
      {/* Click-outside overlay */}
      <div className="fixed inset-0 z-[59]" onClick={onClose} />

      <div
        className="absolute z-[60] flex flex-col"
        style={{
          width: 300,
          maxHeight: 460,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
          backdropFilter: "blur(20px)",
          ...style,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
              Notifications
            </span>
            {items.length > 0 && (
              <span
                className="flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ minWidth: 18, height: 18, padding: "0 5px", background: "#7C5BF5" }}
              >
                {items.length > 99 ? "99+" : items.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg p-1 transition-opacity hover:opacity-60"
          >
            <X size={14} style={{ color: "var(--text-4)" }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-3 pt-2 pb-1 shrink-0">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
              style={{
                background: tab === key ? "rgba(124,91,245,0.18)" : "transparent",
                color:      tab === key ? "#9B7CF5" : "var(--text-5)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div
                className="w-5 h-5 rounded-full border-2 animate-spin"
                style={{ borderColor: "rgba(124,91,245,0.3)", borderTopColor: "#7C5BF5" }}
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Bell size={28} style={{ color: "var(--text-6)", opacity: 0.35 }} />
              <p className="text-xs" style={{ color: "var(--text-5)" }}>
                {tab === "all" ? "You're all caught up" : `No ${tab}`}
              </p>
            </div>
          ) : (
            filtered.map(item => (
              <Link
                key={item.id}
                href={item.link}
                onClick={onClose}
                className="flex items-start gap-3 px-2 py-2.5 rounded-xl transition-colors"
                style={{ textDecoration: "none" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <div
                  className="shrink-0 flex items-center justify-center rounded-xl mt-0.5"
                  style={{
                    width: 34, height: 34,
                    background: item.type === "message"
                      ? "rgba(124,91,245,0.15)"
                      : "rgba(245,158,11,0.15)",
                  }}
                >
                  {item.type === "message"
                    ? <MessageSquare size={15} style={{ color: "#9B7CF5" }} />
                    : <Briefcase    size={15} style={{ color: "#FCD34D" }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--text-1)" }}>
                    {item.title}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: "var(--text-4)" }}>
                    {item.body}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-6)" }}>
                    {timeAgo(item.created_at)}
                  </p>
                </div>
                {/* Unread dot */}
                <div
                  className="shrink-0 w-2 h-2 rounded-full mt-2"
                  style={{ background: "#7C5BF5" }}
                />
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
}
