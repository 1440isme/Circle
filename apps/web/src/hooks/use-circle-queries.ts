import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { CreateCircleInput } from '@circle/shared';
import { CircleDetailResponse, CircleEntity, SelectableFriendItem } from '@circle/types';
import { useCircleStore } from '../stores/circle.store';

export const CIRCLE_KEYS = {
  all: ['circles'] as const,
  lists: () => [...CIRCLE_KEYS.all, 'list'] as const,
  detail: (idOrHandle: string) => [...CIRCLE_KEYS.all, 'detail', idOrHandle] as const,
  friends: () => [...CIRCLE_KEYS.all, 'friends', 'selectable'] as const,
};

export interface CircleListItem extends CircleEntity {
  role: string;
  nickname: string | null;
  memberCount: number;
  channels: Array<{ id: string; name: string; type: string; topic: string | null }>;
}

export function useSelectableFriendsQuery() {
  return useQuery({
    queryKey: CIRCLE_KEYS.friends(),
    queryFn: async () => {
      const res = await apiRequest<SelectableFriendItem[]>('/circles/friends/selectable');
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}


export function useMyCirclesQuery() {
  return useQuery({
    queryKey: CIRCLE_KEYS.lists(),
    queryFn: async () => {
      const res = await apiRequest<CircleListItem[]>('/circles');
      return res.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCircleDetailQuery(idOrHandle: string | null) {
  return useQuery({
    queryKey: CIRCLE_KEYS.detail(idOrHandle || ''),
    queryFn: async () => {
      if (!idOrHandle) return null;
      const res = await apiRequest<CircleDetailResponse>(`/circles/${idOrHandle}`);
      return res.data;
    },
    enabled: Boolean(idOrHandle),
  });
}

export function useCreateCircleMutation() {
  const queryClient = useQueryClient();
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const setCreateModalOpen = useCircleStore((s) => s.setCreateModalOpen);

  return useMutation({
    mutationFn: async (input: CreateCircleInput) => {
      const res = await apiRequest<CircleEntity>('/circles', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    onSuccess: (newCircle) => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.all });
      setActiveCircle(newCircle);
      setCreateModalOpen(false);
    },
  });
}
