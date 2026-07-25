"use client";

import { useClerk } from "@clerk/nextjs";
import Image from "next/image";
import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthPromptCtx {
  showLoginPrompt: () => void;
}

const AuthPromptContext = createContext<AuthPromptCtx>({ showLoginPrompt: () => {} });

export function useAuthPrompt() {
  return useContext(AuthPromptContext);
}

export function AuthPromptProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <AuthPromptContext.Provider value={{ showLoginPrompt: () => setOpen(true) }}>
      {children}
      {open && <LoginPromptModal onClose={() => setOpen(false)} />}
    </AuthPromptContext.Provider>
  );
}

function LoginPromptModal({ onClose }: { onClose: () => void }) {
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
      className="fixed inset-0 z-200 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(12px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Card */}
      <div
        className="relative w-full sm:max-w-100 sm:mx-4 rounded-t-4xl sm:rounded-4xl overflow-hidden flex flex-col items-center"
        style={{
          background: "linear-gradient(160deg, #1a1030 0%, #151515 60%)",
          border: "1px solid rgba(124,91,245,0.25)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Top glow bar */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(124,91,245,0.8), rgba(245,158,11,0.5), transparent)" }}
        />

        {/* Background radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(124,91,245,0.18) 0%, transparent 70%)",
          }}
        />

        <div className="relative w-full flex flex-col items-center px-8 pt-9 pb-8 gap-0">
          {/* Logo */}
          <div
            className="w-20 h-20 rounded-2xl overflow-hidden mb-5 shrink-0"
            style={{
              boxShadow: "0 8px 32px rgba(124,91,245,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
            }}
          >
            <Image
              src="/logo.jpeg"
              alt="Ortist"
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Heading */}
          <p
            className="text-2xl font-bold text-center mb-1"
            style={{ color: "#fff", letterSpacing: "-0.02em" }}
          >
            Welcome to Ortist
          </p>
          <p className="text-sm text-center mb-7 leading-snug" style={{ color: "rgba(255,255,255,0.45)" }}>
            The creative space for artists and art lovers.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[
              { icon: "❤️", label: "Like artwork" },
              { icon: "💬", label: "Comment" },
              { icon: "🎨", label: "Share your work" },
              { icon: "🤝", label: "Hire artists" },
            ].map(f => (
              <span
                key={f.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: "rgba(124,91,245,0.12)",
                  border: "1px solid rgba(124,91,245,0.25)",
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                <span>{f.icon}</span>
                {f.label}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={handleSignIn}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #4c2db5 0%, #7C5BF5 50%, #9b73ff 100%)",
                boxShadow: "0 4px 20px rgba(124,91,245,0.45)",
              }}
            >
              Log in
            </button>
            <button
              onClick={handleSignUp}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              Create free account
            </button>
          </div>

          {/* Guest link */}
          <button
            onClick={onClose}
            className="mt-5 text-xs transition-opacity hover:opacity-100 opacity-40"
            style={{ color: "#fff" }}
          >
            Continue browsing as guest
          </button>
        </div>
      </div>
    </div>
  );
}
