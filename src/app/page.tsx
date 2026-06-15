"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Playfair_Display } from "next/font/google";

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

const NAV_LINKS = [
  ["Feed",        "/feed"],
  ["Marketplace", "/marketplace"],
  ["Hire",        "/hiring"],
  ["Artists",     "/hiring"],
  ["About",       "#"],
] as const;

const FEATURED_ARTISTS = [
  { id: 1, name: "Aria Chen",      category: "Digital Art",   avatarSeed: "p-aria-1",   workSeed: "abstract-digital-1"  },
  { id: 2, name: "Marcus Webb",    category: "Photography",   avatarSeed: "p-marcus-2", workSeed: "photo-landscape-22"  },
  { id: 3, name: "Sofia Laurent",  category: "Oil Painting",  avatarSeed: "p-sofia-3",  workSeed: "painting-oil-33"     },
  { id: 4, name: "Kenji Mori",     category: "Illustration",  avatarSeed: "p-kenji-4",  workSeed: "illustration-44"     },
  { id: 5, name: "Amara Osei",     category: "Sculpture",     avatarSeed: "p-amara-5",  workSeed: "sculpture-55"        },
  { id: 6, name: "Lena Hoffmann",  category: "Mixed Media",   avatarSeed: "p-lena-6",   workSeed: "mixed-media-66"      },
];

const STATS = [
  { value: "12,400+", label: "Artists"    },
  { value: "50,000+", label: "Projects"   },
  { value: "8,200+",  label: "Commissions"},
  { value: "2,100+",  label: "Listings"   },
];

