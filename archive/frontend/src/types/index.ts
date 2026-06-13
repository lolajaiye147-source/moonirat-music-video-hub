export interface User {
  id: string;
  email: string;
  role: 'VIEWER' | 'ARTIST';
  createdAt: string;
  artist?: Artist;
}

export interface Artist {
  id: string;
  userId: string;
  name: string;
  bio?: string;
  profileImage?: string;
  verified: boolean;
  followersCount: number;
  createdAt: string;
}

export interface Video {
  id: string;
  artistId: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  views: number;
  createdAt: string;
  artist?: {
    id: string;
    name: string;
    profileImage?: string;
    verified: boolean;
  };
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  items?: PlaylistItem[];
}

export interface PlaylistItem {
  id: string;
  playlistId: string;
  videoId: string;
  video?: Video;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
