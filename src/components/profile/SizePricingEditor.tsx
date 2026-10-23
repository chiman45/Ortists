"use client";

import { useState } from "react";
import { CANVAS_CATEGORIES, sizeKey, sizeLabel } from "@/lib/canvasSizes";

/**
 * Artist enters their own price for each canvas size they offer (artwork only,
 * no frame). Clients see that price + the platform fee when they pick the size;
 * sizes left blank become "request a quote".
 */
export default function SizePricingEditor({
  value, onChange,
}: {
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
}) {
  const [cat, setCat] = useState(CANVAS_CATEGORIES[0].id);
  const category = CANVAS_CATEGORIES.find(c => c.id === cat)!;
  const pricedCount = (id: string) =>
    CANVAS_CATEGORIES.find(c => c.id === id)!.sizes.filter(s => value[sizeKey(id, s.w, s.h)] > 0).length;

  function setPrice(key: string, raw: string) {
    const next = { ...value };
    const n = Math.round(Number(raw));
    if (raw.trim() === "" || !(n > 0)) delete next[key];
    else next[key] = n;
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-5)" }}>
        Enter your price for each size you offer — artwork only, without frame. When a client picks that size,
        your price is used for their request automatically (frame, if they want one, is added on top). Leave a size blank
        and clients can still request a quote for it.
      </p>

      {/* Shape tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {CANVAS_CATEGORIES.map(c => {
          const n = pricedCount(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: cat === c.id ? "#7C5BF5" : "var(--bg-subtle)",
                color:      cat === c.id ? "#fff" : "var(--text-4)",
                border:     `1px solid ${cat === c.id ? "#7C5BF5" : "var(--border)"}`,
              }}
            >
              {c.label}{n > 0 && <span className="ml-1 opacity-70">· {n}</span>}
            </button>
          );
        })}
      </div>

      {/* Size → price rows */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <div className="grid grid-cols-2 gap-3 px-4 py-2 text-[10px] font-bold tracking-wider"
          style={{ background: "var(--bg-subtle)", color: "var(--text-5)" }}>
          <span>SIZE</span><span>YOUR PRICE (₹)</span>
        </div>
        {category.sizes.map(s => {
          const key = sizeKey(cat, s.w, s.h);
          const v = value[key];
          return (
            <div key={key} className="grid grid-cols-2 gap-3 items-center px-4 py-2"
              style={{ borderTop: "1px solid var(--border)" }}>
              <span className="text-sm" style={{ color: "var(--text-2)" }}>
                {sizeLabel(s.w, s.h)}
                {s.note && <span className="block text-[10px]" style={{ color: "var(--text-5)" }}>{s.note}</span>}
              </span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={v ?? ""}
                onChange={e => setPrice(key, e.target.value)}
                placeholder="Not offered"
                className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-1)" }}
              />
            </div>
          );
        })}
      </div>
      {!category.frameable && (
        <p className="text-[11px]" style={{ color: "var(--text-5)" }}>{category.label} canvases are sold without a frame.</p>
      )}
    </div>
  );
}
