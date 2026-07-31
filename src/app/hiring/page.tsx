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

function parseLocation(loc: string | null): { city: string; country: string } {
  if (!loc) return { city: "", country: "" };
  const parts = loc.split(",").map(s => s.trim()).filter(Boolean);
  return parts.length >= 2
    ? { city: parts[0], country: parts[parts.length - 1] }
    : { city: parts[0], country: "" };
}

function getDeliveryCategory(a: ArtistProfile): "5-7" | "7+" {
  const rt = (a.response_time ?? "").toLowerCase();
  if (/\bhour|same.day|\b[1-4]\s*day/.test(rt)) return "5-7";
  return "7+";
}

const PRICE_RANGES: Record<string, [number, number]> = {
  any:      [0, Infinity],
  "u100":   [0, 99],
  "100-300":[100, 300],
  "300-500":[300, 500],
  "500+":   [500, Infinity],
};

const ORDERED_CATEGORIES = [
  "Illustration", "Photography", "Digital Art", "Painting",
  "Portrait", "Concept Art", "Sculpture",
];
const CATEGORY_DESC: Record<string, string> = {
  "Illustration":  "Characters, concepts & visual storytelling",
  "Photography":   "Editorial, portrait & fine art photography",
  "Digital Art":   "Concept art, matte painting & digital design",
  "Painting":      "Oil, watercolor & acrylic fine art",
  "Portrait":      "Portrait & figurative art commission",
  "Concept Art":   "Game, film & fantasy concept creation",
  "Sculpture":     "3D, ceramics & mixed media sculpture",
};

const TRENDING_SEARCHES = ["editorial portraits", "neon cityscapes", "minimal logos", "watercolor scenes"];

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

// kept for future use; individual filter state replaces this array

// ── Featured card ──────────────────────────────────────────────

// ── Artist card — portrait-image style (matches design) ────────

