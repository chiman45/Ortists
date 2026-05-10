"use client";

import Avatar from "@/components/ui/Avatar";
import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";
import { ChevronLeft, ImageIcon, MoreHorizontal, Paperclip, Phone, Search, Send, Smile, Video } from "lucide-react";
import { useState } from "react";

const CONVS = [
  { id:"1", name:"Sarah Wilson",   handle:"@s.wilson",   last:"Love your new artwork! 🔥",       time:"2m",  unread:3, online:true  },
  { id:"2", name:"Marco Chen",     handle:"@mrc.design",  last:"Can we collab on this piece?",   time:"15m", unread:0, online:true  },
  { id:"3", name:"Julia Reyes",    handle:"@julia.art",   last:"Sent you a commission request",  time:"1h",  unread:1, online:false },
  { id:"4", name:"Alex Creates",   handle:"@alex.c",      last:"When is your next drop?",        time:"3h",  unread:0, online:false },
  { id:"5", name:"Nina Brush",     handle:"@nina.paint",  last:"Amazing colors btw 💜",          time:"5h",  unread:0, online:true  },
  { id:"6", name:"Leo Studio",     handle:"@leo.studio",  last:"Thanks for the feedback!",       time:"1d",  unread:0, online:false },
  { id:"7", name:"Mia Artworks",   handle:"@mia.art",     last:"I'll send you the brief asap",  time:"2d",  unread:0, online:false },
];

type Msg = { id: string; text: string; sent: boolean; time: string };

const CHAT: Record<string, Msg[]> = {
  "1": [
    { id:"a", text:"Hey! Just saw your latest piece. Absolutely stunning 😍",                       sent:false, time:"10:28 AM" },
    { id:"b", text:"Thank you so much! Spent three weeks on that one 🙏",                           sent:true,  time:"10:30 AM" },
    { id:"c", text:"It really shows — the layering is incredible. How did you get that depth?",     sent:false, time:"10:31 AM" },
    { id:"d", text:"Mix of oils and digital post-processing. Happy to share my workflow!",          sent:true,  time:"10:33 AM" },
    { id:"e", text:"Yes please! Would love to learn from you",                                      sent:false, time:"10:34 AM" },
    { id:"f", text:"I'll put together a full breakdown and post it this week 🎨",                  sent:true,  time:"10:35 AM" },
    { id:"g", text:"Love your new artwork! 🔥",                                                    sent:false, time:"10:42 AM" },
  ],
  "2": [
    { id:"a", text:"Hey! Big fan of your work. Would love to collab someday",                       sent:false, time:"Yesterday" },
    { id:"b", text:"That means a lot! What kind of project did you have in mind?",                  sent:true,  time:"Yesterday" },
    { id:"c", text:"Can we collab on this piece?",                                                  sent:false, time:"9:15 AM"  },
  ],
  "3": [
    { id:"a", text:"Hi Kate, I've seen your portfolio and I'd love to commission a piece",           sent:false, time:"2h ago" },
    { id:"b", text:"I'd be happy to chat about it! What style are you looking for?",                sent:true,  time:"1h ago" },
    { id:"c", text:"Sent you a commission request",                                                  sent:false, time:"45m ago" },
  ],
};

