import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mobileApiRequest } from '../services/api';
import {
  CreateCircleInput,
  UpdateCircleInput,
  JoinCircleInput,
  CreateInviteInput,
  ReviewJoinRequestInput,
  AddMembersInput,
  CreateMomentInput,
} from '@circle/shared';
import {
  CircleDetailResponse,
  CircleEntity,
  CircleMemberEntity,
  CircleInviteEntity,
  CircleJoinRequestEntity,
  SelectableFriendItem,
} from '@circle/types';
import { useCircleStore } from '../stores/circle.store';

export const CIRCLE_KEYS = {
  all: ['circles'] as const,
  lists: () => [...CIRCLE_KEYS.all, 'list'] as const,
  detail: (idOrHandle: string) => [...CIRCLE_KEYS.all, 'detail', idOrHandle] as const,
  friends: () => [...CIRCLE_KEYS.all, 'friends', 'selectable'] as const,
  members: (circleId: string) => [...CIRCLE_KEYS.all, circleId, 'members'] as const,
  invites: (circleId: string) => [...CIRCLE_KEYS.all, circleId, 'invites'] as const,
  joinRequests: (circleId: string) => [...CIRCLE_KEYS.all, circleId, 'join-requests'] as const,
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
      const res = await mobileApiRequest<SelectableFriendItem[]>('/circles/friends/selectable');
      return res.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useMyCirclesQuery() {
  return useQuery({
    queryKey: CIRCLE_KEYS.lists(),
    queryFn: async () => {
      const res = await mobileApiRequest<CircleListItem[]>('/circles');
      return res.data || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCircleDetailQuery(idOrHandle: string | null) {
  return useQuery({
    queryKey: CIRCLE_KEYS.detail(idOrHandle || ''),
    queryFn: async () => {
      if (!idOrHandle) return null;
      const res = await mobileApiRequest<CircleDetailResponse>(`/circles/${idOrHandle}`);
      return res.data || null;
    },
    enabled: Boolean(idOrHandle),
  });
}

export function useCreateCircleMutation() {
  const queryClient = useQueryClient();
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const setCreateModalVisible = useCircleStore((s) => s.setCreateModalVisible);

  return useMutation({
    mutationFn: async (input: CreateCircleInput) => {
      const res = await mobileApiRequest<CircleEntity>('/circles', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    onSuccess: (newCircle) => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.all });
      if (newCircle) {
        setActiveCircle(newCircle);
      }
      setCreateModalVisible(false);
    },
  });
}

export function useUpdateCircleMutation(circleId: string) {
  const queryClient = useQueryClient();
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);

  return useMutation({
    mutationFn: async (input: UpdateCircleInput) => {
      const res = await mobileApiRequest<CircleEntity>(`/circles/${circleId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    onSuccess: (updatedCircle) => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.detail(circleId) });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.all });
      if (updatedCircle) {
        setActiveCircle(updatedCircle);
      }
    },
  });
}

export function useJoinCircleMutation() {
  const queryClient = useQueryClient();
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const setJoinModalVisible = useCircleStore((s) => s.setJoinModalVisible);

  return useMutation({
    mutationFn: async (input: JoinCircleInput) => {
      const res = await mobileApiRequest<CircleEntity>('/circles/join', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    onSuccess: (joinedCircle) => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.all });
      if (joinedCircle) {
        setActiveCircle(joinedCircle);
      }
      setJoinModalVisible(false);
    },
  });
}

export function useCircleMembersQuery(circleId: string | null) {
  return useQuery({
    queryKey: CIRCLE_KEYS.members(circleId || ''),
    queryFn: async () => {
      if (!circleId) return [];
      const res = await mobileApiRequest<CircleMemberEntity[]>(`/circles/${circleId}/members`);
      return res.data || [];
    },
    enabled: Boolean(circleId),
  });
}

export function useCircleInvitesQuery(circleId: string | null, isOwnerOrAdmin = false) {
  return useQuery({
    queryKey: CIRCLE_KEYS.invites(circleId || ''),
    queryFn: async () => {
      if (!circleId || !isOwnerOrAdmin) return [];
      const res = await mobileApiRequest<CircleInviteEntity[]>(`/circles/${circleId}/invites`);
      return res.data || [];
    },
    enabled: Boolean(circleId) && isOwnerOrAdmin,
  });
}

export function useCircleJoinRequestsQuery(circleId: string | null, isOwnerOrAdmin = false) {
  return useQuery({
    queryKey: CIRCLE_KEYS.joinRequests(circleId || ''),
    queryFn: async () => {
      if (!circleId || !isOwnerOrAdmin) return [];
      const res = await mobileApiRequest<CircleJoinRequestEntity[]>(
        `/circles/${circleId}/join-requests`,
      );
      return res.data || [];
    },
    enabled: Boolean(circleId) && isOwnerOrAdmin,
  });
}

export function useAddMembersMutation(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddMembersInput) => {
      const res = await mobileApiRequest<CircleMemberEntity[]>(`/circles/${circleId}/members`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.members(circleId) });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.detail(circleId) });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.lists() });
    },
  });
}

export function useRemoveMemberMutation(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const res = await mobileApiRequest<{ success: boolean }>(
        `/circles/${circleId}/members/${memberId}`,
        {
          method: 'DELETE',
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.members(circleId) });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.detail(circleId) });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.lists() });
    },
  });
}

export function useUpdateNicknameMutation(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      nickname,
    }: {
      memberId: string;
      nickname: string | null;
    }) => {
      const res = await mobileApiRequest<CircleMemberEntity>(
        `/circles/${circleId}/members/${memberId}/nickname`,
        {
          method: 'PATCH',
          body: JSON.stringify({ nickname }),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.members(circleId) });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.detail(circleId) });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.lists() });
    },
  });
}

export function useReviewJoinRequestMutation(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      input,
    }: {
      requestId: string;
      input: ReviewJoinRequestInput;
    }) => {
      const res = await mobileApiRequest<CircleJoinRequestEntity>(
        `/circles/${circleId}/join-requests/${requestId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(input),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.joinRequests(circleId) });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.members(circleId) });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.detail(circleId) });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.lists() });
    },
  });
}

