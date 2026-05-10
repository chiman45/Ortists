export interface Post {
  id: string;
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
