"use client";

import { Bell } from "lucide-react";

export default function MainHeader() {
  return (
    <div
      className="flex items-center justify-end px-4 md:px-8 py-3 sm:py-4 sticky top-0 z-30"
      style={{
        background: "var(--bg-header)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <button
        className="relative p-2 rounded-xl transition-opacity hover:opacity-70"
        style={{ background: "var(--bg-subtle)", color: "var(--text-icon)" }}
        aria-label="Notifications"
      >
        <Bell size={19} strokeWidth={1.8} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-400 rounded-full" />
      </button>
    </div>
  );
}
