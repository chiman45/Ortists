"use client";

import CategoryBubbles from "@/components/dashboard/CategoryBubbles";
import EngagementChart from "@/components/dashboard/EngagementChart";
import RecentCommissions from "@/components/dashboard/RecentCommissions";
import StatCard from "@/components/dashboard/StatCard";
import TrafficSources from "@/components/dashboard/TrafficSources";
import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";
import SearchOverlay from "@/components/search/SearchOverlay";
import { Bell, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

const STATS = [
  { title: "Today's Posts",   value: "12",       change: "+36%", positive: true,  data: [3,5,4,7,5,8,6,9,8,11,10,12], color: "#10b981", gradId: "s-posts"   },
  { title: "Total Views",     value: "2,38,485", change: "-14%", positive: false, data: [320,285,315,272,295,262,242,258,234,212,222,202], color: "#f43f5e", gradId: "s-views"   },
  { title: "Total Followers", value: "84,382",   change: "+36%", positive: true,  data: [40,45,43,50,52,58,60,65,68,72,78,84], color: "#7C5BF5", gradId: "s-follow" },
];

export default function DashboardPage() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div
      className="flex min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse 65% 55% at 4% 55%, rgba(54,30,123,0.22) 0%, transparent 55%)," +
          "radial-gradient(ellipse 45% 40% at 96% 15%, rgba(124,91,245,0.10) 0%, transparent 50%)," +
          "var(--bg)",
      }}
    >
      <Sidebar />

      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 md:px-8 py-4 sticky top-0 z-30"
          style={{
            background: "var(--bg-header)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>Hi, Kate 👋</h1>
            <p className="text-sm" style={{ color: "var(--text-6)" }}>Welcome back to Ortist ✨</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSearchOpen(true)} className="p-2 rounded-xl transition-opacity hover:opacity-70"
              style={{ background: "var(--bg-subtle)", color: "var(--text-icon)" }}>
              <Search size={18} />
            </button>
            <button className="relative p-2 rounded-xl transition-opacity hover:opacity-70"
              style={{ background: "var(--bg-subtle)", color: "var(--text-icon)" }}>
              <Bell size={18} strokeWidth={1.8} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-400 rounded-full" />
            </button>
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-card)", color: "var(--text-3)" }}>
              <SlidersHorizontal size={14} /> Customize
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
              style={{ background: "#361E7B", boxShadow: "0 0 20px rgba(54,30,123,0.45)" }}>
              <Plus size={15} strokeWidth={2.5} /> Add New
            </button>
          </div>
        </div>

        <main className="flex-1 px-4 md:px-8 py-6 space-y-5 pb-24 lg:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {STATS.map(s => <StatCard key={s.gradId} {...s} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2"><EngagementChart /></div>
            <TrafficSources />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <CategoryBubbles />
            <div className="lg:col-span-2"><RecentCommissions /></div>
          </div>
        </main>
      </div>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <BottomNav />
    </div>
  );
}
