/**
 * LinkedIn-style reactions on posts. "like" (❤️) is the default for a quick tap
 * and is what every like saved before reactions existed counts as.
 */
export const REACTIONS = [
  { key: "like",    emoji: "❤️", label: "Love",      color: "#f43f5e" },
  { key: "fire",    emoji: "🔥", label: "Fire",      color: "#F97316" },
  { key: "funny",   emoji: "😂", label: "Funny",     color: "#F59E0B" },
  { key: "wow",     emoji: "😮", label: "Wow",       color: "#EAB308" },
  { key: "clap",    emoji: "👏", label: "Applause",  color: "#10B981" },
  { key: "inspire", emoji: "🎨", label: "Inspiring", color: "#9B7CF5" },
] as const;

export type ReactionKey = (typeof REACTIONS)[number]["key"];
export type ReactionCounts = Partial<Record<ReactionKey, number>>;

export const DEFAULT_REACTION: ReactionKey = "like";

export function isReaction(v: unknown): v is ReactionKey {
  return typeof v === "string" && REACTIONS.some(r => r.key === v);
}

export function reactionMeta(key: string | null | undefined) {
  return REACTIONS.find(r => r.key === key) ?? REACTIONS[0];
}

/** The most-used reactions on a post, biggest first (for the little emoji stack). */
export function topReactions(counts: ReactionCounts | undefined, n = 3) {
  return REACTIONS
    .filter(r => (counts?.[r.key] ?? 0) > 0)
    .sort((a, b) => (counts![b.key] ?? 0) - (counts![a.key] ?? 0))
    .slice(0, n);
}
