"use client";

import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";
import HireModal from "@/components/hiring/HireModal";
import type { Artist } from "@/lib/hiringData";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  ArrowRight, Briefcase, CheckCircle2, Clock,
  Search, SlidersHorizontal, Star, XCircle, Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

function estimatePrice(a: ArtistProfile): number {
  return Math.round((80 + a.rating * 60 + Math.min(a.followers_count, 5000) * 0.02) / 10) * 10;
}

function toArtist(a: ArtistProfile): Artist {
  return {
    id:        0,
    name:      a.display_name ?? a.username ?? "Unknown",
    avatar:    a.avatar_url ?? `https://i.pravatar.cc/80?u=${a.clerk_id}`,
    location:  a.location ?? "Remote",
    price:     estimatePrice(a),
    rating:    a.rating,
    available: a.available,
    medium:    a.tag ? a.tag.split(",").map(t => t.trim()) : [],
    followers: String(a.followers_count),
    cover:     "",
    bio:       a.bio ?? "",
  };
}

function mapStatus(s: string): ProjectStatus {
  if (s === "accepted")  return "active";
  if (s === "completed") return "completed";
  if (s === "declined")  return "cancelled";
  return "pending";
}

function mapRequest(r: HireRequest): Project {
  const ts   = r.updated_at ?? r.created_at;
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const ago  = days > 1 ? `${days} days ago` : days === 1 ? "Yesterday" : hrs > 0 ? `${hrs} hours ago` : "Just now";
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

const FILTER_OPTIONS = ["Available Now", "Rating 4.5+", "Rating 5.0", "Fast Delivery"];

// ── Featured card ──────────────────────────────────────────────

function FeaturedCard({ a, price, onHire }: { a: ArtistProfile; price: number; onHire: () => void }) {
  const banner = a.banner_url ?? `https://picsum.photos/seed/${a.clerk_id}featured/480/300`;
  const name   = a.display_name ?? a.username ?? "Artist";

  return (
    <div
      className="shrink-0 rounded-2xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer"
      style={{ width: 260, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
    >
      {/* Image with overlays */}
      <div className="relative" style={{ height: 160 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={banner} alt={name} className="w-full h-full object-cover" />

        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)" }} />

        {/* FEATURED badge */}
        <div
          className="absolute top-2.5 right-2.5 text-[9px] font-black tracking-widest px-2 py-1 rounded-full"
          style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", color: "#fff", boxShadow: "0 2px 8px rgba(124,91,245,0.5)" }}
        >
          ✦ FEATURED
        </div>

        {/* Artist name + specialty overlay */}
        <div className="absolute bottom-2.5 left-3 right-3">
          <p className="text-sm font-bold text-white leading-tight truncate">{name}</p>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.65)" }}>{a.tag}</p>
        </div>

        {/* Rating badge */}
        {a.rating > 0 && (
          <div
            className="absolute bottom-2.5 right-3 flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", color: "#FBBF24" }}
          >
            <Star size={9} fill="currentColor" /> {a.rating % 1 === 0 ? a.rating : a.rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-3 py-2.5 gap-2"
        style={{ background: "rgba(18,12,40,0.97)", borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div>
          <p className="text-[9px] font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>FROM</p>
          <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>${price}</p>
        </div>
        <button
          onClick={onHire}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", color: "#fff", boxShadow: "0 2px 10px rgba(124,91,245,0.4)" }}
        >
          Request Work <ArrowRight size={11} />
        </button>
      </div>
    </div>
  );
}

// ── Artist grid card ───────────────────────────────────────────

function ArtistCard({ a, price, onHire }: { a: ArtistProfile; price: number; onHire: () => void }) {
  const banner   = a.banner_url ?? `https://picsum.photos/seed/${a.clerk_id}/400/240`;
  const avatar   = a.avatar_url ?? `https://i.pravatar.cc/80?u=${a.clerk_id}`;
  const name     = a.display_name ?? a.username ?? "Artist";
  const tags     = a.tag ? a.tag.split(",").map(t => t.trim()).filter(Boolean).slice(0, 3) : [];

  const availColor = a.available ? "#10B981" : "#F59E0B";
  const availBg    = a.available ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)";
  const availLabel = a.available ? "Available" : "Busy";

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all hover:scale-[1.015]"
      style={{
        background: "rgba(22,14,50,0.97)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,91,245,0.35)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
    >
      {/* Banner */}
      <div className="relative" style={{ height: 180 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={banner} alt={name} className="w-full h-full object-cover" />

        {/* Gradient overlay (bottom) */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(14,8,36,0.9) 0%, transparent 55%)" }} />

        {/* Availability badge */}
        <div
          className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5"
          style={{ background: availBg, color: availColor, border: `1px solid ${availColor}40`, backdropFilter: "blur(6px)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: availColor }} />
          {availLabel}
        </div>

        {/* Skill tag chips — bottom of image */}
        {tags.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span
                key={tag}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Artist info */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover shrink-0"
            style={{ border: "2px solid rgba(124,91,245,0.4)" }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight truncate" style={{ color: "var(--text-1)" }}>{name}</p>
            <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
              {a.tag}{a.location ? ` · ${a.location}` : ""}
            </p>
          </div>
          {a.rating > 0 && (
            <div className="flex items-center gap-0.5 shrink-0 text-xs font-bold" style={{ color: "#FBBF24" }}>
              <Star size={12} fill="currentColor" />
              <span>{a.rating % 1 === 0 ? a.rating : a.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div>
          <p className="text-[9px] font-bold tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>STARTING FROM</p>
          <p className="text-base font-extrabold" style={{ color: "var(--text-1)" }}>${price}</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Link
            href={`/u/${a.username ?? a.clerk_id}`}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-center transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            View Profile
          </Link>
          <button
            onClick={onHire}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", color: "#fff", boxShadow: "0 2px 12px rgba(124,91,245,0.35)" }}
          >
            Request Work <ArrowRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────

function ArtistSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "rgba(22,14,50,0.97)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="h-44 w-full" style={{ background: "rgba(255,255,255,0.05)" }} />
      <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.07)" }} />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-3 w-24 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
            <div className="h-2.5 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
          </div>
        </div>
        <div className="h-3 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="h-9 w-full rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>
    </div>
  );
}

// ── Projects sub-components (unchanged) ───────────────────────

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

function DeleteConfirmModal({ onConfirm, onCancel, deleting }: { onConfirm: () => void; onCancel: () => void; deleting: boolean }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <div
        className="w-[320px] rounded-2xl p-6 flex flex-col items-center gap-4"
        style={{ background: "var(--bg-card)", border: "1px solid rgba(239,68,68,0.25)", boxShadow: "0 24px 64px rgba(0,0,0,0.45)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-base font-bold mb-1" style={{ color: "var(--text-1)" }}>Delete Project?</p>
          <p className="text-sm" style={{ color: "var(--text-5)" }}>This action cannot be undone. The request will be permanently removed.</p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background: "var(--bg-subtle)", color: "var(--text-2)", border: "1px solid var(--border)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-85 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #b91c1c, #EF4444)" }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ThreeDotsMenu({ onDelete }: { onDelete: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function handleConfirm() {
    setDeleting(true);
    try { await onDelete(); } finally { setDeleting(false); setConfirm(false); }
  }

  return (
    <>
      <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
        <button
          onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
          style={{ background: "var(--bg-subtle)", color: "var(--text-4)", border: "1px solid var(--border)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
        </button>
        {open && (
          <div
            className="absolute right-0 top-9 z-50 rounded-xl overflow-hidden py-1"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", minWidth: 130 }}
          >
            <button
              onClick={e => { e.stopPropagation(); setOpen(false); setConfirm(true); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-all hover:opacity-80"
              style={{ color: "#EF4444" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>
      {confirm && (
        <DeleteConfirmModal
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(false)}
          deleting={deleting}
        />
      )}
    </>
  );
}

function ProjectCard({ project, onClick, onDelete }: { project: Project; onClick: () => void; onDelete: () => void }) {
  const cfg = STATUS_CONFIG[project.status];
  const isDelivered = project.status === "completed";

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick()}
      className="w-full text-left p-4 rounded-2xl flex flex-col gap-3 transition-all hover:scale-[1.01] cursor-pointer"
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
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.badge, color: cfg.badgeText }}>
            {cfg.displayLabel}
          </span>
          <ThreeDotsMenu onDelete={async () => { onDelete(); }} />
        </div>
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
      </div>
      <div>
        <div className="flex justify-between text-[10px] mb-1.5" style={{ color: "var(--text-6)" }}>
          <span>PROGRESS</span><span>{project.progress}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${project.progress}%`, background: cfg.bar }} />
        </div>
      </div>
    </div>
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

// ── Incoming request card (artist side) ───────────────────────

interface IncomingRequest {
  id: string;
  client_id: string;
  client_name: string | null;
  client_avatar: string | null;
  project_title: string;
  project_description: string | null;
  budget: number | null;
  deadline: string | null;
  priority: string;
  status: string;
  created_at: string;
}

function IncomingCard({ req, onDecide, onDelete }: { req: IncomingRequest; onDecide: (id: string, status: "accepted" | "declined") => Promise<void>; onDelete: () => Promise<void> }) {
  const router = useRouter();
  const [deciding, setDeciding] = useState<"accepted" | "declined" | null>(null);

  async function decide(e: React.MouseEvent, status: "accepted" | "declined") {
    e.stopPropagation();
    setDeciding(status);
    try {
      await onDecide(req.id, status);
    } finally {
      setDeciding(null);
    }
  }

  const isPending = req.status === "pending";
  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    pending:  { bg: "rgba(245,158,11,0.15)",  color: "#FCD34D", label: "Pending"  },
    accepted: { bg: "rgba(16,185,129,0.15)",  color: "#34D399", label: "Accepted" },
    declined: { bg: "rgba(239,68,68,0.15)",   color: "#F87171", label: "Declined" },
  };
  const sc = statusColors[req.status] ?? statusColors.pending;

  return (
    <div
      onClick={() => router.push(`/hiring/projects/${req.id}`)}
      className="p-4 rounded-2xl flex flex-col gap-3 cursor-pointer transition-all hover:scale-[1.01]"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,91,245,0.35)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
    >
      {/* Client + status */}
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={req.client_avatar ?? `https://i.pravatar.cc/48?u=${req.client_id}`}
          alt={req.client_name ?? "Client"}
          className="w-9 h-9 rounded-full object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
            {req.project_title}
          </p>
          <p className="text-xs" style={{ color: "var(--text-5)" }}>
            from {req.client_name ?? "a client"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.color }}>
            {sc.label}
          </span>
          <ThreeDotsMenu onDelete={onDelete} />
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]" style={{ color: "var(--text-5)" }}>
        {req.budget && (
          <span>💰 ${Number(req.budget).toLocaleString()}</span>
        )}
        {req.deadline && (
          <span>📅 {req.deadline}</span>
        )}
        <span className="capitalize">⚡ {req.priority} priority</span>
      </div>

      {req.project_description && (
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-4)" }}>
          {req.project_description}
        </p>
      )}

      {/* Accept / Decline — only for pending */}
      {isPending && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={e => decide(e, "accepted")}
            disabled={!!deciding}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "rgba(16,185,129,0.15)", color: "#34D399", border: "1px solid rgba(16,185,129,0.35)" }}
          >
            {deciding === "accepted" ? "Accepting…" : "✓ Accept"}
          </button>
          <button
            onClick={e => decide(e, "declined")}
            disabled={!!deciding}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            {deciding === "declined" ? "Declining…" : "✕ Decline"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── My Projects view ───────────────────────────────────────────

function MyProjectsView({ userId, onSwitchToHire }: { userId: string; onSwitchToHire: () => void }) {
  const router = useRouter();
  const [projects, setProjects]           = useState<Project[]>([]);
  const [incoming, setIncoming]           = useState<IncomingRequest[]>([]);
  const [loading, setLoading]             = useState(true);
  const [loadingIncoming, setLoadingIncoming] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/hire-requests?clientId=${userId}`)
      .then(r => r.json())
      .then(({ requests }: { requests: HireRequest[] }) => { setProjects((requests ?? []).map(mapRequest)); setLoading(false); })
      .catch(() => setLoading(false));

    setLoadingIncoming(true);
    fetch(`/api/hire-requests?artistClerkId=${userId}`)
      .then(r => r.json())
      .then(({ requests }: { requests: IncomingRequest[] }) => { setIncoming(requests ?? []); setLoadingIncoming(false); })
      .catch(() => setLoadingIncoming(false));
  }, [userId]);

  async function handleDeleteProject(id: string) {
    await fetch(`/api/hire-requests/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: userId }),
    });
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  async function handleDeleteIncoming(id: string) {
    await fetch(`/api/hire-requests/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistClerkId: userId }),
    });
    setIncoming(prev => prev.filter(r => r.id !== id));
  }

  async function handleDecide(id: string, status: "accepted" | "declined") {
    const res = await fetch(`/api/hire-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistClerkId: userId, status }),
    });
    if (res.ok) {
      setIncoming(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    }
  }

  const counts = {
    pending:   projects.filter(p => p.status === "pending").length,
    active:    projects.filter(p => p.status === "active").length,
    completed: projects.filter(p => p.status === "completed").length,
    cancelled: projects.filter(p => p.status === "cancelled").length,
  };

  const pendingIncoming = incoming.filter(r => r.status === "pending").length;

  return (
    <div className="flex-1 px-4 md:px-8 py-6 pb-28 lg:pb-8 flex flex-col gap-8">

      {/* ── Incoming requests section (artist side) ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>Incoming Requests</h2>
          {pendingIncoming > 0 && (
            <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#7C5BF5", color: "#fff" }}>
              {pendingIncoming}
            </span>
          )}
        </div>

        {loadingIncoming ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }} />
            ))}
          </div>
        ) : incoming.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-10 rounded-2xl text-center"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <p className="text-2xl mb-2">📬</p>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-2)" }}>No requests yet</p>
            <p className="text-xs" style={{ color: "var(--text-5)" }}>Clients who request your work will appear here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {incoming.map(r => (
              <IncomingCard key={r.id} req={r} onDecide={handleDecide} onDelete={() => handleDeleteIncoming(r.id)} />
            ))}
          </div>
        )}
      </section>

      {/* ── My commissions section (client side) ── */}
      <section>
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-1)" }}>My Commissions</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-5)" }}>Projects you&apos;ve sent to artists</p>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }} />)}
          </div>
        ) : projects.length === 0 ? (
          <EmptyProjects onHire={onSwitchToHire} />
        ) : (
          <>
            <div className="flex gap-3 overflow-x-auto mb-6" style={{ scrollbarWidth: "none" }}>
              <StatCard icon={<Clock size={18} />}        count={counts.pending}   label="Pending Requests" color="#F59E0B" />
              <StatCard icon={<Briefcase size={18} />}    count={counts.active}    label="Active Projects"  color="#3B82F6" />
              <StatCard icon={<CheckCircle2 size={18} />} count={counts.completed} label="Completed"        color="#10B981" />
              <StatCard icon={<XCircle size={18} />}      count={counts.cancelled} label="Cancelled"        color="#EF4444" />
            </div>
            {STATUS_ORDER.map(status => {
              const group = projects.filter(p => p.status === status);
              if (!group.length) return null;
              const cfg = STATUS_CONFIG[status];
              return (
                <section key={status} className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.dot }} />
                    <span className="text-xs font-bold tracking-wider" style={{ color: "var(--text-5)" }}>{cfg.label}</span>
                    <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--bg-subtle)", color: "var(--text-4)" }}>
                      {group.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {group.map(p => <ProjectCard key={p.id} project={p} onClick={() => router.push(`/hiring/projects/${p.id}`)} onDelete={() => handleDeleteProject(p.id)} />)}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </section>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────

export default function HiringPage() {
  const { user } = useUser();

  const [tab, setTab]                       = useState<"hire" | "projects">("hire");

  const router = useRouter();

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("tab");
    if (p === "projects" || p === "hire") setTab(p);
  }, []);

  function switchTab(t: "hire" | "projects") {
    setTab(t);
    router.replace(`/hiring?tab=${t}`, { scroll: false });
  }
  const [search, setSearch]                 = useState("");
  const [showFilters, setShowFilters]       = useState(false);
  const [activeFilters, setActiveFilters]   = useState<Set<string>>(new Set());
  const [artists, setArtists]               = useState<ArtistProfile[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [hireTarget, setHireTarget]         = useState<ArtistProfile | null>(null);

  useEffect(() => {
    setLoadingArtists(true);
    fetch("/api/profiles")
      .then(r => r.json())
      .then(({ profiles }: { profiles: ArtistProfile[] }) => { setArtists(profiles ?? []); setLoadingArtists(false); })
      .catch(() => setLoadingArtists(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(artists.map(a => a.tag).filter(Boolean))).sort()];

  function toggleFilter(f: string) {
    setActiveFilters(prev => { const n = new Set(prev); n.has(f) ? n.delete(f) : n.add(f); return n; });
  }

  const filtered = artists.filter(a => {
    if (a.clerk_id === user?.id) return false;
    const name        = (a.display_name ?? a.username ?? "").toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || a.tag.toLowerCase().includes(search.toLowerCase()) || (a.location ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat    = activeCategory === "All" || a.tag.toLowerCase() === activeCategory.toLowerCase();
    const matchAvail  = !activeFilters.has("Available Now") || a.available;
    const matchR45    = !activeFilters.has("Rating 4.5+")   || a.rating >= 4.5;
    const matchR5     = !activeFilters.has("Rating 5.0")    || a.rating >= 5.0;
    const matchFast   = !activeFilters.has("Fast Delivery") || (a.response_time ?? "").toLowerCase().includes("hour");
    return matchSearch && matchCat && matchAvail && matchR45 && matchR5 && matchFast;
  });

  const featured = artists.filter(a => a.available && a.rating >= 4.5 && a.clerk_id !== user?.id).slice(0, 8);

  return (
    <div
      className="flex min-h-screen"
      style={{
        background: "radial-gradient(ellipse 70% 50% at 5% 40%, rgba(54,30,123,0.18) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 95% 15%, rgba(124,91,245,0.08) 0%, transparent 50%), var(--bg)",
      }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">
        {/* ── Custom hiring header ── */}
        <div
          className="sticky top-0 z-30"
          style={{
            background: "var(--bg-header)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Top row: Logo | Tabs | Actions */}
          <div className="flex items-center gap-3 px-4 md:px-8 py-3">

            {/* Tab toggle — centred */}
            <div className="flex-1 flex justify-center">
              <div
                className="flex p-1 rounded-full"
                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
              >
                {(["hire", "projects"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => switchTab(t)}
                    className="px-5 py-1.5 rounded-full text-sm font-semibold transition-all"
                    style={{
                      background: tab === t ? "linear-gradient(135deg,#361E7B,#7C5BF5)" : "transparent",
                      color: tab === t ? "#fff" : "var(--text-4)",
                      boxShadow: tab === t ? "0 2px 12px rgba(124,91,245,0.35)" : "none",
                    }}
                  >
                    {t === "hire" ? "Hire Artists" : "My Projects"}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Search + filters + categories — Hire tab only */}
          {tab === "hire" && (
            <div className="px-4 md:px-8 pb-4 flex flex-col gap-3">
              <div className="flex gap-2">
                <div
                  className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                  style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
                >
                  <Search size={15} style={{ color: "var(--text-5)", flexShrink: 0 }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search artists, styles, or categories..."
                    className="flex-1 bg-transparent text-sm outline-none min-w-0"
                    style={{ color: "var(--text-1)" }}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(v => !v)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all shrink-0"
                  style={{
                    background: showFilters ? "rgba(124,91,245,0.15)" : "var(--bg-subtle)",
                    border: showFilters ? "1px solid rgba(124,91,245,0.4)" : "1px solid var(--border)",
                    color: showFilters ? "#9B7CF5" : "var(--text-4)",
                  }}
                >
                  <SlidersHorizontal size={14} />
                  Filters
                  {activeFilters.size > 0 && (
                    <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: "#7C5BF5", color: "#fff" }}>
                      {activeFilters.size}
                    </span>
                  )}
                </button>
              </div>

              {/* Category pills */}
              <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {categories.map(cat => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                      style={{
                        background: isActive ? "linear-gradient(135deg,#361E7B,#7C5BF5)" : "var(--bg-card)",
                        color: isActive ? "#fff" : "var(--text-4)",
                        border: isActive ? "1px solid transparent" : "1px solid var(--border)",
                        boxShadow: isActive ? "0 0 12px rgba(124,91,245,0.35)" : "none",
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* My Projects tab */}
        {tab === "projects" && (
          <MyProjectsView userId={user?.id ?? ""} onSwitchToHire={() => switchTab("hire")} />
        )}

        {/* Hire Artists tab */}
        {tab === "hire" && (
          <main className="flex-1 pb-24 lg:pb-8">

            {/* Filter drawer */}
            {showFilters && (
              <div className="mx-4 md:mx-8 mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                {FILTER_OPTIONS.map(f => {
                  const on = activeFilters.has(f);
                  return (
                    <button
                      key={f}
                      onClick={() => toggleFilter(f)}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-left transition-all"
                      style={{ background: on ? "rgba(124,91,245,0.12)" : "var(--bg-subtle)", border: on ? "1px solid rgba(124,91,245,0.45)" : "1px solid var(--border)", color: on ? "#9B7CF5" : "var(--text-3)" }}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Featured section ───────────────────────── */}
            {activeCategory === "All" && !search && !loadingArtists && featured.length > 0 && (
              <section className="px-4 md:px-8 pt-6 pb-8">
                <h3 className="text-base font-bold mb-4" style={{ color: "var(--text-1)" }}>Featured</h3>
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                  {featured.map(a => (
                    <FeaturedCard
                      key={a.clerk_id}
                      a={a}
                      price={estimatePrice(a)}
                      onHire={() => setHireTarget(a)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── All Artists grid ───────────────────────── */}
            <section className="px-4 md:px-8 pb-8">
              <div className="flex items-baseline gap-2 mb-5">
                <h3 className="text-base font-bold" style={{ color: "var(--text-1)" }}>
                  {activeCategory === "All" ? "All Artists" : `${activeCategory} Artists`}
                </h3>
                {!loadingArtists && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(124,91,245,0.12)", color: "#9B7CF5" }}>
                    {filtered.length}
                  </span>
                )}
              </div>

              {loadingArtists ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <ArtistSkeleton key={i} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-3xl mb-3">🎨</p>
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-2)" }}>
                    No artists found{search ? ` for "${search}"` : ""}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-5)" }}>Try adjusting your filters or search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(a => (
                    <ArtistCard
                      key={a.clerk_id}
                      a={a}
                      price={estimatePrice(a)}
                      onHire={() => setHireTarget(a)}
                    />
                  ))}
                </div>
              )}
            </section>
          </main>
        )}
      </div>

      <BottomNav />

      {/* Hire modal */}
      {hireTarget && (
        <HireModal
          artist={toArtist(hireTarget)}
          artistClerkId={hireTarget.clerk_id}
          onClose={() => setHireTarget(null)}
        />
      )}
    </div>
  );
}
