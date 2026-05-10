import { MoreHorizontal } from "lucide-react";

const LEGEND = [
  { label: "Digital Art",  amount: "$12,450", color: "#7C5BF5" },
  { label: "Illustration", amount: "$8,320",  color: "#F5C842" },
  { label: "Photography",  amount: "$4,120",  color: "#F5814A" },
];

const GLASS: React.CSSProperties = {
  background: "var(--bg-card)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--border-card)",
  boxShadow: "0 4px 24px var(--shadow)",
};

export default function CategoryBubbles() {
  return (
    <div className="rounded-2xl p-5" style={GLASS}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold" style={{ color: "var(--text-1)" }}>Top Categories</h3>
        <button style={{ color: "var(--text-6)" }} className="hover:opacity-70 transition-opacity">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="relative" style={{ height: 180 }}>
        <div
          className="absolute flex items-center justify-center rounded-full text-white font-bold text-2xl"
          style={{
            width: 148, height: 148, left: 8, top: 16,
            background: "linear-gradient(135deg, #361E7B, #7C5BF5)",
            boxShadow: "0 8px 32px rgba(124,91,245,0.45), 0 0 0 1px rgba(124,91,245,0.22)",
          }}
        >65%</div>

        <div
          className="absolute flex items-center justify-center rounded-full text-white font-bold text-base"
          style={{
            width: 104, height: 104, right: 20, top: 6,
            background: "linear-gradient(135deg, #C89820, #F5C842)",
            boxShadow: "0 6px 24px rgba(245,200,66,0.38), 0 0 0 1px rgba(245,200,66,0.22)",
          }}
        >25%</div>

        <div
          className="absolute flex items-center justify-center rounded-full text-white font-bold text-sm"
          style={{
            width: 74, height: 74, right: 42, bottom: 8,
            background: "linear-gradient(135deg, #C05818, #F5814A)",
            boxShadow: "0 4px 16px rgba(245,129,74,0.38), 0 0 0 1px rgba(245,129,74,0.22)",
          }}
        >10%</div>
      </div>

      <div className="space-y-2.5 mt-3">
        {LEGEND.map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-sm" style={{ color: "var(--text-3)" }}>{item.label}</span>
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{item.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
