"use client";

import { AuthenticateWithRedirectCallback, SignIn } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import SignUpForm from "@/components/auth/SignUpForm";

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

// useSearchParams() (used below to read ?mode=signup) requires a Suspense
// boundary, or `next build` fails prerendering this page entirely.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );

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
        className="flex flex-col w-full items-center justify-center px-6 py-10 overflow-y-auto gap-5"
        style={{ background: "#151515" }}
      >
        {/* Brand */}
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/login-image/ortists-badge.png"
            alt="Ortists"
            className="object-contain mx-auto mb-3"
            style={{ width: 80, height: 80, filter: "brightness(1.08) drop-shadow(0 0 18px rgba(255,255,255,0.3)) drop-shadow(0 0 40px rgba(124,91,245,0.5)) drop-shadow(0 0 4px rgba(255,255,255,0.55))" }}
          />
          <h1 className="text-2xl font-bold text-white tracking-tight">Ortists</h1>
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
          ) : pathname?.endsWith("/sso-callback") ? (
            // Returning from Google during sign-up (see SignUpForm.google)
            <AuthenticateWithRedirectCallback signUpForceRedirectUrl="/feed" signInForceRedirectUrl="/feed" />
          ) : (
            // Email + phone + password on one form (Clerk's prebuilt <SignUp> has no phone field)
            <SignUpForm />
          )}
        </div>
      </div>

    </div>
  );
}
