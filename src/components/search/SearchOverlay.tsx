"use client";

import { CATEGORIES } from "@/lib/mockData";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CategoryChip from "./CategoryChip";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggleCategory(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        background:
          "linear-gradient(135deg, rgba(109,40,217,0.85) 0%, rgba(126,34,206,0.80) 40%, rgba(219,39,119,0.75) 100%)",
        backdropFilter: "blur(12px)",
      }}
      onClick={onClose}
    >
      <div
        className="max-w-2xl mx-auto mt-20 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 bg-white/15 backdrop-blur-2xl border border-white/30 rounded-2xl px-5 py-4 mb-8 shadow-2xl">
          <Search className="text-white/70 shrink-0" size={20} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-base font-medium"
            placeholder="Search designers, projects, styles..."
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Section header */}
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">
          Browse by category
        </p>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2.5">
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.id}
              category={cat}
              selected={selected.includes(cat.id)}
              onToggle={() => toggleCategory(cat.id)}
            />
          ))}
        </div>

        {/* Selected summary */}
        {selected.length > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-white/70 text-sm">
              {selected.length} categor{selected.length === 1 ? "y" : "ies"} selected
            </p>
            <button className="bg-white text-violet-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors shadow-lg">
              Explore →
            </button>
          </div>
        )}

        {/* Close hint */}
        <p className="mt-10 text-center text-white/30 text-xs">
          Press Esc or click outside to close
        </p>
      </div>
    </div>
  );
}
