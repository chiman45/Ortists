"use client";

import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft, CheckCircle2, ChevronRight, Clock, FileText,
  Flag, Paperclip, Star, Upload, Users,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// ── Types ────────────────────────────────────────────────────

interface Milestone {
  id: string;
  title: string;
  done: boolean;
  due: string | null;
}

interface HireRequest {
  id: string;
  client_id: string;
  artist_id: number;
  artist_name: string;
  artist_avatar: string | null;
  artist_location: string | null;
  artist_rating: number;
  project_title: string;
  project_description: string | null;
  budget: number | null;
  deadline: string | null;
  status: string;
  progress: number;
  phase: string;
  priority: string;
  conversation_id: string | null;
  milestones: Milestone[];
  created_at: string;
  updated_at: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string | null;
  sender_avatar: string | null;
  text: string | null;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────

function statusLabel(s: string) {
  if (s === "accepted")  return "In Progress";
  if (s === "completed") return "Completed";
  if (s === "declined")  return "Cancelled";
  return "Pending Review";
}

function statusColor(s: string) {
  if (s === "accepted")  return { bg: "rgba(59,130,246,0.15)",  text: "#60A5FA" };
  if (s === "completed") return { bg: "rgba(16,185,129,0.15)",  text: "#34D399" };
  if (s === "declined")  return { bg: "rgba(239,68,68,0.15)",   text: "#F87171" };
  return { bg: "rgba(245,158,11,0.15)", text: "#FCD34D" };
}

function daysUntil(deadline: string | null): number {
  if (!deadline) return 0;
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
}

function fmtTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}

const MOCK_FILES = [
  { name: "brand_guidelines_2024.pdf", size: "3.2 MB", type: "pdf" },
  { name: "concept_v1_chromatic.png",  size: "4.8 MB", type: "img" },
  { name: "concept_v2_deep_violet.png",size: "5.1 MB", type: "img" },
  { name: "reference_palette.png",     size: "1.4 MB", type: "img" },
];

const ACTIVITY_ICONS: Record<string, string> = {
  started:   "🚀",
  milestone: "✅",
  message:   "💬",
  file:      "📎",
  revision:  "🔄",
};

// ── Left Sidebar ─────────────────────────────────────────────

