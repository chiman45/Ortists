"use client";

import { allPosts } from "@/lib/mockData";
import { Post } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import FeedCard from "./FeedCard";

const BATCH = 8;

export default function MasonryGrid({ posts: seed }: { posts: Post[] }) {
  const [visible, setVisible] = useState(seed);
  const [loading, setLoading] = useState(false);
  const endRef   = useRef<HTMLDivElement>(null);
  const nextIdx  = useRef(seed.length);
  const busy     = useRef(false);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    return () => { cancelled.current = true; };
  }, []);

  useEffect(() => {
    const el = endRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || busy.current) return;
        const slice = allPosts.slice(nextIdx.current, nextIdx.current + BATCH);
        if (slice.length === 0) return;
        busy.current = true;
        setLoading(true);
        setTimeout(() => {
          if (!cancelled.current) {
            setVisible(v => {
              const ids = new Set(v.map(p => p.id));
              return [...v, ...slice.filter(p => !ids.has(p.id))];
            });
            nextIdx.current += BATCH;
          }
          busy.current = false;
          setLoading(false);
        }, 650);
      },
      { rootMargin: "400px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []); // empty deps — observer created once per mount

  const done = !loading && nextIdx.current >= allPosts.length;

  return (
    <>
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
        {visible.map(p => <FeedCard key={p.id} post={p} />)}
      </div>

      <div ref={endRef} className="flex justify-center py-10">
        {loading && (
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--bg-subtle)", borderTopColor: "#7C5BF5" }}
            />
            <span className="text-sm" style={{ color: "var(--text-6)" }}>Loading more...</span>
          </div>
        )}
        {done && (
          <span className="text-sm" style={{ color: "var(--text-6)" }}>You&apos;ve seen it all ✨</span>
        )}
      </div>
    </>
  );
}
