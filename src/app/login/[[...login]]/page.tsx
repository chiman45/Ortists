"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const APPEARANCE = {
  variables: {
    colorPrimary: "#7C5BF5",
    colorBackground: "#151515",
    colorInputBackground: "rgba(255,255,255,0.06)",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "rgba(255,255,255,0.5)",
    colorNeutral: "rgba(255,255,255,0.15)",
    borderRadius: "12px",
    fontFamily: "inherit",
    fontSize: "15px",
  },
  elements: {
    rootBox: { width: "100%" },
    cardBox: { width: "100%", boxShadow: "none" },
    card: {
      background: "transparent",
      boxShadow: "none",
      border: "none",
      width: "100%",
    },
    headerTitle: { color: "#ffffff", fontWeight: "700" },
    headerSubtitle: { color: "rgba(255,255,255,0.45)" },
    socialButtonsBlockButton: {
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "#ffffff",
    },
    dividerLine: { background: "rgba(255,255,255,0.10)" },
    dividerText: { color: "rgba(255,255,255,0.30)" },
    formFieldLabel: { color: "rgba(255,255,255,0.55)" },
    formFieldInput: {
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "#ffffff",
    },
    formButtonPrimary: { background: "#7C5BF5", color: "#ffffff", fontWeight: "600" },
    footerActionLink: { color: "#9B7CF5" },
    footerAction: { color: "rgba(255,255,255,0.4)" },
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
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Already signed in → go straight to feed
  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace("/feed");
  }, [isLoaded, isSignedIn, router]);

  // While Clerk loads or redirecting, show nothing
  if (!isLoaded || isSignedIn) return null;

  return (
    <div className="flex" style={{ minHeight: "100dvh", background: "#111111", overflow: "hidden" }}>

      {/* ── Left: Auth panel ── */}
      <div
        className="flex flex-col w-full lg:w-110 shrink-0 items-center justify-center px-6 py-10 overflow-y-auto gap-5"
        style={{ background: "#151515" }}
      >
        {/* Brand */}
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/login-image/ortists logo1.png"
            alt="Ortist"
            className="w-12 h-12 object-contain mx-auto mb-2"
          />
          <h1 className="text-2xl font-bold text-white tracking-tight">Ortist</h1>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            The creative platform for artists
          </p>
        </div>

        {/* Toggle tabs */}
        <div
          className="flex rounded-2xl p-1 gap-1 w-full max-w-sm"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {(["signin", "signup"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: mode === m ? "#7C5BF5" : "transparent",
                color: mode === m ? "#fff" : "rgba(255,255,255,0.45)",
              }}
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Embedded Clerk form */}
        <div className="w-full max-w-sm">
          {mode === "signin" ? (
            <SignIn
              path="/login"
              routing="path"
              forceRedirectUrl="/feed"
              appearance={APPEARANCE}
            />
          ) : (
            <SignUp
              path="/login"
              routing="path"
              forceRedirectUrl="/feed"
              appearance={APPEARANCE}
            />
          )}
        </div>
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
