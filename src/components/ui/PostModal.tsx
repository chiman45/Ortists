"use client";

import { type Post as DbPost } from "@/lib/db/posts";
import { Bookmark, Check, Heart, Pencil, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const isVideoUrl = (u: string) => /\.(mp4|webm|mov|avi|mkv|ogv)(\?|$)/i.test(u);

function parseImages(raw: string): string[] {
  if (raw.startsWith("[")) {
    try {
      const a = JSON.parse(raw);
      if (Array.isArray(a) && a.length > 0) return a;
    } catch { /* fall through */ }
  }
  return [raw];
}

interface Props {
  post: DbPost;
  isOwner: boolean;
  ownerId?: string;
  onClose: () => void;
  onUpdate?: (updated: DbPost) => void;
}

export default function PostModal({ post: initialPost, isOwner, ownerId, onClose, onUpdate }: Props) {
  const [post, setPost] = useState(initialPost);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(initialPost.title);
  const [editDesc, setEditDesc] = useState(initialPost.description ?? "");
  const [editCategory, setEditCategory] = useState(initialPost.category ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [carouselIdx, setCarouselIdx] = useState(0);
  const images = parseImages(post.image_url);
  const total = images.length;
  const touchStartX = useRef<number | null>(null);

  const lastDist = useRef<number | null>(null);
  const lastPan = useRef<{ x: number; y: number } | null>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());

  function goTo(i: number) { setCarouselIdx(i); resetZoom(); }
  function goPrev() { if (carouselIdx > 0) goTo(carouselIdx - 1); }
  function goNext() { if (carouselIdx < total - 1) goTo(carouselIdx + 1); }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")  goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, carouselIdx, total]);

  const resetZoom = () => { setZoom(1); setPanX(0); setPanY(0); };

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom(z => Math.min(5, Math.max(1, z * (e.deltaY > 0 ? 0.88 : 1.14))));
  }

  function handlePointerDown(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) lastPan.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastDist.current !== null) setZoom(z => Math.min(5, Math.max(1, z * (dist / lastDist.current!))));
      lastDist.current = dist;
    } else if (pts.length === 1 && zoom > 1 && lastPan.current) {
      setPanX(x => x + (e.clientX - lastPan.current!.x));
      setPanY(y => y + (e.clientY - lastPan.current!.y));
      lastPan.current = { x: e.clientX, y: e.clientY };
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) lastDist.current = null;
    if (pointers.current.size === 0) lastPan.current = null;
  }

  async function saveEdit() {
    if (!ownerId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: ownerId, title: editTitle, description: editDesc, category: editCategory }),
      });
      const data = await res.json();
      if (data.error) { setSaveError(data.error); return; }
      const updated = data.post as DbPost;
      setPost(updated);
      onUpdate?.(updated);
      setEditing(false);
    } catch {
      setSaveError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditTitle(post.title);
    setEditDesc(post.description ?? "");
    setEditCategory(post.category ?? "");
    setEditing(false);
    setSaveError(null);
  }

  const src = images[Math.min(carouselIdx, total - 1)];
  const isVid = isVideoUrl(src);
  const imgStyle: React.CSSProperties = {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
    transition: "none",
    touchAction: "none",
    userSelect: "none",
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full flex flex-col md:flex-row rounded-2xl overflow-hidden"
        style={{
          maxWidth: 980,
          maxHeight: "92vh",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "0 32px 96px rgba(0,0,0,0.75)",
        }}
      >
        {/* ── Image panel ── */}
        <div
          className="flex-1 relative overflow-hidden flex items-center justify-center"
          style={{
            background: "#060606",
            minHeight: 280,
            maxHeight: "60vh",
            cursor: zoom > 1 ? "grab" : "default",
            touchAction: "none",
          }}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={e => { if (zoom === 1) touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            if (zoom !== 1 || touchStartX.current === null) return;
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (diff > 50) goNext();
            else if (diff < -50) goPrev();
            touchStartX.current = null;
          }}
        >
          {isVid
            ? <video src={src} style={imgStyle} autoPlay muted loop playsInline />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={src} alt={post.title} draggable={false} style={imgStyle} />
          }

          {/* Counter badge */}
          {total > 1 && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold pointer-events-none"
              style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", color: "#fff" }}>
              {carouselIdx + 1} / {total}
            </div>
          )}

          {/* Zoom badge */}
          {zoom > 1.05 && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold pointer-events-none"
              style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", color: "rgba(255,255,255,0.75)" }}>
              {Math.round(zoom * 100)}%
            </div>
          )}

          {/* Prev arrow */}
          {total > 1 && carouselIdx > 0 && (
            <button
              onClick={goPrev}
              onPointerDown={e => e.stopPropagation()}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <span className="text-white font-bold text-lg leading-none">‹</span>
            </button>
          )}

          {/* Next arrow */}
          {total > 1 && carouselIdx < total - 1 && (
            <button
              onClick={goNext}
              onPointerDown={e => e.stopPropagation()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <span className="text-white font-bold text-lg leading-none">›</span>
            </button>
          )}

          {/* Dot indicators */}
          {total > 1 && total <= 10 && (
            <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  onPointerDown={e => e.stopPropagation()}
                  className="rounded-full transition-all"
                  style={{
                    width: i === carouselIdx ? 16 : 6,
                    height: 6,
                    background: i === carouselIdx ? "#fff" : "rgba(255,255,255,0.4)",
                  }}
                />
              ))}
            </div>
          )}

          {/* Zoom buttons */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
            {[
              { Icon: ZoomIn,    action: () => setZoom(z => Math.min(5, z * 1.3)) },
              { Icon: ZoomOut,   action: () => setZoom(z => Math.max(1, z / 1.3)) },
              ...(zoom > 1.05 ? [{ Icon: RotateCcw, action: resetZoom }] : []),
            ].map(({ Icon, action }, i) => (
              <button key={i} onClick={action}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}>
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Details panel ── */}
        <div
          className="w-full md:w-[308px] shrink-0 flex flex-col"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex-1 min-w-0">
              {editing
                ? <input value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus
                    className="w-full text-sm font-bold bg-transparent outline-none border-b"
                    style={{ color: "var(--text-1)", borderColor: "#7C5BF5", paddingBottom: 2 }} />
                : <p className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>{post.title}</p>
              }
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {isOwner && !editing && (
                <button onClick={() => setEditing(true)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-4)" }} title="Edit post">
                  <Pencil size={13} />
                </button>
              )}
              {editing && (
                <>
                  <button onClick={saveEdit} disabled={saving}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70 disabled:opacity-40"
                    style={{ color: "#10B981" }}>
                    {saving
                      ? <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin" style={{ borderColor: "transparent", borderTopColor: "#10B981" }} />
                      : <Check size={13} />}
                  </button>
                  <button onClick={cancelEdit}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
                    style={{ color: "var(--text-4)" }}>
                    <X size={13} />
                  </button>
                </>
              )}
              {!editing && (
                <button onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-4)" }}>
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4" style={{ scrollbarWidth: "none", minHeight: 0 }}>
            {/* Category */}
            {editing ? (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-5)" }}>Category</label>
                <input value={editCategory} onChange={e => setEditCategory(e.target.value)}
                  placeholder="e.g. Illustration, Photography"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
              </div>
            ) : post.category ? (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold w-fit"
                style={{ background: "rgba(124,91,245,0.12)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.25)" }}>
                {post.category}
              </span>
            ) : null}

            {/* Description */}
            {editing ? (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-5)" }}>Description</label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)}
                  placeholder="Describe this piece..." rows={4}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
              </div>
            ) : post.description ? (
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>{post.description}</p>
            ) : null}

            {saveError && <p className="text-xs" style={{ color: "#EF4444" }}>{saveError}</p>}

            {/* Stats */}
            <div className="flex items-center gap-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="flex items-center gap-1.5 text-sm">
                <Heart size={14} style={{ color: "var(--text-4)" }} />
                <span className="font-semibold" style={{ color: "var(--text-2)" }}>{post.likes_count}</span>
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <Bookmark size={14} style={{ color: "var(--text-4)" }} />
                <span className="font-semibold" style={{ color: "var(--text-2)" }}>{post.saves_count}</span>
              </span>
              <span className="text-[11px] ml-auto" style={{ color: "var(--text-5)" }}>
                {new Date(post.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map(t => (
                  <span key={t} className="px-2.5 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-5)" }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Medium / Style */}
            {(post.medium || post.style) && !editing && (
              <div className="flex flex-wrap gap-4 text-xs" style={{ color: "var(--text-5)" }}>
                {post.medium && <span>Medium: <strong style={{ color: "var(--text-3)" }}>{post.medium}</strong></span>}
                {post.style && <span>Style: <strong style={{ color: "var(--text-3)" }}>{post.style}</strong></span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