function ArtistCard({ a, price, onHire }: { a: ArtistProfile; price: number; onHire: () => void }) {
  const img        = a.banner_url ?? `https://picsum.photos/seed/${a.clerk_id}art/400/560`;
  const name       = a.display_name ?? a.username ?? "Artist";
  const { city }   = parseLocation(a.location);
  const medium     = a.tag ? a.tag.split(",")[0].trim() : "";
  const delivery   = getDeliveryCategory(a) === "5-7" ? "5–7 days" : "7+ days";
  const subtitle   = [city, medium].filter(Boolean).join(" · ") || "Remote";
  const profileUrl = `/u/${a.username ?? a.clerk_id}`;

  return (
    <Link
      href={profileUrl}
      className="shrink-0 rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.99] flex flex-col"
      style={{
        width: 205,
        background: "#0e0824",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
        textDecoration: "none",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,91,245,0.35)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
    >
      {/* Portfolio image */}
      <div className="relative" style={{ height: 220 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={name} className="w-full h-full object-cover" draggable={false} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 45%)" }} />
        {/* Available / Busy badge */}
        <div
          className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
          style={{
            background:     a.available ? "rgba(16,185,129,0.18)" : "rgba(245,158,11,0.18)",
            color:          a.available ? "#10B981"                : "#F59E0B",
            border:         `1px solid ${a.available ? "rgba(16,185,129,0.35)" : "rgba(245,158,11,0.35)"}`,
            backdropFilter: "blur(8px)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: a.available ? "#10B981" : "#F59E0B" }} />
          {a.available ? "Available" : "Busy"}
        </div>
      </div>

      {/* Card footer */}
      <div className="px-3 pt-2.5 pb-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold leading-tight truncate flex-1 mr-2" style={{ color: "var(--text-1)" }}>{name}</p>
          {a.rating > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] font-bold shrink-0" style={{ color: "#FBBF24" }}>
              <Star size={10} fill="currentColor" />
              {a.rating % 1 === 0 ? a.rating : a.rating.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.42)" }}>{subtitle}</p>
        <div className="flex items-center justify-between mb-1">
          <span>
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>from </span>
            <span className="text-sm font-bold" style={{ color: "#9B7CF5" }}>${price}</span>
          </span>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.32)" }}>{delivery}</span>
        </div>
        {/* Hire button — stops propagation so card link doesn't fire */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onHire(); }}
          className="w-full py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}
        >
          Hire
        </button>
      </div>
    </Link>
  );
}

// ── View-all card at end of category row ───────────────────────

function ViewAllCard({ category, onViewAll }: { category: string; onViewAll: () => void }) {
  return (
    <button
      onClick={onViewAll}
      className="shrink-0 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.99]"
      style={{
        width: 160,
        height: 295,
        background: "rgba(124,91,245,0.06)",
        border: "1px solid rgba(124,91,245,0.18)",
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: "rgba(124,91,245,0.15)", border: "1px solid rgba(124,91,245,0.3)" }}
      >
        <ArrowRight size={20} style={{ color: "#9B7CF5" }} />
      </div>
      <div className="text-center px-3">
        <p className="text-xs font-semibold leading-snug" style={{ color: "var(--text-3)" }}>View all {category}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-5)" }}>artists</p>
      </div>
    </button>
  );
}

// ── Browse-all grid card (larger, with avatar row + two buttons) ─

function BrowseArtistCard({ a, price, onHire }: { a: ArtistProfile; price: number; onHire: () => void }) {
  const img        = a.banner_url ?? `https://picsum.photos/seed/${a.clerk_id}art/600/400`;
  const name       = a.display_name ?? a.username ?? "Artist";
  const { city, country } = parseLocation(a.location);
  const locationStr = [city, country].filter(Boolean).join(", ");
  const medium     = a.tag ? a.tag.split(",")[0].trim() : "Artist";
  const delivery   = getDeliveryCategory(a) === "5-7" ? "5–7 days" : "7+ days";
  const profileUrl = `/u/${a.username ?? a.clerk_id}`;

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all hover:scale-[1.01]"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.28)",
      }}
    >
      {/* Image */}
      <div className="relative" style={{ height: 200 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={name} className="w-full h-full object-cover" draggable={false} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)" }} />
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
          style={{
            background:     a.available ? "rgba(16,185,129,0.18)" : "rgba(245,158,11,0.18)",
            color:          a.available ? "#10B981"                : "#F59E0B",
            border:         `1px solid ${a.available ? "rgba(16,185,129,0.35)" : "rgba(245,158,11,0.35)"}`,
            backdropFilter: "blur(8px)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: a.available ? "#10B981" : "#F59E0B" }} />
          {a.available ? "Available" : "Busy"}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-2.5">
        {/* Avatar + name + location + rating */}
        <div className="flex items-center gap-2.5">
          {a.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.avatar_url} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}>
              {name[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>{name}</p>
            {locationStr && <p className="text-[11px] truncate" style={{ color: "var(--text-5)" }}>{locationStr}</p>}
          </div>
          {a.rating > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] font-bold shrink-0" style={{ color: "#FBBF24" }}>
              <Star size={10} fill="currentColor" />
              {a.rating % 1 === 0 ? a.rating : a.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Tag / medium */}
        <p className="text-xs font-medium" style={{ color: "#9B7CF5" }}>{medium}</p>

        {/* Price + delivery */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]" style={{ color: "var(--text-5)" }}>from</span>
          <span className="text-base font-bold" style={{ color: "var(--text-1)" }}>${price}</span>
          <span className="ml-auto flex items-center gap-1 text-[11px]" style={{ color: "var(--text-5)" }}>
            <Clock size={11} />
            {delivery}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-0.5">
          <Link
            href={profileUrl}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-center transition-all hover:opacity-80"
            style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-3)" }}
          >
            View Profile
          </Link>
          <button
            onClick={onHire}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}
          >
            Hire
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
  const { user, isLoaded } = useUser();

  const [tab, setTab]                       = useState<"hire" | "projects">("hire");

  const router = useRouter();

  function requireAuth(then: () => void) {
    if (isLoaded && !user) {
      router.push("/login?redirect=/hiring");
      return;
    }
    then();
  }

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
  const [artists, setArtists]               = useState<ArtistProfile[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [hireTarget, setHireTarget]         = useState<ArtistProfile | null>(null);
  const [browsePage, setBrowsePage]         = useState(0);

  // Structured filter state
  const [filterMedium,    setFilterMedium]    = useState("");
  const [filterStyle,     setFilterStyle]     = useState("");
  const [filterPrice,     setFilterPrice]     = useState("any");
  const [filterDelivery,  setFilterDelivery]  = useState("any");
  const [filterAvailable, setFilterAvailable] = useState(false);

  useEffect(() => {
    setLoadingArtists(true);
    fetch("/api/profiles")
      .then(r => r.json())
      .then(({ profiles }: { profiles: ArtistProfile[] }) => { setArtists(profiles ?? []); setLoadingArtists(false); })
      .catch(() => setLoadingArtists(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(artists.map(a => a.tag).filter(Boolean))).sort()];

  const allMediums = Array.from(new Set(
    artists.flatMap(a => a.tag ? a.tag.split(",").map(t => t.trim()).filter(Boolean) : [])
  )).sort();

  function clearFilters() {
    setFilterMedium(""); setFilterStyle(""); setFilterPrice("any");
    setFilterDelivery("any"); setFilterAvailable(false);
  }

  const activeFilterCount = [
    filterMedium ? 1 : 0,
    filterStyle  ? 1 : 0,
    filterPrice !== "any"    ? 1 : 0,
    filterDelivery !== "any" ? 1 : 0,
    filterAvailable ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const filtered = artists.filter(a => {
    if (a.clerk_id === user?.id) return false;
    const name = (a.display_name ?? a.username ?? "").toLowerCase();
    const tag  = (a.tag ?? "").toLowerCase();
    if (search && !name.includes(search.toLowerCase()) && !tag.includes(search.toLowerCase()) && !(a.location ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    if (activeCategory !== "All" && !tag.includes(activeCategory.toLowerCase())) return false;
    if (filterMedium  && !tag.includes(filterMedium.toLowerCase()))  return false;
    if (filterStyle   && !tag.includes(filterStyle.toLowerCase()))   return false;
    if (filterAvailable && !a.available) return false;
    const p = estimatePrice(a);
    const ranges: Record<string, [number, number]> = { any: [0, Infinity], u100: [0, 99], "100-300": [100, 300], "300-500": [300, 500], "500+": [500, Infinity] };
    const [min, max] = ranges[filterPrice] ?? [0, Infinity];
    if (p < min || p > max) return false;
    if (filterDelivery !== "any" && getDeliveryCategory(a) !== filterDelivery) return false;
    return true;
  });

  // Group artists by category for the browse view
  const categoryGroups: { category: string; description: string; artists: ArtistProfile[] }[] = [];
  const _usedIds = new Set<string>();
  for (const cat of ORDERED_CATEGORIES) {
    const catArtists = filtered.filter(a => {
      const tags = (a.tag ?? "").split(",").map(t => t.trim().toLowerCase());
      return tags.some(t => t.includes(cat.toLowerCase()) || cat.toLowerCase().includes(t));
    });
    if (catArtists.length > 0) {
      catArtists.forEach(a => _usedIds.add(a.clerk_id));
      categoryGroups.push({ category: cat, description: CATEGORY_DESC[cat] ?? "", artists: catArtists });
    }
  }
  const _otherArtists = filtered.filter(a => !_usedIds.has(a.clerk_id));
  if (_otherArtists.length > 0) {
    categoryGroups.push({ category: "Other", description: "More styles & specialties", artists: _otherArtists });
  }

  return (
    <div
      className="flex min-h-screen"
      style={{
        background: "radial-gradient(ellipse 70% 50% at 5% 40%, rgba(54,30,123,0.18) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 95% 15%, rgba(124,91,245,0.08) 0%, transparent 50%), var(--bg)",
      }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen min-w-0">
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
          {/* Top row: Logo left | Tabs centered */}
          <div className="relative flex items-center px-4 md:px-8 py-3">
            {/* Ortist logo — left anchor */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/login-image/ortists logo1.png"
              alt="Ortist"
              style={{ height: 30, objectFit: "contain", flexShrink: 0 }}
            />

            {/* Tab pills — absolutely centered */}
            <div
              className="absolute left-1/2 -translate-x-1/2 flex p-1 rounded-full"
              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
            >
              {(["hire", "projects"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => t === "projects" ? requireAuth(() => switchTab(t)) : switchTab(t)}
                  className="px-5 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap"
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

          {/* Search + filters + categories + trending — Hire tab only */}
          {tab === "hire" && (
            <div className="pb-3 flex flex-col gap-2.5">
              {/* Search + Filters */}
              <div className="px-4 md:px-8 flex gap-2">
                <div
                  className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                  style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
                >
                  <Search size={15} style={{ color: "var(--text-5)", flexShrink: 0 }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search artists, styles, mediums or locations..."
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
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: "#7C5BF5", color: "#fff" }}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Category pills */}
              <div className="px-4 md:px-8 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
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

              {/* Trending searches */}
              {!search && activeCategory === "All" && (
                <div className="px-4 md:px-8 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px]" style={{ color: "var(--text-6)" }}>Trending</span>
                  {TRENDING_SEARCHES.map((t, i) => (
                    <button
                      key={t}
                      onClick={() => setSearch(t)}
                      className="text-[11px] hover:opacity-70 transition-opacity"
                      style={{ color: "var(--text-4)" }}
                    >
                      {t}{i < TRENDING_SEARCHES.length - 1 ? " ·" : ""}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* My Projects tab — requires auth */}
        {tab === "projects" && user && (
          <MyProjectsView userId={user.id} onSwitchToHire={() => switchTab("hire")} />
        )}

        {/* Hire Artists tab */}
        {tab === "hire" && (
          <main className="flex-1 pb-24 lg:pb-8">

            {/* ── Hero section — shown when browsing (no active search/filter) ── */}
            {!search && activeFilterCount === 0 && activeCategory === "All" && (
              <div
                className="px-4 md:px-8 pt-12 pb-8 flex flex-col items-center text-center"
                style={{
                  background: "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(124,91,245,0.12) 0%, transparent 70%)",
                }}
              >
                {/* Headline */}
                <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
                  <span style={{ color: "var(--text-1)" }}>Find your next </span>
                  <span style={{ background: "linear-gradient(90deg,#9B7CF5,#7C5BF5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    creative collaborator
                  </span>
                </h1>
                <p className="text-sm mb-7 max-w-md" style={{ color: "#9B7CF5" }}>
                  Discover artists across every medium and commission work that moves people.
                </p>

                {/* Search bar */}
                <div
                  className="w-full max-w-2xl flex items-center gap-3 px-4 py-3 rounded-2xl mb-4"
                  style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}
                >
                  <Search size={16} style={{ color: "var(--text-5)", flexShrink: 0 }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search artists, styles, mediums or locations..."
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: "var(--text-1)" }}
                  />
                  <div style={{ width: 1, height: 18, background: "var(--border)" }} />
                  <button
                    onClick={() => setShowFilters(v => !v)}
                    className="flex items-center gap-1.5 text-xs font-semibold shrink-0 transition-opacity hover:opacity-70"
                    style={{ color: "var(--text-4)" }}
                  >
                    <SlidersHorizontal size={13} />
                    Filters
                  </button>
                </div>

                {/* Category chips */}
                <div className="flex flex-wrap justify-center gap-2 mb-3">
                  {["Portrait", "Illustration", "Painting", "Photography", "Digital Art", "Sculpture", "Concept Art"].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className="px-4 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
                      style={{
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border)",
                        color: "var(--text-3)",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Trending */}
                <div className="flex flex-wrap justify-center items-center gap-1.5 text-xs" style={{ color: "var(--text-5)" }}>
                  <span className="font-semibold" style={{ color: "var(--text-5)" }}>Trending</span>
                  {TRENDING_SEARCHES.map((t, i) => (
                    <span key={t} className="flex items-center gap-1.5">
                      {i > 0 && <span>·</span>}
                      <button
                        onClick={() => setSearch(t)}
                        className="font-medium hover:underline transition-all"
                        style={{ color: "var(--text-3)" }}
                      >
                        {t}
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Filter drawer */}
            {showFilters && (
              <div className="mx-4 md:mx-8 mt-4 p-5 rounded-2xl flex flex-col gap-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

                {/* Row 1: Medium + Style */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold tracking-wider mb-2 block" style={{ color: "var(--text-5)" }}>MEDIUM</label>
                    <select
                      value={filterMedium}
                      onChange={e => setFilterMedium(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                    >
                      <option value="">Any Medium</option>
                      {allMediums.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold tracking-wider mb-2 block" style={{ color: "var(--text-5)" }}>STYLE</label>
                    <input
                      value={filterStyle}
                      onChange={e => setFilterStyle(e.target.value)}
                      placeholder="e.g. Realism"
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                    />
                  </div>
                </div>

                {/* Row 2: Price Range */}
                <div>
                  <label className="text-[10px] font-bold tracking-wider mb-2 block" style={{ color: "var(--text-5)" }}>PRICE RANGE</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "any",     label: "Any"        },
                      { id: "u100",    label: "Under $100" },
                      { id: "100-300", label: "$100–$300"  },
                      { id: "300-500", label: "$300–$500"  },
                      { id: "500+",    label: "$500+"      },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => setFilterPrice(id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: filterPrice === id ? "rgba(124,91,245,0.15)" : "var(--bg-subtle)",
                          border:     filterPrice === id ? "1px solid rgba(124,91,245,0.45)" : "1px solid var(--border)",
                          color:      filterPrice === id ? "#9B7CF5" : "var(--text-4)",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 3: Delivery Time */}
                <div>
                  <label className="text-[10px] font-bold tracking-wider mb-2 block" style={{ color: "var(--text-5)" }}>DELIVERY TIME</label>
                  <div className="flex gap-2">
                    {[
                      { id: "any", label: "Any"      },
                      { id: "5-7", label: "5–7 Days" },
                      { id: "7+",  label: "7+ Days"  },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => setFilterDelivery(id)}
                        className="px-4 py-1.5 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: filterDelivery === id ? "rgba(124,91,245,0.15)" : "var(--bg-subtle)",
                          border:     filterDelivery === id ? "1px solid rgba(124,91,245,0.45)" : "1px solid var(--border)",
                          color:      filterDelivery === id ? "#9B7CF5" : "var(--text-4)",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 4: Available Now toggle + Clear */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer" onClick={() => setFilterAvailable(v => !v)}>
                    <div
                      className="w-10 h-5 rounded-full relative transition-all shrink-0"
                      style={{ background: filterAvailable ? "#7C5BF5" : "var(--bg-subtle)", border: "1px solid var(--border)" }}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                        style={{ background: "#fff", left: filterAvailable ? "calc(100% - 18px)" : 2 }}
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: "var(--text-3)" }}>Available Now Only</span>
                  </label>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs font-medium transition-opacity hover:opacity-70"
                      style={{ color: "#9B7CF5" }}
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Skeletons while loading ── */}
            {loadingArtists && (
              <div className="px-4 md:px-8 pt-6 flex gap-3 overflow-x-hidden">
                {Array.from({ length: 8 }).map((_, i) => <ArtistSkeleton key={i} />)}
              </div>
            )}

            {/* ── Category rows (browse all, no search/filter active) ── */}
            {!loadingArtists && activeCategory === "All" && !search && activeFilterCount === 0 && (
              <div className="pt-6 pb-10 flex flex-col gap-10">

                {/* Artists to Watch — top rated available artists */}
                {(() => {
                  const toWatch = artists
                    .filter(a => a.available && a.rating >= 4.0 && a.clerk_id !== user?.id)
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 10);
                  if (toWatch.length === 0) return null;
                  return (
                    <section>
                      <div className="px-4 md:px-8 mb-4 flex items-end justify-between">
                        <div>
                          <h2 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>Artists to Watch</h2>
                          <p className="text-sm mt-0.5" style={{ color: "var(--text-5)" }}>Top-rated & available right now</p>
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.12)", color: "#10B981" }}>
                          {toWatch.length} available
                        </span>
                      </div>
                      <div className="px-4 md:px-8 flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                        {toWatch.map(a => (
                          <ArtistCard key={a.clerk_id} a={a} price={estimatePrice(a)} onHire={() => requireAuth(() => setHireTarget(a))} />
                        ))}
                      </div>
                    </section>
                  );
                })()}

                {categoryGroups.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-3xl mb-3">🎨</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>No artists yet</p>
                  </div>
                ) : categoryGroups.map(({ category, description, artists: catArtists }) => (
                  <section key={category}>
                    <div className="px-4 md:px-8 mb-4">
                      <h2 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>{category}</h2>
                      {description && <p className="text-sm mt-0.5" style={{ color: "var(--text-5)" }}>{description}</p>}
                    </div>
                    <div className="px-4 md:px-8 flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                      {catArtists.slice(0, 8).map(a => (
                        <ArtistCard key={a.clerk_id} a={a} price={estimatePrice(a)} onHire={() => requireAuth(() => setHireTarget(a))} />
                      ))}
                      {catArtists.length >= 5 && (
                        <ViewAllCard category={category} onViewAll={() => setActiveCategory(category)} />
                      )}
                    </div>
                  </section>
                ))}

                {/* ── Browse All Artists — paginated grid ── */}
                {(() => {
                  const PAGE_SIZE = 9;
                  const browseAll = filtered.slice().sort((a, b) => b.rating - a.rating);
                  const totalPages = Math.ceil(browseAll.length / PAGE_SIZE);
                  const pageArtists = browseAll.slice(browsePage * PAGE_SIZE, (browsePage + 1) * PAGE_SIZE);
                  if (browseAll.length === 0) return null;
                  return (
                    <section className="px-4 md:px-8">
                      {/* Section header */}
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h2 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>Browse All Artists</h2>
                          <p className="text-sm mt-0.5" style={{ color: "var(--text-5)" }}>
                            {browseAll.length} artist{browseAll.length !== 1 ? "s" : ""} across all categories
                          </p>
                        </div>
                        {/* Pagination buttons */}
                        {totalPages > 1 && (
                          <div className="flex items-center gap-1.5">
                            {Array.from({ length: Math.min(totalPages, 6) }).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setBrowsePage(i)}
                                className="w-8 h-8 rounded-full text-xs font-bold transition-all"
                                style={{
                                  background: browsePage === i ? "linear-gradient(135deg,#361E7B,#7C5BF5)" : "var(--bg-subtle)",
                                  color:      browsePage === i ? "#fff" : "var(--text-4)",
                                  border:     browsePage === i ? "none" : "1px solid var(--border)",
                                  boxShadow:  browsePage === i ? "0 2px 10px rgba(124,91,245,0.4)" : "none",
                                }}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 3-column grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                        {pageArtists.map(a => (
                          <BrowseArtistCard key={a.clerk_id} a={a} price={estimatePrice(a)} onHire={() => requireAuth(() => setHireTarget(a))} />
                        ))}
                      </div>

                      {/* Bottom pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pb-4">
                          <button
                            onClick={() => setBrowsePage(p => Math.max(0, p - 1))}
                            disabled={browsePage === 0}
                            className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
                            style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-3)" }}
                          >
                            ← Prev
                          </button>
                          <span className="text-xs" style={{ color: "var(--text-5)" }}>
                            Page {browsePage + 1} of {totalPages}
                          </span>
                          <button
                            onClick={() => setBrowsePage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={browsePage === totalPages - 1}
                            className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
                            style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-3)" }}
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </section>
                  );
                })()}
              </div>
            )}

            {/* ── Flat grid for search / category filter ── */}
            {!loadingArtists && (activeCategory !== "All" || search || activeFilterCount > 0) && (
              <section className="px-4 md:px-8 pt-6 pb-10">
                <div className="flex items-baseline gap-2 mb-5">
                  <h3 className="text-base font-bold" style={{ color: "var(--text-1)" }}>
                    {activeCategory === "All" ? "Search Results" : `${activeCategory} Artists`}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(124,91,245,0.12)", color: "#9B7CF5" }}>
                    {filtered.length}
                  </span>
                </div>
                {filtered.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-3xl mb-3">🎨</p>
                    <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-2)" }}>
                      No artists found{search ? ` for "${search}"` : ""}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-5)" }}>Try adjusting your filters or search term</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    {filtered.map(a => (
                      <ArtistCard key={a.clerk_id} a={a} price={estimatePrice(a)} onHire={() => requireAuth(() => setHireTarget(a))} />
                    ))}
                  </div>
                )}
              </section>
            )}
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
