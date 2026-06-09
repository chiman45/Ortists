import Skeleton, { SkeletonCircle } from "../Skeleton";

function ConvRow({ wide = false }: { wide?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <SkeletonCircle size={42} />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton height={12} width={wide ? "55%" : "45%"} radius={6} />
        <Skeleton height={10} width={wide ? "80%" : "65%"} radius={5} />
      </div>
      <Skeleton height={9} width={28} radius={5} />
    </div>
  );
}

function BubbleRight() {
  return (
    <div className="flex justify-end px-4 mb-3">
      <Skeleton height={38} width="55%" radius={14} />
    </div>
  );
}

function BubbleLeft() {
  return (
    <div className="flex items-end gap-2 px-4 mb-3">
      <SkeletonCircle size={28} />
      <Skeleton height={44} width="50%" radius={14} />
    </div>
  );
}

export default function MessagesSkeleton() {
  return (
    <div className="flex flex-1 overflow-hidden" style={{ minHeight: "calc(100vh - 64px)" }}>

      {/* Sidebar — conversation list */}
      <div
        className="w-80 shrink-0 flex flex-col border-r"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Search bar */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <Skeleton height={36} radius={10} />
        </div>

        {/* Conversation rows */}
        {Array.from({ length: 7 }).map((_, i) => (
          <ConvRow key={i} wide={i % 3 === 0} />
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">

        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <SkeletonCircle size={38} />
          <div className="flex flex-col gap-2">
            <Skeleton height={13} width={120} radius={6} />
            <Skeleton height={10} width={80} radius={5} />
          </div>
          <div className="ml-auto flex gap-2">
            {[32, 32, 32].map((s, i) => (
              <Skeleton key={i} height={s} width={s} radius={8} />
            ))}
          </div>
        </div>

        {/* Message bubbles */}
        <div className="flex-1 flex flex-col justify-end py-4 overflow-hidden">
          <BubbleLeft />
          <BubbleRight />
          <BubbleLeft />
          <BubbleRight />
          <BubbleLeft />
          <BubbleRight />
        </div>

        {/* Input bar */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <Skeleton height={36} width={36} radius={8} />
          <Skeleton height={40} radius={12} />
          <Skeleton height={36} width={36} radius={8} />
        </div>
      </div>
    </div>
  );
}
