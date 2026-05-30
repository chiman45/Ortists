"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface StoryFrame { image: string; duration: number }
export interface StoryItem {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  role: string;
  time: string;
  frames: StoryFrame[];
}

interface Props {
  stories: StoryItem[];
  startIndex: number;
  onClose: () => void;
}

export default function StoryViewer({ stories, startIndex, onClose }: Props) {
  const [storyIdx, setStoryIdx] = useState(startIndex);
  const [frameIdx, setFrameIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef  = useRef<number>(0);
  const rafRef    = useRef<number>(0);

  const story  = stories[storyIdx];
  const frame  = story.frames[frameIdx];
  const total  = story.frames.length;

  function advance() {
    if (frameIdx < total - 1) {
      setFrameIdx(f => f + 1);
      setProgress(0);
    } else if (storyIdx < stories.length - 1) {
      setStoryIdx(s => s + 1);
      setFrameIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  }

  function goBack() {
    if (frameIdx > 0) {
      setFrameIdx(f => f - 1);
      setProgress(0);
    } else if (storyIdx > 0) {
      setStoryIdx(s => s - 1);
      setFrameIdx(0);
      setProgress(0);
    }
  }

  // Animate progress bar with requestAnimationFrame
  useEffect(() => {
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
  }, [storyIdx, frameIdx]);

  // Key navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") advance();
      if (e.key === "ArrowLeft")  goBack();
      if (e.key === "Escape")     onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyIdx, frameIdx]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Story card */}
      <div
        className="relative overflow-hidden select-none"
        style={{
          width: "min(420px, 100vw)",
          height: "min(88vh, 860px)",
          borderRadius: 20,
          background: "#111",
        }}
      >
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frame.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Gradient overlay at top */}
        <div
          className="absolute inset-x-0 top-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)" }}
        />

        {/* Progress bars */}
        <div className="absolute top-3 inset-x-3 flex gap-1 z-10">
          {story.frames.map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-full overflow-hidden"
              style={{ height: 2.5, background: "rgba(255,255,255,0.3)" }}
            >
              <div
                style={{
                  height: "100%",
                  background: "#fff",
                  width: i < frameIdx ? "100%" : i === frameIdx ? `${progress}%` : "0%",
                  transition: i === frameIdx ? "none" : undefined,
                  borderRadius: "inherit",
                }}
              />
            </div>
          ))}
        </div>

        {/* User info */}
        <div className="absolute top-7 inset-x-3 flex items-center gap-3 z-10 pt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="relative shrink-0">
            <img
              src={story.avatar}
              alt={story.displayName}
              className="w-10 h-10 rounded-full object-cover"
              style={{ border: "2px solid rgba(255,255,255,0.8)" }}
            />
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black"
              style={{ background: "#10B981" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-none mb-0.5">{story.displayName}</p>
            <p className="text-[11px] text-white/70">{story.role} · {story.time}</p>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-opacity hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
          >
            <X size={16} color="#fff" />
          </button>
        </div>

        {/* Tap zones */}
        <div className="absolute inset-0 flex">
          <div className="flex-1 cursor-pointer" onClick={goBack} />
          <div className="flex-1 cursor-pointer" onClick={advance} />
        </div>
      </div>

      {/* Previous story peek (left) */}
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

      {/* Next story peek (right) */}
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
