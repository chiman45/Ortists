"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import ProfileSkeleton from "@/components/ui/skeletons/ProfileSkeleton";
import { type Post as DbPost } from "@/lib/db/posts";
import { type Profile } from "@/lib/db/profiles";
import PostModal from "@/components/ui/PostModal";
import ShareModal from "@/components/ui/ShareModal";
import { useUser } from "@clerk/nextjs";
import {
  Star, Heart, Bookmark, Users, TrendingUp, LayoutGrid,
  Store, Briefcase, UserCircle, Eye, MapPin, Pencil, Zap,
  CheckCircle2, SlidersHorizontal, Plus, Pause, Copy, Trash2,
  Clock, X, Check, Share2, Camera, Loader2,
} from "lucide-react";
import { firstImage } from "@/lib/imageUrl";
const isVideoUrl = (u: string) => /\.(mp4|webm|mov|avi|mkv|ogv)(\?|$)/i.test(u);
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface FollowUser {
  clerk_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  tag: string;
}

const TABS = ["Portfolio", "Gallery", "Services", "Saved", "About"] as const;
type Tab = typeof TABS[number];

interface EditForm {
  display_name: string;
  username: string;
  bio: string;
  location: string;
  tag: string;
  available: boolean;
  response_time: string;
}

type EditSection = "Basic Info" | "Portfolio" | "Services" | "Availability" | "Pricing" | "Preferences";

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();

  const [activeTab, setActiveTab]       = useState<Tab>("Portfolio");
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceSort, setServiceSort]     = useState<"Popular" | "Latest" | "Price">("Popular");
  const [profile, setProfile]           = useState<Profile | null>(null);
  const [dbPosts, setDbPosts]           = useState<DbPost[]>([]);
  const [savedPosts, setSavedPosts]     = useState<DbPost[]>([]);
  const [recommended, setRecommended]   = useState<Profile[]>([]);
  const [followed, setFollowed]         = useState<Set<string>>(new Set());
  const [liveStats, setLiveStats]       = useState({ followers: 0, following: 0, totalLikes: 0, totalSaves: 0 });
  const [showEdit, setShowEdit]         = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState<string | null>(null);
  const [shareOpen, setShareOpen]        = useState(false);
  const [avatarPreview, setAvatarPreview]   = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef                        = useRef<HTMLInputElement>(null);
  const [bannerPreview, setBannerPreview]   = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef                        = useRef<HTMLInputElement>(null);
  const [followModal, setFollowModal]   = useState<{ type: "followers" | "following"; users: FollowUser[] } | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [editSection, setEditSection]   = useState<EditSection>("Basic Info");
  const [editForm, setEditForm]         = useState<EditForm>({
    display_name: "", username: "", bio: "", location: "",
    tag: "Artist", available: true, response_time: "Within 24 hours",
  });
  const [openPostModal, setOpenPostModal] = useState<DbPost | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Sync Clerk → Supabase, get profile back
    fetch("/api/profile/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerk_id:     user.id,
        display_name: user.fullName ?? user.firstName ?? "Artist",
        username:     user.username ?? user.id.slice(0, 12),
        avatar_url:   user.imageUrl,
      }),
    })
      .then(r => r.json())
      .then(({ profile: p }) => { if (p) setProfile(p); });

    // Load own posts
    fetch(`/api/posts?userId=${user.id}`)
      .then(r => r.json())
      .then(({ posts }) => { if (posts) setDbPosts(posts); });

    // Load saved posts
    fetch(`/api/posts?savedBy=${user.id}`)
      .then(r => r.json())
      .then(({ posts }) => { if (posts) setSavedPosts(posts); });

    // Load recommended artists (other users)
    fetch("/api/profiles")
      .then(r => r.json())
      .then(({ profiles }) => {
        const others = (profiles ?? []).filter((p: Profile) => p.clerk_id !== user.id).slice(0, 4);
        setRecommended(others);
      });

    // Load who the user is already following → initialise the followed Set
    fetch(`/api/follows/list?userId=${user.id}&type=following`)
      .then(r => r.json())
      .then(({ users }) => {
        const ids = (users ?? []).map((u: { clerk_id: string }) => u.clerk_id);
        setFollowed(new Set(ids));
      });

    // Load accurate counts directly from source tables
    fetch(`/api/stats?userId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        setLiveStats({
          followers:  data.followers  ?? 0,
          following:  data.following  ?? 0,
          totalLikes: data.totalLikes ?? 0,
          totalSaves: data.totalSaves ?? 0,
        });
      });

  }, [user, isLoaded]);

  function openEdit(section: EditSection = "Basic Info") {
    setEditSection(section);
    setEditForm({
      display_name:  profile?.display_name ?? user?.fullName ?? "",
      username:      profile?.username ?? user?.username ?? "",
      bio:           profile?.bio ?? "",
      location:      profile?.location ?? "",
      tag:           profile?.tag ?? "Artist",
      available:     profile?.available ?? true,
      response_time: profile?.response_time ?? "Within 24 hours",
    });
    setAvatarPreview(null);
    setBannerPreview(null);
    setSaveError(null);
    setShowEdit(true);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const { url, error: upErr } = await res.json();
      if (upErr || !url) throw new Error(upErr ?? "Upload failed");
      setAvatarPreview(url);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Avatar upload failed");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setBannerUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const { url, error: upErr } = await res.json();
      if (upErr || !url) throw new Error(upErr ?? "Upload failed");
      setBannerPreview(url);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Banner upload failed");
    } finally {
      setBannerUploading(false);
    }
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/profile/sync", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_id:      user.id,
          display_name:  editForm.display_name || null,
          username:      editForm.username || null,
          bio:           editForm.bio || null,
          location:      editForm.location || null,
          tag:           editForm.tag,
          available:     editForm.available,
          response_time: editForm.response_time,
          ...(avatarPreview ? { avatar_url: avatarPreview } : {}),
          ...(bannerPreview ? { banner_url: bannerPreview } : {}),
        }),
      });
      const data = await res.json();
      if (data.error) { setSaveError(data.error); return; }
      if (data.profile) setProfile(data.profile);
      setShowEdit(false);
    } catch {
      setSaveError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/u/${profile?.username ?? user?.id}`
    : "";

  async function openFollowList(type: "followers" | "following") {
    if (!user) return;
    setFollowLoading(true);
    const res = await fetch(`/api/follows/list?userId=${user.id}&type=${type}`);
    const { users } = await res.json();
    setFollowModal({ type, users: users ?? [] });
    setFollowLoading(false);
  }

  async function toggleFollow(p: Profile) {
    if (!user) return;
    const wasFollowing = followed.has(p.clerk_id);

    // Optimistic update
    const next = new Set(followed);
    if (wasFollowing) next.delete(p.clerk_id); else next.add(p.clerk_id);
    setFollowed(next);
    setLiveStats(s => ({
      ...s,
      following: wasFollowing ? Math.max(0, s.following - 1) : s.following + 1,
    }));

    const res = await fetch("/api/follows", {
      method: wasFollowing ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followerId: user.id, followingId: p.clerk_id }),
    });

    if (!res.ok) {
      // Revert
      setFollowed(followed);
      setLiveStats(s => ({
        ...s,
        following: wasFollowing ? s.following + 1 : Math.max(0, s.following - 1),
      }));
    }
  }

  const name         = profile?.display_name ?? user?.fullName ?? "Your Name";
  const username     = `@${profile?.username ?? user?.username ?? "yourhandle"}`;
  const location     = profile?.location ?? "";
  const tag          = profile?.tag ?? "Artist";
  const bio          = profile?.bio ?? "Tell the world about your art. Click Edit Profile to update.";
  const avatar       = profile?.avatar_url ?? user?.imageUrl ?? "https://i.pravatar.cc/200?img=33";
  const followers    = liveStats.followers;
  const following    = liveStats.following;
  const totalLikes   = liveStats.totalLikes;
  const rating       = profile?.rating ?? 0;
  const available    = profile?.available ?? true;
  const responseTime = profile?.response_time ?? "Within 24 hours";

  // Total saves across all posts
  const totalSaves  = dbPosts.reduce((s, p) => s + (p.saves_count ?? 0), 0);

  // Recent activity from real posts
  const recentActivity = dbPosts.slice(0, 3).map(p => ({
    text:  `Uploaded "${p.title}"`,
    time:  timeAgo(p.created_at),
    color: "#9B7CF5",
  }));

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen min-w-0">
        <MainHeader />

        <main className="flex-1 flex gap-0 pb-24 lg:pb-0">

          {/* Loading skeleton — only while Clerk hasn't resolved yet */}
          {!isLoaded ? (
            <div className="flex-1 min-w-0 px-4 md:px-8 py-6">
              <ProfileSkeleton />
            </div>
          ) : null}

          {/* ── Centre ── */}
          <div className={`flex-1 min-w-0 px-4 md:px-8 py-6${!isLoaded ? " hidden" : ""}`}>

            {/* ── Profile header ── */}
            <div className="mb-6">
              <div className="flex items-start gap-5">
                {/* Avatar — square rounded */}
                <div className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatar} alt={name}
                    className="w-24 h-24 rounded-2xl object-cover"
                    style={{ border: "2px solid rgba(124,91,245,0.3)" }} />
                  {available && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2"
                      style={{ background: "#10B981", borderColor: "var(--bg)" }} />
                  )}
                </div>

                {/* Center info */}
                <div className="flex-1 min-w-0">
                  {/* Name + verified */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <h1 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>{name}</h1>
                    {rating >= 4.0 && <CheckCircle2 size={18} style={{ color: "#7C5BF5" }} />}
                  </div>

                  {/* @username · location */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm" style={{ color: "var(--text-4)" }}>{username}</span>
                    {location && (
                      <>
                        <span style={{ color: "var(--text-6)" }}>·</span>
                        <MapPin size={12} style={{ color: "var(--text-5)" }} />
                        <span className="text-sm" style={{ color: "var(--text-4)" }}>{location}</span>
                      </>
                    )}
                  </div>

                  {/* Tag chips */}
                  {tag && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tag.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                        <span key={t} className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{ border: "1px solid var(--border)", color: "var(--text-3)", background: "var(--bg-subtle)" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                </div>

                {/* Action buttons — top right */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setShareOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
                    style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-3)" }}>
                    <Share2 size={15} /> Share
                  </button>
                  <button onClick={() => openEdit("Basic Info")}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                    style={{ background: "#7C5BF5", color: "#fff" }}>
                    <Pencil size={14} /> Edit Profile
                  </button>
                </div>
              </div>

              {/* Stats bar — below, separated by a divider */}
              <div className="mt-6 pt-5 flex items-center gap-8 flex-wrap"
                style={{ borderTop: "1px solid var(--border)" }}>
                {[
                  { value: dbPosts.length,  label: "Portfolio",  onClick: undefined },
                  { value: followers >= 1000 ? `${(followers / 1000).toFixed(1)}K` : followers, label: "Followers",  onClick: () => openFollowList("followers") },
                  { value: following >= 1000 ? `${(following / 1000).toFixed(1)}K` : following, label: "Following",  onClick: () => openFollowList("following") },
                  { value: 0,               label: "Completed",  onClick: undefined },
                  { value: totalLikes >= 1000000 ? `${(totalLikes / 1000000).toFixed(1)}M` : totalLikes >= 1000 ? `${(totalLikes / 1000).toFixed(1)}K` : totalLikes, label: "Likes", onClick: undefined },
                  { value: rating > 0 ? `${rating.toFixed(1)}★` : "—", label: "Rating",    onClick: undefined },
                ].map(({ value, label, onClick }) => (
                  <button key={label} onClick={onClick}
                    className="flex flex-col gap-0.5 text-left transition-opacity"
                    style={{ cursor: onClick ? "pointer" : "default", opacity: 1 }}
                    onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.opacity = "0.7"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}>
                    <p className="text-lg font-bold leading-none" style={{ color: "var(--text-1)" }}>{value}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-5)" }}>{label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 mb-5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {([
                { tab: "Portfolio",    icon: LayoutGrid, count: dbPosts.length },
                { tab: "Gallery", icon: Store,       count: 0  },
                { tab: "Services",    icon: Briefcase,   count: 0  },
                { tab: "Saved",       icon: Bookmark,    count: liveStats.totalSaves },
                { tab: "About",       icon: UserCircle,  count: 0  },
              ] as const).map(({ tab, icon: Icon, count }) => (
                <button key={tab} onClick={() => setActiveTab(tab as Tab)}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: activeTab === tab ? "rgba(124,91,245,0.15)" : "transparent",
                    color:      activeTab === tab ? "#9B7CF5" : "var(--text-4)",
                    border:     activeTab === tab ? "1px solid rgba(124,91,245,0.3)" : "1px solid transparent",
                  }}>
                  <Icon size={13} strokeWidth={1.8} />
                  {tab}
                  {count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: activeTab === tab ? "rgba(124,91,245,0.25)" : "var(--bg-subtle)", color: activeTab === tab ? "#9B7CF5" : "var(--text-5)" }}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Portfolio */}
            {activeTab === "Portfolio" && (
              dbPosts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {dbPosts.map(post => {
                    const src = firstImage(post.image_url);
                    const isVid = isVideoUrl(src);
                    return (
                      <button key={post.id} onClick={() => setOpenPostModal(post)}
                        className="rounded-xl overflow-hidden group cursor-pointer relative block text-left w-full"
                        style={{ aspectRatio: "1", background: "var(--bg-subtle)" }}>
                        {isVid ? (
                          <video src={src} className="w-full h-full object-cover"
                            muted playsInline preload="metadata"
                            onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                            onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }} />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex flex-col items-start justify-end p-2.5">
                          <p className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-semibold text-white truncate w-full mb-1">{post.title}</p>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[11px] text-white"><Heart size={11} /> {post.likes_count}</span>
                            <span className="flex items-center gap-1 text-[11px] text-white"><Bookmark size={11} /> {post.saves_count}</span>
                          </div>
                        </div>
                        {isVid && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>▶</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-20 gap-3">
                  <p className="text-4xl">🎨</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>No posts yet</p>
                  <p className="text-xs" style={{ color: "var(--text-5)" }}>Upload your first artwork to get started</p>
                </div>
              )
            )}


            {/* Saved */}
            {activeTab === "Saved" && (
              savedPosts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {savedPosts.map(post => {
                    const src = firstImage(post.image_url);
                    const isVid = isVideoUrl(src);
                    return (
                      <button key={post.id} onClick={() => setOpenPostModal(post)}
                        className="rounded-xl overflow-hidden group cursor-pointer relative w-full text-left"
                        style={{ aspectRatio: "1", background: "var(--bg-subtle)" }}>
                        {isVid ? (
                          <video src={src} className="w-full h-full object-cover"
                            muted playsInline preload="metadata"
                            onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                            onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }} />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex flex-col items-start justify-end p-2.5">
                          <p className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-semibold text-white truncate w-full mb-1">{post.title}</p>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] text-white"><Heart size={11} /> {post.likes_count}</span>
                        </div>
                        {isVid && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>▶</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-20 gap-3">
                  <p className="text-4xl">🔖</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>No saved posts yet</p>
                  <p className="text-xs" style={{ color: "var(--text-5)" }}>Posts you save will appear here</p>
                </div>
              )
            )}

            {/* ── Services tab ── */}
            {activeTab === "Services" && (
              <div className="flex flex-col gap-6">
                {/* Featured service card — only show image posts */}
                {(() => {
                  const featuredPost = dbPosts.find(p => !isVideoUrl(firstImage(p.image_url)));
                  if (!featuredPost) return null;
                  return (
                  <div className="rounded-2xl overflow-hidden flex"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", minHeight: 220 }}>
                    <div className="w-2/5 shrink-0 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={firstImage(featuredPost.image_url)} alt={featuredPost.title}
                        className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 p-6 flex flex-col">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[11px] font-bold tracking-wider" style={{ color: "#9B7CF5" }}>FEATURED</span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold"
                          style={{ color: "#10B981" }}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#10B981" }} />
                          Available
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-1)" }}>{featuredPost.title}</h3>
                      <p className="text-sm mb-4 flex-1" style={{ color: "var(--text-4)" }}>
                        {featuredPost.category ?? "Original artwork commission"}
                      </p>
                      {rating > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={14} fill={i < Math.round(rating) ? "#F59E0B" : "none"}
                                style={{ color: "#F59E0B" }} />
                            ))}
                          </div>
                          <span className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{rating.toFixed(1)}</span>
                          <span className="text-xs" style={{ color: "var(--text-5)" }}>· {dbPosts.length} orders completed</span>
                        </div>
                      )}
                      <div className="flex items-end justify-between mt-auto">
                        <div>
                          <p className="text-xs mb-0.5" style={{ color: "var(--text-5)" }}>Starting at</p>
                          <p className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>
                            ${Math.round((80 + (rating || 3) * 40) / 10) * 10}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-5)" }}>
                            <span className="flex items-center gap-1"><Clock size={12} /> 5–7 days</span>
                          </div>
                          <button onClick={() => openEdit("Services")}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
                            style={{ background: "#7C5BF5" }}>
                            Request Service →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })()}

                {/* Search + sort + grid */}
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
                      style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                      <Eye size={14} style={{ color: "var(--text-5)" }} />
                      <input
                        type="text"
                        value={serviceSearch}
                        onChange={e => setServiceSearch(e.target.value)}
                        placeholder="Search services..."
                        className="flex-1 bg-transparent outline-none text-sm"
                        style={{ color: "var(--text-1)" }}
                      />
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--text-5)" }}>
                      <span>Sort:</span>
                      {(["Popular", "Latest", "Price"] as const).map(s => (
                        <button key={s} onClick={() => setServiceSort(s)} className="px-3 py-1.5 rounded-lg transition-all"
                          style={{
                            background: serviceSort === s ? "var(--bg-subtle)" : "transparent",
                            color: serviceSort === s ? "var(--text-1)" : "var(--text-5)",
                            fontWeight: serviceSort === s ? 700 : 400,
                            border: serviceSort === s ? "1px solid var(--border)" : "none",
                          }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    const q = serviceSearch.toLowerCase();
                    let filtered = dbPosts.filter(p => {
                      const src = firstImage(p.image_url);
                      if (isVideoUrl(src)) return false;
                      if (!q) return true;
                      return p.title?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
                    });
                    if (serviceSort === "Latest") filtered = [...filtered].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
                    else if (serviceSort === "Price") filtered = [...filtered].sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0));
                    else filtered = [...filtered].sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0));
                    return filtered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filtered.map((post, idx) => {
                        const src = firstImage(post.image_url);
                        if (isVideoUrl(src)) return null;
                        const price = Math.round((80 + (rating || 3) * 40 + idx * 30) / 10) * 10;
                        return (
                          <div key={post.id} className="rounded-2xl overflow-hidden"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                            <div className="relative" style={{ height: 200 }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt={post.title} className="w-full h-full object-cover" />
                              <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold"
                                style={{ background: "#F59E0B", color: "#000" }}>
                                From ${price}
                              </span>
                            </div>
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-bold text-sm" style={{ color: "var(--text-1)" }}>{post.title}</h4>
                                <span className="text-[11px] font-semibold flex items-center gap-1"
                                  style={{ color: available ? "#10B981" : "#EF4444" }}>
                                  <span className="w-1.5 h-1.5 rounded-full inline-block"
                                    style={{ background: available ? "#10B981" : "#EF4444" }} />
                                  {available ? "Available" : "Fully Booked"}
                                </span>
                              </div>
                              <p className="text-xs mb-3" style={{ color: "var(--text-5)" }}>
                                {post.category ?? "Original artwork"}
                              </p>
                              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-5)" }}>
                                <span className="flex items-center gap-1"><Clock size={11} /> 5–7d</span>
                                <span className="flex items-center gap-1"><Copy size={11} /> 2×</span>
                                {rating > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Star size={11} fill="#F59E0B" style={{ color: "#F59E0B" }} />
                                    {rating.toFixed(1)} ({post.likes_count})
                                  </span>
                                )}
                                <span className="ml-auto" style={{ color: "var(--text-4)" }}>→</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-16 gap-4">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: "rgba(124,91,245,0.1)", border: "1px solid rgba(124,91,245,0.2)" }}>
                        <Briefcase size={24} style={{ color: "#9B7CF5" }} />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold mb-1" style={{ color: "var(--text-2)" }}>No services yet</p>
                        <p className="text-sm" style={{ color: "var(--text-5)" }}>Add your first service to start getting hired</p>
                      </div>
                      <button onClick={() => openEdit("Services")}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}>
                        <Plus size={15} /> Add Service
                      </button>
                    </div>
                  );
                  })()}
                </div>
              </div>
            )}

            {activeTab === "Gallery" && (
              <div className="flex flex-col items-center py-20 gap-3">
                <p className="text-3xl">🖼️</p>
                <p className="text-sm" style={{ color: "var(--text-5)" }}>Gallery coming soon</p>
              </div>
            )}

            {activeTab === "About" && (
              <div className="rounded-2xl p-5 flex flex-col gap-4"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                {[
                  { label: "Display Name", value: name },
                  { label: "Username",     value: username },
                  { label: "Location",     value: location || "Not set" },
                  { label: "Tag / Role",   value: tag },
                  { label: "Response Time",value: responseTime },
                  { label: "Availability", value: available ? "Available for new projects" : "Currently busy" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2"
                    style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="text-xs font-semibold" style={{ color: "var(--text-5)" }}>{label}</span>
                    <span className="text-sm" style={{ color: "var(--text-2)" }}>{value}</span>
                  </div>
                ))}
                {bio && (
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-5)" }}>Bio</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>{bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div className="hidden xl:flex flex-col gap-4 w-72 shrink-0 px-4 py-6"
            style={{ borderLeft: "1px solid var(--border)" }}>

            {/* Availability */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full"
                  style={{ background: available ? "#10B981" : "#9CA3AF" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Availability Status</p>
              </div>
              <p className="text-xs mb-3" style={{ color: "var(--text-4)" }}>
                {available ? "Available for new projects" : "Currently busy"}
              </p>
              {[
                { label: "Response time:", value: responseTime },
                { label: "Posts:",         value: dbPosts.length.toString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: "var(--text-5)" }}>{label}</span>
                  <span className="font-semibold" style={{ color: "var(--text-2)" }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Featured Work */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} style={{ color: "#9B7CF5" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Featured Work</p>
              </div>
              {dbPosts.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-5)" }}>No posts yet — create your first!</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {dbPosts.slice(0, 3).map(p => (
                    <Link key={p.id} href={`/feed/${p.id}`}
                      className="flex items-center justify-between py-2 rounded-lg px-2 transition-colors"
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "var(--bg-hover)")}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
                      <span className="text-xs font-medium truncate flex-1" style={{ color: "var(--text-2)" }}>{p.title}</span>
                      <span className="text-[10px] shrink-0 ml-2" style={{ color: "var(--text-5)" }}>♥ {p.likes_count}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} style={{ color: "#9B7CF5" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Recent Activity</p>
              </div>
              {recentActivity.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-5)" }}>No activity yet</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentActivity.map(({ text, time, color }, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                      <div>
                        <p className="text-xs" style={{ color: "var(--text-3)" }}>{text}</p>
                        <p className="text-[10px]" style={{ color: "var(--text-5)" }}>{time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Artists */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} style={{ color: "#9B7CF5" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Recommended Artists</p>
              </div>
              {recommended.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-5)" }}>No other artists yet</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {recommended.map(p => (
                    <div key={p.clerk_id} className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.avatar_url ?? `https://i.pravatar.cc/80?u=${p.clerk_id}`}
                        alt={p.display_name ?? "Artist"}
                        className="w-8 h-8 rounded-full object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Link href={`/u/${(p.username || p.clerk_id).replace(/^@+/, "")}`}>
                          <p className="text-xs font-semibold truncate hover:underline"
                            style={{ color: "var(--text-1)" }}>
                            {p.display_name ?? p.username}
                          </p>
                        </Link>
                        <p className="text-[10px]" style={{ color: "var(--text-5)" }}>{p.tag}</p>
                      </div>
                      <button
                        onClick={() => toggleFollow(p)}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 transition-all hover:opacity-80"
                        style={followed.has(p.clerk_id)
                          ? { background: "rgba(124,91,245,0.25)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.5)" }
                          : { background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.3)" }}>
                        {followed.has(p.clerk_id) ? "Following" : "Follow"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <BottomNav />

      {/* ── Followers / Following Modal ── */}
      {(followModal || followLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={e => e.target === e.currentTarget && setFollowModal(null)}
        >
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-sm font-bold flex-1 capitalize" style={{ color: "var(--text-1)" }}>
                {followModal?.type ?? "Loading…"}
              </h3>
              <button onClick={() => setFollowModal(null)} style={{ color: "var(--text-5)" }}>
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 420, scrollbarWidth: "none" }}>
              {followLoading && (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{ borderColor: "var(--bg-subtle)", borderTopColor: "#7C5BF5" }} />
                </div>
              )}

              {!followLoading && followModal?.users.length === 0 && (
                <p className="text-sm text-center py-10" style={{ color: "var(--text-5)" }}>
                  No {followModal.type} yet
                </p>
              )}

              {!followLoading && followModal?.users.map(u => (
                <Link
                  key={u.clerk_id}
                  href={`/u/${(u.username || u.clerk_id).replace(/^@+/, "")}`}
                  onClick={() => setFollowModal(null)}
                  className="flex items-center gap-3 px-5 py-3 transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "var(--bg-hover)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u.avatar_url ?? `https://i.pravatar.cc/80?u=${u.clerk_id}`}
                    alt={u.display_name ?? "User"}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                    style={{ border: "2px solid rgba(124,91,245,0.3)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
                      {u.display_name ?? u.username}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-5)" }}>
                      @{u.username} · {u.tag}
                    </p>
                  </div>
                  <span className="text-xs font-medium shrink-0" style={{ color: "#9B7CF5" }}>View →</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Profile Modal — sidebar layout ── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="w-full flex overflow-hidden rounded-2xl"
            style={{ maxWidth: 860, height: 580, background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>

            {/* ── Left sidebar ── */}
            <div className="w-52 shrink-0 flex flex-col"
              style={{ background: "rgba(124,91,245,0.05)", borderRight: "1px solid var(--border)" }}>
              {/* Header */}
              <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-sm font-bold mb-0.5" style={{ color: "var(--text-1)" }}>Edit Profile</p>
                <p className="text-xs truncate" style={{ color: "var(--text-5)" }}>{name}</p>
              </div>

              {/* Nav */}
              <nav className="flex flex-col gap-0.5 p-3 flex-1">
                {([
                  { key: "Basic Info",   icon: UserCircle  },
                  { key: "Portfolio",    icon: LayoutGrid  },
                  { key: "Services",     icon: Briefcase   },
                  { key: "Availability", icon: Clock       },
                  { key: "Pricing",      icon: Store       },
                  { key: "Preferences",  icon: SlidersHorizontal },
                ] as { key: EditSection; icon: React.ElementType }[]).map(({ key, icon: Icon }) => (
                  <button key={key} onClick={() => setEditSection(key)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full"
                    style={{
                      background: editSection === key ? "rgba(124,91,245,0.15)" : "transparent",
                      color:      editSection === key ? "#9B7CF5" : "var(--text-4)",
                    }}>
                    <Icon size={15} strokeWidth={1.8} />
                    {key}
                  </button>
                ))}
              </nav>

              {/* Save button */}
              <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
                <button onClick={saveProfile} disabled={saving || avatarUploading}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>

            {/* ── Right content panel ── */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-4 shrink-0"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="text-base font-bold" style={{ color: "var(--text-1)" }}>{editSection}</h2>
                <button onClick={() => setShowEdit(false)}
                  className="transition-opacity hover:opacity-70" style={{ color: "var(--text-5)" }}>
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: "none" }}>

                {/* ── Basic Info ── */}
                {editSection === "Basic Info" && (
                  <div className="flex flex-col gap-5">
                    {/* Profile photo row */}
                    <div>
                      <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-5)" }}>Profile Photo</p>
                      <div className="flex items-center gap-4">
                        <div className="relative cursor-pointer shrink-0"
                          onClick={() => !avatarUploading && avatarInputRef.current?.click()}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={avatarPreview ?? avatar} alt="avatar"
                            className="w-16 h-16 rounded-xl object-cover"
                            style={{ border: "2px solid rgba(124,91,245,0.3)" }} />
                          {avatarUploading && (
                            <div className="absolute inset-0 rounded-xl flex items-center justify-center"
                              style={{ background: "rgba(0,0,0,0.5)" }}>
                              <Loader2 size={16} className="animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <button onClick={() => !avatarUploading && avatarInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 mb-1.5"
                            style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                            <Camera size={13} /> Upload Photo
                          </button>
                          <p className="text-[11px]" style={{ color: "var(--text-5)" }}>JPG, PNG or WEBP. Max 5 MB.</p>
                        </div>
                        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                      </div>
                    </div>

                    {/* Full Name + Username */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-5)" }}>Full Name</label>
                        <input value={editForm.display_name}
                          onChange={e => setEditForm(f => ({ ...f, display_name: e.target.value }))}
                          placeholder="Your full name"
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-5)" }}>Username</label>
                        <input value={editForm.username}
                          onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                          placeholder="@yourhandle"
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold" style={{ color: "var(--text-5)" }}>Bio</label>
                        <button className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-80"
                          style={{ color: "#9B7CF5" }}>
                          <Zap size={11} /> Improve with AI
                        </button>
                      </div>
                      <textarea value={editForm.bio}
                        onChange={e => setEditForm(f => ({ ...f, bio: e.target.value.slice(0, 400) }))}
                        placeholder="Tell the world about your art..."
                        rows={4}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                        style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
                      <p className="text-[11px] text-right mt-1" style={{ color: "var(--text-5)" }}>
                        {editForm.bio.length} / 400
                      </p>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-5)" }}>Location</label>
                      <input value={editForm.location}
                        onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                        placeholder="City, Country"
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
                    </div>

                    {saveError && (
                      <p className="text-xs text-center" style={{ color: "#EF4444" }}>{saveError}</p>
                    )}
                  </div>
                )}

                {/* ── Services ── */}
                {editSection === "Services" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs" style={{ color: "var(--text-5)" }}>
                        {dbPosts.length > 0 ? `${dbPosts.length} active · 0 paused` : "No services yet"}
                      </p>
                      <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
                        style={{ background: "#7C5BF5" }}>
                        <Plus size={13} /> Add Service
                      </button>
                    </div>
                    {dbPosts.length > 0 ? (
                      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                        {dbPosts.map((post, i) => (
                          <div key={post.id} className="flex items-center gap-3 px-4 py-3"
                            style={{ borderBottom: i < dbPosts.length - 1 ? "1px solid var(--border)" : "none" }}>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>{post.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {rating > 0 && (
                                  <span className="flex items-center gap-1 text-[11px]" style={{ color: "#F59E0B" }}>
                                    <Star size={10} fill="currentColor" /> {rating.toFixed(1)}
                                  </span>
                                )}
                                <span className="text-[11px]" style={{ color: "var(--text-5)" }}>
                                  {post.likes_count} orders · From ${Math.round((80 + (rating || 3) * 40) / 10) * 10}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {[
                                { icon: Pencil, label: "Edit" },
                                { icon: Copy,   label: "Duplicate" },
                                { icon: Pause,  label: "Pause" },
                                { icon: Trash2, label: "" },
                              ].map(({ icon: Icon, label }) => (
                                <button key={label || "del"}
                                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-opacity hover:opacity-70"
                                  style={{ color: label === "" ? "#EF4444" : "var(--text-4)" }}>
                                  <Icon size={13} />
                                  {label && <span>{label}</span>}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-12 gap-3">
                        <Briefcase size={32} style={{ color: "var(--text-6)" }} />
                        <p className="text-sm" style={{ color: "var(--text-5)" }}>No services yet. Add one to start getting hired.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Availability ── */}
                {editSection === "Availability" && (
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between p-4 rounded-xl"
                      style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Available for projects</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-5)" }}>Show as available to potential clients</p>
                      </div>
                      <button onClick={() => setEditForm(f => ({ ...f, available: !f.available }))}
                        className="w-11 h-6 rounded-full flex items-center px-0.5 transition-all shrink-0"
                        style={{ background: editForm.available ? "#7C5BF5" : "var(--bg-muted)" }}>
                        <span className="w-5 h-5 rounded-full bg-white shadow transition-transform"
                          style={{ transform: editForm.available ? "translateX(20px)" : "translateX(0)" }} />
                      </button>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-5)" }}>Response Time</label>
                      <input value={editForm.response_time}
                        onChange={e => setEditForm(f => ({ ...f, response_time: e.target.value }))}
                        placeholder="e.g. Within 24 hours"
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-5)" }}>Tag / Role</label>
                      <input value={editForm.tag}
                        onChange={e => setEditForm(f => ({ ...f, tag: e.target.value }))}
                        placeholder="e.g. Artist, Illustrator, UI/UX Designer"
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
                      <p className="text-[11px] mt-1" style={{ color: "var(--text-5)" }}>Comma-separated for multiple tags</p>
                    </div>
                  </div>
                )}

                {/* ── Other sections placeholder ── */}
                {(editSection === "Portfolio" || editSection === "Pricing" || editSection === "Preferences") && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(124,91,245,0.1)", border: "1px solid rgba(124,91,245,0.2)" }}>
                      <SlidersHorizontal size={22} style={{ color: "#9B7CF5" }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>{editSection} settings</p>
                    <p className="text-xs" style={{ color: "var(--text-5)" }}>Coming soon</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 flex items-center justify-between shrink-0"
                style={{ borderTop: "1px solid var(--border)" }}>
                <button onClick={() => { setShowEdit(false); setSaveError(null); }}
                  className="text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-4)" }}>
                  Cancel
                </button>
                <button onClick={saveProfile} disabled={saving || avatarUploading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}>
                  {saving ? "Saving…" : <><Check size={14} /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {openPostModal && (
        <PostModal
          post={openPostModal}
          isOwner={true}
          ownerId={user?.id}
          onClose={() => setOpenPostModal(null)}
          onUpdate={updated => setDbPosts(posts => posts.map(p => p.id === updated.id ? updated : p))}
        />
      )}
      {shareOpen && (
        <ShareModal
          url={shareUrl}
          title={`${profile?.display_name ?? profile?.username ?? "Artist"} on Ortist`}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
