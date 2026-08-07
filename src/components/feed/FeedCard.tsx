"use client";

import { Post } from "@/lib/types";
import { type Post as DbPost } from "@/lib/db/posts";
import Avatar from "@/components/ui/Avatar";
import AuthPromptModal from "@/components/ui/AuthPromptModal";
import PostModal from "@/components/ui/PostModal";
import { Heart, Loader2, MessageCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface FeedCardProps {
  post: Post;
  dbPost?: DbPost;
  priority?: boolean;
  onDelete?: (id: string) => void;
}

function fmt(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }
const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const isVideoUrl = (url: string) => /\.(mp4|webm|mov|avi|mkv|ogv)(\?|$)/i.test(url);

function parseGallery(raw: string): string[] | null {
  if (!raw.startsWith("[")) return null;
  try { const a = JSON.parse(raw); return Array.isArray(a) && a.length > 0 ? a : null; }
  catch { return null; }
}

export default function FeedCard({ post, dbPost, priority = false, onDelete }: FeedCardProps) {
  const { user } = useUser();
  const router = useRouter();
  const [liked, setLiked]           = useState(false);
  const [count, setCount]           = useState(post.likes);
  const [pending, setPending]       = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [modalPost, setModalPost]   = useState<DbPost | null>(null);
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

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !isUUID(post.id)) return;
    setDeleting(true);
    await fetch(`/api/posts/${post.id}?userId=${user.id}`, { method: "DELETE" }).catch(() => {});
    setDeleting(false);
    onDelete?.(post.id);
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
            return (
              <div className="relative">
                <Image
                  src={gallery[0]}
                  alt={post.title}
                  width={post.imageWidth}
                  height={post.imageHeight}
                  priority={priority}
                  className="w-full object-cover transition-all duration-300 group-hover:scale-[1.03] group-hover:brightness-110"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <span
                  className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
                >
                  ⊞ {gallery.length}
                </span>
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

        {/* Trash button — own posts, appears on hover */}
        {isOwn && !deleteMode && (
          <button
            onClick={e => { e.stopPropagation(); setDeleteMode(true); }}
            className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
            title="Delete post"
          >
            <Trash2 size={14} color="#fca5a5" />
          </button>
        )}

        {/* Delete confirm overlay */}
        {deleteMode && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl"
            style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)" }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-white text-sm font-semibold text-center px-4 leading-snug">
              Delete this post?
            </p>
            <div className="flex gap-2">
              <button
                onClick={e => { e.stopPropagation(); setDeleteMode(false); }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-70"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-opacity disabled:opacity-50"
                style={{ background: "#ef4444", color: "#fff" }}
              >
                {deleting
                  ? <><Loader2 size={11} className="animate-spin" /> Deleting…</>
                  : "Delete"}
              </button>
            </div>
          </div>
        )}
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
        onClose={() => setModalPost(null)}
        onUpdate={updated => setModalPost(updated)}
      />
    )}
    {promptOpen && <AuthPromptModal onClose={() => setPromptOpen(false)} />}
    </>
  );
}
