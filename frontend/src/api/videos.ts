import { api } from './client';
import { Video } from '../types';

export const videosApi = {
  getAll: (page = 1, limit = 20) =>
    api.get<{ videos: Video[]; total: number }>('/videos', { params: { page, limit } }).then((r) => r.data),

  getOne: (id: string) => api.get<Video>(`/videos/${id}`).then((r) => r.data),

  trending: (limit = 10) =>
    api.get<Video[]>('/videos/trending', { params: { limit } }).then((r) => r.data),

  newReleases: (limit = 10) =>
    api.get<Video[]>('/videos/new-releases', { params: { limit } }).then((r) => r.data),

  search: (q: string, page = 1, limit = 20) =>
    api.get<{ videos: Video[]; total: number }>('/videos/search', { params: { q, page, limit } }).then((r) => r.data),

  create: (data: { title: string; description?: string; videoUrl: string; thumbnailUrl?: string }) =>
    api.post<Video>('/videos', data).then((r) => r.data),

  update: (id: string, data: Partial<{ title: string; description: string; thumbnailUrl: string }>) =>
    api.patch<Video>(`/videos/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/videos/${id}`).then((r) => r.data),

  incrementView: (id: string) => api.post(`/videos/${id}/view`).then((r) => r.data),

  getUploadUrl: (contentType: string, type: 'videos' | 'thumbnails' = 'videos') =>
    api.post<{ uploadUrl: string; fileUrl: string; key: string }>('/videos/upload-url', { contentType, type }).then((r) => r.data),
};
