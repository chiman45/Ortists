"use client";

import { Bell, MessageCircle, Plus, Search } from "lucide-react";
import Link from "next/link";

interface NavbarProps {
  onSearchClick: () => void;
}

export default function Navbar({ onSearchClick }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100/80 z-40">
      <div className="flex items-center justify-between h-full px-4 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <div className="w-36 shrink-0">
          <span className="text-xl font-bold bg-linear-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent tracking-tight">
            Ortist
          </span>
        </div>

        {/* Search bar — centered */}
        <button
          onClick={onSearchClick}
          className="flex-1 max-w-md mx-4 flex items-center gap-2.5 bg-gray-100 hover:bg-gray-200/80 transition-colors rounded-xl px-4 py-2.5 text-gray-400 text-sm cursor-text"
        >
          <Search size={15} className="shrink-0" />
          <span>Search designers, projects...</span>
        </button>

        {/* Actions */}
        <div className="w-36 flex items-center justify-end gap-1">
          <button
            aria-label="Notifications"
            className="relative p-2 text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />
          </button>
          <button
            aria-label="Messages"
            className="p-2 text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <MessageCircle size={20} />
          </button>
          <Link
            href="/upload"
            className="ml-1 bg-linear-to-br from-violet-500 to-purple-600 text-white rounded-xl p-2 hover:shadow-lg hover:shadow-purple-200 transition-all hover:scale-105 flex items-center"
            aria-label="Upload work"
          >
            <Plus size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
}
