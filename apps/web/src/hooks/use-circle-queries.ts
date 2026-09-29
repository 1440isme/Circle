import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import {
  CreateCircleInput,
  UpdateCircleInput,
  JoinCircleInput,
  CreateInviteInput,
  ReviewJoinRequestInput,
  AddMembersInput,
} from '@circle/shared';
import {
  CircleDetailResponse,
  CircleEntity,
  CircleMemberEntity,
  CircleInviteEntity,
  CircleJoinRequestEntity,
  SelectableFriendItem,
  MemberRole,
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

export function useUpdateCircleMutation(circleId: string) {
  const queryClient = useQueryClient();
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);

  return useMutation({
    mutationFn: async (input: UpdateCircleInput) => {
      const res = await apiRequest<CircleEntity>(`/circles/${circleId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    onSuccess: (updatedCircle) => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.detail(circleId) });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.lists() });
      setActiveCircle(updatedCircle);
    },
  });
}

export function useJoinCircleMutation() {
  const queryClient = useQueryClient();
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const setJoinModalOpen = useCircleStore((s) => s.setJoinModalOpen);

  return useMutation({
    mutationFn: async (input: JoinCircleInput) => {
      const res = await apiRequest<CircleEntity>('/circles/join', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    onSuccess: (joinedCircle) => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.all });
      setActiveCircle(joinedCircle);
      setJoinModalOpen(false);
    },
  });
}

export function useCircleMembersQuery(circleId: string | null) {
  return useQuery({
    queryKey: CIRCLE_KEYS.members(circleId || ''),
    queryFn: async () => {
      if (!circleId) return [];
      const res = await apiRequest<CircleMemberEntity[]>(`/circles/${circleId}/members`);
      return res.data;
    },
    enabled: Boolean(circleId),
  });
}

export function useCircleInvitesQuery(circleId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: CIRCLE_KEYS.invites(circleId || ''),
    queryFn: async () => {
      if (!circleId) return [];
      const res = await apiRequest<CircleInviteEntity[]>(`/circles/${circleId}/invites`);
      return res.data;
    },
    enabled: Boolean(circleId) && enabled,
  });
}

export function useCircleJoinRequestsQuery(circleId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: CIRCLE_KEYS.joinRequests(circleId || ''),
    queryFn: async () => {
      if (!circleId) return [];
      const res = await apiRequest<CircleJoinRequestEntity[]>(`/circles/${circleId}/join-requests`);
      return res.data;
    },
    enabled: Boolean(circleId) && enabled,
  });
}

export function useCreateInviteMutation(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInviteInput) => {
      const res = await apiRequest<CircleInviteEntity>(`/circles/${circleId}/invites`, {
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


export function useRemoveMemberMutation(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const res = await apiRequest<{ success: boolean }>(`/circles/${circleId}/members/${memberId}`, {
        method: 'DELETE',
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

export function useLeaveCircleMutation(circleId: string) {
  const queryClient = useQueryClient();
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);

  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest<{ success: boolean }>(`/circles/${circleId}/leave`, {
        method: 'POST',
      });
      return res.data;
    },
    onSuccess: () => {
      setActiveCircle(null);
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.all });
    },
  });
}

export function useTransferOwnershipMutation(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newOwnerMemberId: string) => {
      const res = await apiRequest<{ success: boolean }>(`/circles/${circleId}/transfer-ownership`, {
        method: 'POST',
        body: JSON.stringify({ newOwnerMemberId }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.members(circleId) });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.detail(circleId) });
    },
  });
}

export function useReviewJoinRequestMutation(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: 'APPROVED' | 'REJECTED' }) => {
      const res = await apiRequest<{ success: boolean }>(`/circles/${circleId}/join-requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.joinRequests(circleId) });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.members(circleId) });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.detail(circleId) });
    },
  });
}

export function useUpdateMemberNicknameMutation(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, nickname }: { memberId: string; nickname?: string | null }) => {
      const res = await apiRequest<CircleMemberEntity>(
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
    },
  });
}

export function useAddCircleMembersMutation(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberIds: string[]) => {
      const res = await apiRequest<{ success: boolean; addedCount: number }>(
        `/circles/${circleId}/members`,
        {
          method: 'POST',
          body: JSON.stringify({ memberIds }),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.members(circleId) });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.detail(circleId) });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CIRCLE_KEYS.friends() });
    },
  });
}
