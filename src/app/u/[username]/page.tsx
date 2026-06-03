"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import { type Post as DbPost } from "@/lib/db/posts";
import { type Profile } from "@/lib/db/profiles";
import { getOrCreateConversation } from "@/lib/db/messages";
import { useUser } from "@clerk/nextjs";
import { Bookmark, Heart, MapPin, MessageCircle, Star, Users, UserPlus, TrendingUp } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { user } = useUser();
  const router = useRouter();

  const [profile, setProfile]     = useState<Profile | null>(null);
  const [posts, setPosts]         = useState<DbPost[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<"Portfolio" | "About">("Portfolio");

  useEffect(() => {
    async function load() {
      // Fetch profile via server API (bypasses RLS)
      const res = await fetch(`/api/profiles?username=${encodeURIComponent(username)}`);
      const { profile: found }: { profile: Profile | null } = await res.json();

      if (!found) { setLoading(false); return; }
      setProfile(found);

      // Fetch posts
      const postsRes = await fetch(`/api/posts?userId=${found.clerk_id}`);
      const { posts: userPosts } = await postsRes.json();
      setPosts(userPosts ?? []);

      // Check following status
      if (user && user.id !== found.clerk_id) {
        const fRes = await fetch(`/api/follows?followerId=${user.id}&followingId=${found.clerk_id}`);
        const { following: isF } = await fRes.json();
        setFollowing(isF);
      }

      setLoading(false);
    }
    load();
  }, [username, user]);

  async function handleFollow() {
    if (!user || !profile) return;
    if (following) {
      await fetch("/api/follows", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId: user.id, followingId: profile.clerk_id }),
      });
      setFollowing(false);
      setProfile(p => p ? { ...p, followers_count: Math.max(0, p.followers_count - 1) } : p);
    } else {
      await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId: user.id, followingId: profile.clerk_id }),
      });
      setFollowing(true);
      setProfile(p => p ? { ...p, followers_count: p.followers_count + 1 } : p);
    }
  }

  async function handleMessage() {
    if (!user || !profile) return;
    const conv = await getOrCreateConversation(user.id, profile.clerk_id);
    if (conv) router.push("/messages");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">
          <MainHeader />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--bg-subtle)", borderTopColor: "#7C5BF5" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">
          <MainHeader />
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <p className="text-4xl">🎨</p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>Artist not found</p>
            <Link href="/explore" className="text-xs transition-opacity hover:opacity-70" style={{ color: "#9B7CF5" }}>
              Browse all artists
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.clerk_id;

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">
        <MainHeader />

        <main className="flex-1 flex gap-0 pb-24 lg:pb-0">
          <div className="flex-1 min-w-0 px-4 md:px-8 py-6">

            {/* Back */}
            <Link href="/explore"
              className="inline-flex items-center gap-1.5 text-sm mb-5 transition-opacity hover:opacity-70"
              style={{ color: "var(--text-5)" }}>
              ← Explore
            </Link>

            {/* Profile card */}
            <div className="rounded-2xl overflow-hidden mb-5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              {/* Cover */}
              <div className="relative h-28 w-full" style={{ background: "linear-gradient(135deg,#1a0a3a,#2d1b69)" }}>
                <div className="absolute inset-0 opacity-25"
                  style={{ background: `url(https://picsum.photos/seed/${profile.clerk_id}cover/900/200) center/cover` }} />
              </div>

              <div className="px-5 pb-5">
                <div className="flex flex-wrap items-end gap-4 -mt-8 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile.avatar_url ?? `https://i.pravatar.cc/150?u=${profile.clerk_id}`}
                    alt={profile.display_name ?? "Artist"}
                    className="w-20 h-20 rounded-full object-cover shrink-0 relative z-10"
                    style={{ border: "3px solid var(--bg-card)" }} />
                  <div className="flex-1 min-w-0 pt-10">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>
                        {profile.display_name ?? profile.username}
                      </h1>
                      {profile.available && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>
                          Available
                        </span>
                      )}
                    </div>
                    <p className="text-sm mb-1" style={{ color: "#9B7CF5" }}>@{profile.username}</p>
                    {profile.location && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <MapPin size={12} style={{ color: "var(--text-5)" }} />
                        <span className="text-xs" style={{ color: "var(--text-5)" }}>{profile.location}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-1"
                          style={{ background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.3)" }}>
                          {profile.tag}
                        </span>
                      </div>
                    )}
                    {profile.bio && (
                      <p className="text-xs leading-relaxed mt-1" style={{ color: "var(--text-4)" }}>{profile.bio}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {!isOwnProfile && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={handleFollow}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
                        style={following
                          ? { background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.4)" }
                          : { background: "#7C5BF5", color: "#fff" }}>
                        <UserPlus size={14} />
                        {following ? "Following" : "Follow"}
                      </button>
                      <button onClick={handleMessage}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
                        style={{ background: "var(--bg-subtle)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                        <MessageCircle size={14} /> Message
                      </button>
                    </div>
                  )}
                  {isOwnProfile && (
                    <Link href="/profile"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
                      style={{ background: "#7C5BF5", color: "#fff" }}>
                      Edit Profile
                    </Link>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  {[
                    { icon: Users, value: profile.followers_count.toLocaleString(), label: "Followers" },
                    { icon: Users, value: profile.following_count.toLocaleString(), label: "Following" },
                    { icon: Heart, value: profile.total_likes.toLocaleString(),     label: "Likes"     },
                    { icon: Star,  value: profile.rating || "—",                   label: "Rating"    },
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
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5">
              {(["Portfolio", "About"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: activeTab === tab ? "rgba(124,91,245,0.15)" : "transparent",
                    color: activeTab === tab ? "#9B7CF5" : "var(--text-4)",
                    border: activeTab === tab ? "1px solid rgba(124,91,245,0.3)" : "1px solid transparent",
                  }}>
                  {tab}
                  {tab === "Portfolio" && posts.length > 0 && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: "rgba(124,91,245,0.2)", color: "#9B7CF5" }}>
                      {posts.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {activeTab === "Portfolio" && (
              posts.length > 0 ? (
                <div className="columns-2 sm:columns-3 gap-3">
                  {posts.map(p => (
                    <Link key={p.id} href={`/feed/${p.id}`}
                      className="break-inside-avoid mb-3 rounded-xl overflow-hidden group cursor-pointer relative block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image_url} alt={p.title}
                        className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-end p-2">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[11px] text-white">
                            <Heart size={11} /> {p.likes_count}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-white">
                            <Bookmark size={11} /> Save
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-16 gap-3">
                  <p className="text-3xl">🎨</p>
                  <p className="text-sm" style={{ color: "var(--text-5)" }}>No posts yet</p>
                </div>
              )
            )}

            {activeTab === "About" && (
              <div className="rounded-2xl p-5 flex flex-col gap-4"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                {profile.bio && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-5)" }}>Bio</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>{profile.bio}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-5)" }}>Availability</p>
                  <p className="text-sm font-medium" style={{ color: profile.available ? "#10B981" : "var(--text-4)" }}>
                    {profile.available ? "✓ Available for new projects" : "Currently busy"}
                  </p>
                  {profile.response_time && (
                    <p className="text-xs mt-1" style={{ color: "var(--text-5)" }}>
                      Response time: {profile.response_time}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="hidden xl:flex flex-col gap-4 w-72 shrink-0 px-4 py-6"
            style={{ borderLeft: "1px solid var(--border)" }}>
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full" style={{ background: profile.available ? "#10B981" : "#9CA3AF" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                  {profile.available ? "Available for projects" : "Currently busy"}
                </p>
              </div>
              {[
                { label: "Response time:", value: profile.response_time ?? "Not specified" },
                { label: "Location:",      value: profile.location ?? "Not specified" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: "var(--text-5)" }}>{label}</span>
                  <span className="font-semibold" style={{ color: "var(--text-2)" }}>{value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} style={{ color: "#9B7CF5" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Artist Stats</p>
              </div>
              {[
                { label: "Followers", value: profile.followers_count.toLocaleString() },
                { label: "Posts",     value: posts.length.toString() },
                { label: "Rating",    value: profile.rating ? `⭐ ${profile.rating}` : "No ratings yet" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs py-1.5"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-5)" }}>{label}</span>
                  <span className="font-semibold" style={{ color: "var(--text-2)" }}>{value}</span>
                </div>
              ))}
            </div>

            {!isOwnProfile && (
              <div className="flex flex-col gap-2">
                <button onClick={handleFollow}
                  className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-85"
                  style={following
                    ? { background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.4)" }
                    : { background: "linear-gradient(135deg,#361E7B,#7C5BF5)", boxShadow: "0 4px 20px rgba(124,91,245,0.35)" }}>
                  <UserPlus size={15} className="inline mr-2" />
                  {following ? "Following" : "Follow"}
                </button>
                <button onClick={handleMessage}
                  className="w-full py-3 rounded-2xl text-sm font-bold transition-opacity hover:opacity-85"
                  style={{ background: "var(--bg-subtle)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                  <MessageCircle size={15} className="inline mr-2" />
                  Send Message
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
