"use client";

import { useUser } from "@clerk/nextjs";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, CheckCheck, Settings, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Notification {
  id: string;
  user_id: string;
  actor_name: string | null;
  actor_avatar: string | null;
  type: string;
  text: string;
  sub_text: string | null;
  post_id: string | null;
  read: boolean;
  created_at: string;
}

// ── Helpers ─────────────────────────────────────────────────────

const TYPE_META: Record<string, { color: string; bg: string; emoji: string; tab: string }> = {
  like:            { color: "#f43f5e", bg: "rgba(244,63,94,0.18)",   emoji: "❤️", tab: "activity"    },
  comment:         { color: "#60A5FA", bg: "rgba(96,165,250,0.18)",  emoji: "💬", tab: "activity"    },
  follow:          { color: "#9B7CF5", bg: "rgba(124,91,245,0.18)",  emoji: "👤", tab: "activity"    },
  mention:         { color: "#F59E0B", bg: "rgba(245,158,11,0.18)",  emoji: "@",  tab: "activity"    },
  commission:      { color: "#10B981", bg: "rgba(16,185,129,0.18)",  emoji: "💼", tab: "projects"    },
  message:         { color: "#60A5FA", bg: "rgba(96,165,250,0.18)",  emoji: "✉️", tab: "projects"    },
  milestone:       { color: "#F59E0B", bg: "rgba(245,158,11,0.18)",  emoji: "🏆", tab: "projects"    },
  purchase:        { color: "#10B981", bg: "rgba(16,185,129,0.18)",  emoji: "💰", tab: "marketplace" },
  order:           { color: "#10B981", bg: "rgba(16,185,129,0.18)",  emoji: "📦", tab: "marketplace" },
  artwork_inquiry: { color: "#9B7CF5", bg: "rgba(124,91,245,0.18)", emoji: "🎨", tab: "marketplace" },
};

function meta(type: string) {
  return TYPE_META[type] ?? { color: "#9B7CF5", bg: "rgba(124,91,245,0.18)", emoji: "🔔", tab: "activity" };
}

function notifLink(n: Notification): string {
  const { type, text, post_id } = n;
  if (type === "like" || type === "comment" || type === "mention") return "/feed";
  if (type === "follow") return post_id ? `/profile?userId=${post_id}` : "/profile";
  if (type === "commission") {
    return text.includes("sent you a commission") ? "/hiring?tab=requests"
      : post_id ? `/hiring/projects/${post_id}` : "/hiring";
  }
  if (type === "message") return post_id ? `/hiring/projects/${post_id}` : "/hiring";
  if (type === "purchase" || type === "order") return "/hiring";
  if (type === "artwork_inquiry") return "/hiring";
  return "/feed";
}

