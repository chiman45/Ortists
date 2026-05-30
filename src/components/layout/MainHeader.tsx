"use client";

import { AtSign, Bell, CheckCheck, DollarSign, Heart, MessageCircle, Trophy, UserPlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Notif = {
  id: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  text: string;
  sub?: string;
  time: string;
  read: boolean;
};

const NOTIFS: Notif[] = [
  { id: 1, icon: UserPlus,      iconColor: "#9B7CF5", iconBg: "rgba(124,91,245,0.15)", text: "Alex Morgan started following you",                          time: "2m ago",  read: false },
  { id: 2, icon: Heart,         iconColor: "#f43f5e", iconBg: "rgba(244,63,94,0.15)",  text: "Emma Watson liked your artwork 'Cyberpunk Dreams'",           time: "15m ago", read: false },
  { id: 3, icon: MessageCircle, iconColor: "#60A5FA", iconBg: "rgba(96,165,250,0.15)", text: "James Chen commented on your post", sub: "This is absolutely stunning! The color palette is perfect.", time: "32m ago", read: false },
  { id: 4, icon: DollarSign,    iconColor: "#10B981", iconBg: "rgba(16,185,129,0.15)", text: "Sarah Miller sent you a commission request", sub: "Budget: $500–$1000 · Timeline: 2 weeks", time: "1h ago",  read: false },
  { id: 5, icon: AtSign,        iconColor: "#F59E0B", iconBg: "rgba(245,158,11,0.15)", text: "Marcus Rivera mentioned you in a comment",                    time: "2h ago",  read: false },
  { id: 6, icon: DollarSign,    iconColor: "#10B981", iconBg: "rgba(16,185,129,0.15)", text: "Luna Park purchased your artwork 'Abstract Horizons'",        time: "3h ago",  read: true  },
  { id: 7, icon: Trophy,        iconColor: "#F59E0B", iconBg: "rgba(245,158,11,0.15)", text: "Congratulations! You've reached 1,000 followers",             time: "5h ago",  read: true  },
];

export default function MainHeader({ children }: { children?: React.ReactNode }) {
  const [open, setOpen]     = useState(false);
  const [notifs, setNotifs] = useState(NOTIFS);
  const ref                 = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function markAll() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  function markOne(id: number) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  return (
    <div
      className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-8 py-3 sm:py-4"
      style={{
        background: "var(--bg-header)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {children && (
        <div className="flex-1 min-w-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {children}
        </div>
      )}

      <div className={`relative ${children ? "" : "ml-auto"}`} ref={ref}>
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

        {/* Dropdown */}
        {open && (
          <div
            className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              zIndex: 50,
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-sm font-bold flex-1" style={{ color: "var(--text-1)" }}>
                Notifications
                {unread > 0 && (
                  <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#7C5BF5", color: "#fff" }}>{unread}</span>
                )}
              </p>
              <button onClick={markAll} className="flex items-center gap-1 text-[11px] transition-opacity hover:opacity-70" style={{ color: "var(--text-5)" }}>
                <CheckCheck size={12} /> Mark all read
              </button>
              <button onClick={() => setOpen(false)} className="transition-opacity hover:opacity-70" style={{ color: "var(--text-5)" }}>
                <X size={14} />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: 380, scrollbarWidth: "none" }}>
              {notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => markOne(n.id)}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: n.read ? "transparent" : "rgba(124,91,245,0.04)",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = n.read ? "transparent" : "rgba(124,91,245,0.04)"; }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: n.iconBg }}>
                    <n.icon size={14} style={{ color: n.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug mb-0.5" style={{ color: "var(--text-2)", fontWeight: n.read ? 400 : 600 }}>{n.text}</p>
                    {n.sub && <p className="text-[11px] leading-relaxed mb-0.5 truncate" style={{ color: "var(--text-5)" }}>{n.sub}</p>}
                    <p className="text-[10px]" style={{ color: "var(--text-5)" }}>{n.time}</p>
                  </div>
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#9B7CF5" }} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
