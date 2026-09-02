"use client";

import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import { useUser } from "@clerk/nextjs";
import {
  Bell, ChevronRight, CheckCircle2, FileText,
  Paperclip, Plus, RefreshCw, Settings, Star, Upload,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/utils/supabase/client";

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
  client_name: string | null;
  client_avatar: string | null;
  artist_id: number;
  artist_clerk_id: string | null;
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

function fmtTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}
function fmtDateFull(ts: string) {
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}
function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return Math.ceil((d.getTime() - Date.now()) / 86400000);
  } catch { return null; }
}
function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

// ── File helpers ─────────────────────────────────────────────

const FILE_PREFIX = "__FILE__:";
interface FileData {
  url?: string;
  path?: string;
  bucket?: string;
  name: string;
  size: number;
  type: string;
}
function encodeFile(data: FileData) { return FILE_PREFIX + JSON.stringify(data); }
function isFile(t: string | null) { return !!t?.startsWith(FILE_PREFIX); }
function parseFile(t: string): FileData | null {
  try { return JSON.parse(t.slice(FILE_PREFIX.length)) as FileData; }
  catch { return null; }
}

function fileExt(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
}
function fileIconColor(type: string, name: string): string {
  if (type.startsWith("image/")) return "#14B8A6";
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "#EF4444";
  if (ext === "psd" || ext === "ai") return "#3B82F6";
  if (ext === "zip" || ext === "rar") return "#F59E0B";
  return "#8B5CF6";
}

// ── Lightbox ──────────────────────────────────────────────────

function Lightbox({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={name} className="max-w-[90vw] max-h-[80vh] rounded-2xl object-contain"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()} />
      <p className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{name} · click outside to close</p>
    </div>,
    document.body
  );
}

// ── FileBubble (in chat) ──────────────────────────────────────

