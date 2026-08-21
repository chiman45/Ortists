"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import PostDetailSkeleton from "@/components/ui/skeletons/PostDetailSkeleton";
import { type Comment } from "@/lib/db/comments";
import { type Post } from "@/lib/db/posts";
import { allPosts } from "@/lib/mockData";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Bookmark, Heart, Loader2, MessageCircle, Send, Share2, ShoppingBag, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

// ── Razorpay ──────────────────────────────────────────────────────
// `Window.Razorpay` is already declared in gallery/[id]/page.tsx — no redeclaration needed.
// We reference it via `window.Razorpay` at runtime; the shared CDN script provides it.
function loadRazorpayScript(): Promise<boolean> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve(true);
  return new Promise(resolve => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}
import MasonryGrid from "@/components/feed/MasonryGrid";
import ArtworkViewer from "@/components/ui/ArtworkViewer";
import { firstImage } from "@/lib/imageUrl";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function FeedPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const router = useRouter();
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
  const [viewerOpen, setViewerOpen]   = useState(false);
  const [paying, setPaying]           = useState(false);
  const [payDone, setPayDone]         = useState(false);
  const [payError, setPayError]       = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);

  const mockPost = allPosts.find(p => p.id === id) ?? allPosts[0];
  const related  = allPosts.filter(p => p.id !== mockPost.id && p.category === mockPost.category).slice(0, 8);

  // Effect 1: fetch post + comments as soon as the id is known — no auth wait
  useEffect(() => {
    if (!isUUID) { setLikeCount(mockPost.likes); setLoading(false); return; }

    Promise.all([
      fetch(`/api/posts/${id}`).then(r => r.json()),
      fetch(`/api/comments?postId=${id}`).then(r => r.json()),
    ]).then(([postData, commentData]) => {
      if (postData.post) {
        const p: Post = postData.post;
        setPost(p);
        setLikeCount(p.likes_count);

        // Author profile (sequential — needs p.user_id)
        fetch(`/api/profiles?username=${p.user_id}`)
          .then(r => r.json())
          .then(({ profile }) => {
            if (profile) setAuthor({
              name:     profile.display_name ?? profile.username ?? p.author_name,
              username: profile.username ?? p.author_username,
              avatar:   profile.avatar_url ?? p.author_avatar ?? "",
              clerkId:  profile.clerk_id,
            });
          });

        // Related posts (fire and forget)
        if (p.category) {
          fetch(`/api/posts?category=${encodeURIComponent(p.category)}&limit=9`)
            .then(r => r.json())
            .then(({ posts: rp }: { posts: Post[] }) => {
              setRelatedPosts((rp ?? [])
                .filter((rp: Post) => rp.id !== id)
                .slice(0, 8));
            }).catch(() => {});
        }
      }
      setComments(commentData.comments ?? []);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Effect 2: once Clerk resolves, fetch liked/saved/following state (non-blocking)
  useEffect(() => {
    if (!user || !isUUID) return;
    fetch(`/api/posts/${id}?userId=${user.id}`)
      .then(r => r.json())
      .then(({ liked: l, saved: s }) => { setLiked(!!l); setSaved(!!s); })
      .catch(() => {});
  }, [id, user?.id]); // eslint-disable-line

  // Effect 3: following status (needs both user + post.user_id)
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
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    const res = await fetch("/api/follows", {
      method: wasFollowing ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followerId: user.id, followingId: post.user_id }),
    });
    if (!res.ok) setFollowing(wasFollowing); // revert on failure
  }

  async function handleBuyNow() {
    if (paying) return;
    let currentDescPrice: string | null = null;
    if (post?.description) {
      try {
        const p = JSON.parse(post.description);
        if (p._price !== undefined) currentDescPrice = p._price ?? null;
      } catch { /* not JSON */ }
    }
    if (!currentDescPrice) return;
    const priceNum = parseInt(currentDescPrice.replace(/[^0-9]/g, ""), 10);
    if (!priceNum || priceNum < 1) { setPayError("Invalid price."); return; }
    setPayError(null);
    setPaying(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Could not load payment gateway. Please try again.");
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: priceNum * 100 }),
      });
      const { order_id, error: orderErr } = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderErr ?? "Order creation failed.");
      await new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          amount: priceNum * 100,
          currency: "INR",
          order_id,
          name: "Ortist",
          description: title || "Artwork purchase",
          image: "/logo.jpeg",
          prefill: { email: user?.emailAddresses?.[0]?.emailAddress },
          theme: { color: "#7C5BF5" },
          handler: async (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            const vRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(r),
            });
            if (!vRes.ok) { reject(new Error("Payment verification failed.")); return; }
            setPayDone(true);
            resolve();
          },
          modal: { ondismiss: () => reject(new Error("__dismissed__")) },
        });
        rzp.open();
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment failed.";
      if (msg !== "__dismissed__") setPayError(msg);
    } finally {
      setPaying(false);
    }
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

  const img      = firstImage(post?.image_url ?? mockPost.imageUrl);
  const isVideo  = /\.(mp4|webm|mov|avi|mkv|ogv)(\?|$)/i.test(img);
  const title    = post?.title    ?? mockPost.title;
  const cat    = post?.category ?? mockPost.category;

  // Parse structured description (gallery posts embed price as JSON)
  let descText: string | null = null;
  let descPrice: string | null = null;
  if (post?.description) {
    try {
      const parsed = JSON.parse(post.description);
      if (parsed._price !== undefined) { descPrice = parsed._price ?? null; descText = parsed._desc ?? null; }
      else { descText = post.description; }
    } catch { descText = post.description; }
  }
  const uname  = author?.username  ?? post?.author_username ?? mockPost.username;
  const udisp  = author?.name      ?? post?.author_name     ?? mockPost.username;
  const avatar = author?.avatar    ?? post?.author_avatar   ?? mockPost.avatar;
  const profileHref = post?.user_id ? `/u/${post.user_id}` : `/u/${uname}`;

  const rightGrid = relatedPosts.slice(0, 10);
  const belowGrid = relatedPosts;

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen min-w-0">
        <MainHeader />
        <main className="flex-1 pb-24 lg:pb-8">

          {loading && isUUID && <PostDetailSkeleton />}

          <div className={loading && isUUID ? "hidden" : undefined}>

            {/* Back link */}
            <div className="px-4 md:px-6 pt-5 pb-0">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-sm mb-2 transition-opacity hover:opacity-70"
                style={{ color: "var(--text-4)" }}
              >
                <ArrowLeft size={15} /> Back
              </button>
            </div>

            {/* ── 3-column layout ── */}
            <div className="flex gap-0 items-start px-4 md:px-6 pt-4">

              {/* ── Left: Sticky artwork image ── */}
              <div
                className="hidden lg:block shrink-0 rounded-2xl overflow-hidden"
                style={{ width: 420, position: "sticky", top: 80, border: "1px solid var(--border)" }}
              >
                {isVideo ? (
                  <video src={img} controls className="w-full" style={{ display: "block", background: "#000" }} />
                ) : (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img} alt={title}
                      style={{ width: "100%", display: "block", objectFit: "cover" }}
                      draggable={false}
                    />
                    <div
                      className="absolute inset-0 cursor-zoom-in"
                      onClick={() => setViewerOpen(true)}
                      onContextMenu={e => e.preventDefault()}
                    />
                  </div>
                )}
              </div>

              {/* ── Center: Details ── */}
              <div className="flex flex-col gap-5 flex-1 min-w-0 px-0 lg:px-6" style={{ maxWidth: 420 }}>

                {/* Mobile image */}
                <div className="lg:hidden rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  {isVideo ? (
                    <video src={img} controls className="w-full" style={{ background: "#000" }} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={title} className="w-full object-cover" draggable={false} />
                  )}
                </div>

                {/* Artist row */}
                <div className="flex items-center gap-3">
                  <Link href={profileHref} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatar} alt={udisp} className="w-10 h-10 rounded-full object-cover"
                      style={{ border: "2px solid rgba(124,91,245,0.4)" }} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={profileHref} className="hover:underline">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{udisp}</p>
                    </Link>
                    <p className="text-xs" style={{ color: "var(--text-5)" }}>{cat}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {user?.id !== post?.user_id && (
                      <button
                        onClick={handleFollow}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:opacity-80"
                        style={following
                          ? { background: "rgba(16,185,129,0.12)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }
                          : { background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.3)" }}
                      >
                        {following ? "Following" : "Follow"}
                      </button>
                    )}
                    <button
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-4)" }}
                    >
                      <MessageCircle size={15} />
                    </button>
                  </div>
                </div>

                {/* Title + description */}
                <div>
                  <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-1)" }}>{title}</h1>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-4)" }}>
                    {descText ?? `A stunning piece from ${udisp} exploring the world of ${cat}.`}
                  </p>
                </div>

                {/* Meta grid */}
                <div
                  className="grid grid-cols-2 gap-3 p-4 rounded-2xl text-sm"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "var(--text-5)" }}>Category</p>
                    <p style={{ color: "var(--text-2)" }}>{cat || "Art"}</p>
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "var(--text-5)" }}>Type</p>
                    <p style={{ color: "var(--text-2)" }}>Digital</p>
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "var(--text-5)" }}>Artist</p>
                    <p className="truncate" style={{ color: "var(--text-2)" }}>@{uname}</p>
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "var(--text-5)" }}>Posted</p>
                    <p style={{ color: "var(--text-2)" }}>
                      {post?.created_at ? new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </p>
                  </div>
                </div>

                {/* Price & CTA */}
                <div className="p-4 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  {descPrice && (
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-xs" style={{ color: "var(--text-5)" }}>Price</span>
                      <span className="text-3xl font-bold" style={{ color: "#9B7CF5" }}>{descPrice}</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    {descPrice && (
                      payDone ? (
                        <div className="w-full py-3 rounded-xl font-semibold text-sm text-center"
                          style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>
                          ✓ Payment successful!
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={handleBuyNow}
                            disabled={paying}
                            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-85 disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg, #361E7B, #7C5BF5)" }}
                          >
                            {paying && <Loader2 size={15} className="animate-spin" />}
                            {paying ? "Processing…" : "Buy Now"}
                          </button>
                          {payError && (
                            <p className="text-xs text-center px-3 py-2 rounded-xl"
                              style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                              {payError}
                            </p>
                          )}
                        </>
                      )
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleLike}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: liked ? "rgba(244,63,94,0.1)" : "var(--bg-subtle)",
                          border:     `1px solid ${liked ? "rgba(244,63,94,0.4)" : "var(--border)"}`,
                          color:      liked ? "#f43f5e" : "var(--text-4)",
                        }}
                      >
                        <Heart size={15} fill={liked ? "#f43f5e" : "none"} stroke={liked ? "#f43f5e" : "currentColor"} />
                        {likeCount}
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: saved ? "rgba(124,91,245,0.1)" : "var(--bg-subtle)",
                          border:     `1px solid ${saved ? "rgba(124,91,245,0.4)" : "var(--border)"}`,
                          color:      saved ? "#9B7CF5" : "var(--text-4)",
                        }}
                      >
                        <Bookmark size={15} fill={saved ? "#9B7CF5" : "none"} stroke={saved ? "#9B7CF5" : "currentColor"} />
                        Save
                      </button>
                      <button
                        className="flex items-center justify-center w-11 rounded-xl transition-all hover:opacity-70"
                        style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-4)" }}
                      >
                        <Share2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                    Comments {comments.length > 0 && <span style={{ color: "var(--text-5)" }}>({comments.length})</span>}
                  </h3>

                  {/* Comment input */}
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    {user && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.imageUrl} alt="you" className="w-7 h-7 rounded-full object-cover shrink-0" />
                    )}
                    <input
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && submitComment()}
                      placeholder="Add a comment…"
                      className="flex-1 bg-transparent text-sm outline-none"
                      style={{ color: "var(--text-1)" }}
                    />
                    <button onClick={submitComment} disabled={!commentText.trim()}
                      className="transition-opacity disabled:opacity-30" style={{ color: "#9B7CF5" }}>
                      <Send size={17} />
                    </button>
                  </div>

                  {/* Comment list */}
                  <div className="flex flex-col gap-4">
                    {loading && <p className="text-xs text-center" style={{ color: "var(--text-5)" }}>Loading…</p>}
                    {!loading && comments.length === 0 && (
                      <p className="text-xs text-center py-4" style={{ color: "var(--text-5)" }}>No comments yet. Be the first!</p>
                    )}
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
                  </div>
                </div>

              </div>

              {/* ── Right: Pinterest-style related posts ── */}
              <div className="hidden xl:block flex-1 min-w-0 pl-4">
                <div className="columns-2 gap-4" style={{ columnGap: 16 }}>
                  {rightGrid.map(work => (
                    <Link
                      key={work.id}
                      href={`/feed/${work.id}`}
                      className="group relative block rounded-2xl overflow-hidden mb-4 break-inside-avoid"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={firstImage(work.image_url ?? "")}
                        alt={work.title}
                        className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 45%, rgba(0,0,0,0.08) 100%)" }}
                      >
                        <div className="flex justify-end">
                          <span
                            className="px-3 py-1 rounded-full text-[11px] font-bold text-white"
                            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)" }}
                          >
                            View
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white truncate">{work.title}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                            {work.author_name ?? work.author_username}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

            </div>

            {/* ── Below: More like this ── */}
            {belowGrid.length > 0 && (
              <div className="px-4 md:px-6 mt-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>More like this</h2>
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-5)" }}>Works from the same category</p>
                  </div>
                  <Link href="/feed" className="text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: "#9B7CF5" }}>
                    Browse all →
                  </Link>
                </div>
                <MasonryGrid posts={belowGrid} loadFromDb={false} />
              </div>
            )}

          </div>
        </main>
      </div>
      <BottomNav />

      {viewerOpen && (
        <ArtworkViewer src={img} alt={title} onClose={() => setViewerOpen(false)} />
      )}
    </div>
  );
}
