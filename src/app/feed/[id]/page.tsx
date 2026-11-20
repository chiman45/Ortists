"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import PostDetailSkeleton from "@/components/ui/skeletons/PostDetailSkeleton";
import { type Comment } from "@/lib/db/comments";
import { type Post } from "@/lib/db/posts";
import { allPosts } from "@/lib/mockData";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Bookmark, Check, Heart, Loader2, MessageCircle, Send, Share2, ShoppingBag, ShoppingCart, UserPlus } from "lucide-react";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { useRouter } from "next/navigation";
import AuthPromptModal from "@/components/ui/AuthPromptModal";
import ReactionButton from "@/components/ui/ReactionButton";
import { use, useEffect, useRef, useState } from "react";

import MasonryGrid from "@/components/feed/MasonryGrid";
import ArtworkViewer from "@/components/ui/ArtworkViewer";
import WallPreview from "@/components/ui/WallPreview";
import { buyerPriceLabel } from "@/lib/pricing";
import { firstImage } from "@/lib/imageUrl";
import { followStyle } from "@/lib/followStyle";

// Stable reference: MasonryGrid resets itself whenever its `posts` prop changes
// identity, so an inline `[]` wiped and reloaded the grid on every keystroke
// in the comment box.
const NO_POSTS: Post[] = [];

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], display: "swap" });