export function useCreateInviteMutation(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInviteInput) => {
      const res = await mobileApiRequest<CircleInviteEntity>(`/circles/${circleId}/invites`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.invites(circleId) });
    },
  });
}

export function useTransferOwnershipMutation(circleId: string) {
  const queryClient = useQueryClient();
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);

  return useMutation({
    mutationFn: async (newOwnerMemberId: string) => {
      const res = await mobileApiRequest<CircleEntity>(
        `/circles/${circleId}/transfer-ownership`,
        {
          method: 'POST',
          body: JSON.stringify({ newOwnerMemberId }),
        },
      );
      return res.data;
    },
    onSuccess: (updatedCircle) => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.members(circleId) });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.detail(circleId) });
      if (updatedCircle) {
        setActiveCircle(updatedCircle);
      }
    },
  });
}

export function useLeaveCircleMutation(circleId: string) {
  const queryClient = useQueryClient();
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const setManageModalVisible = useCircleStore((s) => s.setManageModalVisible);

  return useMutation({
    mutationFn: async () => {
      const res = await mobileApiRequest<{ success: boolean }>(`/circles/${circleId}/leave`, {
        method: 'POST',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.all });
      setActiveCircle(null);
      setManageModalVisible(false);
    },
  });
}

export function useDeleteCircleMutation(circleId: string) {
  const queryClient = useQueryClient();
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const setManageModalVisible = useCircleStore((s) => s.setManageModalVisible);

  return useMutation({
    mutationFn: async () => {
      const res = await mobileApiRequest<{ success: boolean }>(`/circles/${circleId}`, {
        method: 'DELETE',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.all });
      setActiveCircle(null);
      setManageModalVisible(false);
    },
  });
}

