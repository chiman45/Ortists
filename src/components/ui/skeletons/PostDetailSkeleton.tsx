import Skeleton, { SkeletonCircle, SkeletonText } from "../Skeleton";

export default function PostDetailSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row" style={{ minHeight: "calc(100vh - 180px)" }}>

      {/* Left: image placeholder */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-6 lg:pb-0"
        style={{ maxWidth: "55%" }}>
        <Skeleton
          height="75vh"
          radius={18}
          style={{ minHeight: 320 }}
        />
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-105 shrink-0 flex flex-col border-l"
        style={{ borderColor: "var(--border)" }}>

        {/* Artist row */}
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <SkeletonCircle size={40} />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton height={12} width="45%" radius={6} />
            <Skeleton height={10} width="30%" radius={5} />
          </div>
          <Skeleton height={30} width={78} radius={99} />
        </div>

        {/* Caption */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <Skeleton height={13} width="60%" radius={6} style={{ marginBottom: 10 }} />
          <SkeletonText lines={3} lastWidth="40%" gap={7} />
          {/* Action buttons */}
          <div className="flex gap-5 mt-4">
            {[40, 40, 42, 80].map((w, i) => (
              <Skeleton key={i} height={20} width={w} radius={6} />
            ))}
          </div>
        </div>

        {/* Comments */}
        <div className="flex-1 px-5 py-4 flex flex-col gap-5 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-2.5">
              <SkeletonCircle size={28} />
              <div className="flex-1 flex flex-col gap-2 pt-0.5">
                <Skeleton height={11} width="70%" radius={5} />
                <Skeleton height={10} width="85%" radius={5} />
                <Skeleton height={9} width="25%" radius={4} />
              </div>
            </div>
          ))}
        </div>

        {/* Comment input */}
        <div className="px-4 py-3 flex items-center gap-2"
          style={{ borderTop: "1px solid var(--border)" }}>
          <SkeletonCircle size={28} />
          <Skeleton height={32} radius={10} />
        </div>
      </div>
    </div>
  );
}
