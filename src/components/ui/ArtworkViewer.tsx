"use client";

import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";

interface Props { src: string; alt: string; onClose: () => void; }

export default function ArtworkViewer({ src, alt, onClose }: Props) {
  const [scale, setScale]   = useState(1);
  const [pos, setPos]       = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);

  const lastMouse   = useRef({ x: 0, y: 0 });
  const pinchDist   = useRef<number | null>(null);
  const isPanning   = useRef(false);

  // Escape key + body scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function applyZoom(delta: number) {
    setScale(prev => {
      const next = Math.min(8, Math.max(1, prev + delta));
      if (next <= 1) setPos({ x: 0, y: 0 });
      return next;
    });
  }

  // ── Wheel zoom ──────────────────────────────────────────────────────────────
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    applyZoom(-e.deltaY * 0.004);
  }

  // ── Mouse drag ──────────────────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    if (scale <= 1) return;
    isPanning.current = true;
    setPanning(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPos(p => ({ x: p.x + dx, y: p.y + dy }));
  }
  function onMouseUp() { isPanning.current = false; setPanning(false); }

  // ── Touch: pinch + pan ──────────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDist.current = Math.hypot(dx, dy);
    } else if (e.touches.length === 1) {
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (pinchDist.current !== null) {
        applyZoom((dist - pinchDist.current) * 0.012);
      }
      pinchDist.current = dist;
    } else if (e.touches.length === 1 && scale > 1) {
      const dx = e.touches[0].clientX - lastMouse.current.x;
      const dy = e.touches[0].clientY - lastMouse.current.y;
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setPos(p => ({ x: p.x + dx, y: p.y + dy }));
    }
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (e.touches.length < 2) pinchDist.current = null;
  }

  // Block right-click save anywhere in the viewer
  const blockCtx = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.96)", backdropFilter: "blur(24px)" }}
      onContextMenu={blockCtx}
    >
      {/* Controls — top-right */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <button
          onClick={() => applyZoom(-0.5)}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
          title="Zoom out"
        >
          <ZoomOut size={15} color="#fff" />
        </button>
        <button
          onClick={() => applyZoom(0.5)}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
          title="Zoom in"
        >
          <ZoomIn size={15} color="#fff" />
        </button>
        {scale > 1 && (
          <button
            onClick={() => { setScale(1); setPos({ x: 0, y: 0 }); }}
            className="h-9 px-3 rounded-full flex items-center justify-center transition-opacity hover:opacity-70 text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
            title="Reset zoom"
          >
            Reset
          </button>
        )}
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
          title="Close (Esc)"
        >
          <X size={16} color="#fff" />
        </button>
      </div>

      {/* Zoom level pill */}
      {scale > 1 && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium px-3 py-1.5 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)", backdropFilter: "blur(8px)" }}
        >
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Hint */}
      {scale <= 1 && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium px-3 py-1.5 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", backdropFilter: "blur(8px)" }}
        >
          Scroll or pinch to zoom
        </div>
      )}

      {/* Image stage */}
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden select-none"
        style={{ cursor: scale > 1 ? (panning ? "grabbing" : "grab") : "zoom-in" }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onContextMenu={blockCtx}
      >
        {/* Wrapper moves with zoom/pan. Overlay sits on top so the browser
            never sees an <img> under the cursor — eliminates "Save Image As". */}
        <div
          style={{
            position: "relative",
            display: "inline-block",
            maxWidth: "92vw",
            maxHeight: "92vh",
            transform: `scale(${scale}) translate(${pos.x / scale}px, ${pos.y / scale}px)`,
            transformOrigin: "center center",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            onDragStart={e => e.preventDefault()}
            style={{
              display: "block",
              maxWidth: "92vw",
              maxHeight: "92vh",
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
          {/* Transparent shield — browser hits this div, not the img */}
          <div
            style={{ position: "absolute", inset: 0, zIndex: 1 }}
            onContextMenu={blockCtx}
          />
        </div>
      </div>
    </div>
  );
}
