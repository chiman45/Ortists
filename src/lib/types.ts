export interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  username: string;
  avatar: string;
  likes: number;
  comments: number;
  category: string;
  title: string;
}

export interface Designer {
  id: string;
  username: string;
  avatar: string;
  isOnline: boolean;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  description: string;
  gradient: string;
  textColor: string;
  glassColor: string;
}

export interface MarketplaceListing {
  id: string;
  type: "artwork" | "commission";
  imageUrl: string;
  title: string;
  artistName: string;
  avatar: string;
  price: number;
  currency: string;
  category: string;
  medium?: string;
  dimensions?: string;
  deliveryTime?: string;
  likes: number;
  saved: boolean;
  tags: string[];
  description: string;
  physical: boolean;
  commissionOpen: boolean;
}

export interface FeaturedArtist {
  id: string;
  name: string;
  username: string;
  avatar: string;
  specialty: string;
  listingsCount: number;
  followers: number;
}