function actionLabel(n: Notification): string {
  if (n.type === "like" || n.type === "comment" || n.type === "mention") return "View Post";
  if (n.type === "follow") return "View Profile";
  if (n.type === "commission")
    return n.text.includes("sent you a commission") ? "Open Request" : "View Project";
  if (n.type === "message") return "View Message";
  if (n.type === "purchase" || n.type === "order") return "View Order";
  if (n.type === "artwork_inquiry") return "View Inquiry";
  if (n.type === "milestone") return "View Project";
  return "View";
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type Tab = "all" | "activity" | "projects" | "marketplace";
const TABS: { key: Tab; label: string }[] = [
  { key: "all",         label: "All"         },
  { key: "activity",    label: "Activity"    },
  { key: "projects",    label: "Projects"    },
  { key: "marketplace", label: "Marketplace" },
];

// ── Icon component ───────────────────────────────────────────────

function NotifIcon({ n }: { n: Notification }) {
  const m = meta(n.type);
  if (n.actor_avatar) {
    return (
      <div className="relative shrink-0" style={{ width: 44, height: 44 }}>
        <img
          src={n.actor_avatar}
          alt=""
          className="rounded-full object-cover"
          style={{ width: 44, height: 44 }}
        />
        <span
          className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full text-[11px]"
          style={{ width: 20, height: 20, background: m.bg, border: "2px solid var(--bg-header)" }}
        >
          {m.emoji}
        </span>
      </div>
    );
  }
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-xl text-xl"
      style={{ width: 44, height: 44, background: m.bg }}
    >
      {m.emoji}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────

export default function MainHeader({ children }: { children?: React.ReactNode }) {
  const { user }            = useUser();
  const [open, setOpen]     = useState(false);
  const [tab, setTab]       = useState<Tab>("all");
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref                 = useRef<HTMLDivElement>(null);
  const { newLikes }        = useNotifications();

  const unread      = notifs.filter(n => !n.read).length;
  const totalBadge  = unread + newLikes;
  const filtered    = tab === "all" ? notifs : notifs.filter(n => meta(n.type).tab === tab);

  async function fetchNotifs() {
    if (!user) return;
    setLoading(true);
    const res = await fetch(`/api/notifications/list?userId=${user.id}`).catch(() => null);
    if (res?.ok) {
      const { notifications } = await res.json();
      setNotifs(notifications ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { if (user) fetchNotifs(); }, [user]); // eslint-disable-line

  useEffect(() => { if (open && user) fetchNotifs(); }, [open]); // eslint-disable-line

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  async function markAll() {
    if (!user) return;
    await fetch("/api/notifications/list", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all", userId: user.id }),
    });
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function markOne(id: string) {
    await fetch("/api/notifications/list", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_one", id }),
    });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  return (
    <div
      className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-8 py-2.5"
      style={{
        background: "var(--bg-header)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {children && <div className="flex-1 min-w-0">{children}</div>}

      <div className={`flex items-center gap-2 ${children ? "" : "ml-auto"}`}>
        {/* Ortist logo — top-right on every page */}
        <Link href="/feed" className="flex items-center mr-1" aria-label="Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/login-image/ortists logo1.png"
            alt="Ortist"
            style={{ height: 28, objectFit: "contain" }}
          />
        </Link>

        <Link
          href="/settings"
          className="p-2 rounded-xl transition-opacity hover:opacity-70 flex"
          style={{ background: "var(--bg-subtle)", color: "var(--text-icon)" }}
          aria-label="Settings"
        >
          <Settings size={19} strokeWidth={1.8} />
        </Link>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(v => !v)}
            className="relative p-2 rounded-xl transition-opacity hover:opacity-70"
            style={{ background: "var(--bg-subtle)", color: "var(--text-icon)" }}
            aria-label="Notifications"
          >
            <Bell size={19} strokeWidth={1.8} />
            {totalBadge > 0 && (
              <span
                className="absolute top-1 right-1 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ minWidth: 16, height: 16, padding: "0 3px", background: "#f43f5e" }}
              >
                {totalBadge > 9 ? "9+" : totalBadge}
              </span>
            )}
          </button>

          {open && (
            <div
              className="absolute right-0 top-full mt-2 flex flex-col rounded-2xl overflow-hidden"
              style={{
                width: 340,
                maxHeight: 520,
                background: "var(--bg-sidebar)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                border: "1px solid var(--border)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
                zIndex: 50,
              }}
            >
              {/* ── Header ── */}
              <div
                className="flex items-center gap-2 px-4 py-3 shrink-0"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <span className="text-sm font-bold flex-1" style={{ color: "var(--text-1)" }}>
                  Notifications
                  {unread > 0 && (
                    <span
                      className="ml-2 inline-flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ minWidth: 20, height: 20, padding: "0 6px", background: "#7C5BF5" }}
                    >
                      {unread}
                    </span>
                  )}
                </span>
                <button
                  onClick={markAll}
                  className="flex items-center gap-1 text-[11px] transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-5)" }}
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-5)" }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* ── Tabs ── */}
              <div className="flex gap-0.5 px-3 pt-2 pb-1 shrink-0">
                {TABS.map(({ key, label }) => {
                  const count = key === "all"
                    ? notifs.filter(n => !n.read).length
                    : notifs.filter(n => !n.read && meta(n.type).tab === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className="relative flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                      style={{
                        background: tab === key ? "rgba(124,91,245,0.18)" : "transparent",
                        color:      tab === key ? "#9B7CF5" : "var(--text-5)",
                      }}
                    >
                      {label}
                      {count > 0 && (
                        <span
                          className="flex items-center justify-center rounded-full text-[8px] font-bold text-white"
                          style={{ minWidth: 14, height: 14, padding: "0 3px", background: "#EF4444" }}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ── List ── */}
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-5 h-5 rounded-full border-2 animate-spin"
                      style={{ borderColor: "rgba(124,91,245,0.3)", borderTopColor: "#7C5BF5" }} />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Bell size={28} style={{ color: "var(--text-6)", opacity: 0.35 }} />
                    <p className="text-xs" style={{ color: "var(--text-5)" }}>
                      {tab === "all" ? "You're all caught up" : `No ${tab} notifications`}
                    </p>
                  </div>
                ) : (
                  filtered.map(n => {
                    const href = notifLink(n);
                    const label = actionLabel(n);
                    const m = meta(n.type);
                    return (
                      <Link
                        key={n.id}
                        href={href}
                        onClick={() => { markOne(n.id); setOpen(false); }}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 12,
                          padding: "12px 16px", textDecoration: "none",
                          borderBottom: "1px solid var(--border)",
                          background: n.read ? "transparent" : "rgba(124,91,245,0.05)",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,91,245,0.1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = n.read ? "transparent" : "rgba(124,91,245,0.05)"; }}
                      >
                        <NotifIcon n={n} />

                        <div className="flex-1 min-w-0">
                          <p
                            className="text-xs leading-snug"
                            style={{ color: "var(--text-1)", fontWeight: n.read ? 400 : 600 }}
                          >
                            {n.text}
                          </p>
                          {n.sub_text && (
                            <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--text-4)" }}>
                              {n.sub_text}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-1.5 gap-2">
                            <span className="text-[10px]" style={{ color: "var(--text-5)" }}>
                              {timeAgo(n.created_at)}
                            </span>
                            <span
                              className="text-[11px] font-semibold shrink-0"
                              style={{ color: m.color }}
                            >
                              {label} →
                            </span>
                          </div>
                        </div>

                        {!n.read && (
                          <div className="shrink-0 w-2 h-2 rounded-full mt-1.5" style={{ background: "#7C5BF5" }} />
                        )}
                      </Link>
                    );
                  })
                )}
              </div>

              {/* ── Footer ── */}
              {notifs.length > 0 && (
                <div
                  className="shrink-0 px-4 py-2.5 text-center"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <Link
                    href="/notifications"
                    onClick={() => setOpen(false)}
                    className="text-[11px] font-semibold transition-opacity hover:opacity-70"
                    style={{ color: "var(--text-5)" }}
                  >
                    View all notifications ↗
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