function FileBubble({ text, isMe, convId, userId, onImageLoad }: {
  text: string; isMe: boolean; convId: string; userId: string; onImageLoad?: (url: string, name: string) => void;
}) {
  const f = parseFile(text);
  const [resolvedUrl, setResolvedUrl] = useState<string>(f?.url ?? "");
  const [lightbox, setLightbox]       = useState(false);

  useEffect(() => {
    if (!f || f.url) return;
    if (!f.path || !f.bucket) return;
    fetch(`/api/signed-url?path=${encodeURIComponent(f.path)}&bucket=${f.bucket}&userId=${userId}&convId=${convId}`)
      .then(r => r.json())
      .then(({ url }) => {
        if (url) {
          setResolvedUrl(url);
          if (f.type.startsWith("image/")) onImageLoad?.(url, f.name);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  if (!f || !resolvedUrl) return null;
  const isImage = f.type.startsWith("image/");
  const isVideo = f.type.startsWith("video/");

  if (isImage) {
    return (
      <>
        <div className="rounded-xl overflow-hidden cursor-pointer" style={{ maxWidth: 260 }} onClick={() => setLightbox(true)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolvedUrl} alt={f.name} className="w-full block" style={{ maxHeight: 200, objectFit: "cover" }} />
        </div>
        {lightbox && <Lightbox src={resolvedUrl} name={f.name} onClose={() => setLightbox(false)} />}
      </>
    );
  }
  if (isVideo) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ maxWidth: 260 }}>
        <video src={resolvedUrl} controls className="w-full block" style={{ maxHeight: 200 }} />
      </div>
    );
  }
  return (
    <a href={resolvedUrl} target="_blank" rel="noopener noreferrer"
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

// ── Upload preview ────────────────────────────────────────────

function UploadPreview({ file, onSend, onCancel }: { file: File; onSend: () => Promise<void>; onCancel: () => void }) {
  const [sending, setSending] = useState(false);
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const previewUrl = isImage || isVideo ? URL.createObjectURL(file) : null;
  useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend() {
    setSending(true);
    try { await onSend(); } finally { setSending(false); }
  }

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center pb-6 px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
        onClick={e => e.stopPropagation()}>
        {previewUrl && isImage && <img src={previewUrl} alt={file.name} className="w-full" style={{ maxHeight: 260, objectFit: "cover" }} />} {/* eslint-disable-line @next/next/no-img-element */}
        {previewUrl && isVideo && <video src={previewUrl} controls className="w-full" style={{ maxHeight: 260 }} />}
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
              style={{ background: "var(--bg-subtle)", color: "var(--text-3)", border: "1px solid var(--border)" }}>Cancel</button>
            <button onClick={handleSend} disabled={sending}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ background: "#7C5BF5" }}>{sending ? "Sending…" : "Send"}</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Left FILES sidebar ────────────────────────────────────────

function FilesSidebar({ messages, onUpload }: {
  messages: Message[];
  onUpload: (f: File) => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<File | null>(null);

  const fileMessages = messages.filter(m => isFile(m.text ?? ""));

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setPreview(f);
  }

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0"
      style={{ width: 164, borderRight: "1px solid var(--border)", background: "var(--bg)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <p className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-5)" }}>FILES</p>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "var(--bg-subtle)", color: "var(--text-4)" }}
        >
          <Upload size={12} />
        </button>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-1" style={{ scrollbarWidth: "none" }}>
        {fileMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 px-3 text-center">
            <Paperclip size={20} style={{ color: "var(--text-6)" }} />
            <p className="text-[10px]" style={{ color: "var(--text-6)" }}>No files yet</p>
          </div>
        ) : fileMessages.map(m => {
          const f = parseFile(m.text!);
          if (!f) return null;
          const ext   = fileExt(f.name);
          const color = fileIconColor(f.type, f.name);
          const shortName = f.name.length > 10 ? f.name.slice(0, 9) + "_" : f.name;
          return (
            <div
              key={m.id}
              className="mx-2 flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer transition-all hover:opacity-80"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ background: `${color}22`, color }}
              >
                {ext.slice(0, 3)}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold truncate" style={{ color: "var(--text-2)" }}>{shortName}</p>
                <p className="text-[9px]" style={{ color: "var(--text-6)" }}>{fmtBytes(f.size)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.zip,.psd,.ai" onChange={handleChange} />
      {preview && (
        <UploadPreview
          file={preview}
          onSend={async () => { await onUpload(preview); setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
          onCancel={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
        />
      )}
    </aside>
  );
}

// ── Right sidebar ─────────────────────────────────────────────

function RightSidebar({ project, isArtist }: { project: HireRequest; isArtist: boolean }) {
  const name   = isArtist ? (project.client_name ?? "Client") : project.artist_name;
  const avatar = isArtist ? project.client_avatar : project.artist_avatar;
  const role   = isArtist ? "Client" : "Visual Design · Creative Studio";
  const rating = project.artist_rating || 4.9;
  const days   = daysUntil(project.deadline);

  // Derived stats (seeded from artist_id for consistency)
  const seed     = project.artist_id || 1;
  const projects = 40 + (seed % 20);
  const reviews  = 200 + (seed % 50);
  const repeat   = 80 + (seed % 15);

  return (
    <aside
      className="hidden xl:flex flex-col shrink-0 overflow-y-auto"
      style={{ width: 220, borderLeft: "1px solid var(--border)", scrollbarWidth: "none" }}
    >
      {/* Artist / Client card */}
      <div className="flex flex-col items-center text-center gap-3 px-4 py-6" style={{ borderBottom: "1px solid var(--border)" }}>
        {/* Avatar with online dot */}
        <div className="relative">
          {avatar
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={avatar} alt={name} className="w-16 h-16 rounded-full object-cover"
                style={{ border: "2px solid rgba(124,91,245,0.4)" }} />
            : <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white"
                style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", border: "2px solid rgba(124,91,245,0.4)" }}>
                {name[0]?.toUpperCase()}
              </div>
          }
          <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2"
            style={{ background: "#10B981", borderColor: "var(--bg)" }} />
        </div>

        {/* Name + role */}
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{name}</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-5)" }}>{role}</p>
        </div>

        {/* Stars */}
        {!isArtist && (
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s <= Math.round(rating) ? "#FBBF24" : "rgba(255,255,255,0.15)"}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            ))}
            <span className="text-xs font-bold ml-0.5" style={{ color: "#FBBF24" }}>{rating}</span>
          </div>
        )}

        {/* Stats */}
        {!isArtist && (
          <div className="w-full grid grid-cols-3 gap-0 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {[
              { val: String(projects), label: "Projects" },
              { val: String(reviews),  label: "Reviews"  },
              { val: `${repeat}%`,     label: "Repeat"   },
            ].map((s, i) => (
              <div
                key={s.label}
                className="flex flex-col items-center py-2.5"
                style={{ background: "var(--bg-card)", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}
              >
                <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{s.val}</p>
                <p className="text-[9px]" style={{ color: "var(--text-5)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deadline card */}
      {project.deadline && (
        <div className="mx-4 my-4 p-4 rounded-2xl" style={{ background: "rgba(124,91,245,0.08)", border: "1px solid rgba(124,91,245,0.2)" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,91,245,0.2)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9B7CF5" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <p className="text-[9px] font-bold tracking-widest" style={{ color: "#9B7CF5" }}>DEADLINE</p>
          </div>
          <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--text-2)" }}>Final Artwork Delivery</p>
          <p className="text-sm font-bold mb-2" style={{ color: "var(--text-1)" }}>{fmtDateFull(project.deadline)}</p>
          {days !== null && (
            <div className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <p className="text-[11px] font-semibold" style={{ color: days <= 3 ? "#EF4444" : "#F59E0B" }}>
                {days > 0 ? `${days} days remaining` : days === 0 ? "Due today" : "Overdue"}
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

// ── Conversation panel ────────────────────────────────────────

function ConversationPanel({ project, userId, userName, userAvatar, isArtist, onMessagesChange }: {
  project: HireRequest;
  userId: string;
  userName: string;
  userAvatar: string;
  isArtist: boolean;
  onMessagesChange: (msgs: Message[]) => void;
}) {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [text, setText]               = useState("");
  const [sending, setSending]         = useState(false);
  const [showPlus, setShowPlus]       = useState(false);
  const [preview, setPreview]         = useState<File | null>(null);
  const [approvals, setApprovals]     = useState<Record<string, "approved" | "revision">>({});
  const bottomRef                     = useRef<HTMLDivElement>(null);
  const inputRef                      = useRef<HTMLTextAreaElement>(null);
  const fileRef                       = useRef<HTMLInputElement>(null);

  const canChat = project.status === "accepted";

  function updateMessages(msgs: Message[]) {
    setMessages(msgs);
  }

  // Keep parent in sync whenever local messages state changes
  useEffect(() => { onMessagesChange(messages); }, [messages]);

  useEffect(() => {
    if (!project.conversation_id) return;
    const convId = project.conversation_id;

    // Initial load
    fetch(`/api/messages?action=messages&conversationId=${convId}`)
      .then(r => r.json())
      .then(({ messages: msgs }) => { if (msgs) updateMessages(msgs); })
      .catch(() => {});

    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", conversationId: convId, userId }),
    }).catch(() => {});

    // Realtime subscription — push new messages as they arrive
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${convId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
        (payload) => {
          setMessages(prev => {
            // Skip if we already have this id (e.g. optimistic insert)
            if (prev.some(m => m.id === (payload.new as Message).id)) return prev;
            return [...prev, payload.new as Message];
          });
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.conversation_id, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function uploadFile(file: File) {
    if (!project.conversation_id || !canChat) return;
    const form = new FormData();
    form.append("file", file);
    form.append("bucket", "message-media");
    const up = await fetch("/api/upload", { method: "POST", body: form });
    if (!up.ok) return;
    const uploadData = await up.json();
    const encoded = encodeFile({ url: uploadData.url, path: uploadData.path, bucket: uploadData.bucket, name: uploadData.name, size: uploadData.size, type: uploadData.type });
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_message", conversation_id: project.conversation_id, sender_id: userId, sender_name: userName, sender_avatar: userAvatar, text: encoded }),
    });
    if (res.ok) {
      const { message } = await res.json();
      if (message) updateMessages([...messages, message]);
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
      sender_id: userId,
      sender_name: userName,
      sender_avatar: userAvatar,
      text: trimmed,
      created_at: new Date().toISOString(),
    };
    updateMessages([...messages, optimistic]);

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_message", conversation_id: project.conversation_id, sender_id: userId, sender_name: userName, sender_avatar: userAvatar, text: trimmed }),
    });

    if (res.ok) {
      const { message } = await res.json();
      if (message) {
        setMessages(prev => {
          // Remove optimistic; add real only if Realtime hasn't already inserted it
          const without = prev.filter(m => m.id !== optimistic.id);
          if (without.some(m => m.id === message.id)) return without;
          return [...without, message];
        });
      }
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const date = fmtDate(m.created_at);
    const last = grouped[grouped.length - 1];
    if (last?.date === date) last.msgs.push(m);
    else grouped.push({ date, msgs: [m] });
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent", minHeight: 0 }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "var(--bg-subtle)" }}>
              <FileText size={20} style={{ color: "var(--text-5)" }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-3)" }}>No messages yet</p>
            <p className="text-xs" style={{ color: "var(--text-5)" }}>
              {canChat
                ? "Start the conversation about your project"
                : isArtist
                  ? "Accept this request to start messaging"
                  : "Messaging opens once the artist accepts your request"}
            </p>
          </div>
        )}

        {grouped.map(group => (
          <div key={group.date}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-[10px] font-semibold" style={{ color: "var(--text-6)" }}>{group.date}</span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>
            <div className="flex flex-col gap-5">
              {group.msgs.map(m => {
                const isMe    = m.sender_id === userId;
                const hasFile = isFile(m.text ?? "");
                const fileData = hasFile ? parseFile(m.text!) : null;
                const isImageMsg = !!fileData?.type.startsWith("image/");
                const approval   = approvals[m.id];

                return (
                  <div key={m.id} className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden mt-0.5"
                      style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}>
                      {m.sender_avatar
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={m.sender_avatar} alt="" className="w-full h-full object-cover" />
                        : (m.sender_name?.[0] ?? "?")}
                    </div>

                    <div className={`flex flex-col gap-1.5 max-w-[65%] ${isMe ? "items-end" : ""}`}>
                      {/* Name + time */}
                      <div className="flex items-center gap-2">
                        {!isMe && <span className="text-[11px] font-semibold" style={{ color: "#9B7CF5" }}>{m.sender_name ?? "Artist"}</span>}
                        <span className="text-[10px]" style={{ color: "var(--text-6)" }}>
                          {fmtDate(m.created_at)} · {fmtTime(m.created_at)}
                          {isMe && <span className="ml-1" style={{ color: "var(--text-6)" }}>You</span>}
                        </span>
                      </div>

                      {/* Bubble or file */}
                      {hasFile
                        ? <FileBubble text={m.text!} isMe={isMe} convId={project.conversation_id!} userId={userId} />
                        : (
                          <div
                            className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
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
                        )
                      }

                      {/* Approve / Request Revision — client only, on image messages from artist */}
                      {isImageMsg && !isMe && !isArtist && (
                        <div className="flex items-center gap-2 mt-1">
                          {!approval ? (
                            <>
                              <button
                                onClick={() => setApprovals(prev => ({ ...prev, [m.id]: "approved" }))}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-85"
                                style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.35)" }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                Approve
                              </button>
                              <button
                                onClick={() => setApprovals(prev => ({ ...prev, [m.id]: "revision" }))}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-85"
                                style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.35)" }}
                              >
                                <RefreshCw size={11} />
                                Request Revision
                              </button>
                            </>
                          ) : approval === "approved" ? (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                              style={{ background: "rgba(16,185,129,0.12)", color: "#10B981" }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Approved
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                              style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>
                              <RefreshCw size={11} />
                              Revision requested
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
        {canChat ? (
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <button
              onClick={() => fileRef.current?.click()}
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all hover:opacity-70"
              style={{ background: showPlus ? "rgba(124,91,245,0.15)" : "var(--bg-subtle)", color: "var(--text-4)", border: "1px solid var(--border)" }}
            >
              <Plus size={14} />
            </button>
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`; }}
              onKeyDown={handleKeyDown}
              placeholder="Message or drop a file..."
              rows={1}
              className="flex-1 bg-transparent text-sm outline-none resize-none leading-relaxed"
              style={{ color: "var(--text-1)", maxHeight: 100, scrollbarWidth: "none" }}
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim() || sending}
              className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all hover:opacity-85 disabled:opacity-30"
              style={{ background: text.trim() ? "#7C5BF5" : "var(--bg-subtle)", color: text.trim() ? "#fff" : "var(--text-5)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs"
            style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", color: "rgba(252,211,77,0.8)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            {isArtist ? "Accept this request to start messaging" : "Messaging is available once the artist accepts your request"}
          </div>
        )}
        <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.zip"
          onChange={e => { const f = e.target.files?.[0]; if (f) { setPreview(f); setShowPlus(false); } }} />
        {preview && (
          <UploadPreview
            file={preview}
            onSend={async () => { await uploadFile(preview); setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
            onCancel={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
          />
        )}
      </div>
    </div>
  );
}

// ── References tab ───────────────────────────────────────────

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;

function extractUrls(messages: Message[]): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const m of messages) {
    if (!m.text || isFile(m.text)) continue;
    const found = m.text.match(URL_REGEX) ?? [];
    for (const u of found) {
      const clean = u.replace(/[.,;!?)]$/, "");
      if (!seen.has(clean)) { seen.add(clean); urls.push(clean); }
    }
  }
  return urls;
}

function domainTag(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (/pinterest|behance|dribbble|instagram/.test(host)) return "Style";
    if (/youtube|vimeo/.test(host)) return "Video";
    if (/figma|sketch|adobe/.test(host)) return "Design";
    if (/unsplash|pexels|pixabay/.test(host)) return "Photo";
    if (/github/.test(host)) return "Code";
    if (/notion|docs\.google/.test(host)) return "Doc";
    return "Reference";
  } catch { return "Link"; }
}

interface LinkPreview { url: string; image: string; title: string; description: string; siteName: string; tag: string; error?: string; }

function ReferencesTab({ messages }: { messages: Message[] }) {
  const urls = extractUrls(messages);
  const [previews, setPreviews] = useState<LinkPreview[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (urls.length === 0) { setLoading(false); return; }
    setLoading(true);

    Promise.allSettled(
      urls.map(url =>
        fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
          .then(r => r.json())
          .then(data => ({ ...data, url, tag: domainTag(url) } as LinkPreview))
      )
    ).then(results => {
      const valid = results
        .filter((r): r is PromiseFulfilledResult<LinkPreview> => r.status === "fulfilled" && !r.value.error)
        .map(r => r.value);
      setPreviews(valid);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.join(",")]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col gap-4 px-6 py-5">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ height: 200, background: "var(--bg-card)", border: "1px solid var(--border)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (urls.length === 0 || previews.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-16 px-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--bg-subtle)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ color: "var(--text-5)" }}>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-3)" }}>No references yet</p>
        <p className="text-xs max-w-xs" style={{ color: "var(--text-5)" }}>
          Share links in the conversation — they&apos;ll appear here as visual previews
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
      <div className="grid grid-cols-2 gap-4">
        {previews.map((p, i) => (
          <a
            key={i}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-2xl overflow-hidden no-underline transition-all hover:scale-[1.01] hover:opacity-90"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", textDecoration: "none" }}
          >
            {/* Preview image */}
            <div className="relative overflow-hidden" style={{ height: 160 }}>
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-subtle)" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--text-6)" }}>
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </div>
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)" }} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-3.5 py-2.5">
              <p className="text-xs font-semibold truncate flex-1 mr-2" style={{ color: "var(--text-2)" }}>
                {p.title || p.siteName}
              </p>
              <span
                className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(124,91,245,0.15)", color: "#9B7CF5" }}
              >
                {p.tag}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Deliverables tab ─────────────────────────────────────────

type DeliverableStatus = "approved" | "in_progress" | "upcoming";
type TimelineStatus    = "done" | "revision" | "approved" | "pending";

interface TimelineEntry { label: string; status: TimelineStatus; }
interface Deliverable {
  id: string;
  title: string;
  description: string;
  details: string;
  due: string;
  status: DeliverableStatus;
  revisions: { used: number; max: number };
  timeline: TimelineEntry[];
}

function buildDeliverables(project: HireRequest): Deliverable[] {
  // Use real milestones if they exist and have enough shape; otherwise use illustrative mock
  const ms = project.milestones ?? [];
  if (ms.length >= 2) {
    return ms.map((m, i) => ({
      id:   `B${i + 1}`,
      title: m.title,
      description: "Deliverable",
      details: "Digital files",
      due: m.due
        ? new Date(m.due).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "—",
      status: m.done ? "approved" : i === 0 ? "in_progress" : "upcoming",
      revisions: { used: 0, max: 2 },
      timeline: m.done
        ? [{ label: "V1 submitted", status: "done" }, { label: "Approved", status: "approved" }]
        : [{ label: "V1 submitted", status: "done" }, { label: "In review", status: "pending" }],
    }));
  }
  // Illustrative example derived from project title
  const name = project.project_title;
  return [
    {
      id: "B1", title: "Initial Concepts", description: "2 concept directions",
      details: "High-resolution digital files", due: "Aug 22",
      status: "approved", revisions: { used: 1, max: 2 },
      timeline: [
        { label: "V1 submitted",       status: "done"     },
        { label: "Revision requested", status: "revision" },
        { label: "V2 submitted",       status: "done"     },
        { label: "Approved",           status: "approved" },
      ],
    },
    {
      id: "B2", title: `${name} Illustrations`, description: "3 final character illustrations",
      details: "PNG + PSD source files", due: "Aug 30",
      status: "in_progress", revisions: { used: 1, max: 2 },
      timeline: [
        { label: "V1 submitted",       status: "done"     },
        { label: "Revision requested", status: "revision" },
      ],
    },
    {
      id: "B3", title: "Final Files", description: "PNG + PSD source files",
      details: "All assets organised and exported", due: "Sep 5",
      status: "upcoming", revisions: { used: 0, max: 2 },
      timeline: [],
    },
  ];
}

const STATUS_CFG: Record<DeliverableStatus, { label: string; dot: string; bg: string; text: string }> = {
  approved:    { label: "Approved",    dot: "#10B981", bg: "rgba(16,185,129,0.15)",  text: "#34D399" },
  in_progress: { label: "In progress", dot: "#6366F1", bg: "rgba(99,102,241,0.15)",  text: "#818CF8" },
  upcoming:    { label: "Upcoming",    dot: "#6B7280", bg: "rgba(107,114,128,0.15)", text: "#9CA3AF" },
};

const TIMELINE_DOT: Record<TimelineStatus, string> = {
  done:     "rgba(255,255,255,0.45)",
  revision: "#F59E0B",
  approved: "#10B981",
  pending:  "rgba(255,255,255,0.25)",
};

function DeliverablesTab({ project }: { project: HireRequest }) {
  const deliverables = buildDeliverables(project);
  const total      = deliverables.length;
  const completed  = deliverables.filter(d => d.status === "approved").length;
  const inProgress = deliverables.filter(d => d.status === "in_progress").length;
  const pct        = Math.round((completed / total) * 100);
  const progressPct = project.progress;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>

      {/* ── Project completion header ── */}
      <div
        className="p-5 rounded-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>Project completion</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-5)" }}>
              {total} deliverable{total !== 1 ? "s" : ""} · {completed} completed · {inProgress} in progress
            </p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "#9B7CF5" }}>{pct}%</p>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          {/* Purple — overall project progress */}
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, background: "linear-gradient(90deg,#361E7B,#7C5BF5)" }} />
          </div>
          {/* Green — deliverable completion */}
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#059669,#10B981)" }} />
          </div>
        </div>
      </div>

      {/* ── Deliverable cards ── */}
      {deliverables.map((d, idx) => {
        const cfg = STATUS_CFG[d.status];
        const dueSoon = d.due !== "—" && (() => {
          const parsed = new Date(`${d.due} 2026`);
          if (isNaN(parsed.getTime())) return false;
          return Math.ceil((parsed.getTime() - Date.now()) / 86400000) <= 5;
        })();

        return (
          <div
            key={d.id}
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            {/* Card header */}
            <div className="flex items-start gap-4 px-5 pt-5 pb-4">
              {/* Number badge */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}
              >
                {d.id}
              </div>

              {/* Title + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-base font-bold" style={{ color: "var(--text-1)" }}>{d.title}</p>
                  <span
                    className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                    style={{ background: cfg.bg, color: cfg.text }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm mb-1" style={{ color: "var(--text-3)" }}>{d.description}</p>
                <p className="text-xs" style={{ color: "var(--text-6)" }}>
                  Details — {d.details}
                  {"  "}
                  <span style={{ color: "var(--text-6)" }}>Due — </span>
                  <span style={{ color: dueSoon ? "#EF4444" : "var(--text-5)", fontWeight: dueSoon ? 600 : 400 }}>{d.due}</span>
                </p>
              </div>

              {/* Right: revisions + view button */}
              <div className="shrink-0 flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-[9px] font-bold tracking-widest mb-0.5" style={{ color: "var(--text-6)" }}>REVISIONS</p>
                  <p className="text-sm font-bold" style={{ color: "var(--text-3)" }}>
                    {d.revisions.used}
                    <span style={{ color: "var(--text-6)" }}> / {d.revisions.max}</span>
                  </p>
                </div>
                {d.status !== "upcoming" && (
                  <button
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: "var(--bg-subtle)", color: "var(--text-3)", border: "1px solid var(--border)" }}
                  >
                    View submission
                  </button>
                )}
              </div>
            </div>

            {/* Timeline */}
            {d.timeline.length > 0 && (
              <div
                className="px-5 py-3 flex flex-col gap-2"
                style={{ borderTop: "1px solid var(--border)", background: "rgba(0,0,0,0.15)" }}
              >
                {d.timeline.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TIMELINE_DOT[entry.status] }} />
                    <p
                      className="text-xs font-medium"
                      style={{ color: entry.status === "revision" ? "#F59E0B" : entry.status === "approved" ? "#10B981" : "rgba(255,255,255,0.5)" }}
                    >
                      {entry.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const router  = useRouter();
  const params  = useParams<{ id: string }>();
  const { user } = useUser();

  const [project, setProject]     = useState<HireRequest | null>(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [activeTab, setActiveTab] = useState<"conversation" | "deliverables" | "references">("conversation");
  const [completing, setCompleting] = useState(false);
  const [allMessages, setAllMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/hire-requests/${params.id}`)
      .then(r => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then(({ request }) => { setProject(request); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [params.id]);

  const isArtist = !!project && !!user && project.artist_clerk_id === user.id;

  async function completeProject() {
    if (!project || !user || completing) return;
    setCompleting(true);
    const body = isArtist
      ? { artistClerkId: user.id, status: "completed" }
      : { clientId: user.id, status: "completed", progress: 100 };
    const res = await fetch(`/api/hire-requests/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) { const { request } = await res.json(); setProject(request); }
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

  const isActive = project.status === "accepted";

  return (
    <div className="flex overflow-hidden project-layout" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-17 min-w-0 overflow-hidden">

        {/* ── Header ── */}
        <header
          className="sticky top-0 z-30 shrink-0 flex items-center gap-0 px-4 md:px-6"
          style={{
            height: 52,
            background: "var(--bg-header)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={() => router.push("/hiring?tab=projects")}
              className="flex items-center gap-1.5 shrink-0 transition-opacity hover:opacity-70"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/login-image/ortists logo1.png" alt="Ortist" style={{ height: 22, objectFit: "contain" }} />
            </button>
            <ChevronRight size={14} style={{ color: "var(--text-6)", flexShrink: 0 }} />
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-2)" }}>{project.project_title}</p>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isActive && (
              <button
                onClick={completeProject}
                disabled={completing}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all hover:opacity-85 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", boxShadow: "0 2px 12px rgba(124,91,245,0.4)" }}
              >
                {completing ? "Completing…" : "Complete Project"}
              </button>
            )}
            <button className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ color: "var(--text-4)" }}>
              <Bell size={16} />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ color: "var(--text-4)" }}>
              <Settings size={16} />
            </button>
          </div>
        </header>

        {/* ── 3-column body ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left: FILES */}
          <FilesSidebar
            messages={allMessages}
            onUpload={async () => {}} // upload handled inside ConversationPanel's file ref
          />

          {/* Center: tabs + content */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
            {/* Tabs */}
            <div className="shrink-0 flex items-center gap-1 px-5 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
              {(["conversation", "deliverables", "references"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-all"
                  style={{
                    background: activeTab === t ? "linear-gradient(135deg,#361E7B,#7C5BF5)" : "transparent",
                    color: activeTab === t ? "#fff" : "var(--text-4)",
                    boxShadow: activeTab === t ? "0 2px 12px rgba(124,91,245,0.3)" : "none",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {activeTab === "conversation" && (
                <ConversationPanel
                  project={project}
                  userId={user?.id ?? ""}
                  userName={user?.fullName ?? user?.username ?? "You"}
                  userAvatar={user?.imageUrl || `https://i.pravatar.cc/80?u=${user?.id}`}
                  isArtist={isArtist}
                  onMessagesChange={setAllMessages}
                />
              )}
              {activeTab === "deliverables" && (
                <DeliverablesTab project={project} />
              )}
              {activeTab === "references" && (
                <ReferencesTab messages={allMessages} />
              )}
            </div>
          </div>

          {/* Right: Artist info */}
          <RightSidebar project={project} isArtist={isArtist} />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
