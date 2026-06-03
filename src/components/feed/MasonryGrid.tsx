"use client";

import { type Post as DbPost } from "@/lib/db/posts";
import { Post } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import FeedCard from "./FeedCard";

function toGridPost(p: DbPost): Post {
  return {
    id:          p.id,
    title:       p.title,
    imageUrl:    p.image_url,
    imageWidth:  400,
    imageHeight: 500,
    username:    p.author_username,
    avatar:      p.author_avatar ?? `https://i.pravatar.cc/80?u=${p.user_id}`,
    likes:       p.likes_count,
    comments:    p.comments_count,
    category:    p.category,
  };
}

const PAGE = 12;

interface Props {
  posts: Post[];           // initial batch (already fetched by parent)
  category?: string | null; // filter to pass when loading more from DB
  loadFromDb?: boolean;     // true = load more from API, false = done (mock/static)
}

export default function MasonryGrid({ posts: initial, category, loadFromDb = true }: Props) {
  const [visible, setVisible]   = useState<Post[]>(initial);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const offset  = useRef(initial.length);
  const busy    = useRef(false);
  const endRef  = useRef<HTMLDivElement>(null);

  // Reset when filter changes
  useEffect(() => {
    setVisible(initial);
    setDone(false);
    offset.current = initial.length;
  }, [initial]);

  useEffect(() => {
    if (!loadFromDb) { setDone(true); return; }

    const el = endRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || busy.current || done) return;
      busy.current = true;
      setLoading(true);

      const params = new URLSearchParams({
        limit:  String(PAGE),
        offset: String(offset.current),
      });
      if (category) params.set("category", category);

      fetch(`/api/posts?${params}`)
        .then(r => r.json())
        .then(({ posts: raw, hasMore }: { posts: DbPost[]; hasMore: boolean }) => {
          if (!raw || raw.length === 0) { setDone(true); return; }
          const posts = raw.map(toGridPost);
          setVisible(v => {
            const ids = new Set(v.map(p => p.id));
            return [...v, ...posts.filter(p => !ids.has(p.id))];
          });
          offset.current += posts.length;
          if (!hasMore) setDone(true);
        })
        .catch(() => setDone(true))
        .finally(() => { busy.current = false; setLoading(false); });
    }, { rootMargin: "500px" });

    obs.observe(el);
    return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, loadFromDb, done]);

  return (
    <>
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
        {visible.map((p, i) => (
          <FeedCard key={p.id} post={p} priority={i < 6} />
        ))}
      </div>

      <div ref={endRef} className="flex justify-center py-10">
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--bg-subtle)", borderTopColor: "#7C5BF5" }} />
            <span className="text-sm" style={{ color: "var(--text-6)" }}>Loading more…</span>
          </div>
        )}
        {done && visible.length > 0 && (
          <span className="text-sm" style={{ color: "var(--text-6)" }}>You&apos;ve seen it all ✨</span>
        )}
      </div>
    </>
  );
}
