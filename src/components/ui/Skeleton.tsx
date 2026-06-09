import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({
  width = "100%",
  height = 16,
  radius = 8,
  className = "",
  style = {},
}: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius: radius,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/* Convenience wrappers */
export function SkeletonCircle({ size = 40, className = "" }: { size?: number; className?: string }) {
  return <Skeleton width={size} height={size} radius={9999} className={className} />;
}

export function SkeletonText({ lines = 2, lastWidth = "60%", gap = 8 }: {
  lines?: number; lastWidth?: string; gap?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          radius={6}
          width={i === lines - 1 ? lastWidth : "100%"}
        />
      ))}
    </div>
  );
}
