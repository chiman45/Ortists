import Skeleton, { SkeletonCircle } from "../Skeleton";

const HEIGHTS = [220, 300, 260, 340, 200, 280, 240, 320, 190, 310, 260, 230];

export default function FeedGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="break-inside-avoid mb-4">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(124,91,245,0.08)" }}
          >
            {/* Image area */}
            <Skeleton height={HEIGHTS[i % HEIGHTS.length]} radius={0} />

            {/* Card footer */}
            <div
              className="flex items-center gap-2 px-3 py-2.5"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <SkeletonCircle size={26} />
              <div className="flex-1 min-w-0">
                <Skeleton height={10} width="55%" radius={5} />
              </div>
              {/* Like count placeholder */}
              <Skeleton height={10} width={28} radius={5} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
