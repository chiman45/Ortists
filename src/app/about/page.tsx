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
  ["About",       "/about"],
] as const;

const VALUES = [
  {
    label: "Authenticity",
    color: ACCENT,
    desc: "We believe art is most powerful when it's honest. Every feature is built to let creators share their real voice, unfiltered.",
    icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  },
  {
    label: "Community",
    color: GOLD,
    desc: "Great art doesn't happen in isolation. Ortist connects artists with collectors, collaborators, and clients worldwide.",
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  },
  {
    label: "Opportunity",
    color: ACCENT,
    desc: "Every artist deserves a fair shot. We build tools that turn creative talent into real income — commissions, sales, and careers.",
    icon: "M12 20V10M18 20V4M6 20v-4",
  },
  {
    label: "Excellence",
    color: GOLD,
    desc: "We hold ourselves to the same standard we hold art — obsessing over every detail until it's right.",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
];

const TEAM = [
  { name: "Ava Torres",    role: "Co-founder & CEO",     seed: "team-ava-1"   },
  { name: "Elias Park",    role: "Co-founder & CTO",     seed: "team-elias-2" },
  { name: "Nadia Osei",    role: "Head of Design",       seed: "team-nadia-3" },
  { name: "Marco Ricci",   role: "Head of Community",    seed: "team-marco-4" },
];

const MILESTONES = [
  { year: "2021", event: "Founded in a studio apartment with 3 artists and a shared dream." },
  { year: "2022", event: "Launched beta to 500 artists. First commission paid on the platform." },
  { year: "2023", event: "Crossed 10,000 artists. Introduced the Marketplace and Hiring board." },
  { year: "2024", event: "12,400+ creators. $2M+ in commissions facilitated. Series A closed." },
];

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

function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />;
}

