"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import { type Comment } from "@/lib/db/comments";
import { type Post } from "@/lib/db/posts";
import { allPosts } from "@/lib/mockData";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Bookmark, Heart, Send, Share2, UserPlus } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import MasonryGrid from "@/components/feed/MasonryGrid";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function FeedPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const isUUID = UUID_RE.test(id);

  const [post, setPost]               = useState<Post | null>(null);
  const [author, setAuthor]           = useState<{ name: string; username: string; avatar: string; clerkId: string } | null>(null);
  const [liked, setLiked]             = useState(false);
  const [saved, setSaved]             = useState(false);
  const [following, setFollowing]     = useState(false);
  const [likeCount, setLikeCount]     = useState(0);
  const [comments, setComments]       = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading]         = useState(true);

  const mockPost = allPosts.find(p => p.id === id) ?? allPosts[0];
  const related  = allPosts.filter(p => p.id !== mockPost.id && p.category === mockPost.category).slice(0, 8);

  useEffect(() => {
    if (!isUUID) { setLikeCount(mockPost.likes); setLoading(false); return; }

    const userQ = user ? `&userId=${user.id}` : "";

    Promise.all([
      fetch(`/api/posts/${id}?${userQ}`).then(r => r.json()),
      fetch(`/api/comments?postId=${id}`).then(r => r.json()),
    ]).then(([postData, commentData]) => {
      if (postData.post) {
        const p: Post = postData.post;
        setPost(p);
        setLikeCount(p.likes_count);
        setLiked(postData.liked ?? false);
        setSaved(postData.saved ?? false);

        // Fetch the real author profile using user_id (clerk_id)
        fetch(`/api/profiles?username=${p.user_id}`)
          .then(r => r.json())
          .then(({ profile }) => {
            if (profile) {
              setAuthor({
                name:     profile.display_name ?? profile.username ?? p.author_name,
                username: profile.username ?? p.author_username,
                avatar:   profile.avatar_url ?? p.author_avatar ?? "",
                clerkId:  profile.clerk_id,
              });
            }
          });
      }
      setComments(commentData.comments ?? []);
      setLoading(false);
    });

    // Check following status separately
    if (user && post?.user_id) {
      fetch(`/api/follows?followerId=${user.id}&followingId=${post.user_id}`)
        .then(r => r.json())
        .then(({ following: f }) => setFollowing(f));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  // Check following once post is loaded
  useEffect(() => {
    if (!user || !post?.user_id || !isUUID) return;
    fetch(`/api/follows?followerId=${user.id}&followingId=${post.user_id}`)
      .then(r => r.json())
      .then(({ following: f }) => setFollowing(f));
  }, [user, post?.user_id, isUUID]);

  async function handleLike() {
    if (!user || !isUUID) { setLiked(l => !l); setLikeCount(c => liked ? Math.max(0, c - 1) : c + 1); return; }
    const action = liked ? "unlike" : "like";
    setLiked(!liked);
    setLikeCount(c => liked ? Math.max(0, c - 1) : c + 1);
    await fetch(`/api/posts/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId: user.id }),
    });
  }

  async function handleSave() {
    if (!user || !isUUID) { setSaved(s => !s); return; }
    const action = saved ? "unsave" : "save";
    setSaved(!saved);
    await fetch(`/api/posts/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId: user.id }),
    });
  }

  async function handleFollow() {
    if (!user || !post?.user_id) return;
    const method = following ? "DELETE" : "POST";
    setFollowing(!following);
    await fetch("/api/follows", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followerId: user.id, followingId: post.user_id }),
    });
  }

  async function submitComment() {
    if (!commentText.trim()) return;
    if (!isUUID || !user) {
      setComments(prev => [{
        id: String(Date.now()), user_id: user?.id ?? "anon",
        author_name: user?.fullName ?? "You", author_avatar: user?.imageUrl ?? null,
        post_id: id, text: commentText.trim(), created_at: new Date().toISOString(),
      }, ...prev]);
      setCommentText("");
      return;
    }
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        author_name: user.fullName ?? user.username ?? "You",
        author_avatar: user.imageUrl,
        post_id: id,
        text: commentText.trim(),
      }),
    });
    const { comment } = await res.json();
    if (comment) { setComments(prev => [comment, ...prev]); setCommentText(""); }
  }

  const img    = post?.image_url ?? mockPost.imageUrl;
  const title  = post?.title    ?? mockPost.title;
  const cat    = post?.category ?? mockPost.category;
  const desc   = post?.description;
  const uname  = author?.username  ?? post?.author_username ?? mockPost.username;
  const udisp  = author?.name      ?? post?.author_name     ?? mockPost.username;
  const avatar = author?.avatar    ?? post?.author_avatar   ?? mockPost.avatar;
  const profileHref = post?.user_id ? `/u/${post.user_id}` : `/u/${uname}`;

  return (
    <div className="flex min-h-screen"
      style={{ background: "radial-gradient(ellipse 60% 50% at 8% 50%, rgba(54,30,123,0.16) 0%, transparent 55%),var(--bg)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">
        <MainHeader />
        <main className="flex-1 pb-24 lg:pb-8">
          <div className="px-4 md:px-8 pt-5 pb-4">
            <Link href="/feed" className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--text-4)" }}>
              <ArrowLeft size={15} /> Back to Feed
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row" style={{ minHeight: "calc(100vh - 180px)" }}>
            {/* Image */}
            <div className="lg:sticky lg:top-15 lg:self-start flex-1 flex items-center justify-center px-4 md:px-8 pb-6 lg:pb-0"
              style={{ maxWidth: "55%" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={title} className="rounded-2xl w-full object-cover"
                style={{ maxHeight: "80vh", border: "1px solid var(--border)" }} />
            </div>

            {/* Right panel */}
            <div className="w-full lg:w-105 shrink-0 flex flex-col border-l" style={{ borderColor: "var(--border)" }}>
              {/* Artist */}
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <Link href={profileHref} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatar} alt={udisp} className="w-10 h-10 rounded-full object-cover"
                    style={{ border: "2px solid rgba(124,91,245,0.4)" }} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={profileHref} className="hover:underline">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{udisp}</p>
                  </Link>
                  <p className="text-xs" style={{ color: "var(--text-5)" }}>@{uname} · {cat}</p>
                </div>
                {user?.id !== post?.user_id && (
                  <button onClick={handleFollow}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:opacity-80"
                    style={following
                      ? { background: "rgba(124,91,245,0.25)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.5)" }
                      : { background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.3)" }}>
                    <UserPlus size={12} />
                    {following ? "Following" : "Follow"}
                  </button>
                )}
              </div>

              {/* Caption */}
              <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-1)" }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-4)" }}>
                  {desc ?? `A stunning piece from ${uname} exploring the world of ${cat}.`}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button onClick={handleLike} className="flex items-center gap-1.5 text-xs transition-all"
                    style={{ color: liked ? "#f43f5e" : "var(--text-4)" }}>
                    <Heart size={16} fill={liked ? "#f43f5e" : "none"} stroke={liked ? "#f43f5e" : "currentColor"} />
                    {likeCount}
                  </button>
                  <button onClick={handleSave} className="flex items-center gap-1.5 text-xs transition-all"
                    style={{ color: saved ? "#9B7CF5" : "var(--text-4)" }}>
                    <Bookmark size={16} fill={saved ? "#9B7CF5" : "none"} stroke={saved ? "#9B7CF5" : "currentColor"} />
                    {saved ? "Saved" : "Save"}
                  </button>
                  <button onClick={() => navigator.clipboard?.writeText(window.location.href)}
                    className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
                    style={{ color: "var(--text-4)" }}>
                    <Share2 size={16} /> Share
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4"
                style={{ maxHeight: "calc(100vh - 380px)", scrollbarWidth: "none" }}>
                {loading && <p className="text-xs text-center" style={{ color: "var(--text-5)" }}>Loading…</p>}
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.author_avatar ?? "https://i.pravatar.cc/40"} alt={c.author_name}
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold mr-1.5" style={{ color: "var(--text-1)" }}>{c.author_name}</span>
                      <span className="text-xs" style={{ color: "var(--text-3)" }}>{c.text}</span>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--text-5)" }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {!loading && comments.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: "var(--text-5)" }}>No comments yet. Be the first!</p>
                )}
              </div>

              {/* Comment input */}
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: "1px solid var(--border)" }}>
                {user && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={user.imageUrl} alt="you" className="w-7 h-7 rounded-full object-cover shrink-0" />
                )}
                <input value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitComment()}
                  placeholder="Add a comment…"
                  className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-1)" }} />
                <button onClick={submitComment} disabled={!commentText.trim()}
                  className="transition-opacity disabled:opacity-30" style={{ color: "#9B7CF5" }}>
                  <Send size={17} />
                </button>
              </div>
            </div>
          </div>

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