function LeftSidebar({ project, onMilestoneToggle }: { project: HireRequest; onMilestoneToggle: (id: string) => void }) {
  const spent   = Math.round((project.budget ?? 0) * (project.progress / 100));
  const total   = project.budget ?? 0;
  const days    = daysUntil(project.deadline);
  const milestonesDone  = (project.milestones ?? []).filter(m => m.done).length;
  const milestonesTotal = (project.milestones ?? []).length;

  return (
    <aside
      className="hidden lg:flex flex-col gap-5 overflow-y-auto shrink-0"
      style={{ width: 200, scrollbarWidth: "none" }}
    >
      {/* Status */}
      <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "var(--text-6)" }}>STATUS</p>
        <div className="flex flex-col gap-2 text-xs">
          {[
            { label: "Phase",    value: project.phase    ?? "Kickoff" },
            { label: "Days Left",value: project.status === "completed" ? "Done" : `${days}` },
            { label: "Budget",   value: total ? `$${total.toLocaleString()}` : "TBD" },
            { label: "Priority", value: project.priority ?? "High" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span style={{ color: "var(--text-5)" }}>{label}</span>
              <span className="font-semibold" style={{ color: "var(--text-2)" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {(project.milestones ?? []).length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "var(--text-6)" }}>TIMELINE</p>
          <div className="flex flex-col gap-2">
            {(project.milestones ?? []).map((m, i) => (
              <div key={m.id} className="flex items-start gap-2 text-xs">
                <div className="relative flex flex-col items-center">
                  <div
                    className="w-2 h-2 rounded-full mt-0.5 shrink-0"
                    style={{ background: m.done ? "#7C5BF5" : "var(--bg-subtle)", border: m.done ? "none" : "1.5px solid var(--border)" }}
                  />
                  {i < (project.milestones ?? []).length - 1 && (
                    <div className="w-px flex-1 mt-0.5" style={{ background: "var(--border)", minHeight: 12 }} />
                  )}
                </div>
                <span className={m.done ? "line-through" : ""} style={{ color: m.done ? "var(--text-5)" : "var(--text-3)" }}>
                  {m.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget */}
      {total > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "var(--text-6)" }}>BUDGET</p>
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-4)" }}>
            <span>Spent</span>
            <span style={{ color: "var(--text-2)" }}>${spent.toLocaleString()} / ${total.toLocaleString()}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "var(--bg-subtle)" }}>
            <div className="h-full rounded-full" style={{ width: `${project.progress}%`, background: "#7C5BF5" }} />
          </div>
          <div className="flex flex-col gap-1 text-[11px]" style={{ color: "var(--text-5)" }}>
            <div className="flex justify-between">
              <span>Concept work</span>
              <span>${Math.round(total * 0.6).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Revisions</span>
              <span>${Math.round(total * 0.4).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Files */}
      <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "var(--text-6)" }}>FILES</p>
        <div className="flex flex-col gap-2">
          {MOCK_FILES.map(f => (
            <div key={f.name} className="flex items-center gap-2 cursor-pointer group" title={f.name}>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold"
                style={{ background: f.type === "pdf" ? "rgba(239,68,68,0.12)" : "rgba(124,91,245,0.12)", color: f.type === "pdf" ? "#F87171" : "#9B7CF5" }}
              >
                {f.type === "pdf" ? "PDF" : "IMG"}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium truncate group-hover:underline" style={{ color: "var(--text-3)" }}>{f.name}</p>
                <p className="text-[9px]" style={{ color: "var(--text-6)" }}>{f.size}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-6)" }}>MILESTONES</p>
          <span className="text-[10px]" style={{ color: "var(--text-5)" }}>{milestonesDone}/{milestonesTotal}</span>
        </div>
        <div className="flex flex-col gap-2">
          {(project.milestones ?? []).map(m => (
            <button
              key={m.id}
              onClick={() => onMilestoneToggle(m.id)}
              className="flex items-center gap-2 text-left text-xs transition-opacity hover:opacity-70"
            >
              <div
                className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                style={{ background: m.done ? "#7C5BF5" : "transparent", border: m.done ? "none" : "1.5px solid var(--border)" }}
              >
                {m.done && <CheckCircle2 size={10} style={{ color: "#fff" }} />}
              </div>
              <span className={m.done ? "line-through" : ""} style={{ color: m.done ? "var(--text-5)" : "var(--text-3)" }}>
                {m.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ── Right Sidebar ─────────────────────────────────────────────

function RightSidebar({ project, onAction }: { project: HireRequest; onAction: (action: string) => void }) {
  const days = daysUntil(project.deadline);

  return (
    <aside
      className="hidden xl:flex flex-col gap-4 overflow-y-auto shrink-0"
      style={{ width: 220, scrollbarWidth: "none" }}
    >
      {/* Artist card */}
      <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "var(--text-6)" }}>ARTIST</p>
        <div className="flex flex-col items-center text-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.artist_avatar ?? `https://i.pravatar.cc/80?img=${project.artist_id}`}
            alt={project.artist_name}
            className="w-12 h-12 rounded-full object-cover"
            style={{ border: "2px solid rgba(124,91,245,0.4)" }}
          />
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{project.artist_name}</p>
            <p className="text-[11px]" style={{ color: "var(--text-5)" }}>
              Visual Artist{project.artist_location ? ` · ${project.artist_location}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: "#FBBF24" }}>
            <Star size={12} fill="currentColor" />
            <span className="font-semibold">{project.artist_rating ?? 5.0}</span>
          </div>
          <div className="flex gap-3 text-[11px]" style={{ color: "var(--text-5)" }}>
            <span><span className="font-semibold" style={{ color: "var(--text-2)" }}>47</span> Projects</span>
            <span><span className="font-semibold" style={{ color: "var(--text-2)" }}>214</span> Reviews</span>
            <span><span className="font-semibold" style={{ color: "var(--text-2)" }}>89%</span> Repeat</span>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "var(--text-6)" }}>MEMBERS</p>
        {[
          { name: "You",             role: "Client",      img: null        },
          { name: project.artist_name, role: "Lead Artist", img: project.artist_avatar },
        ].map(m => (
          <div key={m.name} className="flex items-center gap-2.5 mb-2 last:mb-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden"
              style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}
            >
              {m.img
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={m.img} alt={m.name} className="w-full h-full object-cover" />
                : <Users size={12} style={{ color: "#fff" }} />}
            </div>
            <div>
              <p className="text-xs font-semibold leading-none" style={{ color: "var(--text-2)" }}>{m.name}</p>
              <p className="text-[10px]" style={{ color: "var(--text-5)" }}>{m.role}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "var(--text-6)" }}>QUICK ACTIONS</p>
        <div className="flex flex-col gap-1">
          {[
            { label: "Upload Files",     icon: <Upload size={13} />,       action: "upload"   },
            { label: "Add Milestone",    icon: <Flag size={13} />,          action: "milestone"},
            { label: "Request Revision", icon: <ChevronRight size={13} />,  action: "revision" },
            { label: "Leave Review",     icon: <Star size={13} />,          action: "review"   },
          ].map(({ label, icon, action }) => (
            <button
              key={label}
              onClick={() => onAction(action)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left"
              style={{ color: "var(--text-3)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span>{label}</span>
              <span style={{ color: "var(--text-5)" }}>{icon}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "var(--text-6)" }}>ACTIVITY</p>
        <div className="flex flex-col gap-2">
          {[
            { icon: ACTIVITY_ICONS.milestone, text: "Milestone approved",    time: "6:47 PM" },
            { icon: ACTIVITY_ICONS.file,      text: "Artwork V2 uploaded",   time: "4:10 PM" },
            { icon: ACTIVITY_ICONS.message,   text: "James left a comment",  time: "10:02 AM" },
            { icon: ACTIVITY_ICONS.file,      text: "Brand doc uploaded",    time: "12:30 AM" },
            { icon: ACTIVITY_ICONS.started,   text: "Project started",       time: "Jul 1" },
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px]">
              <span className="text-sm leading-none mt-0.5">{a.icon}</span>
              <div className="min-w-0">
                <p className="leading-snug" style={{ color: "var(--text-3)" }}>{a.text}</p>
                <p style={{ color: "var(--text-6)" }}>{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Deadline */}
      {project.deadline && project.status !== "completed" && (
        <div className="rounded-2xl p-4" style={{ background: "rgba(124,91,245,0.08)", border: "1px solid rgba(124,91,245,0.2)" }}>
          <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "var(--text-6)" }}>NEXT DEADLINE</p>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,91,245,0.2)" }}>
              <Clock size={12} style={{ color: "#9B7CF5" }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>Final Artwork Delivery</p>
          </div>
          <p className="text-[11px] ml-8" style={{ color: "#9B7CF5" }}>{days} days remaining</p>
        </div>
      )}
    </aside>
  );
}

// ── Conversation ─────────────────────────────────────────────

function ConversationPanel({ project, userId }: {
  project: HireRequest;
  userId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!project.conversation_id) return;
    fetch(`/api/messages?action=messages&conversationId=${project.conversation_id}`)
      .then(r => r.json())
      .then(({ messages: msgs }) => setMessages(msgs ?? []));
  }, [project.conversation_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const date = fmtDate(m.created_at);
    const last = grouped[grouped.length - 1];
    if (last?.date === date) last.msgs.push(m);
    else grouped.push({ date, msgs: [m] });
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-1 py-2 flex flex-col gap-4 min-h-0" style={{ scrollbarWidth: "none" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "var(--bg-subtle)" }}>
              <FileText size={20} style={{ color: "var(--text-5)" }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-3)" }}>No messages yet</p>
            <p className="text-xs" style={{ color: "var(--text-5)" }}>Start the conversation about your project</p>
          </div>
        )}

        {grouped.map(group => (
          <div key={group.date}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-[10px] font-semibold px-2" style={{ color: "var(--text-6)" }}>{group.date}</span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>
            <div className="flex flex-col gap-3">
              {group.msgs.map(m => {
                const isMe = m.sender_id === userId;
                return (
                  <div key={m.id} className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                      style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}
                    >
                      {m.sender_avatar
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={m.sender_avatar} alt="" className="w-full h-full object-cover" />
                        : (m.sender_name?.[0] ?? "?")}
                    </div>
                    <div className={`flex flex-col gap-1 max-w-[70%] ${isMe ? "items-end" : ""}`}>
                      <div className="flex items-center gap-2">
                        {!isMe && <span className="text-[11px] font-semibold" style={{ color: "var(--text-3)" }}>{m.sender_name ?? "Artist"}</span>}
                        <span className="text-[10px]" style={{ color: "var(--text-6)" }}>{fmtTime(m.created_at)}</span>
                      </div>
                      <div
                        className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                        style={{
                          background: isMe ? "#7C5BF5" : "var(--bg-card)",
                          color: isMe ? "#fff" : "var(--text-2)",
                          border: isMe ? "none" : "1px solid var(--border)",
                          borderBottomRightRadius: isMe ? 4 : 16,
                          borderBottomLeftRadius: isMe ? 16 : 4,
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useUser();

  const [project, setProject]     = useState<HireRequest | null>(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [activeTab, setActiveTab] = useState<"conversation" | "deliverables" | "references">("conversation");
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/hire-requests/${params.id}`)
      .then(r => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then(({ request }) => { setProject(request); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [params.id]);

  async function toggleMilestone(milestoneId: string) {
    if (!project || !user) return;
    const updated = (project.milestones ?? []).map(m =>
      m.id === milestoneId ? { ...m, done: !m.done } : m
    );
    const donePct = Math.round((updated.filter(m => m.done).length / updated.length) * 100);
    setProject(p => p ? { ...p, milestones: updated, progress: donePct } : p);
    await fetch(`/api/hire-requests/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: user.id, milestones: updated, progress: donePct }),
    });
  }

  async function completeProject() {
    if (!project || !user || completing) return;
    setCompleting(true);
    const res = await fetch(`/api/hire-requests/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: user.id, status: "completed", progress: 100 }),
    });
    if (res.ok) {
      const { request } = await res.json();
      setProject(request);
    }
    setCompleting(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
        <Sidebar />
        <div className="flex-1 lg:ml-17 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#7C5BF5", borderTopColor: "transparent" }} />
        </div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
        <Sidebar />
        <div className="flex-1 lg:ml-17 flex flex-col items-center justify-center gap-4">
          <p className="text-lg font-bold" style={{ color: "var(--text-1)" }}>Project not found</p>
          <button onClick={() => router.push("/hiring")} className="text-sm" style={{ color: "#9B7CF5" }}>← Back to Hiring</button>
        </div>
      </div>
    );
  }

  const sc     = statusColor(project.status);
  const isActive = project.status === "accepted";

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-h-screen min-w-0">

        {/* Top header bar */}
        <header
          className="sticky top-0 z-30 shrink-0 px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap"
          style={{ background: "var(--bg-header)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)" }}
        >
          <button
            onClick={() => router.push("/hiring")}
            className="flex items-center gap-1.5 text-xs font-medium shrink-0 transition-opacity hover:opacity-70"
            style={{ color: "var(--text-4)" }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>{project.project_title}</h1>
              <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>
                {statusLabel(project.status)}
              </span>
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)", maxWidth: 200 }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${project.progress}%`, background: "#7C5BF5" }} />
              </div>
              <span className="text-[11px]" style={{ color: "var(--text-5)" }}>{project.progress}%</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: "var(--bg-card)", color: "var(--text-3)", border: "1px solid var(--border)" }}
            >
              <Upload size={12} /> Upload Files
            </button>
            {isActive && (
              <>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{ background: "var(--bg-card)", color: "var(--text-3)", border: "1px solid var(--border)" }}
                >
                  <Flag size={12} /> Mark Milestone
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{ background: "var(--bg-card)", color: "var(--text-3)", border: "1px solid var(--border)" }}
                >
                  <ChevronRight size={12} /> Request Revision
                </button>
                <button
                  onClick={completeProject}
                  disabled={completing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-85 disabled:opacity-50"
                  style={{ background: "#7C5BF5" }}
                >
                  <CheckCircle2 size={12} /> {completing ? "Completing…" : "Complete Project"}
                </button>
              </>
            )}
          </div>
        </header>

        {/* Main 3-column layout */}
        <div className="flex flex-1 min-h-0 gap-0 overflow-hidden">

          {/* Left sidebar */}
          <div className="hidden lg:block p-4 overflow-y-auto" style={{ width: 216, scrollbarWidth: "none", borderRight: "1px solid var(--border)" }}>
            <LeftSidebar project={project} onMilestoneToggle={toggleMilestone} />
          </div>

          {/* Center — tabs + content */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Tab bar */}
            <div className="shrink-0 flex items-center gap-1 px-4 md:px-6 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              {(["conversation", "deliverables", "references"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-all"
                  style={{
                    background: activeTab === t ? "rgba(124,91,245,0.12)" : "transparent",
                    color: activeTab === t ? "#9B7CF5" : "var(--text-4)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 min-h-0 px-4 md:px-6 py-4 overflow-hidden flex flex-col">
              {activeTab === "conversation" && (
                <ConversationPanel
                  project={project}
                  userId={user?.id ?? ""}
                />
              )}
              {activeTab === "deliverables" && (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "var(--bg-subtle)" }}>
                    <Paperclip size={20} style={{ color: "var(--text-5)" }} />
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-3)" }}>No deliverables yet</p>
                  <p className="text-xs" style={{ color: "var(--text-5)" }}>Uploaded files and approved work will appear here</p>
                </div>
              )}
              {activeTab === "references" && (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "var(--bg-subtle)" }}>
                    <FileText size={20} style={{ color: "var(--text-5)" }} />
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-3)" }}>No references added</p>
                  <p className="text-xs" style={{ color: "var(--text-5)" }}>Add mood boards, brand guides, and inspiration here</p>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="hidden xl:block p-4 overflow-y-auto" style={{ width: 236, scrollbarWidth: "none", borderLeft: "1px solid var(--border)" }}>
            <RightSidebar project={project} onAction={() => {}} />
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
