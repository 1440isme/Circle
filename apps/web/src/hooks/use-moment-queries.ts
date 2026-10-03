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
      const res = await apiRequest<any>('/moments/feed');
      if (Array.isArray(res)) return res as MomentEntity[];
      if (res && Array.isArray(res.data)) return res.data as MomentEntity[];
      return [];
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useCircleMomentsQuery(circleId: string | null) {
  return useQuery({
    queryKey: MOMENT_KEYS.circle(circleId || ''),
    queryFn: async () => {
      if (!circleId) return [];
      const res = await apiRequest<any>(`/moments/circle/${circleId}`);
      if (Array.isArray(res)) return res as MomentEntity[];
      if (res && Array.isArray(res.data)) return res.data as MomentEntity[];
      return [];
    },
    enabled: Boolean(circleId),
    staleTime: 1000 * 30,
  });
}

export function useCreateMomentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMomentInput) => {
      const res = await apiRequest<any>('/moments', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return (res?.data ?? res) as MomentEntity;
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

export function useReplyMomentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      momentId,
      message,
      circleId,
    }: {
      momentId: string;
      message: string;
      circleId: string;
    }) => {
      const res = await apiRequest<any>(`/moments/${momentId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message, circleId }),
      });
      return res?.data ?? res;
    },
    onSuccess: () => {
      // Invalidate chat messages cache so if user navigates to chat, it displays immediately
      queryClient.invalidateQueries({ queryKey: ['chat'] });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}
