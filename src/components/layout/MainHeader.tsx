"use client";

import { Bell, Plus, Search } from "lucide-react";
import Link from "next/link";

interface MainHeaderProps {
  onSearchClick: () => void;
}

export default function MainHeader({ onSearchClick }: MainHeaderProps) {
  return (
    <div
      className="flex items-center gap-2 sm:gap-4 px-4 md:px-8 py-3 sm:py-4 sticky top-0 z-30"
      style={{
        background: "var(--bg-header)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <button
        onClick={onSearchClick}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm flex-1 min-w-0 transition-opacity hover:opacity-80"
        style={{
          background: "var(--bg-input)",
          border: "1px solid var(--border-card)",
          color: "var(--text-5)",
          maxWidth: "13rem",
        }}
      >
        <Search size={15} className="shrink-0" />
        <span className="truncate">Search</span>
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          className="relative p-2 rounded-xl transition-opacity hover:opacity-70"
          style={{ background: "var(--bg-subtle)", color: "var(--text-icon)" }}
        >
          <Bell size={19} strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-400 rounded-full" />
        </button>

        <Link
          href="/upload"
          className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl text-white transition-all hover:scale-[1.02]"
          style={{ background: "#361E7B", boxShadow: "0 0 18px rgba(54,30,123,0.45)" }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">Add photo</span>
        </Link>
      </div>
    </div>
  );
}
