"use client";

import React from "react";
import { useReveal } from "./revealUtils";

function WordReveal({ text, baseDelay = 0, stagger = 0.07, style = {} }: {
  text: string; baseDelay?: number; stagger?: number; style?: React.CSSProperties;
}) {
  const { ref, revealed } = useReveal(0.3);
  const words = text.split(" ");
  return (
    <span ref={ref} style={style}>
      {words.map((word, i) => (
        <span key={i} className="word-clip">
          <span style={{
            display: "inline-block",
            animation: revealed ? `word-up 0.7s cubic-bezier(0.22,1,0.36,1) ${baseDelay + i * stagger}s both` : "none",
            opacity: revealed ? undefined : 0,
          }}>
            {word}
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

function FadeLine({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, revealed } = useReveal(0.2);
  return (
    <div ref={ref} style={{
      opacity: revealed ? 1 : 0,
      transform: revealed ? "translateY(0)" : "translateY(24px)",
      transition: revealed ? `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s` : "none",
    }}>
      {children}
    </div>
  );
}

export default function FeaturesHero() {
  return (
    <section
      className="relative z-10 py-28 md:py-40 px-6 md:px-10 overflow-hidden"
      style={{ borderTop: "1px solid rgba(124,91,245,0.10)" }}
    >
      {/* Dot-grid background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(rgba(124,91,245,0.18) 1px, transparent 1px)",
        backgroundSize: "30px 30px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 80%)",
      }} />

      {/* Glow blob */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(54,30,123,0.18) 0%, transparent 70%)",
      }} />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <FadeLine delay={0}>
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-xs font-semibold" style={{
            background: "rgba(54,30,123,0.30)",
            border: "1px solid rgba(124,91,245,0.30)",
            color: "rgba(255,255,255,0.70)",
          }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#7C5BF5" }} />
            Platform Features
          </div>
        </FadeLine>

        {/* Heading */}
        <h2 className="font-black leading-[1.06] mb-6" style={{ fontSize: "clamp(38px, 6vw, 80px)", color: "var(--text-1)" }}>
          <span className="block mb-1">
            <WordReveal text="Everything artists" baseDelay={0.1} stagger={0.07} />
          </span>
          <span className="block" style={{
            background: "linear-gradient(135deg, #9B7CF5 0%, #F59E0B 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            <WordReveal text="need to thrive." baseDelay={0.3} stagger={0.08} />
          </span>
        </h2>

        {/* Sub */}
        <FadeLine delay={0.55}>
          <p className="text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: "var(--text-4)" }}>
            Ortist gives you a full creative career toolkit — from portfolio to commissions, marketplace to messaging — all in one beautifully dark canvas.
          </p>
        </FadeLine>
      </div>
    </section>
  );
}
