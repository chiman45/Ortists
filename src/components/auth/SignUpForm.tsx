"use client";

import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { normalizePhone } from "@/lib/phone";

/**
 * Sign-up with email + phone + password on one form.
 *
 * Clerk's prebuilt <SignUp> can't take extra fields, so this uses Clerk's
 * custom sign-up flow (v7 "signals" API: every call resolves to `{ error }`).
 * The phone is stored in `unsafeMetadata` at creation and ProfileSync writes it
 * to profiles.phone (unique per account). Login itself is unchanged — email
 * only, via Clerk's <SignIn>.
 */
const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#fff",
} as const;

type ClerkErr = { longMessage?: string; message?: string } | null;
const msg = (e: ClerkErr, fallback: string) => e?.longMessage ?? e?.message ?? fallback;

export default function SignUpForm() {
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();

  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [code, setCode]         = useState("");
  const [step, setStep]         = useState<"form" | "verify">("form");
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const working = busy || fetchStatus === "fetching";

  async function submit() {
    if (!signUp || working) return;
    setError(null);

    const { phone: normalized, valid } = normalizePhone(phone);
    if (!email.trim()) return setError("Enter your email address.");
    if (!valid)        return setError("Enter a valid phone number (10–15 digits).");
    if (password.length < 8) return setError("Password must be at least 8 characters.");

    setBusy(true);
    try {
      // Phone numbers are unique per account — check before creating the user
      const avail = await fetch(`/api/profile/phone?phone=${encodeURIComponent(normalized)}`).then(r => r.json());
      if (!avail.available) {
        setError(avail.error ?? "This phone number is already linked to another account.");
        return;
      }

      const created = await signUp.password({ emailAddress: email.trim(), password, unsafeMetadata: { phone: normalized } });
      if (created.error) { setError(msg(created.error, "Could not create your account. Please try again.")); return; }

      // Phone is our own field (profiles.phone), so Clerk must not demand one too.
      // If the dashboard still has "Phone number" required, say so plainly rather
      // than letting the sign-up stall after email verification.
      if (signUp.missingFields.includes("phone_number")) {
        setError("Sign-up is misconfigured: Clerk still requires a phone number. In the Clerk dashboard set Phone number to off/optional.");
        return;
      }

      const sent = await signUp.verifications.sendEmailCode();
      if (sent.error) { setError(msg(sent.error, "Could not send the verification code. Please try again.")); return; }

      setStep("verify");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!signUp || working) return;
    setError(null);
    setBusy(true);
    try {
      const verified = await signUp.verifications.verifyEmailCode({ code: code.trim() });
      if (verified.error) { setError(msg(verified.error, "That code didn't work. Please try again.")); return; }

      if (signUp.status === "complete") {
        const done = await signUp.finalize();
        if (done.error) { setError(msg(done.error, "Could not sign you in. Please try logging in.")); return; }
        router.push("/feed");
      } else {
        setError("Verification isn't complete yet — please check the code and try again.");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (!signUp || working) return;
    setError(null);
    const res = await signUp.sso({
      strategy: "oauth_google",
      redirectUrl: "/feed",
      redirectCallbackUrl: "/login/sso-callback?mode=signup",
    });
    if (res.error) setError(msg(res.error, "Google sign-up failed. Please try again."));
  }

  async function startOver() {
    await signUp?.reset();
    setStep("form");
    setCode("");
    setError(null);
  }

  if (step === "verify") {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-white">Check your email</h2>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            We sent a 6-digit code to <span className="text-white">{email}</span>
          </p>
        </div>
        <input
          autoFocus
          inputMode="numeric"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") verify(); }}
          placeholder="Enter code"
          className="w-full px-4 py-3 rounded-xl text-center text-lg tracking-[0.3em] outline-none"
          style={inputStyle}
        />
        {error && <p className="text-xs" style={{ color: "#F87171" }}>{error}</p>}
        <button
          onClick={verify}
          disabled={working || code.trim().length < 4}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ background: "#7C5BF5" }}
        >
          {working ? "Verifying…" : "Verify & continue"}
        </button>
        <button onClick={startOver} className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-white">Create your account</h2>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>Welcome! Please fill in the details to get started.</p>
      </div>

      <button
        onClick={google}
        disabled={working}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-85 disabled:opacity-50"
        style={inputStyle}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z" />
          <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
          <path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z" />
          <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9Z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>or</span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
      </div>

      <label className="flex flex-col gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
        Email address
        <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
        Phone number
        <input type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
        Password
        <div className="relative">
          <input type={showPw ? "text" : "password"} autoComplete="new-password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") submit(); }}
            className="w-full px-4 py-2.5 pr-16 rounded-xl text-sm outline-none" style={inputStyle} />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
      </label>

      {/* Clerk renders its bot-protection widget here when enabled */}
      <div id="clerk-captcha" />

      {error && <p className="text-xs" style={{ color: "#F87171" }}>{error}</p>}

      <button
        onClick={submit}
        disabled={working || !signUp}
        className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
        style={{ background: "#7C5BF5" }}
      >
        {working ? "Creating account…" : "Continue"}
      </button>
    </div>
  );
}
