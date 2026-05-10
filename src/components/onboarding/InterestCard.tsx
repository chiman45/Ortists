"use client";

import { Category } from "@/lib/types";
import { Check } from "lucide-react";

interface InterestCardProps {
  category: Category;
  selected: boolean;
  onToggle: () => void;
}

export default function InterestCard({ category, selected, onToggle }: InterestCardProps) {
  return (
    <button
      onClick={onToggle}
      className={`relative overflow-hidden rounded-3xl p-6 text-left w-full transition-all duration-200 ${
        selected ? "scale-[1.03] shadow-xl" : "hover:scale-[1.01] shadow-sm hover:shadow-md"
      }`}
    >
      {/* Gradient bg layer */}
      <div
        className={`absolute inset-0 bg-linear-to-br ${category.gradient} opacity-${selected ? "30" : "15"} transition-opacity`}
      />

      {/* Glass surface */}
      <div
        className={`absolute inset-0 backdrop-blur-xl ${category.glassColor} border-2 rounded-3xl transition-all ${
          selected ? "border-white/80 shadow-inner" : "border-white/40"
        }`}
      />

      {/* Selected ring */}
      {selected && (
        <div
          className={`absolute inset-0 rounded-3xl bg-linear-to-br ${category.gradient} opacity-20`}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        <div className="text-2xl mb-2 font-bold">{category.emoji}</div>
        <p className={`font-bold text-base ${category.textColor}`}>{category.name}</p>
        <p className="text-xs text-gray-500 mt-0.5 font-medium">{category.description}</p>
      </div>

      {/* Check indicator */}
      <div
        className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
          selected
            ? `bg-linear-to-br ${category.gradient} text-white shadow-md`
            : "bg-white/60 text-transparent"
        }`}
      >
        <Check size={14} strokeWidth={3} />
      </div>
    </button>
  );
}