/* Artistic hero slides — moody, painterly picsum seeds */
const HERO_SLIDES = [
  { src: "https://picsum.photos/seed/portrait-dark-oil-1/1920/1200", label: "Oil on canvas · c. 1680" },
  { src: "https://picsum.photos/seed/baroque-figure-2/1920/1200",    label: "Charcoal study · c. 1720" },
  { src: "https://picsum.photos/seed/dramatic-chiaroscuro-3/1920/1200", label: "Mixed media · c. 1890" },
  { src: "https://picsum.photos/seed/ethereal-landscape-art-4/1920/1200", label: "Oil on panel · c. 1640" },
  { src: "https://picsum.photos/seed/classical-museum-5/1920/1200",  label: "Tempera on canvas · c. 1750" },
];

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
  const [scrolled, setScrolled] = useState(false);
  const [slide,   setSlide]   = useState(0);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 70);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: BG, color: "#fff", overflowX: "hidden" }}>

      {/* ════════════════════════════ NAV ════════════════════════════ */}
      <nav
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 md:px-14 lg:px-20 py-5 transition-all duration-500"
        style={{
          background:    scrolled ? "rgba(5,5,5,0.88)" : "transparent",
          backdropFilter: scrolled ? "blur(22px)" : "none",
          borderBottom:  scrolled ? "1px solid rgba(255,255,255,0.05)" : "none",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/login-image/ortists logo1.png" alt="Ortist" className="w-7 h-7 rounded-md object-cover" />
          <span className="text-[15px] font-bold tracking-wide text-white">Ortist</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[13px] font-medium" style={{ color: MUTED }}>
          {NAV_LINKS.map(([label, href]) => (
            <Link key={label} href={href} className="hover:text-white transition-colors duration-200">{label}</Link>
          ))}
        </div>

        <Link
          href="/login"
          className="hidden md:inline-flex items-center px-5 py-2.5 rounded-full text-[13px] font-semibold text-white transition-all duration-200 hover:opacity-80"
          style={{ background: ACCENT }}
        >
          Join Now
        </Link>
      </nav>

      {/* ════════════════════════════ HERO ════════════════════════════ */}
      <section className="relative w-full" style={{ height: "100svh", minHeight: 640 }}>

        {/* Cinematic background slider */}
        <div className="absolute inset-0 overflow-hidden">
          {HERO_SLIDES.map((s, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={s.src}
              src={s.src}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                filter: "brightness(0.28) saturate(0.10)",
                opacity: i === slide ? 1 : 0,
                transform: i === slide ? "scale(1.04)" : "scale(1)",
                transition: "opacity 1.6s ease-in-out, transform 8s ease-out",
                zIndex: i === slide ? 1 : 0,
              }}
            />
          ))}
          {/* Right-side gradient for text legibility */}
          <div className="absolute inset-0 z-10" style={{
            background: `linear-gradient(108deg,
              rgba(5,5,5,0)     0%,
              rgba(5,5,5,0.25)  30%,
              rgba(5,5,5,0.78)  58%,
              ${BG}             100%)`,
          }} />
          {/* Bottom fade */}
          <div className="absolute bottom-0 inset-x-0 h-56 z-10" style={{
            background: `linear-gradient(to bottom, transparent, ${BG})`,
          }} />
        </div>

        {/* Content */}
        <div className="relative z-20 h-full flex items-center">
          <div className="w-full max-w-[1440px] mx-auto px-8 md:px-14 lg:px-20 flex justify-end">
            <div style={{ maxWidth: 560 }}>
              <p className="text-[11px] font-semibold tracking-[0.32em] uppercase mb-7" style={{ color: GOLD }}>
                ✦ &nbsp;The Creative Ecosystem
              </p>
              <h1
                className={`${playfair.className} mb-7 leading-[1.05]`}
                style={{ fontSize: "clamp(44px, 5.8vw, 80px)", fontWeight: 700 }}
              >
                Where Creativity<br />
                <em style={{ color: ACCENT, fontStyle: "italic" }}>Finds Opportunity</em>
              </h1>
              <p
                className="text-[17px] leading-[1.8] mb-12"
                style={{ color: "rgba(255,255,255,0.52)", maxWidth: 400 }}
              >
                Showcase your work.&nbsp; Build your presence.<br />
                Get discovered.&nbsp; Get hired.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <Link
                  href="/feed"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold text-white transition-all duration-300 hover:scale-[1.04]"
                  style={{ background: ACCENT, boxShadow: `0 0 44px ${ACCENT}48` }}
                >
                  Explore Ortist
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center px-8 py-4 rounded-full text-sm font-semibold transition-all duration-300 hover:bg-white/8"
                  style={{ border: "1px solid rgba(255,255,255,0.16)", color: "rgba(255,255,255,0.72)" }}
                >
                  Join as Creator
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Slide dots + artwork label — bottom left */}
        <div className="absolute bottom-9 left-8 md:left-14 lg:left-20 z-20 flex flex-col gap-4">
          <p className="text-[10px] font-medium tracking-[0.22em] uppercase" style={{ color: "rgba(255,255,255,0.28)" }}>
            {HERO_SLIDES[slide].label}
          </p>
          <div className="flex items-center gap-2">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Slide ${i + 1}`}
                className="transition-all duration-500"
                style={{
                  width:  i === slide ? 28 : 6,
                  height: 2,
                  borderRadius: 9999,
                  background: i === slide ? "#fff" : "rgba(255,255,255,0.25)",
                  cursor: "pointer",
                  border: "none",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Scroll indicator — bottom center */}
        <div
          className="absolute bottom-9 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3"
          style={{ color: MUTED, animation: "pulse 2.4s ease-in-out infinite" }}
        >
          <span className="text-[10px] font-medium tracking-[0.28em] uppercase">Scroll</span>
          <div className="w-px h-14" style={{ background: `linear-gradient(to bottom, ${MUTED}70, transparent)` }} />
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
                src="https://picsum.photos/seed/creative-feed-s2/800/1067"
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
                src="https://picsum.photos/seed/hire-artists-s3/800/1067"
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

      {/* ════════════════════════════ S4 – MARKETPLACE ════════════════════════════ */}
      <section className="relative py-28 md:py-44 px-8 md:px-14 lg:px-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-16 lg:gap-32">

          {/* Image */}
          <RevealFade>
            <div className="relative overflow-hidden" style={{ borderRadius: 3, aspectRatio: "3/4" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://picsum.photos/seed/marketplace-s4/800/1067"
                alt="Marketplace"
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
              Marketplace
            </h2>
            <p className="text-[17px] leading-[1.8] mb-10" style={{ color: MUTED, maxWidth: 380 }}>
              Discover creative products, commissions, and artwork available directly from creators.
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-3 text-sm font-semibold tracking-wide transition-all duration-200 hover:gap-5"
              style={{ color: ACCENT }}
            >
              Visit Marketplace <span>→</span>
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
                src="https://picsum.photos/seed/create-profile-s5/800/1067"
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

        {/* Horizontal gallery */}
        <div
          className="flex gap-5 pl-8 md:pl-14 lg:pl-20 pr-8 overflow-x-auto pb-3"
          style={{ scrollbarWidth: "none" }}
        >
          {FEATURED_ARTISTS.map((artist, i) => (
            <RevealFade key={artist.id} delay={i * 0.07} style={{ minWidth: 276, flexShrink: 0 }}>
              <div
                className="group cursor-pointer"
                style={{ background: SURF, borderRadius: 3, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                {/* Work */}
                <div className="relative overflow-hidden" style={{ height: 360 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://picsum.photos/seed/${artist.workSeed}/560/747`}
                    alt={artist.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: "linear-gradient(to top, rgba(5,5,5,0.75) 0%, transparent 50%)",
                  }} />
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
                  <div>
                    <p className="text-[13px] font-semibold text-white">{artist.name}</p>
                    <p className="text-[11px]" style={{ color: MUTED }}>{artist.category}</p>
                  </div>
                </div>
              </div>
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
                ORTIST
              </h2>
            </div>
          </RevealFade>

          {/* Links grid */}
          <RevealFade delay={0.1}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
              {/* Brand */}
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/login-image/ortists logo1.png" alt="Ortist" className="w-7 h-7 rounded-md object-cover" />
                  <span className="font-bold text-white text-[15px]">Ortist</span>
                </div>
                <p className="text-[13px] leading-relaxed mb-7" style={{ color: MUTED, maxWidth: 220 }}>
                  A creative ecosystem for artists to showcase, connect, and thrive.
                </p>
                {/* Socials */}
                <div className="flex gap-3">
                  {[
                    { label: "X", d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                    { label: "Instagram", d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01" },
                  ].map(({ label, d }) => (
                    <a
                      key={label}
                      href="#"
                      aria-label={label}
                      className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hover:opacity-70"
                      style={{ border: "1px solid rgba(255,255,255,0.1)", color: MUTED }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={d} />
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
                  {[["Feed", "/feed"], ["Marketplace", "/marketplace"], ["Hiring", "/hiring"], ["Artists", "/hiring"]].map(([l, h]) => (
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
                  {[["About", "#"], ["Blog", "#"], ["Careers", "#"], ["Press", "#"]].map(([l, h]) => (
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
                  {[["Privacy Policy", "#"], ["Terms of Service", "#"], ["Cookie Policy", "#"]].map(([l, h]) => (
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
