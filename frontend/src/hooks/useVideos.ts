import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { videosApi } from '../api/videos';

export const useVideos = (page = 1, limit = 20) =>
  useQuery({ queryKey: ['videos', page, limit], queryFn: () => videosApi.getAll(page, limit) });

export const useVideo = (id: string) =>
  useQuery({ queryKey: ['video', id], queryFn: () => videosApi.getOne(id), enabled: !!id });

export const useTrending = (limit = 10) =>
  useQuery({ queryKey: ['trending', limit], queryFn: () => videosApi.trending(limit) });

export const useNewReleases = (limit = 10) =>
  useQuery({ queryKey: ['new-releases', limit], queryFn: () => videosApi.newReleases(limit) });

export const useSearchVideos = (q: string) =>
  useQuery({
    queryKey: ['search', q],
    queryFn: () => videosApi.search(q),
    enabled: q.length > 1,
  });

export const useCreateVideo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: videosApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['videos'] }),
  });
};

export const useDeleteVideo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: videosApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['videos'] }),
  });
};
