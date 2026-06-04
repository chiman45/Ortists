const GRADIENTS = [
  ["#6366f1", "#818cf8"],
  ["#ec4899", "#f472b6"],
  ["#f59e0b", "#fbbf24"],
  ["#10b981", "#34d399"],
  ["#3b82f6", "#60a5fa"],
  ["#8b5cf6", "#a78bfa"],
  ["#f43f5e", "#fb7185"],
  ["#06b6d4", "#22d3ee"],
  ["#ef4444", "#f87171"],
  ["#14b8a6", "#2dd4bf"],
];

function getGradient(seed: string): [string, string] {
  const idx = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length;
  return GRADIENTS[idx] as [string, string];
}

function getInitials(name: string): string {
  return name
    .replace(/[._@]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}

export default function Avatar({ name, src, size = 40, className = "" }: AvatarProps) {
  const [from, to] = getGradient(name);
  const fontSize   = Math.round(size * 0.36);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 font-bold text-white select-none ${className}`}
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${from}, ${to})`, fontSize }}
    >
      {getInitials(name)}
    </div>
  );
}
