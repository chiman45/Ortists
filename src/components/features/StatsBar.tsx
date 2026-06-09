"use client";

import { useReveal } from "./revealUtils";

const STATS = [
  { num: "12,400+", label: "Artists worldwide",   sub: "and growing daily" },
  { num: "50,000+", label: "Artworks shared",     sub: "across all categories" },
  { num: "8,200+",  label: "Commissions placed",  sub: "directly on platform" },
  { num: "98%",     label: "Satisfaction rate",   sub: "from client reviews" },
];

export default function StatsBar() {
  const { ref, revealed } = useReveal(0.15);

  return (
    <section
      className="relative z-10 py-14 px-6 md:px-10"
      style={{
        borderTop: "1px solid rgba(124,91,245,0.08)",
        borderBottom: "1px solid rgba(124,91,245,0.08)",
        background: "rgba(124,91,245,0.03)",
      }}
    >
      <div ref={ref} className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {STATS.map(({ num, label, sub }, i) => (
            <div
              key={label}
              className="px-6 py-4 text-center"
              style={{
                borderRight: i < STATS.length - 1 ? "1px solid rgba(124,91,245,0.12)" : "none",
                opacity: revealed ? 1 : 0,
                transform: revealed ? "translateY(0)" : "translateY(20px)",
                transition: revealed
                  ? `opacity 0.6s ease ${i * 0.12}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s`
                  : "none",
              }}
            >
              <p
                className="text-4xl md:text-5xl font-black mb-1"
                style={{
                  background: "linear-gradient(135deg,#9B7CF5,#F59E0B)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {num}
              </p>
              <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-2)" }}>{label}</p>
              <p className="text-xs" style={{ color: "var(--text-6)" }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
