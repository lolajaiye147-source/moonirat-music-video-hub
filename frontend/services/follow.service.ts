import api from './api';

export const followService = {
  async followArtist(artistId: string) {
    const { data } = await api.post(`/follows/${artistId}`);
    return data;
  },

  async unfollowArtist(artistId: string) {
    const { data } = await api.delete(`/follows/${artistId}`);
    return data;
  },

  async getFollowing(page = 1, limit = 20) {
    const { data } = await api.get('/follows/following', { params: { page, limit } });
    return data;
  },

  async getFollowers(artistId: string, page = 1, limit = 20) {
    const { data } = await api.get(`/follows/followers/${artistId}`, { params: { page, limit } });
    return data;
  },
};