export default function AboutPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 70);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ background: BG, color: "#fff", overflowX: "hidden" }}>

      {/* NAV */}
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
            <Link
              key={label}
              href={href}
              className="transition-colors duration-200 hover:text-white"
              style={{ color: label === "About" ? "#fff" : MUTED }}
            >
              {label}
            </Link>
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

      {/* HERO */}
      <section className="relative w-full flex items-end" style={{ minHeight: "92svh", paddingTop: 120 }}>
        {/* Background image */}
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://picsum.photos/seed/about-hero-studio/1920/1200"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(0.22) saturate(0.12)" }}
          />
          <div className="absolute inset-0" style={{
            background: `linear-gradient(to bottom, rgba(5,5,5,0.3) 0%, rgba(5,5,5,0.65) 60%, ${BG} 100%)`,
          }} />
        </div>

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-8 md:px-14 lg:px-20 pb-28 md:pb-40">
          <p className="text-[11px] font-semibold tracking-[0.32em] uppercase mb-7" style={{ color: GOLD }}>
            ✦ &nbsp;Our Story
          </p>
          <h1
            className={`${playfair.className} mb-8 leading-[1.05]`}
            style={{ fontSize: "clamp(48px, 7vw, 96px)", fontWeight: 700, maxWidth: 820 }}
          >
            Built for Artists.<br />
            <em style={{ color: ACCENT, fontStyle: "italic" }}>By Artists.</em>
          </h1>
          <p
            className="text-[18px] leading-[1.85]"
            style={{ color: "rgba(255,255,255,0.48)", maxWidth: 480 }}
          >
            Ortist was born from a simple frustration — talented creators with no platform worthy of their work. We built the one we always wished existed.
          </p>
        </div>
      </section>

      {/* MISSION */}
      <section className="py-28 md:py-44 px-8 md:px-14 lg:px-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-center">

          <RevealFade>
            <div className="relative overflow-hidden" style={{ borderRadius: 3, aspectRatio: "4/5" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://picsum.photos/seed/about-mission-studio/800/1000"
                alt="Our mission"
                className="w-full h-full object-cover transition-transform duration-1000 hover:scale-[1.04]"
              />
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "linear-gradient(to top, rgba(5,5,5,0.6) 0%, transparent 50%)",
              }} />
            </div>
          </RevealFade>

          <RevealFade delay={0.18}>
            <p className="text-[11px] font-semibold tracking-[0.26em] uppercase mb-6" style={{ color: ACCENT }}>
              01 — Mission
            </p>
            <h2
              className={`${playfair.className} mb-8 leading-[1.08]`}
              style={{ fontSize: "clamp(34px, 4.2vw, 58px)", fontWeight: 700 }}
            >
              A Platform That<br />Respects the Craft
            </h2>
            <p className="text-[17px] leading-[1.85] mb-6" style={{ color: MUTED }}>
              Too many platforms treat art as content. We treat it as craft. Ortist is designed to give every creator the tools, audience, and income they deserve — without algorithmic noise drowning out the work.
            </p>
            <p className="text-[17px] leading-[1.85]" style={{ color: MUTED }}>
              From painters to photographers, illustrators to sculptors — if you make things, Ortist was built for you.
            </p>
          </RevealFade>
        </div>
      </section>

      <Divider />

      {/* TIMELINE */}
      <section className="py-28 md:py-44 px-8 md:px-14 lg:px-20" style={{ background: SURF }}>
        <div className="max-w-7xl mx-auto">

          <RevealFade className="mb-20">
            <p className="text-[11px] font-semibold tracking-[0.26em] uppercase mb-6" style={{ color: GOLD }}>
              02 — History
            </p>
            <h2
              className={`${playfair.className} leading-[1.08]`}
              style={{ fontSize: "clamp(34px, 4.2vw, 58px)", fontWeight: 700 }}
            >
              How We Got Here
            </h2>
          </RevealFade>

          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-0 top-0 bottom-0 w-px hidden md:block"
              style={{ background: "rgba(255,255,255,0.07)" }}
            />

            <div className="flex flex-col gap-0">
              {MILESTONES.map((m, i) => (
                <RevealFade key={m.year} delay={i * 0.1}>
                  <div className="md:pl-14 py-10 md:py-12 relative" style={{
                    borderBottom: i < MILESTONES.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  }}>
                    {/* dot */}
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full hidden md:block"
                      style={{ background: i % 2 === 0 ? ACCENT : GOLD }}
                    />
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-12">
                      <span
                        className={`${playfair.className} font-black shrink-0`}
                        style={{ fontSize: "clamp(28px, 3vw, 44px)", color: i % 2 === 0 ? ACCENT : GOLD, minWidth: 88 }}
                      >
                        {m.year}
                      </span>
                      <p className="text-[17px] leading-[1.75]" style={{ color: MUTED, maxWidth: 540 }}>
                        {m.event}
                      </p>
                    </div>
                  </div>
                </RevealFade>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* VALUES */}
      <section className="py-28 md:py-44 px-8 md:px-14 lg:px-20">
        <div className="max-w-7xl mx-auto">

          <RevealFade className="mb-20">
            <p className="text-[11px] font-semibold tracking-[0.26em] uppercase mb-6" style={{ color: ACCENT }}>
              03 — Values
            </p>
            <h2
              className={`${playfair.className} leading-[1.08]`}
              style={{ fontSize: "clamp(34px, 4.2vw, 58px)", fontWeight: 700 }}
            >
              What We Stand For
            </h2>
          </RevealFade>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: "rgba(255,255,255,0.05)" }}>
            {VALUES.map((v, i) => (
              <RevealFade key={v.label} delay={i * 0.1}>
                <div
                  className="p-10 md:p-14 flex flex-col gap-6 group"
                  style={{ background: BG }}
                >
                  <div
                    className="w-11 h-11 flex items-center justify-center rounded-full shrink-0"
                    style={{ background: `${v.color}14`, border: `1px solid ${v.color}30` }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke={v.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={v.icon} />
                    </svg>
                  </div>
                  <p
                    className={`${playfair.className} font-bold`}
                    style={{ fontSize: "clamp(22px, 2.2vw, 30px)", color: v.color }}
                  >
                    {v.label}
                  </p>
                  <p className="text-[16px] leading-[1.85]" style={{ color: MUTED }}>
                    {v.desc}
                  </p>
                </div>
              </RevealFade>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* TEAM */}
      <section className="py-28 md:py-44 px-8 md:px-14 lg:px-20" style={{ background: SURF }}>
        <div className="max-w-7xl mx-auto">

          <RevealFade className="mb-20">
            <p className="text-[11px] font-semibold tracking-[0.26em] uppercase mb-6" style={{ color: GOLD }}>
              04 — People
            </p>
            <h2
              className={`${playfair.className} leading-[1.08]`}
              style={{ fontSize: "clamp(34px, 4.2vw, 58px)", fontWeight: 700 }}
            >
              The Team
            </h2>
          </RevealFade>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TEAM.map((member, i) => (
              <RevealFade key={member.name} delay={i * 0.08}>
                <div className="group cursor-pointer">
                  <div
                    className="relative overflow-hidden mb-5"
                    style={{ borderRadius: 3, aspectRatio: "3/4" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://picsum.photos/seed/${member.seed}/480/640`}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                      style={{ filter: "grayscale(25%)" }}
                    />
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: "linear-gradient(to top, rgba(5,5,5,0.7) 0%, transparent 50%)",
                    }} />
                  </div>
                  <p className="text-[15px] font-semibold text-white mb-1">{member.name}</p>
                  <p className="text-[12px] font-medium tracking-wide" style={{ color: MUTED }}>{member.role}</p>
                </div>
              </RevealFade>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* CTA */}
      <section
        className="relative py-32 md:py-52 px-8 md:px-14 lg:px-20 overflow-hidden text-center"
        style={{ background: BG }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 50%, ${ACCENT}12 0%, transparent 70%)`,
        }} />

        <div className="relative max-w-3xl mx-auto">
          <RevealFade>
            <p className="text-[11px] font-semibold tracking-[0.32em] uppercase mb-7" style={{ color: MUTED }}>
              ✦ &nbsp;Join Us
            </p>
            <h2
              className={`${playfair.className} mb-8 leading-[1.06]`}
              style={{ fontSize: "clamp(40px, 5.5vw, 74px)", fontWeight: 700 }}
            >
              Your art deserves<br />
              <em style={{ color: ACCENT, fontStyle: "italic" }}>a real home.</em>
            </h2>
            <p className="text-[17px] leading-[1.85] mb-12" style={{ color: MUTED }}>
              Join 12,400+ artists already building their presence on Ortist.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/login"
                className="inline-flex items-center px-9 py-4 rounded-full text-sm font-bold text-white transition-all duration-300 hover:scale-[1.04]"
                style={{ background: ACCENT, boxShadow: `0 0 44px ${ACCENT}48` }}
              >
                Start for Free
              </Link>
              <Link
                href="/feed"
                className="inline-flex items-center px-9 py-4 rounded-full text-sm font-semibold transition-all duration-300 hover:bg-white/8"
                style={{ border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.7)" }}
              >
                Explore the Feed
              </Link>
            </div>
          </RevealFade>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="relative pt-28 md:pt-36 pb-10 px-8 md:px-14 lg:px-20 overflow-hidden"
        style={{ background: "#08080C", borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-7xl mx-auto">
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

          <RevealFade delay={0.1}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/login-image/ortists logo1.png" alt="Ortist" className="w-7 h-7 rounded-md object-cover" />
                  <span className="font-bold text-white text-[15px]">Ortist</span>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: MUTED, maxWidth: 220 }}>
                  A creative ecosystem for artists to showcase, connect, and thrive.
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold tracking-[0.22em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.22)" }}>Platform</p>
                <ul className="flex flex-col gap-3">
                  {[["Feed", "/feed"], ["Marketplace", "/marketplace"], ["Hiring", "/hiring"], ["Artists", "/hiring"]].map(([l, h]) => (
                    <li key={l}>
                      <Link href={h} className="text-[13px] transition-colors duration-200 hover:text-white" style={{ color: MUTED }}>{l}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[11px] font-bold tracking-[0.22em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.22)" }}>Company</p>
                <ul className="flex flex-col gap-3">
                  {[["About", "/about"], ["Blog", "#"], ["Careers", "#"], ["Press", "#"]].map(([l, h]) => (
                    <li key={l}>
                      <Link href={h} className="text-[13px] transition-colors duration-200 hover:text-white" style={{ color: l === "About" ? "#fff" : MUTED }}>{l}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[11px] font-bold tracking-[0.22em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.22)" }}>Legal</p>
                <ul className="flex flex-col gap-3">
                  {[["Privacy Policy", "#"], ["Terms of Service", "#"], ["Cookie Policy", "#"]].map(([l, h]) => (
                    <li key={l}>
                      <Link href={h} className="text-[13px] transition-colors duration-200 hover:text-white" style={{ color: MUTED }}>{l}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </RevealFade>

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