/** "just now", "5 min ago", "3 days ago", then the date. */
function timeAgo(ts: string): string {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const UUID_RE =/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const [inCart, setInCart]           = useState(false);
  const [cartBusy, setCartBusy]       = useState(false);
  const [cartError, setCartError]     = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [shared, setShared]           = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [authPrompt, setAuthPrompt]   = useState(false); // guest tried to like/comment/etc.
  const commentInputRef               = useRef<HTMLInputElement>(null);

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

        // Related posts, loaded once (no endless loading on this page — it kept
        // firing when the phone keyboard opened and showed a loader under the image).
        // Same category first, topped up with the latest posts if there are few.
        const sameCat = p.category
          ? fetch(`/api/posts?category=${encodeURIComponent(p.category)}&limit=24`).then(r => r.json()).then(d => (d.posts ?? []) as Post[])
          : Promise.resolve([] as Post[]);
        sameCat.then(async list => {
          let more = list.filter(rp => rp.id !== id);
          if (more.length < 8) {
            const latest: Post[] = await fetch(`/api/posts?limit=24`).then(r => r.json()).then(d => d.posts ?? []);
            const seen = new Set(more.map(rp => rp.id));
            more = [...more, ...latest.filter(rp => rp.id !== id && !seen.has(rp.id))];
          }
          setRelatedPosts(more.slice(0, 24));
        }).catch(() => {});
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

  // Native share sheet on phones (WhatsApp, Instagram…); copy link elsewhere
  async function handleShare() {
    const url = window.location.href;
    const title = post?.title || "Artwork on Ortists";
    try {
      if (navigator.share) {
        await navigator.share({ title, text: author ? `${title} by ${author.name}` : title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // user closed the share sheet — nothing to do
    }
  }

  async function handleLike() {
    if (!isUUID) { setLiked(l => !l); setLikeCount(c => liked ? Math.max(0, c - 1) : c + 1); return; }
    if (!user) { setAuthPrompt(true); return; }
    if (likePending) return; // ignore double taps while the last one is saving
    const wasLiked = liked;
    setLikePending(true);
    setLiked(!wasLiked);
    setLikeCount(c => wasLiked ? Math.max(0, c - 1) : c + 1);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: wasLiked ? "unlike" : "like", userId: user.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      if (typeof data.likes_count === "number") setLikeCount(data.likes_count);
    } catch {
      // Didn't save — put the heart back how it was
      setLiked(wasLiked);
      setLikeCount(c => wasLiked ? c + 1 : Math.max(0, c - 1));
    } finally {
      setLikePending(false);
    }
  }

  async function handleSave() {
    if (!isUUID) { setSaved(s => !s); return; }
    if (!user) { setAuthPrompt(true); return; }
    if (savePending) return; // ignore double taps while the last one is saving
    const wasSaved = saved;
    setSavePending(true);
    setSaved(!wasSaved);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: wasSaved ? "unsave" : "save", userId: user.id }),
      });
      if (!res.ok) throw new Error("save failed");
    } catch {
      // Didn't save — don't keep showing "Saved"
      setSaved(wasSaved);
    } finally {
      setSavePending(false);
    }
  }

  async function handleFollow() {
    if (!user) { setAuthPrompt(true); return; }
    if (!post?.user_id) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    const res = await fetch("/api/follows", {
      method: wasFollowing ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followerId: user.id, followingId: post.user_id }),
    });
    if (!res.ok) setFollowing(wasFollowing); // revert on failure
  }

  // Buying: both buttons lead to /checkout (address → delivery check → summary → payment)
  function handleBuyNow() {
    if (!user) { setAuthPrompt(true); return; }
    router.push(`/checkout?buy=${id}`);
  }

  async function handleAddToCart() {
    if (!user) { setAuthPrompt(true); return; }
    if (inCart) { router.push("/cart"); return; }
    if (cartBusy) return;
    setCartBusy(true); setCartError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not add this to your cart.");
      setInCart(true);
      window.dispatchEvent(new Event("ortists:cart-changed"));
    } catch (e) {
      setCartError(e instanceof Error ? e.message : "Could not add this to your cart.");
    } finally {
      setCartBusy(false);
    }
  }

  async function submitComment() {
    if (!commentText.trim()) return;
    if (isUUID && !user) { setAuthPrompt(true); return; }
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
  const cat      = (post?.category ?? mockPost.category)?.replace(/^gallery:/, "");
  const typeLabel = post?.medium ?? "Digital";

  // Parse structured description (gallery posts embed price as JSON)
  let descText: string | null = null;
  let descPrice: string | null = null;
  let descDimensions: string | null = null;
  if (post?.description) {
    try {
      const parsed = JSON.parse(post.description);
      if (parsed._price !== undefined) { descPrice = parsed._price ?? null; descText = parsed._desc ?? null; descDimensions = parsed._dimensions ?? null; }
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
        {/* Back sits in the top bar, on the same line as the cart and bell */}
        <MainHeader>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-semibold h-9 pl-2.5 pr-3.5 rounded-xl transition-opacity hover:opacity-70"
            style={{ color: "var(--text-2)", background: "var(--bg-subtle)" }}
          >
            <ArrowLeft size={16} /> Back
          </button>
        </MainHeader>
        <main className="flex-1 pb-24 lg:pb-8">

          {loading && isUUID && <PostDetailSkeleton />}

          <div className={loading && isUUID ? "hidden" : undefined}>

            {/* ── Pinterest layout: back row + pin card + related grid ── */}
            <div className="px-4 md:px-6 pt-4 pb-10">

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
                    style={{ width: "100%", maxWidth: 480, borderRadius: "24px 0 0 24px", overflow: "hidden", background: "var(--bg)", alignSelf: "center" }}
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
                      {isUUID ? (
                        <ReactionButton
                          postId={id}
                          userId={user?.id}
                          initialCount={likeCount}
                          onNeedLogin={() => setAuthPrompt(true)}
                        />
                      ) : (
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
                      )}
                      <button
                        onClick={() => {
                          commentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                          commentInputRef.current?.focus({ preventScroll: true });
                        }}
                        aria-label="Comment" title="Comment"
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-70"
                        style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-3)" }}>
                        <MessageCircle size={15} />
                      </button>
                      <button
                        onClick={handleShare}
                        aria-label="Share" title={shared ? "Link copied!" : "Share"}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-70"
                        style={{
                          background: shared ? "rgba(16,185,129,0.12)" : "var(--bg-subtle)",
                          border: `1px solid ${shared ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
                          color: shared ? "#10B981" : "var(--text-3)",
                        }}>
                        {shared ? <Check size={15} /> : <Share2 size={15} />}
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
                    <div className="flex flex-col gap-5 px-5 md:px-6 py-5 overflow-y-auto flex-1" style={{ maxHeight: "80vh" }}>

                      {/* Title block */}
                      <div>
                        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-2" style={{ color: "#9B7CF5" }}>
                          {[cat || "Art", typeLabel].filter(Boolean).join("  ·  ")}
                        </p>
                        <h1 className={`${playfair.className} text-3xl md:text-[34px] font-semibold leading-tight capitalize break-words`}
                          style={{ color: "var(--text-1)", letterSpacing: "-0.01em" }}>
                          {title}
                        </h1>
                        {descText && (
                          <p className="text-[15px] leading-relaxed mt-3 whitespace-pre-wrap break-words" style={{ color: "var(--text-3)" }}>{descText}</p>
                        )}
                      </div>

                      {/* Artist */}
                      <div className="flex items-center gap-3.5 py-4" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                        <Link href={profileHref} className="shrink-0 rounded-full p-[2px]" style={{ background: "linear-gradient(135deg,#7C5BF5,#FF7EA0)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={avatar} alt={udisp} className="w-12 h-12 rounded-full object-cover block" style={{ border: "2px solid var(--bg)" }} />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase" style={{ color: "var(--text-5)" }}>Artist</p>
                          <Link href={profileHref} className="block text-base font-bold truncate hover:underline" style={{ color: "var(--text-1)" }}>{udisp}</Link>
                          <p className="text-xs truncate" style={{ color: "var(--text-5)" }}>@{uname}</p>
                        </div>
                        {user?.id !== post?.user_id && (
                          <button
                            onClick={handleFollow}
                            className="text-sm font-bold px-5 py-2 rounded-full shrink-0 transition-all hover:opacity-85"
                            style={followStyle(following)}
                          >
                            {following ? "Following" : "Follow"}
                          </button>
                        )}
                      </div>

                      {/* Details: only what the artist actually entered */}
                      {(() => {
                        const rows = [
                          { label: "Medium", value: post?.medium ?? null },
                          { label: "Style",  value: post?.style ?? null },
                          { label: "Size",   value: descDimensions },
                          { label: "Posted", value: post?.created_at ? new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null },
                        ].filter(r => !!r.value);
                        const tags = (post?.tags ?? []).filter(t => t && t !== cat);
                        if (!rows.length && !tags.length) return null;
                        return (
                          <div>
                            <dl>
                              {rows.map(r => (
                                <div key={r.label} className="flex items-baseline justify-between gap-4 py-2">
                                  <dt className="text-sm shrink-0" style={{ color: "var(--text-5)" }}>{r.label}</dt>
                                  <dd className="text-sm font-semibold text-right capitalize break-words min-w-0" style={{ color: "var(--text-2)" }}>{r.value}</dd>
                                </div>
                              ))}
                            </dl>
                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {tags.map(t => (
                                  <span key={t} className="px-3 py-1 rounded-full text-xs font-medium"
                                    style={{ background: "var(--bg-subtle)", color: "var(--text-4)", border: "1px solid var(--border)" }}>
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Price & Buy */}
                      {descPrice && (
                        <div className="flex flex-col gap-3 rounded-2xl p-4" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-card)" }}>
                          <div className="flex items-end justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase" style={{ color: "var(--text-5)" }}>Price</p>
                              <p className={`${playfair.className} text-3xl font-semibold leading-none mt-1.5`} style={{ color: "var(--text-1)" }}>
                                {buyerPriceLabel(descPrice) ?? descPrice}
                              </p>
                            </div>
                            <p className="text-xs text-right" style={{ color: "var(--text-5)" }}>
                              Original artwork<br />Delivery added at checkout
                            </p>
                          </div>
                          {/* See it on a wall — drawn to scale from the listed size */}
                          {!isVideo && <WallPreview imageUrl={img} dimensions={descDimensions} />}
                          {post?.user_id === user?.id ? (
                            <p className="text-xs px-3 py-2.5 rounded-xl text-center" style={{ background: "var(--bg-subtle)", color: "var(--text-4)", border: "1px solid var(--border)" }}>
                              This is your own listing. Buyers see Add to Cart and Buy Now here.
                            </p>
                          ) : !/^\s*(₹|rs\.?|inr)?\s*\d/i.test(descPrice) ? (
                            <p className="text-xs px-3 py-2.5 rounded-xl text-center" style={{ background: "var(--bg-subtle)", color: "var(--text-4)", border: "1px solid var(--border)" }}>
                              Online payment is available only for artworks priced in ₹.
                            </p>
                          ) : (
                            <>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  onClick={handleAddToCart}
                                  disabled={cartBusy}
                                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-85 disabled:opacity-60 flex items-center justify-center gap-2"
                                  style={{ background: "transparent", color: "var(--buy-bg)", border: "1px solid var(--buy-bg)" }}
                                >
                                  {cartBusy ? <Loader2 size={14} className="animate-spin" /> : inCart ? <Check size={14} /> : <ShoppingCart size={14} />}
                                  {inCart ? "Go to Cart" : "Add to Cart"}
                                </button>
                                <button
                                  onClick={handleBuyNow}
                                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-85 flex items-center justify-center gap-2"
                                  style={{ background: "var(--buy-bg)", color: "var(--buy-text)", border: "1px solid var(--buy-bg)" }}
                                >
                                  <ShoppingBag size={14} />
                                  Buy Now
                                </button>
                              </div>
                              {cartError && (
                                <p role="alert" className="text-xs text-center px-3 py-2 rounded-xl"
                                  style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                                  {cartError}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Comments */}
                      <div className="flex flex-col gap-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                        <h2 className="flex items-baseline gap-2 text-base font-bold" style={{ color: "var(--text-1)" }}>
                          Comments
                          {comments.length > 0 && <span className="text-sm font-medium" style={{ color: "var(--text-5)" }}>{comments.length}</span>}
                        </h2>

                        {/* Comment input */}
                        <form onSubmit={e => { e.preventDefault(); submitComment(); }} className="flex items-center gap-2.5">
                          {user && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.imageUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                          )}
                          <label htmlFor="post-comment" className="sr-only">Write a comment</label>
                          <input
                            id="post-comment"
                            ref={commentInputRef}
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            placeholder={comments.length ? "Add a comment…" : "Be the first to comment…"}
                            autoComplete="off"
                            className="flex-1 min-w-0 px-4 py-2.5 rounded-full text-base md:text-sm outline-none"
                            style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-card)", color: "var(--text-1)" }}
                          />
                          <button type="submit" disabled={!commentText.trim()} aria-label="Post comment"
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white transition-opacity hover:opacity-85 disabled:opacity-35"
                            style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}>
                            <Send size={15} />
                          </button>
                        </form>

                        {/* Comment list */}
                        {comments.length > 0 && (
                          <ul className="flex flex-col gap-4">
                            {comments.map(c => (
                              <li key={c.id} className="flex gap-3">
                                {c.author_avatar ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={c.author_avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                                ) : (
                                  <span aria-hidden className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold"
                                    style={{ background: "rgba(124,91,245,0.18)", color: "#9B7CF5" }}>
                                    {(c.author_name?.trim()[0] ?? "?").toUpperCase()}
                                  </span>
                                )}
                                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md px-3.5 py-2.5" style={{ background: "var(--bg-subtle)" }}>
                                  <p className="flex items-baseline gap-2">
                                    <span className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{c.author_name}</span>
                                    <span className="text-[11px] shrink-0" style={{ color: "var(--text-5)" }}>{timeAgo(c.created_at)}</span>
                                  </p>
                                  <p className="text-sm leading-relaxed break-words mt-0.5" style={{ color: "var(--text-2)" }}>{c.text}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                    </div>{/* end scrollable */}
                  </div>{/* end details */}
                </div>{/* end pin card */}

                {/* ── Below pin card: fill left column with more posts (desktop only) ── */}
                <div className="hidden lg:block mt-2">
                  <MasonryGrid posts={NO_POSTS} loadFromDb={true} columns="columns-2" />
                </div>

                </div>{/* end left column */}

                {/* ── Right-side grid — fills space beside pin card & keeps loading ── */}
                <div className="hidden lg:flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold" style={{ color: "var(--text-1)" }}>More like this</h2>
                    <Link href="/feed" className="text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: "#9B7CF5" }}>Browse all →</Link>
                  </div>
                  <MasonryGrid posts={relatedPosts} loadFromDb={false} category={cat ?? undefined} columns="columns-2" />
                </div>

              </div>{/* end row */}

              {/* ── Mobile-only: full-width grid below pin card ── */}
              <div className="lg:hidden mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold" style={{ color: "var(--text-1)" }}>More like this</h2>
                  <Link href="/feed" className="text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: "#9B7CF5" }}>Browse all →</Link>
                </div>
                <MasonryGrid posts={relatedPosts} loadFromDb={false} category={cat ?? undefined} columns="columns-2 sm:columns-3" />
              </div>

            </div>{/* end px wrapper */}
          </div>
        </main>
      </div>
      <BottomNav />

      {viewerOpen && (
        <ArtworkViewer src={img} alt={title} onClose={() => setViewerOpen(false)} />
      )}
      {authPrompt && <AuthPromptModal onClose={() => setAuthPrompt(false)} />}

    </div>
  );
}
