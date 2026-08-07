"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Playfair_Display } from "next/font/google";
import PublicNav from "@/components/layout/PublicNav";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const ACCENT = "#7B4DFF";
const GOLD   = "#FFB800";
const BG     = "#050505";
const SURF   = "#0B0B0F";
const MUTED  = "#8B8B95";

const FEATURED_ARTISTS = [
  { id: 1, name: "Aria Chen",      category: "Digital Art",   avatarSeed: "p-aria-1",   workImg: "/Landing-Images/33.jpeg" },
  { id: 2, name: "Marcus Webb",    category: "Photography",   avatarSeed: "p-marcus-2", workImg: "/Landing-Images/36.jpeg" },
  { id: 3, name: "Sofia Laurent",  category: "Oil Painting",  avatarSeed: "p-sofia-3",  workImg: "/Landing-Images/39.jpeg" },
  { id: 4, name: "Kenji Mori",     category: "Illustration",  avatarSeed: "p-kenji-4",  workImg: "/Landing-Images/42.jpeg" },
  { id: 5, name: "Amara Osei",     category: "Sculpture",     avatarSeed: "p-amara-5",  workImg: "/Landing-Images/45.jpeg" },
  { id: 6, name: "Lena Hoffmann",  category: "Mixed Media",   avatarSeed: "p-lena-6",   workImg: "/Landing-Images/47.jpeg" },
];

const STATS = [
  { value: "12,400+", label: "Artists"    },
  { value: "50,000+", label: "Projects"   },
  { value: "8,200+",  label: "Commissions"},
  { value: "2,100+",  label: "Listings"   },
];

const HERO_CATEGORIES = ["PORTRAIT", "WATERCOLOR", "ACRYLIC PAINTING", "OIL PAINTING", "SCULPTURE", "TRIBAL ART", "DIGITAL ART", "PRINTMAKING"];

const MARQUEE_ITEMS = ["ARTISTS", "GALLERY", "PORTRAIT", "ACRYLIC & OIL PAINTING", "WATERCOLOR", "SCULPTURE", "ILLUSTRATION", "PHOTOGRAPHY", "DIGITAL ART", "PRINTMAKING", "TRIBAL ART", "MIXED MEDIA"];

/* ── Scroll-reveal ── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setRevealed(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, revealed };
}

function RevealFade({
  children, delay = 0, className = "", style = {},
}: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  const { ref, revealed } = useReveal(0.12);
  return (
    <div ref={ref} className={className} style={{
      ...style,
      opacity:    revealed ? 1 : 0,
      transform:  revealed ? "translateY(0)" : "translateY(44px)",
      transition: revealed
        ? `opacity 0.9s ease ${delay}s, transform 1s cubic-bezier(0.22,1,0.36,1) ${delay}s`
        : "none",
    }}>
      {children}
    </div>
  );
}

/* ── Thin divider line ── */
function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />;
}

