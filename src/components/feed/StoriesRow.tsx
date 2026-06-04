"use client";

import { useUser } from "@clerk/nextjs";
import { Loader2, Play, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { StoryItem } from "./StoryViewer";
import StoryViewer from "./StoryViewer";

interface DbStory {
  id: string;
  user_id: string;
  author_name: string;
  author_username: string;
  author_avatar: string | null;
  image_url: string;
  created_at: string;
  expires_at: string;
}

type RichStory = StoryItem & { storyIds: string[] };

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function groupStories(raw: DbStory[]): RichStory[] {
  const map = new Map<string, DbStory[]>();
  raw.forEach(s => {
    if (!map.has(s.user_id)) map.set(s.user_id, []);
    map.get(s.user_id)!.push(s);
  });
  return Array.from(map.values()).map(userStories => {
    const first = userStories[0];
    return {
      id:          first.user_id,
      username:    first.author_username,
      displayName: first.author_name,
      avatar:      first.author_avatar ?? `https://i.pravatar.cc/80?u=${first.user_id}`,
      role:        "Artist",
      time:        timeAgo(first.created_at),
      frames:      userStories.map(s => ({ image: s.image_url, duration: 5000 })),
      storyIds:    userStories.map(s => s.id),
    } satisfies RichStory;
  });
}

async function loadStories(): Promise<RichStory[]> {
  const res = await fetch("/api/stories");
  const { stories } = await res.json();
  return groupStories(stories ?? []);
}

export default function StoriesRow() {
  const { user } = useUser();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [stories, setStories]       = useState<RichStory[]>([]);
  const [viewingIdx, setViewingIdx] = useState<number | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => { loadStories().then(setStories); }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = "";
    setUploading(true);
    setError(null);
    try {
      // Upload via server-side route (uses admin/service-role key)
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      const { url, error: uploadErr } = await uploadRes.json();
      if (uploadErr || !url) throw new Error(uploadErr ?? "Upload failed");

      const storyRes = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id:         user.id,
          author_name:     user.fullName ?? user.username ?? "Artist",
          author_username: user.username ?? user.id.slice(0, 12),
          author_avatar:   user.imageUrl,
          image_url:       url,
        }),
      });
      const { error: storyErr } = await storyRes.json();
      if (storyErr) throw new Error(storyErr);

      setStories(await loadStories());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  async function deleteMyStory(storyIds: string[]) {
    await Promise.all(storyIds.map(id => fetch(`/api/stories/${id}`, { method: "DELETE" })));
    setStories(await loadStories());
  }

  const myStoryIdx = stories.findIndex(s => s.id === user?.id);
  const others     = stories.filter(s => s.id !== user?.id);

  return (
    <>
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>Stories</h2>
          {stories.length > 0 && (
            <button
              onClick={() => setViewingIdx(0)}
              className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: "var(--text-5)" }}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "var(--bg-subtle)" }}>
                <Play size={10} fill="currentColor" className="ml-0.5" />
              </div>
              Watch all
            </button>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {/* Add story */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center transition-all"
              style={{ borderColor: "rgba(124,91,245,0.4)" }}
              onMouseEnter={e => { (e.currentTarget).style.background = "rgba(124,91,245,0.10)"; }}
              onMouseLeave={e => { (e.currentTarget).style.background = "transparent"; }}
            >
              {uploading
                ? <Loader2 size={20} className="animate-spin" style={{ color: "#9B7CF5" }} />
                : <Plus size={20} style={{ color: "#9B7CF5" }} />
              }
            </button>
            <span className="text-[10px] font-medium" style={{ color: "var(--text-5)" }}>
              {uploading ? "Adding…" : "Add"}
            </span>
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {/* My story */}
          {myStoryIdx !== -1 && (
            <StoryBubble
              story={stories[myStoryIdx]}
              onClick={() => setViewingIdx(myStoryIdx)}
              canDelete
              onDelete={() => deleteMyStory(stories[myStoryIdx].storyIds)}
            />
          )}

          {/* Others */}
          {others.map(story => (
            <StoryBubble
              key={story.id}
              story={story}
              onClick={() => setViewingIdx(stories.indexOf(story))}
            />
          ))}

          {stories.length === 0 && !uploading && (
            <p className="text-xs self-center" style={{ color: "var(--text-5)" }}>
              No stories yet — be the first!
            </p>
          )}
        </div>

        {error && (
          <p className="text-xs mt-2" style={{ color: "#EF4444" }}>{error}</p>
        )}
      </section>

      {viewingIdx !== null && (
        <StoryViewer
          stories={stories}
          startIndex={viewingIdx}
          onClose={() => setViewingIdx(null)}
        />
      )}
    </>
  );
}

function StoryBubble({
  story, onClick, canDelete, onDelete,
}: {
  story: RichStory;
  onClick: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0 relative group">
      <button
        onClick={onClick}
        className="w-14 h-14 rounded-full p-0.5 transition-all hover:scale-105"
        style={{
          background: "linear-gradient(135deg, #361E7B, #7C5BF5, #F59E0B)",
          boxShadow: "0 0 0 2px var(--bg)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={story.avatar}
          alt={story.displayName}
          className="w-full h-full rounded-full object-cover"
          style={{ border: "2px solid var(--bg)" }}
        />
      </button>

      {canDelete && onDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "#EF4444" }}
        >
          <X size={10} color="#fff" />
        </button>
      )}

      <span className="text-[10px] font-medium text-center"
        style={{ color: "var(--text-5)", maxWidth: 56 }}>
        {story.displayName.split(" ")[0]}
      </span>
    </div>
  );
}
