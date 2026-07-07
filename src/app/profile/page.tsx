"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import ProfileSkeleton from "@/components/ui/skeletons/ProfileSkeleton";
import StatCard from "@/components/dashboard/StatCard";
import EngagementChart from "@/components/dashboard/EngagementChart";
import TrafficSources from "@/components/dashboard/TrafficSources";
import CategoryBubbles from "@/components/dashboard/CategoryBubbles";
import RecentCommissions from "@/components/dashboard/RecentCommissions";
import { type Post as DbPost } from "@/lib/db/posts";
import { type Profile } from "@/lib/db/profiles";
import { useUser } from "@clerk/nextjs";
import {
  MapPin, Star, Heart, Bookmark, Users, TrendingUp,
  Clock, X, Check, Share2, Link as LinkIcon, Camera, Loader2,
  HelpCircle, ChevronRight, ArrowLeft, MessageSquare, FileText, Shield,
  Briefcase, Tag, Calendar, MessageCircle, Inbox,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface HireRequest {
  id: string;
  client_id: string;
  artist_id: string;
  client_name: string | null;
  client_avatar: string | null;
  what: string;
  categories: string[];
  budget: string | null;
  job_description: string | null;
  personal_note: string | null;
  hiring_for: string;
  status: "pending" | "accepted" | "declined" | "completed";
  created_at: string;
}

const HR_STATUS = {
  pending:   { label: "Pending",   color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)"  },
  accepted:  { label: "Accepted",  color: "#10B981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)"  },
  declined:  { label: "Declined",  color: "#EF4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)"   },
  completed: { label: "Completed", color: "#9B7CF5", bg: "rgba(124,91,245,0.12)",  border: "rgba(124,91,245,0.3)"  },
};

interface FollowUser {
  clerk_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  tag: string;
}

const TABS = ["Portfolio", "Marketplace", "Services", "About", "Settings"] as const;
type Tab = typeof TABS[number];
type SettingsSection = "saved" | "dashboard" | "help" | "received-hires" | null;

interface EditForm {
  display_name: string;
  username: string;
  bio: string;
  location: string;
  tag: string;
  available: boolean;
  response_time: string;
}

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

  const [activeTab, setActiveTab]             = useState<Tab>("Portfolio");
  const [settingsSection, setSettingsSection] = useState<SettingsSection>(null);
  const [receivedHires, setReceivedHires]     = useState<HireRequest[]>([]);
  const [hiresLoading, setHiresLoading]       = useState(false);
  const [profile, setProfile]           = useState<Profile | null>(null);
  const [dbPosts, setDbPosts]           = useState<DbPost[]>([]);
  const [savedPosts, setSavedPosts]     = useState<DbPost[]>([]);
  const [recommended, setRecommended]   = useState<Profile[]>([]);
  const [followed, setFollowed]         = useState<Set<string>>(new Set());
  const [showEdit, setShowEdit]         = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState<string | null>(null);
  const [copied, setCopied]             = useState(false);
  const [avatarPreview, setAvatarPreview]   = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef                        = useRef<HTMLInputElement>(null);
  const [bannerPreview, setBannerPreview]   = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef                        = useRef<HTMLInputElement>(null);
  const [followModal, setFollowModal]   = useState<{ type: "followers" | "following"; users: FollowUser[] } | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [editForm, setEditForm]         = useState<EditForm>({
    display_name: "", username: "", bio: "", location: "",
    tag: "Artist", available: true, response_time: "Within 24 hours",
  });

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

    // Load posts
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

    // Load received hire requests (artist side)
    setHiresLoading(true);
    fetch(`/api/hire-requests?artistId=${user.id}`)
      .then(r => r.json())
      .then(({ requests }) => { if (requests) setReceivedHires(requests); })
      .finally(() => setHiresLoading(false));
  }, [user, isLoaded]);

  function openEdit() {
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

  function shareProfile() {
    const url = `${window.location.origin}/u/${profile?.username ?? user?.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

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
    const isFollowing = followed.has(p.clerk_id);
    const next = new Set(followed);
    if (isFollowing) {
      await fetch("/api/follows", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId: user.id, followingId: p.clerk_id }),
      });
      next.delete(p.clerk_id);
    } else {
      await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId: user.id, followingId: p.clerk_id }),
      });
      next.add(p.clerk_id);
    }
    setFollowed(next);
  }

  const name         = profile?.display_name ?? user?.fullName ?? "Your Name";
  const username     = `@${profile?.username ?? user?.username ?? "yourhandle"}`;
  const location     = profile?.location ?? "";
  const tag          = profile?.tag ?? "Artist";
  const bio          = profile?.bio ?? "Tell the world about your art. Click Edit Profile to update.";
  const avatar       = profile?.avatar_url ?? user?.imageUrl ?? "https://i.pravatar.cc/200?img=33";
  const followers    = profile?.followers_count ?? 0;
  const following    = profile?.following_count ?? 0;
  const totalLikes   = profile?.total_likes ?? 0;
  const rating       = profile?.rating ?? 0;
  const available    = profile?.available ?? true;
  const responseTime = profile?.response_time ?? "Within 24 hours";

  // Dashboard stats derived from existing data
  const totalSaves  = dbPosts.reduce((s, p) => s + (p.saves_count ?? 0), 0);
  const dashStats = [
    { title: "My Posts",    value: dbPosts.length.toString(),         change: "", positive: true, data: [0,0,0,0,0,0,0,0,0,0,0,dbPosts.length],  color: "#10b981", gradId: "dp-posts"  },
    { title: "Total Likes", value: totalLikes.toLocaleString(),        change: "", positive: true, data: [0,0,0,0,0,0,0,0,0,0,0,totalLikes],       color: "#f43f5e", gradId: "dp-likes"  },
    { title: "Followers",   value: followers.toLocaleString(),         change: "", positive: true, data: [0,0,0,0,0,0,0,0,0,0,0,followers],        color: "#7C5BF5", gradId: "dp-follow" },
    { title: "Total Saves", value: totalSaves.toLocaleString(),        change: "", positive: true, data: [0,0,0,0,0,0,0,0,0,0,0,totalSaves],       color: "#F5C842", gradId: "dp-saves"  },
  ];

  // Recent activity from real posts
  const recentActivity = dbPosts.slice(0, 3).map(p => ({
    text:  `Uploaded "${p.title}"`,
    time:  timeAgo(p.created_at),
    color: "#9B7CF5",
  }));

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">
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

            {/* Profile header */}
            <div className="rounded-2xl overflow-hidden mb-5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

              {/* Banner */}
              <div className="relative h-32 w-full"
                style={{ background: "linear-gradient(135deg, #1a0a3a, #2d1b69)" }}>
                {profile?.banner_url && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={profile.banner_url} alt="banner"
                    className="absolute inset-0 w-full h-full object-cover" />
                )}
              </div>

              {/* Content */}
              <div className="px-5 pb-5">
                <div className="flex flex-wrap items-end gap-4 -mt-8 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatar} alt={name}
                    className="w-20 h-20 rounded-full object-cover shrink-0 relative z-10"
                    style={{ border: "3px solid var(--bg-card)" }} />

                  <div className="flex-1 min-w-0 pt-10">
                    <h1 className="text-xl font-bold mb-0.5" style={{ color: "var(--text-1)" }}>{name}</h1>
                    <p className="text-sm mb-1.5" style={{ color: "var(--text-5)" }}>{username}</p>
                    <div className="flex items-center gap-1.5 mb-2">
                      {location && (
                        <>
                          <MapPin size={12} style={{ color: "var(--text-5)" }} />
                          <span className="text-xs" style={{ color: "var(--text-5)" }}>{location}</span>
                        </>
                      )}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.3)" }}>
                        {tag}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-4)" }}>{bio}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={openEdit}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
                      style={{ background: "#7C5BF5", color: "#fff" }}>
                      Edit Profile
                    </button>
                    <button onClick={shareProfile}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
                      style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>
                      {copied ? <><LinkIcon size={13} /> Copied!</> : <><Share2 size={13} /> Share</>}
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <button onClick={() => openFollowList("followers")} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(124,91,245,0.12)" }}>
                      <Users size={13} style={{ color: "#9B7CF5" }} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold leading-none" style={{ color: "var(--text-1)" }}>{followers.toLocaleString()}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-5)" }}>Followers</p>
                    </div>
                  </button>
                  <button onClick={() => openFollowList("following")} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(124,91,245,0.12)" }}>
                      <Users size={13} style={{ color: "#9B7CF5" }} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold leading-none" style={{ color: "var(--text-1)" }}>{following.toLocaleString()}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-5)" }}>Following</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(124,91,245,0.12)" }}>
                      <Heart size={13} style={{ color: "#9B7CF5" }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-none" style={{ color: "var(--text-1)" }}>{totalLikes.toLocaleString()}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-5)" }}>Total Likes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(124,91,245,0.12)" }}>
                      <Star size={13} style={{ color: "#9B7CF5" }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-none" style={{ color: "var(--text-1)" }}>{rating || "—"}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-5)" }}>Rating</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: activeTab === tab ? "rgba(124,91,245,0.15)" : "transparent",
                    color:      activeTab === tab ? "#9B7CF5" : "var(--text-4)",
                    border:     activeTab === tab ? "1px solid rgba(124,91,245,0.3)" : "1px solid transparent",
                  }}>
                  {tab}
                  {tab === "Portfolio" && dbPosts.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: "rgba(124,91,245,0.2)", color: "#9B7CF5" }}>
                      {dbPosts.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Portfolio */}
            {activeTab === "Portfolio" && (
              dbPosts.length > 0 ? (
                <div className="columns-2 sm:columns-3 gap-3">
                  {dbPosts.map(post => (
                    <Link key={post.id} href={`/feed/${post.id}`}
                      className="break-inside-avoid mb-3 rounded-xl overflow-hidden group cursor-pointer relative block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.image_url} alt={post.title}
                        className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-end p-2">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[11px] text-white">
                            <Heart size={11} /> {post.likes_count}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-white">
                            <Bookmark size={11} /> {post.saves_count}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-20 gap-3">
                  <p className="text-4xl">🎨</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>No posts yet</p>
                  <p className="text-xs" style={{ color: "var(--text-5)" }}>Upload your first artwork to get started</p>
                </div>
              )
            )}

            {/* Settings — home menu */}
            {activeTab === "Settings" && settingsSection === null && (
              <div className="flex flex-col gap-3 max-w-lg">
                {[
                  {
                    id:    "saved"     as SettingsSection,
                    icon:  <Bookmark size={18} style={{ color: "#9B7CF5" }} />,
                    label: "Saved Posts",
                    desc:  `${savedPosts.length} saved`,
                  },
                  {
                    id:    "dashboard" as SettingsSection,
                    icon:  <TrendingUp size={18} style={{ color: "#10B981" }} />,
                    label: "Dashboard",
                    desc:  "Analytics & performance",
                  },
                  {
                    id:    "help"      as SettingsSection,
                    icon:  <HelpCircle size={18} style={{ color: "#F59E0B" }} />,
                    label: "Help Center",
                    desc:  "FAQs & support",
                  },
                  {
                    id:    "received-hires" as SettingsSection,
                    icon:  <Inbox size={18} style={{ color: "#10B981" }} />,
                    label: "Received Hires",
                    desc:  `${receivedHires.length} request${receivedHires.length !== 1 ? "s" : ""}`,
                  },
                ].map(row => (
                  <button
                    key={row.label}
                    onClick={() => setSettingsSection(row.id)}
                    className="flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all hover:opacity-85 w-full"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "var(--bg-subtle)" }}>
                      {row.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{row.label}</p>
                      <p className="text-xs" style={{ color: "var(--text-5)" }}>{row.desc}</p>
                    </div>
                    <ChevronRight size={16} style={{ color: "var(--text-5)" }} />
                  </button>
                ))}

                {/* My Hires — link to dedicated page */}
                <Link
                  href="/my-hires"
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all hover:opacity-85 w-full"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--bg-subtle)" }}>
                    <Briefcase size={18} style={{ color: "#9B7CF5" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>My Hires</p>
                    <p className="text-xs" style={{ color: "var(--text-5)" }}>Artists you have hired</p>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--text-5)" }} />
                </Link>
              </div>
            )}

            {/* Settings — Saved Posts */}
            {activeTab === "Settings" && settingsSection === "saved" && (
              <div>
                <button onClick={() => setSettingsSection(null)}
                  className="inline-flex items-center gap-1.5 text-sm mb-5 transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-4)" }}>
                  <ArrowLeft size={14} /> Back to Settings
                </button>
                {savedPosts.length > 0 ? (
                  <div className="columns-2 sm:columns-3 gap-3">
                    {savedPosts.map(post => (
                      <Link key={post.id} href={`/feed/${post.id}`}
                        className="break-inside-avoid mb-3 rounded-xl overflow-hidden group cursor-pointer relative block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.image_url} alt={post.title}
                          className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-end p-2">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[11px] text-white"><Heart size={11} /> {post.likes_count}</span>
                            <span className="flex items-center gap-1 text-[11px] text-white"><Bookmark size={11} /> {post.saves_count}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-20 gap-3">
                    <p className="text-4xl">🔖</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>No saved posts yet</p>
                    <p className="text-xs" style={{ color: "var(--text-5)" }}>Posts you save will appear here</p>
                  </div>
                )}
              </div>
            )}

            {/* Settings — Dashboard */}
            {activeTab === "Settings" && settingsSection === "dashboard" && (
              <div>
                <button onClick={() => setSettingsSection(null)}
                  className="inline-flex items-center gap-1.5 text-sm mb-5 transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-4)" }}>
                  <ArrowLeft size={14} /> Back to Settings
                </button>
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {dashStats.map(s => <StatCard key={s.gradId} {...s} />)}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2"><EngagementChart /></div>
                    <TrafficSources />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <CategoryBubbles />
                    <div className="lg:col-span-2">
                      <RecentCommissions posts={dbPosts} loading={!profile} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings — Help Center */}
            {activeTab === "Settings" && settingsSection === "help" && (
              <div className="max-w-lg">
                <button onClick={() => setSettingsSection(null)}
                  className="inline-flex items-center gap-1.5 text-sm mb-5 transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-4)" }}>
                  <ArrowLeft size={14} /> Back to Settings
                </button>
                <div className="flex flex-col gap-3">
                  {[
                    {
                      icon: <MessageSquare size={15} style={{ color: "#9B7CF5" }} />,
                      q: "How do I post artwork?",
                      a: "Click the purple + Create Post button in the sidebar. You can upload an image and add a title, description, and category.",
                    },
                    {
                      icon: <FileText size={15} style={{ color: "#10B981" }} />,
                      q: "How do I get hired on Ortist?",
                      a: "Keep your profile up to date, mark yourself as available, and post high-quality work. Clients can send you a Hire request directly from your posts or profile.",
                    },
                    {
                      icon: <Shield size={15} style={{ color: "#F59E0B" }} />,
                      q: "How do I delete my account?",
                      a: "Go to your Clerk account settings (click your avatar in the sidebar) and select Manage Account to delete or update your account details.",
                    },
                    {
                      icon: <HelpCircle size={15} style={{ color: "#f43f5e" }} />,
                      q: "Why can't I see my story views?",
                      a: "Story views are only visible to you as the owner. Tap the eye icon at the bottom of your story to see who has viewed it.",
                    },
                    {
                      icon: <MessageSquare size={15} style={{ color: "#9B7CF5" }} />,
                      q: "How do commissions work?",
                      a: "Clients can hire you by clicking the Hire button on your post or profile. You'll receive a message with their requirements. All communication happens through the Messages section.",
                    },
                  ].map(({ icon, q, a }, i) => (
                    <div key={i} className="rounded-2xl p-5"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        {icon}
                        <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{q}</p>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-4)" }}>{a}</p>
                    </div>
                  ))}

                  {/* Contact */}
                  <div className="rounded-2xl p-5 mt-1"
                    style={{ background: "rgba(124,91,245,0.08)", border: "1px solid rgba(124,91,245,0.25)" }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: "#9B7CF5" }}>Still need help?</p>
                    <p className="text-xs" style={{ color: "var(--text-4)" }}>
                      Reach out to us at{" "}
                      <a href="mailto:support@ortist.art" className="underline" style={{ color: "#9B7CF5" }}>
                        support@ortist.art
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Settings — Received Hires */}
            {activeTab === "Settings" && settingsSection === "received-hires" && (
              <div className="max-w-2xl">
                <button onClick={() => setSettingsSection(null)}
                  className="inline-flex items-center gap-1.5 text-sm mb-5 transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-4)" }}>
                  <ArrowLeft size={14} /> Back to Settings
                </button>

                {hiresLoading && (
                  <div className="flex justify-center py-20">
                    <Loader2 size={28} className="animate-spin" style={{ color: "#7C5BF5" }} />
                  </div>
                )}

                {!hiresLoading && receivedHires.length === 0 && (
                  <div className="flex flex-col items-center py-20 gap-3">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <Inbox size={28} style={{ color: "rgba(16,185,129,0.5)" }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>No hire requests yet</p>
                    <p className="text-xs text-center max-w-xs" style={{ color: "var(--text-5)" }}>
                      When clients send you a hire request it will appear here. Keep your profile updated to attract more work.
                    </p>
                  </div>
                )}

                {!hiresLoading && receivedHires.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {receivedHires.map(req => {
                      const sc = HR_STATUS[req.status] ?? HR_STATUS.pending;
                      const clientInitial = req.client_name?.[0]?.toUpperCase() ?? "C";
                      return (
                        <div key={req.id} className="rounded-2xl overflow-hidden"
                          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 2px 16px rgba(0,0,0,0.12)" }}>

                          {/* Header */}
                          <div className="flex items-center gap-4 px-5 py-4"
                            style={{ borderBottom: "1px solid var(--border)" }}>
                            {req.client_avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={req.client_avatar} alt={req.client_name ?? "Client"}
                                className="w-11 h-11 rounded-full object-cover shrink-0"
                                style={{ border: "2px solid rgba(124,91,245,0.35)" }} />
                            ) : (
                              <div className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white"
                                style={{ background: "linear-gradient(135deg,#1a6b4a,#10B981)" }}>
                                {clientInitial}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>
                                {req.client_name ?? "Client"}
                              </p>
                              <p className="text-xs truncate font-medium" style={{ color: "var(--text-4)" }}>
                                {req.what}
                              </p>
                            </div>
                            <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full"
                              style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                              {sc.label}
                            </span>
                          </div>

                          {/* Body */}
                          <div className="px-5 py-4 flex flex-col gap-3">
                            {/* Meta */}
                            <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--text-5)" }}>
                              {req.budget && (
                                <span className="flex items-center gap-1"><Tag size={11} /> {req.budget}</span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar size={11} />
                                {new Date(req.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px]"
                                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-4)" }}>
                                {req.hiring_for}
                              </span>
                            </div>

                            {/* Categories */}
                            {req.categories?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {req.categories.map(c => (
                                  <span key={c} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                    style={{ background: "rgba(124,91,245,0.1)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.2)" }}>
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Description */}
                            {req.job_description && (
                              <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-4)" }}>
                                {req.job_description}
                              </p>
                            )}

                            {/* Personal note */}
                            {req.personal_note && (
                              <div className="rounded-xl px-4 py-3"
                                style={{ background: "rgba(124,91,245,0.07)", border: "1px solid rgba(124,91,245,0.18)" }}>
                                <p className="text-[10px] font-semibold mb-1" style={{ color: "#9B7CF5" }}>Personal note</p>
                                <p className="text-xs leading-relaxed" style={{ color: "var(--text-4)" }}>{req.personal_note}</p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Link href="/messages"
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                                style={{ background: "rgba(124,91,245,0.12)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.25)" }}>
                                <MessageCircle size={13} /> Message
                              </Link>
                              {req.status === "pending" && user && (
                                <>
                                  <button
                                    onClick={async () => {
                                      await fetch(`/api/hire-requests/${req.id}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ status: "accepted", artistId: user.id }),
                                      });
                                      setReceivedHires(prev => prev.map(r => r.id === req.id ? { ...r, status: "accepted" } : r));
                                    }}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                                    style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>
                                    <Check size={13} /> Accept
                                  </button>
                                  <button
                                    onClick={async () => {
                                      await fetch(`/api/hire-requests/${req.id}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ status: "declined", artistId: user.id }),
                                      });
                                      setReceivedHires(prev => prev.map(r => r.id === req.id ? { ...r, status: "declined" } : r));
                                    }}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                                    style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                                    <X size={13} /> Decline
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab !== "Portfolio" && activeTab !== "About" && activeTab !== "Settings" && (
              <div className="flex flex-col items-center py-20 gap-3">
                <p className="text-3xl">🚧</p>
                <p className="text-sm" style={{ color: "var(--text-5)" }}>
                  No {activeTab.toLowerCase()} content yet
                </p>
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
                        <Link href={`/u/${p.username ?? p.clerk_id}`}>
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
                  href={`/u/${u.username ?? u.clerk_id}`}
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

      {/* ── Edit Profile Modal ── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={e => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-sm font-bold flex-1" style={{ color: "var(--text-1)" }}>Edit Profile</h3>
              <button onClick={() => setShowEdit(false)} className="transition-opacity hover:opacity-70" style={{ color: "var(--text-5)" }}>
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: "70vh", scrollbarWidth: "none" }}>

              {/* Avatar upload */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative group cursor-pointer" onClick={() => !avatarUploading && avatarInputRef.current?.click()}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarPreview ?? avatar}
                    alt="Profile photo"
                    className="w-20 h-20 rounded-full object-cover"
                    style={{ border: "3px solid rgba(124,91,245,0.5)" }}
                  />
                  <div className="absolute inset-0 rounded-full flex items-center justify-center transition-opacity"
                    style={{ background: "rgba(0,0,0,0.45)", opacity: 0 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "0"; }}>
                    {avatarUploading
                      ? <Loader2 size={20} className="animate-spin text-white" />
                      : <Camera size={20} className="text-white" />}
                  </div>
                </div>
                <p className="text-xs" style={{ color: "var(--text-5)" }}>
                  {avatarUploading ? "Uploading…" : "Click photo to change"}
                </p>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              {/* Banner upload */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-4)" }}>Banner Image</label>
                <div
                  className="relative w-full h-24 rounded-xl overflow-hidden cursor-pointer group"
                  style={{ background: "linear-gradient(135deg, #1a0a3a, #2d1b69)" }}
                  onClick={() => !bannerUploading && bannerInputRef.current?.click()}
                >
                  {(bannerPreview ?? profile?.banner_url) && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={bannerPreview ?? profile?.banner_url ?? ""}
                      alt="banner" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center transition-opacity bg-black/0 group-hover:bg-black/40">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs font-semibold text-white">
                      {bannerUploading
                        ? <><Loader2 size={14} className="animate-spin" /> Uploading…</>
                        : <><Camera size={14} /> Change Banner</>}
                    </span>
                  </div>
                </div>
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
              </div>

              {([
                { label: "Display Name",  key: "display_name"  as const, placeholder: "Your full name"           },
                { label: "Username",      key: "username"      as const, placeholder: "yourhandle"               },
                { label: "Location",      key: "location"      as const, placeholder: "City, Country"            },
                { label: "Tag / Role",    key: "tag"           as const, placeholder: "e.g. Artist, Illustrator" },
                { label: "Response Time", key: "response_time" as const, placeholder: "e.g. Within 24 hours"    },
              ] as const).map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-4)" }}>{label}</label>
                  <input
                    value={editForm[key] as string}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                  />
                </div>
              ))}

              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-4)" }}>Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell the world about your art..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>Available for projects</p>
                  <p className="text-xs" style={{ color: "var(--text-5)" }}>Show as available to potential clients</p>
                </div>
                <button
                  onClick={() => setEditForm(f => ({ ...f, available: !f.available }))}
                  className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors shrink-0"
                  style={{ background: editForm.available ? "#7C5BF5" : "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                  <span className="w-5 h-5 rounded-full bg-white shadow transition-transform"
                    style={{ transform: editForm.available ? "translateX(20px)" : "translateX(0)" }} />
                </button>
              </div>
            </div>

            {saveError && (
              <div className="px-5 pb-2">
                <p className="text-xs text-center" style={{ color: "#EF4444" }}>{saveError}</p>
              </div>
            )}

            <div className="flex items-center gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={() => { setShowEdit(false); setSaveError(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: "var(--bg-subtle)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
                Cancel
              </button>
              <button onClick={saveProfile} disabled={saving || avatarUploading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
                style={{ background: "#7C5BF5", color: "#fff" }}>
                {saving ? "Saving…" : avatarUploading ? "Uploading photo…" : <><Check size={14} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
