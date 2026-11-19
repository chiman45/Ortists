"use client";

import { ExternalLink } from "lucide-react";

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

const LABEL = "text-[10px] font-bold tracking-widest uppercase mb-1.5";

export default function HireBrief({ description, budget, deadline }: {
  description: string | null | undefined;
  budget?: number | null;
  deadline?: string | null;
}) {
  const b = parseBrief(description);
  const empty = !b.text.length && !b.canvas && !b.deliverables && !b.images.length && !b.links.length && !b.notes.length;

  const facts = [
    budget ? { label: "Budget", value: `₹${Number(budget).toLocaleString("en-IN")}` } : null,
    deadline ? { label: "Deadline", value: deadline } : null,
    b.canvas ? { label: "Canvas", value: b.canvas } : null,
  ].filter((f): f is { label: string; value: string } => !!f);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className={LABEL} style={{ color: "var(--text-5)" }}>What the client wants</p>
        {b.text.length
          ? b.text.map((t, i) => (
              <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap break-words mt-1.5 first:mt-0" style={{ color: "var(--text-2)" }}>{t}</p>
            ))
          : <p className="text-sm" style={{ color: "var(--text-4)" }}>{empty ? "The client did not write a description." : "No written description."}</p>}
      </div>

      {facts.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {facts.map(f => (
            <div key={f.label} className="rounded-xl px-3.5 py-2.5" style={{ background: "var(--bg-subtle)" }}>
              <dt className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-5)" }}>{f.label}</dt>
              <dd className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-1)" }}>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {b.deliverables && (
        <div>
          <p className={LABEL} style={{ color: "var(--text-5)" }}>Deliverables</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: "var(--text-2)" }}>{b.deliverables}</p>
        </div>
      )}

      {(b.images.length > 0 || b.links.length > 0 || b.notes.length > 0) && (
        <div>
          <p className={LABEL} style={{ color: "var(--text-5)" }}>
            Reference{b.images.length + b.links.length + b.notes.length > 1 ? "s" : ""} from the client
          </p>
          {b.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {b.images.map((src, i) => (
                <a key={src} href={src} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  className="block overflow-hidden rounded-xl" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
                  aria-label={`Open reference image ${i + 1} at full size`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Reference ${i + 1}`} loading="lazy" className="w-full h-36 sm:h-40 object-cover transition-transform duration-300 hover:scale-105" />
                </a>
              ))}
            </div>
          )}
          {b.links.map(l => (
            <a key={l} href={l} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 text-sm mt-2 break-all underline underline-offset-4" style={{ color: "#9B7CF5" }}>
              <ExternalLink size={13} className="shrink-0" /> {l}
            </a>
          ))}
          {b.notes.map(n => (
            <p key={n} className="text-sm mt-2 break-words" style={{ color: "var(--text-3)" }}>{n}</p>
          ))}
        </div>
      )}
    </div>
  );
}
