"use client";

import { useState } from "react";
import { parseDimensions } from "@/lib/dimensions";

/**
 * "See it on your wall" mockup: the artwork composited onto a room scene and
 * scaled to its real-world dimensions, Amazon-style.
 *
 * The scene is a drawn SVG room with a 213 cm (84") sofa as the scale reference.
 * To swap in the client's purchased wall photo: set ROOM.photo to its URL and
 * re-calibrate the numbers below against that photo.
 */
const ROOM = {
  photo: null as string | null,
  // Real-world size of the area the scene covers (edge to edge)
  wallWidthCm:  400,
  wallHeightCm: 280,
  // Where artwork hangs: horizontal centre and bottom edge, as % of the scene
  hangCenterX:  50,
  hangBottomY:  46.8, // 20 cm above the sofa back
};

const SOFA_CM = 213;

function RoomScene() {
  // 1600 × 1120 viewBox ↔ 400 × 280 cm, so 4 px = 1 cm. Floor line at 230 cm.
  const sofaW = SOFA_CM * 4;
  const sofaX = 800 - sofaW / 2;
  const floorY = 920;
  const cushionW = (sofaW - 80) / 3;
  return (
    <svg viewBox="0 0 1600 1120" className="absolute inset-0 w-full h-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="wp-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efeae2" />
          <stop offset="1" stopColor="#e3dcd1" />
        </linearGradient>
        <linearGradient id="wp-light" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="wp-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cdbba5" />
          <stop offset="1" stopColor="#b59e84" />
        </linearGradient>
        <linearGradient id="wp-sofa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3f0ea" />
          <stop offset="1" stopColor="#d8d2c8" />
        </linearGradient>
        <filter id="wp-soft" x="-10%" y="-10%" width="120%" height="140%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* wall + window light */}
      <rect width="1600" height={floorY} fill="url(#wp-wall)" />
      <rect width="1600" height={floorY} fill="url(#wp-light)" />
      {/* skirting + floor */}
      <rect y={floorY - 24} width="1600" height="24" fill="#f6f3ee" />
      <rect y={floorY} width="1600" height={1120 - floorY} fill="url(#wp-floor)" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <line key={i} x1={i * 230 - 80} y1={floorY} x2={i * 230 + 60} y2="1120" stroke="#a88f74" strokeOpacity="0.25" strokeWidth="2" />
      ))}

      {/* sofa: ~80 cm tall, 45 cm seat height */}
      <ellipse cx="800" cy={floorY + 6} rx={sofaW / 2 + 40} ry="34" fill="#000" fillOpacity="0.18" filter="url(#wp-soft)" />
      <rect x={sofaX} y="604" width={sofaW} height="260" rx="30" fill="url(#wp-sofa)" />
      <rect x={sofaX - 30} y="640" width="72" height="224" rx="24" fill="#e9e4dc" />
      <rect x={sofaX + sofaW - 42} y="640" width="72" height="224" rx="24" fill="#e9e4dc" />
      {[0, 1, 2].map(i => (
        <rect key={i} x={sofaX + 40 + i * cushionW} y="622" width={cushionW - 18} height="150" rx="22" fill="#faf8f4" stroke="#ddd6cb" strokeWidth="2" />
      ))}
      <rect x={sofaX + 10} y="770" width={sofaW - 20} height="94" rx="20" fill="#efebe4" />
      <rect x={sofaX + 30} y="864" width="16" height="56" rx="3" fill="#8a6f52" />
      <rect x={sofaX + sofaW - 46} y="864" width="16" height="56" rx="3" fill="#8a6f52" />

      {/* plant */}
      <rect x="236" y="780" width="90" height="140" rx="10" fill="#2b2b2b" />
      <g fill="#5b7f4f">
        <ellipse cx="281" cy="730" rx="22" ry="80" transform="rotate(-18 281 730)" />
        <ellipse cx="281" cy="720" rx="22" ry="88" transform="rotate(12 281 720)" />
        <ellipse cx="281" cy="745" rx="20" ry="70" transform="rotate(-42 281 745)" />
        <ellipse cx="281" cy="745" rx="20" ry="70" transform="rotate(38 281 745)" />
      </g>
      {/* scale note */}
      <text x="1580" y="1108" textAnchor="end" fontSize="22" fill="#7a6a58" fontFamily="sans-serif">sofa width 84&quot; (213 cm)</text>
    </svg>
  );
}

interface Props {
  imageUrl: string;
  dimensions: string | null | undefined;
  className?: string;
}

export default function WallPreview({ imageUrl, dimensions, className = "" }: Props) {
  const size = parseDimensions(dimensions);
  // Natural aspect ratio of the artwork photo (width / height), once loaded
  const [ratio, setRatio] = useState<number | null>(null);
  if (!size) return null;

  // Artists type sizes in either order ("24x36" for a landscape piece), so take
  // orientation and proportions from the real image and use the listed size
  // for scale: the image's long side = the listed long side. Never crops.
  let { widthCm: w, heightCm: h } = size;
  if (ratio) {
    const long = Math.max(w, h);
    if (ratio >= 1) { w = long; h = long / ratio; }
    else            { h = long; w = long * ratio; }
  }

  // Keep oversized pieces inside the wall so the mockup never breaks
  const wPct = Math.min((w / ROOM.wallWidthCm)  * 100, 92);
  const hPct = Math.min((h / ROOM.wallHeightCm) * 100, ROOM.hangBottomY - 3);

  return (
    <div className={className}>
      <div
        className="relative w-full overflow-hidden rounded-2xl select-none"
        style={{ aspectRatio: `${ROOM.wallWidthCm} / ${ROOM.wallHeightCm}`, border: "1px solid var(--border)" }}
      >
        {ROOM.photo
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={ROOM.photo} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
          : <RoomScene />}

        {/* the artwork, framed, at true scale — hidden until its aspect ratio is known */}
        <div
          className="absolute transition-opacity duration-300"
          style={{
            left: `${ROOM.hangCenterX}%`,
            bottom: `${100 - ROOM.hangBottomY}%`,
            width: `${wPct}%`,
            height: `${hPct}%`,
            transform: "translateX(-50%)",
            padding: "0.45%",
            background: "#1c1a18",
            boxShadow: "0 18px 40px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.25)",
            opacity: ratio ? 1 : 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
            onLoad={e => {
              const el = e.currentTarget;
              if (el.naturalWidth && el.naturalHeight) setRatio(el.naturalWidth / el.naturalHeight);
            }}
          />
        </div>

        <span
          className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
          style={{ background: "rgba(0,0,0,0.6)", color: "#fff", backdropFilter: "blur(6px)" }}
        >
          {size.label}
        </span>
      </div>
      <p className="text-[11px] mt-1.5" style={{ color: "var(--text-5)" }}>
        Shown to scale on a typical wall — the sofa is 84&quot; (213 cm) wide.
      </p>
    </div>
  );
}
