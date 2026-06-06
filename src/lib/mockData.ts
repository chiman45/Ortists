import { Post, Designer, Category } from "./types";

const USERNAMES = [
  "alex_creates", "mila.design", "jin_3d", "sara.motion",
  "noah_illus",   "priya.ux",    "luca.brand", "yuki_type",
  "cleo.art",     "omar_3d",     "ivy.motion", "felix.ui",
];

const IMG_HEIGHTS = [520, 300, 460, 280, 540, 360, 490, 320, 420, 500, 270, 380];
const CATS = ["UI/UX","Branding","3D","Motion","Illustration","Typography","Photography","Web Design"];

/* 120 deterministic posts for infinite scroll */
export const allPosts: Post[] = Array.from({ length: 120 }, (_, i) => {
  const h = IMG_HEIGHTS[i % IMG_HEIGHTS.length];
  return {
    id: `p${i + 1}`,
    userId:      "",
    imageUrl:    `https://picsum.photos/seed/ortist${i + 1}/400/${h}`,
    imageWidth:  400,
    imageHeight: h,
    username:    USERNAMES[i % USERNAMES.length],
    avatar:      `https://i.pravatar.cc/80?img=${(i % 60) + 1}`,
    likes:       ((i * 7 + 31) * 127) % 8000 + 200,
    comments:    ((i * 13 + 7) * 31) % 500 + 10,
    category:    CATS[i % CATS.length],
    title:       `Artwork ${i + 1}`,
  };
});

export const mockPosts: Post[] = allPosts.slice(0, 12);

export const mockDesigners: Designer[] = [
  { id: "1", username: "alex_creates", avatar: "https://i.pravatar.cc/80?img=1",  isOnline: true },
  { id: "2", username: "mila.design",  avatar: "https://i.pravatar.cc/80?img=5",  isOnline: true },
  { id: "3", username: "jin_3d",       avatar: "https://i.pravatar.cc/80?img=7",  isOnline: false },
  { id: "4", username: "sara.motion",  avatar: "https://i.pravatar.cc/80?img=9",  isOnline: true },
  { id: "5", username: "noah_illus",   avatar: "https://i.pravatar.cc/80?img=12", isOnline: true },
  { id: "6", username: "priya.ux",     avatar: "https://i.pravatar.cc/80?img=16", isOnline: false },
  { id: "7", username: "luca.brand",   avatar: "https://i.pravatar.cc/80?img=20", isOnline: true },
  { id: "8", username: "yuki_type",    avatar: "https://i.pravatar.cc/80?img=22", isOnline: false },
];

export const CATEGORIES: Category[] = [
  { id: "uiux",        name: "UI/UX",       emoji: "✦", description: "Interfaces & experiences",   gradient: "from-blue-400 to-indigo-500",    textColor: "text-indigo-300",   glassColor: "bg-indigo-950/60" },
  { id: "branding",    name: "Branding",    emoji: "◈", description: "Identity & visual systems",  gradient: "from-rose-400 to-pink-500",      textColor: "text-rose-300",     glassColor: "bg-rose-950/60" },
  { id: "3d",          name: "3D",          emoji: "⬡", description: "3D art & rendering",         gradient: "from-violet-400 to-purple-500",  textColor: "text-violet-300",   glassColor: "bg-violet-950/60" },
  { id: "motion",      name: "Motion",      emoji: "◎", description: "Animation & motion design",  gradient: "from-amber-400 to-orange-500",   textColor: "text-amber-300",    glassColor: "bg-amber-950/60" },
  { id: "illustration",name: "Illustration",emoji: "✿", description: "Art & illustration",         gradient: "from-emerald-400 to-teal-500",   textColor: "text-emerald-300",  glassColor: "bg-emerald-950/60" },
  { id: "typography",  name: "Typography",  emoji: "Aa",description: "Type & lettering",           gradient: "from-sky-400 to-cyan-500",       textColor: "text-sky-300",      glassColor: "bg-sky-950/60" },
  { id: "photography", name: "Photography", emoji: "⊙", description: "Visual storytelling",        gradient: "from-fuchsia-400 to-pink-500",   textColor: "text-fuchsia-300",  glassColor: "bg-fuchsia-950/60" },
  { id: "webdesign",   name: "Web Design",  emoji: "⊞", description: "Websites & digital",        gradient: "from-lime-400 to-green-500",     textColor: "text-lime-300",     glassColor: "bg-lime-950/60" },
];
