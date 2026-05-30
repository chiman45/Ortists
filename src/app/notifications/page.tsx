"use client";

import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";
import { Bell, CheckCheck, Settings, SlidersHorizontal, TrendingUp, Calendar, CheckCircle2, AtSign, Heart, MessageCircle, DollarSign, Trophy, UserPlus } from "lucide-react";
import { useState } from "react";

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

const TODAY: Notif[] = [
  { id: 1,  icon: UserPlus,       iconColor: "#9B7CF5", iconBg: "rgba(124,91,245,0.15)", text: "Alex Morgan started following you",                                          time: "2 minutes ago",  read: false },
  { id: 2,  icon: Heart,          iconColor: "#f43f5e", iconBg: "rgba(244,63,94,0.15)",  text: "Emma Watson liked your artwork 'Cyberpunk Dreams'",                          time: "15 minutes ago", read: false },
  { id: 3,  icon: MessageCircle,  iconColor: "#60A5FA", iconBg: "rgba(96,165,250,0.15)", text: "James Chen commented on your post",  sub: "This is absolutely stunning! The color palette is perfect. Would love to see more like this!", time: "32 minutes ago", read: false },
  { id: 4,  icon: DollarSign,     iconColor: "#10B981", iconBg: "rgba(16,185,129,0.15)", text: "Sarah Miller sent you a commission request", sub: "Looking for a custom illustration for my upcoming project. Budget: $500–$1000. Timeline: 2 weeks.", time: "1 hour ago",     read: false },
  { id: 5,  icon: AtSign,         iconColor: "#F59E0B", iconBg: "rgba(245,158,11,0.15)", text: "Marcus Rivera mentioned you in a comment", sub: "@YourUsername your style would be perfect for this collaboration project!", time: "2 hours ago",    read: false },
  { id: 6,  icon: DollarSign,     iconColor: "#10B981", iconBg: "rgba(16,185,129,0.15)", text: "Luna Park purchased your artwork 'Abstract Horizons'",                       time: "3 hours ago",    read: true  },
  { id: 7,  icon: Trophy,         iconColor: "#F59E0B", iconBg: "rgba(245,158,11,0.15)", text: "Congratulations! You've reached 1,000 followers",                            time: "5 hours ago",    read: true  },
];

const YESTERDAY: Notif[] = [
  { id: 8,  icon: UserPlus,       iconColor: "#9B7CF5", iconBg: "rgba(124,91,245,0.15)", text: "David Kim saved your artwork to their collection",                           time: "Yesterday",      read: true  },
  { id: 9,  icon: Heart,          iconColor: "#f43f5e", iconBg: "rgba(244,63,94,0.15)",  text: "Nina Brush liked your post",                                                 time: "Yesterday",      read: true  },
  { id: 10, icon: MessageCircle,  iconColor: "#60A5FA", iconBg: "rgba(96,165,250,0.15)", text: "Leo Studio replied to your comment", sub: "Yes! Let's set up a call this week.", time: "Yesterday", read: true  },
];

const TRENDING = [
  { name: "Sarah Chen",   role: "Digital Illustration", avatar: "https://i.pravatar.cc/80?img=5"  },
  { name: "Marcus Rivera",role: "3D Art",               avatar: "https://i.pravatar.cc/80?img=7"  },
  { name: "Luna Park",    role: "UI/UX Design",         avatar: "https://i.pravatar.cc/80?img=9"  },
];

