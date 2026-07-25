"use client";

import { useClerk } from "@clerk/nextjs";
import { Bookmark, Heart, MessageCircle, Sparkles, UserPlus, X } from "lucide-react";

interface Props {
  onClose: () => void;
}

const FEATURES = [
  { icon: <Heart size={14} />,        text: "Like and save artwork"          },
  { icon: <MessageCircle size={14} />, text: "Comment on posts"               },
  { icon: <UserPlus size={14} />,     text: "Follow your favourite artists"  },
  { icon: <Bookmark size={14} />,     text: "Build your inspiration board"   },
  { icon: <Sparkles size={14} />,     text: "Get discovered as an artist"    },
];

export default function AuthPromptModal({ onClose }: Props) {
  const { openSignIn, openSignUp } = useClerk();

  function handleSignIn() {
    onClose();
    openSignIn({ forceRedirectUrl: "/feed" });
  }

  function handleSignUp() {
    onClose();
    openSignUp({ forceRedirectUrl: "/feed" });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(28,18,60,0.98) 0%, rgba(18,12,40,0.99) 100%)",
          border: "1px solid rgba(124,91,245,0.25)",
          boxShadow: "0 -4px 60px rgba(124,91,245,0.15), 0 20px 60px rgba(0,0,0,0.7)",
        }}
      >
        {/* Close */}
        <div className="flex justify-end px-4 pt-4">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Logo + headline */}
        <div className="flex flex-col items-center px-6 pb-5 -mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/login-image/ortists logo1.png"
            alt="Ortist"
            className="w-14 h-14 object-contain mb-3"
            style={{ filter: "drop-shadow(0 0 12px rgba(124,91,245,0.5))" }}
          />
          <h2 className="text-xl font-bold text-center text-white mb-1">
            Join the creative community
          </h2>
          <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.45)" }}>
            Sign in to interact with artists and their work
          </p>
        </div>

        {/* Feature list */}
        <div className="mx-5 mb-5 rounded-2xl px-4 py-3 flex flex-col gap-2.5"
          style={{ background: "rgba(124,91,245,0.08)", border: "1px solid rgba(124,91,245,0.15)" }}>
          {FEATURES.map(f => (
            <div key={f.text} className="flex items-center gap-3">
              <span
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(124,91,245,0.2)", color: "#9B7CF5" }}
              >
                {f.icon}
              </span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="px-5 pb-6 flex flex-col gap-2.5">
          <button
            onClick={handleSignUp}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg,#361E7B,#7C5BF5)",
              boxShadow: "0 4px 20px rgba(124,91,245,0.4)",
            }}
          >
            Create free account
          </button>
          <button
            onClick={handleSignIn}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all hover:opacity-80"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
