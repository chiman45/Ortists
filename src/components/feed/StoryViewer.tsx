"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Loader2, Trash2, X } from "lucide-react";

interface StoryFrame { image: string; duration: number }
export interface StoryItem {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  role: string;
  time: string;
  frames: StoryFrame[];
  storyIds?: string[];
}

interface ViewerRecord {
  viewerId: string;
  viewedAt: string;
  profile: { clerk_id: string; display_name: string | null; username: string | null; avatar_url: string | null } | null;
}

interface Props {
  stories: StoryItem[];
  startIndex: number;
  onClose: () => void;
  currentUserId?: string;
  onDeleteFrame?: (storyId: string) => Promise<void>;
  onViewFrame?: (storyId: string) => void;
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function StoryViewer({ stories, startIndex, onClose, currentUserId, onDeleteFrame, onViewFrame }: Props) {
  const [storyIdx, setStoryIdx]       = useState(startIndex);
  const [frameIdx, setFrameIdx]       = useState(0);
  const [progress, setProgress]       = useState(0);
  const [confirming, setConfirming]   = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [viewerSheet, setViewerSheet] = useState(false);
  const [viewers, setViewers]         = useState<ViewerRecord[]>([]);
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const [viewersLoading, setViewersLoading] = useState(false);
  const startRef = useRef<number>(0);
  const rafRef   = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const story = stories[storyIdx];

  useEffect(() => {
    if (!story) onClose();
  }, [story, onClose]);

  if (!story) return null;

  const frame          = story.frames[frameIdx] ?? story.frames[0];
  const total          = story.frames.length;
  const isOwn          = !!currentUserId && story.id === currentUserId;
  const currentStoryId = story.storyIds?.[frameIdx];
  const paused         = confirming || viewerSheet;

  // Record view for others' stories & fetch count for own stories when frame changes
  useEffect(() => {
    if (!currentStoryId) return;
    if (isOwn) {
      // Fetch view count for the current frame
      fetch(`/api/stories/${currentStoryId}?requesterId=${currentUserId}`)
        .then(r => r.json())
        .then(d => { if (typeof d.count === "number") setViewerCount(d.count); })
        .catch(() => {});
    } else if (onViewFrame) {
      onViewFrame(currentStoryId);
    }
    // Reset viewer sheet when frame changes
    setViewerSheet(false);
    setViewers([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStoryId]);

  async function openViewerSheet() {
    if (!currentStoryId || !currentUserId) return;
    setViewerSheet(true);
    setViewersLoading(true);
    try {
      const res  = await fetch(`/api/stories/${currentStoryId}?requesterId=${currentUserId}`);
      const data = await res.json();
      setViewers(data.viewers ?? []);
      setViewerCount(data.count ?? 0);
    } catch {
      // keep existing count
    } finally {
      setViewersLoading(false);
    }
  }

  function advance() {
    if (frameIdx < total - 1) {
      setFrameIdx(f => f + 1); setProgress(0);
    } else if (storyIdx < stories.length - 1) {
      setStoryIdx(s => s + 1); setFrameIdx(0); setProgress(0);
    } else {
      onClose();
    }
  }

  function goBack() {
    if (frameIdx > 0) {
      setFrameIdx(f => f - 1); setProgress(0);
    } else if (storyIdx > 0) {
      setStoryIdx(s => s - 1); setFrameIdx(0); setProgress(0);
    }
  }

  async function handleDelete() {
    if (!currentStoryId || !onDeleteFrame) return;
    setDeleting(true);
    try {
      await onDeleteFrame(currentStoryId);
      if (total === 1) {
        if (storyIdx < stories.length - 1) { setStoryIdx(s => s + 1); setFrameIdx(0); }
        else onClose();
      } else {
        setFrameIdx(f => Math.min(f, total - 2));
      }
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  // Progress animation — pauses when a sheet is open
  useEffect(() => {
    if (paused) return;
    setProgress(0);
    startRef.current = performance.now();

    function tick(now: number) {
      const elapsed = now - startRef.current;
      const pct = Math.min((elapsed / frame.duration) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        advance();
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyIdx, frameIdx, paused]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (viewerSheet || confirming) { if (e.key === "Escape") { setViewerSheet(false); setConfirming(false); } return; }
      if (e.key === "ArrowRight") advance();
      if (e.key === "ArrowLeft")  goBack();
      if (e.key === "Escape")     onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyIdx, frameIdx, viewerSheet, confirming]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Story card */}
      <div
        className="relative overflow-hidden select-none"
        style={{ width: "min(420px, 100vw)", height: "min(88vh, 860px)", borderRadius: 20, background: "#111" }}
      >
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={frame.image} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />

        {/* Top gradient */}
        <div className="absolute inset-x-0 top-0 h-32 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)" }} />

        {/* Bottom gradient (for viewer count visibility) */}
        <div className="absolute inset-x-0 bottom-0 h-28 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)" }} />

        {/* Progress bars */}
        <div className="absolute top-3 inset-x-3 flex gap-1 z-10">
          {story.frames.map((_, i) => (
            <div key={i} className="flex-1 rounded-full overflow-hidden" style={{ height: 2.5, background: "rgba(255,255,255,0.3)" }}>
              <div
                style={{
                  height: "100%", background: "#fff", borderRadius: "inherit",
                  width: i < frameIdx ? "100%" : i === frameIdx ? `${progress}%` : "0%",
                  transition: i === frameIdx ? "none" : undefined,
                }}
              />
            </div>
          ))}
        </div>

        {/* Header: avatar + name + actions */}
        <div className="absolute top-7 inset-x-3 flex items-center gap-3 z-10 pt-1">
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={story.avatar} alt={story.displayName} className="w-10 h-10 rounded-full object-cover" style={{ border: "2px solid rgba(255,255,255,0.8)" }} />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black" style={{ background: "#10B981" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-none mb-0.5">{story.displayName}</p>
            <p className="text-[11px] text-white/70">{story.role} · {story.time}</p>
          </div>

          {isOwn && onDeleteFrame && currentStoryId && (
            <button
              onClick={e => { e.stopPropagation(); setConfirming(true); }}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-opacity hover:opacity-80"
              style={{ background: "rgba(239,68,68,0.25)", backdropFilter: "blur(8px)" }}
              title="Delete this story"
            >
              <Trash2 size={15} color="#fca5a5" />
            </button>
          )}

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-opacity hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
          >
            <X size={16} color="#fff" />
          </button>
        </div>

        {/* Tap zones */}
        {!paused && (
          <div className="absolute inset-0 flex" style={{ top: 80, bottom: 60 }}>
            <div className="flex-1 cursor-pointer" onClick={goBack} />
            <div className="flex-1 cursor-pointer" onClick={advance} />
          </div>
        )}

        {/* Viewer count button (bottom, own story only) */}
        {isOwn && !confirming && (
          <button
            onClick={e => { e.stopPropagation(); openViewerSheet(); }}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:opacity-80"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <Eye size={14} color="rgba(255,255,255,0.9)" />
            <span className="text-xs font-semibold text-white">
              {viewerCount === null ? "Views" : viewerCount === 0 ? "No views yet" : `${viewerCount} view${viewerCount !== 1 ? "s" : ""}`}
            </span>
          </button>
        )}

        {/* Viewer list sheet */}
        {viewerSheet && (
          <div
            className="absolute inset-0 z-20 flex flex-col justify-end"
            onClick={() => setViewerSheet(false)}
          >
            <div
              className="rounded-t-3xl overflow-hidden flex flex-col"
              style={{ background: "rgba(18,18,18,0.98)", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "60%" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Sheet handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <Eye size={16} color="#9B7CF5" />
                  <span className="text-white font-semibold text-sm">
                    {viewersLoading ? "Loading…" : `${viewerCount ?? 0} viewer${(viewerCount ?? 0) !== 1 ? "s" : ""}`}
                  </span>
                </div>
                <button onClick={() => setViewerSheet(false)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <X size={13} color="rgba(255,255,255,0.6)" />
                </button>
              </div>

              <div className="h-px mx-4" style={{ background: "rgba(255,255,255,0.07)" }} />

              {/* Viewers list */}
              <div className="overflow-y-auto flex-1 py-2" style={{ scrollbarWidth: "none" }}>
                {viewersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={22} className="animate-spin" style={{ color: "#9B7CF5" }} />
                  </div>
                ) : viewers.length === 0 ? (
                  <div className="flex flex-col items-center py-8 gap-2">
                    <Eye size={28} color="rgba(255,255,255,0.2)" />
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>No one has viewed this yet</p>
                  </div>
                ) : (
                  viewers.map((v, i) => {
                    const name   = v.profile?.display_name ?? v.profile?.username ?? "Unknown";
                    const handle = v.profile?.username ?? "";
                    const avatar = v.profile?.avatar_url;
                    return (
                      <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                        <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: avatar ? undefined : "linear-gradient(135deg,#361E7B,#7C5BF5)" }}>
                          {avatar
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
                            : name[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white leading-none mb-0.5 truncate">{name}</p>
                          {handle && <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.45)" }}>@{handle}</p>}
                        </div>
                        <span className="text-[10px] shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {timeAgo(v.viewedAt)} ago
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm sheet */}
        {confirming && (
          <div
            className="absolute inset-0 z-20 flex flex-col justify-end"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
            onClick={() => setConfirming(false)}
          >
            <div
              className="mx-3 mb-4 rounded-2xl overflow-hidden"
              style={{ background: "rgba(22,22,22,0.98)", border: "1px solid rgba(255,255,255,0.08)" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="px-5 pt-5 pb-3 text-center">
                <p className="text-white font-semibold text-sm mb-1">Delete this story?</p>
                <p className="text-white/50 text-xs">
                  {total > 1
                    ? `This will remove story ${frameIdx + 1} of ${total}. Your other stories stay.`
                    : "This will remove your story permanently."}
                </p>
              </div>
              <div className="h-px mx-4" style={{ background: "rgba(255,255,255,0.08)" }} />
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full py-4 text-sm font-semibold transition-opacity disabled:opacity-50"
                style={{ color: "#ef4444" }}
              >
                {deleting ? "Deleting…" : "Delete Story"}
              </button>
              <div className="h-px mx-4" style={{ background: "rgba(255,255,255,0.08)" }} />
              <button onClick={() => setConfirming(false)} className="w-full py-4 text-sm font-medium text-white/60 hover:text-white/80 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Previous story peek */}
      {storyIdx > 0 && (
        <button
          onClick={() => { setStoryIdx(s => s - 1); setFrameIdx(0); setProgress(0); }}
          className="absolute left-4 lg:left-[calc(50%-260px)] top-1/2 -translate-y-1/2 overflow-hidden transition-transform hover:scale-105"
          style={{ width: 80, height: 130, borderRadius: 12, opacity: 0.5 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stories[storyIdx - 1].frames[0].image} alt="" className="w-full h-full object-cover" />
        </button>
      )}

      {/* Next story peek */}
      {storyIdx < stories.length - 1 && (
        <button
          onClick={() => { setStoryIdx(s => s + 1); setFrameIdx(0); setProgress(0); }}
          className="absolute right-4 lg:right-[calc(50%-260px)] top-1/2 -translate-y-1/2 overflow-hidden transition-transform hover:scale-105"
          style={{ width: 80, height: 130, borderRadius: 12, opacity: 0.5 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stories[storyIdx + 1].frames[0].image} alt="" className="w-full h-full object-cover" />
        </button>
      )}
    </div>
  );
}
