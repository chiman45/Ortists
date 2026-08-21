"use client";

import { Post } from "@/lib/types";
import { type Post as DbPost } from "@/lib/db/posts";
import Avatar from "@/components/ui/Avatar";
import AuthPromptModal from "@/components/ui/AuthPromptModal";
import PostModal from "@/components/ui/PostModal";
import { Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface FeedCardProps {
  post: Post;
  dbPost?: DbPost;
  priority?: boolean;
}

function fmt(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }
const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const isVideoUrl = (url: string) => /\.(mp4|webm|mov|avi|mkv|ogv)(\?|$)/i.test(url);

function parseGallery(raw: string): string[] | null {
  if (!raw.startsWith("[")) return null;
  try { const a = JSON.parse(raw); return Array.isArray(a) && a.length > 0 ? a : null; }
  catch { return null; }
}

export default function FeedCard({ post, dbPost, priority = false }: FeedCardProps) {
  const { user } = useUser();
  const router = useRouter();
  const [liked, setLiked]           = useState(false);
  const [count, setCount]           = useState(post.likes);
  const [pending, setPending]       = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [modalPost, setModalPost]   = useState<DbPost | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOwn = !!user && !!post.userId && post.userId === user.id;

  useEffect(() => {
    if (!user || !isUUID(post.id)) return;
    fetch(`/api/posts/${post.id}?userId=${user.id}`)
      .then(r => r.json())
      .then(({ liked: alreadyLiked, post: p }) => {
        setLiked(!!alreadyLiked);
        if (p?.likes_count !== undefined) setCount(p.likes_count);
      })
      .catch(() => {});
  }, [post.id, user]);

  // Cleanup timer on unmount
  useEffect(() => () => { if (clickTimer.current) clearTimeout(clickTimer.current); }, []);

  function handleCardClick(e: React.MouseEvent) {
    // Ignore clicks on action buttons
    if ((e.target as HTMLElement).closest("button")) return;

    if (clickTimer.current) {
      // Second click within 300ms = double click → navigate to full page
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      if (!user) { setPromptOpen(true); return; }
      router.push(`/feed/${post.id}`);
    } else {
      // First click → wait to see if double click arrives
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        // Single click → open modal
        if (!user) { setPromptOpen(true); return; }
        if (dbPost) {
          setModalPost(dbPost);
        } else {
          // Fetch full post if not available
          fetch(`/api/posts/${post.id}?userId=${user.id}`)
            .then(r => r.json())
            .then(({ post: p }) => p && setModalPost(p))
            .catch(() => {});
        }
      }, 280);
    }
  }

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { setPromptOpen(true); return; }
    if (!isUUID(post.id) || pending) return;
    setPending(true);
    if (liked) {
      setLiked(false);
      setCount(c => Math.max(0, c - 1));
      await fetch(`/api/posts/${post.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlike", userId: user.id }),
      });
    } else {
      setLiked(true);
      setCount(c => c + 1);
      await fetch(`/api/posts/${post.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like", userId: user.id }),
      });
    }
    setPending(false);
  }

  return (
    <>
    <div
      className="block break-inside-avoid mb-4 group cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image + delete overlay */}
      <div className="relative overflow-hidden rounded-2xl transition-all duration-300"
        style={{ boxShadow: "0 4px 20px var(--shadow)" }}>
        {(() => {
          const gallery = parseGallery(post.imageUrl);
          if (gallery) {
            const total = gallery.length;
            const idx = Math.min(carouselIdx, total - 1);
            const prev = (e: React.MouseEvent) => {
              e.stopPropagation();
              setCarouselIdx(i => Math.max(0, i - 1));
            };
            const next = (e: React.MouseEvent) => {
              e.stopPropagation();
              setCarouselIdx(i => Math.min(total - 1, i + 1));
            };
            return (
              <div
                className="relative"
                onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
                onTouchEnd={e => {
                  if (touchStartX.current === null) return;
                  const diff = touchStartX.current - e.changedTouches[0].clientX;
                  if (diff > 40) setCarouselIdx(i => Math.min(total - 1, i + 1));
                  else if (diff < -40) setCarouselIdx(i => Math.max(0, i - 1));
                  touchStartX.current = null;
                }}
              >
                <Image
                  src={gallery[idx]}
                  alt={post.title}
                  width={post.imageWidth}
                  height={post.imageHeight}
                  priority={priority && idx === 0}
                  className="w-full object-cover transition-all duration-300 group-hover:brightness-105"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />

                {/* Counter badge */}
                {total > 1 && (
                  <span
                    className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                    style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
                  >
                    {idx + 1}/{total}
                  </span>
                )}

                {/* Prev arrow */}
                {idx > 0 && (
                  <button
                    onClick={prev}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
                  >
                    <span className="text-white text-xs font-bold">‹</span>
                  </button>
                )}

                {/* Next arrow */}
                {idx < total - 1 && (
                  <button
                    onClick={next}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
                  >
                    <span className="text-white text-xs font-bold">›</span>
                  </button>
                )}

                {/* Dot indicators */}
                {total > 1 && total <= 10 && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {gallery.map((_, i) => (
                      <button
                        key={i}
                        onClick={e => { e.stopPropagation(); setCarouselIdx(i); }}
                        className="rounded-full transition-all"
                        style={{
                          width: i === idx ? 14 : 5,
                          height: 5,
                          background: i === idx ? "#fff" : "rgba(255,255,255,0.45)",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          }
          if (isVideoUrl(post.imageUrl)) {
            return (
              <div className="relative">
                <video
                  src={post.imageUrl}
                  className="w-full object-cover"
                  style={{ maxHeight: 400 }}
                  muted loop playsInline preload="metadata"
                  onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                  onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                />
                <span
                  className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
                >
                  ▶ Video
                </span>
              </div>
            );
          }
          return (
            <Image
              src={post.imageUrl}
              alt={post.title}
              width={post.imageWidth}
              height={post.imageHeight}
              priority={priority}
              className="w-full object-cover transition-all duration-300 group-hover:scale-[1.03] group-hover:brightness-110"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          );
        })()}

        {/* Double-click hint overlay — shows on hover */}
        <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", color: "rgba(255,255,255,0.7)" }}>
            double-click to open full page
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 mt-2.5 px-0.5">
        <Avatar name={post.username} src={post.avatar} size={26} />
        <span className="text-sm font-medium flex-1 truncate min-w-0" style={{ color: "var(--text-2)" }}>
          {post.username}
        </span>
        <button
          onClick={handleLike}
          disabled={pending}
          className="flex items-center gap-1 text-xs transition-colors shrink-0 disabled:opacity-60"
          style={{ color: liked ? "#f43f5e" : "var(--text-5)" }}
        >
          <Heart size={13} fill={liked ? "currentColor" : "none"} />
          <span>{fmt(count)}</span>
        </button>
        <div className="flex items-center gap-1 text-xs shrink-0" style={{ color: "var(--text-5)" }}>
          <MessageCircle size={13} />
          <span>{post.comments}</span>
        </div>
      </div>
    </div>

    {modalPost && (
      <PostModal
        post={modalPost}
        isOwner={isOwn}
        ownerId={user?.id}
        currentUserId={user?.id}
        onClose={() => setModalPost(null)}
        onUpdate={updated => setModalPost(updated)}
      />
    )}
    {promptOpen && <AuthPromptModal onClose={() => setPromptOpen(false)} />}
    </>
  );
}
