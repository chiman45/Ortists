"use client";

import { Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_REACTION, REACTIONS, reactionMeta, topReactions,
  type ReactionCounts, type ReactionKey,
} from "@/lib/reactions";

/**
 * LinkedIn-style reaction button.
 *  - Tap: ❤️ (or remove your reaction if you already reacted)
 *  - Press & hold on phones / hover on desktop: pick ❤️ 🔥 😂 😮 👏 🎨
 * Saves through POST /api/posts/[id] and reverts if the save fails.
 */
interface Props {
  postId: string;
  userId: string | null | undefined;
  /** Shown before the server answers */
  initialCount: number;
  /** Called when a signed-out visitor tries to react */
  onNeedLogin: () => void;
  size?: "sm" | "md";
  /** Fetch this viewer's reaction + totals on mount (needed when the parent doesn't pass them) */
  autoLoad?: boolean;
}

const PICKER_W = 6 * 44 + 12;
const PICKER_H = 52;

export default function ReactionButton({ postId, userId, initialCount, onNeedLogin, size = "md", autoLoad = true }: Props) {
  const [reaction, setReaction] = useState<ReactionKey | null>(null);
  const [count, setCount]       = useState(initialCount);
  const [counts, setCounts]     = useState<ReactionCounts>({});
  const [pending, setPending]   = useState(false);
  const [picker, setPicker]     = useState<{ left: number; top: number } | null>(null);
  const [hovered, setHovered]   = useState<ReactionKey | null>(null);

  const btnRef      = useRef<HTMLButtonElement>(null);
  const pressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedByPress = useRef(false);

  // Load this viewer's reaction and the totals
  useEffect(() => {
    if (!autoLoad) return;
    let cancelled = false;
    fetch(`/api/posts/${postId}${userId ? `?userId=${userId}` : ""}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setReaction(d.reaction ?? (d.liked ? DEFAULT_REACTION : null));
        if (d.reactions) setCounts(d.reactions);
        if (typeof d.post?.likes_count === "number") setCount(d.post.likes_count);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [postId, userId, autoLoad]);

  // Close the picker on scroll / outside tap
  useEffect(() => {
    if (!picker) return;
    const close = () => setPicker(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [picker]);

  function openPicker() {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - PICKER_W / 2), window.innerWidth - PICKER_W - 8);
    const above = r.top - PICKER_H - 8;
    setPicker({ left, top: above >= 8 ? above : r.bottom + 8 });
  }

  async function send(next: ReactionKey | null) {
    if (!userId) { setPicker(null); onNeedLogin(); return; }
    if (pending) return;
    const prev = { reaction, count, counts };

    // Optimistic update
    const nextCounts: ReactionCounts = { ...counts };
    if (reaction) nextCounts[reaction] = Math.max(0, (nextCounts[reaction] ?? 1) - 1);
    if (next) nextCounts[next] = (nextCounts[next] ?? 0) + 1;
    setReaction(next);
    setCounts(nextCounts);
    setCount(c => c + (next ? 1 : 0) - (reaction ? 1 : 0));
    setPicker(null);
    setPending(true);

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next ? { action: "like", reaction: next, userId } : { action: "unlike", userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      if (typeof data.likes_count === "number") setCount(data.likes_count);
      if (data.reactions) setCounts(data.reactions);
    } catch {
      setReaction(prev.reaction);
      setCount(prev.count);
      setCounts(prev.counts);
    } finally {
      setPending(false);
    }
  }

  // ── Gestures ──
  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse") return;
    openedByPress.current = false;
    pressTimer.current = setTimeout(() => { openedByPress.current = true; openPicker(); }, 420);
  }
  function cancelPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  }
  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    cancelPress();
    if (openedByPress.current) { openedByPress.current = false; return; } // long-press opened the picker
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    send(reaction ? null : DEFAULT_REACTION);
  }
  function onMouseEnter() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    hoverTimer.current = setTimeout(openPicker, 450);
  }
  function onMouseLeave() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    leaveTimer.current = setTimeout(() => setPicker(null), 300);
  }

  const meta  = reaction ? reactionMeta(reaction) : null;
  const top   = topReactions(counts);
  const isMd  = size === "md";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        onContextMenu={e => e.preventDefault()}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        aria-label={meta ? `${meta.label} — tap to remove, hold to change` : "React — tap for love, hold for more"}
        title={meta ? meta.label : "Hold for more reactions"}
        className={isMd
          ? "flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-full transition-all hover:opacity-90 select-none"
          : "flex items-center gap-1 text-xs transition-colors shrink-0 select-none"}
        style={{
          WebkitTouchCallout: "none",
          touchAction: "manipulation",
          ...(isMd ? {
            background: meta ? `${meta.color}1F` : "var(--bg-subtle)",
            color: meta ? meta.color : "var(--text-3)",
            border: `1px solid ${meta ? `${meta.color}55` : "var(--border)"}`,
          } : { color: meta ? meta.color : "var(--text-5)" }),
        }}
      >
        {meta
          ? <span style={{ fontSize: isMd ? 16 : 13, lineHeight: 1 }}>{meta.emoji}</span>
          : <Heart size={isMd ? 15 : 13} />}

        {/* Stack of the top reactions on this post (post page only) */}
        {isMd && top.length > 0 && (
          <span className="flex -space-x-1 ml-0.5">
            {top.map(r => (
              <span key={r.key} className="w-5 h-5 rounded-full flex items-center justify-center text-[11px]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>{r.emoji}</span>
            ))}
          </span>
        )}
        <span>{count}</span>
      </button>

      {picker && typeof document !== "undefined" && createPortal(
        <>
          {/* Tap outside to close */}
          <div className="fixed inset-0 z-190" onClick={() => setPicker(null)} />
          <div
            role="menu"
            className="fixed z-200 flex items-center gap-1 px-1.5 rounded-full"
            style={{
              left: picker.left, top: picker.top, height: PICKER_H, width: PICKER_W,
              background: "var(--bg-card, #1c1c1c)",
              border: "1px solid var(--border)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              animation: "reactionPop 160ms ease-out",
            }}
            onMouseEnter={() => { if (leaveTimer.current) clearTimeout(leaveTimer.current); }}
            onMouseLeave={onMouseLeave}
          >
            {REACTIONS.map(r => (
              <button
                key={r.key}
                type="button"
                role="menuitem"
                aria-label={r.label}
                onClick={e => { e.stopPropagation(); send(reaction === r.key ? null : r.key); }}
                onMouseEnter={() => setHovered(r.key)}
                onMouseLeave={() => setHovered(null)}
                className="relative w-10.5 h-10.5 flex items-center justify-center rounded-full transition-transform duration-150"
                style={{
                  fontSize: 26,
                  transform: hovered === r.key ? "translateY(-6px) scale(1.3)" : reaction === r.key ? "scale(1.12)" : "scale(1)",
                  background: reaction === r.key ? `${r.color}22` : "transparent",
                }}
              >
                {r.emoji}
                {hovered === r.key && (
                  <span className="absolute -top-7 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white whitespace-nowrap"
                    style={{ background: "rgba(0,0,0,0.8)" }}>{r.label}</span>
                )}
              </button>
            ))}
          </div>
          <style>{`@keyframes reactionPop { from { opacity: 0; transform: translateY(6px) scale(0.92); } to { opacity: 1; transform: none; } }`}</style>
        </>,
        document.body,
      )}
    </>
  );
}
