import { Designer } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";

interface StoryCircleProps { designer: Designer; onClick?: () => void }

export default function StoryCircle({ designer, onClick }: StoryCircleProps) {
  const shortName = designer.username.split(".")[0].split("_")[0];
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 shrink-0 group">
      <div className="relative">
        <div
          className="w-14 h-14 rounded-full p-[2.5px] transition-all duration-200 group-hover:shadow-lg"
          style={{
            background: "linear-gradient(135deg, #361E7B, #7C5BF5, #FF7EA0)",
            boxShadow: "0 0 0 0 rgba(124,91,245,0)",
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 16px rgba(124,91,245,0.45)")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 0 0 rgba(124,91,245,0)")}
        >
          <div
            className="w-full h-full rounded-full overflow-hidden"
            style={{ outline: "2.5px solid var(--ring-bg)", outlineOffset: "-2.5px" }}
          >
            <Avatar name={designer.username} size={51} />
          </div>
        </div>
        {designer.isOnline && (
          <span
            className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-400 rounded-full ring-2"
            style={{ "--tw-ring-color": "var(--ring-bg)" } as React.CSSProperties}
          />
        )}
      </div>
      <span className="text-[10px] font-medium truncate w-14 text-center leading-none" style={{ color: "var(--text-4)" }}>
        {shortName}
      </span>
    </button>
  );
}
