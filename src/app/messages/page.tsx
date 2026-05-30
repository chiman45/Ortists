"use client";

import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";
import { ExternalLink, FileText, Mic, MoreVertical, Paperclip, Phone, Plus, Search, Send, Smile, Video } from "lucide-react";
import { useState } from "react";

const CONVS = [
  { id: 1, name: "Maya Chen",    avatar: "https://i.pravatar.cc/80?img=5",  last: "I'd love to collaborate on that proj...", time: "2m",        unread: 3, online: true  },
  { id: 2, name: "Alex Rivera",  avatar: "https://i.pravatar.cc/80?img=7",  last: "The artwork looks amazing! When...",      time: "1h ago",    unread: 0, online: true  },
  { id: 3, name: "Jordan Lee",   avatar: "https://i.pravatar.cc/80?img=9",  last: "Thanks for the commission update...",     time: "3h ago",    unread: 0, online: false },
  { id: 4, name: "Sam Park",     avatar: "https://i.pravatar.cc/80?img=11", last: "Check out my new portfolio pieces...",    time: "Yesterday", unread: 1, online: false },
  { id: 5, name: "Riley Stone",  avatar: "https://i.pravatar.cc/80?img=13", last: "Perfect! Let's finalize the details",     time: "2d ago",    unread: 0, online: false },
];

type Msg =
  | { id: number; kind: "text";       from: "me" | "other"; text: string; time: string; read?: boolean }
  | { id: number; kind: "commission"; title: string; amount: string; date: string; status: string };

const INITIAL_MSGS: Msg[] = [
  { id: 1, kind: "text",       from: "other", text: "Hey! I saw your portfolio and I'm really impressed with your work.", time: "10:30 AM" },
  { id: 2, kind: "text",       from: "me",    text: "Thank you so much! I'd love to hear more about what you're looking for.", time: "10:32 AM", read: true },
  { id: 3, kind: "text",       from: "other", text: "I'm working on a new project and need some custom illustrations. Would you be interested in collaborating?", time: "10:35 AM" },
  { id: 4, kind: "commission", title: "Custom Illustration Project", amount: "$2,500", date: "June 15, 2026", status: "pending" },
  { id: 5, kind: "text",       from: "me",    text: "I'd love to collaborate on that project! The timeline and budget look perfect.", time: "10:40 AM", read: true },
  { id: 6, kind: "text",       from: "other", text: "That's great! Let me send you more details about the project scope.", time: "Just now" },
];

const CONTACT = {
  name: "Maya Chen",
  role: "Digital Illustrator",
  online: true,
  about: "Specializing in character design and fantasy illustrations. Available for commissions and collaborations.",
  portfolio: ["portrait1","portrait2","portrait3","oil1","oil2","oil3"],
  files: ["artwork-v1.jpg", "reference-sketch.pr", "final-design.ps"],
};

