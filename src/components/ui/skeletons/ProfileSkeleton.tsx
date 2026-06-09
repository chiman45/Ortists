import Skeleton, { SkeletonCircle } from "../Skeleton";

const CARD_HEIGHTS = [200, 260, 180, 300, 220, 240];

export default function ProfileSkeleton() {
  return (
    <div className="flex-1 flex flex-col">

      {/* Banner */}
      <Skeleton height={200} radius={0} style={{ width: "100%" }} />

      {/* Avatar + name */}
      <div className="px-5 md:px-8 pb-6">
        <div className="relative flex items-end gap-4 -mt-10 mb-5">
          <div className="p-1 rounded-full" style={{ background: "var(--bg)" }}>
            <SkeletonCircle size={88} />
          </div>
          <div className="pb-1 flex flex-col gap-2">
            <Skeleton height={18} width={160} radius={8} />
            <Skeleton height={12} width={110} radius={6} />
          </div>
          {/* Edit button placeholder */}
          <div className="ml-auto pb-1">
            <Skeleton height={36} width={110} radius={99} />
          </div>
        </div>

        {/* Bio lines */}
        <div className="flex flex-col gap-2 mb-4" style={{ maxWidth: 480 }}>
          <Skeleton height={12} width="90%" radius={6} />
          <Skeleton height={12} width="70%" radius={6} />
        </div>

        {/* Stats row */}
        <div className="flex gap-6 mb-6">
          {[["Posts", 48], ["Followers", 64], ["Following", 60]].map(([l, w]) => (
            <div key={l as string} className="flex flex-col gap-1.5">
              <Skeleton height={18} width={w as number} radius={6} />
              <Skeleton height={10} width={50} radius={5} />
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-8" style={{ borderBottom: "1px solid var(--border)" }}>
          {[90, 100, 80, 65, 70].map((w, i) => (
            <Skeleton key={i} height={32} width={w} radius={8} style={{ marginBottom: -1 }} />
          ))}
        </div>

        {/* Masonry grid */}
        <div className="columns-2 sm:columns-3 gap-4">
          {CARD_HEIGHTS.map((h, i) => (
            <div key={i} className="break-inside-avoid mb-4">
              <Skeleton height={h} radius={14} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
