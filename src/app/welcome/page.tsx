"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Brush, ShoppingBag } from "lucide-react";
import { AGREEMENT_VERSION } from "@/lib/agreements";
import AgreementConsent, { allAccepted, type SignupRole } from "@/components/auth/AgreementConsent";

/**
 * Full-screen agreements step shown right after an account is created (and to
 * anyone who hasn't accepted the current AGREEMENT_VERSION yet) — like the
 * terms screen Google shows after sign-up. The user picks artist / client,
 * accepts each required document in turn, and continues into the app.
 */
export default function WelcomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [role, setRole]         = useState<SignupRole | null>(null);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Already accepted the current version → nothing to do here
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.replace("/login"); return; }
    let cancelled = false;
    const check = () =>
      fetch(`/api/profiles?username=${encodeURIComponent(user.id)}`)
        .then(r => r.json())
        .then(({ profile }) => {
          if (cancelled) return;
          if (!profile) { setTimeout(check, 1200); return; } // ProfileSync still creating the row
          if (profile.agreement_version === AGREEMENT_VERSION) { router.replace("/feed"); return; }
          if (profile.role === "artist" || profile.role === "client") setRole(profile.role);
          setChecking(false);
        })
        .catch(() => setChecking(false));
    check();
    return () => { cancelled = true; };
  }, [isLoaded, user, router]);

  async function finish() {
    if (!user || !role || !allAccepted(role, accepted) || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/sync", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_id: user.id, role,
          agreement_version: AGREEMENT_VERSION,
          agreements_accepted_at: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not save. Please try again."); return; }
      router.replace("/feed");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  const ready = !!role && allAccepted(role, accepted);
  const firstName = user?.firstName ?? user?.primaryEmailAddress?.emailAddress?.split("@")[0] ?? "";

  return (
    <div
      className="min-h-dvh w-full flex flex-col items-center px-4 py-10 md:py-14"
      style={{
        background:
          "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(124,91,245,0.18) 0%, transparent 70%), #0d0d10",
      }}
    >
      <div className="w-full max-w-xl flex flex-col gap-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/login-image/ortists-badge.png"
            alt="ORTISTS"
            className="w-20 h-20 object-contain mb-4"
            style={{ filter: "drop-shadow(0 0 18px rgba(124,91,245,0.55))" }}
          />
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome to ORTISTS{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm mt-2 max-w-md" style={{ color: "rgba(255,255,255,0.5)" }}>
            Your account is ready. Before you continue, tell us how you&apos;ll use ORTISTS and review our agreements.
          </p>
        </div>

        {checking ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: "#7C5BF5", borderTopColor: "transparent" }} />
          </div>
        ) : (
          <>
            {/* Role */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold tracking-[0.18em] uppercase" style={{ color: "rgba(196,181,253,0.85)" }}>
                I am joining as
              </p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: "artist", label: "An artist", desc: "Showcase, sell and get hired", Icon: Brush },
                  { id: "client", label: "A client",  desc: "Hire artists and buy art",     Icon: ShoppingBag },
                ] as const).map(({ id, label, desc, Icon }) => {
                  const on = role === id;
                  return (
                    <button key={id} type="button" onClick={() => { setRole(id); setAccepted({}); }}
                      className="text-left p-4 rounded-2xl transition-all"
                      style={{
                        background: on ? "rgba(124,91,245,0.16)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${on ? "rgba(155,124,245,0.6)" : "rgba(255,255,255,0.1)"}`,
                        boxShadow: on ? "0 8px 28px rgba(124,91,245,0.25)" : "none",
                      }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5"
                        style={{ background: on ? "#7C5BF5" : "rgba(255,255,255,0.06)" }}>
                        <Icon size={17} color={on ? "#fff" : "rgba(255,255,255,0.6)"} />
                      </div>
                      <p className="text-sm font-bold text-white">{label}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Agreements, one at a time */}
            {role && <AgreementConsent role={role} accepted={accepted} onChange={setAccepted} />}

            {error && <p className="text-xs text-center" style={{ color: "#F87171" }}>{error}</p>}

            <button
              type="button"
              onClick={finish}
              disabled={!ready || saving}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", boxShadow: ready ? "0 8px 28px rgba(124,91,245,0.4)" : "none" }}
            >
              {saving ? "Saving…" : ready ? "Continue to ORTISTS" : role ? "Accept all agreements to continue" : "Choose how you'll use ORTISTS"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
