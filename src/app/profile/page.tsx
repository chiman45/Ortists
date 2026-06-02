"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import { getPosts, type Post as DbPost } from "@/lib/db/posts";
import { getProfile, upsertProfile, type Profile } from "@/lib/db/profiles";
import { allPosts } from "@/lib/mockData";
import { useUser } from "@clerk/nextjs";
import { MapPin, Star, Heart, Bookmark, Users, TrendingUp, Clock } from "lucide-react";
import { useEffect, useState } from "react";

const TABS = ["Portfolio", "Marketplace", "Services", "Saved", "About"] as const;
type Tab = typeof TABS[number];

const PROFILE_FALLBACK = {
  name: "Your Name",
  username: "@yourhandle",
  location: "Add your location",
  tag: "Artist",
  bio: "Tell the world about your art. Click Edit Profile to update.",
  avatar: "https://i.pravatar.cc/200?img=33",
  followers: "0",
  following: 0,
  totalLikes: "0",
  rating: 0,
  availability: "Available for new projects",
  responseTime: "Within 24 hours",
  queue: "0 active projects",
};

const FEATURED = [
  { title: "Project Title 1", views: "2.4k views" },
  { title: "Project Title 2", views: "2.4k views" },
  { title: "Project Title 3", views: "2.4k views" },
];

const ACTIVITY = [
  { text: "Uploaded new artwork",        time: "2 hours ago",  color: "#9B7CF5" },
  { text: "Completed commission",        time: "1 day ago",    color: "#10B981" },
  { text: "New follower milestone",      time: "3 days ago",   color: "#F59E0B" },
];

