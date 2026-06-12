import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { artistsApi } from '../api/artists';

export const useArtists = (page = 1, limit = 20) =>
  useQuery({ queryKey: ['artists', page, limit], queryFn: () => artistsApi.getAll(page, limit) });

export const useArtist = (id: string) =>
  useQuery({ queryKey: ['artist', id], queryFn: () => artistsApi.getOne(id), enabled: !!id });

export const useArtistVideos = (id: string, page = 1) =>
  useQuery({
    queryKey: ['artist-videos', id, page],
    queryFn: () => artistsApi.getVideos(id, page),
    enabled: !!id,
  });

export const useMyArtistProfile = () =>
  useQuery({ queryKey: ['my-artist'], queryFn: artistsApi.getMe });

export const useCreateArtist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: artistsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-artist'] }),
  });
};

export const useUpdateArtist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: artistsApi.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-artist'] }),
  });
};
