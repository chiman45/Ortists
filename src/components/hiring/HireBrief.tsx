"use client";

import { Playfair_Display } from "next/font/google";
import { CalendarDays, ExternalLink, Frame, Maximize2, PackageCheck, Ruler, Wallet } from "lucide-react";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], display: "swap" });

// The hire form stores everything the client wrote in `project_description`:
//   brief \n\n details \n\n "Canvas size: …" \n\n "Deliverables: …" \n\n "References:\n<url>\n<url>"
// This turns that text back into a readable brief with the reference images
// shown as pictures, so the artist can read it before accepting or declining.

const IMAGE_RE = /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i;
const URL_RE   = /^https?:\/\/\S+$/i;

export interface ParsedBrief {
  text:         string[];  // what the client wrote, paragraph by paragraph
  canvas:       string | null;
  deliverables: string | null;
  images:       string[];
  links:        string[];
  notes:        string[];  // reference lines that are not links
}

export function parseBrief(description: string | null | undefined): ParsedBrief {
  const out: ParsedBrief = { text: [], canvas: null, deliverables: null, images: [], links: [], notes: [] };
  for (const part of (description ?? "").split(/\n{2,}/).map(p => p.trim()).filter(Boolean)) {
    if (/^References:/i.test(part)) {
      for (const line of part.replace(/^References:\s*/i, "").split("\n").map(l => l.trim()).filter(Boolean)) {
        if (!URL_RE.test(line)) out.notes.push(line);
        else if (IMAGE_RE.test(line)) out.images.push(line);
        else out.links.push(line);
      }
    } else if (/^Canvas size:/i.test(part)) out.canvas = part.replace(/^Canvas size:\s*/i, "");
    else if (/^Deliverables:/i.test(part)) out.deliverables = part.replace(/^Deliverables:\s*/i, "");
    else out.text.push(part);
  }
  return out;
}

/** "Square 10" × 10" (floating frame ₹700)" → size + framing as two facts. */
function splitCanvas(canvas: string): { size: string; frame: string | null } {
  const m = canvas.match(/^(.*?)\s*\((.+)\)\s*$/);
  if (!m) return { size: canvas, frame: null };
  const frame = m[2].replace(/\s*—\s*/g, ", ");
  return { size: m[1], frame: frame.charAt(0).toUpperCase() + frame.slice(1) };
}

/** "2026-12-11" → "11 Dec 2026" plus how far away it is. Free text is kept as written. */
function describeDeadline(deadline: string): { date: string; note: string | null; urgent: boolean } {
  const d = /^\d{4}-\d{2}-\d{2}/.test(deadline) ? new Date(deadline) : null;
  if (!d || isNaN(d.getTime())) return { date: deadline, note: null, urgent: false };
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  return {
    date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    note: days < 0 ? "Date has passed" : days === 0 ? "Today" : `${days} day${days === 1 ? "" : "s"} from now`,
    urgent: days <= 3,
  };
}

const LABEL = "text-[11px] font-semibold tracking-[0.16em] uppercase";

export default function HireBrief({ description, budget, deadline }: {
  description: string | null | undefined;
  budget?: number | null;
  deadline?: string | null;
}) {
  const b = parseBrief(description);
  const canvas = b.canvas ? splitCanvas(b.canvas) : null;
  const due = deadline ? describeDeadline(deadline) : null;
  const [lead, ...rest] = b.text;
  const refCount = b.images.length + b.links.length + b.notes.length;

  const facts = [
    due          ? { icon: CalendarDays, label: "Deadline",     value: due.date, note: due.note, urgent: due.urgent } : null,
    canvas       ? { icon: Ruler,        label: "Canvas size",  value: canvas.size, note: null, urgent: false } : null,
    canvas?.frame ? { icon: Frame,       label: "Framing",      value: canvas.frame, note: null, urgent: false } : null,
    b.deliverables ? { icon: PackageCheck, label: "Deliverables", value: b.deliverables, note: null, urgent: false } : null,
    budget       ? { icon: Wallet,       label: "Your budget",  value: `₹${Number(budget).toLocaleString("en-IN")}`, note: null, urgent: false } : null,
  ].filter((f): f is NonNullable<typeof f> => !!f);

  return (
    <div className="flex flex-col gap-8">

      {/* The client's own words, set like a quotation */}
      <div className="relative pl-5 md:pl-6">
        <span aria-hidden className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full" style={{ background: "linear-gradient(180deg,#7C5BF5,#361E7B)" }} />
        <p className={`${LABEL} mb-3`} style={{ color: "#9B7CF5" }}>In the client&apos;s words</p>
        {lead ? (
          <>
            <p className={`${playfair.className} text-xl md:text-2xl leading-snug whitespace-pre-wrap break-words`} style={{ color: "var(--text-1)" }}>
              {lead}
            </p>
            {rest.map((t, i) => (
              <p key={i} className="text-[15px] leading-relaxed whitespace-pre-wrap break-words mt-3" style={{ color: "var(--text-3)" }}>{t}</p>
            ))}
          </>
        ) : (
          <p className={`${playfair.className} italic text-lg`} style={{ color: "var(--text-4)" }}>No written description was added.</p>
        )}
      </div>

      {/* The practical details, one per row */}
      {facts.length > 0 && (
        <dl className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
          {facts.map((f, i) => (
            <div key={f.label} className="flex items-start gap-3.5 px-4 md:px-5 py-3.5" style={{ borderTop: i ? "1px solid var(--border)" : "none" }}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(124,91,245,0.12)" }}>
                <f.icon size={15} style={{ color: "#9B7CF5" }} />
              </span>
              <dt className="w-28 shrink-0 text-sm pt-1.5" style={{ color: "var(--text-4)" }}>{f.label}</dt>
              <dd className="flex-1 min-w-0 text-[15px] font-semibold pt-1 break-words" style={{ color: "var(--text-1)" }}>
                {f.value}
                {f.note && (
                  <span className="block text-xs font-medium mt-0.5" style={{ color: f.urgent ? "#F87171" : "var(--text-5)" }}>{f.note}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {/* Reference material */}
      {refCount > 0 && (
        <div>
          <p className={`${LABEL} mb-3`} style={{ color: "var(--text-4)" }}>
            Reference{refCount > 1 ? "s" : ""} from the client
          </p>

          {b.images.length > 0 && (
            <div className={b.images.length === 1 ? "" : "grid grid-cols-2 gap-3"}>
              {b.images.map((src, i) => (
                <a key={src} href={src} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  className="group relative block overflow-hidden rounded-2xl"
                  style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-card)", boxShadow: "0 10px 34px var(--shadow)" }}
                  aria-label={`Open reference image ${i + 1} at full size`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Reference ${i + 1}`} loading="lazy"
                    className={`w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${b.images.length === 1 ? "max-h-[420px]" : "h-44 md:h-52"}`} />
                  <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white"
                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
                    <Maximize2 size={11} /> View full size
                  </span>
                </a>
              ))}
            </div>
          )}

          {b.links.map(l => (
            <a key={l} href={l} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="flex items-center gap-2 text-sm mt-3 break-all underline underline-offset-4" style={{ color: "#9B7CF5" }}>
              <ExternalLink size={14} className="shrink-0" /> {l}
            </a>
          ))}
          {b.notes.map(n => (
            <p key={n} className="text-sm mt-3 break-words" style={{ color: "var(--text-3)" }}>{n}</p>
          ))}
        </div>
      )}
    </div>
  );
}
