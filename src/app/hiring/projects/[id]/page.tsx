"use client";

import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft, CheckCircle2, ChevronRight, FileText,
  Flag, GitBranch, Paperclip, Plus, Star, Upload, UserPlus, Users,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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


function fmtTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}


// ── Right Sidebar ─────────────────────────────────────────────

function RightSidebar({ project }: { project: HireRequest }) {

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

    </aside>
  );
}

// ── File message helpers ──────────────────────────────────────

const FILE_PREFIX = "__FILE__:";
function encodeFile(url: string, name: string, size: number, type: string) {
  return FILE_PREFIX + JSON.stringify({ url, name, size, type });
}
function isFile(t: string | null) { return !!t?.startsWith(FILE_PREFIX); }
function parseFile(t: string) {
  try { return JSON.parse(t.slice(FILE_PREFIX.length)) as { url: string; name: string; size: number; type: string }; }
  catch { return null; }
}
function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Media lightbox ────────────────────────────────────────────

function Lightbox({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src} alt={name}
        className="max-w-[90vw] max-h-[80vh] rounded-2xl object-contain"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
        onClick={e => e.stopPropagation()}
      />
      <p className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{name} · click outside to close</p>
    </div>,
    document.body
  );
}

// ── File bubble (in chat) ─────────────────────────────────────

function FileBubble({ text, isMe }: { text: string; isMe: boolean }) {
  const f = parseFile(text);
  const [lightbox, setLightbox] = useState(false);
  if (!f) return null;
  const isImage = f.type.startsWith("image/");
  const isVideo = f.type.startsWith("video/");

  if (isImage) {
    return (
      <>
        <div
          className="rounded-xl overflow-hidden cursor-pointer"
          style={{ maxWidth: 220 }}
          onClick={() => setLightbox(true)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.url} alt={f.name} className="w-full block" style={{ maxHeight: 180, objectFit: "cover" }} />
          <div className="px-2 py-1 text-[10px]" style={{ color: isMe ? "rgba(255,255,255,0.6)" : "var(--text-5)" }}>{f.name}</div>
        </div>
        {lightbox && <Lightbox src={f.url} name={f.name} onClose={() => setLightbox(false)} />}
      </>
    );
  }

  if (isVideo) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ maxWidth: 240 }}>
        <video src={f.url} controls className="w-full block" style={{ maxHeight: 180 }} />
        <div className="px-2 py-1 text-[10px]" style={{ color: isMe ? "rgba(255,255,255,0.6)" : "var(--text-5)" }}>{f.name}</div>
      </div>
    );
  }

  return (
    <a href={f.url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 no-underline rounded-xl"
      style={{ minWidth: 160, maxWidth: 220, background: isMe ? "rgba(255,255,255,0.12)" : "var(--bg-subtle)", border: `1px solid ${isMe ? "rgba(255,255,255,0.18)" : "var(--border)"}`, padding: "8px 10px" }}
      onClick={e => e.stopPropagation()}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: isMe ? "rgba(255,255,255,0.15)" : "rgba(124,91,245,0.15)" }}>
        <FileText size={13} style={{ color: isMe ? "#fff" : "#9B7CF5" }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: isMe ? "#fff" : "var(--text-1)" }}>{f.name}</p>
        <p className="text-[10px]" style={{ color: isMe ? "rgba(255,255,255,0.55)" : "var(--text-5)" }}>{fmtBytes(f.size)}</p>
      </div>
    </a>
  );
}

// ── Upload preview modal ──────────────────────────────────────

