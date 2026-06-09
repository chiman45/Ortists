"use client";

import { Briefcase, Heart, Layers, MessageSquare, ShoppingBag, Sparkles } from "lucide-react";
import { useReveal } from "./revealUtils";
import FeatureCard from "./FeatureCard";

const FEATURES = [
  {
    icon: Layers,
    title: "Portfolio Showcase",
    description:
      "Publish your artwork in a stunning masonry gallery. Reach thousands of buyers, collectors, and collaborators who actively browse for new talent.",
    featured: true,
  },
  {
    icon: Briefcase,
    title: "Commission Requests",
    description:
      "Receive and manage custom work requests directly from clients who love your style. Built-in project flow from brief to delivery.",
    featured: false,
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    description:
      "Sell prints, originals, and digital assets with zero friction. Instant payouts directly to your wallet.",
    featured: false,
  },
  {
    icon: MessageSquare,
    title: "Direct Messaging",
    description:
      "Chat with clients, collaborators, and fans. Keep all your project conversations in one organised inbox.",
    featured: false,
  },
  {
    icon: Heart,
    title: "Stories & Updates",
    description:
      "Share 24-hour creative updates, WIP shots, and behind-the-scenes moments that keep your audience engaged.",
    featured: false,
  },
  {
    icon: Sparkles,
    title: "Smart Discovery",
    description:
      "Our feed learns your taste over time, surfacing art that genuinely resonates — powered by real engagement signals.",
    featured: false,
  },
];

function SectionHeading({ revealed }: { revealed: boolean }) {
  const words1 = "Built for the".split(" ");
  const words2 = "modern creative.".split(" ");

  return (
    <div className="text-center mb-14">
      <h2 className="font-black leading-[1.08]" style={{ fontSize: "clamp(28px, 4.5vw, 60px)", color: "var(--text-1)" }}>
        <span className="block mb-1">
          {words1.map((w, i) => (
            <span key={i} className="word-clip">
              <span style={{
                display: "inline-block",
                animation: revealed ? `word-up 0.65s cubic-bezier(0.22,1,0.36,1) ${0.05 + i * 0.07}s both` : "none",
                opacity: revealed ? undefined : 0,
              }}>{w}</span>
              {i < words1.length - 1 ? " " : ""}
            </span>
          ))}
        </span>
        <span className="block" style={{
          background: "linear-gradient(135deg,#9B7CF5 0%,#F59E0B 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          {words2.map((w, i) => (
            <span key={i} className="word-clip">
              <span style={{
                display: "inline-block",
                animation: revealed ? `word-up 0.65s cubic-bezier(0.22,1,0.36,1) ${0.3 + i * 0.08}s both` : "none",
                opacity: revealed ? undefined : 0,
              }}>{w}</span>
              {i < words2.length - 1 ? " " : ""}
            </span>
          ))}
        </span>
      </h2>
    </div>
  );
}

/* Featured card preview: mini artwork thumbnails */
function PortfolioMockup() {
  const SEEDS = ["mural1", "sketch2", "portrait3", "abstract4", "watercolor5", "ink6"];
  const HEIGHTS = [110, 80, 130, 90, 115, 85];
  return (
    <div className="flex gap-2 mt-2 overflow-hidden rounded-xl" style={{ maxHeight: 140 }}>
      {SEEDS.slice(0, 4).map((s, i) => (
        <div
          key={s}
          className="flex-1 rounded-lg overflow-hidden shrink-0"
          style={{ height: HEIGHTS[i], background: "rgba(124,91,245,0.1)", border: "1px solid rgba(124,91,245,0.15)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://picsum.photos/seed/ortfeat${s}/120/${HEIGHTS[i]}`}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.75 }}
          />
        </div>
      ))}
    </div>
  );
}

export default function FeaturesGrid() {
  const { ref, revealed } = useReveal(0.1);

  return (
    <section className="relative z-10 py-24 md:py-32 px-6 md:px-10 overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(54,30,123,0.10) 0%, transparent 70%)",
      }} />

      <div ref={ref} className="relative max-w-6xl mx-auto">
        <SectionHeading revealed={revealed} />

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feat, i) => (
            <FeatureCard
              key={feat.title}
              icon={feat.icon}
              title={feat.title}
              description={feat.description}
              featured={feat.featured}
              revealed={revealed}
              delay={i * 0.09}
            >
              {/* Featured card gets a mockup preview */}
              {feat.featured && i === 0 ? <PortfolioMockup /> : null}
            </FeatureCard>
          ))}
        </div>
      </div>
    </section>
  );
}
