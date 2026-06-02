"use client";

import { Post } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";
import { likePost, unlikePost } from "@/lib/db/posts";
import { Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

interface FeedCardProps { post: Post }

function fmt(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }
const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export default function FeedCard({ post }: FeedCardProps) {
  const { user } = useUser();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(post.likes);

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (liked) {
      setLiked(false); setCount(c => Math.max(0, c - 1));
      if (user && isUUID(post.id)) await unlikePost(post.id, user.id);
    } else {
      setLiked(true); setCount(c => c + 1);
      if (user && isUUID(post.id)) await likePost(post.id, user.id);
    }
  }

  return (
    <Link href={`/feed/${post.id}`} className="block break-inside-avoid mb-4 group">
      <div
        className="overflow-hidden rounded-2xl transition-all duration-300"
        style={{ boxShadow: "0 4px 20px var(--shadow)" }}
      >
        <Image
          src={post.imageUrl}
          alt={post.title}
          width={post.imageWidth}
          height={post.imageHeight}
          className="w-full object-cover transition-all duration-300 group-hover:scale-[1.03] group-hover:brightness-110"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
      </div>
      <div className="flex items-center gap-2 mt-2.5 px-0.5">
        <Avatar name={post.username} size={26} />
        <span className="text-sm font-medium flex-1 truncate" style={{ color: "var(--text-2)" }}>
          {post.username.replace(/_/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
        </span>
        <button
          onClick={handleLike}
          className="flex items-center gap-1 text-xs transition-colors shrink-0"
          style={{ color: liked ? "#f43f5e" : "var(--text-5)" }}
        >
          <Heart size={14} fill={liked ? "currentColor" : "none"} />
          <span>{fmt(count)}</span>
        </button>
        <div className="flex items-center gap-1 text-xs shrink-0" style={{ color: "var(--text-5)" }}>
          <MessageCircle size={14} />
          <span>{post.comments}</span>
        </div>
      </div>
    </Link>
  );
}
