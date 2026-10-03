import { useEffect, useState, useRef, useCallback } from 'react';
import { useMutation, useQuery, useInfiniteQuery, InfiniteData, useQueryClient } from '@tanstack/react-query';
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
  MessageEntity,
  MessageType,
  CursorPaginatedMessages,
} from '@circle/types';
import { useCircleStore } from '../stores/circle.store';
import {
  getMobileSocket,
  joinMobileChannelRoom,
  leaveMobileChannelRoom,
  sendMobileTypingStatus,
} from '../services/socket';

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

function deduplicateMessages(list: MessageEntity[]): MessageEntity[] {
  const seen = new Set<string>();
  const result: MessageEntity[] = [];
  for (const m of list) {
    const key = m.id || m.tempId;
    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    result.push(m);
  }
  return result;
}

export function useChannelMessagesQuery(channelId: string | null) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<CursorPaginatedMessages>({
    queryKey: ['messages', 'channel', channelId],
    queryFn: async ({ pageParam }) => {
      if (!channelId) return { messages: [], nextCursor: null, hasMore: false };
      const cursorParam = pageParam ? `&cursor=${encodeURIComponent(pageParam as string)}` : '';
      const res = await mobileApiRequest<CursorPaginatedMessages>(
        `/channels/${channelId}/messages?limit=30${cursorParam}`,
      );
      const data = res.data;
      const list = data?.messages || (data as any)?.items || (Array.isArray(data) ? data : []);
      return {
        messages: deduplicateMessages(list),
        nextCursor: data?.nextCursor || null,
        hasMore: Boolean(data?.hasMore),
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage?.hasMore ? lastPage.nextCursor : undefined),
    enabled: Boolean(channelId),
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (!channelId) return;
    let isCancelled = false;
    let activeSocket: any = null;

    joinMobileChannelRoom(channelId);

    const handleNewMessage = (newMsg: MessageEntity) => {
      if (newMsg.channelId !== channelId) return;

      queryClient.setQueryData<InfiniteData<CursorPaginatedMessages>>(
        ['messages', 'channel', channelId],
        (oldData) => {
          if (!oldData || oldData.pages.length === 0) {
            return {
              pageParams: [null],
              pages: [{ messages: [{ ...newMsg, status: 'SENT' as const }], nextCursor: null, hasMore: false }],
            };
          }

          const incomingTempId = newMsg.tempId;
          let replaced = false;
          const updatedPages = oldData.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) => {
              if (
                (Boolean(incomingTempId) && (m.tempId === incomingTempId || m.id === incomingTempId)) ||
                (m.status === 'SENDING' &&
                  ((m.content && m.content === newMsg.content) || (m.fileUrl && m.fileUrl === newMsg.fileUrl)) &&
                  Math.abs(new Date(m.sentAt).getTime() - new Date(newMsg.sentAt).getTime()) < 20000)
              ) {
                replaced = true;
                return { ...newMsg, status: 'SENT' as const };
              }
              return m;
            }),
          }));

          if (replaced) {
            return { ...oldData, pages: updatedPages };
          }

          // Check if message already exists
          const exists = updatedPages.some((page) =>
            page.messages.some((m) => m.id === newMsg.id && !m.tempId),
          );
          if (exists) return oldData;

          // Append to latest page (pages[0])
          const firstPage = updatedPages[0];
          updatedPages[0] = {
            ...firstPage,
            messages: deduplicateMessages([...firstPage.messages, { ...newMsg, status: 'SENT' as const }]),
          };

          return { ...oldData, pages: updatedPages };
        },
      );
    };

    const handleReaction = (payload: {
      messageId: string;
      memberId: string;
      emoji: string;
      reactionCounts: Record<string, number>;
      userReactions: string[];
    }) => {
      queryClient.setQueryData<InfiniteData<CursorPaginatedMessages>>(
        ['messages', 'channel', channelId],
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) =>
                m.id === payload.messageId
                  ? {
                      ...m,
                      reactionCounts: payload.reactionCounts,
                      userReactions: payload.userReactions,
                    }
                  : m,
              ),
            })),
          };
        },
      );
    };

    getMobileSocket().then((socket) => {
      if (!socket || isCancelled) return;
      activeSocket = socket;
      socket.on('chat:message', handleNewMessage);
      socket.on('chat:reaction', handleReaction);
    });

    return () => {
      isCancelled = true;
      if (activeSocket) {
        activeSocket.off('chat:message', handleNewMessage);
        activeSocket.off('chat:reaction', handleReaction);
      }
      leaveMobileChannelRoom(channelId);
    };
  }, [channelId, queryClient]);

  // Flatten and deduplicate all messages across pages, sorted chronologically (oldest to newest)
  const rawList = query.data?.pages.flatMap((page) => page.messages) || [];
  const deduplicated = deduplicateMessages(rawList);
  deduplicated.sort(
    (a, b) => new Date(a.sentAt || 0).getTime() - new Date(b.sentAt || 0).getTime(),
  );

  return {
    ...query,
    messages: deduplicated,
  };
}

export type SendMobileMessageInput =
  | string
  | {
      content?: string;
      type?: MessageType;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      replyToId?: string;
      tempId?: string;
    };

