import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { CreateMomentInput, ReactMomentInput } from '@circle/shared';
import { MomentEntity } from '@circle/types';

export const MOMENT_KEYS = {
  all: ['moments'] as const,
  feed: () => [...MOMENT_KEYS.all, 'feed'] as const,
  circle: (circleId: string) => [...MOMENT_KEYS.all, 'circle', circleId] as const,
};

export function useMomentsFeedQuery() {
  return useQuery({
    queryKey: MOMENT_KEYS.feed(),
    queryFn: async () => {
      const res = await apiRequest<MomentEntity[]>('/moments/feed');
      return res.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCircleMomentsQuery(circleId: string | null) {
  return useQuery({
    queryKey: MOMENT_KEYS.circle(circleId || ''),
    queryFn: async () => {
      if (!circleId) return [];
      const res = await apiRequest<MomentEntity[]>(`/moments/circle/${circleId}`);
      return res.data;
    },
    enabled: Boolean(circleId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateMomentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMomentInput) => {
      const res = await apiRequest<MomentEntity>('/moments', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOMENT_KEYS.all });
    },
  });
}

export function useReactMomentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ momentId, emoji }: { momentId: string; emoji: string }) => {
      const res = await apiRequest<{ reacted: boolean; emoji: string }>(
        `/moments/${momentId}/react`,
        {
          method: 'POST',
          body: JSON.stringify({ emoji } as ReactMomentInput),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOMENT_KEYS.all });
    },
  });
}

export function useDeleteMomentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (momentId: string) => {
      const res = await apiRequest<{ success: boolean }>(`/moments/${momentId}`, {
        method: 'DELETE',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOMENT_KEYS.all });
    },
  });
}