export default function MessagesPage() {
  const [activeId, setActiveId] = useState(1);
  const [msgs, setMsgs] = useState<Msg[]>(INITIAL_MSGS);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");

  const filtered = CONVS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const active = CONVS.find(c => c.id === activeId)!;

  function send() {
    if (!input.trim()) return;
    setMsgs(prev => [...prev, { id: Date.now(), kind: "text", from: "me", text: input.trim(), time: "Just now", read: false }]);
    setInput("");
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <div className="flex-1 flex lg:ml-17 min-h-screen overflow-hidden" style={{ height: "100vh" }}>

        {/* ── Left: Conversation list ── */}
        <div
          className="hidden md:flex flex-col w-72 shrink-0 h-full"
          style={{ borderRight: "1px solid var(--border)", background: "var(--bg-card)" }}
        >
          <div className="px-4 pt-5 pb-4 shrink-0">
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-1)" }}>Messages</h2>
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold mb-3 transition-opacity hover:opacity-85"
              style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", color: "#fff" }}
            >
              <Plus size={15} /> New Chat
            </button>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
            >
              <Search size={13} style={{ color: "var(--text-5)" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="flex-1 bg-transparent text-xs outline-none"
                style={{ color: "var(--text-2)" }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4" style={{ scrollbarWidth: "none" }}>
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all mb-0.5"
                style={{
                  background: activeId === c.id ? "rgba(124,91,245,0.12)" : "transparent",
                  border: activeId === c.id ? "1px solid rgba(124,91,245,0.2)" : "1px solid transparent",
                }}
              >
                <div className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
                  {c.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2" style={{ background: "#10B981", borderColor: "var(--bg-card)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{c.name}</span>
                    <span className="text-[10px] shrink-0 ml-1" style={{ color: "var(--text-5)" }}>{c.time}</span>
                  </div>
                  <p className="text-xs truncate" style={{ color: "var(--text-4)" }}>{c.last}</p>
                </div>
                {c.unread > 0 && (
                  <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 text-white" style={{ background: "#7C5BF5" }}>
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Centre: Chat ── */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          {/* Chat header */}
          <div
            className="flex items-center gap-3 px-5 py-3.5 shrink-0"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}
          >
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={active.avatar} alt={active.name} className="w-9 h-9 rounded-full object-cover" />
              {active.online && (
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full border-2" style={{ background: "#10B981", borderColor: "var(--bg-card)" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{active.name}</p>
              <p className="text-xs" style={{ color: "#10B981" }}>Online</p>
            </div>
            <div className="flex items-center gap-1">
              {[Phone, Video, MoreVertical].map((Icon, i) => (
                <button key={i} className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70" style={{ color: "var(--text-4)" }}>
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
            <div className="flex justify-center mb-2">
              <span className="text-[11px] px-3 py-1 rounded-full" style={{ background: "var(--bg-subtle)", color: "var(--text-5)" }}>Today</span>
            </div>

            {msgs.map(msg => {
              if (msg.kind === "commission") {
                return (
                  <div key={msg.id} className="self-center w-full max-w-sm">
                    <div
                      className="rounded-2xl p-4"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{msg.title}</p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>
                          {msg.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-4)" }}>
                        <span className="font-semibold" style={{ color: "var(--text-1)" }}>{msg.amount}</span>
                        <span>📅 {msg.date}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              const isMe = msg.from === "me";
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[68%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={isMe
                      ? { background: "linear-gradient(135deg,#361E7B,#7C5BF5)", color: "#fff", borderBottomRightRadius: 6 }
                      : { background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border)", borderBottomLeftRadius: 6 }
                    }
                  >
                    {msg.text}
                    <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMe ? "justify-end" : "justify-start"}`}
                      style={{ color: isMe ? "rgba(255,255,255,0.55)" : "var(--text-5)" }}>
                      {msg.time}
                      {isMe && msg.read && <span>Read</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input bar */}
          <div
            className="px-4 py-3 flex items-center gap-2 shrink-0"
            style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}
          >
            {[Smile, Paperclip, FileText, Mic].map((Icon, i) => (
              <button key={i} className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70 shrink-0" style={{ color: "var(--text-4)" }}>
                <Icon size={16} />
              </button>
            ))}
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--text-1)" }}
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-opacity disabled:opacity-30 hover:opacity-85"
              style={{ background: "#7C5BF5" }}
            >
              <Send size={15} color="#fff" />
            </button>
          </div>
        </div>

        {/* ── Right: Contact info ── */}
        <div
          className="hidden xl:flex flex-col w-64 shrink-0 h-full overflow-y-auto"
          style={{ borderLeft: "1px solid var(--border)", background: "var(--bg-card)", scrollbarWidth: "none" }}
        >
          <div className="px-4 py-5 flex flex-col items-center text-center border-b" style={{ borderColor: "var(--border)" }}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-3"
              style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", color: "#fff" }}
            >
              {CONTACT.name.split(" ").map(w => w[0]).join("")}
            </div>
            <p className="text-sm font-bold mb-0.5" style={{ color: "var(--text-1)" }}>{CONTACT.name}</p>
            <p className="text-xs mb-1.5" style={{ color: "var(--text-4)" }}>{CONTACT.role}</p>
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#10B981" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" /> Online
            </span>
          </div>

          <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-5)" }}>About</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-4)" }}>{CONTACT.about}</p>
          </div>

          <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-[11px] font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-5)" }}>Portfolio Preview</p>
            <div className="grid grid-cols-3 gap-1">
              {CONTACT.portfolio.map(seed => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={seed}
                  src={`https://picsum.photos/seed/${seed}/80/80`}
                  alt=""
                  className="w-full aspect-square object-cover rounded-lg"
                />
              ))}
            </div>
          </div>

          <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-[11px] font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-5)" }}>Shared Media</p>
            <div className="flex flex-col gap-2">
              {CONTACT.files.map(f => (
                <div key={f} className="flex items-center gap-2 group cursor-pointer">
                  <FileText size={13} style={{ color: "#9B7CF5" }} />
                  <span className="text-xs flex-1 truncate" style={{ color: "var(--text-3)" }}>{f}</span>
                  <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-5)" }} />
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 py-4 flex flex-col gap-2">
            <button
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85"
              style={{ background: "#7C5BF5", color: "#fff" }}
            >
              View Profile
            </button>
            <button
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85"
              style={{ background: "rgba(245,158,11,0.9)", color: "#fff" }}
            >
              Hire Artist
            </button>
            <button
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85"
              style={{ background: "var(--bg-subtle)", color: "var(--text-2)", border: "1px solid var(--border)" }}
            >
              Commission History
            </button>
            <button
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85"
              style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              Block User
            </button>
          </div>
        </div>

      </div>

      <BottomNav />
    </div>
  );
}
