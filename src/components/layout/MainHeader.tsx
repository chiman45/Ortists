"use client";

import { Bell, Mail, Plus, Search } from "lucide-react";
import Link from "next/link";

interface MainHeaderProps {
  onSearchClick: () => void;
}

export default function MainHeader({ onSearchClick }: MainHeaderProps) {
  return (
    <div
      className="flex items-center gap-4 px-8 py-4 sticky top-0 z-30"
      style={{
        background: "var(--bg-header)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <button
        onClick={onSearchClick}
        className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm w-52 transition-opacity hover:opacity-80"
        style={{
          background: "var(--bg-input)",
          border: "1px solid var(--border-card)",
          color: "var(--text-5)",
        }}
      >
        <Search size={15} className="shrink-0" />
        <span>Search</span>
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button
          className="relative p-2 rounded-xl transition-opacity hover:opacity-70"
          style={{ background: "var(--bg-subtle)", color: "var(--text-icon)" }}
        >
          <Bell size={20} strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-400 rounded-full" />
        </button>

        <button
          className="p-2 rounded-xl transition-opacity hover:opacity-70"
          style={{ background: "var(--bg-subtle)", color: "var(--text-icon)" }}
        >
          <Mail size={20} strokeWidth={1.8} />
        </button>

        <Link
          href="/upload"
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all hover:scale-[1.02]"
          style={{ background: "#361E7B", boxShadow: "0 0 18px rgba(54,30,123,0.45)" }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Add photo
        </Link>
      </div>
    </div>
  );
}