export function useCircleMomentsQuery(circleId: string | null) {
  return useQuery({
    queryKey: ['moments', 'circle', circleId],
    queryFn: async () => {
      if (!circleId) return [];
      const res = await mobileApiRequest<any[]>(`/moments/circle/${circleId}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return (res as any)?.data || (Array.isArray(res) ? res : []);
    },
    enabled: Boolean(circleId),
    refetchInterval: 3000,
  });
}

export function useChannelMessagesQuery(channelId: string | null) {
  return useQuery({
    queryKey: ['messages', 'channel', channelId],
    queryFn: async () => {
      if (!channelId) return { messages: [], nextCursor: null, hasMore: false };
      const res = await mobileApiRequest<any>(`/channels/${channelId}/messages`);
      const data = res.data;
      const list = data?.messages || data?.items || (Array.isArray(data) ? data : []);
      return {
        messages: list,
        nextCursor: data?.nextCursor || null,
        hasMore: Boolean(data?.hasMore),
      };
    },
    enabled: Boolean(channelId),
    refetchInterval: 3000, // Light polling for mobile sync
  });
}

export function useSendMessageMutation(channelId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: string | { content: string; replyToId?: string }) => {
      if (!channelId) throw new Error('No channel ID');
      const payload = typeof input === 'string' ? { content: input.trim() } : input;
      const res = await mobileApiRequest<any>(`/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: (newMsg) => {
      if (channelId) {
        if (newMsg) {
          queryClient.setQueryData(['messages', 'channel', channelId], (old: any) => {
            if (!old) return { messages: [newMsg], nextCursor: null, hasMore: false };
            const list = old.messages || old.items || [];
            const exists = list.some((m: any) => m.id === newMsg.id);
            return {
              ...old,
              messages: exists ? list : [...list, newMsg],
            };
          });
        }
        queryClient.invalidateQueries({ queryKey: ['messages', 'channel', channelId] });
      }
    },
  });
}

export function useReactMessageMutation(channelId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const res = await mobileApiRequest<any>(`/messages/${messageId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
      return res.data;
    },
    onSuccess: (resData, variables) => {
      if (channelId && resData) {
        queryClient.setQueryData(['messages', 'channel', channelId], (old: any) => {
          if (!old) return old;
          const list = old.messages || old.items || [];
          const updated = list.map((m: any) => {
            if (m.id !== variables.messageId) return m;
            return {
              ...m,
              reactionCounts: resData.reactionCounts,
              userReactions: resData.userReactions,
            };
          });
          return { ...old, messages: updated };
        });
        queryClient.invalidateQueries({ queryKey: ['messages', 'channel', channelId] });
      }
    },
  });
}

export function usePinMessageMutation(channelId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, isPinned }: { messageId: string; isPinned: boolean }) => {
      const method = isPinned ? 'DELETE' : 'POST';
      const res = await mobileApiRequest<any>(`/messages/${messageId}/pin`, {
        method,
      });
      return res.data;
    },
    onSuccess: () => {
      if (channelId) {
        queryClient.invalidateQueries({ queryKey: ['messages', 'channel', channelId] });
      }
    },
  });
}

export function useReactMomentMutation(circleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ momentId, emoji }: { momentId: string; emoji: string }) => {
      const res = await mobileApiRequest<any>(`/moments/${momentId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
      return res.data;
    },
    onSuccess: () => {
      if (circleId) {
        queryClient.invalidateQueries({ queryKey: ['moments', 'circle', circleId] });
      }
    },
  });
}

export function useCreateMomentMutation(circleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMomentInput) => {
      const res = await mobileApiRequest<any>('/moments', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return (res as any)?.data || res;
    },
    onSuccess: (newMoment) => {
      if (circleId) {
        if (newMoment && newMoment.id) {
          queryClient.setQueryData(['moments', 'circle', circleId], (old: any) => {
            const list = Array.isArray(old) ? old : Array.isArray(old?.data) ? old.data : [];
            const exists = list.some((m: any) => m.id === newMoment.id);
            return exists ? list : [newMoment, ...list];
          });
        }
        queryClient.invalidateQueries({ queryKey: ['moments', 'circle', circleId] });
      }
      queryClient.invalidateQueries({ queryKey: ['moments', 'feed'] });
    },
  });
}

export function useReplyMomentMutation(circleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      momentId,
      message,
      targetCircleId,
    }: {
      momentId: string;
      message: string;
      targetCircleId?: string;
    }) => {
      const actualCircleId = targetCircleId || circleId;
      if (!actualCircleId) throw new Error('No circle ID provided');
      const res = await mobileApiRequest<any>(`/moments/${momentId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: message.trim(), circleId: actualCircleId }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

