"use client";

import Link from "next/link";
import { ArrowRight, Briefcase, CheckCircle2, Layers } from "lucide-react";
import { useReveal } from "./revealUtils";

/* ── Portfolio mockup ── */
function PortfolioMockup() {
  const POSTS = [
    { seed: "urban-mural",   h: 120 },
    { seed: "ink-portrait",  h: 90  },
    { seed: "watercolor-sky",h: 140 },
    { seed: "abstract-oil",  h: 100 },
  ];
  return (
    <div
      className="w-full rounded-2xl overflow-hidden p-4"
      style={{
        background: "rgba(14,8,36,0.85)",
        border: "1px solid rgba(124,91,245,0.18)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
      }}
    >
      {/* Fake header */}
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(124,91,245,0.12)" }}>
        <div className="w-7 h-7 rounded-full" style={{ background: "rgba(124,91,245,0.3)" }} />
        <div>
          <div className="h-2.5 w-24 rounded-full mb-1" style={{ background: "rgba(255,255,255,0.15)" }} />
          <div className="h-2 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        </div>
        <div className="ml-auto flex gap-1.5">
          {["rgba(124,91,245,0.5)", "rgba(245,158,11,0.4)", "rgba(239,68,68,0.3)"].map((c, i) => (
            <div key={i} className="h-2 w-10 rounded-full" style={{ background: c }} />
          ))}
        </div>
      </div>

      {/* Masonry grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {POSTS.map(({ seed, h }, i) => (
          <div key={seed} className="rounded-xl overflow-hidden" style={{ height: h, background: "rgba(124,91,245,0.08)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://picsum.photos/seed/hi${seed}/260/${h}`}
              alt=""
              className="w-full h-full object-cover"
              style={{ opacity: 0.7 }}
            />
          </div>
        ))}
      </div>

      {/* Fake stat row */}
      <div className="flex items-center gap-4 mt-4 pt-3" style={{ borderTop: "1px solid rgba(124,91,245,0.10)" }}>
        {[["2.4K", "Followers"], ["148", "Artworks"], ["$4.2K", "Earned"]].map(([v, l]) => (
          <div key={l} className="text-center flex-1">
            <p className="text-sm font-black" style={{ color: "#9B7CF5" }}>{v}</p>
            <p className="text-[10px]" style={{ color: "var(--text-6)" }}>{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Commission mockup ── */
function CommissionMockup() {
  const REQUESTS = [
    { client: "Sarah M.",  project: "Logo Redesign",     budget: "$400–600",  status: "new" },
    { client: "Dev Corp",  project: "Brand Illustration", budget: "$800–1,200", status: "active" },
    { client: "James K.",  project: "Portrait Commission", budget: "$200–350", status: "review" },
  ];
  const STATUS_COLORS: Record<string, string> = {
    new: "rgba(124,91,245,0.6)", active: "rgba(61,191,122,0.6)", review: "rgba(245,158,11,0.6)",
  };
  return (
    <div
      className="w-full rounded-2xl overflow-hidden p-4"
      style={{
        background: "rgba(14,8,36,0.85)",
        border: "1px solid rgba(124,91,245,0.18)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(124,91,245,0.12)" }}>
        <Briefcase size={16} color="#9B7CF5" />
        <span className="text-sm font-bold" style={{ color: "var(--text-1)" }}>Commission Inbox</span>
        <div className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: "rgba(124,91,245,0.25)", color: "#9B7CF5" }}>3 new</div>
      </div>

      <div className="flex flex-col gap-3">
        {REQUESTS.map(({ client, project, budget, status }) => (
          <div key={project} className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "rgba(124,91,245,0.06)", border: "1px solid rgba(124,91,245,0.10)" }}>
            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
              style={{ background: "rgba(124,91,245,0.2)", color: "#9B7CF5" }}>
              {client[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "var(--text-1)" }}>{project}</p>
              <p className="text-[10px]" style={{ color: "var(--text-5)" }}>{client} · {budget}</p>
            </div>
            <div className="h-2 w-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[status] }} />
          </div>
        ))}
      </div>

      {/* Accept button mock */}
      <div className="mt-4 h-9 rounded-xl flex items-center justify-center text-xs font-semibold"
        style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", color: "#fff" }}>
        Review Requests
      </div>
    </div>
  );
}

/* ── One highlight row ── */
function HighlightRow({
  flip, badge, heading, headingAccent, description, bullets, ctaText, ctaHref, mockup, delay,
}: {
  flip?: boolean;
  badge: string;
  heading: string;
  headingAccent: string;
  description: string;
  bullets: string[];
  ctaText: string;
  ctaHref: string;
  mockup: React.ReactNode;
  delay?: number;
}) {
  const { ref: textRef, revealed: textRevealed } = useReveal(0.2);
  const { ref: mockRef, revealed: mockRevealed } = useReveal(0.2);

  const textCol = (
    <div ref={textRef} style={{
      opacity: textRevealed ? 1 : 0,
      transform: textRevealed ? "translateX(0)" : flip ? "translateX(32px)" : "translateX(-32px)",
      transition: textRevealed
        ? `opacity 0.7s ease ${(delay ?? 0)}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${(delay ?? 0)}s`
        : "none",
    }}>
      {/* Badge */}
      <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full text-xs font-semibold"
        style={{ background: "rgba(54,30,123,0.30)", border: "1px solid rgba(124,91,245,0.30)", color: "rgba(255,255,255,0.7)" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#7C5BF5" }} />
        {badge}
      </div>

      <h3 className="font-black leading-[1.1] mb-4" style={{ fontSize: "clamp(26px, 3.5vw, 48px)", color: "var(--text-1)" }}>
        {heading}{" "}
        <span style={{
          background: "linear-gradient(135deg,#9B7CF5,#F59E0B)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          {headingAccent}
        </span>
      </h3>

      <p className="text-base leading-relaxed mb-6" style={{ color: "var(--text-4)" }}>{description}</p>

      <ul className="flex flex-col gap-2.5 mb-8">
        {bullets.map(b => (
          <li key={b} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-3)" }}>
            <CheckCircle2 size={15} color="#7C5BF5" className="shrink-0" />
            {b}
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.03] active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", boxShadow: "0 6px 24px rgba(54,30,123,0.4)" }}
      >
        {ctaText}
        <ArrowRight size={15} />
      </Link>
    </div>
  );

  const mockCol = (
    <div ref={mockRef} style={{
      opacity: mockRevealed ? 1 : 0,
      transform: mockRevealed ? "translateY(0)" : "translateY(36px)",
      transition: mockRevealed
        ? `opacity 0.7s ease ${(delay ?? 0) + 0.15}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${(delay ?? 0) + 0.15}s`
        : "none",
    }}>
      {mockup}
    </div>
  );

  return (
    <div className={`flex flex-col ${flip ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 lg:gap-16`}>
      <div className="flex-1">{textCol}</div>
      <div className="flex-1 w-full">{mockCol}</div>
    </div>
  );
}

export default function FeatureHighlight() {
  return (
    <section className="relative z-10 py-24 md:py-32 px-6 md:px-10 overflow-hidden">
      {/* Divider top */}
      <div style={{ borderTop: "1px solid rgba(124,91,245,0.08)" }} />

      <div className="max-w-6xl mx-auto flex flex-col gap-28 md:gap-36">
        {/* Row 1: Portfolio */}
        <HighlightRow
          badge="Portfolio"
          heading="Showcase your art"
          headingAccent="to thousands."
          description="Your gallery is your brand. Ortist gives every artist a beautiful, auto-organised masonry portfolio that buyers and collectors actively browse every day."
          bullets={[
            "Auto-arranged masonry layout — no design work needed",
            "Tags, captions, and categories for maximum discovery",
            "Real-time view and engagement analytics",
          ]}
          ctaText="Build your portfolio"
          ctaHref="/login"
          mockup={<PortfolioMockup />}
        />

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(124,91,245,0.06)" }} />

        {/* Row 2: Commissions (flipped) */}
        <HighlightRow
          flip
          badge="Commissions"
          heading="Turn your art"
          headingAccent="into income."
          description="Clients discover your work, send a brief, and you agree on scope and price — all inside Ortist. No third-party platforms, no lost messages."
          bullets={[
            "Structured commission requests with budget ranges",
            "Built-in messaging thread per project",
            "Hire flow visible directly on your posts",
          ]}
          ctaText="Start accepting commissions"
          ctaHref="/login"
          mockup={<CommissionMockup />}
          delay={0}
        />
      </div>
    </section>
  );
}
