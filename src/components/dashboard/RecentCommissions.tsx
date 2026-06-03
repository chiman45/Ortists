import { type Post } from "@/lib/db/posts";
import { CalendarDays } from "lucide-react";
import Link from "next/link";

interface Props {
  posts: Post[];
  loading: boolean;
}

const GLASS: React.CSSProperties = {
  background: "var(--bg-card)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--border-card)",
  boxShadow: "0 4px 24px var(--shadow)",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "2-digit" });
}

export default function RecentPosts({ posts, loading }: Props) {
  const recent = posts.slice(0, 5);

  return (
    <div className="rounded-2xl p-5" style={GLASS}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold" style={{ color: "var(--text-1)" }}>Recent Posts</h3>
        <Link href="/profile" className="flex items-center gap-1 text-sm font-semibold text-[#7C5BF5] hover:text-[#9B7CF5] transition-colors">
          View All →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "var(--bg-subtle)" }} />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-2">
          <p className="text-3xl">🎨</p>
          <p className="text-sm" style={{ color: "var(--text-5)" }}>No posts yet — publish your first artwork!</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <div style={{ minWidth: 460 }}>
            <div
              className="grid gap-3 text-xs font-semibold px-1 mb-3"
              style={{ gridTemplateColumns: "40px 1fr 1fr 1fr 0.8fr 0.8fr", color: "var(--text-6)" }}
            >
              <span>Art</span>
              <span>Title</span>
              <span>Category</span>
              <span>Date</span>
              <span>Likes</span>
              <span>Saves</span>
            </div>

            <div className="space-y-0.5">
              {recent.map(p => (
                <Link
                  key={p.id}
                  href={`/feed/${p.id}`}
                  className="grid gap-3 items-center py-2.5 px-1 rounded-xl transition-colors cursor-pointer"
                  style={{ gridTemplateColumns: "40px 1fr 1fr 1fr 0.8fr 0.8fr", borderBottom: "1px solid var(--bg-card)", display: "grid" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "var(--bg-hover)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  {/* Thumbnail */}
                  <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 bg-gray-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                  </div>

                  <span className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>{p.title}</span>

                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
                    style={{ background: "rgba(124,91,245,0.12)", color: "#9B7CF5" }}
                  >
                    {p.category ?? "General"}
                  </span>

                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-5)" }}>
                    <CalendarDays size={11} />{formatDate(p.created_at)}
                  </span>

                  <span className="text-sm font-bold" style={{ color: "#f43f5e" }}>
                    ♥ {p.likes_count ?? 0}
                  </span>

                  <span className="text-sm font-bold" style={{ color: "#7C5BF5" }}>
                    🔖 {p.saves_count ?? 0}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
