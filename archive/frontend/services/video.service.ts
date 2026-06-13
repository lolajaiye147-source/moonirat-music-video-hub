import api from './api';

export interface Artist {
  id: string;
  name: string;
  profileImage: string | null;
  verified: boolean;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  views: number;
  duration: number | null;
  status: string;
  createdAt: string;
  artistId: string;
  artist: Artist;
}

export interface FeedResponse {
  trending: Video[];
  newReleases: Video[];
  followed: Video[];
}

export interface PaginatedVideos {
  videos: Video[];
  total: number;
  page: number;
  limit: number;
}

export const videoService = {
  async getFeed(): Promise<FeedResponse> {
    const { data } = await api.get<FeedResponse>('/feed/home');
    return data;
  },

  async getAllVideos(page = 1, limit = 20): Promise<PaginatedVideos> {
    const { data } = await api.get<PaginatedVideos>('/videos', { params: { page, limit } });
    return data;
  },

  async getVideoById(id: string): Promise<Video> {
    const { data } = await api.get<Video>(`/videos/${id}`);
    return data;
  },

  async getTrending(limit = 10): Promise<Video[]> {
    const { data } = await api.get<Video[]>('/videos/trending', { params: { limit } });
    return data;
  },

  async getNewReleases(limit = 10): Promise<Video[]> {
    const { data } = await api.get<Video[]>('/videos/new', { params: { limit } });
    return data;
  },

  async incrementViews(id: string): Promise<void> {
    await api.post(`/videos/${id}/view`);
  },

  async recordWatch(videoId: string): Promise<void> {
    try { await api.post(`/watch-history/${videoId}`); } catch {}
  },

  async getWatchHistory(page = 1, limit = 20) {
    const { data } = await api.get('/watch-history', { params: { page, limit } });
    return data;
  },
};
