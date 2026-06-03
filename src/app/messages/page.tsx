"use client";

import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";
import {
  getMessages, getUserConversations, getOrCreateConversation,
  sendMessage, markMessagesRead, type Conversation, type Message,
} from "@/lib/db/messages";
import { type Profile } from "@/lib/db/profiles";
import { useUser } from "@clerk/nextjs";
import {
  FileText, Mic, MoreVertical, Paperclip,
  Phone, Plus, Search, Send, Video, X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function MessagesPage() {
  const { user } = useUser();

  const [convs, setConvs]               = useState<Conversation[]>([]);
  const [profiles, setProfiles]         = useState<Record<string, Profile>>({});
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState("");
  const [search, setSearch]             = useState("");
  const [loading, setLoading]           = useState(true);
  const [showNewChat, setShowNewChat]   = useState(false);
  const [userSearch, setUserSearch]     = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching]       = useState(false);
  const msgEndRef                       = useRef<HTMLDivElement>(null);
  const pollRef                         = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeConv = convs.find(c => c.id === activeConvId);
  const otherUserId = activeConv?.participant_ids.find(id => id !== user?.id);
  const otherProfile = otherUserId ? profiles[otherUserId] : null;

  // Load conversations + participant profiles
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const data = await getUserConversations(user.id);
    setConvs(data);

    // Collect all participant IDs that aren't the current user
    const otherIds = [...new Set(
      data.flatMap(c => c.participant_ids.filter(id => id !== user.id))
    )];
    if (otherIds.length) {
      const res = await fetch(`/api/profiles?ids=${otherIds.join(",")}`);
      const { profiles: profs }: { profiles: Profile[] } = await res.json();
      setProfiles(prev => {
        const next = { ...prev };
        profs.forEach(p => { next[p.clerk_id] = p; });
        return next;
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    getMessages(activeConvId).then(msgs => {
      setMessages(msgs);
      setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    if (user) markMessagesRead(activeConvId, user.id);
  }, [activeConvId, user]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!activeConvId) return;
    pollRef.current = setInterval(async () => {
      const msgs = await getMessages(activeConvId);
      setMessages(prev => {
        if (msgs.length !== prev.length) {
          setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
        return msgs;
      });
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConvId]);

  // Search users for new chat
  useEffect(() => {
    if (!showNewChat) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const url = userSearch.trim()
        ? `/api/profiles?q=${encodeURIComponent(userSearch)}`
        : "/api/profiles";
      const res = await fetch(url);
      const { profiles } = await res.json();
      setSearchResults(profiles ?? []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [userSearch, showNewChat]);

  async function startConversation(otherUser: Profile) {
    if (!user) return;
    setShowNewChat(false);
    setUserSearch("");
    const conv = await getOrCreateConversation(user.id, otherUser.clerk_id);
    if (!conv) return;
    setProfiles(prev => ({ ...prev, [otherUser.clerk_id]: otherUser }));
    setConvs(prev => {
      if (prev.find(c => c.id === conv.id)) return prev;
      return [conv, ...prev];
    });
    setActiveConvId(conv.id);
  }

  async function send() {
    if (!input.trim() || !user || !activeConvId) return;
    const msg = await sendMessage({
      conversation_id: activeConvId,
      sender_id: user.id,
      sender_name: user.fullName ?? user.username ?? "You",
      sender_avatar: user.imageUrl,
      text: input.trim(),
    });
    if (msg) {
      setMessages(prev => [...prev, msg]);
      setInput("");
      // Update conversation last message locally
      setConvs(prev => prev.map(c =>
        c.id === activeConvId
          ? { ...c, last_message: input.trim(), last_message_at: new Date().toISOString() }
          : c
      ));
      setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  const filteredConvs = convs.filter(c => {
    const otherId = c.participant_ids.find(id => id !== user?.id);
    const prof = otherId ? profiles[otherId] : null;
    const name = prof?.display_name ?? prof?.username ?? otherId ?? "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <div className="flex-1 flex lg:ml-17 overflow-hidden" style={{ height: "100vh" }}>

        {/* ── Left: Conversation list ── */}
        <div className="hidden md:flex flex-col w-72 shrink-0 h-full"
          style={{ borderRight: "1px solid var(--border)", background: "var(--bg-card)" }}>
          <div className="px-4 pt-5 pb-4 shrink-0">
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-1)" }}>Messages</h2>
            <button
              onClick={() => setShowNewChat(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold mb-3 transition-opacity hover:opacity-85"
              style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", color: "#fff" }}>
              <Plus size={15} /> New Chat
            </button>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
              <Search size={13} style={{ color: "var(--text-5)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="flex-1 bg-transparent text-xs outline-none" style={{ color: "var(--text-2)" }} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4" style={{ scrollbarWidth: "none" }}>
            {loading && <p className="text-xs text-center py-4" style={{ color: "var(--text-5)" }}>Loading…</p>}
            {!loading && filteredConvs.length === 0 && (
              <p className="text-xs text-center py-8" style={{ color: "var(--text-5)" }}>
                No conversations yet.{"\n"}Click New Chat to start.
              </p>
            )}
            {filteredConvs.map(c => {
              const otherId = c.participant_ids.find(id => id !== user?.id);
              const prof = otherId ? profiles[otherId] : null;
              const name = prof?.display_name ?? prof?.username ?? "Unknown";
              const avatar = prof?.avatar_url ?? `https://i.pravatar.cc/80?u=${otherId}`;
              const isActive = c.id === activeConvId;

              return (
                <button key={c.id} onClick={() => setActiveConvId(c.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all mb-0.5"
                  style={{
                    background: isActive ? "rgba(124,91,245,0.12)" : "transparent",
                    border: isActive ? "1px solid rgba(124,91,245,0.2)" : "1px solid transparent",
                  }}>
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{name}</span>
                      <span className="text-[10px] shrink-0 ml-1" style={{ color: "var(--text-5)" }}>
                        {timeAgo(c.last_message_at)}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: "var(--text-4)" }}>
                      {c.last_message ?? "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Centre: Chat ── */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          {!activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4"
              style={{ color: "var(--text-5)" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(124,91,245,0.12)" }}>
                <Send size={24} style={{ color: "#9B7CF5" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-3)" }}>Select a conversation or start a new one</p>
              <button onClick={() => setShowNewChat(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
                style={{ background: "#7C5BF5" }}>
                New Chat
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 shrink-0"
                style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}>
                {otherProfile && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={otherProfile.avatar_url ?? `https://i.pravatar.cc/80?u=${otherUserId}`}
                    alt={otherProfile.display_name ?? "User"}
                    className="w-9 h-9 rounded-full object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                    {otherProfile?.display_name ?? otherProfile?.username ?? "Unknown"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-5)" }}>
                    {otherProfile?.tag ?? "Artist"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[Phone, Video, MoreVertical].map((Icon, i) => (
                    <button key={i} className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
                      style={{ color: "var(--text-4)" }}>
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3"
                style={{ scrollbarWidth: "none" }}>
                <div className="flex justify-center mb-2">
                  <span className="text-[11px] px-3 py-1 rounded-full"
                    style={{ background: "var(--bg-subtle)", color: "var(--text-5)" }}>Today</span>
                </div>

                {messages.length === 0 && (
                  <p className="text-center text-xs py-8" style={{ color: "var(--text-5)" }}>
                    No messages yet. Say hi! 👋
                  </p>
                )}

                {messages.map(m => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}>
                      {!isMe && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={m.sender_avatar ?? `https://i.pravatar.cc/40?u=${m.sender_id}`}
                          alt={m.sender_name ?? "User"}
                          className="w-6 h-6 rounded-full object-cover shrink-0 mb-0.5" />
                      )}
                      <div className="max-w-[68%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                        style={isMe
                          ? { background: "linear-gradient(135deg,#361E7B,#7C5BF5)", color: "#fff", borderBottomRightRadius: 6 }
                          : { background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border)", borderBottomLeftRadius: 6 }
                        }>
                        {m.text}
                        <div className="flex items-center gap-1 mt-1 text-[10px]"
                          style={{ color: isMe ? "rgba(255,255,255,0.55)" : "var(--text-5)" }}>
                          {timeAgo(m.created_at)}
                          {isMe && m.read && <span>· Read</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={msgEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 flex items-center gap-2 shrink-0"
                style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
                {[Paperclip, FileText, Mic].map((Icon, i) => (
                  <button key={i} className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70 shrink-0"
                    style={{ color: "var(--text-4)" }}>
                    <Icon size={16} />
                  </button>
                ))}
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-1)" }} />
                <button onClick={send} disabled={!input.trim()}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-opacity disabled:opacity-30 hover:opacity-85"
                  style={{ background: "#7C5BF5" }}>
                  <Send size={15} color="#fff" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Right: Contact info ── */}
        {otherProfile && (
          <div className="hidden xl:flex flex-col w-64 shrink-0 h-full overflow-y-auto"
            style={{ borderLeft: "1px solid var(--border)", background: "var(--bg-card)", scrollbarWidth: "none" }}>
            <div className="px-4 py-5 flex flex-col items-center text-center border-b" style={{ borderColor: "var(--border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={otherProfile.avatar_url ?? `https://i.pravatar.cc/80?u=${otherUserId}`}
                alt={otherProfile.display_name ?? "User"}
                className="w-16 h-16 rounded-full object-cover mb-3"
                style={{ border: "3px solid rgba(124,91,245,0.3)" }} />
              <p className="text-sm font-bold mb-0.5" style={{ color: "var(--text-1)" }}>
                {otherProfile.display_name ?? otherProfile.username}
              </p>
              <p className="text-xs mb-1.5" style={{ color: "var(--text-4)" }}>{otherProfile.tag}</p>
              <p className="text-xs" style={{ color: otherProfile.available ? "#10B981" : "var(--text-5)" }}>
                {otherProfile.available ? "● Available" : "● Busy"}
              </p>
            </div>
            {otherProfile.bio && (
              <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                <p className="text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-5)" }}>About</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-4)" }}>{otherProfile.bio}</p>
              </div>
            )}
            <div className="px-4 py-4 flex flex-col gap-2">
              <Link href={`/u/${otherProfile.username}`}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white text-center transition-opacity hover:opacity-85 block"
                style={{ background: "#7C5BF5" }}>
                View Profile
              </Link>
              <button
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85"
                style={{ background: "rgba(245,158,11,0.9)", color: "#fff" }}>
                Hire Artist
              </button>
              <button
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85"
                style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                Block User
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── New Chat Modal ── */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
          onClick={e => e.target === e.currentTarget && setShowNewChat(false)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-sm font-bold flex-1" style={{ color: "var(--text-1)" }}>New Message</h3>
              <button onClick={() => setShowNewChat(false)} className="transition-opacity hover:opacity-70"
                style={{ color: "var(--text-5)" }}><X size={16} /></button>
            </div>
            {/* Search */}
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                <Search size={13} style={{ color: "var(--text-5)" }} />
                <input
                  autoFocus
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by name or username..."
                  className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-2)" }} />
              </div>
            </div>
            {/* Results */}
            <div className="overflow-y-auto" style={{ maxHeight: 320, scrollbarWidth: "none" }}>
              {searching && <p className="text-xs text-center py-4" style={{ color: "var(--text-5)" }}>Searching…</p>}
              {!searching && searchResults.map(p => (
                <button key={p.clerk_id} onClick={() => startConversation(p)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-all text-left"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.avatar_url ?? `https://i.pravatar.cc/80?u=${p.clerk_id}`}
                    alt={p.display_name ?? "User"}
                    className="w-10 h-10 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
                      {p.display_name ?? p.username}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-5)" }}>
                      @{p.username} · {p.tag}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                    style={p.available
                      ? { background: "rgba(16,185,129,0.15)", color: "#10B981" }
                      : { background: "var(--bg-subtle)", color: "var(--text-5)" }}>
                    {p.available ? "Available" : "Busy"}
                  </span>
                </button>
              ))}
              {!searching && searchResults.length === 0 && userSearch && (
                <p className="text-xs text-center py-8" style={{ color: "var(--text-5)" }}>No users found for "{userSearch}"</p>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
