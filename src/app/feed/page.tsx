"use client";

import MasonryGrid from "@/components/feed/MasonryGrid";
import StoriesRow from "@/components/feed/StoriesRow";
import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import { allPosts } from "@/lib/mockData";
import { useState } from "react";

const TAGS = [
  { label: "All",            category: null },
  { label: "UI/UX",          category: "UI/UX" },
  { label: "Graphic Design", category: "Branding" },
  { label: "Digital Art",    category: "Illustration" },
  { label: "3D Art",         category: "3D" },
  { label: "Motion",         category: "Motion" },
  { label: "Sketch Artist",  category: "Typography" },
  { label: "Photography",    category: "Photography" },
  { label: "Web Design",     category: "Web Design" },
];

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<"Latest" | "Popular">("Latest");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = activeTag
    ? allPosts.filter(p => p.category === activeTag).slice(0, 12)
    : allPosts.slice(0, 12);

  return (
    <div
      className="flex min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 8% 50%, rgba(54,30,123,0.16) 0%, transparent 55%)," +
          "radial-gradient(ellipse 50% 40% at 92% 20%, rgba(124,91,245,0.08) 0%, transparent 50%)," +
          "var(--bg)",
      }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">
        <MainHeader>
          <div className="flex gap-2" style={{ scrollbarWidth: "none" }}>
            {TAGS.map(({ label, category }) => {
              const active = activeTag === category;
              return (
                <button
                  key={label}
                  onClick={() => setActiveTag(category)}
                  className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: active ? "linear-gradient(135deg, #361E7B, #7C5BF5)" : "var(--bg-card)",
                    color: active ? "#fff" : "var(--text-4)",
                    border: active ? "1px solid transparent" : "1px solid var(--border)",
                    boxShadow: active ? "0 0 12px rgba(124,91,245,0.35)" : "none",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </MainHeader>

        <main className="flex-1 px-4 md:px-8 py-7 pb-24 lg:pb-7">
          <StoriesRow />

          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>Feed</h2>
            <div className="flex items-center gap-4">
              {(["Latest", "Popular"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="text-sm font-semibold transition-colors relative pb-0.5"
                  style={{ color: activeTab === tab ? "var(--text-1)" : "var(--text-5)" }}
                >
                  {tab}
                  {activeTab === tab && (
                    <span
                      className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: "linear-gradient(90deg, #361E7B, #7C5BF5)" }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <MasonryGrid posts={filtered} />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
