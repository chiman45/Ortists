"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import { useUser } from "@clerk/nextjs";
import { Briefcase, CheckCircle2, Clock, MapPin, Search, SlidersHorizontal, Star, Users, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────

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

interface HireRequest {
  id: string;
  artist_name: string;
  artist_avatar: string | null;
  artist_id: number;
  project_title: string;
  budget: string | number | null;
  deadline: string | null;
  progress: number;
  status: string;
  created_at: string;
  updated_at: string | null;
}

interface ArtistProfile {
  clerk_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  location: string | null;
  tag: string;
  available: boolean;
  bio: string | null;
  followers_count: number;
  rating: number;
  response_time: string | null;
}

// ── Helpers ───────────────────────────────────────────────────

function fmtFollowers(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function mapStatus(s: string): ProjectStatus {
  if (s === "accepted") return "active";
  if (s === "completed") return "completed";
  if (s === "declined") return "cancelled";
  return "pending";
}

function mapRequest(r: HireRequest): Project {
  const ts = r.updated_at ?? r.created_at;
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const ago = days > 1 ? `${days} days ago` : days === 1 ? "Yesterday" : hrs > 0 ? `${hrs} hours ago` : "Just now";

  return {
    id:           r.id,
    title:        r.project_title,
    artist:       r.artist_name,
    avatar:       r.artist_avatar ?? `https://i.pravatar.cc/80?img=${r.artist_id}`,
    budget:       Number(r.budget ?? 0),
    deadline:     r.deadline ?? "TBD",
    lastActivity: ago,
    progress:     r.progress ?? 0,
    status:       mapStatus(r.status),
  };
}

// ── Config ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ProjectStatus, { label: string; dot: string; bar: string; badge: string; badgeText: string; displayLabel: string }> = {
  active:    { label: "ACTIVE PROJECTS",  dot: "#3B82F6", bar: "#3B82F6", badge: "rgba(59,130,246,0.15)",  badgeText: "#60A5FA", displayLabel: "Active"    },
  pending:   { label: "PENDING REQUESTS", dot: "#F59E0B", bar: "#6B7280", badge: "rgba(245,158,11,0.15)",  badgeText: "#FCD34D", displayLabel: "Pending"   },
  completed: { label: "COMPLETED",        dot: "#10B981", bar: "#10B981", badge: "rgba(16,185,129,0.15)",  badgeText: "#34D399", displayLabel: "Completed" },
  cancelled: { label: "CANCELLED",        dot: "#EF4444", bar: "#EF4444", badge: "rgba(239,68,68,0.15)",   badgeText: "#F87171", displayLabel: "Cancelled" },
};

const STATUS_ORDER: ProjectStatus[] = ["active", "pending", "completed", "cancelled"];

const FILTER_OPTIONS = [
  "Available Now", "Rating 4.5+", "Rating 5.0", "Fast Delivery",
];

// ── Sub-components ─────────────────────────────────────────────

function StatCard({ icon, count, label, color }: { icon: React.ReactNode; count: number; label: string; color: string }) {
  return (
    <div className="flex-1 flex flex-col gap-2 p-4 rounded-2xl min-w-27.5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}1a` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>{count}</p>
      <p className="text-xs leading-snug" style={{ color: "var(--text-5)" }}>{label}</p>
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const cfg = STATUS_CONFIG[project.status];
  const isDelivered = project.status === "completed";
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl flex flex-col gap-3 transition-all hover:scale-[1.01]"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,91,245,0.35)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
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
        <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.badge, color: cfg.badgeText }}>
          {cfg.displayLabel}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]" style={{ color: "var(--text-5)" }}>
        <span className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="16" rx="2"/><path d="M16 3v4M8 3v4M2 9h20"/></svg>
          ${project.budget.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {isDelivered ? "Delivered" : project.deadline}
        </span>
        <span className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {project.lastActivity}
        </span>
      </div>

      <div>
        <div className="flex justify-between text-[10px] mb-1.5" style={{ color: "var(--text-6)" }}>
          <span>PROGRESS</span><span>{project.progress}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${project.progress}%`, background: cfg.bar }} />
        </div>
      </div>
    </button>
  );
}

function EmptyProjects({ onHire }: { onHire: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(124,91,245,0.1)", border: "1px solid rgba(124,91,245,0.2)" }}>
        <Briefcase size={28} style={{ color: "#9B7CF5" }} />
      </div>
      <p className="text-base font-bold mb-1" style={{ color: "var(--text-1)" }}>No projects yet</p>
      <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--text-5)" }}>
        Hire an artist to start your first commission. Your projects will appear here.
      </p>
      <button
        onClick={onHire}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
        style={{ background: "#7C5BF5" }}
      >
        Browse Artists
      </button>
    </div>
  );
}

function MyProjectsView({ userId, onSwitchToHire }: { userId: string; onSwitchToHire: () => void }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/hire-requests?clientId=${userId}`)
      .then(r => r.json())
      .then(({ requests }: { requests: HireRequest[] }) => {
        setProjects((requests ?? []).map(mapRequest));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  const counts = {
    pending:   projects.filter(p => p.status === "pending").length,
    active:    projects.filter(p => p.status === "active").length,
    completed: projects.filter(p => p.status === "completed").length,
    cancelled: projects.filter(p => p.status === "cancelled").length,
  };

  return (
    <div className="flex-1 px-4 md:px-8 py-6 pb-28 lg:pb-8 flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-1)" }}>My Projects</h2>
        <p className="text-sm" style={{ color: "var(--text-5)" }}>Track commissions and collaborate with your artists</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyProjects onHire={onSwitchToHire} />
      ) : (
        <>
          <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <StatCard icon={<Clock size={18} />}        count={counts.pending}   label="Pending Requests"  color="#F59E0B" />
            <StatCard icon={<Briefcase size={18} />}    count={counts.active}    label="Active Projects"   color="#3B82F6" />
            <StatCard icon={<CheckCircle2 size={18} />} count={counts.completed} label="Completed"         color="#10B981" />
            <StatCard icon={<XCircle size={18} />}      count={counts.cancelled} label="Cancelled"         color="#EF4444" />
          </div>

          {STATUS_ORDER.map(status => {
            const group = projects.filter(p => p.status === status);
            if (!group.length) return null;
            const cfg = STATUS_CONFIG[status];
            return (
              <section key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.dot }} />
                  <span className="text-xs font-bold tracking-wider" style={{ color: "var(--text-5)" }}>{cfg.label}</span>
                  <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--bg-subtle)", color: "var(--text-4)" }}>
                    {group.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {group.map(p => (
                    <ProjectCard key={p.id} project={p} onClick={() => router.push(`/hiring/projects/${p.id}`)} />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}

// ── Skeleton card ──────────────────────────────────────────────

function ArtistSkeleton() {
  return (
    <div className="break-inside-avoid mb-4 rounded-2xl overflow-hidden animate-pulse"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="h-36 w-full" style={{ background: "var(--bg-subtle)" }} />
      <div className="pt-8 px-4 pb-4 flex flex-col gap-2">
        <div className="h-3.5 w-24 rounded-full" style={{ background: "var(--bg-subtle)" }} />
        <div className="h-3 w-16 rounded-full" style={{ background: "var(--bg-subtle)" }} />
        <div className="h-7 w-full rounded-xl mt-2" style={{ background: "var(--bg-subtle)" }} />
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────

export default function HiringPage() {
  const { user } = useUser();
  const [tab, setTab]                       = useState<"hire" | "projects">("hire");
  const [search, setSearch]                 = useState("");
  const [showFilters, setShowFilters]       = useState(false);
  const [activeFilters, setActiveFilters]   = useState<Set<string>>(new Set());
  const [artists, setArtists]               = useState<ArtistProfile[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  // Fetch real profiles from DB
  useEffect(() => {
    setLoadingArtists(true);
    fetch("/api/profiles")
      .then(r => r.json())
      .then(({ profiles }: { profiles: ArtistProfile[] }) => {
        setArtists(profiles ?? []);
        setLoadingArtists(false);
      })
      .catch(() => setLoadingArtists(false));
  }, []);

  // Build category list from unique tags in real profiles
  const categories = ["All", ...Array.from(new Set(artists.map(a => a.tag).filter(Boolean))).sort()];

  function toggleFilter(f: string) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  }

  const filtered = artists.filter(a => {
    const name = (a.display_name ?? a.username ?? "").toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase())
      || a.tag.toLowerCase().includes(search.toLowerCase())
      || (a.location ?? "").toLowerCase().includes(search.toLowerCase())
      || (a.bio ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat    = activeCategory === "All" || a.tag.toLowerCase() === activeCategory.toLowerCase();
    const matchAvail  = !activeFilters.has("Available Now") || a.available;
    const matchR45    = !activeFilters.has("Rating 4.5+") || a.rating >= 4.5;
    const matchR5     = !activeFilters.has("Rating 5.0")  || a.rating >= 5.0;
    const matchFast   = !activeFilters.has("Fast Delivery")|| (a.response_time ?? "").toLowerCase().includes("hour");
    return matchSearch && matchCat && matchAvail && matchR45 && matchR5 && matchFast;
  });

  const featured = artists.filter(a => a.available && a.rating >= 4.5).slice(0, 8);

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

          {/* Search + filter + category chips — only for Hire tab */}
          {tab === "hire" && (
            <div className="px-4 md:px-8 pb-3 flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                  <Search size={14} style={{ color: "var(--text-5)", flexShrink: 0 }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search artists, tags, locations…"
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
                  {activeFilters.size > 0 && (
                    <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                      style={{ background: "#7C5BF5", color: "#fff" }}>
                      {activeFilters.size}
                    </span>
                  )}
                </button>
              </div>

              {/* Category chips — built from real tags */}
              <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {categories.map(cat => {
                  const active = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className="shrink-0 px-3.5 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: active ? "linear-gradient(135deg,#361E7B,#7C5BF5)" : "var(--bg-card)",
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
            </div>
          )}
        </MainHeader>

        {/* My Projects tab */}
        {tab === "projects" && (
          <MyProjectsView userId={user?.id ?? ""} onSwitchToHire={() => setTab("hire")} />
        )}

        {/* Hire Artists tab */}
        {tab === "hire" && (
          <main className="flex-1 px-4 md:px-8 py-6 pb-24 lg:pb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-1)" }}>Hiring</h2>
              <p className="text-sm" style={{ color: "var(--text-5)" }}>Find and commission talented artists for your next project</p>
            </div>

            {/* Filter drawer */}
            {showFilters && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 p-4 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
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

            {/* Top Artists horizontal scroll — available, by followers */}
            {activeCategory === "All" && !search && !loadingArtists && featured.length > 0 && (
              <section className="mb-10">
                <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-1)" }}>Top Artists</h3>
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                  {featured.map(a => (
                    <Link
                      key={a.clerk_id}
                      href={`/u/${a.username ?? a.clerk_id}`}
                      className="shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:scale-[1.02]"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", minWidth: 136, textDecoration: "none" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,91,245,0.4)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.avatar_url ?? `https://i.pravatar.cc/80?u=${a.clerk_id}`}
                        alt={a.display_name ?? "Artist"}
                        className="w-12 h-12 rounded-full object-cover"
                        style={{ border: "2px solid rgba(124,91,245,0.4)" }}
                      />
                      <div className="text-center">
                        <p className="text-xs font-semibold truncate max-w-25" style={{ color: "var(--text-1)" }}>
                          {a.display_name ?? a.username}
                        </p>
                        <p className="text-[10px] mb-0.5" style={{ color: "var(--text-5)" }}>{a.tag}</p>
                        {a.rating > 0 && (
                          <p className="text-[10px] flex items-center justify-center gap-0.5" style={{ color: "#FBBF24" }}>
                            <Star size={9} fill="currentColor" /> {a.rating.toFixed(1)}
                          </p>
                        )}
                      </div>
                      <span
                        className="text-[11px] font-semibold px-3 py-1 rounded-full"
                        style={{ background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.3)" }}
                      >
                        View
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* All Artists grid */}
            <section>
              <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-1)" }}>
                {activeCategory === "All" ? "All Artists" : `${activeCategory} Artists`}
                {!loadingArtists && (
                  <span className="text-sm font-normal ml-2" style={{ color: "var(--text-5)" }}>({filtered.length})</span>
                )}
              </h3>

              {loadingArtists ? (
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <ArtistSkeleton key={i} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-3xl mb-3">🎨</p>
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-2)" }}>
                    No artists found{search ? ` for "${search}"` : ""}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-5)" }}>
                    Try adjusting your filters or search term
                  </p>
                </div>
              ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
                  {filtered.map(a => (
                    <div key={a.clerk_id} className="break-inside-avoid mb-4">
                      <div
                        className="rounded-2xl overflow-hidden transition-all hover:scale-[1.01]"
                        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 2px 16px rgba(0,0,0,0.15)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,91,245,0.4)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
                      >
                        {/* Cover / banner */}
                        <div className="relative" style={{ height: 140 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={a.banner_url ?? `https://picsum.photos/seed/${a.clerk_id}/400/200`}
                            alt=""
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
                          <div className="absolute -bottom-5 left-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={a.avatar_url ?? `https://i.pravatar.cc/80?u=${a.clerk_id}`}
                              alt={a.display_name ?? "Artist"}
                              className="w-10 h-10 rounded-full object-cover"
                              style={{ border: "2.5px solid var(--bg-card)" }}
                            />
                          </div>
                        </div>

                        <div className="pt-7 px-4 pb-4">
                          <div className="flex items-start justify-between mb-1">
                            <div className="min-w-0">
                              <p className="text-sm font-bold leading-none mb-0.5 truncate" style={{ color: "var(--text-1)" }}>
                                {a.display_name ?? a.username}
                              </p>
                              {a.location && (
                                <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-5)" }}>
                                  <MapPin size={10} /> {a.location}
                                </div>
                              )}
                            </div>
                            <span
                              className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2"
                              style={{ background: "rgba(124,91,245,0.12)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.2)" }}
                            >
                              {a.tag}
                            </span>
                          </div>

                          {a.bio && (
                            <p className="text-[11px] mt-2 leading-relaxed line-clamp-2" style={{ color: "var(--text-5)" }}>
                              {a.bio}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-2 mb-3 text-[11px]" style={{ color: "var(--text-5)" }}>
                            <span className="flex items-center gap-1">
                              <Users size={11} /> {fmtFollowers(a.followers_count)}
                            </span>
                            {a.rating > 0 && (
                              <span className="flex items-center gap-1">
                                <Star size={11} fill="currentColor" style={{ color: "#FBBF24" }} /> {a.rating.toFixed(1)}
                              </span>
                            )}
                            {a.response_time && (
                              <span className="truncate">⚡ {a.response_time}</span>
                            )}
                          </div>

                          <Link
                            href={`/u/${a.username ?? a.clerk_id}`}
                            className="w-full py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 text-center block"
                            style={{ background: "var(--bg-subtle)", color: "var(--text-2)", border: "1px solid var(--border)" }}
                          >
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
