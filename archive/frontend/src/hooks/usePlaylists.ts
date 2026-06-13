import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playlistsApi } from '../api/playlists';

export const usePlaylists = () =>
  useQuery({ queryKey: ['playlists'], queryFn: playlistsApi.getAll });

export const usePlaylist = (id: string) =>
  useQuery({ queryKey: ['playlist', id], queryFn: () => playlistsApi.getOne(id), enabled: !!id });

export const useCreatePlaylist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: playlistsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playlists'] }),
  });
};

export const useDeletePlaylist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: playlistsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playlists'] }),
  });
};

export const useAddToPlaylist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, videoId }: { playlistId: string; videoId: string }) =>
      playlistsApi.addVideo(playlistId, videoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playlists'] }),
  });
};

export const useRemoveFromPlaylist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, videoId }: { playlistId: string; videoId: string }) =>
      playlistsApi.removeVideo(playlistId, videoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playlists'] }),
  });
};
