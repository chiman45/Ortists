"use client";

import InterestCard from "@/components/onboarding/InterestCard";
import { CATEGORIES } from "@/lib/mockData";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  const canContinue = selected.length >= 3;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background:
          "linear-gradient(145deg, #f0e9ff 0%, #fce7f3 35%, #e0f2fe 70%, #f0fdf4 100%)",
      }}
    >
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block text-sm font-bold tracking-widest text-violet-500 uppercase mb-3">
            Step 1 of 2
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            What's your{" "}
            <span className="bg-linear-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              design vibe?
            </span>
          </h1>
          <p className="text-gray-500 text-base">
            Select at least{" "}
            <span className="font-semibold text-gray-700">3 categories</span> you love — we'll
            personalise your feed.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-1.5 mb-8">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className={`h-1 rounded-full transition-all duration-300 ${
                selected.includes(cat.id)
                  ? "w-6 bg-linear-to-r from-violet-500 to-pink-400"
                  : "w-3 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Interest grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {CATEGORIES.map((cat) => (
            <InterestCard
              key={cat.id}
              category={cat}
              selected={selected.includes(cat.id)}
              onToggle={() => toggle(cat.id)}
            />
          ))}
        </div>

        {/* Selection count */}
        <p className="text-center text-sm text-gray-400 mb-4">
          {selected.length < 3 ? (
            <>Select {3 - selected.length} more to continue</>
          ) : (
            <span className="text-violet-600 font-semibold">
              ✦ Great picks! Ready to explore.
            </span>
          )}
        </p>

        {/* CTA */}
        <Link
          href="/"
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all duration-200 ${
            canContinue
              ? "bg-linear-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 hover:scale-[1.01]"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"
          }`}
          onClick={(e) => !canContinue && e.preventDefault()}
        >
          Continue
          <ArrowRight size={18} />
        </Link>

        <p className="text-center text-xs text-gray-400 mt-4">
          You can always update this in your settings
        </p>
      </div>
    </div>
  );
}
