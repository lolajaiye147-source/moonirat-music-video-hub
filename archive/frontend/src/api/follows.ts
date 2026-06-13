import { api } from './client';
import { Artist } from '../types';

export const followsApi = {
  follow: (artistId: string) => api.post(`/follows/${artistId}`).then((r) => r.data),

  unfollow: (artistId: string) => api.delete(`/follows/${artistId}`).then((r) => r.data),

  getFollowedArtists: (page = 1, limit = 20) =>
    api.get<{ artists: Artist[]; total: number }>('/follows/me', { params: { page, limit } }).then((r) => r.data),

  getFollowers: (artistId: string, page = 1, limit = 20) =>
    api.get(`/follows/artists/${artistId}/followers`, { params: { page, limit } }).then((r) => r.data),
};
