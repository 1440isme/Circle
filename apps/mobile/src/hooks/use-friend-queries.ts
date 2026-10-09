import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mobileApiRequest } from '../services/api';
import {
  FriendItem,
  FriendRequestItem,
  FriendSearchResult,
} from '@circle/types';

export const FRIEND_KEYS = {
  all: ['friends'] as const,
  list: () => [...FRIEND_KEYS.all, 'list'] as const,
  requestsReceived: () => [...FRIEND_KEYS.all, 'requests', 'received'] as const,
  requestsSent: () => [...FRIEND_KEYS.all, 'requests', 'sent'] as const,
  search: (query: string) => [...FRIEND_KEYS.all, 'search', query] as const,
};

export function useFriendsQuery() {
  return useQuery({
    queryKey: FRIEND_KEYS.list(),
    queryFn: async () => {
      const res = await mobileApiRequest<FriendItem[]>('/friends');
      return res.data;
    },
    staleTime: 1000 * 30,
  });
}

export function useReceivedFriendRequestsQuery() {
  return useQuery({
    queryKey: FRIEND_KEYS.requestsReceived(),
    queryFn: async () => {
      const res = await mobileApiRequest<FriendRequestItem[]>('/friends/requests/received');
      return res.data;
    },
    staleTime: 1000 * 20,
  });
}

export function useSentFriendRequestsQuery() {
  return useQuery({
    queryKey: FRIEND_KEYS.requestsSent(),
    queryFn: async () => {
      const res = await mobileApiRequest<FriendRequestItem[]>('/friends/requests/sent');
      return res.data;
    },
    staleTime: 1000 * 20,
  });
}

export function useSearchFriendsQuery(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: FRIEND_KEYS.search(trimmed),
    queryFn: async () => {
      const endpoint = trimmed
        ? `/friends/search?q=${encodeURIComponent(trimmed)}`
        : '/friends/search';
      const res = await mobileApiRequest<FriendSearchResult[]>(endpoint);
      return res.data;
    },
    staleTime: 1000 * 10,
  });
}

export function useSendFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const res = await mobileApiRequest<{ message: string }>('/friends/requests', {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FRIEND_KEYS.all });
    },
  });
}

export function useAcceptFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const res = await mobileApiRequest<{ message: string }>(
        `/friends/requests/${friendshipId}/accept`,
        {
          method: 'POST',
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FRIEND_KEYS.all });
    },
  });
}

export function useRejectFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const res = await mobileApiRequest<{ message: string }>(
        `/friends/requests/${friendshipId}/reject`,
        {
          method: 'POST',
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FRIEND_KEYS.all });
    },
  });
}

export function useCancelFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const res = await mobileApiRequest<{ message: string }>(
        `/friends/requests/${friendshipId}`,
        {
          method: 'DELETE',
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FRIEND_KEYS.all });
    },
  });
}

export function useUnfriendMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendId: string) => {
      const res = await mobileApiRequest<{ message: string }>(`/friends/${friendId}`, {
        method: 'DELETE',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FRIEND_KEYS.all });
    },
  });
}
