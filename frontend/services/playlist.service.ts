import api from './api';

export interface Playlist {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  items?: PlaylistItem[];
}

export interface PlaylistItem {
  id: string;
  videoId: string;
  video: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    views: number;
    artist: { name: string };
  };
}

export const playlistService = {
  async getMyPlaylists(): Promise<Playlist[]> {
    const { data } = await api.get<Playlist[]>('/playlists/user/me');
    return data;
  },

  async getPlaylistById(id: string): Promise<Playlist> {
    const { data } = await api.get<Playlist>(`/playlists/${id}`);
    return data;
  },

  async createPlaylist(name: string): Promise<Playlist> {
    const { data } = await api.post<Playlist>('/playlists', { name });
    return data;
  },

  async addVideo(playlistId: string, videoId: string) {
    const { data } = await api.post(`/playlists/${playlistId}/add`, { videoId });
    return data;
  },

  async removeVideo(playlistId: string, videoId: string) {
    const { data } = await api.delete(`/playlists/${playlistId}/remove`, { data: { videoId } });
    return data;
  },

  async deletePlaylist(id: string) {
    const { data } = await api.delete(`/playlists/${id}`);
    return data;
  },
};
