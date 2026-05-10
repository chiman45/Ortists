const GRADIENTS = [
  ["#6366f1", "#818cf8"], // indigo
  ["#ec4899", "#f472b6"], // pink
  ["#f59e0b", "#fbbf24"], // amber
  ["#10b981", "#34d399"], // emerald
  ["#3b82f6", "#60a5fa"], // blue
  ["#8b5cf6", "#a78bfa"], // violet
  ["#f43f5e", "#fb7185"], // rose
  ["#06b6d4", "#22d3ee"], // cyan
  ["#ef4444", "#f87171"], // red
  ["#14b8a6", "#2dd4bf"], // teal
];

function getGradient(seed: string): [string, string] {
  const idx =
    seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length;
  return GRADIENTS[idx] as [string, string];
}

function getInitials(name: string): string {
  return name
    .replace(/[._@]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export default function Avatar({ name, size = 40, className = "" }: AvatarProps) {
  const [from, to] = getGradient(name);
  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.36);

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 font-bold text-white select-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        fontSize,
      }}
    >
      {initials}
    </div>
  );
}
