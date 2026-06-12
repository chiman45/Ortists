"use client";

import SearchOverlay from "@/components/search/SearchOverlay";
import { FeaturesGrid, FeaturesHero, FeatureHighlight, StatsBar } from "@/components/features";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ── Scroll-reveal helpers ── */
function useReveal(threshold = 0.25) {
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

function RevealWords({ text, className = "", style = {}, baseDelay = 0, stagger = 0.06 }:
  { text: string; className?: string; style?: React.CSSProperties; baseDelay?: number; stagger?: number }) {
  const { ref, revealed } = useReveal(0.3);
  return (
    <span ref={ref} className={className} style={style}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="word-clip">
          <span style={{ animation: revealed ? `word-up 0.7s cubic-bezier(0.22,1,0.36,1) ${baseDelay + i * stagger}s both` : "none", opacity: revealed ? undefined : 0 }}>
            {word}
          </span>
          {i < text.split(" ").length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

function RevealFade({ children, delay = 0, className = "", style = {} }:
  { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  const { ref, revealed } = useReveal(0.2);
  return (
    <div ref={ref} className={className} style={{
      ...style,
      opacity: revealed ? 1 : 0,
      transform: revealed ? "translateY(0)" : "translateY(28px)",
      transition: revealed ? `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s` : "none",
    }}>
      {children}
    </div>
  );
}

const CARDS = [
  { seed: "artwork-urban",    w: 280, h: 375, rotate: -20, x: -235 },
  { seed: "artwork-collage",  w: 270, h: 360, rotate: -11, x: -138 },
  { seed: "artwork-poster",   w: 265, h: 348, rotate:  -3, x:  -47 },
  { seed: "artwork-abstract", w: 268, h: 352, rotate:   5, x:   52  },
  { seed: "artwork-graffiti", w: 270, h: 360, rotate:  13, x:  150  },
  { seed: "artwork-street",   w: 265, h: 348, rotate:  22, x:  248  },
] as const;

const CARD_Z    = [1, 3, 5, 5, 3, 1];
const FLOAT_DUR = [2.4, 2.8, 2.5, 2.7, 2.6, 2.9];
const FLOAT_DEL = [0.0, 0.4, 0.2, 0.6, 0.1, 0.5];

const H1_L1 = ["A", "place", "to", "display", "your"];
const H1_L2 = ["masterpiece."];

const SPRING_IN    = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const SPRING_HOVER = "cubic-bezier(0.34, 1.56, 0.64, 1)";

type Phase = "hidden" | "appearing" | "floating";

export default function LandingPage() {
  const [phase,       setPhase]       = useState<Phase>("hidden");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [searchOpen,  setSearchOpen]  = useState(false);

  const mainRef = useRef<HTMLDivElement>(null);
  const fanRef  = useRef<HTMLDivElement>(null);
  const tiltRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("appearing"), 80);
    const t2 = setTimeout(() => setPhase("floating"),  2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    const main = mainRef.current;
    const fan  = fanRef.current;
    if (!main || !fan) return;
    let raf = 0;

    function onMove(e: MouseEvent) {
      const r = main!.getBoundingClientRect();
      tiltRef.current = {
        x: ((e.clientX - r.left) / r.width  - 0.5) * 10,
        y: ((e.clientY - r.top)  / r.height - 0.5) * 6,
      };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        fan!.style.transform =
          `perspective(900px) rotateY(${tiltRef.current.x}deg) rotateX(${-tiltRef.current.y}deg)`;
      });
    }
    function onLeave() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        fan!.style.transform  = "perspective(900px) rotateY(0deg) rotateX(0deg)";
        fan!.style.transition = "transform 0.9s cubic-bezier(0.22,1,0.36,1)";
      });
      setTimeout(() => { if (fan) fan.style.transition = "transform 0.12s ease-out"; }, 950);
    }

    main.addEventListener("mousemove",  onMove);
    main.addEventListener("mouseleave", onLeave);
    fan.style.transition = "transform 0.12s ease-out";
    return () => {
      main.removeEventListener("mousemove",  onMove);
      main.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  const visible  = phase !== "hidden";
  const floating = phase === "floating";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Background glow orbs */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position:"absolute", top:"-15%", left:"-8%", width:700, height:700, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(54,30,123,0.22) 0%, transparent 65%)" }} />
        <div style={{ position:"absolute", bottom:"-5%", right:"-3%", width:500, height:500, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(124,91,245,0.10) 0%, transparent 70%)" }} />
      </div>

      {/* ── Hero ── */}
      <main
        ref={mainRef}
        className="flex-1 flex items-center select-none"
        style={{ minHeight:"100svh", paddingTop:96, paddingLeft:"5%", paddingRight:"5%", paddingBottom:40, position:"relative", zIndex:1 }}
      >
        <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-10 lg:gap-14">

          {/* Left: Text + Buttons */}
          <div className="w-full lg:flex-1 text-center lg:text-left" style={{ maxWidth:520 }}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background:"rgba(54,30,123,0.25)", border:"1px solid rgba(124,91,245,0.30)",
                color:"rgba(255,255,255,0.70)",
                animation: visible ? "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s both" : "none",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background:"#7C5BF5", animation:"pulse-glow 2s ease-in-out infinite" }} />
              ✦ Design Platform
            </div>

            {/* Heading */}
            <h1 className="font-black tracking-tight leading-[1.06] mb-2"
              style={{ fontSize:"clamp(36px, 5vw, 66px)", color: "var(--text-1)" }}>
              <span className="block mb-1">
                {H1_L1.map((word, i) => (
                  <span key={word + i} className="word-clip">
                    <span style={{ animation: visible ? `word-up 0.65s cubic-bezier(0.22,1,0.36,1) ${0.18 + i * 0.07}s both` : "none" }}>
                      {word}
                    </span>
                    {i < H1_L1.length - 1 ? " " : ""}
                  </span>
                ))}
              </span>
              {/* Spacer between lines */}
              <span className="block h-5 lg:h-7" aria-hidden="true" />
              <span className="block" style={{ color:"#7C5BF5" }}>
                {H1_L2.map((word, i) => (
                  <span key={word + i} className="word-clip">
                    <span style={{ animation: visible ? `word-up 0.65s cubic-bezier(0.22,1,0.36,1) ${0.18 + (H1_L1.length + i) * 0.07}s both` : "none" }}>
                      {word}
                    </span>
                  </span>
                ))}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base leading-relaxed mb-8 mt-5"
              style={{ color: "var(--text-4)", animation: visible ? "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.65s both" : "none" }}>
              Artists display their masterpieces. Buyers discover and
              purchase works that resonate with them.
            </p>

            {/* CTAs */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-8"
              style={{ animation: visible ? "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.78s both" : "none" }}>
              <Link href="/login"
                className="px-6 py-3 text-sm font-semibold rounded-2xl text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                style={{ background:"#361E7B", boxShadow:"0 4px 24px rgba(54,30,123,0.50)" }}
                onMouseEnter={e => (e.currentTarget.style.background="#4B2FA8")}
                onMouseLeave={e => (e.currentTarget.style.background="#361E7B")}
              >Join for $9.99/m</Link>
              <Link href="/login"
                className="px-5 py-3 text-sm font-medium rounded-2xl transition-all hover:opacity-80"
                style={{ color: "var(--text-4)", background: "var(--bg-input)", border: "1px solid var(--border)" }}
              >Read more</Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center lg:justify-start gap-3"
              style={{ animation: visible ? "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.90s both" : "none" }}>
              <div className="flex -space-x-2">
                {[0,1,2,3,4].map(n => (
                  <div key={n} className="w-7 h-7 rounded-full border-2 shrink-0"
                    style={{ background:`hsl(${n * 55 + 240}, 65%, 55%)`, borderColor: "var(--ring-bg)" }} />
                ))}
              </div>
              <p className="text-sm" style={{ color: "var(--text-5)" }}>
                <span className="font-semibold" style={{ color: "var(--text-2)" }}>12,400+</span> artists worldwide
              </p>
            </div>
          </div>

          {/* Card fan — desktop: side column; mobile: below text, scaled to fit */}
          <div className="relative w-full h-70 sm:h-85 lg:mt-0 lg:flex-1 lg:shrink-0 lg:h-130 lg:max-w-150">
            {/* Scale wrapper: 56% on mobile → 100% on lg */}
            <div
              className="absolute top-0 scale-[0.56] sm:scale-[0.68] origin-top lg:scale-100"
              style={{ left: "calc(50% - 310px)", width: 620, height: 520 }}
            >
              <div ref={fanRef} className="absolute inset-0" style={{ transformStyle:"preserve-3d", width:620, height:520 }}>

                {/* Badge left */}
                <div className="absolute z-30" style={{
                  left:"calc(50% - 238px)", top:28,
                  animation: visible ? "badge-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) 1.1s both, badge-bob 3s ease-in-out 2s infinite alternate" : "none",
                }}>
                  <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2"
                    style={{ background:"rgba(75,139,245,0.88)", backdropFilter:"blur(12px)", boxShadow:"0 4px 16px rgba(75,139,245,0.38)", color:"white" }}>
                    <div className="w-5 h-5 rounded-full shrink-0" style={{ background:"rgba(255,255,255,0.25)" }} />
                    <span className="text-sm font-semibold">@coplin</span>
                  </div>
                </div>

                {/* Badge right */}
                <div className="absolute z-30" style={{
                  right:"calc(50% - 272px)", top:36,
                  animation: visible ? "badge-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) 1.25s both, badge-bob 2.7s ease-in-out 2.15s infinite alternate" : "none",
                }}>
                  <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2"
                    style={{ background:"rgba(61,191,122,0.88)", backdropFilter:"blur(12px)", boxShadow:"0 4px 16px rgba(61,191,122,0.38)", color:"white" }}>
                    <div className="w-5 h-5 rounded-full shrink-0" style={{ background:"rgba(255,255,255,0.25)" }} />
                    <span className="text-sm font-semibold">@andrea</span>
                  </div>
                </div>

                {/* Cards */}
                {CARDS.map((card, i) => {
                  const isHov    = hoveredCard === i;
                  const fanDelay = `${0.08 + i * 0.09}s`;
                  const shadowBase  = "0 4px 10px rgba(0,0,0,0.35), 0 14px 32px rgba(0,0,0,0.45), 0 28px 56px rgba(0,0,0,0.30)";
                  const shadowHov   = "0 14px 32px rgba(0,0,0,0.55), 0 36px 68px rgba(54,30,123,0.42), 0 52px 100px rgba(0,0,0,0.40)";
                  const trBase  = visible ? `rotate(${card.rotate}deg) scale(1) translateY(0px)` : `rotate(0deg) scale(0.55) translateY(0px)`;
                  const trHov   = `rotate(${card.rotate}deg) scale(1.07) translateY(-28px)`;
                  const trEntry = visible ? `transform 0.88s ${SPRING_IN} ${fanDelay}, opacity 0.45s ease ${fanDelay}, box-shadow 0.3s ease` : "none";
                  const trStable = `transform 0.45s ${SPRING_HOVER}, box-shadow 0.35s ease`;

                  return (
                    <div key={card.seed} className="absolute" style={{
                      left:"calc(50% - 60px)", bottom:0,
                      zIndex: isHov ? 20 : CARD_Z[i],
                      animation: floating ? `card-float ${FLOAT_DUR[i]}s ease-in-out ${FLOAT_DEL[i]}s infinite alternate` : "none",
                    }}>
                      <div style={{ transform: visible ? `translateX(${card.x}px)` : "translateX(0px)", transition: visible ? `transform 0.88s ${SPRING_IN} ${fanDelay}` : "none" }}>
                        <div
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredCard(i)}
                          onMouseLeave={() => setHoveredCard(null)}
                          style={{
                            width:120, height:165, borderRadius:16, overflow:"hidden",
                            transformOrigin:"bottom center", opacity: visible ? 1 : 0,
                            transform: isHov ? trHov : trBase,
                            transition: phase === "appearing" ? trEntry : trStable,
                            boxShadow: isHov ? shadowHov : shadowBase,
                          }}
                        >
                          <Image
                            src={`https://picsum.photos/seed/${card.seed}/${card.w}/${card.h}`}
                            alt="Artwork" width={card.w} height={card.h}
                            className="w-full h-full object-cover"
                            style={{ transform: isHov ? "scale(1.08)" : "scale(1)", transition:"transform 0.55s ease-out" }}
                            priority={i < 3}
                          />
                          <div className="absolute inset-0 pointer-events-none" style={{
                            background: isHov ? "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 50%, transparent 100%)" : "transparent",
                            transition:"background 0.35s ease", borderRadius:16,
                          }} />
                          <div className="absolute inset-0 pointer-events-none"
                            style={{ boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.12)", borderRadius:16 }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </main>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ── Features sections ── */}
      <FeaturesHero />
      <StatsBar />
      <FeaturesGrid />
      <FeatureHighlight />

      {/* ── CTA ── */}
      <section className="relative z-10 py-24 px-6 md:px-10 text-center overflow-hidden"
        style={{ borderTop: "1px solid rgba(124,91,245,0.10)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(54,30,123,0.18) 0%, transparent 70%)" }} />
        <div className="relative max-w-2xl mx-auto">
          <RevealWords text="Ready to share your" baseDelay={0} stagger={0.07}
            className="block font-black mb-1" style={{ fontSize: "clamp(28px, 4.5vw, 60px)", color: "var(--text-1)" }} />
          <RevealWords text="masterpiece?" baseDelay={0.35} stagger={0.09}
            className="block font-black mb-6" style={{ fontSize: "clamp(28px, 4.5vw, 60px)", background: "linear-gradient(90deg,#9B7CF5,#F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }} />
          <RevealFade delay={0.6}>
            <p className="text-base mb-8" style={{ color: "var(--text-4)" }}>
              Join 12,400+ artists already building their creative careers on Ortist.
            </p>
            <Link href="/login"
              className="inline-flex items-center px-8 py-4 rounded-2xl text-white font-bold text-base transition-all hover:scale-[1.04] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #361E7B, #7C5BF5)", boxShadow: "0 8px 32px rgba(54,30,123,0.45)" }}>
              Get started free →
            </Link>
          </RevealFade>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 w-full"
        style={{ borderTop: "1px solid rgba(124,91,245,0.15)", background: "rgba(10,6,28,0.7)", backdropFilter: "blur(20px)" }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
          {/* Top row */}
          <div className="flex flex-col md:flex-row gap-10 md:gap-0 justify-between mb-10">

            {/* Brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/login-image/ortists logo1.png" alt="Ortist" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-lg font-black" style={{ background: "linear-gradient(90deg,#9B7CF5,#F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Ortist
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-5)" }}>
                A social platform for artists to showcase their masterpieces, connect with buyers, and grow their creative careers.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="font-semibold mb-3" style={{ color: "var(--text-2)" }}>Platform</p>
                <ul className="flex flex-col gap-2">
                  {[["Feed", "/feed"], ["Explore", "/explore"], ["Marketplace", "/marketplace"], ["Hiring", "/hiring"]].map(([l, h]) => (
                    <li key={l}><Link href={h} className="transition-opacity hover:opacity-70" style={{ color: "var(--text-5)" }}>{l}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-3" style={{ color: "var(--text-2)" }}>Company</p>
                <ul className="flex flex-col gap-2">
                  {[["About", "#"], ["Blog", "#"], ["Careers", "#"], ["Press", "#"]].map(([l, h]) => (
                    <li key={l}><Link href={h} className="transition-opacity hover:opacity-70" style={{ color: "var(--text-5)" }}>{l}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-3" style={{ color: "var(--text-2)" }}>Legal</p>
                <ul className="flex flex-col gap-2">
                  {[["Privacy Policy", "#"], ["Terms of Service", "#"], ["Cookie Policy", "#"], ["DMCA", "#"]].map(([l, h]) => (
                    <li key={l}><Link href={h} className="transition-opacity hover:opacity-70" style={{ color: "var(--text-5)" }}>{l}</Link></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid rgba(124,91,245,0.12)" }} className="mb-6" />

          {/* Bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs" style={{ color: "var(--text-5)" }}>
              © {new Date().getFullYear()} Ortist. All rights reserved.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-4">
              {[
                { label: "Twitter / X", svg: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /> },
                { label: "Instagram",   svg: <><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></> },
                { label: "LinkedIn",    svg: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></> },
              ].map(({ label, svg }) => (
                <a key={label} href="#" aria-label={label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                  style={{ background: "rgba(124,91,245,0.12)", border: "1px solid rgba(124,91,245,0.2)", color: "var(--text-4)" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {svg}
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
