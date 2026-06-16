"use client";

import MasonryGrid from "@/components/feed/MasonryGrid";
import StoriesRow from "@/components/feed/StoriesRow";
import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import FeedGridSkeleton from "@/components/ui/skeletons/FeedCardSkeleton";
import { type Post } from "@/lib/db/posts";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

function toGridPost(p: Post) {
  return {
    id: p.id,
    title: p.title,
    imageUrl: p.image_url,
    imageWidth: 400,
    imageHeight: 500,
    username: p.author_username,
    avatar: p.author_avatar ?? `https://i.pravatar.cc/80`,
    likes: p.likes_count,
    comments: p.comments_count,
    category: p.category,
  };
}

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<"Latest" | "Popular">("Latest");
  const [search, setSearch]       = useState("");
  const [query, setQuery]         = useState("");
  const [dbPosts, setDbPosts]     = useState<Post[]>([]);
  const [loading, setLoading]     = useState(true);

  // Debounce search → query
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setDbPosts([]);
    const params = new URLSearchParams({ limit: "24", offset: "0" });
    if (query) params.set("search", query);
    fetch(`/api/posts?${params}`)
      .then(r => r.json())
      .then(({ posts }: { posts: Post[] }) => { setDbPosts(posts ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [query]);

  const posts = loading ? [] : dbPosts.map(toGridPost);

  return (
    <div
      className="flex min-h-screen overflow-x-hidden"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 8% 50%, rgba(54,30,123,0.16) 0%, transparent 55%)," +
          "radial-gradient(ellipse 50% 40% at 92% 20%, rgba(124,91,245,0.08) 0%, transparent 50%)," +
          "var(--bg)",
      }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen min-w-0">
        <MainHeader>
          {/* Search bar — right-aligned */}
          <div className="px-4 md:px-8 pb-3 flex justify-end">
            <div
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", width: 300 }}
            >
              <Search size={15} style={{ color: "var(--text-5)", flexShrink: 0 }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search artwork, artists…"
                className="flex-1 bg-transparent text-sm outline-none min-w-0"
                style={{ color: "var(--text-1)" }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-xs shrink-0 transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-5)" }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </MainHeader>

        <main className="flex-1 px-4 md:px-8 py-7 pb-24 lg:pb-7">
          <StoriesRow />

          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>
              {query ? `Results for "${query}"` : "Feed"}
            </h2>
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

          {loading ? (
            <FeedGridSkeleton count={12} />
          ) : (
            <MasonryGrid
              key={query}
              posts={posts as Parameters<typeof MasonryGrid>[0]["posts"]}
              category={null}
              loadFromDb={true}
            />
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
