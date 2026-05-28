"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { useState } from "react";

const APPEARANCE = {
  variables: {
    colorPrimary: "#7C5BF5",
    colorBackground: "#151515",
    colorInputBackground: "rgba(255,255,255,0.05)",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "rgba(255,255,255,0.45)",
    colorNeutral: "rgba(255,255,255,0.15)",
    borderRadius: "1rem",
    fontFamily: "inherit",
  },
  elements: {
    card: {
      background: "transparent",
      boxShadow: "none",
      border: "none",
      padding: 0,
      width: "100%",
      maxWidth: "360px",
    },
    headerTitle: { color: "#ffffff", fontSize: "1.75rem", fontWeight: "700" },
    headerSubtitle: { color: "rgba(255,255,255,0.40)" },
    socialButtonsBlockButton: {
      background: "rgba(255,255,255,0.07)",
      border: "1px solid rgba(255,255,255,0.10)",
      color: "#ffffff",
      borderRadius: "1rem",
    },
    dividerLine: { background: "rgba(255,255,255,0.10)" },
    dividerText: { color: "rgba(255,255,255,0.30)" },
    formFieldInput: {
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.10)",
      color: "#ffffff",
      borderRadius: "1rem",
    },
    formFieldLabel: { color: "rgba(255,255,255,0.50)" },
    formButtonPrimary: {
      background: "#ffffff",
      color: "#111111",
      borderRadius: "1rem",
      fontWeight: "600",
    },
    footerActionLink: { color: "#9B7CF5" },
    identityPreviewText: { color: "#ffffff" },
    identityPreviewEditButtonIcon: { color: "rgba(255,255,255,0.5)" },
    footer: { display: "none" },
  },
};

const ART_IMAGES = [
  "https://picsum.photos/seed/art1/600/600",
  "https://picsum.photos/seed/art2/600/600",
  "https://picsum.photos/seed/art3/600/600",
  "https://picsum.photos/seed/art4/600/600",
  "https://picsum.photos/seed/art5/600/600",
  "https://picsum.photos/seed/art6/600/600",
  "https://picsum.photos/seed/art7/600/600",
  "https://picsum.photos/seed/art8/600/600",
  "https://picsum.photos/seed/art9/600/600",
  "https://picsum.photos/seed/art10/600/600",
  "https://picsum.photos/seed/art11/600/600",
  "https://picsum.photos/seed/art12/600/600",
  "https://picsum.photos/seed/art13/600/600",
  "https://picsum.photos/seed/art14/600/600",
  "https://picsum.photos/seed/art15/600/600",
  "https://picsum.photos/seed/art16/600/600",
];

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="flex" style={{ height: "100dvh", background: "#111111", overflow: "hidden" }}>

      {/* ── Left: Auth panel ── */}
      <div
        className="flex flex-col w-full lg:w-110 shrink-0 items-center justify-center px-6 py-10 overflow-y-auto gap-6"
        style={{ background: "#151515" }}
      >
        {/* Toggle tabs */}
        <div
          className="flex rounded-2xl p-1 gap-1"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {(["signin", "signup"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-6 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: mode === m ? "#7C5BF5" : "transparent",
                color: mode === m ? "#fff" : "rgba(255,255,255,0.45)",
              }}
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Clerk component */}
        {mode === "signin" ? (
          <SignIn
            routing="hash"
            forceRedirectUrl="/feed"
            signUpForceRedirectUrl="/feed"
            appearance={APPEARANCE}
          />
        ) : (
          <SignUp
            routing="hash"
            forceRedirectUrl="/feed"
            signInForceRedirectUrl="/feed"
            appearance={APPEARANCE}
          />
        )}
      </div>

      {/* ── Right: art grid ── */}
      <div
        className="hidden lg:grid flex-1"
        style={{
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)",
          gap: 3,
          height: "100dvh",
        }}
      >
        {ART_IMAGES.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ))}
      </div>

    </div>
  );
}
