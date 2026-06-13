import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followsApi } from '../api/follows';

export const useFollowedArtists = () =>
  useQuery({ queryKey: ['followed-artists'], queryFn: () => followsApi.getFollowedArtists() });

export const useFollow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: followsApi.follow,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['followed-artists'] });
      qc.invalidateQueries({ queryKey: ['artists'] });
    },
  });
};

export const useUnfollow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: followsApi.unfollow,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['followed-artists'] });
      qc.invalidateQueries({ queryKey: ['artists'] });
    },
  });
};