const DEADLINES = [
  { title: "E-commerce Redesign", company: "TechCorp",   due: "Due in 2 days",  urgent: true  },
  { title: "Brand Identity",      company: "StartupXYZ", due: "Due in 5 days",  urgent: false },
];

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState({ today: TODAY, yesterday: YESTERDAY });

  const unread = notifs.today.filter(n => !n.read).length + notifs.yesterday.filter(n => !n.read).length;

  function markAllRead() {
    setNotifs({
      today:     notifs.today.map(n => ({ ...n, read: true })),
      yesterday: notifs.yesterday.map(n => ({ ...n, read: true })),
    });
  }

  function markRead(id: number) {
    setNotifs(prev => ({
      today:     prev.today.map(n => n.id === id ? { ...n, read: true } : n),
      yesterday: prev.yesterday.map(n => n.id === id ? { ...n, read: true } : n),
    }));
  }

  function NotifRow({ n }: { n: Notif }) {
    return (
      <div
        key={n.id}
        onClick={() => markRead(n.id)}
        className="flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors relative"
        style={{ borderBottom: "1px solid var(--border)" }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
      >
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: n.iconBg }}>
          <n.icon size={16} style={{ color: n.iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug mb-0.5" style={{ color: "var(--text-2)", fontWeight: n.read ? 400 : 600 }}>{n.text}</p>
          {n.sub && <p className="text-xs leading-relaxed mb-1" style={{ color: "var(--text-4)" }}>{n.sub}</p>}
          <p className="text-[11px]" style={{ color: "var(--text-5)" }}>{n.time}</p>
        </div>
        {!n.read && <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "#9B7CF5" }} />}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">

        <main className="flex-1 flex gap-0 pb-24 lg:pb-0">

          {/* ── Notifications list ── */}
          <div className="flex-1 min-w-0">

            {/* Header */}
            <div
              className="sticky top-0 z-20 flex items-center gap-3 px-5 py-4"
              style={{ background: "var(--bg-header)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2 flex-1">
                <h1 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>Notifications</h1>
                {unread > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#7C5BF5", color: "#fff" }}>{unread}</span>
                )}
              </div>
              <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70" style={{ color: "var(--text-4)" }}>
                <CheckCheck size={14} /> Mark All as Read
              </button>
              <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70" style={{ color: "var(--text-4)" }}>
                <Settings size={15} />
              </button>
              <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-opacity hover:opacity-70" style={{ background: "var(--bg-subtle)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
                <SlidersHorizontal size={13} /> Filter
              </button>
            </div>

            {/* Today */}
            <div className="px-5 py-3">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-5)" }}>Today</p>
            </div>
            {notifs.today.map(n => <NotifRow key={n.id} n={n} />)}

            {/* Yesterday */}
            <div className="px-5 py-3 mt-2">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-5)" }}>Yesterday</p>
            </div>
            {notifs.yesterday.map(n => <NotifRow key={n.id} n={n} />)}
          </div>

          {/* ── Right sidebar ── */}
          <div
            className="hidden xl:flex flex-col gap-4 w-72 shrink-0 px-4 py-6"
            style={{ borderLeft: "1px solid var(--border)" }}
          >
            {/* Trending Artists */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} style={{ color: "#9B7CF5" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Trending Artists</p>
              </div>
              <div className="flex flex-col gap-3">
                {TRENDING.map(({ name, role, avatar }) => (
                  <div key={name} className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text-1)" }}>{name}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-5)" }}>{role}</p>
                    </div>
                    <button
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 transition-opacity hover:opacity-80"
                      style={{ background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.3)" }}
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} style={{ color: "#9B7CF5" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Upcoming Deadlines</p>
              </div>
              <div className="flex flex-col gap-3">
                {DEADLINES.map(({ title, company, due, urgent }) => (
                  <div key={title} className="p-3 rounded-xl" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--text-1)" }}>{title}</p>
                    <p className="text-[10px] mb-1.5" style={{ color: "var(--text-5)" }}>{company}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold" style={{ color: urgent ? "#EF4444" : "#F59E0B" }}>{due}</span>
                      <button className="text-[10px] font-semibold" style={{ color: "#9B7CF5" }}>View</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={14} style={{ color: "#9B7CF5" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Recommended Actions</p>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { text: "Complete your profile to get featured" },
                  { text: "Respond to 3 pending messages" },
                ].map(({ text }) => (
                  <div key={text} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="shrink-0 mt-0.5" style={{ color: "var(--text-5)" }} />
                    <p className="text-xs" style={{ color: "var(--text-4)" }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Summary */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Bell size={14} style={{ color: "#9B7CF5" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Activity Summary</p>
              </div>
              {[
                { label: "Today",         value: "12 new",   color: "#9B7CF5" },
                { label: "This Week",     value: "47 total", color: "var(--text-2)" },
                { label: "Response Rate", value: "98%",      color: "#10B981" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center py-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--text-4)" }}>{label}</span>
                  <span className="text-xs font-semibold" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>

      <BottomNav />
    </div>
  );
}
