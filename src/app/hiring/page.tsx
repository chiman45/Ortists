"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import { ARTISTS } from "@/lib/hiringData";
import { Briefcase, CheckCircle2, ChevronRight, Clock, MapPin, Plus, Search, SlidersHorizontal, Star, Users, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type ProjectStatus = "active" | "pending" | "completed" | "cancelled";

interface Project {
  id: string;
  title: string;
  artist: string;
  avatar: string;
  budget: number;
  deadline: string;
  lastActivity: string;
  progress: number;
  status: ProjectStatus;
}

const MOCK_PROJECTS: Project[] = [
  { id: "1", title: "Ortist Brand Refresh",      artist: "Kai Nakamura",  avatar: "https://i.pravatar.cc/80?img=11", budget: 1200, deadline: "Aug 15, 2026", lastActivity: "2 hours ago",  progress: 65, status: "active"    },
  { id: "2", title: "Summer Campaign Visuals",   artist: "Mara Solis",    avatar: "https://i.pravatar.cc/80?img=23", budget: 840,  deadline: "Jul 28, 2026", lastActivity: "Yesterday",    progress: 40, status: "active"    },
  { id: "3", title: "Product Launch Motion",     artist: "Zoë Abramov",   avatar: "https://i.pravatar.cc/80?img=47", budget: 2400, deadline: "Sep 3, 2026",  lastActivity: "3 days ago",   progress: 0,  status: "pending"   },
  { id: "4", title: "Annual Report Layout",      artist: "Lena Fourie",   avatar: "https://i.pravatar.cc/80?img=32", budget: 560,  deadline: "Jun 12, 2026", lastActivity: "Jun 12, 2026", progress: 100, status: "completed" },
  { id: "5", title: "App Icon Set",              artist: "Priya Mehta",   avatar: "https://i.pravatar.cc/80?img=5",  budget: 320,  deadline: "May 30, 2026", lastActivity: "May 30, 2026", progress: 100, status: "completed" },
  { id: "6", title: "Podcast Cover Art",         artist: "Darius Osei",   avatar: "https://i.pravatar.cc/80?img=68", budget: 180,  deadline: "N/A",          lastActivity: "Jun 5, 2026",  progress: 20, status: "cancelled" },
];

const STATUS_CONFIG: Record<ProjectStatus, { label: string; dot: string; bar: string; badge: string; badgeText: string }> = {
  active:    { label: "ACTIVE PROJECTS",   dot: "#3B82F6", bar: "#3B82F6", badge: "rgba(59,130,246,0.15)",  badgeText: "#60A5FA" },
  pending:   { label: "PENDING REQUESTS",  dot: "#F59E0B", bar: "#6B7280", badge: "rgba(245,158,11,0.15)",  badgeText: "#FCD34D" },
  completed: { label: "COMPLETED",         dot: "#10B981", bar: "#10B981", badge: "rgba(16,185,129,0.15)",  badgeText: "#34D399" },
  cancelled: { label: "CANCELLED",         dot: "#EF4444", bar: "#EF4444", badge: "rgba(239,68,68,0.15)",   badgeText: "#F87171" },
};

const STATUS_ORDER: ProjectStatus[] = ["active", "pending", "completed", "cancelled"];

function StatCard({ icon, count, label, color }: { icon: React.ReactNode; count: number; label: string; color: string }) {
  return (
    <div
      className="flex-1 flex flex-col gap-2 p-4 rounded-2xl min-w-0"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}1a` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>{count}</p>
      <p className="text-xs leading-snug" style={{ color: "var(--text-5)" }}>{label}</p>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const cfg = STATUS_CONFIG[project.status];
  const isDelivered = project.status === "completed";
  return (
    <div
      className="p-4 rounded-2xl flex flex-col gap-3"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.avatar} alt={project.artist} className="w-9 h-9 rounded-full object-cover shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{project.title}</p>
            <p className="text-xs" style={{ color: "var(--text-5)" }}>with {project.artist}</p>
          </div>
        </div>
        <span
          className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: cfg.badge, color: cfg.badgeText }}
        >
          {cfg.label.split(" ")[0] === "ACTIVE" ? "Active"
            : cfg.label.split(" ")[0] === "PENDING" ? "Pending"
            : cfg.label.split(" ")[0] === "COMPLETED" ? "Completed"
            : "Cancelled"}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]" style={{ color: "var(--text-5)" }}>
        <span className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="16" rx="2"/><path d="M16 3v4M8 3v4M2 9h20"/></svg>
          ${project.budget.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {isDelivered ? `Delivered ${project.lastActivity}` : project.deadline}
        </span>
        <span className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {project.lastActivity}
        </span>
      </div>

      <div>
        <div className="flex justify-between text-[10px] mb-1.5" style={{ color: "var(--text-6)" }}>
          <span>PROGRESS</span>
          <span>{project.progress}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${project.progress}%`, background: cfg.bar }}
          />
        </div>
      </div>
    </div>
  );
}

