import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const ROWS = [
  { id: "#202395", customer: "Alex Morgan",  date: "1 Jan 24", price: "$1,200", ok: true,  seed: "commission-portrait"  },
  { id: "#202396", customer: "Jamie Lee",    date: "2 Jan 24", price: "$850",   ok: false, seed: "commission-abstract"  },
  { id: "#202397", customer: "Sam Rivera",   date: "3 Jan 24", price: "$2,100", ok: true,  seed: "commission-mural"     },
  { id: "#202398", customer: "Casey Brooks", date: "4 Jan 24", price: "$680",   ok: true,  seed: "commission-digital"   },
  { id: "#202399", customer: "Riley Chen",   date: "6 Jan 24", price: "$1,540", ok: false, seed: "commission-landscape" },
];

const GLASS: React.CSSProperties = {
  background: "var(--bg-card)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--border-card)",
  boxShadow: "0 4px 24px var(--shadow)",
};

export default function RecentCommissions() {
  return (
    <div className="rounded-2xl p-5" style={GLASS}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold" style={{ color: "var(--text-1)" }}>Recent Commissions</h3>
        <button className="flex items-center gap-1 text-sm font-semibold text-[#7C5BF5] hover:text-[#9B7CF5] transition-colors">
          View All <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid gap-3 text-xs font-semibold px-1 mb-3"
        style={{ gridTemplateColumns: "40px 1fr 1.4fr 1fr 0.8fr 0.9fr", color: "var(--text-6)" }}>
        <span>Art</span><span>Order ID</span><span>Customer</span>
        <span>Date</span><span>Price</span><span>Status</span>
      </div>

      <div className="space-y-0.5">
        {ROWS.map(r => (
          <div
            key={r.id}
            className="grid gap-3 items-center py-2.5 px-1 rounded-xl transition-colors cursor-pointer"
            style={{ gridTemplateColumns: "40px 1fr 1.4fr 1fr 0.8fr 0.9fr", borderBottom: "1px solid var(--bg-card)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
              <Image src={`https://picsum.photos/seed/${r.seed}/60/60`} alt={r.customer} width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-medium" style={{ color: "var(--text-3)" }}>{r.id}</span>
            <span className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>{r.customer}</span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-5)" }}>
              <CalendarDays size={11} />{r.date}
            </span>
            <span className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{r.price}</span>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full text-center"
              style={r.ok
                ? { background: "rgba(52,211,153,0.12)", color: "#34d399" }
                : { background: "rgba(251,191,36,0.12)", color: "#fbbf24" }
              }
            >{r.ok ? "Complete" : "Pending"}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <span className="text-xs" style={{ color: "var(--text-6)" }}>
          Show <strong style={{ color: "var(--text-3)" }}>5</strong> from 12
        </span>
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ background: "var(--bg-subtle)", color: "var(--text-5)" }}>
            <ChevronLeft size={14} />
          </button>
          {[1,2,3].map(p => (
            <button key={p} className="w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors"
              style={p === 2 ? { background: "#361E7B", color: "white" } : { color: "var(--text-5)" }}>
              {p}
            </button>
          ))}
          <span className="text-xs px-1" style={{ color: "var(--text-6)" }}>...</span>
          <button className="w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors"
            style={{ color: "var(--text-5)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>12</button>
          <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ background: "var(--bg-subtle)", color: "var(--text-5)" }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
