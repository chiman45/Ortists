"use client";

import { type Post as DbPost } from "@/lib/db/posts";
import { allPosts } from "@/lib/mockData";
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
  posts: Post[];
  category?: string | null;
  loadFromDb?: boolean;
}

export default function MasonryGrid({ posts: initial, category, loadFromDb = true }: Props) {
  const [visible, setVisible] = useState<Post[]>(initial);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const dbOffset   = useRef(initial.length);
  const mockOffset = useRef(0);
  const dbExhausted = useRef(false);
  const busy       = useRef(false);
  const endRef     = useRef<HTMLDivElement>(null);

  // Reset when initial posts or category changes
  useEffect(() => {
    setVisible(initial);
    setDone(false);
    dbOffset.current   = initial.length;
    mockOffset.current = 0;
    dbExhausted.current = false;
  }, [initial]);

  useEffect(() => {
    if (!loadFromDb) { setDone(true); return; }

    const el = endRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || busy.current || done) return;
      busy.current = true;
      setLoading(true);

      if (!dbExhausted.current) {
        // Try loading real posts from DB first
        const params = new URLSearchParams({
          limit:  String(PAGE),
          offset: String(dbOffset.current),
        });
        if (category) params.set("category", category);

        fetch(`/api/posts?${params}`)
          .then(r => r.json())
          .then(({ posts: raw }: { posts: DbPost[] }) => {
            if (raw && raw.length > 0) {
              const posts = raw.map(toGridPost);
              setVisible(v => {
                const ids = new Set(v.map(p => p.id));
                return [...v, ...posts.filter(p => !ids.has(p.id))];
              });
              dbOffset.current += posts.length;
            } else {
              // DB exhausted — fall through to mock data
              dbExhausted.current = true;
              loadMock();
              return;
            }
          })
          .catch(() => { dbExhausted.current = true; })
          .finally(() => { busy.current = false; setLoading(false); });
      } else {
        loadMock();
      }

      function loadMock() {
        const mockFiltered = category
          ? allPosts.filter(p => p.category === category)
          : allPosts;
        const slice = mockFiltered.slice(mockOffset.current, mockOffset.current + PAGE);
        if (slice.length === 0) {
          setDone(true);
        } else {
          setVisible(v => {
            const ids = new Set(v.map(p => p.id));
            return [...v, ...slice.filter(p => !ids.has(p.id))];
          });
          mockOffset.current += slice.length;
          if (mockOffset.current >= mockFiltered.length) setDone(true);
        }
        busy.current = false;
        setLoading(false);
      }
    }, { rootMargin: "400px" });

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
