"use client";

import { Download } from "lucide-react";
import { useState } from "react";

const MONTHS = ["Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan"];
const VIEWS  = [120, 148, 115, 172, 228, 298, 260, 322, 292, 385, 358, 440];
const SALES  = [65,   80,  60, 100, 135, 182, 162, 218, 192, 268, 248, 305];
const TABS   = ["12 MONTHS", "6 MONTHS", "30 DAYS", "7 DAYS"] as const;

const W = 520, PX = 38, PY = 12, CH = 118, MAX = 480;

function pts(data: number[]) {
  return data.map((v, i) => ({
    x: PX + (i / (data.length - 1)) * (W - PX - 8),
    y: PY + CH - (v / MAX) * CH,
  }));
}

function line(p: { x: number; y: number }[]) {
  let d = `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`;
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1], b = p[i];
    const mx = ((a.x + b.x) / 2).toFixed(1);
    d += ` C${mx},${a.y.toFixed(1)} ${mx},${b.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
  }
  return d;
}

function area(lineD: string, p: { x: number; y: number }[]) {
  const bot = (PY + CH).toFixed(1);
  return `${lineD} L${p[p.length-1].x.toFixed(1)},${bot} L${p[0].x.toFixed(1)},${bot} Z`;
}

const GLASS: React.CSSProperties = {
  background: "var(--bg-card)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--border-card)",
  boxShadow: "0 4px 24px var(--shadow)",
};

export default function EngagementChart() {
  const [tab, setTab] = useState<typeof TABS[number]>("12 MONTHS");

  const vp = pts(VIEWS), sp = pts(SALES);
  const vl = line(vp),   sl = line(sp);
  const va = area(vl, vp), sa = area(sl, sp);
  const ti = 5;
  const tx = vp[ti].x;

  return (
    <div className="rounded-2xl p-5" style={GLASS}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-bold" style={{ color: "var(--text-1)" }}>Engagement Report</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 p-1 rounded-xl" style={{ background: "var(--bg-input)" }}>
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-2.5 py-1 text-[9px] font-bold rounded-lg transition-colors"
                style={tab === t ? { background: "#361E7B", color: "white" } : { color: "var(--text-5)" }}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-colors"
            style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", border: "1px solid var(--border-card)" }}
          >
            <Download size={12} /> EXPORT
          </button>
        </div>
      </div>

      <svg width="100%" height={162} viewBox={`0 0 ${W} 162`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="eg-v" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C5BF5" stopOpacity={0.40} />
            <stop offset="100%" stopColor="#7C5BF5" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="eg-s" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5C842" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#F5C842" stopOpacity={0} />
          </linearGradient>
          <filter id="eg-tip">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity={0.45} floodColor="#000" />
          </filter>
        </defs>

        {/* Y gridlines */}
        {[0, 120, 240, 360, 480].map(y => {
          const gy = PY + CH - (y / MAX) * CH;
          return (
            <g key={y}>
              <line x1={PX} y1={gy} x2={W - 8} y2={gy}
                style={{ stroke: "var(--bg-subtle)" }} strokeWidth={0.8} strokeDasharray={y > 0 ? "4 3" : ""} />
              <text x={PX - 6} y={gy + 4} textAnchor="end" fontSize={9}
                style={{ fill: "var(--text-6)" }}>{y}</text>
            </g>
          );
        })}

        {/* Areas + lines */}
        <path d={va} fill="url(#eg-v)" />
        <path d={sa} fill="url(#eg-s)" />
        <path d={vl} fill="none" stroke="#7C5BF5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={sl} fill="none" stroke="#F5C842" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Tooltip */}
        <line x1={tx} y1={PY} x2={tx} y2={PY + CH} stroke="rgba(255,255,255,0.18)" strokeWidth={1} strokeDasharray="3 3" />
        <rect x={tx - 50} y={6} width={100} height={54} rx={10} fill="#1E1A3A" filter="url(#eg-tip)" stroke="rgba(124,91,245,0.30)" strokeWidth={1} />
        <text x={tx} y={20} textAnchor="middle" fontSize={8.5} fill="rgba(255,255,255,0.45)" fontWeight={600}>JUL 2025</text>
        <circle cx={tx - 30} cy={33} r={3} fill="#7C5BF5" />
        <text x={tx - 24} y={37} fontSize={8.5} fill="white" fontWeight={700}>9,292</text>
        <text x={tx + 18} y={37} textAnchor="end" fontSize={8} fill="#34d399">+24.8%</text>
        <circle cx={tx - 30} cy={47} r={3} fill="#F5C842" />
        <text x={tx - 24} y={51} fontSize={8.5} fill="white" fontWeight={700}>4,254</text>
        <text x={tx + 18} y={51} textAnchor="end" fontSize={8} fill="#34d399">+3.4%</text>
        <circle cx={tx} cy={vp[ti].y} r={4.5} fill="#1E1A3A" stroke="#7C5BF5" strokeWidth={2.5} />
        <circle cx={tx} cy={sp[ti].y} r={4.5} fill="#1E1A3A" stroke="#F5C842" strokeWidth={2.5} />

        {/* X labels */}
        {MONTHS.map((m, i) => {
          const x = PX + (i / (MONTHS.length - 1)) * (W - PX - 8);
          return <text key={m} x={x} y={148} textAnchor="middle" fontSize={9}
            style={{ fill: "var(--text-6)" }}>{m}</text>;
        })}
      </svg>

      <div className="flex items-center gap-4 mt-1">
        {[["#7C5BF5","Views"],["#F5C842","Sales"]].map(([c, l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full" style={{ background: c }} />
            <span className="text-xs" style={{ color: "var(--text-5)" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