export function useSendMessageMutation(channelId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendMobileMessageInput) => {
      if (!channelId) throw new Error('No channel ID');
      const payload = typeof input === 'string' ? { content: input.trim() } : input;
      const { tempId, ...cleanPayload } = payload as any;
      const res = await mobileApiRequest<any>(`/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify(cleanPayload),
      });
      return { message: res.data, tempId };
    },
    onMutate: async (input) => {
      if (!channelId) return;

      const tempId =
        typeof input === 'object' && input.tempId
          ? input.tempId
          : `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const optimisticMsg: MessageEntity = {
        id: tempId,
        tempId,
        channelId,
        memberId: 'optimistic_me',
        type: typeof input === 'object' && input.type ? input.type : MessageType.TEXT,
        content: typeof input === 'string' ? input.trim() : input.content?.trim() || null,
        fileUrl: typeof input === 'object' ? input.fileUrl : null,
        fileName: typeof input === 'object' ? input.fileName : null,
        fileSize: typeof input === 'object' ? input.fileSize : null,
        replyToId: typeof input === 'object' ? input.replyToId : null,
        sentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'SENDING',
      };

      queryClient.setQueryData<InfiniteData<CursorPaginatedMessages>>(
        ['messages', 'channel', channelId],
        (oldData) => {
          if (!oldData || oldData.pages.length === 0) {
            return {
              pageParams: [null],
              pages: [{ messages: [optimisticMsg], nextCursor: null, hasMore: false }],
            };
          }
          const updatedPages = [...oldData.pages];
          updatedPages[0] = {
            ...updatedPages[0],
            messages: deduplicateMessages([...updatedPages[0].messages, optimisticMsg]),
          };
          return { ...oldData, pages: updatedPages };
        },
      );

      return { tempId };
    },
    onSuccess: (data: any, variables: any, context: any) => {
      if (channelId) {
        const message = data?.message || data;
        const activeTempId =
          data?.tempId ||
          (typeof variables === 'object' ? variables?.tempId : undefined) ||
          context?.tempId;

        queryClient.setQueryData<InfiniteData<CursorPaginatedMessages>>(
          ['messages', 'channel', channelId],
          (oldData) => {
            if (!oldData) return oldData;

            // If socket already added this exact message ID, remove the temp placeholder
            const alreadyHasRealId =
              Boolean(message?.id) &&
              oldData.pages.some((page) =>
                page.messages.some(
                  (m) =>
                    m.id === message.id &&
                    (!activeTempId || (m.id !== activeTempId && m.tempId !== activeTempId)),
                ),
              );

            if (alreadyHasRealId) {
              if (activeTempId) {
                return {
                  ...oldData,
                  pages: oldData.pages.map((page) => ({
                    ...page,
                    messages: page.messages.filter(
                      (m) => m.tempId !== activeTempId && m.id !== activeTempId,
                    ),
                  })),
                };
              }
              return oldData;
            }

            let matched = false;
            const updatedPages = oldData.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) => {
                if (
                  Boolean(activeTempId) &&
                  (m.tempId === activeTempId || m.id === activeTempId)
                ) {
                  matched = true;
                  return { ...message, status: 'SENT' as const };
                }
                return m;
              }),
            }));

            if (!matched) {
              updatedPages[0] = {
                ...updatedPages[0],
                messages: deduplicateMessages([
                  ...updatedPages[0].messages,
                  { ...message, status: 'SENT' as const },
                ]),
              };
            }

            return { ...oldData, pages: updatedPages };
          },
        );
      }
    },
    onError: (_err, _input, context: any) => {
      const activeTempId = context?.tempId;
      if (channelId && activeTempId) {
        queryClient.setQueryData<InfiniteData<CursorPaginatedMessages>>(
          ['messages', 'channel', channelId],
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                messages: page.messages.map((m) =>
                  m.tempId === activeTempId || m.id === activeTempId
                    ? { ...m, status: 'FAILED' as const }
                    : m,
                ),
              })),
            };
          },
        );
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

/**
 * Hook to manage real-time typing indicators in mobile channel chat.
 */
export function useMobileChannelTyping(channelId: string | null) {
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; userName: string }>>([]);
  const typingTimeoutsRef = useRef<Map<string, any>>(new Map());
  const myTypingTimerRef = useRef<any>(null);

  useEffect(() => {
    if (!channelId) return;
    let unsubscribed = false;

    getMobileSocket().then((socket) => {
      if (!socket || unsubscribed) return;

      const handleUserTyping = (data: {
        channelId: string;
        userId: string;
        userName?: string;
        isTyping: boolean;
      }) => {
        if (data.channelId !== channelId) return;

        const { userId, isTyping, userName } = data;
        const resolvedName = userName || 'Thành viên';
        const timeouts = typingTimeoutsRef.current;

        if (isTyping) {
          if (timeouts.has(userId)) {
            clearTimeout(timeouts.get(userId));
          }

          setTypingUsers((prev) => {
            const filtered = prev.filter((u) => u.userId !== userId);
            return [...filtered, { userId, userName: resolvedName }];
          });

          const timeout = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
            timeouts.delete(userId);
          }, 3000);

          timeouts.set(userId, timeout);
        } else {
          if (timeouts.has(userId)) {
            clearTimeout(timeouts.get(userId));
            timeouts.delete(userId);
          }
          setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        }
      };

      socket.on('chat:user-typing', handleUserTyping);

      return () => {
        socket.off('chat:user-typing', handleUserTyping);
      };
    });

    return () => {
      unsubscribed = true;
      typingTimeoutsRef.current.forEach((t) => clearTimeout(t));
      typingTimeoutsRef.current.clear();
    };
  }, [channelId]);

  const reportTyping = useCallback(
    (isTyping: boolean, userName?: string) => {
      if (!channelId) return;
      sendMobileTypingStatus(channelId, isTyping, userName);

      if (myTypingTimerRef.current) {
        clearTimeout(myTypingTimerRef.current);
      }

      if (isTyping) {
        myTypingTimerRef.current = setTimeout(() => {
          sendMobileTypingStatus(channelId, false, userName);
          myTypingTimerRef.current = null;
        }, 2500);
      }
    },
    [channelId],
  );

  return { typingUsers, reportTyping };
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

