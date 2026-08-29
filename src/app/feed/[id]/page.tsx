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

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen min-w-0">
        <MainHeader />
        <main className="flex-1 pb-24 lg:pb-8">

          {loading && isUUID && <PostDetailSkeleton />}

          <div className={loading && isUUID ? "hidden" : undefined}>

            {/* ── Pinterest layout: back row + pin card + related grid ── */}
            <div className="px-4 md:px-6 pt-4 pb-10">

              {/* Back button row */}
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-sm mb-4 transition-opacity hover:opacity-70"
                style={{ color: "var(--text-4)" }}
              >
                <ArrowLeft size={15} /> Back
              </button>

              {/* ── Row: pin card + related pins side by side ── */}
              <div className="flex items-start gap-6">

                {/* ── Left column: pin card + fill below with more posts ── */}
                <div className="flex flex-col gap-4 shrink-0 w-full lg:w-auto" style={{ maxWidth: 920 }}>

                {/* ── Pin card (image + details) ── */}
                <div
                  className="flex flex-col lg:flex-row overflow-hidden w-full"
                  style={{
                    borderRadius: 24,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
                    maxWidth: 920,
                  }}
                >
                  {/* Image side */}
                  <div
                    className="relative shrink-0"
                    style={{ width: "100%", maxWidth: 480, borderRadius: "24px 0 0 24px", overflow: "hidden", background: "var(--bg)" }}
                  >
                    {isVideo ? (
                      <video src={img} controls className="w-full block" style={{ background: "#000", minHeight: 340 }} />
                    ) : (
                      <div
                        className="cursor-zoom-in"
                        onClick={() => setViewerOpen(true)}
                        onContextMenu={e => e.preventDefault()}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img} alt={title}
                          className="w-full block"
                          style={{ objectFit: "contain", maxHeight: "90vh" }}
                          draggable={false}
                        />
                      </div>
                    )}
                  </div>

                  {/* Details side */}
                  <div className="flex flex-col flex-1 min-w-0" style={{ minWidth: 340, maxWidth: 440 }}>

                    {/* Top action bar */}
                    <div className="flex items-center gap-2 px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                      <button
                        onClick={handleLike}
                        className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-full transition-all hover:opacity-80"
                        style={{
                          background: liked ? "rgba(244,63,94,0.12)" : "var(--bg-subtle)",
                          color: liked ? "#f43f5e" : "var(--text-3)",
                          border: `1px solid ${liked ? "rgba(244,63,94,0.3)" : "var(--border)"}`,
                        }}
                      >
                        <Heart size={15} fill={liked ? "#f43f5e" : "none"} stroke={liked ? "#f43f5e" : "currentColor"} />
                        {likeCount}
                      </button>
                      <button className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-70"
                        style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-3)" }}>
                        <MessageCircle size={15} />
                      </button>
                      <button className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-70"
                        style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-3)" }}>
                        <Share2 size={15} />
                      </button>
                      <div className="flex-1" />
                      {/* Save */}
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all hover:opacity-85"
                        style={{
                          background: saved ? "rgba(124,91,245,0.85)" : "#7C5BF5",
                          color: "#fff",
                        }}
                      >
                        <Bookmark size={14} fill={saved ? "#fff" : "none"} stroke="#fff" />
                        {saved ? "Saved" : "Save"}
                      </button>
                    </div>

                    {/* Scrollable content */}
                    <div className="flex flex-col gap-4 px-5 py-4 overflow-y-auto flex-1" style={{ maxHeight: "80vh" }}>

                      {/* Artist row */}
                      <div className="flex items-center gap-3">
                        <Link href={profileHref} className="shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={avatar} alt={udisp} className="w-10 h-10 rounded-full object-cover"
                            style={{ border: "2px solid rgba(124,91,245,0.4)" }} />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={profileHref} className="hover:underline">
                            <p className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>{udisp}</p>
                          </Link>
                          <p className="text-xs" style={{ color: "var(--text-5)" }}>{cat}</p>
                        </div>
                        {user?.id !== post?.user_id && (
                          <button
                            onClick={handleFollow}
                            className="text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 transition-all hover:opacity-80"
                            style={following
                              ? { background: "rgba(16,185,129,0.12)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }
                              : { background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.3)" }}
                          >
                            {following ? "Following" : "Follow"}
                          </button>
                        )}
                      </div>

                      {/* Title + description */}
                      <div>
                        <h1 className="text-xl font-bold mb-1.5" style={{ color: "var(--text-1)" }}>{title}</h1>
                        {descText && (
                          <p className="text-sm leading-relaxed" style={{ color: "var(--text-4)" }}>{descText}</p>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm p-3 rounded-xl" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "var(--text-5)" }}>Category</p>
                          <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{cat || "Art"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "var(--text-5)" }}>Type</p>
                          <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>Digital</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "var(--text-5)" }}>Artist</p>
                          <p className="text-sm font-medium truncate" style={{ color: "var(--text-2)" }}>@{uname}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "var(--text-5)" }}>Posted</p>
                          <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
                            {post?.created_at ? new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </p>
                        </div>
                      </div>

                      {/* Price & Buy */}
                      {descPrice && (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold" style={{ color: "#9B7CF5" }}>{descPrice}</span>
                          </div>
                          {payDone ? (
                            <div className="w-full py-2.5 rounded-xl font-semibold text-sm text-center"
                              style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>
                              ✓ Payment successful!
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={handleBuyNow}
                                disabled={paying}
                                className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-85 disabled:opacity-60 flex items-center justify-center gap-2"
                                style={{ background: "linear-gradient(135deg, #361E7B, #7C5BF5)" }}
                              >
                                {paying && <Loader2 size={14} className="animate-spin" />}
                                <ShoppingBag size={14} />
                                {paying ? "Processing…" : "Buy Now"}
                              </button>
                              {payError && (
                                <p className="text-xs text-center px-3 py-2 rounded-xl"
                                  style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                                  {payError}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Comments */}
                      <div className="flex flex-col gap-3">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                          Comments {comments.length > 0 && <span style={{ color: "var(--text-5)" }}>({comments.length})</span>}
                        </p>

                        {/* Comment input */}
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                          {user && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.imageUrl} alt="you" className="w-7 h-7 rounded-full object-cover shrink-0" />
                          )}
                          <input
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && submitComment()}
                            placeholder="Add a comment to start the conversation…"
                            className="flex-1 bg-transparent text-sm outline-none"
                            style={{ color: "var(--text-1)" }}
                          />
                          <button onClick={submitComment} disabled={!commentText.trim()}
                            className="transition-opacity disabled:opacity-30" style={{ color: "#9B7CF5" }}>
                            <Send size={16} />
                          </button>
                        </div>

                        {/* Comment list */}
                        {!loading && comments.length === 0 && (
                          <p className="text-xs text-center py-3" style={{ color: "var(--text-5)" }}>No comments yet. Be the first!</p>
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

                    </div>{/* end scrollable */}
                  </div>{/* end details */}
                </div>{/* end pin card */}

                {/* ── Below pin card: fill left column with more posts (desktop only) ── */}
                <div className="hidden lg:block mt-2">
                  <MasonryGrid posts={[]} loadFromDb={true} columns="columns-2" />
                </div>

                </div>{/* end left column */}

                {/* ── Right-side grid — fills space beside pin card & keeps loading ── */}
                <div className="hidden lg:flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold" style={{ color: "var(--text-1)" }}>More like this</h2>
                    <Link href="/feed" className="text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: "#9B7CF5" }}>Browse all →</Link>
                  </div>
                  <MasonryGrid posts={relatedPosts} loadFromDb={true} category={cat ?? undefined} columns="columns-2" />
                </div>

              </div>{/* end row */}

              {/* ── Mobile-only: full-width grid below pin card ── */}
              <div className="lg:hidden mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold" style={{ color: "var(--text-1)" }}>More like this</h2>
                  <Link href="/feed" className="text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: "#9B7CF5" }}>Browse all →</Link>
                </div>
                <MasonryGrid posts={relatedPosts} loadFromDb={true} category={cat ?? undefined} columns="columns-2 sm:columns-3" />
              </div>

            </div>{/* end px wrapper */}
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
