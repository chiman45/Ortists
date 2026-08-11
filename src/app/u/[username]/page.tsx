"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import HireModal from "@/components/hiring/HireModal";
import PostModal from "@/components/ui/PostModal";
import { type Post as DbPost } from "@/lib/db/posts";
import { type Profile } from "@/lib/db/profiles";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Bookmark, Briefcase, Heart, MapPin, Star, Users, UserPlus, TrendingUp, X } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { firstImage } from "@/lib/imageUrl";

const isVideoUrl = (u: string) => /\.(mp4|webm|mov|avi|mkv|ogv)(\?|$)/i.test(u);

interface FollowUser {
  clerk_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  tag: string;
}

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username: rawUsername } = use(params);
  // Decode %40 → @ then strip leading @ so /u/@Piyush and /u/%40Piyush both resolve correctly
  const username = decodeURIComponent(rawUsername).replace(/^@+/, "");
  const { user } = useUser();
  const router = useRouter();

  const [profile, setProfile]         = useState<Profile | null>(null);
  const [posts, setPosts]             = useState<DbPost[]>([]);
  const [following, setFollowing]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<"Portfolio" | "About">("Portfolio");
  const [followModal, setFollowModal] = useState<{ type: "followers" | "following"; users: FollowUser[] } | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [followPending, setFollowPending] = useState(false);
  const [openPostModal, setOpenPostModal] = useState<DbPost | null>(null);
  const [hireOpen, setHireOpen] = useState(false);

  useEffect(() => {
    async function load() {
      // Fetch profile via server API (bypasses RLS)
      const res = await fetch(`/api/profiles?username=${encodeURIComponent(username)}`, { cache: "no-store" });
      const json = await res.json();
      const found: Profile | null = json.profile ?? null;

      if (!found) {
        console.error("[profile page] not found for param:", username, "| raw response:", json);
        setLoading(false);
        return;
      }
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

  async function openFollowList(type: "followers" | "following") {
    if (!profile) return;
    setFollowLoading(true);
    const res = await fetch(`/api/follows/list?userId=${profile.clerk_id}&type=${type}`);
    const { users } = await res.json();
    setFollowModal({ type, users: users ?? [] });
    setFollowLoading(false);
  }

  async function handleFollow() {
    if (!user || !profile || followPending) return;
    setFollowPending(true);
    const wasFollowing = following;
    // Optimistic update
    setFollowing(!wasFollowing);
    setProfile(p => p ? {
      ...p,
      followers_count: wasFollowing
        ? Math.max(0, p.followers_count - 1)
        : p.followers_count + 1,
    } : p);

    try {
      const res = await fetch("/api/follows", {
        method: wasFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId: user.id, followingId: profile.clerk_id }),
      });
      if (!res.ok) {
        // Revert on failure
        setFollowing(wasFollowing);
        setProfile(p => p ? {
          ...p,
          followers_count: wasFollowing
            ? p.followers_count + 1
            : Math.max(0, p.followers_count - 1),
        } : p);
      }
    } finally {
      setFollowPending(false);
    }
  }

  function handleHire() {
    if (!user) { router.push("/login?redirect=" + encodeURIComponent(`/u/${username}`)); return; }
    setHireOpen(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-17 min-h-screen min-w-0">
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
        <div className="flex-1 flex flex-col lg:ml-17 min-h-screen min-w-0">
          <MainHeader />
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <p className="text-4xl">🎨</p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>Artist not found</p>
            <p className="text-[11px] font-mono px-2 py-1 rounded" style={{ color: "var(--text-5)", background: "var(--bg-subtle)" }}>{username}</p>
            <Link href="/feed" className="text-xs transition-opacity hover:opacity-70" style={{ color: "#9B7CF5" }}>
              Back to feed
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
      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen min-w-0">
        <MainHeader />

        <main className="flex-1 flex gap-0 pb-24 lg:pb-0">
          <div className="flex-1 min-w-0 px-4 md:px-8 py-6">

            {/* Profile card */}
            <div className="rounded-2xl overflow-hidden mb-5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              {/* Cover — back arrow floats here */}
              <div className="relative h-28 w-full" style={{ background: "linear-gradient(135deg,#1a0a3a,#2d1b69)" }}>
                <div className="absolute inset-0 opacity-25"
                  style={{ background: `url(https://picsum.photos/seed/${profile.clerk_id}cover/900/200) center/cover` }} />
                <Link href="/feed"
                  className="absolute top-3 left-3 w-9 h-9 flex items-center justify-center rounded-full transition-all hover:opacity-80 z-10"
                  style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <ArrowLeft size={16} color="#fff" />
                </Link>
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
                        disabled={followPending}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-85 disabled:opacity-60"
                        style={following
                          ? { background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.4)" }
                          : { background: "#7C5BF5", color: "#fff" }}>
                        <UserPlus size={14} />
                        {followPending ? "…" : following ? "Following" : "Follow"}
                      </button>
                      <button onClick={handleHire}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-85"
                        style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}>
                        <Briefcase size={14} /> Hire
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
                  <button onClick={() => openFollowList("followers")} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(124,91,245,0.12)" }}>
                      <Users size={13} style={{ color: "#9B7CF5" }} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold leading-none" style={{ color: "var(--text-1)" }}>{profile.followers_count.toLocaleString()}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-5)" }}>Followers</p>
                    </div>
                  </button>
                  <button onClick={() => openFollowList("following")} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(124,91,245,0.12)" }}>
                      <Users size={13} style={{ color: "#9B7CF5" }} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold leading-none" style={{ color: "var(--text-1)" }}>{profile.following_count.toLocaleString()}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-5)" }}>Following</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(124,91,245,0.12)" }}>
                      <Heart size={13} style={{ color: "#9B7CF5" }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-none" style={{ color: "var(--text-1)" }}>{profile.total_likes.toLocaleString()}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-5)" }}>Likes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(124,91,245,0.12)" }}>
                      <Star size={13} style={{ color: "#9B7CF5" }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-none" style={{ color: "var(--text-1)" }}>{profile.rating || "—"}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-5)" }}>Rating</p>
                    </div>
                  </div>
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
                  {posts.map(p => {
                    const src = firstImage(p.image_url);
                    const isVid = isVideoUrl(src);
                    return (
                      <button key={p.id} onClick={() => setOpenPostModal(p)}
                        className="block break-inside-avoid mb-3 rounded-xl overflow-hidden group cursor-pointer relative w-full text-left"
                        style={{ background: "var(--bg-subtle)" }}>
                        {isVid ? (
                          <video src={src} className="w-full object-cover"
                            muted playsInline preload="metadata"
                            onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                            onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }} />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt={p.title}
                            className="w-full h-auto transition-transform duration-300 group-hover:scale-[1.04]" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex flex-col items-start justify-end p-2.5">
                          <p className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-semibold text-white truncate w-full mb-1">{p.title}</p>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[11px] text-white"><Heart size={11} /> {p.likes_count}</span>
                            <span className="flex items-center gap-1 text-[11px] text-white"><Bookmark size={11} /> {p.saves_count}</span>
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
                  disabled={followPending}
                  className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-60"
                  style={following
                    ? { background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.4)" }
                    : { background: "linear-gradient(135deg,#361E7B,#7C5BF5)", boxShadow: "0 4px 20px rgba(124,91,245,0.35)" }}>
                  <UserPlus size={15} className="inline mr-2" />
                  {followPending ? "…" : following ? "Following" : "Follow"}
                </button>
                <button onClick={handleHire}
                  className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-85"
                  style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}>
                  <Briefcase size={15} className="inline mr-2" />
                  Hire Artist
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      <BottomNav />

      {openPostModal && (
        <PostModal
          post={openPostModal}
          isOwner={false}
          currentUserId={user?.id}
          onClose={() => setOpenPostModal(null)}
        />
      )}

      {hireOpen && profile && (
        <HireModal
          artist={{
            id: 0,
            name: profile.display_name ?? profile.username ?? "Artist",
            location: profile.location ?? "",
            medium: [],
            followers: String(profile.followers_count ?? 0),
            price: 0,
            rating: 5.0,
            available: true,
            avatar: profile.avatar_url ?? `https://i.pravatar.cc/80?u=${profile.clerk_id}`,
            cover: "",
            bio: profile.bio ?? "",
          }}
          artistClerkId={profile.clerk_id}
          onClose={() => setHireOpen(false)}
        />
      )}

      {/* Followers / Following Modal */}
      {(followModal || followLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={e => e.target === e.currentTarget && setFollowModal(null)}>
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
                <Link key={u.clerk_id} href={`/u/${(u.username || u.clerk_id).replace(/^@+/, "")}`}
                  onClick={() => setFollowModal(null)}
                  className="flex items-center gap-3 px-5 py-3 transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "var(--bg-hover)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u.avatar_url ?? `https://i.pravatar.cc/80?u=${u.clerk_id}`}
                    alt={u.display_name ?? "User"}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                    style={{ border: "2px solid rgba(124,91,245,0.3)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
                      {u.display_name ?? u.username}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-5)" }}>@{u.username} · {u.tag}</p>
                  </div>
                  <span className="text-xs font-medium shrink-0" style={{ color: "#9B7CF5" }}>View →</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
