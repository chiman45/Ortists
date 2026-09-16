"use client";

import { Loader2, Music, Palette, Plus, Smile, Trash2, Type, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

interface TextLayer { id: string; kind: "text"; text: string; x: number; y: number; color: string; size: number }
interface StickerLayer { id: string; kind: "sticker"; emoji: string; x: number; y: number; size: number }
type Layer = TextLayer | StickerLayer;

const FILTERS: { name: string; css: string }[] = [
  { name: "Normal",  css: "none" },
  { name: "Warm",    css: "saturate(1.3) sepia(0.18) brightness(1.05)" },
  { name: "Cool",    css: "saturate(1.15) hue-rotate(-10deg) brightness(1.02) contrast(1.05)" },
  { name: "Mono",    css: "grayscale(1) contrast(1.1)" },
  { name: "Vivid",   css: "saturate(1.6) contrast(1.15)" },
  { name: "Fade",    css: "saturate(0.7) brightness(1.1) contrast(0.9)" },
  { name: "Noir",    css: "grayscale(1) contrast(1.4) brightness(0.9)" },
];

const STICKERS = ["🔥", "✨", "❤️", "🎨", "🖌️", "😍", "👏", "🌟", "💯", "🎉", "😂", "👀"];
const TEXT_COLORS = ["#ffffff", "#000000", "#F59E0B", "#F43F5E", "#7C5BF5", "#10B981"];

const TRACKS = [
  { title: "Golden Hour", artist: "Ambient Loop" },
  { title: "Studio Vibes", artist: "Lo-fi Beats" },
  { title: "Chasing Light", artist: "Soft Synths" },
  { title: "Night Sketch", artist: "Mellow Keys" },
  { title: "Paint & Coffee", artist: "Acoustic Chill" },
];

interface Props {
  onClose: () => void;
  onPublish: (file: Blob) => Promise<void>;
}

export default function StoryCreativeEditor({ onClose, onPublish }: Props) {
  const [imgUrl, setImgUrl]   = useState<string | null>(null);
  const [filter, setFilter]   = useState(FILTERS[0]);
  const [layers, setLayers]   = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool]       = useState<"filters" | "text" | "stickers" | "music" | null>(null);
  const [track, setTrack]     = useState<typeof TRACKS[number] | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftColor, setDraftColor] = useState(TEXT_COLORS[0]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fileRef  = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragId   = useRef<string | null>(null);
  const nextId   = useRef(0);

  const selected = useMemo(() => layers.find(l => l.id === selectedId) ?? null, [layers, selectedId]);

  function pickPhoto(file: File) {
    if (!file.type.startsWith("image/")) return;
    setImgUrl(URL.createObjectURL(file));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) pickPhoto(file);
  }

  function addText() {
    if (!draftText.trim()) { setTool("text"); return; }
    const layer: TextLayer = {
      id: `t${nextId.current++}`, kind: "text", text: draftText.trim(),
      x: 50, y: 50, color: draftColor, size: 7,
    };
    setLayers(l => [...l, layer]);
    setDraftText("");
    setSelectedId(layer.id);
  }

  function addSticker(emoji: string) {
    const layer: StickerLayer = { id: `s${nextId.current++}`, kind: "sticker", emoji, x: 50, y: 40, size: 12 };
    setLayers(l => [...l, layer]);
    setSelectedId(layer.id);
  }

  function removeLayer(id: string) {
    setLayers(l => l.filter(x => x.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  // ── Drag to reposition ──────────────────────────────────────────
  function startDrag(id: string) {
    setSelectedId(id);
    dragId.current = id;
  }
  function onStagePointerMove(e: React.PointerEvent) {
    if (!dragId.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.min(96, Math.max(4, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(96, Math.max(4, ((e.clientY - rect.top) / rect.height) * 100));
    setLayers(ls => ls.map(l => l.id === dragId.current ? { ...l, x, y } : l));
  }
  function endDrag() { dragId.current = null; }

  // ── Composite everything onto a canvas and hand back a Blob ─────
  async function handlePublish() {
    if (!imgUrl) return;
    setPublishing(true);
    setError(null);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload  = () => resolve();
        img.onerror = () => reject(new Error("Could not load image"));
        img.src = imgUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width  = img.naturalWidth  || 1080;
      canvas.height = img.naturalHeight || 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      ctx.filter = filter.css;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.filter = "none";

      for (const layer of layers) {
        const px = (layer.x / 100) * canvas.width;
        const py = (layer.y / 100) * canvas.height;
        if (layer.kind === "text") {
          const fontPx = (layer.size / 100) * canvas.width * 0.16;
          ctx.font = `bold ${fontPx}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = fontPx * 0.12;
          ctx.strokeStyle = "rgba(0,0,0,0.45)";
          ctx.strokeText(layer.text, px, py);
          ctx.fillStyle = layer.color;
          ctx.fillText(layer.text, px, py);
        } else {
          const fontPx = (layer.size / 100) * canvas.width * 0.16;
          ctx.font = `${fontPx}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(layer.emoji, px, py);
        }
      }

      if (track) {
        const padX = canvas.width * 0.04;
        const barH = canvas.height * 0.045;
        const barY = canvas.height * 0.92;
        const label = `🎵 ${track.title} · ${track.artist}`;
        ctx.font = `${Math.round(canvas.width * 0.032)}px sans-serif`;
        const textW = ctx.measureText(label).width;
        const pillW = textW + padX * 2;
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        roundRect(ctx, canvas.width / 2 - pillW / 2, barY, pillW, barH, barH / 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, canvas.width / 2, barY + barH / 2);
      }

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("Could not export image");
      await onPublish(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPublishing(false);
    }
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 md:p-4" style={{ background: "rgba(0,0,0,0.92)" }}>
      <div
        className="w-full flex flex-col rounded-2xl overflow-hidden"
        style={{ width: "min(420px, 100vw)", height: "min(90vh, 860px)", background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
            <X size={15} color="#fff" />
          </button>
          <p className="text-sm font-bold text-white">Create Story</p>
          {imgUrl ? (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="px-4 py-1.5 rounded-full text-xs font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center gap-1.5"
              style={{ background: "linear-gradient(135deg,#361E7B,#7C5BF5)" }}
            >
              {publishing && <Loader2 size={12} className="animate-spin" />}
              {publishing ? "Sharing…" : "Share"}
            </button>
          ) : <div className="w-14" />}
        </div>

        {/* Stage */}
        <div className="flex-1 relative overflow-hidden" style={{ background: "#000" }}>
          {!imgUrl ? (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={onDrop}
              className="w-full h-full flex flex-col items-center justify-center cursor-pointer gap-3"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(124,91,245,0.15)" }}>
                <Upload size={24} style={{ color: "#9B7CF5" }} />
              </div>
              <p className="text-sm font-semibold text-white">Upload a photo</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>or drag and drop</p>
            </div>
          ) : (
            <div
              ref={stageRef}
              className="w-full h-full relative select-none"
              onPointerMove={onStagePointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              onClick={() => setSelectedId(null)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: filter.css }} draggable={false} />

              {layers.map(layer => (
                <div
                  key={layer.id}
                  onClick={e => { e.stopPropagation(); setSelectedId(layer.id); }}
                  onPointerDown={e => { e.stopPropagation(); startDrag(layer.id); }}
                  className="absolute cursor-grab active:cursor-grabbing"
                  style={{
                    left: `${layer.x}%`, top: `${layer.y}%`, transform: "translate(-50%, -50%)",
                    outline: selectedId === layer.id ? "2px dashed rgba(255,255,255,0.7)" : "none",
                    outlineOffset: 6,
                    touchAction: "none",
                  }}
                >
                  {layer.kind === "text" ? (
                    <span
                      style={{
                        color: layer.color, fontWeight: 700, fontSize: `${layer.size * 2.6}px`,
                        textShadow: "0 1px 6px rgba(0,0,0,0.55)", whiteSpace: "nowrap",
                      }}
                    >
                      {layer.text}
                    </span>
                  ) : (
                    <span style={{ fontSize: `${layer.size * 2.6}px`, lineHeight: 1 }}>{layer.emoji}</span>
                  )}
                </div>
              ))}

              {track && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                  style={{ bottom: "6%", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
                >
                  <Music size={12} /> {track.title} · {track.artist}
                </div>
              )}

              {selected && (
                <button
                  onClick={e => { e.stopPropagation(); removeLayer(selected.id); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(239,68,68,0.85)" }}
                >
                  <Trash2 size={14} color="#fff" />
                </button>
              )}
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { if (e.target.files?.[0]) pickPhoto(e.target.files[0]); }} />
        </div>

        {/* Tool panel */}
        {imgUrl && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {tool === "filters" && (
              <div className="flex gap-2 overflow-x-auto px-3 py-3" style={{ scrollbarWidth: "none" }}>
                {FILTERS.map(f => (
                  <button
                    key={f.name}
                    onClick={() => setFilter(f)}
                    className="shrink-0 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-12 h-12 rounded-xl overflow-hidden"
                      style={{ border: filter.name === f.name ? "2px solid #7C5BF5" : "2px solid transparent" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" style={{ filter: f.css }} />
                    </div>
                    <span className="text-[10px]" style={{ color: filter.name === f.name ? "#fff" : "rgba(255,255,255,0.5)" }}>{f.name}</span>
                  </button>
                ))}
              </div>
            )}

            {tool === "text" && (
              <div className="flex flex-col gap-2 px-3 py-3">
                <div className="flex gap-2">
                  <input
                    value={draftText}
                    onChange={e => setDraftText(e.target.value)}
                    placeholder="Type something…"
                    autoFocus
                    onKeyDown={e => { if (e.key === "Enter") addText(); }}
                    className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}
                  />
                  <button onClick={addText} className="px-4 rounded-xl text-xs font-bold text-white" style={{ background: "#7C5BF5" }}>Add</button>
                </div>
                <div className="flex gap-2">
                  {TEXT_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setDraftColor(c)}
                      className="w-6 h-6 rounded-full"
                      style={{ background: c, border: draftColor === c ? "2px solid #7C5BF5" : "1px solid rgba(255,255,255,0.3)" }}
                    />
                  ))}
                </div>
              </div>
            )}

            {tool === "stickers" && (
              <div className="grid grid-cols-6 gap-2 px-3 py-3">
                {STICKERS.map(emoji => (
                  <button key={emoji} onClick={() => addSticker(emoji)} className="text-2xl py-1.5 rounded-xl transition-opacity hover:opacity-70">
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {tool === "music" && (
              <div className="flex flex-col gap-1.5 px-3 py-3 max-h-40 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                {TRACKS.map(t => (
                  <button
                    key={t.title}
                    onClick={() => setTrack(track?.title === t.title ? null : t)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors"
                    style={{ background: track?.title === t.title ? "rgba(124,91,245,0.2)" : "rgba(255,255,255,0.05)" }}
                  >
                    <Music size={13} style={{ color: track?.title === t.title ? "#9B7CF5" : "rgba(255,255,255,0.5)" }} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{t.title}</p>
                      <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{t.artist}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Tool selector row */}
            <div className="flex items-center justify-around px-2 py-2.5" style={{ borderTop: tool ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
              {[
                { id: "filters",  Icon: Palette, label: "Filters"  },
                { id: "text",     Icon: Type,    label: "Text"     },
                { id: "stickers", Icon: Smile,   label: "Stickers" },
                { id: "music",    Icon: Music,   label: "Music"    },
              ].map(({ id, Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setTool(t => t === id ? null : (id as typeof tool))}
                  className="flex flex-col items-center gap-1 px-2 py-1"
                >
                  <Icon size={18} color={tool === id ? "#9B7CF5" : "rgba(255,255,255,0.6)"} />
                  <span className="text-[9px] font-medium" style={{ color: tool === id ? "#9B7CF5" : "rgba(255,255,255,0.5)" }}>{label}</span>
                </button>
              ))}
              <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-1 px-2 py-1">
                <Plus size={18} color="rgba(255,255,255,0.6)" />
                <span className="text-[9px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Replace</span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-center pb-2" style={{ color: "#EF4444" }}>{error}</p>
        )}
      </div>
    </div>
  );
}
