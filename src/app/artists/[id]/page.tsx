"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import { ARTISTS } from "@/lib/hiringData";
import { Heart, Bookmark, MapPin, MessageCircle, Star, Users, TrendingUp, Clock, UserPlus } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";

const PORTFOLIO_SEEDS = [
  ["a1","a2","a3","a4","a5","a6","a7","a8","a9"],
  ["b1","b2","b3","b4","b5","b6","b7","b8","b9"],
  ["c1","c2","c3","c4","c5","c6","c7","c8","c9"],
  ["d1","d2","d3","d4","d5","d6","d7","d8","d9"],
  ["e1","e2","e3","e4","e5","e6","e7","e8","e9"],
  ["f1","f2","f3","f4","f5","f6","f7","f8","f9"],
  ["g1","g2","g3","g4","g5","g6","g7","g8","g9"],
  ["h1","h2","h3","h4","h5","h6","h7","h8","h9"],
  ["i1","i2","i3","i4","i5","i6","i7","i8","i9"],
  ["j1","j2","j3","j4","j5","j6","j7","j8","j9"],
  ["k1","k2","k3","k4","k5","k6","k7","k8","k9"],
  ["l1","l2","l3","l4","l5","l6","l7","l8","l9"],
];

const TABS = ["Portfolio", "About"] as const;
type Tab = typeof TABS[number];

export default function ArtistProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const artist = ARTISTS.find(a => a.id === Number(id)) ?? ARTISTS[0];

  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Portfolio");

  const portfolioSeeds = PORTFOLIO_SEEDS[(artist.id - 1) % PORTFOLIO_SEEDS.length];

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">
        <MainHeader />

        <main className="flex-1 flex gap-0 pb-24 lg:pb-0">

          {/* Centre */}
          <div className="flex-1 min-w-0 px-4 md:px-8 py-6">

            {/* Back */}
            <Link href="/hiring" className="inline-flex items-center gap-1.5 text-sm mb-5 transition-opacity hover:opacity-70" style={{ color: "var(--text-5)" }}>
              ← Back to Hiring
            </Link>

            {/* Profile header */}
            <div className="rounded-2xl p-5 mb-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              {/* Cover image strip */}
              <div className="relative w-full h-32 rounded-xl overflow-hidden mb-4 -mx-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://picsum.photos/seed/${artist.cover}cover/900/200`}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))" }} />
              </div>

              <div className="flex flex-wrap items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artist.avatar}
                  alt={artist.name}
                  className="w-20 h-20 rounded-full object-cover shrink-0 -mt-10 relative z-10"
                  style={{ border: "3px solid var(--bg-card)" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>{artist.name}</h1>
                    {artist.available ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>
                        Available
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(156,163,175,0.12)", color: "var(--text-5)", border: "1px solid var(--border)" }}>
                        Busy
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin size={12} style={{ color: "var(--text-5)" }} />
                    <span className="text-xs" style={{ color: "var(--text-5)" }}>{artist.location}</span>
                    {artist.medium.map(m => (
                      <span key={m} className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-1 capitalize"
                        style={{ background: "rgba(124,91,245,0.15)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.3)" }}>
                        {m}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-4)" }}>{artist.bio}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setFollowing(v => !v)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
                    style={{
                      background: following ? "rgba(124,91,245,0.15)" : "#7C5BF5",
                      color: following ? "#9B7CF5" : "#fff",
                      border: following ? "1px solid rgba(124,91,245,0.4)" : "none",
                    }}
                  >
                    <UserPlus size={14} />
                    {following ? "Following" : "Follow"}
                  </button>
                  <Link
                    href="/messages"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
                    style={{ background: "var(--bg-subtle)", color: "var(--text-2)", border: "1px solid var(--border)" }}
                  >
                    <MessageCircle size={14} /> Message
                  </Link>
                  <button
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
                    style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}
                  >
                    Hire · ${artist.price.toLocaleString()}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 pt-4 mt-2" style={{ borderTop: "1px solid var(--border)" }}>
                {[
                  { icon: Users, value: artist.followers, label: "Followers" },
                  { icon: Star,  value: artist.rating,    label: "Rating"    },
                  { icon: Heart, value: "2.1k",           label: "Likes"     },
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
            <div className="flex gap-1 mb-5">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: activeTab === tab ? "rgba(124,91,245,0.15)" : "transparent",
                    color: activeTab === tab ? "#9B7CF5" : "var(--text-4)",
                    border: activeTab === tab ? "1px solid rgba(124,91,245,0.3)" : "1px solid transparent",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Portfolio */}
            {activeTab === "Portfolio" && (
              <div className="columns-2 sm:columns-3 gap-3">
                {portfolioSeeds.map((seed, i) => (
                  <div key={seed} className="break-inside-avoid mb-3 rounded-xl overflow-hidden group cursor-pointer relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://picsum.photos/seed/${artist.cover}${seed}/400/${300 + (i % 3) * 80}`}
                      alt=""
                      className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-end p-2">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[11px] text-white"><Heart size={11} /> {120 + i * 37}</span>
                        <span className="flex items-center gap-1 text-[11px] text-white"><Bookmark size={11} /> Save</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* About */}
            {activeTab === "About" && (
              <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-1)" }}>About {artist.name}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-3)" }}>{artist.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {artist.medium.map(m => (
                    <span key={m} className="text-xs capitalize px-3 py-1.5 rounded-full font-medium"
                      style={{ background: "rgba(124,91,245,0.12)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.2)" }}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="hidden xl:flex flex-col gap-4 w-72 shrink-0 px-4 py-6" style={{ borderLeft: "1px solid var(--border)" }}>

            {/* Availability */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full" style={{ background: artist.available ? "#10B981" : "#9CA3AF" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                  {artist.available ? "Available for projects" : "Currently busy"}
                </p>
              </div>
              {[
                { label: "Starting from:", value: `$${artist.price.toLocaleString()}` },
                { label: "Response time:", value: "Within 24 hours" },
                { label: "Location:",      value: artist.location },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: "var(--text-5)" }}>{label}</span>
                  <span className="font-semibold" style={{ color: "var(--text-2)" }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Rating */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} style={{ color: "#9B7CF5" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Artist Stats</p>
              </div>
              {[
                { label: "Rating",     value: `⭐ ${artist.rating}` },
                { label: "Followers",  value: artist.followers },
                { label: "Projects",   value: "42 completed" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs py-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-5)" }}>{label}</span>
                  <span className="font-semibold" style={{ color: "var(--text-2)" }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} style={{ color: "#9B7CF5" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Recent Activity</p>
              </div>
              {[
                { text: "Uploaded new artwork",   time: "2 days ago",  color: "#9B7CF5" },
                { text: "Completed commission",   time: "1 week ago",  color: "#10B981" },
                { text: "Joined new exhibition",  time: "2 weeks ago", color: "#F59E0B" },
              ].map(({ text, time, color }) => (
                <div key={text} className="flex items-start gap-2 mb-2.5">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>{text}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-5)" }}>{time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Hire CTA */}
            <button
              className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-85"
              style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", boxShadow: "0 4px 20px rgba(124,91,245,0.35)" }}
            >
              Hire {artist.name.split(" ")[0]} · ${artist.price.toLocaleString()}
            </button>
          </div>

        </main>
      </div>

      <BottomNav />
    </div>
  );
}