function UploadPreview({ file, onSend, onCancel }: { file: File; onSend: () => Promise<void>; onCancel: () => void }) {
  const [sending, setSending] = useState(false);
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const previewUrl = isImage || isVideo ? URL.createObjectURL(file) : null;

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSend() {
    setSending(true);
    try { await onSend(); } finally { setSending(false); }
  }

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center pb-6 px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col gap-0"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
        onClick={e => e.stopPropagation()}
      >
        {previewUrl && isImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={file.name} className="w-full" style={{ maxHeight: 260, objectFit: "cover" }} />
        )}
        {previewUrl && isVideo && (
          <video src={previewUrl} controls className="w-full" style={{ maxHeight: 260 }} />
        )}
        {!previewUrl && (
          <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,91,245,0.12)" }}>
              <FileText size={18} style={{ color: "#9B7CF5" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{file.name}</p>
              <p className="text-xs" style={{ color: "var(--text-5)" }}>{fmtBytes(file.size)}</p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-xs truncate flex-1 pr-2" style={{ color: "var(--text-4)" }}>{file.name}</p>
          <div className="flex gap-2 shrink-0">
            <button onClick={onCancel} disabled={sending}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ background: "var(--bg-subtle)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
              Cancel
            </button>
            <button onClick={handleSend} disabled={sending}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ background: "#7C5BF5" }}>
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Action menu ───────────────────────────────────────────────

const ACTIONS = [
  { icon: Upload,       label: "Upload Deliverable",  color: "#7C5BF5", active: true  },
  { icon: GitBranch,    label: "Create Milestone",    color: "#3B82F6", active: false },
  { icon: FileText,     label: "Request Revision",    color: "#F59E0B", active: false },
  { icon: CheckCircle2, label: "Complete Project",    color: "#10B981", active: false },
  { icon: UserPlus,     label: "Invite Collaborator", color: "#8B5CF6", active: false },
  { icon: Flag,         label: "Leave Review",        color: "#F59E0B", active: false },
];

function ActionMenu({ btnRef, onClose, onUpload }: {
  btnRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onUpload: (f: File) => Promise<void>;
}) {
  const fileRef  = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState<File | null>(null);
  const [pos, setPos]             = useState({ bottom: 60, left: 0 });

  useEffect(() => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ bottom: window.innerHeight - r.top + 8, left: r.left });
    }
  }, [btnRef]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(file);
  }

  async function handleSend() {
    if (!preview) return;
    setUploading(true);
    try { await onUpload(preview); setPreview(null); onClose(); } finally { setUploading(false); }
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[998]" onClick={onClose} />
      <div
        className="fixed z-[999] rounded-2xl overflow-hidden py-1"
        style={{
          bottom: pos.bottom,
          left: pos.left,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
          minWidth: 192,
        }}
        onClick={e => e.stopPropagation()}
      >
        {ACTIONS.map(({ icon: Icon, label, color, active }) => (
          <button
            key={label}
            disabled={uploading}
            onClick={() => { if (active) fileRef.current?.click(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-all"
            style={{ color: "var(--text-1)", cursor: active ? "pointer" : "default" }}
            onMouseEnter={e => { if (active) (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-subtle)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}22` }}>
              <Icon size={12} style={{ color }} />
            </span>
            <span>{uploading && active ? "Uploading…" : label}</span>
            {!active && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--bg-subtle)", color: "var(--text-5)" }}>Soon</span>}
          </button>
        ))}
        <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.zip" onChange={handleFileChange} />
      </div>
      {preview && (
        <UploadPreview file={preview} onSend={handleSend} onCancel={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ""; }} />
      )}
    </>,
    document.body
  );
}

// ── Conversation ─────────────────────────────────────────────

function ConversationPanel({ project, userId, userName, userAvatar }: {
  project: HireRequest;
  userId: string;
  userName: string;
  userAvatar: string;
}) {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [text, setText]           = useState("");
  const [sending, setSending]     = useState(false);
  const [showActions, setShowActions] = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLTextAreaElement>(null);
  const plusBtnRef                = useRef<HTMLButtonElement>(null);

  const canChat = project.status === "accepted";

  useEffect(() => {
    if (!project.conversation_id) return;
    const convId = project.conversation_id;

    function load() {
      fetch(`/api/messages?action=messages&conversationId=${convId}`)
        .then(r => r.json())
        .then(({ messages: msgs }) => {
          if (!msgs) return;
          setMessages(prev => {
            // Keep any optimistic (unconfirmed) messages not yet in the server result
            const serverIds = new Set(msgs.map((m: Message) => m.id));
            const pending = prev.filter(m => m.id.startsWith("opt-") && !serverIds.has(m.id));
            return [...msgs, ...pending];
          });
        })
        .catch(() => {});
    }

    load();
    const interval = setInterval(load, 5000);

    // Mark messages as read so the notification badge clears
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", conversationId: convId, userId }),
    }).catch(() => {});

    return () => clearInterval(interval);
  }, [project.conversation_id, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function uploadDeliverable(file: File) {
    if (!project.conversation_id || !canChat) return;
    const form = new FormData();
    form.append("file", file);
    form.append("bucket", "deliverables");
    const up = await fetch("/api/upload", { method: "POST", body: form });
    if (!up.ok) return;
    const { url, name, size, type } = await up.json();
    const encoded = encodeFile(url, name, size, type);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_message",
        conversation_id: project.conversation_id,
        sender_id: userId,
        sender_name: userName,
        sender_avatar: userAvatar,
        text: encoded,
      }),
    });
    if (res.ok) {
      const { message } = await res.json();
      if (message) setMessages(prev => [...prev, message]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  async function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed || sending || !project.conversation_id || !canChat) return;
    setSending(true);
    setText("");

    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      conversation_id: project.conversation_id,
      sender_id:     userId,
      sender_name:   userName,
      sender_avatar: userAvatar,
      text:          trimmed,
      created_at:    new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action:          "send_message",
        conversation_id: project.conversation_id,
        sender_id:       userId,
        sender_name:     userName,
        sender_avatar:   userAvatar,
        text:            trimmed,
      }),
    });

    if (res.ok) {
      const { message } = await res.json();
      setMessages(prev => prev.map(m => m.id === optimistic.id ? message : m));
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const date = fmtDate(m.created_at);
    const last = grouped[grouped.length - 1];
    if (last?.date === date) last.msgs.push(m);
    else grouped.push({ date, msgs: [m] });
  });

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Messages scroll area */}
      <div className="flex-1 overflow-y-auto px-1 py-2 flex flex-col gap-4 min-h-0" style={{ scrollbarWidth: "none" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "var(--bg-subtle)" }}>
              <FileText size={20} style={{ color: "var(--text-5)" }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-3)" }}>No messages yet</p>
            <p className="text-xs" style={{ color: "var(--text-5)" }}>
              {canChat ? "Start the conversation about your project" : "Messaging opens once the artist accepts your request"}
            </p>
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
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                      style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}>
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
                      <div className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                        style={{
                          background: isMe ? "#7C5BF5" : "var(--bg-card)",
                          color: isMe ? "#fff" : "var(--text-2)",
                          border: isMe ? "none" : "1px solid var(--border)",
                          borderBottomRightRadius: isMe ? 4 : 16,
                          borderBottomLeftRadius: isMe ? 16 : 4,
                        }}>
                        {isFile(m.text) ? <FileBubble text={m.text!} isMe={isMe} /> : m.text}
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

      {/* Message input — gated on acceptance */}
      <div className="shrink-0 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        {canChat ? (
          <div className="flex items-end gap-2">
            <div className="flex items-end gap-2 flex-1">
              <button
                ref={plusBtnRef}
                onClick={() => setShowActions(v => !v)}
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all hover:opacity-70 mb-1"
                style={{
                  background: showActions ? "rgba(124,91,245,0.15)" : "var(--bg-subtle)",
                  color: showActions ? "#9B7CF5" : "var(--text-4)",
                  border: `1px solid ${showActions ? "rgba(124,91,245,0.35)" : "var(--border)"}`,
                }}
              >
                <Plus size={15} />
              </button>
              <div
                className="flex-1 flex items-end gap-2 px-3 py-2 rounded-2xl"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={e => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
                  onKeyDown={handleKeyDown}
                  placeholder="Message… (Enter to send, Shift+Enter for new line)"
                  rows={1}
                  className="flex-1 bg-transparent text-sm outline-none resize-none leading-relaxed"
                  style={{ color: "var(--text-1)", maxHeight: 120, scrollbarWidth: "none" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!text.trim() || sending}
                  className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all hover:opacity-85 disabled:opacity-30"
                  style={{ background: "#7C5BF5", marginBottom: 1 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
            {showActions && (
              <ActionMenu
                btnRef={plusBtnRef}
                onClose={() => setShowActions(false)}
                onUpload={uploadDeliverable}
              />
            )}
          </div>
        ) : (
          <div
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs"
            style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", color: "rgba(252,211,77,0.8)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Messaging is available once the artist accepts your request
          </div>
        )}
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
                  userName={user?.fullName ?? user?.username ?? "You"}
                  userAvatar={user?.imageUrl || `https://i.pravatar.cc/80?u=${user?.id}`}
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
            <RightSidebar project={project} />
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
