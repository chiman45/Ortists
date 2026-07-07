"use client";

import BottomNav from "@/components/layout/BottomNav";
import MainHeader from "@/components/layout/MainHeader";
import Sidebar from "@/components/layout/Sidebar";
import { useUser } from "@clerk/nextjs";
import { Briefcase, Calendar, ChevronRight, Loader2, MessageCircle, Tag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface HireRequest {
  id: string;
  client_id: string;
  artist_id: string;
  client_name: string | null;
  client_avatar: string | null;
  artist_name: string | null;
  artist_avatar: string | null;
  what: string;
  categories: string[];
  budget: string | null;
  job_description: string | null;
  personal_note: string | null;
  hiring_for: string;
  status: "pending" | "accepted" | "declined" | "completed";
  created_at: string;
}

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "#F59E0B", bg: "rgba(245,158,11,0.12)",   border: "rgba(245,158,11,0.3)"   },
  accepted:  { label: "Accepted",  color: "#10B981", bg: "rgba(16,185,129,0.12)",   border: "rgba(16,185,129,0.3)"   },
  declined:  { label: "Declined",  color: "#EF4444", bg: "rgba(239,68,68,0.12)",    border: "rgba(239,68,68,0.3)"    },
  completed: { label: "Completed", color: "#9B7CF5", bg: "rgba(124,91,245,0.12)",   border: "rgba(124,91,245,0.3)"   },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function MyHiresPage() {
  const { user, isLoaded } = useUser();
  const [requests, setRequests] = useState<HireRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<"all" | HireRequest["status"]>("all");

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetch(`/api/hire-requests?clientId=${user.id}`)
      .then(r => r.json())
      .then(d => { setRequests(d.requests ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, isLoaded]);

  const visible = filter === "all" ? requests : requests.filter(r => r.status === filter);

  const counts = {
    all:       requests.length,
    pending:   requests.filter(r => r.status === "pending").length,
    accepted:  requests.filter(r => r.status === "accepted").length,
    declined:  requests.filter(r => r.status === "declined").length,
    completed: requests.filter(r => r.status === "completed").length,
  };

  return (
    <div
      className="flex min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 8% 50%, rgba(54,30,123,0.16) 0%, transparent 55%)," +
          "radial-gradient(ellipse 50% 40% at 92% 20%, rgba(124,91,245,0.08) 0%, transparent 50%)," +
          "var(--bg)",
      }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen">
        <MainHeader />

        <main className="flex-1 px-4 md:px-8 py-7 pb-24 lg:pb-8">
          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-0.5" style={{ color: "var(--text-1)" }}>My Hires</h1>
              <p className="text-sm" style={{ color: "var(--text-5)" }}>
                {requests.length === 0 ? "No hire requests yet" : `${requests.length} request${requests.length !== 1 ? "s" : ""} sent`}
              </p>
            </div>
            <Link
              href="/hiring"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85"
              style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", color: "#fff", boxShadow: "0 2px 12px rgba(124,91,245,0.35)" }}
            >
              <Briefcase size={14} /> Find Artists
            </Link>
          </div>

          {/* Filter tabs */}
          {requests.length > 0 && (
            <div className="flex gap-2 mb-6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {(["all", "pending", "accepted", "declined", "completed"] as const).map(f => {
                const cfg = f === "all" ? null : STATUS_CONFIG[f];
                const active = filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all capitalize"
                    style={{
                      background: active
                        ? (f === "all" ? "rgba(124,91,245,0.2)" : cfg!.bg)
                        : "var(--bg-card)",
                      color: active
                        ? (f === "all" ? "#9B7CF5" : cfg!.color)
                        : "var(--text-4)",
                      border: active
                        ? `1px solid ${f === "all" ? "rgba(124,91,245,0.4)" : cfg!.border}`
                        : "1px solid var(--border)",
                    }}
                  >
                    {f === "all" ? "All" : f} <span style={{ opacity: 0.7 }}>({counts[f]})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 size={28} className="animate-spin" style={{ color: "#7C5BF5" }} />
            </div>
          )}

          {/* Empty state */}
          {!loading && requests.length === 0 && (
            <div className="flex flex-col items-center py-24 gap-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(124,91,245,0.1)", border: "1px solid rgba(124,91,245,0.2)" }}>
                <Briefcase size={36} style={{ color: "rgba(124,91,245,0.5)" }} />
              </div>
              <p className="text-lg font-bold" style={{ color: "var(--text-2)" }}>No hire requests yet</p>
              <p className="text-sm text-center max-w-xs" style={{ color: "var(--text-5)" }}>
                When you hire an artist, your requests will appear here. Browse talented artists to get started.
              </p>
              <Link
                href="/hiring"
                className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
                style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", boxShadow: "0 4px 16px rgba(124,91,245,0.3)" }}
              >
                Browse Artists <ChevronRight size={15} />
              </Link>
            </div>
          )}

          {/* Hire request cards */}
          {!loading && visible.length > 0 && (
            <div className="flex flex-col gap-4 max-w-2xl">
              {visible.map(req => {
                const sc = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
                const artistInitial = req.artist_name?.[0]?.toUpperCase() ?? "A";
                return (
                  <div
                    key={req.id}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 2px 16px rgba(0,0,0,0.12)" }}
                  >
                    {/* Card header */}
                    <div className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                      {req.artist_avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={req.artist_avatar} alt={req.artist_name ?? "Artist"} className="w-11 h-11 rounded-full object-cover shrink-0"
                          style={{ border: "2px solid rgba(124,91,245,0.35)" }} />
                      ) : (
                        <div className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}>
                          {artistInitial}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>
                          {req.artist_name ?? "Artist"}
                        </p>
                        <p className="text-xs truncate font-medium" style={{ color: "var(--text-4)" }}>
                          {req.what}
                        </p>
                      </div>
                      <span
                        className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                      >
                        {sc.label}
                      </span>
                    </div>

                    {/* Card body */}
                    <div className="px-5 py-4 flex flex-col gap-3">
                      {/* Meta row */}
                      <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--text-5)" }}>
                        {req.budget && (
                          <span className="flex items-center gap-1">
                            <Tag size={11} /> {req.budget}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {fmt(req.created_at)}
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

                      {/* Description preview */}
                      {req.job_description && (
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-4)" }}>
                          {req.job_description}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <Link
                          href="/messages"
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                          style={{ background: "rgba(124,91,245,0.12)", color: "#9B7CF5", border: "1px solid rgba(124,91,245,0.25)" }}
                        >
                          <MessageCircle size={13} /> Message
                        </Link>
                        {req.status === "pending" && (
                          <span className="flex items-center px-4 py-2 rounded-xl text-xs font-medium"
                            style={{ background: "var(--bg-subtle)", color: "var(--text-5)", border: "1px solid var(--border)" }}>
                            Awaiting response
                          </span>
                        )}
                        {req.status === "accepted" && (
                          <span className="flex items-center px-4 py-2 rounded-xl text-xs font-semibold"
                            style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.25)" }}>
                            Artist accepted — coordinate via messages
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No results for filter */}
          {!loading && requests.length > 0 && visible.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-2">
              <p className="text-sm" style={{ color: "var(--text-5)" }}>No {filter} requests</p>
              <button onClick={() => setFilter("all")} className="text-xs underline" style={{ color: "#9B7CF5" }}>
                Show all
              </button>
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
