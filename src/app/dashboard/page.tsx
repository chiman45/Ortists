"use client";

import CategoryBubbles from "@/components/dashboard/CategoryBubbles";
import EngagementChart from "@/components/dashboard/EngagementChart";
import RecentPosts from "@/components/dashboard/RecentCommissions";
import StatCard from "@/components/dashboard/StatCard";
import TrafficSources from "@/components/dashboard/TrafficSources";
import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";
import SearchOverlay from "@/components/search/SearchOverlay";
import { type Post } from "@/lib/db/posts";
import { type Profile } from "@/lib/db/profiles";
import { useUser } from "@clerk/nextjs";
import { Bell, Search } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profile, setProfile]       = useState<Profile | null>(null);
  const [posts, setPosts]           = useState<Post[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;
    Promise.all([
      fetch(`/api/profiles?username=${user.id}`).then(r => r.json()),
      fetch(`/api/posts?userId=${user.id}&limit=50`).then(r => r.json()),
    ]).then(([profileData, postsData]) => {
      setProfile(profileData.profile ?? null);
      setPosts(postsData.posts ?? []);
      setLoading(false);
    });
  }, [user, isLoaded]);

  const totalPosts  = posts.length;
  const totalLikes  = posts.reduce((sum, p) => sum + (p.likes_count ?? 0), 0);
  const totalSaves  = posts.reduce((sum, p) => sum + (p.saves_count ?? 0), 0);
  const followers   = profile?.followers_count ?? 0;
  const firstName   = user?.firstName ?? user?.fullName?.split(" ")[0] ?? "Artist";

  const STATS = [
    {
      title: "My Posts",     value: loading ? "…" : totalPosts.toString(),
      change: "", positive: true,
      data: [0,0,0,0,0,0,0,0,0,0,0,totalPosts],
      color: "#10b981", gradId: "s-posts",
    },
    {
      title: "Total Likes",  value: loading ? "…" : totalLikes.toLocaleString(),
      change: "", positive: true,
      data: [0,0,0,0,0,0,0,0,0,0,0,totalLikes],
      color: "#f43f5e", gradId: "s-likes",
    },
    {
      title: "Followers",    value: loading ? "…" : followers.toLocaleString(),
      change: "", positive: true,
      data: [0,0,0,0,0,0,0,0,0,0,0,followers],
      color: "#7C5BF5", gradId: "s-follow",
    },
    {
      title: "Total Saves",  value: loading ? "…" : totalSaves.toLocaleString(),
      change: "", positive: true,
      data: [0,0,0,0,0,0,0,0,0,0,0,totalSaves],
      color: "#F5C842", gradId: "s-saves",
    },
  ];

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
          className="flex items-center justify-between px-4 md:px-8 py-3 sm:py-4 sticky top-0 z-30"
          style={{
            background: "var(--bg-header)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>
              Hi, {firstName} 👋
            </h1>
            <p className="text-sm" style={{ color: "var(--text-6)" }}>Welcome back to Ortist ✨</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-xl transition-opacity hover:opacity-70"
              style={{ background: "var(--bg-subtle)", color: "var(--text-icon)" }}
            >
              <Search size={18} />
            </button>
            <button
              className="relative p-2 rounded-xl transition-opacity hover:opacity-70"
              style={{ background: "var(--bg-subtle)", color: "var(--text-icon)" }}
            >
              <Bell size={18} strokeWidth={1.8} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-400 rounded-full" />
            </button>
          </div>
        </div>

        <main className="flex-1 px-4 md:px-8 py-6 space-y-5 pb-24 lg:pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {STATS.map(s => <StatCard key={s.gradId} {...s} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2"><EngagementChart /></div>
            <TrafficSources />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <CategoryBubbles />
            <div className="lg:col-span-2"><RecentPosts posts={posts} loading={loading} /></div>
          </div>
        </main>
      </div>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <BottomNav />
    </div>
  );
}

