import { MarketplaceListing, FeaturedArtist } from "./types";

export const MARKETPLACE_CATEGORIES = [
  "All", "Paintings", "Digital Art", "Portraits", "Illustrations",
  "Sculptures", "Photography", "Commissions",
];

const ARTISTS = [
  { name: "Alex Chen",    username: "alex_creates",  avatar: "https://i.pravatar.cc/80?img=1"  },
  { name: "Mila Russo",   username: "mila.design",   avatar: "https://i.pravatar.cc/80?img=5"  },
  { name: "Jin Park",     username: "jin_3d",        avatar: "https://i.pravatar.cc/80?img=7"  },
  { name: "Sara Okafor",  username: "sara.motion",   avatar: "https://i.pravatar.cc/80?img=9"  },
  { name: "Noah Ellis",   username: "noah_illus",    avatar: "https://i.pravatar.cc/80?img=12" },
  { name: "Priya Nair",   username: "priya.ux",      avatar: "https://i.pravatar.cc/80?img=16" },
  { name: "Luca Ferrari", username: "luca.brand",    avatar: "https://i.pravatar.cc/80?img=20" },
  { name: "Yuki Tanaka",  username: "yuki_type",     avatar: "https://i.pravatar.cc/80?img=22" },
];

const TAGS_POOL = [
  ["abstract", "acrylic", "modern"],
  ["digital", "neon", "cyberpunk"],
  ["portrait", "realism", "oil"],
  ["fantasy", "watercolor", "nature"],
  ["3D", "render", "futuristic"],
  ["street", "urban", "photography"],
  ["minimal", "typography", "clean"],
  ["character", "illustration", "anime"],
];

const CATEGORIES = ["Paintings", "Digital Art", "Portraits", "Illustrations", "Sculptures", "Photography", "Digital Art", "Illustrations"];
const MEDIUMS    = ["Acrylic on canvas", "Digital illustration", "Oil on canvas", "Watercolor", "3D render", "Photography", "Mixed media", "Ink"];
const SIZES      = ["40×60 cm", "60×80 cm", "A3 print", "24×36 in", "Digital file", "Digital file", "50×70 cm", "A4 print"];

export const marketplaceListings: MarketplaceListing[] = Array.from({ length: 24 }, (_, i) => {
  const artist = ARTISTS[i % ARTISTS.length];
  const isCommission = i % 5 === 4;
  const h = [380, 520, 420, 300, 460, 340][i % 6];

  return {
    id: `m${i + 1}`,
    type: isCommission ? "commission" : "artwork",
    imageUrl: `https://picsum.photos/seed/market${i + 1}/400/${h}`,
    title: isCommission
      ? ["Custom Portrait", "Brand Identity", "Character Design", "Logo Design", "Concept Art"][i % 5]
      : [`Artwork #${i + 1}`, "Chromatic Dreams", "Urban Pulse", "Silent Forest", "Neon Drift", "Golden Hour"][i % 6],
    artistName: artist.name,
    avatar: artist.avatar,
    price: isCommission ? (i + 1) * 15 + 50 : (i + 1) * 20 + 80,
    currency: "USD",
    category: CATEGORIES[i % CATEGORIES.length],
    medium: MEDIUMS[i % MEDIUMS.length],
    dimensions: SIZES[i % SIZES.length],
    deliveryTime: isCommission ? `${(i % 4) + 3} days` : undefined,
    likes: ((i * 13 + 7) * 31) % 2000 + 50,
    saved: false,
    tags: TAGS_POOL[i % TAGS_POOL.length],
    description: "A stunning piece that explores the boundaries of form and color, created with meticulous attention to detail and artistic vision.",
    physical: !isCommission && i % 3 !== 0,
    commissionOpen: isCommission || i % 4 === 0,
  };
});

export const featuredArtists: FeaturedArtist[] = ARTISTS.map((a, i) => ({
  id: `fa${i + 1}`,
  name: a.name,
  username: a.username,
  avatar: a.avatar,
  specialty: CATEGORIES[i % CATEGORIES.length],
  listingsCount: (i + 1) * 3 + 4,
  followers: ((i + 1) * 1237) % 9000 + 500,
}));

export const trendingListings = marketplaceListings.slice(0, 8);
