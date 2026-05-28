"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import { allPosts } from "@/lib/mockData";
import { Heart, Bookmark, Share2, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import MasonryGrid from "@/components/feed/MasonryGrid";

const MOCK_COMMENTS = [
  { id: 1, user: "mila.design",   avatar: "https://i.pravatar.cc/80?img=5",  text: "Absolutely stunning work! The colors are so vibrant 🔥", time: "2h" },
  { id: 2, user: "jin_3d",        avatar: "https://i.pravatar.cc/80?img=7",  text: "This is incredible. What medium did you use?", time: "3h" },
  { id: 3, user: "sara.motion",   avatar: "https://i.pravatar.cc/80?img=9",  text: "Love the composition, very dynamic!", time: "5h" },
  { id: 4, user: "noah_illus",    avatar: "https://i.pravatar.cc/80?img=12", text: "Saved this immediately 😍", time: "6h" },
  { id: 5, user: "priya.ux",      avatar: "https://i.pravatar.cc/80?img=16", text: "The lighting is perfect, great eye!", time: "8h" },
  { id: 6, user: "luca.brand",    avatar: "https://i.pravatar.cc/80?img=20", text: "Would love to collaborate on something like this!", time: "10h" },
  { id: 7, user: "yuki_type",     avatar: "https://i.pravatar.cc/80?img=22", text: "This belongs in a gallery 🎨", time: "12h" },
];

export default function FeedPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const post = allPosts.find(p => p.id === id) ?? allPosts[0];
  const related = allPosts.filter(p => p.id !== post.id && p.category === post.category).slice(0, 8);

  const [liked, setLiked]       = useState(false);
  const [saved, setSaved]       = useState(false);
  const [comment, setComment]   = useState("");
  const [comments, setComments] = useState(MOCK_COMMENTS);

  function submitComment() {
    if (!comment.trim()) return;
    setComments(prev => [{
      id: Date.now(),
      user: "you",
      avatar: "https://i.pravatar.cc/80?img=3",
      text: comment.trim(),
      time: "now",
    }, ...prev]);
    setComment("");
  }

  return (
    <div
      className="flex min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 8% 50%, rgba(54,30,123,0.16) 0%, transparent 55%)," +
          "var(--bg)",
      }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">
        <MainHeader />

        <main className="flex-1 pb-24 lg:pb-8">

          {/* Back */}
          <div className="px-4 md:px-8 pt-5 pb-4">
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--text-4)" }}
            >
              <ArrowLeft size={15} /> Back to Feed
            </Link>
          </div>

          {/* Main post layout */}
          <div className="flex flex-col lg:flex-row" style={{ minHeight: "calc(100vh - 180px)" }}>

            {/* Left: Image */}
            <div
              className="lg:sticky lg:top-[60px] lg:self-start flex-1 flex items-center justify-center px-4 md:px-8 pb-6 lg:pb-0"
              style={{ maxWidth: "55%" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageUrl}
                alt={post.title}
                className="rounded-2xl w-full object-cover"
                style={{ maxHeight: "80vh", border: "1px solid var(--border)" }}
              />
            </div>

            {/* Right: details + comments */}
            <div
              className="w-full lg:w-[420px] shrink-0 flex flex-col border-l"
              style={{ borderColor: "var(--border)" }}
            >
              {/* Artist info */}
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.avatar} alt={post.username} className="w-10 h-10 rounded-full object-cover" style={{ border: "2px solid rgba(124,91,245,0.4)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{post.username}</p>
                  <p className="text-xs" style={{ color: "var(--text-5)" }}>{post.category}</p>
                </div>
                <button
                  className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                  style={{ background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.3)" }}
                >
                  Follow
                </button>
              </div>

              {/* Post caption */}
              <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-1)" }}>{post.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-4)" }}>
                  A stunning piece from {post.username} exploring the world of {post.category}. Created with passion and precision.
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => setLiked(v => !v)}
                    className="flex items-center gap-1.5 text-xs transition-all"
                    style={{ color: liked ? "#f43f5e" : "var(--text-4)" }}
                  >
                    <Heart size={16} fill={liked ? "#f43f5e" : "none"} stroke={liked ? "#f43f5e" : "currentColor"} />
                    {post.likes + (liked ? 1 : 0)}
                  </button>
                  <button
                    onClick={() => setSaved(v => !v)}
                    className="flex items-center gap-1.5 text-xs transition-all"
                    style={{ color: saved ? "#9B7CF5" : "var(--text-4)" }}
                  >
                    <Bookmark size={16} fill={saved ? "#9B7CF5" : "none"} stroke={saved ? "#9B7CF5" : "currentColor"} />
                    Save
                  </button>
                  <button className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70" style={{ color: "var(--text-4)" }}>
                    <Share2 size={16} /> Share
                  </button>
                </div>
              </div>

              {/* Comments list */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4" style={{ maxHeight: "calc(100vh - 380px)" }}>
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.avatar} alt={c.user} className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold mr-1.5" style={{ color: "var(--text-1)" }}>{c.user}</span>
                      <span className="text-xs" style={{ color: "var(--text-3)" }}>{c.text}</span>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--text-5)" }}>{c.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment input */}
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: "1px solid var(--border)" }}>
                <input
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitComment()}
                  placeholder="Add a comment…"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--text-1)" }}
                />
                <button
                  onClick={submitComment}
                  disabled={!comment.trim()}
                  className="transition-opacity disabled:opacity-30"
                  style={{ color: "#9B7CF5" }}
                >
                  <Send size={17} />
                </button>
              </div>
            </div>
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <div className="px-4 md:px-8 pt-10">
              <h3 className="text-lg font-bold mb-5" style={{ color: "var(--text-1)" }}>More like this</h3>
              <MasonryGrid posts={related} />
            </div>
          )}

        </main>
      </div>

      <BottomNav />
    </div>
  );
}
