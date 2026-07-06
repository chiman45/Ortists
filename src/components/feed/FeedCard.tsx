"use client";

import { Post } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";
import { Heart, Loader2, MessageCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

interface FeedCardProps {
  post: Post;
  priority?: boolean;
  onDelete?: (id: string) => void;
}

function fmt(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }
const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export default function FeedCard({ post, priority = false, onDelete }: FeedCardProps) {
  const { user } = useUser();
  const [liked, setLiked]           = useState(false);
  const [count, setCount]           = useState(post.likes);
  const [pending, setPending]       = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const isOwn = !!user && !!post.userId && post.userId === user.id;

  // Fetch real liked state on mount — prevents duplicate likes
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

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !isUUID(post.id) || pending) return;
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
    <Link href={`/feed/${post.id}`} className="block break-inside-avoid mb-4 group">
      {/* Image + delete overlay */}
      <div className="relative overflow-hidden rounded-2xl transition-all duration-300"
        style={{ boxShadow: "0 4px 20px var(--shadow)" }}>
        <Image
          src={post.imageUrl}
          alt={post.title}
          width={post.imageWidth}
          height={post.imageHeight}
          priority={priority}
          className="w-full object-cover transition-all duration-300 group-hover:scale-[1.03] group-hover:brightness-110"
          sizes="(max-width: 768px) 50vw, 33vw"
        />

        {/* Trash button — own posts, appears on hover */}
        {isOwn && !deleteMode && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setDeleteMode(true); }}
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
            onClick={e => { e.preventDefault(); e.stopPropagation(); }}
          >
            <p className="text-white text-sm font-semibold text-center px-4 leading-snug">
              Delete this post?
            </p>
            <div className="flex gap-2">
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); setDeleteMode(false); }}
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
    </Link>
  );
}
