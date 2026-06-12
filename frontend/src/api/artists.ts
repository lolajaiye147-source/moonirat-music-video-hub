import { api } from './client';
import { Artist, Video } from '../types';

export const artistsApi = {
  getAll: (page = 1, limit = 20) =>
    api.get<{ artists: Artist[]; total: number }>('/artists', { params: { page, limit } }).then((r) => r.data),

  getOne: (id: string) => api.get<Artist>(`/artists/${id}`).then((r) => r.data),

  getVideos: (id: string, page = 1, limit = 20) =>
    api.get<{ videos: Video[]; total: number }>(`/artists/${id}/videos`, { params: { page, limit } }).then((r) => r.data),

  getMe: () => api.get<Artist>('/artists/me').then((r) => r.data),

  create: (data: { name: string; bio?: string; profileImage?: string }) =>
    api.post<Artist>('/artists', data).then((r) => r.data),

  update: (data: Partial<{ name: string; bio: string; profileImage: string }>) =>
    api.patch<Artist>('/artists/me', data).then((r) => r.data),

  requestVerification: () => api.post('/artists/me/verify').then((r) => r.data),
};
