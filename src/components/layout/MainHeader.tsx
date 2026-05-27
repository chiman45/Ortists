"use client";

import { Bell } from "lucide-react";

export default function MainHeader({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-8 py-3 sm:py-4"
      style={{
        background: "var(--bg-header)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {children && (
        <div className="flex-1 min-w-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {children}
        </div>
      )}
      <div className={children ? "" : "ml-auto"}>
        <button
          className="relative p-2 rounded-xl transition-opacity hover:opacity-70"
          style={{ background: "var(--bg-subtle)", color: "var(--text-icon)" }}
          aria-label="Notifications"
        >
          <Bell size={19} strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-400 rounded-full" />
        </button>
      </div>
    </div>
  );
}
