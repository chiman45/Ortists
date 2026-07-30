"use client";

import { useUser } from "@clerk/nextjs";
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

const TYPE_STYLE: Record<string, { color: string; bg: string; emoji: string }> = {
  follow:     { color: "#9B7CF5", bg: "rgba(124,91,245,0.15)", emoji: "👤" },
  like:       { color: "#f43f5e", bg: "rgba(244,63,94,0.15)",  emoji: "❤️" },
  comment:    { color: "#60A5FA", bg: "rgba(96,165,250,0.15)", emoji: "💬" },
  commission: { color: "#10B981", bg: "rgba(16,185,129,0.15)", emoji: "💼" },
  mention:    { color: "#F59E0B", bg: "rgba(245,158,11,0.15)", emoji: "@"  },
  purchase:   { color: "#10B981", bg: "rgba(16,185,129,0.15)", emoji: "💰" },
  milestone:  { color: "#F59E0B", bg: "rgba(245,158,11,0.15)", emoji: "🏆" },
};

function typeStyle(type: string) {
  return TYPE_STYLE[type] ?? { color: "#9B7CF5", bg: "rgba(124,91,245,0.15)", emoji: "🔔" };
}

function notifLink(n: Notification): string {
  const { type, text, post_id } = n;
  if (type === "comment") return post_id ? `/hiring/projects/${post_id}` : "/hiring";
  if (type === "commission") {
    if (text.includes("sent you")) return "/hiring?tab=requests";
    return post_id ? `/hiring/projects/${post_id}` : "/hiring";
  }
  if (type === "like" || type === "follow" || type === "mention") return "/feed";
  if (type === "purchase" || type === "milestone") return "/hiring";
  return "/feed";
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function MainHeader({ children }: { children?: React.ReactNode }) {
  const { user }            = useUser();
  const [open, setOpen]     = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const ref                 = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n => !n.read).length;

  async function fetchNotifs() {
    if (!user) return;
    const res = await fetch(`/api/notifications/list?userId=${user.id}`).catch(() => null);
    if (res?.ok) {
      const { notifications } = await res.json();
      setNotifs(notifications ?? []);
    }
  }

  useEffect(() => {
    if (user) fetchNotifs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Refresh when panel opens
  useEffect(() => {
    if (open && user) fetchNotifs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all", userId: user.id }),
    });
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function markOne(id: string) {
    await fetch("/api/notifications/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      {children && (
        <div className="flex-1 min-w-0">
          {children}
        </div>
      )}

      <div className={`flex items-center gap-2 ${children ? "" : "ml-auto"}`}>
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
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#f43f5e" }} />
            )}
          </button>

          {open && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(18,12,40,0.55)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(124,91,245,0.2)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
                zIndex: 50,
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(124,91,245,0.15)" }}>
                <p className="text-sm font-bold flex-1" style={{ color: "var(--text-1)" }}>
                  Notifications
                  {unread > 0 && (
                    <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "#7C5BF5", color: "#fff" }}>{unread}</span>
                  )}
                </p>
                <button onClick={markAll}
                  className="flex items-center gap-1 text-[11px] transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-5)" }}>
                  <CheckCheck size={12} /> Mark all read
                </button>
                <button onClick={() => setOpen(false)}
                  className="transition-opacity hover:opacity-70" style={{ color: "var(--text-5)" }}>
                  <X size={14} />
                </button>
              </div>

              {/* List */}
              <div className="overflow-y-auto" style={{ maxHeight: 380, scrollbarWidth: "none" }}>
                {notifs.length === 0 && (
                  <p className="text-xs text-center py-8" style={{ color: "var(--text-5)" }}>
                    No notifications yet
                  </p>
                )}
                {notifs.map(n => {
                  const s    = typeStyle(n.type);
                  const href = notifLink(n);
                  return (
                    <Link
                      key={n.id}
                      href={href}
                      onClick={() => { markOne(n.id); setOpen(false); }}
                      className="flex items-start gap-3 px-4 py-3 transition-colors"
                      style={{
                        textDecoration: "none",
                        display: "flex",
                        borderBottom: "1px solid rgba(124,91,245,0.1)",
                        background: n.read ? "transparent" : "rgba(124,91,245,0.06)",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,91,245,0.1)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = n.read ? "transparent" : "rgba(124,91,245,0.06)"; }}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm"
                        style={{ background: s.bg, color: s.color }}>
                        {n.actor_avatar ? (
                          <img src={n.actor_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : s.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug mb-0.5"
                          style={{ color: "var(--text-2)", fontWeight: n.read ? 400 : 600 }}>
                          {n.text}
                        </p>
                        {n.sub_text && (
                          <p className="text-[11px] leading-relaxed mb-0.5 truncate" style={{ color: "var(--text-5)" }}>
                            {n.sub_text}
                          </p>
                        )}
                        <p className="text-[10px]" style={{ color: "var(--text-5)" }}>
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#9B7CF5" }} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