export default function LandingPage() {
  const router = useRouter();
  const [heroSearch, setHeroSearch] = useState("");

  return (
    <div style={{ background: BG, color: "#fff", overflowX: "hidden" }}>

      <PublicNav />

      {/* ════════════════════════════ HERO ════════════════════════════ */}
      <section className="relative w-full flex items-center justify-center" style={{ height: "100svh", minHeight: 640 }}>

        {/* Static background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Landing-Images/HeroSection background.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(0.32) saturate(0.85)" }}
          />
          {/* Bottom fade */}
          <div className="absolute bottom-0 inset-x-0 h-48" style={{
            background: `linear-gradient(to bottom, transparent, ${BG})`,
          }} />
        </div>

        {/* Centered content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 w-full" style={{ maxWidth: 860 }}>

          {/* — CREATIVE ECOSYSTEM — */}
          <div className="flex items-center gap-4 mb-10">
            <div style={{ height: 1, width: 56, background: "rgba(255,255,255,0.35)" }} />
            <p className="text-[10px] font-semibold tracking-[0.36em] uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>
              Creative Ecosystem
            </p>
            <div style={{ height: 1, width: 56, background: "rgba(255,255,255,0.35)" }} />
          </div>

          {/* Headline */}
          <h1
            className={`${playfair.className} mb-10 leading-[1.04]`}
            style={{ fontSize: "clamp(46px, 7.5vw, 100px)", fontWeight: 400, fontStyle: "italic" }}
          >
            The Home for<br />Creative Work
          </h1>

          {/* Marquee ticker */}
          <div className="w-full mb-8 overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)" }}>
            <div
              className="flex gap-0 whitespace-nowrap"
              style={{ animation: "marquee 28s linear infinite" }}
            >
              {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
                <span
                  key={i}
                  className="text-[10px] font-bold tracking-[0.32em] uppercase shrink-0 px-6"
                  style={{ color: "rgba(255,255,255,0.28)" }}
                >
                  {item} <span style={{ color: "rgba(255,255,255,0.14)" }}>·</span>
                </span>
              ))}
            </div>
          </div>
          <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>

          {/* Search bar */}
          <div className="w-full max-w-[540px] mb-6 flex items-center gap-3 px-5 py-3.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(16px)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={heroSearch}
              onChange={e => setHeroSearch(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && heroSearch.trim()) router.push(`/hiring?search=${encodeURIComponent(heroSearch.trim())}`); }}
              placeholder="Search artists, artwork, services or categories..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "#fff" }}
            />
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {HERO_CATEGORIES.map(cat => (
              <Link
                key={cat}
                href={`/hiring?search=${encodeURIComponent(cat)}`}
                className="px-4 py-2 text-[10px] font-semibold tracking-[0.18em] uppercase transition-all duration-200 hover:bg-white/10 hover:border-white/50"
                style={{ border: "1px solid rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.72)", borderRadius: 4 }}
              >
                {cat}
              </Link>
            ))}
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-10 text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
            <Link href="/feed"    className="hover:text-white transition-colors duration-200">Browse Feed →</Link>
            <Link href="/hiring"  className="hover:text-white transition-colors duration-200">Hire Artists →</Link>
            <Link href="/gallery" className="hover:text-white transition-colors duration-200">Marketplace →</Link>
          </div>
        </div>

      </section>

      {/* ════════════════════════════ S2 – CREATIVE FEED ════════════════════════════ */}
      <section className="relative py-28 md:py-44 px-8 md:px-14 lg:px-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-16 lg:gap-32">

          {/* Image */}
          <RevealFade>
            <div className="relative overflow-hidden" style={{ borderRadius: 3, aspectRatio: "3/4" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Landing-Images/5.jpeg"
                alt="Creative Feed"
                className="w-full h-full object-cover transition-transform duration-1000 hover:scale-[1.04]"
              />
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "linear-gradient(to top, rgba(5,5,5,0.55) 0%, transparent 55%)",
              }} />
              <span
                className="absolute top-5 left-5 text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1.5"
                style={{ background: "rgba(5,5,5,0.65)", color: MUTED, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                Featured Work
              </span>
            </div>
          </RevealFade>

          {/* Text */}
          <RevealFade delay={0.18}>
            <p className="text-[11px] font-semibold tracking-[0.26em] uppercase mb-6" style={{ color: ACCENT }}>
              01 — Discover
            </p>
            <h2 className={`${playfair.className} mb-7 leading-[1.08]`}
              style={{ fontSize: "clamp(36px, 4.2vw, 62px)", fontWeight: 700 }}>
              Creative Feed
            </h2>
            <p className="text-[17px] leading-[1.8] mb-10" style={{ color: MUTED, maxWidth: 380 }}>
              Discover artwork, stories, and creative projects from artists around the world.
            </p>
            <Link
              href="/feed"
              className="inline-flex items-center gap-3 text-sm font-semibold tracking-wide transition-all duration-200 hover:gap-5"
              style={{ color: ACCENT }}
            >
              Enter Feed <span>→</span>
            </Link>
          </RevealFade>
        </div>
      </section>

      <Divider />

      {/* ════════════════════════════ S3 – HIRE ARTISTS ════════════════════════════ */}
      <section className="relative py-28 md:py-44 px-8 md:px-14 lg:px-20" style={{ background: SURF }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-16 lg:gap-32">

          {/* Text */}
          <RevealFade>
            <p className="text-[11px] font-semibold tracking-[0.26em] uppercase mb-6" style={{ color: GOLD }}>
              02 — Commission
            </p>
            <h2 className={`${playfair.className} mb-7 leading-[1.08]`}
              style={{ fontSize: "clamp(36px, 4.2vw, 62px)", fontWeight: 700 }}>
              Hire Artists
            </h2>
            <p className="text-[17px] leading-[1.8] mb-10" style={{ color: MUTED, maxWidth: 380 }}>
              Browse categories, explore portfolios, and connect with artists that match your vision.
            </p>
            <Link
              href="/hiring"
              className="inline-flex items-center gap-3 text-sm font-semibold tracking-wide transition-all duration-200 hover:gap-5"
              style={{ color: GOLD }}
            >
              Explore Talent <span>→</span>
            </Link>
          </RevealFade>

          {/* Image */}
          <RevealFade delay={0.18}>
            <div className="relative overflow-hidden" style={{ borderRadius: 3, aspectRatio: "3/4" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Landing-Images/10.jpeg"
                alt="Hire Artists"
                className="w-full h-full object-cover transition-transform duration-1000 hover:scale-[1.04]"
              />
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "linear-gradient(to bottom, transparent 55%, rgba(5,5,5,0.45) 100%)",
              }} />
            </div>
          </RevealFade>
        </div>
      </section>

      <Divider />

      {/* ════════════════════════════ S4 – Gallery ════════════════════════════ */}
      <section className="relative py-28 md:py-44 px-8 md:px-14 lg:px-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-16 lg:gap-32">

          {/* Image */}
          <RevealFade>
            <div className="relative overflow-hidden" style={{ borderRadius: 3, aspectRatio: "3/4" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Landing-Images/5.jpeg"
                alt="gallery"
                className="w-full h-full object-cover transition-transform duration-1000 hover:scale-[1.04]"
              />
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "linear-gradient(to top, rgba(5,5,5,0.55) 0%, transparent 55%)",
              }} />
            </div>
          </RevealFade>

          {/* Text */}
          <RevealFade delay={0.18}>
            <p className="text-[11px] font-semibold tracking-[0.26em] uppercase mb-6" style={{ color: ACCENT }}>
              03 — Collect
            </p>
            <h2 className={`${playfair.className} mb-7 leading-[1.08]`}
              style={{ fontSize: "clamp(36px, 4.2vw, 62px)", fontWeight: 700 }}>
              Gallery
            </h2>
            <p className="text-[17px] leading-[1.8] mb-10" style={{ color: MUTED, maxWidth: 380 }}>
              Discover creative products, commissions, and artwork available directly from creators.
            </p>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-3 text-sm font-semibold tracking-wide transition-all duration-200 hover:gap-5"
              style={{ color: ACCENT }}
            >
              Visit Gallery <span>→</span>
            </Link>
          </RevealFade>
        </div>
      </section>

      <Divider />

      {/* ════════════════════════════ S5 – CREATE PROFILE ════════════════════════════ */}
      <section className="relative py-28 md:py-44 px-8 md:px-14 lg:px-20" style={{ background: SURF }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-16 lg:gap-32">

          {/* Text */}
          <RevealFade>
            <p className="text-[11px] font-semibold tracking-[0.26em] uppercase mb-6" style={{ color: GOLD }}>
              04 — Grow
            </p>
            <h2 className={`${playfair.className} mb-7 leading-[1.08]`}
              style={{ fontSize: "clamp(36px, 4.2vw, 62px)", fontWeight: 700 }}>
              Create Your<br />Profile
            </h2>
            <p className="text-[17px] leading-[1.8] mb-10" style={{ color: MUTED, maxWidth: 380 }}>
              Build a portfolio, share your journey, and grow your creative presence.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 rounded-full text-sm font-bold transition-all duration-300 hover:scale-[1.04]"
              style={{ background: GOLD, color: "#050505" }}
            >
              Get Started
            </Link>
          </RevealFade>

          {/* Image */}
          <RevealFade delay={0.18}>
            <div className="relative overflow-hidden" style={{ borderRadius: 3, aspectRatio: "3/4" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Landing-Images/25.jpeg"
                alt="Create Profile"
                className="w-full h-full object-cover transition-transform duration-1000 hover:scale-[1.04]"
              />
            </div>
          </RevealFade>
        </div>
      </section>

      {/* ════════════════════════════ S6 – FEATURED ARTISTS ════════════════════════════ */}
      <section className="py-28 md:py-40 overflow-hidden">

        <RevealFade className="px-8 md:px-14 lg:px-20 mb-14">
          <div className="max-w-7xl mx-auto flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.26em] uppercase mb-4" style={{ color: ACCENT }}>
                05 — Artists
              </p>
              <h2 className={`${playfair.className} leading-[1.08]`}
                style={{ fontSize: "clamp(34px, 4vw, 58px)", fontWeight: 700 }}>
                Featured Artists
              </h2>
            </div>
            <Link
              href="/hiring"
              className="hidden md:flex items-center gap-2 text-sm font-semibold transition-colors duration-200 hover:text-white"
              style={{ color: MUTED }}
            >
              View All <span>→</span>
            </Link>
          </div>
        </RevealFade>

        {/* Horizontal gallery — each card links to hire page */}
        <div
          className="flex gap-5 pl-8 md:pl-14 lg:pl-20 pr-8 overflow-x-auto pb-3"
          style={{ scrollbarWidth: "none" }}
        >
          {FEATURED_ARTISTS.map((artist, i) => (
            <RevealFade key={artist.id} delay={i * 0.07} style={{ minWidth: 276, flexShrink: 0 }}>
              <Link
                href={`/hiring?search=${encodeURIComponent(artist.category)}`}
                className="group block"
                style={{ background: SURF, borderRadius: 3, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", textDecoration: "none" }}
              >
                {/* Work */}
                <div className="relative overflow-hidden" style={{ height: 360 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={artist.workImg}
                    alt={artist.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: "linear-gradient(to top, rgba(5,5,5,0.75) 0%, transparent 50%)",
                  }} />
                  {/* View artists overlay on hover */}
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "rgba(0,0,0,0.35)" }}
                  >
                    <span
                      className="px-5 py-2 rounded-full text-xs font-bold text-white"
                      style={{ background: ACCENT, boxShadow: `0 0 24px ${ACCENT}60` }}
                    >
                      Explore {artist.category} →
                    </span>
                  </div>
                </div>
                {/* Info */}
                <div className="p-5 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://picsum.photos/seed/${artist.avatarSeed}/80/80`}
                    alt={artist.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                    style={{ border: `2px solid ${ACCENT}55` }}
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white">{artist.name}</p>
                    <p className="text-[11px]" style={{ color: MUTED }}>{artist.category}</p>
                  </div>
                </div>
              </Link>
            </RevealFade>
          ))}
        </div>
      </section>

      <Divider />

      {/* ════════════════════════════ S7 – STATS ════════════════════════════ */}
      <section
        className="relative py-28 md:py-44 px-8 md:px-14 lg:px-20 overflow-hidden"
        style={{ background: SURF }}
      >
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${ACCENT}10 0%, transparent 70%)`,
        }} />

        <div className="relative max-w-7xl mx-auto">
          <RevealFade className="text-center mb-20">
            <p className="text-[11px] font-semibold tracking-[0.28em] uppercase mb-5" style={{ color: MUTED }}>
              By the Numbers
            </p>
            <h2 className={`${playfair.className} leading-[1.1]`}
              style={{ fontSize: "clamp(30px, 4vw, 52px)", fontWeight: 700, color: "rgba(255,255,255,0.88)" }}>
              A Growing Creative Community
            </h2>
          </RevealFade>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: "rgba(255,255,255,0.05)" }}>
            {STATS.map((stat, i) => (
              <RevealFade
                key={stat.label}
                delay={i * 0.09}
                className="flex flex-col items-center justify-center py-16 px-6 text-center"
                style={{ background: SURF }}
              >
                <p
                  className={`${playfair.className} font-black mb-3`}
                  style={{ fontSize: "clamp(38px, 5vw, 68px)", color: i % 2 === 0 ? ACCENT : GOLD }}
                >
                  {stat.value}
                </p>
                <p className="text-sm font-semibold tracking-[0.16em] uppercase" style={{ color: MUTED }}>
                  {stat.label}
                </p>
              </RevealFade>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════ FOOTER ════════════════════════════ */}
      <footer
        className="relative pt-28 md:pt-36 pb-10 px-8 md:px-14 lg:px-20 overflow-hidden"
        style={{ background: "#08080C", borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-7xl mx-auto">

          {/* Large editorial wordmark */}
          <RevealFade>
            <div className="mb-16 pb-16" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <h2
                className={`${playfair.className} font-black leading-none select-none`}
                style={{
                  fontSize: "clamp(56px, 11vw, 148px)",
                  color: "rgba(255,255,255,0.045)",
                  letterSpacing: "-0.02em",
                }}
              >
                ORTISTS
              </h2>
            </div>
          </RevealFade>

          {/* Links grid */}
          <RevealFade delay={0.1}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-20">
              {/* Brand */}
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/login-image/ortists logo1.png" alt="Ortists" className="w-7 h-7 rounded-md object-cover" />
                  <span className="font-bold text-white text-[15px] tracking-[0.06em]">Ortists</span>
                </div>
                <p className="text-[13px] leading-relaxed mb-7" style={{ color: MUTED, maxWidth: 220 }}>
                  A creative ecosystem for artists to showcase, connect, and thrive.
                </p>
                {/* Socials */}
                <div className="flex gap-3">
                  {[
                    { label: "Facebook", path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
                    { label: "Instagram", path: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01M7.5 2h9a5.5 5.5 0 0 1 5.5 5.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2z" },
                    { label: "LinkedIn", path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
                  ].map(({ label, path }) => (
                    <a
                      key={label}
                      href="#"
                      aria-label={label}
                      className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hover:opacity-70"
                      style={{ border: "1px solid rgba(255,255,255,0.1)", color: MUTED }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={path} />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>

              {/* Platform */}
              <div>
                <p className="text-[11px] font-bold tracking-[0.22em] uppercase mb-5"
                  style={{ color: "rgba(255,255,255,0.22)" }}>Platform</p>
                <ul className="flex flex-col gap-3">
                  {[["Feed", "/feed"], ["gallery", "/gallery"], ["Hiring", "/hiring"], ["Artists", "/hiring"]].map(([l, h]) => (
                    <li key={l}>
                      <Link href={h} className="text-[13px] transition-colors duration-200 hover:text-white" style={{ color: MUTED }}>
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <p className="text-[11px] font-bold tracking-[0.22em] uppercase mb-5"
                  style={{ color: "rgba(255,255,255,0.22)" }}>Company</p>
                <ul className="flex flex-col gap-3">
                  {[["About", "/about"], ["Blog", "#"], ["Careers", "#"], ["Press", "#"]].map(([l, h]) => (
                    <li key={l}>
                      <Link href={h} className="text-[13px] transition-colors duration-200 hover:text-white" style={{ color: MUTED }}>
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div>
                <p className="text-[11px] font-bold tracking-[0.22em] uppercase mb-5"
                  style={{ color: "rgba(255,255,255,0.22)" }}>Legal</p>
                <ul className="flex flex-col gap-3">
                  {[
                    ["Privacy Policy",            "/privacy"],
                    ["Terms of Service",          "/terms"],
                    ["Refund & Cancellation",     "/refund"],
                    ["Shipping & Delivery",       "/shipping"],
                    ["Artists Agreement",         "/artists-agreement"],
                    ["Client Agreement",          "/client-agreement"],
                  ].map(([l, h]) => (
                    <li key={l}>
                      <Link href={h} className="text-[13px] transition-colors duration-200 hover:text-white" style={{ color: MUTED }}>
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support */}
              <div>
                <p className="text-[11px] font-bold tracking-[0.22em] uppercase mb-5"
                  style={{ color: "rgba(255,255,255,0.22)" }}>Support</p>
                <ul className="flex flex-col gap-3">
                  {[
                    ["Help & Support", "/help"],
                    ["Contact Us",     "/contact"],
                  ].map(([l, h]) => (
                    <li key={l}>
                      <Link href={h} className="text-[13px] transition-colors duration-200 hover:text-white" style={{ color: MUTED }}>
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </RevealFade>

          {/* Bottom bar */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
              © {new Date().getFullYear()} Ortist. All rights reserved.
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
              Built for creators, by creators.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
