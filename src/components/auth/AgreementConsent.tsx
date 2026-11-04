"use client";

import { Check, ExternalLink, FileText, ShieldCheck } from "lucide-react";
import {
  AGREEMENTS, AGREEMENT_ROUTES, ARTIST_ACKNOWLEDGEMENTS, REQUIRED_AGREEMENTS,
} from "@/lib/agreements";

export type SignupRole = "artist" | "client";

/**
 * Sign-up consent, shown as steps: one agreement at a time, in order. Each
 * shows its full text (artists also see the 10 acknowledgement points from
 * Artist Agreement §18 on that step); accepting it reveals the next.
 */
export default function AgreementConsent({
  role, accepted, onChange,
}: {
  role: SignupRole;
  accepted: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
}) {
  const docs = REQUIRED_AGREEMENTS[role];
  const done = docs.filter(k => accepted[k]).length;
  const complete = done === docs.length;
  // Shown one at a time, in order: the first document not yet accepted
  const current = docs.find(k => !accepted[k]) ?? null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: "linear-gradient(160deg, rgba(54,30,123,0.35) 0%, rgba(20,14,40,0.9) 45%, rgba(12,10,20,0.95) 100%)",
        border: "1px solid rgba(155,124,245,0.28)",
        boxShadow: "0 12px 40px rgba(54,30,123,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* soft glow */}
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(124,91,245,0.35), transparent 70%)" }} />

      {/* Header — logo + title + progress */}
      <div className="relative flex items-center gap-3 px-4 pt-4 pb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login-image/ortists-badge.png"
          alt="ORTISTS"
          className="w-11 h-11 object-contain shrink-0"
          style={{ filter: "drop-shadow(0 0 10px rgba(124,91,245,0.55))" }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "#C4B5FD" }}>
            ORTISTS {role === "artist" ? "Artist" : "Client"} Agreement
          </p>
          <p className="text-[13px] font-semibold text-white leading-tight mt-0.5">
            {role === "artist" ? "Before you start creating with us" : "Before you start hiring & buying"}
          </p>
        </div>
        <div
          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors"
          style={{
            background: complete ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${complete ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.1)"}`,
            color: complete ? "#34D399" : "rgba(255,255,255,0.6)",
          }}
        >
          {complete ? <ShieldCheck size={12} /> : null}
          {done}/{docs.length}
        </div>
      </div>

      {/* progress bar */}
      <div className="relative mx-4 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(done / docs.length) * 100}%`, background: complete ? "#10B981" : "linear-gradient(90deg,#7C5BF5,#C4B5FD)" }} />
      </div>

      <div className="relative flex flex-col gap-3 p-4">
        {/* Already accepted — collapsed, tap to read again */}
        {docs.filter(k => accepted[k]).map(key => (
          <div key={key} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#10B981" }}>
              <Check size={12} color="#fff" strokeWidth={3} />
            </span>
            <span className="flex-1 min-w-0 text-[12.5px] font-semibold text-white truncate">{AGREEMENTS[key].title}</span>
            <span className="text-[11px] font-semibold" style={{ color: "#34D399" }}>Accepted</span>
            <a href={AGREEMENT_ROUTES[key]} target="_blank" rel="noopener noreferrer" title="Open full document"
              className="shrink-0 transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.45)" }}>
              <ExternalLink size={13} />
            </a>
          </div>
        ))}

        {/* Current step — one agreement at a time */}
        {current && (() => {
          const doc = AGREEMENTS[current];
          const step = docs.indexOf(current) + 1;
          return (
            <div key={current} className="rounded-xl"
              style={{ background: "rgba(0,0,0,0.28)", border: "1px solid rgba(155,124,245,0.35)" }}>
              <div className="flex items-center gap-3 px-3.5 pt-3.5 pb-3">
                <div className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,91,245,0.18)" }}>
                  <FileText size={16} style={{ color: "#C4B5FD" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: "rgba(196,181,253,0.8)" }}>
                    Step {step} of {docs.length}
                  </p>
                  <p className="text-[14px] font-bold text-white leading-tight">{doc.title}</p>
                </div>
                <a href={AGREEMENT_ROUTES[current]} target="_blank" rel="noopener noreferrer" title="Open full document"
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)" }}>
                  <ExternalLink size={13} />
                </a>
              </div>

              {/* Artist Agreement step: the 10 acknowledgement points */}
              {role === "artist" && current === "artistAgreement" && (
                <div className="mx-3.5 mb-3 rounded-lg p-3" style={{ background: "rgba(124,91,245,0.08)", border: "1px solid rgba(124,91,245,0.2)" }}>
                  <p className="text-[12px] font-bold mb-2.5" style={{ color: "rgba(255,255,255,0.85)" }}>
                    By joining as an artist, you confirm that:
                  </p>
                  <ol className="grid gap-2">
                    {ARTIST_ACKNOWLEDGEMENTS.map((p, i) => (
                      <li key={p} className="flex items-start gap-2.5">
                        <span className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold"
                          style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", color: "#fff" }}>
                          {i + 1}
                        </span>
                        <span className="text-[12px] leading-snug pt-0.5" style={{ color: "rgba(255,255,255,0.68)" }}>{p}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Full document text */}
              <div className="mx-3.5 max-h-60 overflow-y-auto rounded-lg p-3.5 flex flex-col gap-3"
                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", scrollbarWidth: "thin" }}>
                {doc.sections.map(s => (
                  <div key={s.title}>
                    <p className="text-[12px] font-bold mb-1" style={{ color: "#C4B5FD" }}>{s.title}</p>
                    <p className="text-[11.5px] leading-relaxed whitespace-pre-line" style={{ color: "rgba(255,255,255,0.6)" }}>{s.content}</p>
                  </div>
                ))}
              </div>

              <div className="p-3.5">
                <button
                  type="button"
                  onClick={() => onChange({ ...accepted, [current]: true })}
                  className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99]"
                  style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)", boxShadow: "0 6px 20px rgba(124,91,245,0.35)" }}
                >
                  <Check size={15} strokeWidth={3} />
                  I have read and agree
                </button>
              </div>
            </div>
          );
        })()}

        {complete && (
          <p className="flex items-center justify-center gap-1.5 text-[12px] font-semibold py-1" style={{ color: "#34D399" }}>
            <ShieldCheck size={14} /> All agreements accepted
          </p>
        )}
      </div>
    </div>
  );
}

export const allAccepted = (role: SignupRole, accepted: Record<string, boolean>) =>
  REQUIRED_AGREEMENTS[role].every(k => accepted[k]);
