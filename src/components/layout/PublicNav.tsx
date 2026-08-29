"use client";

import Link from "next/link";
import { ArrowRight, Award, Briefcase, ChevronDown, Cpu, Feather, Layers, Paintbrush, Palette, Printer, Sparkles, Star, TrendingUp, Triangle, TreePine, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const ACCENT = "#7B4DFF";
const GOLD   = "#FFB800";
const MUTED  = "#8B8B95";

const HIRE_CATEGORIES = [
  {
    label: "Fine Arts", Icon: Palette, color: "#F59E0B",
    desc: "Painting, drawing & traditional fine art",
    items: [
      { label: "Painting" },          { label: "Drawing" },
      { label: "Sketching" },         { label: "Illustration" },
      { label: "Watercolor" },        { label: "Oil Painting" },
      { label: "Acrylic Painting" },  { label: "Gouache" },
      { label: "Ink Art" },           { label: "Pastel Art" },
      { label: "Charcoal Art" },      { label: "Portrait Art" },
      { label: "Landscape Art" },     { label: "Abstract Art" },
      { label: "Contemporary Art" },  { label: "Realism" },
      { label: "Hyperrealism" },      { label: "Surrealism" },
      { label: "Expressionism" },     { label: "Figurative Art" },
      { label: "Miniature Art" },     { label: "Religious Art" },
      { label: "Conceptual Art" },    { label: "Mixed Media Art" },
      { label: "Mural Art" },         { label: "Fresco Art" },
    ],
  },
  {
    label: "Sculpture", Icon: Triangle, color: "#F43F5E",
    desc: "Stone, clay, metal & mixed sculpture",
    items: [
      { label: "Stone Sculpture" },       { label: "Marble Sculpture" },
      { label: "Wood Sculpture" },        { label: "Clay Sculpture" },
      { label: "Ceramic Sculpture" },     { label: "Metal Sculpture" },
      { label: "Bronze Casting" },        { label: "Metal Casting" },
      { label: "Fiber Sculpture" },       { label: "Resin Sculpture" },
      { label: "Kinetic Sculpture" },     { label: "Installation Sculpture" },
      { label: "Public Art Sculpture" },  { label: "Monument Sculpture" },
      { label: "Figurative Sculpture" },  { label: "Abstract Sculpture" },
    ],
  },
  {
    label: "Tribal & Indigenous Arts", Icon: Feather, color: "#10B981",
    desc: "Traditional tribal & folk art forms",
    items: [
      { label: "Tribal Painting" },       { label: "Folk Art" },
      { label: "Warli Art" },             { label: "Madhubani Art" },
      { label: "Pattachitra" },           { label: "Gond Art" },
      { label: "Tanjore Painting" },      { label: "Kalamkari" },
      { label: "Dhokra Craft" },          { label: "Indigenous Weaving" },
      { label: "Tribal Sculpture" },      { label: "Ceremonial Art" },
    ],
  },
  {
    label: "Wood Arts", Icon: TreePine, color: "#A16207",
    desc: "Carving, turning & woodwork",
    items: [
      { label: "Wood Carving" },          { label: "Wood Turning" },
      { label: "Relief Carving" },        { label: "Chip Carving" },
      { label: "Pyrography" },            { label: "Marquetry" },
      { label: "Intarsia" },              { label: "Furniture Design" },
      { label: "Wooden Sculpture" },      { label: "Wood Burning Art" },
    ],
  },
  {
    label: "Digital Arts", Icon: Layers, color: "#06B6D4",
    desc: "Digital illustration, design & media",
    items: [
      { label: "Digital Illustration" },  { label: "Concept Art" },
      { label: "Character Design" },      { label: "Logo & Branding" },
      { label: "UI/UX Design" },          { label: "Motion Graphics" },
      { label: "3D Modeling" },           { label: "NFT Art" },
      { label: "Photo Manipulation" },    { label: "Social Media Art" },
      { label: "GIF & Animation" },       { label: "Game Art" },
    ],
  },
  {
    label: "Printmaking", Icon: Paintbrush, color: "#8B5CF6",
    desc: "Relief, intaglio & screen printing",
    items: [
      { label: "Woodblock Print" },       { label: "Linocut" },
      { label: "Etching" },               { label: "Screen Printing" },
      { label: "Lithography" },           { label: "Monotype" },
      { label: "Aquatint" },              { label: "Engraving" },
      { label: "Letterpress" },           { label: "Risograph" },
    ],
  },
  {
    label: "Resin Arts", Icon: Cpu, color: "#EC4899",
    desc: "Epoxy, resin casting & fluid art",
    items: [
      { label: "Resin Pouring" },         { label: "Epoxy Table Art" },
      { label: "Resin Jewellery" },       { label: "Fluid Art" },
      { label: "Resin Sculpture" },       { label: "Geode Art" },
      { label: "Ocean Art" },             { label: "Resin Coasters" },
      { label: "Resin Clock Art" },       { label: "UV Resin Art" },
    ],
  },
  {
    label: "Print Art", Icon: Printer, color: "#64748B",
    desc: "Fine art prints, posters & editions",
    items: [
      { label: "Fine Art Print" },        { label: "Giclée Print" },
      { label: "Poster Art" },            { label: "Limited Edition Print" },
      { label: "Archival Print" },        { label: "Canvas Print" },
      { label: "Art Reproduction" },      { label: "Zine Making" },
    ],
  },
];

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
      style={{ minWidth: 780, zIndex: 200 }}
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
          maxHeight: "80vh",
        }}
      >
        {/* Left: main categories */}
        <div className="flex flex-col py-3 shrink-0 overflow-y-auto" style={{ width: 220, borderRight: "1px solid rgba(255,255,255,0.06)", scrollbarWidth: "none" }}>
          <p className="text-[9px] font-bold tracking-[0.28em] uppercase px-5 pt-2 pb-3" style={{ color: "rgba(255,255,255,0.18)" }}>
            MAIN CATEGORY
          </p>
          {HIRE_CATEGORIES.map(({ label, Icon, color, desc }, i) => (
            <button
              key={label}
              onMouseEnter={() => setActiveCat(i)}
              className="flex items-center gap-3 px-4 py-2.5 text-left w-full transition-all duration-100"
              style={{
                background: activeCat === i ? "rgba(255,255,255,0.05)" : "transparent",
                borderLeft: activeCat === i ? `2px solid ${color}` : "2px solid transparent",
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

        {/* Right: sub-categories */}
        <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
          {/* Header */}
          <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${cat.color}20` }}>
              <cat.Icon size={13} style={{ color: cat.color }} />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: cat.color }}>{cat.label}</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>Sub-Category</p>
            </div>
          </div>

          {/* Scrollable sub-items grid */}
          <div className="overflow-y-auto flex-1 p-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
            <div className="grid grid-cols-3 gap-1">
              {cat.items.map(item => (
                  <Link
                    key={item.label}
                    href={`/hiring?search=${encodeURIComponent(item.label)}`}
                    className="px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-100 truncate"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = `${cat.color}15`;
                      (e.currentTarget as HTMLElement).style.color = "#fff";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)";
                    }}
                  >
                    {item.label}
                  </Link>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 flex items-center gap-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
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
      className="fixed top-0 inset-x-0 z-50 flex items-center px-6 md:px-10 lg:px-16 py-3.5 transition-all duration-500"
      style={{
        background:     scrolled ? "rgba(5,5,5,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(22px)" : "none",
        borderBottom:   scrolled ? "1px solid rgba(255,255,255,0.05)" : "none",
      }}
    >
      {/* Left: Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/login-image/ortists logo1.png" alt="Ortists" className="w-7 h-7 rounded-md object-cover" />
        <span className="text-[15px] font-bold tracking-[0.06em] text-white">
          Ortist<span style={{ color: ACCENT }}>.</span>
        </span>
      </Link>

      {/* Center: nav links */}
      <div className="hidden md:flex items-center gap-7 text-[12px] font-semibold tracking-[0.12em] uppercase absolute left-1/2 -translate-x-1/2">
        <Link
          href="/feed"
          className="transition-colors duration-200 hover:text-white"
          style={{ color: isActive("/feed") ? "#fff" : MUTED }}
        >
          Feed
        </Link>

        {/* Marketplace (Gallery) */}
        <Link
          href="/gallery"
          className="transition-colors duration-200 hover:text-white"
          style={{ color: isActive("/gallery") ? "#fff" : MUTED }}
        >
          Marketplace
        </Link>

        {/* Hire Artists mega-menu */}
        <div className="relative" onMouseEnter={() => open("hire")} onMouseLeave={close}>
          <button
            className="flex items-center gap-1 transition-colors duration-200 hover:text-white"
            style={{ color: pathname.startsWith("/hiring") ? "#fff" : MUTED }}
          >
            Hire Artists
            <ChevronDown size={11} style={{ transition: "transform 0.2s", transform: openDropdown === "hire" ? "rotate(180deg)" : "rotate(0deg)" }} />
          </button>
          {openDropdown === "hire" && <HireMenu onEnter={() => open("hire")} onLeave={close} />}
        </div>

        <Link
          href="/about"
          className="transition-colors duration-200 hover:text-white"
          style={{ color: isActive("/about") ? "#fff" : MUTED }}
        >
          About
        </Link>
      </div>

      {/* Right: auth buttons */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        <Link
          href="/login"
          className="px-3 sm:px-5 py-2 rounded-full text-[12px] font-semibold tracking-wide uppercase transition-all duration-200 hover:text-white"
          style={{ color: MUTED }}
        >
          <span className="hidden sm:inline">Sign In</span>
          <span className="sm:hidden">In</span>
        </Link>

        <Link
          href="/login?mode=signup"
          className="px-3 sm:px-5 py-2 rounded-full text-[12px] font-semibold tracking-wide uppercase text-white transition-all duration-200 hover:opacity-85"
          style={{ background: ACCENT }}
        >
          <span className="hidden sm:inline">Sign Up</span>
          <span className="sm:hidden">Up</span>
        </Link>
      </div>
    </nav>
  );
}