const RECOMMENDED = [
  { name: "Sarah Chen",    role: "Digital Artist", avatar: "https://i.pravatar.cc/80?img=5"  },
  { name: "Marcus Blake",  role: "Artist",         avatar: "https://i.pravatar.cc/80?img=7"  },
  { name: "Olivia Rivera", role: "Digital Artist", avatar: "https://i.pravatar.cc/80?img=9"  },
];

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>("Portfolio");
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [dbPosts, setDbPosts]     = useState<DbPost[]>([]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    // Sync Clerk → Supabase profile
    upsertProfile({
      clerk_id:     user.id,
      display_name: user.fullName ?? user.firstName ?? "Artist",
      username:     user.username ?? user.id.slice(0, 12),
      avatar_url:   user.imageUrl,
    }).then(() => getProfile(user.id).then(setProfile));
    // Load user's own posts
    getPosts({ userId: user.id }).then(setDbPosts);
  }, [user, isLoaded]);

  const P = profile ? {
    name:         profile.display_name ?? PROFILE_FALLBACK.name,
    username:     `@${profile.username ?? PROFILE_FALLBACK.username}`,
    location:     profile.location ?? PROFILE_FALLBACK.location,
    tag:          profile.tag ?? PROFILE_FALLBACK.tag,
    bio:          profile.bio ?? PROFILE_FALLBACK.bio,
    avatar:       profile.avatar_url ?? user?.imageUrl ?? PROFILE_FALLBACK.avatar,
    followers:    profile.followers_count.toLocaleString(),
    following:    profile.following_count,
    totalLikes:   profile.total_likes.toLocaleString(),
    rating:       profile.rating,
    availability: profile.available ? "Available for new projects" : "Currently busy",
    responseTime: profile.response_time,
    queue:        "Active projects",
  } : {
    ...PROFILE_FALLBACK,
    name:   user?.fullName ?? PROFILE_FALLBACK.name,
    avatar: user?.imageUrl ?? PROFILE_FALLBACK.avatar,
    username: `@${user?.username ?? "yourhandle"}`,
  };

  const portfolioPosts = dbPosts.length > 0
    ? dbPosts.map(p => ({ ...allPosts[0], id: p.id, imageUrl: p.image_url, title: p.title }))
    : allPosts.slice(0, 9);

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">
        <MainHeader />

        <main className="flex-1 flex gap-0 pb-24 lg:pb-0">

          {/* ── Centre content ── */}
          <div className="flex-1 min-w-0 px-4 md:px-8 py-6">

            {/* Profile header card */}
            <div
              className="rounded-2xl p-5 mb-5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              {/* Top row */}
              <div className="flex flex-wrap items-start gap-4 mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={P.avatar}
                  alt={P.name}
                  className="w-20 h-20 rounded-full object-cover shrink-0"
                  style={{ border: "3px solid rgba(124,91,245,0.5)" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>{P.name}</h1>
                  </div>
                  <p className="text-sm mb-1.5" style={{ color: "var(--text-5)" }}>{P.username}</p>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin size={12} style={{ color: "var(--text-5)" }} />
                    <span className="text-xs" style={{ color: "var(--text-5)" }}>{P.location}</span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-1"
                      style={{ background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.3)" }}
                    >
                      {P.tag}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-4)" }}>{P.bio}</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
                    style={{ background: "#7C5BF5", color: "#fff" }}
                  >
                    Edit Profile
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
                    style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}
                  >
                    Share Profile
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                {[
                  { icon: Users,    value: P.followers,  label: "Followers"    },
                  { icon: Users,    value: P.following,  label: "Following"    },
                  { icon: Heart,    value: P.totalLikes, label: "Total Likes"  },
                  { icon: Star,     value: P.rating,     label: "Rating"       },
                ].map(({ icon: Icon, value, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(124,91,245,0.12)" }}>
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
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: activeTab === tab ? "rgba(124,91,245,0.15)" : "transparent",
                    color: activeTab === tab ? "#9B7CF5" : "var(--text-4)",
                    border: activeTab === tab ? "1px solid rgba(124,91,245,0.3)" : "1px solid transparent",
                  }}
                >
                  {tab}
                  {tab === "Portfolio" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: "rgba(124,91,245,0.2)", color: "#9B7CF5" }}>
                      248
                    </span>
                  )}
                  {tab === "Marketplace" && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(124,91,245,0.2)", color: "#9B7CF5" }}>42</span>}
                  {tab === "Services" && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(124,91,245,0.2)", color: "#9B7CF5" }}>8</span>}
                  {tab === "Saved" && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(124,91,245,0.2)", color: "#9B7CF5" }}>156</span>}
                </button>
              ))}
            </div>

            {/* Portfolio grid */}
            {activeTab === "Portfolio" && (
              <div className="columns-2 sm:columns-3 gap-3">
                {portfolioPosts.map(post => (
                  <div key={post.id} className="break-inside-avoid mb-3 rounded-xl overflow-hidden group cursor-pointer relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-end p-2">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[11px] text-white">
                          <Heart size={11} /> {post.likes}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-white">
                          <Bookmark size={11} /> Save
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab !== "Portfolio" && (
              <div className="flex items-center justify-center py-20" style={{ color: "var(--text-5)" }}>
                No {activeTab.toLowerCase()} content yet
              </div>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div
            className="hidden xl:flex flex-col gap-4 w-72 shrink-0 px-4 py-6"
            style={{ borderLeft: "1px solid var(--border)" }}
          >
            {/* Availability */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Availability Status</p>
              </div>
              <p className="text-xs mb-3" style={{ color: "var(--text-4)" }}>{P.availability}</p>
              {[
                { label: "Response time:", value: P.responseTime },
                { label: "Queue:",         value: P.queue },
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
              <div className="flex flex-col gap-2">
                {(dbPosts.length > 0 ? dbPosts.slice(0, 3) : []).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 cursor-pointer rounded-lg px-2 transition-colors"
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span className="text-xs font-medium truncate flex-1" style={{ color: "var(--text-2)" }}>{p.title}</span>
                    <span className="text-[10px] shrink-0 ml-2" style={{ color: "var(--text-5)" }}>{p.likes_count} likes</span>
                  </div>
                ))}
                {dbPosts.length === 0 && (
                  <p className="text-xs" style={{ color: "var(--text-5)" }}>No posts yet — create your first!</p>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} style={{ color: "#9B7CF5" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Recent Activity</p>
              </div>
              <div className="flex flex-col gap-3">
                {ACTIVITY.map(({ text, time, color }) => (
                  <div key={text} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                    <div>
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>{text}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-5)" }}>{time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Artists */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} style={{ color: "#9B7CF5" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Recommended Artists</p>
              </div>
              <div className="flex flex-col gap-3">
                {RECOMMENDED.map(({ name, role, avatar }) => (
                  <div key={name} className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text-1)" }}>{name}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-5)" }}>{role}</p>
                    </div>
                    <button
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 transition-opacity hover:opacity-80"
                      style={{ background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.3)" }}
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>

      <BottomNav />
    </div>
  );
}
