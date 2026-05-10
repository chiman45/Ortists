"use client";

import { Category } from "@/lib/types";
import { Check, Plus } from "lucide-react";

interface CategoryChipProps {
  category: Category;
  selected: boolean;
  onToggle: () => void;
}

export default function CategoryChip({ category, selected, onToggle }: CategoryChipProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl backdrop-blur-xl border transition-all duration-200 ${
        selected
          ? "bg-white/40 border-white/70 shadow-lg shadow-black/10 scale-[1.03]"
          : "bg-white/15 border-white/25 hover:bg-white/25 hover:border-white/40"
      }`}
    >
      <span className="text-base leading-none">{category.emoji}</span>
      <span className="text-white font-medium text-sm">{category.name}</span>
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          selected ? "bg-white text-violet-600" : "bg-white/25 text-white"
        }`}
      >
        {selected ? <Check size={11} strokeWidth={3} /> : <Plus size={11} strokeWidth={2.5} />}
      </div>
    </button>
  );
}