function MyProjectsView() {
  const counts = {
    pending:   MOCK_PROJECTS.filter(p => p.status === "pending").length,
    active:    MOCK_PROJECTS.filter(p => p.status === "active").length,
    completed: MOCK_PROJECTS.filter(p => p.status === "completed").length,
    cancelled: MOCK_PROJECTS.filter(p => p.status === "cancelled").length,
  };

  return (
    <div className="flex-1 px-4 md:px-8 py-6 pb-28 lg:pb-8 flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-1)" }}>My Projects</h2>
        <p className="text-sm" style={{ color: "var(--text-5)" }}>Track commissions and collaborate with your artists</p>
      </div>

      {/* Stat cards */}
      <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <StatCard icon={<Clock size={18} />}        count={counts.pending}   label="Pending Requests"  color="#F59E0B" />
        <StatCard icon={<Briefcase size={18} />}    count={counts.active}    label="Active Projects"   color="#3B82F6" />
        <StatCard icon={<CheckCircle2 size={18} />} count={counts.completed} label="Completed"         color="#10B981" />
        <StatCard icon={<XCircle size={18} />}      count={counts.cancelled} label="Cancelled"         color="#EF4444" />
      </div>

      {/* Grouped sections */}
      {STATUS_ORDER.map(status => {
        const group = MOCK_PROJECTS.filter(p => p.status === status);
        if (!group.length) return null;
        const cfg = STATUS_CONFIG[status];
        return (
          <section key={status}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.dot }} />
              <span className="text-xs font-bold tracking-wider" style={{ color: "var(--text-5)" }}>{cfg.label}</span>
              <span
                className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: "var(--bg-subtle)", color: "var(--text-4)" }}
              >
                {group.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {group.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          </section>
        );
      })}

      {/* Floating new project button */}
      <button
        className="fixed bottom-24 lg:bottom-8 right-6 flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm text-white shadow-xl transition-all hover:opacity-90 active:scale-95"
        style={{ background: "#7C5BF5", boxShadow: "0 8px 24px rgba(124,91,245,0.4)" }}
      >
        <Plus size={18} />
        New Project
      </button>
    </div>
  );
}

const HIRING_CATEGORIES = [
  "All", "Portraits", "Watercolours", "Acrylic Paint", "Charcoal Sketch",
  "Oil Pastels", "Pencil Colours", "Ceramics", "Graffiti", "Origami", "Metal Work",
];

const FILTER_OPTIONS = [
  "Available Now", "Under $2,000", "$2,000–$3,500", "Over $3,500",
  "Rating 4.5+", "Rating 5.0", "Fast Delivery", "Remote Friendly",
];

