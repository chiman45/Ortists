"use client";

import PublicNav from "@/components/layout/PublicNav";
import { useEffect, useRef, useState } from "react";
import { Circle } from "lucide-react";

interface Section {
  title: string;
  content?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  sections?: Section[];
  children?: React.ReactNode;
}

export default function LegalPage({ title, subtitle, lastUpdated, sections, children }: Props) {
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sections?.length) return;
    const observer = new IntersectionObserver(
      entries => {
        let topEntry: IntersectionObserverEntry | null = null;
        for (const e of entries) {
          if (e.isIntersecting) {
            if (!topEntry || e.boundingClientRect.top < topEntry.boundingClientRect.top) {
              topEntry = e;
            }
          }
        }
        if (topEntry) {
          const idx = sectionRefs.current.findIndex(r => r === topEntry!.target);
          if (idx !== -1) setActiveSection(idx);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    sectionRefs.current.forEach(r => r && observer.observe(r));
    return () => observer.disconnect();
  }, [sections]);

  function scrollTo(idx: number) {
    sectionRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const hasToc = sections && sections.length > 0;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .legal-fade { animation: fadeUp 0.55s ease both; }
        .toc-item { transition: color 0.2s, padding-left 0.2s; }
        .toc-item.active { color: #9B7CF5 !important; padding-left: 10px; }
        .section-card { transition: border-color 0.3s; }
        .section-card:hover { border-color: rgba(155,124,245,0.22) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(155,124,245,0.25); border-radius: 4px; }
      `}</style>

      <div style={{ background: "#0A0A0F", minHeight: "100vh", color: "#fff" }}>
        <PublicNav />

        {/* Hero band */}
        <div
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0F0B1F 0%, #130D2A 50%, #0A0A0F 100%)",
            borderBottom: "1px solid rgba(155,124,245,0.12)",
            paddingTop: "100px",
            paddingBottom: "52px",
          }}
        >
          {/* decorative blobs */}
          <div style={{
            position: "absolute", top: "-60px", left: "-80px",
            width: "400px", height: "400px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(54,30,123,0.35) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: "-80px", right: "-40px",
            width: "300px", height: "300px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,91,245,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div className="relative max-w-6xl mx-auto px-6">
            {/* pill */}
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5 text-[11px] font-semibold tracking-widest uppercase"
              style={{ background: "rgba(155,124,245,0.1)", border: "1px solid rgba(155,124,245,0.25)", color: "#9B7CF5" }}>
              <Circle size={6} fill="#9B7CF5" stroke="none" /> Legal
            </div>

            <h1
              className="text-4xl md:text-5xl font-black tracking-tight mb-3 legal-fade"
              style={{ letterSpacing: "-0.025em", lineHeight: 1.1 }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-base mb-4 legal-fade" style={{ color: "#8B8B95", animationDelay: "0.08s" }}>
                {subtitle}
              </p>
            )}
            {lastUpdated && (
              <p className="text-xs legal-fade" style={{ color: "rgba(255,255,255,0.25)", animationDelay: "0.14s" }}>
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          {hasToc ? (
            <div className="flex gap-10 items-start">
              {/* Sticky TOC */}
              <aside
                className="hidden lg:block shrink-0"
                style={{ width: "220px", position: "sticky", top: "88px", maxHeight: "calc(100vh - 110px)", overflowY: "auto" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Contents
                </p>
                <nav className="space-y-1">
                  {sections!.map((s, i) => {
                    const label = s.title.replace(/^\d+\.\s*/, "");
                    return (
                      <button
                        key={i}
                        onClick={() => scrollTo(i)}
                        className={`toc-item block w-full text-left text-[12px] leading-snug py-1.5 rounded ${i === activeSection ? "active" : ""}`}
                        style={{ color: i === activeSection ? "#9B7CF5" : "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer" }}
                      >
                        <span className="mr-1.5 font-mono" style={{ color: "rgba(155,124,245,0.45)", fontSize: "10px" }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {label}
                      </button>
                    );
                  })}
                </nav>
              </aside>

              {/* Main content */}
              <div ref={contentRef} className="flex-1 min-w-0 space-y-4">
                {sections!.map((s, i) => (
                  <div
                    key={i}
                    ref={el => { sectionRefs.current[i] = el; }}
                    className="section-card rounded-2xl p-7"
                    style={{
                      background: i === activeSection
                        ? "rgba(54,30,123,0.12)"
                        : "rgba(255,255,255,0.025)",
                      border: i === activeSection
                        ? "1px solid rgba(155,124,245,0.28)"
                        : "1px solid rgba(255,255,255,0.055)",
                      transition: "background 0.35s, border-color 0.35s",
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className="shrink-0 text-[11px] font-mono font-bold mt-0.5 rounded-lg px-2 py-1"
                        style={{ background: "rgba(155,124,245,0.12)", color: "#9B7CF5" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-[15px] font-bold mb-3" style={{ color: "#fff" }}>
                          {s.title.replace(/^\d+\.\s*/, "")}
                        </h2>
                        {s.content && (
                          <p className="text-[13px] leading-[1.95] whitespace-pre-line" style={{ color: "#8B8B95" }}>
                            {s.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Fallback for children-based pages (contact, help) */
            <div className="max-w-2xl mx-auto">{children}</div>
          )}
        </div>

        {/* Footer strip */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} className="py-8">
          <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.18)" }}>
            © {new Date().getFullYear()} ORTISTS · All rights reserved
          </p>
        </div>
      </div>
    </>
  );
}
