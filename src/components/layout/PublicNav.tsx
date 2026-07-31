"use client";

import Link from "next/link";
import { ArrowRight, Award, Box, Briefcase, Camera, ChevronDown, Layers, Paintbrush, Palette, Sparkles, Star, TrendingUp, Users, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const ACCENT = "#7B4DFF";
const GOLD   = "#FFB800";
const MUTED  = "#8B8B95";

const NAV_SIMPLE = [
  { label: "Home",        href: "/" },
  { label: "Feed",        href: "/feed" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "About",       href: "/about" },
];

const HIRE_CATEGORIES = [
  {
    label: "Illustration & Drawing", Icon: Paintbrush, color: "#9B7CF5",
    desc: "Hand-crafted & digital illustrations",
    items: [
      { label: "Character Design",    href: "/hiring?category=character-design",  desc: "Original characters & sheets" },
      { label: "Book Illustration",   href: "/hiring?category=book-illustration", desc: "Children's & editorial art" },
      { label: "Concept Art",         href: "/hiring?category=concept",           desc: "Game & film concepts" },
      { label: "Storyboarding",       href: "/hiring?category=storyboard",        desc: "Visual narratives" },
    ],
  },
  {
    label: "Painting & Fine Art", Icon: Palette, color: "#F59E0B",
    desc: "Traditional & mixed-media painting",
    items: [
      { label: "Oil Painting",        href: "/hiring?category=oil",       desc: "Classic oil technique" },
      { label: "Watercolor",          href: "/hiring?category=watercolor", desc: "Fluid & expressive work" },
      { label: "Acrylic Painting",    href: "/hiring?category=acrylic",   desc: "Bold & versatile" },
      { label: "Portrait Commission", href: "/hiring?category=portrait",  desc: "Realistic portraits" },
    ],
  },
  {
    label: "Digital Art & Design", Icon: Layers, color: "#06B6D4",
    desc: "Logos, UI, branding & digital work",
    items: [
      { label: "Digital Illustration", href: "/hiring?category=digital",  desc: "Vector & raster art" },
      { label: "Logo & Brand Design",  href: "/hiring?category=branding", desc: "Full visual identity" },
      { label: "UI/UX Design",         href: "/hiring?category=ui-ux",    desc: "App & web interfaces" },
      { label: "Social Media Art",     href: "/hiring?category=social",   desc: "Reels, posts & banners" },
    ],
  },
  {
    label: "Photography", Icon: Camera, color: "#10B981",
    desc: "Portrait, editorial & product",
    items: [
      { label: "Portrait Photography", href: "/hiring?category=portrait-photo", desc: "Professional portraits" },
      { label: "Photo Editing",        href: "/hiring?category=photo-edit",     desc: "Retouching & colour grading" },
      { label: "Product Photography",  href: "/hiring?category=product-photo",  desc: "E-commerce ready shots" },
      { label: "Event Photography",    href: "/hiring?category=events",         desc: "Moments captured" },
    ],
  },
  {
    label: "Sculpture & 3D", Icon: Box, color: "#F43F5E",
    desc: "Physical & digital 3D art",
    items: [
      { label: "3D Modeling",        href: "/hiring?category=3d-model",  desc: "Characters & objects" },
      { label: "Physical Sculpture", href: "/hiring?category=sculpture", desc: "Clay & mixed media" },
      { label: "3D Printing Design", href: "/hiring?category=3d-print",  desc: "Print-ready files" },
      { label: "NFT Art",            href: "/hiring?category=nft",       desc: "Digital collectibles" },
    ],
  },
  {
    label: "Animation & Motion", Icon: Zap, color: "#8B5CF6",
    desc: "2D, motion graphics & GIFs",
    items: [
      { label: "2D Animation",    href: "/hiring?category=2d-animation", desc: "Frame-by-frame art" },
      { label: "Motion Graphics", href: "/hiring?category=motion",       desc: "After Effects & more" },
      { label: "GIF & Sticker Art", href: "/hiring?category=gif",        desc: "Animated assets" },
      { label: "Mixed Media",     href: "/hiring?category=mixed-media",  desc: "Blend of techniques" },
    ],
  },
] as const;

const ARTIST_BROWSE = [
  { label: "All Artists",      href: "/hiring",                    Icon: Users,      color: "#9B7CF5", desc: "Browse the full directory" },
  { label: "Trending Now",     href: "/hiring?filter=trending",    Icon: TrendingUp, color: "#F59E0B", desc: "Most popular this week" },
  { label: "New Talent",       href: "/hiring?filter=new",         Icon: Sparkles,   color: "#06B6D4", desc: "Newly joined artists" },
  { label: "Top Rated",        href: "/hiring?filter=top",         Icon: Star,       color: "#10B981", desc: "Highest community ratings" },
  { label: "Commissions Open", href: "/hiring?filter=commissions", Icon: Briefcase,  color: "#F43F5E", desc: "Ready to take your project" },
  { label: "Featured Artists", href: "/hiring?filter=featured",    Icon: Award,      color: "#8B5CF6", desc: "Curated by Ortist team" },
] as const;

const ARTIST_STYLES = [
  { label: "Traditional",  href: "/hiring?style=traditional" },
  { label: "Digital Art",  href: "/hiring?style=digital" },
  { label: "Mixed Media",  href: "/hiring?style=mixed" },
  { label: "Photography",  href: "/hiring?style=photography" },
  { label: "Sculpture",    href: "/hiring?style=sculpture" },
  { label: "Animation",    href: "/hiring?style=animation" },
] as const;

function HireMenu({ onEnter, onLeave }: { onEnter: () => void; onLeave: () => void }) {
  const [activeCat, setActiveCat] = useState(0);
  const cat = HIRE_CATEGORIES[activeCat];

  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 pt-2"
      style={{ minWidth: 680, zIndex: 200 }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div
        className="rounded-2xl overflow-hidden flex"
        style={{
          background: "rgba(9,9,14,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(32px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        {/* Left: categories */}
        <div className="flex flex-col py-3 shrink-0" style={{ width: 230, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[9px] font-bold tracking-[0.28em] uppercase px-5 pt-2 pb-3" style={{ color: "rgba(255,255,255,0.18)" }}>
            CATEGORIES
          </p>
          {HIRE_CATEGORIES.map(({ label, Icon, color, desc }, i) => (
            <button
              key={label}
              onMouseEnter={() => setActiveCat(i)}
              className="flex items-center gap-3 px-4 py-2.5 text-left w-full transition-all duration-100"
              style={{
                background:  activeCat === i ? "rgba(255,255,255,0.05)" : "transparent",
                borderLeft:  activeCat === i ? `2px solid ${color}` : "2px solid transparent",
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
                style={{ background: activeCat === i ? `${color}22` : "rgba(255,255,255,0.05)" }}
              >
                <Icon size={13} style={{ color: activeCat === i ? color : "rgba(255,255,255,0.35)" }} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold leading-none mb-0.5 truncate"
                  style={{ color: activeCat === i ? "#fff" : "rgba(255,255,255,0.55)" }}>
                  {label}
                </p>
                <p className="text-[10px] leading-none truncate" style={{ color: "rgba(255,255,255,0.25)" }}>{desc}</p>
              </div>
              {activeCat === i && <ArrowRight size={11} className="ml-auto shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />}
            </button>
          ))}
        </div>

        {/* Right: sub-items */}
        <div className="flex-1 p-5 flex flex-col">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${cat.color}20` }}>
              <cat.Icon size={13} style={{ color: cat.color }} />
            </div>
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: cat.color }}>{cat.label}</p>
          </div>
          <div className="grid grid-cols-2 gap-1.5 flex-1">
            {cat.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col p-3 rounded-xl transition-all duration-100"
                style={{ border: "1px solid transparent" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                }}
              >
                <p className="text-[13px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>{item.label}</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{item.desc}</p>
              </Link>
            ))}
          </div>
          <div className="h-px mt-4 mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="flex items-center gap-5">
            <Link href="/hiring" className="text-[12px] font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-70" style={{ color: ACCENT }}>
              Browse all talent <ArrowRight size={11} />
            </Link>
            <Link href="/login" className="text-[12px] font-medium transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.35)" }}>
              Post a commission →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArtistsMenu({ onEnter, onLeave }: { onEnter: () => void; onLeave: () => void }) {
  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 pt-2"
      style={{ minWidth: 560, zIndex: 200 }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(9,9,14,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(32px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        <div className="p-5">
          <p className="text-[9px] font-bold tracking-[0.28em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.18)" }}>
            FIND ARTISTS
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ARTIST_BROWSE.map(({ label, href, Icon, color, desc }) => (
              <Link
                key={href + label}
                href={href}
                className="flex items-center gap-3 p-3 rounded-xl transition-all duration-100"
                style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = `${color}10`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${color}30`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold leading-none mb-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>{label}</p>
                  <p className="text-[10px] leading-none truncate" style={{ color: "rgba(255,255,255,0.3)" }}>{desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="h-px my-4" style={{ background: "rgba(255,255,255,0.06)" }} />
          <p className="text-[9px] font-bold tracking-[0.28em] uppercase mb-3" style={{ color: "rgba(255,255,255,0.18)" }}>
            BROWSE BY STYLE
          </p>
          <div className="flex flex-wrap gap-2">
            {ARTIST_STYLES.map(({ label, href }) => (
              <Link
                key={href + label}
                href={href}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-100"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.07)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = `${GOLD}18`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${GOLD}40`;
                  (e.currentTarget as HTMLElement).style.color = GOLD;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="h-px mt-4 mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />
          <Link href="/hiring" className="text-[12px] font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-70" style={{ color: GOLD }}>
            Explore all artists <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PublicNav() {
  const pathname = usePathname();
  const [scrolled,     setScrolled]     = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"hire" | "artists" | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 70);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  function open(name: "hire" | "artists") {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(name);
  }
  function close() {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 120);
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 md:px-14 lg:px-20 py-5 transition-all duration-500"
      style={{
        background:     scrolled ? "rgba(5,5,5,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(22px)" : "none",
        borderBottom:   scrolled ? "1px solid rgba(255,255,255,0.05)" : "none",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/login-image/ortists logo1.png" alt="Ortist" className="w-7 h-7 rounded-md object-cover" />
        <span className="text-[15px] font-bold tracking-wide text-white">Ortist</span>
      </Link>

      {/* Links */}
      <div className="hidden md:flex items-center gap-8 text-[13px] font-medium">
        {NAV_SIMPLE.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className="transition-colors duration-200 hover:text-white"
            style={{ color: isActive(href) ? "#fff" : MUTED }}
          >
            {label}
          </Link>
        ))}

        {/* Hire mega-menu */}
        <div className="relative" onMouseEnter={() => open("hire")} onMouseLeave={close}>
          <button
            className="flex items-center gap-1 transition-colors duration-200 hover:text-white"
            style={{ color: pathname.startsWith("/hiring") ? "#fff" : MUTED }}
          >
            Hire
            <ChevronDown size={12} style={{ transition: "transform 0.2s", transform: openDropdown === "hire" ? "rotate(180deg)" : "rotate(0deg)" }} />
          </button>
          {openDropdown === "hire" && <HireMenu onEnter={() => open("hire")} onLeave={close} />}
        </div>

        {/* Artists mega-menu */}
        <div className="relative" onMouseEnter={() => open("artists")} onMouseLeave={close}>
          <button
            className="flex items-center gap-1 transition-colors duration-200 hover:text-white"
            style={{ color: MUTED }}
          >
            Artists
            <ChevronDown size={12} style={{ transition: "transform 0.2s", transform: openDropdown === "artists" ? "rotate(180deg)" : "rotate(0deg)" }} />
          </button>
          {openDropdown === "artists" && <ArtistsMenu onEnter={() => open("artists")} onLeave={close} />}
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/login"
        className="hidden md:inline-flex items-center px-5 py-2.5 rounded-full text-[13px] font-semibold text-white transition-all duration-200 hover:opacity-80"
        style={{ background: ACCENT }}
      >
        Join Now
      </Link>
    </nav>
  );
}
