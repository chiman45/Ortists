import { ChevronDown } from "lucide-react";

const SOURCES = [
  { label: "Direct",    count: "1,43,382", pct: 86 },
  { label: "Referral",  count: "87,974",   pct: 65 },
  { label: "Social",    count: "45,211",   pct: 42 },
  { label: "Instagram", count: "21,893",   pct: 26 },
  { label: "Pinterest", count: "15,204",   pct: 18 },
];

const GLASS: React.CSSProperties = {
  background: "var(--bg-card)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--border-card)",
  boxShadow: "0 4px 24px var(--shadow)",
};

export default function TrafficSources() {
  return (
    <div className="rounded-2xl p-5 h-full" style={GLASS}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold" style={{ color: "var(--text-1)" }}>Traffic Sources</h3>
        <button className="flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ fontSize: 11, fontWeight: 600, color: "var(--text-5)" }}>
          LAST 7 DAYS <ChevronDown size={12} />
        </button>
      </div>

      <div className="space-y-4">
        {SOURCES.map(src => (
          <div key={src.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm" style={{ color: "var(--text-3)" }}>{src.label}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{src.count}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${src.pct}%`,
                  background: "linear-gradient(90deg, #361E7B, #7C5BF5)",
                  boxShadow: "0 0 8px rgba(124,91,245,0.45)",
                  transition: "width 1s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
