"use client";

import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";
import HireModal from "@/components/hiring/HireModal";
import HireBrief, { parseBrief } from "@/components/hiring/HireBrief";
import type { Artist } from "@/lib/hiringData";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  ArrowRight, Briefcase, ChevronRight, Clock, Plus,
  Search, SlidersHorizontal, Star, X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { withPlatformFee } from "@/lib/pricing";
import { Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ── Types ─────────────────────────────────────────────────────

type ProjectStatus = "active" | "pending" | "completed" | "cancelled";

interface HireRequest {
  id: string;
  artist_name: string;
  artist_avatar: string | null;
  artist_id: number;
  project_title: string;
  project_description: string | null;
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

// Client-facing starting price: the artist's base price with the platform fee
// already included (see lib/pricing.ts) — never shown as a separate line.
function estimatePrice(a: ArtistProfile): number {
  const artistBase = Math.round((80 + a.rating * 60 + Math.min(a.followers_count, 5000) * 0.02) / 10) * 10;
  return withPlatformFee(artistBase);
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


const MAIN_CATEGORIES = [
  "Fine Arts", "Digital Arts", "Sculpture", "Tribal & Indigenous Arts",
  "Wood Arts", "Printmaking", "Resin Arts", "Print Art",
];


const CATEGORY_DESC: Record<string, string> = {
  "Fine Arts":                "Painting, drawing, illustration & traditional media",
  "Digital Arts":             "Concept art, matte painting & digital design",
  "Sculpture":                "3D, ceramics, metal & mixed media sculpture",
  "Tribal & Indigenous Arts": "Folk traditions, tribal patterns & indigenous craft",
  "Wood Arts":                "Carving, burning, marquetry & wood craft",
  "Printmaking":              "Screen printing, etching, linocut & relief",
  "Resin Arts":               "Epoxy pours, resin casting & geode art",
  "Print Art":                "Fine art prints, photography & archival editions",
};

const SUBCATEGORIES: Record<string, string[]> = {
  "Fine Arts": [
    "Painting", "Drawing", "Sketching", "Illustration", "Watercolor",
    "Oil Painting", "Acrylic Painting", "Gouache", "Ink Art", "Pastel Art",
    "Charcoal Art", "Portrait Art", "Landscape Art", "Abstract Art",
    "Contemporary Art", "Realism", "Hyperrealism", "Surrealism",
    "Expressionism", "Figurative Art", "Miniature Art", "Religious Art",
    "Conceptual Art", "Mixed Media Art", "Mural Art", "Fresco Art",
    "Encaustic", "Botanical Art", "Fashion Illustration",
  ],
  "Digital Arts": [
    "Digital Painting", "Digital Illustration", "Matte Painting",
    "AI Art", "NFT Art", "Pixel Art", "3D Art", "Motion Graphics",
    "UI / UX Design", "Game Art", "Concept Art", "Character Design",
    "Environment Design", "Creature Design", "Storyboard",
  ],
  "Sculpture": [
    "Clay Sculpture", "Bronze Casting", "Stone Carving",
    "Ceramic", "Glasswork", "Metal Art", "Mixed Media Sculpture",
    "Installation Art", "Paper Sculpture", "Wire Art",
  ],
  "Tribal & Indigenous Arts": [
    "Madhubani", "Pattachitra", "Gond Art", "Warli Art", "Tanjore Painting",
    "Folk Painting", "Tribal Textile", "Indigenous Weaving", "Kalamkari",
    "Phad Painting", "Dokra", "Cave Art Style",
  ],
  "Wood Arts": [
    "Wood Carving", "Wood Burning", "Marquetry", "Wood Sculpture",
    "Woodblock Print", "Intarsia", "Relief Carving", "Whittling",
  ],
  "Printmaking": [
    "Screen Printing", "Etching", "Lithography", "Linocut",
    "Woodblock", "Relief Printing", "Monoprint", "Risograph",
    "Drypoint", "Aquatint",
  ],
  "Resin Arts": [
    "Resin Pouring", "Epoxy Art", "Resin Jewelry", "3D Resin Casting",
    "Resin Geode", "Ocean Pour", "Resin Coasters", "UV Resin",
  ],
  "Print Art": [
    "Fine Art Print", "Photography Print", "Digital Print",
    "Archival Print", "Limited Edition Print", "Poster Art",
    "Giclée", "Cyanotype",
  ],
};

// Backward-compatible alias used in categoryGroups
const ORDERED_CATEGORIES = MAIN_CATEGORIES;


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
    cover:     a.banner_url ?? "",
    bio:       a.bio ?? "",
  };
}

function mapStatus(s: string): ProjectStatus {
  if (s === "accepted")  return "active";
  if (s === "completed") return "completed";
  if (s === "declined")  return "cancelled";
  return "pending";
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  return days > 1 ? `${days} days ago` : days === 1 ? "Yesterday" : hrs > 0 ? `${hrs} hours ago` : "Just now";
}

// ── Config ─────────────────────────────────────────────────────

// ── Featured card ──────────────────────────────────────────────

// ── Artist card — portrait-image style (matches design) ────────

function ArtistCard({ a, price, onHire }: { a: ArtistProfile; price: number; onHire: () => void }) {
  const img        = a.banner_url ?? `https://picsum.photos/seed/${a.clerk_id}art/400/560`;
  const name       = a.display_name ?? a.username ?? "Artist";
  const { city }   = parseLocation(a.location);
  const medium     = a.tag ? a.tag.split(",")[0].trim() : "";
  const delivery   = getDeliveryCategory(a) === "5-7" ? "5–7 days" : "7+ days";
  const subtitle   = [city, medium].filter(Boolean).join(" · ") || "Remote";
  const profileUrl = `/u/${(a.username || a.clerk_id).replace(/^@+/, "")}`;

  return (
    <Link
      href={profileUrl}
      className="shrink-0 rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.99] flex flex-col"
      style={{
        width: 172,
        background: "#0e0824",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
        textDecoration: "none",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,91,245,0.35)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
    >
      {/* Portfolio image */}
      <div className="relative" style={{ height: 185 }}>
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
            <span className="text-sm font-bold" style={{ color: "#9B7CF5" }}>₹{price}</span>
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
        width: 134,
        height: 252,
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
  const profileUrl = `/u/${(a.username || a.clerk_id).replace(/^@+/, "")}`;

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
          <span className="text-base font-bold" style={{ color: "var(--text-1)" }}>₹{price}</span>
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
  progress: number;
  phase: string | null;
  currency: string | null;
  revision_count: number;
  created_at: string;
  updated_at: string | null;
  accepted_at: string | null;
  completed_at: string | null;
}

// ── My Projects view ───────────────────────────────────────────
// Shows only what is really stored for each commission: who it is with, what
// was asked, the reference image the client attached, dates and status.

/** One commission, seen from the signed-in user's side. */
interface CommissionRow {
  id: string;
  role: "client" | "artist";   // client = I hired the artist; artist = I was hired
  other: string;               // the other person's name
  avatar: string | null;
  status: ProjectStatus;
  summary: string | null;      // first line of the brief
  thumb: string | null;        // first reference image, if the client attached one
  deadline: string | null;
  budget: number | null;       // the client's price: shown to the client only
  sentAt: string;
  updatedAt: string;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : Math.ceil((d.getTime() - Date.now()) / 86400000);
}

const shortDate = (ts: string) =>
  new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function deadlineText(deadline: string | null): { text: string; urgent: boolean } | null {
  if (!deadline) return null;
  const d = daysUntil(deadline);
  if (d === null) return { text: `Due ${deadline}`, urgent: false };
  if (d < 0)  return { text: `Was due ${shortDate(deadline)}`, urgent: true };
  if (d === 0) return { text: "Due today", urgent: true };
  return { text: `Due ${shortDate(deadline)} · ${d} day${d === 1 ? "" : "s"} left`, urgent: d <= 3 };
}

/** Profile picture, or the person's initial when they have none (never a stock face). */
function Face({ src, name, size = 40 }: { src: string | null; name: string; size?: number }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  }
  return (
    <span aria-hidden className="rounded-full shrink-0 flex items-center justify-center font-bold"
      style={{ width: size, height: size, fontSize: size * 0.4, background: "rgba(124,91,245,0.18)", color: "#9B7CF5" }}>
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

function CommissionRowItem({ row, onOpen, onDelete }: { row: CommissionRow; onOpen: () => void; onDelete?: () => Promise<void> }) {
  const due = row.status === "active" || row.status === "pending" ? deadlineText(row.deadline) : null;
  const meta = [
    row.status === "pending"   ? `Sent ${shortDate(row.sentAt)}` : null,
    row.status === "active"    ? `Last update ${timeAgo(row.updatedAt).toLowerCase()}` : null,
    row.status === "completed" ? `Completed ${shortDate(row.updatedAt)}` : null,
    row.status === "cancelled" ? `Declined ${shortDate(row.updatedAt)}` : null,
  ].filter(Boolean)[0];

  return (
    <li
      onClick={onOpen}
      onKeyDown={e => e.key === "Enter" && onOpen()}
      role="link"
      tabIndex={0}
      className="flex items-center gap-4 py-4 cursor-pointer transition-opacity hover:opacity-85"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      {row.thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.thumb} alt="" className="w-14 h-14 md:w-16 md:h-16 rounded-lg object-cover shrink-0" style={{ background: "var(--bg-subtle)" }} />
      ) : (
        <Face src={row.avatar} name={row.other} size={56} />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold truncate" style={{ color: "var(--text-1)" }}>
          {row.role === "client" ? `Commission with ${row.other}` : `Commission for ${row.other}`}
        </p>
        {row.summary && <p className="text-sm truncate mt-0.5" style={{ color: "var(--text-4)" }}>{row.summary}</p>}
        <p className="text-xs mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5" style={{ color: "var(--text-5)" }}>
          <span>{row.role === "client" ? "You hired" : "You were hired"}</span>
          {meta && <span>{meta}</span>}
          {due && <span style={{ color: due.urgent ? "#F87171" : "var(--text-5)", fontWeight: due.urgent ? 600 : 400 }}>{due.text}</span>}
        </p>
      </div>

      {row.budget ? (
        <p className="hidden sm:block text-sm font-semibold shrink-0" style={{ color: "var(--text-2)" }}>
          ₹{row.budget.toLocaleString("en-IN")}
        </p>
      ) : null}
      {onDelete && <span className="shrink-0"><ThreeDotsMenu onDelete={onDelete} /></span>}
      <ChevronRight size={16} className="shrink-0" style={{ color: "var(--text-6)" }} />
    </li>
  );
}

function SectionTitle({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <h2 className="flex items-baseline gap-2.5 text-lg md:text-xl font-bold pb-3" style={{ color: "var(--text-1)", borderBottom: "1px solid var(--border)" }}>
      {children}
      {count !== undefined && <span className="text-sm font-medium" style={{ color: "var(--text-5)" }}>{count}</span>}
    </h2>
  );
}

function MyProjectsView({ userId, onSwitchToHire }: { userId: string; onSwitchToHire: () => void }) {
  const router = useRouter();
  const [mine, setMine]         = useState<HireRequest[]>([]);      // requests I sent as a client
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);  // requests sent to me as an artist
  const [loading, setLoading]   = useState(true);
  const [pastOpen, setPastOpen] = useState(false);
  const [deciding, setDeciding] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    Promise.all([
      fetch(`/api/hire-requests?clientId=${userId}`).then(r => r.json()),
      fetch(`/api/hire-requests?artistClerkId=${userId}`).then(r => r.json()),
    ]).then(([clientData, artistData]) => {
      if (cancelled) return;
      setMine(clientData.requests ?? []);
      setIncoming(artistData.requests ?? []);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  async function handleDeleteMine(id: string) {
    await fetch(`/api/hire-requests/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: userId }) });
    setMine(prev => prev.filter(p => p.id !== id));
  }
  async function handleDecide(id: string, status: "accepted" | "declined") {
    if (deciding) return;
    setDeciding(id);
    try {
      const res = await fetch(`/api/hire-requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ artistClerkId: userId, status }) });
      if (res.ok) {
        setIncoming(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        window.dispatchEvent(new Event("ortists:hire-changed")); // update the badge
      }
    } finally {
      setDeciding(null);
    }
  }

  const rows: CommissionRow[] = [
    ...mine.map((r): CommissionRow => {
      const b = parseBrief(r.project_description);
      return {
        id: r.id, role: "client", other: r.artist_name, avatar: r.artist_avatar, status: mapStatus(r.status),
        summary: b.text[0] ?? null, thumb: b.images[0] ?? null, deadline: r.deadline,
        budget: Number(r.budget) > 0 ? Number(r.budget) : null,
        sentAt: r.created_at, updatedAt: r.updated_at ?? r.created_at,
      };
    }),
    ...incoming.map((r): CommissionRow => {
      const b = parseBrief(r.project_description);
      return {
        id: r.id, role: "artist", other: r.client_name ?? "a client", avatar: r.client_avatar, status: mapStatus(r.status),
        summary: b.text[0] ?? null, thumb: b.images[0] ?? null, deadline: r.deadline,
        budget: null, // the stored amount is the client's price, not the artist's
        sentAt: r.created_at, updatedAt: r.updated_at ?? r.accepted_at ?? r.created_at,
      };
    }),
  ];

  const byNewest = (a: CommissionRow, b: CommissionRow) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  const pendingIncoming = incoming.filter(r => r.status === "pending");
  const active   = rows.filter(r => r.status === "active").sort(byNewest);
  const waiting  = rows.filter(r => r.status === "pending" && r.role === "client").sort(byNewest);
  const past     = rows.filter(r => r.status === "completed" || r.status === "cancelled").sort(byNewest);

  const nextDue = active
    .map(r => ({ r, d: daysUntil(r.deadline) }))
    .filter((x): x is { r: CommissionRow; d: number } => x.d !== null && x.d >= 0)
    .sort((a, b) => a.d - b.d)[0] ?? null;

  if (loading) {
    return (
      <div className="flex-1 px-4 md:px-8 py-8 flex flex-col gap-4 max-w-5xl w-full mx-auto">
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl skeleton-shimmer" style={{ background: "var(--bg-card)" }} />)}
      </div>
    );
  }

  if (rows.length === 0) {
    return <div className="flex-1 px-4 md:px-8 py-6"><EmptyProjects onHire={onSwitchToHire} /></div>;
  }

  const facts = [
    { label: "Need your reply", value: String(pendingIncoming.length), note: pendingIncoming.length ? "Read the brief, then accept or decline" : "Nothing waiting" },
    { label: "In progress",     value: String(active.length),          note: waiting.length ? `${waiting.length} more waiting for an artist` : "Accepted and under way" },
    { label: "Next deadline",   value: nextDue ? (nextDue.d === 0 ? "Today" : `${nextDue.d} day${nextDue.d === 1 ? "" : "s"}`) : "None",
      note: nextDue ? `${shortDate(nextDue.r.deadline!)} · ${nextDue.r.other}` : "No dated work in progress" },
  ];

  return (
    <div className="flex-1 pb-28 lg:pb-14">
      <div className="max-w-5xl mx-auto px-4 md:px-8">

        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-7 md:pt-10 pb-6">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-1.5" style={{ color: "#9B7CF5" }}>Your work</p>
            <h1 className="text-3xl md:text-4xl font-bold" style={{ color: "var(--text-1)", letterSpacing: "-0.02em" }}>Commissions</h1>
          </div>
          <button onClick={onSwitchToHire}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}>
            <Plus size={15} /> New commission
          </button>
        </div>

        {/* Three real numbers */}
        <dl className="grid grid-cols-1 sm:grid-cols-3 rounded-2xl overflow-hidden mb-10"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
          {facts.map((f, i) => (
            <div key={f.label} className={`px-5 py-4 ${i ? "border-t sm:border-t-0 sm:border-l" : ""}`} style={{ borderColor: "var(--border)" }}>
              <dt className="text-xs font-medium" style={{ color: "var(--text-4)" }}>{f.label}</dt>
              <dd className="text-2xl font-bold mt-1" style={{ color: "var(--text-1)" }}>{f.value}</dd>
              <dd className="text-xs mt-0.5 truncate" style={{ color: "var(--text-5)" }}>{f.note}</dd>
            </div>
          ))}
        </dl>

        {/* Requests waiting for my answer (artist) */}
        {pendingIncoming.length > 0 && (
          <section className="mb-12" aria-labelledby="sec-reply">
            <SectionTitle count={pendingIncoming.length}><span id="sec-reply">Needs your reply</span></SectionTitle>
            <div className="flex flex-col gap-5 pt-5">
              {pendingIncoming.map(r => (
                <article key={r.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
                  <header className="flex items-center gap-3 p-4 md:p-5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <Face src={r.client_avatar} name={r.client_name ?? "Client"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold truncate" style={{ color: "var(--text-1)" }}>{r.client_name ?? "A client"}</p>
                      <p className="text-xs" style={{ color: "var(--text-5)" }}>Sent {shortDate(r.created_at)}</p>
                    </div>
                  </header>

                  {/* Everything the client sent: description, size, deadline and reference images */}
                  <div className="p-4 md:p-5">
                    <HireBrief description={r.project_description} deadline={r.deadline} />
                  </div>

                  <footer className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 md:p-5" style={{ borderTop: "1px solid var(--border)" }}>
                    <button onClick={() => router.push(`/hiring/projects/${r.id}`)}
                      className="text-sm font-semibold underline underline-offset-4 py-2 sm:mr-auto text-left transition-opacity hover:opacity-75" style={{ color: "var(--text-4)" }}>
                      Open full request
                    </button>
                    <div className="flex gap-2.5">
                      <button onClick={() => handleDecide(r.id, "declined")} disabled={!!deciding}
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-full text-sm font-bold transition-opacity hover:opacity-75 disabled:opacity-50"
                        style={{ color: "#F87171", border: "1px solid rgba(239,68,68,0.35)" }}>
                        Decline
                      </button>
                      <button onClick={() => handleDecide(r.id, "accepted")} disabled={!!deciding}
                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}>
                        {deciding === r.id ? "Saving…" : "Accept"}
                      </button>
                    </div>
                  </footer>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Accepted and under way: both the artists I hired and the clients who hired me */}
        {active.length > 0 && (
          <section className="mb-12" aria-labelledby="sec-active">
            <SectionTitle count={active.length}><span id="sec-active">In progress</span></SectionTitle>
            <ul>
              {active.map(row => (
                <CommissionRowItem key={row.id} row={row} onOpen={() => router.push(`/hiring/projects/${row.id}`)} />
              ))}
            </ul>
          </section>
        )}

        {/* Sent by me, not answered yet */}
        {waiting.length > 0 && (
          <section className="mb-12" aria-labelledby="sec-waiting">
            <SectionTitle count={waiting.length}><span id="sec-waiting">Waiting for the artist</span></SectionTitle>
            <ul>
              {waiting.map(row => (
                <CommissionRowItem key={row.id} row={row} onOpen={() => router.push(`/hiring/projects/${row.id}`)}
                  onDelete={() => handleDeleteMine(row.id)} />
              ))}
            </ul>
          </section>
        )}

        {pendingIncoming.length === 0 && active.length === 0 && waiting.length === 0 && (
          <p className="text-sm mb-12" style={{ color: "var(--text-4)" }}>Nothing is open right now. Your finished and declined commissions are below.</p>
        )}

        {/* Completed and declined */}
        {past.length > 0 && (
          <section className="mb-8">
            <button onClick={() => setPastOpen(v => !v)} aria-expanded={pastOpen}
              className="flex items-center gap-2 text-sm font-semibold py-2 transition-opacity hover:opacity-75" style={{ color: "var(--text-3)" }}>
              <ChevronRight size={15} style={{ transform: pastOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
              Completed and declined
              <span style={{ color: "var(--text-5)", fontWeight: 500 }}>{past.length}</span>
            </button>
            {pastOpen && (
              <ul style={{ borderTop: "1px solid var(--border)" }} className="mt-2">
                {past.map(row => (
                  <CommissionRowItem key={row.id} row={row} onOpen={() => router.push(`/hiring/projects/${row.id}`)}
                    onDelete={row.role === "client" ? () => handleDeleteMine(row.id) : undefined} />
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────

// useSearchParams() (used below to reflect the landing page's category/
// search/style selection) requires a Suspense boundary, or `next build`
// fails prerendering this page entirely.
export default function HiringPage() {
  return (
    <Suspense fallback={null}>
      <HiringPageInner />
    </Suspense>
  );
}

function HiringPageInner() {
  const { user, isLoaded } = useUser();

  const [tab, setTab]                       = useState<"hire" | "projects">("hire");
  // Commission requests waiting for this artist's answer (badge on "My Projects")
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = () => {
      if (document.visibilityState !== "visible") return;
      fetch(`/api/hire-requests?artistClerkId=${user.id}`)
        .then(r => (r.ok ? r.json() : null))
        .then(d => { if (d) setPendingRequests(((d.requests ?? []) as { status: string }[]).filter(r => r.status === "pending").length); })
        .catch(() => {});
    };
    const first = setTimeout(load, 0);
    const every = setInterval(load, 30_000);
    window.addEventListener("ortists:hire-changed", load);
    return () => { clearTimeout(first); clearInterval(every); window.removeEventListener("ortists:hire-changed", load); };
  }, [user]);

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
  const [artists, setArtists]               = useState<ArtistProfile[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);
  const [activeCategory, setActiveCategory]       = useState("All");
  const [activeSubcategory, setActiveSubcategory] = useState("");
  const [hireTarget, setHireTarget]               = useState<ArtistProfile | null>(null);
  const [browsePage, setBrowsePage]               = useState(0);

  function selectCategory(cat: string) {
    setActiveCategory(cat);
    setActiveSubcategory("");
    setBrowsePage(0);
  }

  // Reflects the category/search/style picked on the landing page's Hire
  // Artists nav (e.g. /hiring?category=Fine+Arts or ?search=Painting).
  // useSearchParams() is reactive, so this re-applies the filter any time
  // the query string changes — including a same-route navigation that
  // wouldn't remount the page (a plain mount-only effect would miss that).
  // Comparing against the last-applied query string during render (rather
  // than useEffect) keeps this a single, un-flickered render.
  const searchParams = useSearchParams();
  const hireQueryKey = searchParams.toString();
  const [appliedHireQueryKey, setAppliedHireQueryKey] = useState<string | null>(null);
  // Deep link from a feed post's Hire button: /hiring?hire=<artist clerk id>.
  // Resolved to an ArtistProfile once the artist list has loaded (below).
  const [pendingHireId, setPendingHireId] = useState<string | null>(null);
  if (hireQueryKey !== appliedHireQueryKey) {
    setAppliedHireQueryKey(hireQueryKey);
    const qCategory = searchParams.get("category");
    const qSearch   = searchParams.get("search");
    const qStyle    = searchParams.get("style");
    const qHire     = searchParams.get("hire");
    if (qHire) setPendingHireId(qHire);
    if (qCategory) {
      const match = MAIN_CATEGORIES.find(c => c.toLowerCase() === qCategory.toLowerCase());
      setActiveCategory(match ?? qCategory);
      setActiveSubcategory("");
      setBrowsePage(0);
    } else if (qSearch) {
      setSearch(qSearch);
    } else if (qStyle) {
      setSearch(qStyle);
    }
  }

  useEffect(() => {
    setLoadingArtists(true);
    fetch("/api/profiles")
      .then(r => r.json())
      .then(({ profiles }: { profiles: ArtistProfile[] }) => { setArtists(profiles ?? []); setLoadingArtists(false); })
      .catch(() => setLoadingArtists(false));
  }, []);

  // Open the commission form for a deep-linked artist as soon as profiles arrive
  // (render-time adjustment, same pattern as the query sync above).
  if (pendingHireId && !loadingArtists) {
    const linked = artists.find(a => a.clerk_id === pendingHireId);
    setPendingHireId(null);
    if (linked && linked.clerk_id !== user?.id) setHireTarget(linked);
  }

  const categories = ["All", ...Array.from(new Set(artists.map(a => a.tag).filter(Boolean))).sort()];

  const filtered = artists.filter(a => {
    const term        = search.toLowerCase();
    const displayName = (a.display_name ?? "").toLowerCase();
    const username    = (a.username ?? "").toLowerCase();
    const tags        = (a.tag ?? "").split(",").map(t => t.trim().toLowerCase());
    const tagFull     = tags.join(" ");
    const bio         = (a.bio ?? "").toLowerCase();

    if (search &&
      !displayName.includes(term) &&
      !username.includes(term) &&
      !tagFull.includes(term) &&
      !bio.includes(term) &&
      !(a.location ?? "").toLowerCase().includes(term)
    ) return false;

    if (activeCategory !== "All") {
      const catLower = activeCategory.toLowerCase();
      const subLowers = (SUBCATEGORIES[activeCategory] ?? []).map(s => s.toLowerCase());
      const matchesCat = tags.some(t =>
        t.includes(catLower) || catLower.includes(t) ||
        subLowers.some(s => t.includes(s) || s.includes(t))
      );
      if (!matchesCat) return false;
    }

    if (activeSubcategory) {
      const subLower = activeSubcategory.toLowerCase();
      if (!tags.some(t => t.includes(subLower) || subLower.includes(t)) && !bio.includes(subLower)) return false;
    }

    return true;
  });

  // Group artists by category for the browse view
  const categoryGroups: { category: string; description: string; artists: ArtistProfile[] }[] = [];
  const _usedIds = new Set<string>();
  for (const cat of ORDERED_CATEGORIES) {
    const catArtists = filtered.filter(a => {
      const tags = (a.tag ?? "").split(",").map(t => t.trim().toLowerCase());
      const catLower = cat.toLowerCase();
      const subLowers = (SUBCATEGORIES[cat] ?? []).map(s => s.toLowerCase());
      return tags.some(t =>
        t.includes(catLower) || catLower.includes(t) ||
        subLowers.some(s => t.includes(s) || s.includes(t))
      );
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
      className="flex min-h-screen overflow-x-hidden"
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
          {/* Top row: Tabs centered */}
          <div className="flex items-center justify-center px-4 md:px-8 py-3">
            {/* Tab pills */}
            <div
              className="flex p-1 rounded-full"
              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
            >
              {(["hire", "projects"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => t === "projects" ? requireAuth(() => switchTab(t)) : switchTab(t)}
                  aria-label={t === "projects" && pendingRequests > 0
                    ? `My Projects, ${pendingRequests} new request${pendingRequests === 1 ? "" : "s"}` : undefined}
                  className="relative px-5 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap"
                  style={{
                    background: tab === t ? "linear-gradient(135deg,#361E7B,#7C5BF5)" : "transparent",
                    color: tab === t ? "#fff" : "var(--text-4)",
                    boxShadow: tab === t ? "0 2px 12px rgba(124,91,245,0.35)" : "none",
                  }}
                >
                  {t === "hire" ? "Hire Artists" : "My Projects"}
                  {t === "projects" && pendingRequests > 0 && (
                    <span aria-hidden
                      className="absolute -top-1.5 -right-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ minWidth: 18, height: 18, padding: "0 5px", background: "#f43f5e", boxShadow: "0 0 0 2px var(--bg)" }}>
                      {pendingRequests > 9 ? "9+" : pendingRequests}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* My Projects tab — requires auth */}
        {tab === "projects" && user && (
          <MyProjectsView userId={user.id} onSwitchToHire={() => switchTab("hire")} />
        )}

        {/* Hire Artists tab — commission split view */}
        {tab === "hire" && hireTarget && (
          <div className="flex-1 flex" style={{ minHeight: 0, height: "calc(100vh - 57px)", overflow: "hidden" }}>
            <HireModal
              artist={toArtist(hireTarget)}
              artistClerkId={hireTarget.clerk_id}
              onClose={() => setHireTarget(null)}
            />
          </div>
        )}

        {/* Hire Artists tab — browse grid */}
        {tab === "hire" && !hireTarget && (
          <main className="flex-1 pb-24 lg:pb-8">

            {/* ── Hero section ── */}
            <div
              className="px-4 md:px-8 flex flex-col items-center text-center"
              style={{
                paddingTop: "48px",
                paddingBottom: "28px",
                background: "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(124,91,245,0.12) 0%, transparent 70%)",
              }}
            >
              {/* Headline */}
              <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
                <span style={{ color: "var(--text-1)" }}>Find your next </span>
                <span style={{ background: "linear-gradient(90deg,#9B7CF5,#7C5BF5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  creative collaborator
                </span>
              </h1>
              <p className="text-sm mb-6 max-w-md" style={{ color: "var(--text-5)" }}>
                Commission artists across every tradition, medium and discipline.
              </p>

              {/* Search bar with Filters button */}
              <div
                className="w-full max-w-2xl flex items-center gap-3 px-4 py-3 rounded-2xl mb-5"
                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}
              >
                <Search size={16} style={{ color: "var(--text-5)", flexShrink: 0 }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search artists, styles, traditions or locations..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--text-1)" }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="shrink-0 transition-opacity hover:opacity-70"
                    style={{ color: "var(--text-5)" }}
                  >
                    <X size={14} />
                  </button>
                )}
                <div style={{ width: 1, height: 18, background: "var(--border)", flexShrink: 0 }} />
                <button
                  className="flex items-center gap-1.5 text-xs font-semibold shrink-0 transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-4)" }}
                >
                  <SlidersHorizontal size={14} />
                  Filters
                </button>
              </div>

              {/* Category pill row — always visible */}
              <div className="w-full max-w-3xl flex gap-2 overflow-x-auto pb-1 mb-3" style={{ scrollbarWidth: "none" }}>
                {MAIN_CATEGORIES.map(cat => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => selectCategory(isActive ? "All" : cat)}
                      className="shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all hover:opacity-85"
                      style={{
                        background: isActive ? "linear-gradient(135deg,#361E7B,#7C5BF5)" : "var(--bg-subtle)",
                        border: `1px solid ${isActive ? "transparent" : "var(--border)"}`,
                        color: isActive ? "#fff" : "var(--text-3)",
                        boxShadow: isActive ? "0 2px 12px rgba(124,91,245,0.35)" : "none",
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Subcategory pill row — shown when category is active */}
              {activeCategory !== "All" && SUBCATEGORIES[activeCategory] && (
                <div className="w-full max-w-3xl flex gap-2 overflow-x-auto pb-1 mb-2" style={{ scrollbarWidth: "none" }}>
                  <button
                    onClick={() => selectCategory("All")}
                    className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-80"
                    style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-3)" }}
                  >
                    <X size={11} /> Clear
                  </button>
                  {SUBCATEGORIES[activeCategory].map(sub => {
                    const isActive = activeSubcategory === sub;
                    return (
                      <button
                        key={sub}
                        onClick={() => setActiveSubcategory(isActive ? "" : sub)}
                        className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-85"
                        style={{
                          background: isActive ? "rgba(124,91,245,0.18)" : "var(--bg-subtle)",
                          border: `1px solid ${isActive ? "rgba(124,91,245,0.5)" : "var(--border)"}`,
                          color: isActive ? "#9B7CF5" : "var(--text-4)",
                        }}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Breadcrumb */}
              {activeCategory !== "All" && (
                <p className="text-sm font-semibold mb-1" style={{ color: "#9B7CF5" }}>
                  {activeCategory}{activeSubcategory ? ` · ${activeSubcategory}` : ""}
                </p>
              )}

              {/* Trending */}
              {!search && activeCategory === "All" && (
                <p className="text-xs mt-1" style={{ color: "var(--text-5)" }}>
                  Trending:{" "}
                  {["Madhubani", "Linocut prints", "Kinetic sculpture", "Concept art"].map((t, i, arr) => (
                    <span key={t}>
                      <button
                        onClick={() => setSearch(t)}
                        className="transition-opacity hover:opacity-70"
                        style={{ color: "#9B7CF5" }}
                      >
                        {t}
                      </button>
                      {i < arr.length - 1 && <span style={{ color: "var(--text-6)" }}> · </span>}
                    </span>
                  ))}
                </p>
              )}
            </div>


            {/* ── Skeletons while loading ── */}
            {loadingArtists && (
              <div className="px-4 md:px-8 pt-6 flex gap-3 overflow-x-hidden">
                {Array.from({ length: 8 }).map((_, i) => <ArtistSkeleton key={i} />)}
              </div>
            )}

            {/* ── Category rows (browse all, no search/filter active) ── */}
            {!loadingArtists && activeCategory === "All" && !search && (
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
                        <ViewAllCard category={category} onViewAll={() => selectCategory(category)} />
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
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
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
            {!loadingArtists && (activeCategory !== "All" || search) && (
              <section className="px-4 md:px-8 pt-6 pb-10">
                <div className="flex items-baseline gap-2 mb-5">
                  <h3 className="text-base font-bold" style={{ color: "var(--text-1)" }}>
                    {search
                      ? "Search Results"
                      : activeSubcategory
                        ? `${activeSubcategory} Artists`
                        : `${activeCategory} Artists`}
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
    </div>
  );
}