export default function MessagesPage() {
  const [sel, setSel]         = useState("1");
  const [showChat, setShowChat] = useState(false);
  const [input, setInput]     = useState("");
  const [query, setQuery]     = useState("");

  const conv = CONVS.find(c => c.id === sel)!;
  const msgs = CHAT[sel] ?? [];
  const list = CONVS.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

  function selectConv(id: string) {
    setSel(id);
    setShowChat(true);
  }

  return (
    <div className="flex" style={{ height: "100dvh", background: "var(--bg)", overflow: "hidden" }}>
      <Sidebar />

      <div className="flex-1 lg:ml-56 flex overflow-hidden">

        {/* ── Conversation list ─────────────────────────────── */}
        {/* Mobile: full-width when showChat=false, hidden when showChat=true */}
        {/* Desktop: always visible, fixed width */}
        <div
          className={`flex flex-col shrink-0 ${showChat ? "hidden lg:flex" : "flex"} w-full lg:w-72 xl:w-80`}
          style={{ borderRight: "1px solid var(--border)" }}
        >
          {/* Header */}
          <div className="px-4 sm:px-5 py-4 sm:py-5 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>Messages</h1>
              <button
                className="p-2 rounded-xl transition-opacity hover:opacity-70"
                style={{ background: "var(--bg-subtle)", color: "var(--text-icon)" }}
              >
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
            >
              <Search size={14} style={{ color: "var(--text-6)", flexShrink: 0 }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search messages..."
                className="bg-transparent text-sm outline-none flex-1 min-w-0"
                style={{ color: "var(--text-2)", caretColor: "#7C5BF5" }}
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto pb-24 lg:pb-2">
            {list.map(c => (
              <button
                key={c.id}
                onClick={() => selectConv(c.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left"
                style={{
                  background: sel === c.id && !showChat ? "rgba(54,30,123,0.18)" : "transparent",
                  borderLeft: `2px solid ${sel === c.id && !showChat ? "#7C5BF5" : "transparent"}`,
                }}
                onMouseEnter={e => { if (!(sel === c.id && !showChat)) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={e => { if (!(sel === c.id && !showChat)) e.currentTarget.style.background = "transparent"; }}
              >
                <div className="relative shrink-0">
                  <Avatar name={c.name} size={46} />
                  {c.online && (
                    <span
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2"
                      style={{ borderColor: "var(--ring-bg)" }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{c.name}</span>
                    <span className="text-[10px] shrink-0" style={{ color: "var(--text-6)" }}>{c.time}</span>
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-5)" }}>{c.last}</p>
                </div>
                {c.unread > 0 && (
                  <span
                    className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                    style={{ background: "#361E7B" }}
                  >{c.unread}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Chat panel ────────────────────────────────────── */}
        {/* Mobile: full-width when showChat=true, hidden otherwise */}
        {/* Desktop: always visible, takes remaining space */}
        <div className={`flex-col overflow-hidden ${showChat ? "flex" : "hidden lg:flex"} flex-1`}>

          {/* Chat header */}
          <div
            className="flex items-center justify-between px-4 sm:px-6 py-3.5 shrink-0"
            style={{
              background: "var(--bg-header)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Back button — mobile only */}
              <button
                className="lg:hidden p-1.5 -ml-1 rounded-xl transition-opacity hover:opacity-70"
                style={{ color: "var(--text-icon)" }}
                onClick={() => setShowChat(false)}
              >
                <ChevronLeft size={22} strokeWidth={2} />
              </button>

              <div className="relative">
                <Avatar name={conv.name} size={38} />
                {conv.online && (
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2"
                    style={{ borderColor: "var(--ring-bg)" }}
                  />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm sm:text-base" style={{ color: "var(--text-1)" }}>{conv.name}</p>
                <p className="text-[11px]" style={{ color: "var(--text-5)" }}>
                  {conv.online ? "● Online" : "Offline"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {[Phone, Video, MoreHorizontal].map((Icon, i) => (
                <button
                  key={i}
                  className="p-2 rounded-xl transition-opacity hover:opacity-70"
                  style={{ background: "var(--bg-subtle)", color: "var(--text-icon)" }}
                >
                  <Icon size={17} strokeWidth={1.8} />
                </button>
              ))}
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
            {msgs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <p className="text-sm" style={{ color: "var(--text-5)" }}>No messages yet. Say hi! 👋</p>
              </div>
            ) : (
              msgs.map(m => (
                <div key={m.id} className={`flex ${m.sent ? "justify-end" : "justify-start"}`}>
                  {!m.sent && (
                    <div className="mr-2 mt-auto shrink-0">
                      <Avatar name={conv.name} size={26} />
                    </div>
                  )}
                  <div className="max-w-[72%] sm:max-w-[62%]">
                    <div
                      className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={m.sent
                        ? { background: "#361E7B", color: "white", borderBottomRightRadius: 6, boxShadow: "0 4px 16px rgba(54,30,123,0.42)" }
                        : { background: "var(--bg-muted)", color: "var(--text-2)", borderBottomLeftRadius: 6, border: "1px solid var(--border-card)" }
                      }
                    >{m.text}</div>
                    <p
                      className={`text-[10px] mt-1 ${m.sent ? "text-right" : "text-left"}`}
                      style={{ color: "var(--text-6)" }}
                    >{m.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input bar */}
          <div
            className="px-4 sm:px-6 py-3 sm:py-4 shrink-0 pb-24 lg:pb-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-card)" }}
            >
              {[Smile, Paperclip, ImageIcon].map((Icon, i) => (
                <button
                  key={i}
                  className="transition-opacity hover:opacity-80 shrink-0"
                  style={{ color: "var(--text-6)" }}
                >
                  <Icon size={i === 0 ? 20 : 18} />
                </button>
              ))}
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && input.trim()) setInput(""); }}
                placeholder="Write a message..."
                className="flex-1 bg-transparent text-sm outline-none min-w-0"
                style={{ color: "var(--text-2)", caretColor: "#7C5BF5" }}
              />
              <button
                onClick={() => setInput("")}
                className="p-2 rounded-xl shrink-0 transition-all hover:scale-[1.05]"
                style={{
                  background: input.trim() ? "#361E7B" : "var(--bg-muted)",
                  color: input.trim() ? "white" : "var(--text-6)",
                  boxShadow: input.trim() ? "0 0 16px rgba(54,30,123,0.45)" : "none",
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>

      <BottomNav />
    </div>
  );
}