export default function HiringPage() {
  const [tab, setTab] = useState<"hire" | "projects">("hire");
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  function toggleFilter(f: string) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  }

  const filtered = ARTISTS.filter(a => {
    const matchCat =
      activeCategory === "All" ||
      a.medium.some(m => m.toLowerCase() === activeCategory.toLowerCase());
    const matchSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.medium.some(m => m.toLowerCase().includes(search.toLowerCase())) ||
      a.location.toLowerCase().includes(search.toLowerCase());
    const matchAvail = !activeFilters.has("Available Now") || a.available;
    const matchRating45 = !activeFilters.has("Rating 4.5+") || a.rating >= 4.5;
    const matchRating5  = !activeFilters.has("Rating 5.0")  || a.rating === 5.0;
    const matchUnder    = !activeFilters.has("Under $2,000")     || a.price < 2000;
    const matchMid      = !activeFilters.has("$2,000–$3,500")    || (a.price >= 2000 && a.price <= 3500);
    const matchOver     = !activeFilters.has("Over $3,500")      || a.price > 3500;
    return matchCat && matchSearch && matchAvail && matchRating45 && matchRating5 && matchUnder && matchMid && matchOver;
  });

  const featured = ARTISTS.filter(a => a.available && a.rating >= 4.7).slice(0, 8);

  return (
    <div
      className="flex min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 8% 50%, rgba(54,30,123,0.16) 0%, transparent 55%)," +
          "radial-gradient(ellipse 50% 40% at 92% 20%, rgba(124,91,245,0.08) 0%, transparent 50%)," +
          "var(--bg)",
      }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">

        {/* Sticky header */}
        <MainHeader>
          {/* Tab switcher */}
          <div className="px-4 md:px-8 pb-3 flex items-center gap-2">
            {(["hire", "projects"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: tab === t ? "#7C5BF5" : "transparent",
                  color: tab === t ? "#fff" : "var(--text-4)",
                }}
              >
                {t === "hire" ? "Hire Artists" : "My Projects"}
              </button>
            ))}
          </div>

          {/* Search + filter — only for Hire Artists tab */}
          {tab === "hire" && <div className="px-4 md:px-8 pb-3 flex flex-col gap-2">
            {/* Search + filter row */}
            <div className="flex gap-2">
              <div
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
              >
                <Search size={14} style={{ color: "var(--text-5)", flexShrink: 0 }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search artists, mediums, locations…"
                  className="flex-1 bg-transparent text-sm outline-none min-w-0"
                  style={{ color: "var(--text-1)" }}
                />
              </div>
              <button
                onClick={() => setShowFilters(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all shrink-0"
                style={{
                  background: showFilters ? "rgba(124,91,245,0.15)" : "var(--bg-subtle)",
                  border: showFilters ? "1px solid rgba(124,91,245,0.4)" : "1px solid var(--border)",
                  color: showFilters ? "#9B7CF5" : "var(--text-4)",
                }}
              >
                <SlidersHorizontal size={13} />
                <span className="hidden sm:inline">Filter</span>
              </button>
            </div>

            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {HIRING_CATEGORIES.map(cat => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="shrink-0 px-3.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: active ? "linear-gradient(135deg, #361E7B, #7C5BF5)" : "var(--bg-card)",
                      color: active ? "#fff" : "var(--text-4)",
                      border: active ? "1px solid transparent" : "1px solid var(--border)",
                      boxShadow: active ? "0 0 10px rgba(124,91,245,0.3)" : "none",
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>}
        </MainHeader>

        {tab === "projects" && <MyProjectsView />}

        {tab === "hire" && <main className="flex-1 px-4 md:px-8 py-6 pb-24 lg:pb-8">

          {/* Page title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-1)" }}>Hiring</h2>
            <p className="text-sm" style={{ color: "var(--text-5)" }}>
              Find and commission talented artists for your next project
            </p>
          </div>

          {/* Filter drawer */}
          {showFilters && (
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 p-4 rounded-2xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              {FILTER_OPTIONS.map(f => {
                const on = activeFilters.has(f);
                return (
                  <button
                    key={f}
                    onClick={() => toggleFilter(f)}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-left transition-all"
                    style={{
                      background: on ? "rgba(124,91,245,0.12)" : "var(--bg-subtle)",
                      border: on ? "1px solid rgba(124,91,245,0.45)" : "1px solid var(--border)",
                      color: on ? "#9B7CF5" : "var(--text-3)",
                    }}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          )}

          {/* Featured Artists — only on All with no active search */}
          {activeCategory === "All" && !search && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>Top Artists</h3>
                <button className="flex items-center gap-1 text-xs font-medium" style={{ color: "#9B7CF5" }}>
                  See all <ChevronRight size={13} />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                {featured.map(a => (
                  <div
                    key={a.id}
                    className="shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", minWidth: 136 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,91,245,0.4)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.avatar}
                      alt={a.name}
                      className="w-12 h-12 rounded-full object-cover"
                      style={{ border: "2px solid rgba(124,91,245,0.4)" }}
                    />
                    <div className="text-center">
                      <p className="text-xs font-semibold truncate max-w-25" style={{ color: "var(--text-1)" }}>{a.name}</p>
                      <p className="text-[10px] mb-0.5 capitalize" style={{ color: "var(--text-5)" }}>{a.medium[0]}</p>
                      <p className="text-[10px] flex items-center justify-center gap-0.5" style={{ color: "#FBBF24" }}>
                        <Star size={9} fill="currentColor" /> {a.rating}
                      </p>
                    </div>
                    <Link
                      href={`/artists/${a.id}`}
                      className="text-[11px] font-semibold px-3 py-1 rounded-full transition-opacity hover:opacity-80"
                      style={{ background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.3)" }}
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Main grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>
                {activeCategory === "All" ? "All Artists" : activeCategory + " Artists"}
                <span className="text-sm font-normal ml-2" style={{ color: "var(--text-5)" }}>
                  ({filtered.length})
                </span>
              </h3>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20" style={{ color: "var(--text-5)" }}>
                No artists found{search ? ` for "${search}"` : ""}
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
                {filtered.map(a => (
                  <div key={a.id} className="break-inside-avoid mb-4">
                    <div
                      className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.01]"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 2px 16px rgba(0,0,0,0.15)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,91,245,0.4)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
                    >
                      {/* Cover image */}
                      <div className="relative" style={{ height: 160 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://picsum.photos/seed/${a.cover}/400/300`}
                          alt={a.name}
                          className="w-full h-full object-cover"
                        />
                        {a.available && (
                          <span
                            className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
                            style={{ background: "rgba(124,91,245,0.85)", backdropFilter: "blur(8px)" }}
                          >
                            Open for Commission
                          </span>
                        )}
                        {/* Avatar overlap */}
                        <div className="absolute -bottom-5 left-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={a.avatar}
                            alt={a.name}
                            className="w-10 h-10 rounded-full object-cover"
                            style={{ border: "2.5px solid var(--bg-card)" }}
                          />
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="pt-7 px-4 pb-4">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <p className="text-sm font-bold leading-none mb-0.5" style={{ color: "var(--text-1)" }}>{a.name}</p>
                            <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-5)" }}>
                              <MapPin size={10} /> {a.location}
                            </div>
                          </div>
                          <span className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                            ${a.price.toLocaleString()}
                          </span>
                        </div>

                        {/* Medium tags */}
                        <div className="flex flex-wrap gap-1 mt-2 mb-3">
                          {a.medium.map(m => (
                            <span
                              key={m}
                              className="text-[10px] capitalize px-2 py-0.5 rounded-full"
                              style={{ background: "var(--bg-subtle)", color: "var(--text-4)", border: "1px solid var(--border)" }}
                            >
                              {m}
                            </span>
                          ))}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 mb-3 text-[11px]" style={{ color: "var(--text-5)" }}>
                          <span className="flex items-center gap-1"><Users size={11} /> {a.followers}</span>
                          <span className="flex items-center gap-1">
                            <Star size={11} fill="currentColor" style={{ color: "#FBBF24" }} /> {a.rating}
                          </span>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                          <Link
                            href={`/artists/${a.id}`}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 text-center block"
                            style={{ background: "var(--bg-subtle)", color: "var(--text-2)", border: "1px solid var(--border)" }}
                          >
                            View
                          </Link>
                          <button
                            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-85"
                            style={{ background: "#7C5BF5" }}
                          >
                            Hire
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </main>}
      </div>

      <BottomNav />
    </div>
  );
}
