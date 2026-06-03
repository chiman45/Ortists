import { MoreHorizontal, TrendingDown, TrendingUp } from "lucide-react";
import SparkLine from "./SparkLine";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  data: number[];
  color: string;
  gradId: string;
}

const GLASS: React.CSSProperties = {
  background: "var(--bg-card)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--border-card)",
  boxShadow: "0 4px 24px var(--shadow)",
};

export default function StatCard({ title, value, change, positive, data, color, gradId }: StatCardProps) {
  return (
    <div className="rounded-2xl p-5" style={GLASS}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium" style={{ color: "var(--text-4)" }}>{title}</p>
        <button style={{ color: "var(--text-6)" }} className="hover:opacity-70 transition-opacity">
          <MoreHorizontal size={18} />
        </button>
      </div>
      <p className="text-[28px] font-bold tracking-tight mb-3" style={{ color: "var(--text-1)" }}>{value}</p>
      <div className="flex items-end justify-between">
        {change ? (
          <div className={`flex items-center gap-1 text-xs font-semibold ${positive ? "text-emerald-400" : "text-rose-400"}`}>
            {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>{change}</span>
            <span className="font-normal ml-0.5" style={{ color: "var(--text-6)" }}>vs last month</span>
          </div>
        ) : <div />}
        <SparkLine data={data} color={color} gradId={gradId} width={100} height={40} />
      </div>
    </div>
  );
}
