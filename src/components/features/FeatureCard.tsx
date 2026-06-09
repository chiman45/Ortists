"use client";

import { LucideIcon } from "lucide-react";
import { useState } from "react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  featured?: boolean;
  accentColor?: string;
  revealed?: boolean;
  delay?: number;
  children?: React.ReactNode;
}

export default function FeatureCard({
  icon: Icon, title, description, featured = false,
  accentColor = "#7C5BF5", revealed = true, delay = 0, children,
}: FeatureCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={featured ? "sm:col-span-2" : ""}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(32px)",
        transition: revealed
          ? `opacity 0.65s ease ${delay}s, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}s, box-shadow 0.3s ease, border-color 0.3s ease`
          : "none",
      }}
    >
      <div
        className="h-full p-6 rounded-2xl flex flex-col gap-4 cursor-default"
        style={{
          background: hovered
            ? "rgba(124,91,245,0.10)"
            : "rgba(255,255,255,0.025)",
          border: hovered
            ? `1px solid rgba(124,91,245,0.45)`
            : "1px solid rgba(255,255,255,0.06)",
          boxShadow: hovered
            ? `0 0 32px rgba(124,91,245,0.12), 0 8px 32px rgba(0,0,0,0.3)`
            : "0 2px 8px rgba(0,0,0,0.2)",
          transition: "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
          transform: hovered ? "scale(1.015)" : "scale(1)",
          borderRadius: 18,
        }}
      >
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: hovered
              ? `rgba(124,91,245,0.25)`
              : "rgba(124,91,245,0.12)",
            border: "1px solid rgba(124,91,245,0.2)",
            transition: "background 0.3s ease",
          }}
        >
          <Icon size={22} color={accentColor} />
        </div>

        {/* Text */}
        <div className="flex-1">
          <p className="font-bold text-base mb-1.5" style={{ color: "var(--text-1)" }}>{title}</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-5)" }}>{description}</p>
        </div>

        {/* Optional extra content for featured card */}
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}
