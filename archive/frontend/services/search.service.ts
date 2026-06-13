import api from './api';
import type { Video } from './video.service';
import type { ArtistProfile } from './artist.service';

export const searchService = {
  async searchVideos(q: string, page = 1, limit = 20): Promise<{ videos: Video[]; total: number }> {
    const { data } = await api.get('/search/videos', { params: { q, page, limit } });
    return data;
  },

  async searchArtists(q: string, page = 1, limit = 20): Promise<{ artists: ArtistProfile[]; total: number }> {
    const { data } = await api.get('/search/artists', { params: { q, page, limit } });
    return data;
  },
};
