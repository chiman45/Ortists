"use client";

import { mockDesigners } from "@/lib/mockData";
import { Play, Plus } from "lucide-react";
import { useState } from "react";
import StoryCircle from "./StoryCircle";
import StoryViewer, { type StoryItem } from "./StoryViewer";

const ROLES: Record<string, string> = {
  "1": "Digital Artist",
  "2": "UI/UX Designer",
  "3": "3D Artist",
  "4": "Motion Designer",
  "5": "Illustrator",
  "6": "UX Designer",
  "7": "Brand Designer",
  "8": "Typography Artist",
};

const DISPLAY_NAMES: Record<string, string> = {
  "1": "Alex Creates",
  "2": "Mila Design",
  "3": "Jin 3D",
  "4": "Sara Motion",
  "5": "Noah Illus",
  "6": "Priya UX",
  "7": "Luca Brand",
  "8": "Yuki Type",
};

const TIMES = ["2m ago", "15m ago", "1h ago", "2h ago", "3h ago", "5h ago", "8h ago", "12h ago"];

// Generate 2–3 story frames per designer using picsum seeds
const STORIES: StoryItem[] = mockDesigners.map((d, i) => ({
  id: d.id,
  username: d.username,
  displayName: DISPLAY_NAMES[d.id] ?? d.username,
  avatar: d.avatar,
  role: ROLES[d.id] ?? "Artist",
  time: TIMES[i] ?? "1h ago",
  frames: [
    { image: `https://picsum.photos/seed/story${d.id}a/500/900`, duration: 5000 },
    { image: `https://picsum.photos/seed/story${d.id}b/500/900`, duration: 5000 },
    { image: `https://picsum.photos/seed/story${d.id}c/500/900`, duration: 4000 },
  ],
}));

export default function StoriesRow() {
  const [viewingIdx, setViewingIdx] = useState<number | null>(null);

  return (
    <>
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>Stories</h2>
          <button
            onClick={() => setViewingIdx(0)}
            className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--text-5)" }}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "var(--bg-subtle)" }}>
              <Play size={10} fill="currentColor" className="ml-0.5" />
            </div>
            Watch all
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button className="flex flex-col items-center gap-2 shrink-0 group">
            <div
              className="w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center transition-all"
              style={{ borderColor: "var(--border-card)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#7C5BF5"; e.currentTarget.style.background = "rgba(124,91,245,0.10)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-card)"; e.currentTarget.style.background = "transparent"; }}
            >
              <Plus size={20} style={{ color: "var(--text-5)" }} />
            </div>
            <span className="text-[10px] font-medium" style={{ color: "var(--text-5)" }}>Add</span>
          </button>

          {STORIES.map((story, i) => (
            <StoryCircle
              key={story.id}
              designer={mockDesigners.find(d => d.id === story.id)!}
              onClick={() => setViewingIdx(i)}
            />
          ))}
        </div>
      </section>

      {viewingIdx !== null && (
        <StoryViewer
          stories={STORIES}
          startIndex={viewingIdx}
          onClose={() => setViewingIdx(null)}
        />
      )}
    </>
  );
}
