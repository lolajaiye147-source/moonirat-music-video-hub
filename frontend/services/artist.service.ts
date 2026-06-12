import api from './api';
import type { Video } from './video.service';

export interface ArtistProfile {
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  profileImage: string | null;
  verified: boolean;
  followersCount: number;
  createdAt: string;
}

export const artistService = {
  async getArtist(id: string): Promise<ArtistProfile> {
    const { data } = await api.get<ArtistProfile>(`/artists/${id}`);
    return data;
  },

  async getArtistVideos(id: string, page = 1, limit = 20) {
    const { data } = await api.get<{ videos: Video[]; total: number }>(`/artists/${id}/videos`, {
      params: { page, limit },
    });
    return data;
  },

  async getAllArtists(page = 1, limit = 20) {
    const { data } = await api.get('/artists', { params: { page, limit } });
    return data;
  },
};
