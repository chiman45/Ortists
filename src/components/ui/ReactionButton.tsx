"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Like button: tap to like, tap again to remove it.
 * Saves through POST /api/posts/[id] and reverts if the save fails.
 * (Emoji reactions were removed — any reaction saved earlier counts as a like.)
 */
interface Props {
  postId: string;
  userId: string | null | undefined;
  /** Shown before the server answers */
  initialCount: number;
  /** Called when a signed-out visitor tries to like */
  onNeedLogin: () => void;
  size?: "sm" | "md";
  /** Fetch this viewer's like + total on mount (needed when the parent doesn't pass them) */
  autoLoad?: boolean;
}

const LIKE_COLOR = "#f43f5e";

export default function ReactionButton({ postId, userId, initialCount, onNeedLogin, size = "md", autoLoad = true }: Props) {
  const [liked, setLiked]     = useState(false);
  const [count, setCount]     = useState(initialCount);
  const [pending, setPending] = useState(false);

  // Load whether this viewer liked the post, and the total
  useEffect(() => {
    if (!autoLoad) return;
    let cancelled = false;
    fetch(`/api/posts/${postId}${userId ? `?userId=${userId}` : ""}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setLiked(!!d.liked);
        if (typeof d.post?.likes_count === "number") setCount(d.post.likes_count);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [postId, userId, autoLoad]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) { onNeedLogin(); return; }
    if (pending) return; // ignore double taps while the last one is saving
    const wasLiked = liked;
    const prevCount = count;

    // Optimistic update
    setLiked(!wasLiked);
    setCount(c => Math.max(0, c + (wasLiked ? -1 : 1)));
    setPending(true);

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: wasLiked ? "unlike" : "like", userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      if (typeof data.likes_count === "number") setCount(data.likes_count);
    } catch {
      setLiked(wasLiked);
      setCount(prevCount);
    } finally {
      setPending(false);
    }
  }

  const isMd = size === "md";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={liked ? "Unlike" : "Like"}
      aria-pressed={liked}
      title={liked ? "Unlike" : "Like"}
      className={isMd
        ? "flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-full transition-all hover:opacity-90 select-none"
        : "flex items-center gap-1 text-xs transition-colors shrink-0 select-none"}
      style={{
        touchAction: "manipulation",
        ...(isMd ? {
          background: liked ? `${LIKE_COLOR}1F` : "var(--bg-subtle)",
          color: liked ? LIKE_COLOR : "var(--text-3)",
          border: `1px solid ${liked ? `${LIKE_COLOR}55` : "var(--border)"}`,
        } : { color: liked ? LIKE_COLOR : "var(--text-5)" }),
      }}
    >
      <Heart size={isMd ? 15 : 13} fill={liked ? LIKE_COLOR : "none"} stroke={liked ? LIKE_COLOR : "currentColor"} />
      <span>{count}</span>
    </button>
  );
}
