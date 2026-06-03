"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import { type Post as DbPost } from "@/lib/db/posts";
import { type Profile } from "@/lib/db/profiles";
import { useUser } from "@clerk/nextjs";
import {
  MapPin, Star, Heart, Bookmark, Users, TrendingUp,
  Clock, X, Check, Share2, Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const TABS = ["Portfolio", "Marketplace", "Services", "Saved", "About"] as const;
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
  const [profile, setProfile]           = useState<Profile | null>(null);
  const [dbPosts, setDbPosts]           = useState<DbPost[]>([]);
  const [recommended, setRecommended]   = useState<Profile[]>([]);
  const [followed, setFollowed]         = useState<Set<string>>(new Set());
  const [showEdit, setShowEdit]         = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState<string | null>(null);
  const [copied, setCopied]             = useState(false);
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

    // Load recommended artists (other users)
    fetch("/api/profiles")
      .then(r => r.json())
      .then(({ profiles }) => {
        const others = (profiles ?? []).filter((p: Profile) => p.clerk_id !== user.id).slice(0, 4);
        setRecommended(others);
      });
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
    setShowEdit(true);
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

          {/* ── Centre ── */}
          <div className="flex-1 min-w-0 px-4 md:px-8 py-6">

            {/* Profile header */}
            <div className="rounded-2xl p-5 mb-5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex flex-wrap items-start gap-4 mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatar} alt={name}
                  className="w-20 h-20 rounded-full object-cover shrink-0"
                  style={{ border: "3px solid rgba(124,91,245,0.5)" }} />

                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold mb-0.5" style={{ color: "var(--text-1)" }}>{name}</h1>
                  <p className="text-sm mb-1.5" style={{ color: "var(--text-5)" }}>{username}</p>
                  <div className="flex items-center gap-1.5 mb-2">
                    {location && <><MapPin size={12} style={{ color: "var(--text-5)" }} />
                    <span className="text-xs" style={{ color: "var(--text-5)" }}>{location}</span></>}
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
                {[
                  { icon: Users, value: followers.toLocaleString(), label: "Followers"   },
                  { icon: Users, value: following.toLocaleString(), label: "Following"   },
                  { icon: Heart, value: totalLikes.toLocaleString(),label: "Total Likes" },
                  { icon: Star,  value: rating || "—",              label: "Rating"      },
                ].map(({ icon: Icon, value, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(124,91,245,0.12)" }}>
                      <Icon size={13} style={{ color: "#9B7CF5" }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-none" style={{ color: "var(--text-1)" }}>{value}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-5)" }}>{label}</p>
                    </div>
                  </div>
                ))}
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

            {activeTab !== "Portfolio" && activeTab !== "About" && (
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
              <button onClick={saveProfile} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
                style={{ background: "#7C5BF5", color: "#fff" }}>
                {saving ? "Saving…" : <><Check size={14} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
