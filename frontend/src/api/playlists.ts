import { api } from './client';
import { Playlist } from '../types';

export const playlistsApi = {
  getAll: () => api.get<Playlist[]>('/playlists').then((r) => r.data),

  getOne: (id: string) => api.get<Playlist>(`/playlists/${id}`).then((r) => r.data),

  create: (name: string) => api.post<Playlist>('/playlists', { name }).then((r) => r.data),

  update: (id: string, name: string) =>
    api.patch<Playlist>(`/playlists/${id}`, { name }).then((r) => r.data),

  remove: (id: string) => api.delete(`/playlists/${id}`).then((r) => r.data),

  addVideo: (playlistId: string, videoId: string) =>
    api.post(`/playlists/${playlistId}/videos`, { videoId }).then((r) => r.data),

  removeVideo: (playlistId: string, videoId: string) =>
    api.delete(`/playlists/${playlistId}/videos/${videoId}`).then((r) => r.data),
};
