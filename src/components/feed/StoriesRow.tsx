import { mockDesigners } from "@/lib/mockData";
import { Play, Plus } from "lucide-react";
import StoryCircle from "./StoryCircle";

export default function StoriesRow() {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>Stories</h2>
        <button
          className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--text-5)" }}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "var(--bg-subtle)" }}>
            <Play size={10} fill="currentColor" className="ml-0.5" />
          </div>
          Watch all
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <button className="flex flex-col items-center gap-2 shrink-0 group">
          <div
            className="w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center transition-all"
            style={{ borderColor: "var(--border-card)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#7C5BF5"; e.currentTarget.style.background = "rgba(124,91,245,0.10)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-card)"; e.currentTarget.style.background = "transparent"; }}
          >
            <Plus size={20} style={{ color: "var(--text-5)" }} />
          </div>
          <span className="text-[10px] font-medium" style={{ color: "var(--text-5)" }}>Add</span>
        </button>

        {mockDesigners.map(d => <StoryCircle key={d.id} designer={d} />)}
      </div>
    </section>
  );
}
