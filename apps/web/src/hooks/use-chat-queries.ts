import { useEffect, useState, useRef, useCallback } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  InfiniteData,
} from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import {
  getSocket,
  joinChannelRoom,
  leaveChannelRoom,
  sendTypingStatus,
} from '../lib/socket';
import {
  CursorPaginatedMessages,
  MessageEntity,
  MessageType,
} from '@circle/types';
import {
  SendMessageInput,
  ReactMessageInput,
} from '@circle/shared';

export const CHAT_KEYS = {
  all: ['chat'] as const,
  messages: (channelId: string) => [...CHAT_KEYS.all, 'messages', channelId] as const,
  pins: (channelId: string) => [...CHAT_KEYS.all, 'pins', channelId] as const,
};

/**
 * Hook to fetch messages for a channel with infinite scrolling and realtime updates.
 */
export function useChannelMessagesQuery(channelId: string | null) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<CursorPaginatedMessages>({
    queryKey: CHAT_KEYS.messages(channelId || ''),
    queryFn: async ({ pageParam }) => {
      if (!channelId) {
        return { messages: [], nextCursor: null, hasMore: false };
      }
      const cursorParam = pageParam ? `&cursor=${encodeURIComponent(pageParam as string)}` : '';
      const res = await apiRequest<CursorPaginatedMessages>(
        `/channels/${channelId}/messages?limit=50${cursorParam}`,
      );
      return res.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled: Boolean(channelId),
    staleTime: 1000 * 30, // 30 seconds
  });

  // Socket.IO realtime listeners for this channel
  useEffect(() => {
    if (!channelId) return;

    joinChannelRoom(channelId);
    const socket = getSocket();

    const handleNewMessage = (newMessage: MessageEntity) => {
      if (newMessage.channelId !== channelId) return;

      queryClient.setQueryData<InfiniteData<CursorPaginatedMessages>>(
        CHAT_KEYS.messages(channelId),
        (oldData) => {
          if (!oldData || oldData.pages.length === 0) {
            return {
              pageParams: [null],
              pages: [{ messages: [{ ...newMessage, status: 'SENT' as const }], nextCursor: null, hasMore: false }],
            };
          }

          let replaced = false;
          const updatedPages = oldData.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) => {
              if (
                (m.tempId && (m.tempId === newMessage.tempId || m.id === newMessage.tempId)) ||
                (m.status === 'SENDING' &&
                  m.content === newMessage.content &&
                  Math.abs(new Date(m.sentAt).getTime() - new Date(newMessage.sentAt).getTime()) < 15000)
              ) {
                replaced = true;
                return { ...newMessage, status: 'SENT' as const };
              }
              return m;
            }),
          }));

          if (replaced) {
            return { ...oldData, pages: updatedPages };
          }

          // Check if message already exists in any page (prevent duplicates)
          const exists = updatedPages.some((page) =>
            page.messages.some((m) => m.id === newMessage.id),
          );
          if (exists) return oldData;

          // Append to the last page
          const lastPageIndex = updatedPages.length - 1;
          updatedPages[lastPageIndex] = {
            ...updatedPages[lastPageIndex],
            messages: [...updatedPages[lastPageIndex].messages, { ...newMessage, status: 'SENT' as const }],
          };

          return {
            ...oldData,
            pages: updatedPages,
          };
        },
      );
    };

    const handleReaction = (payload: {
      messageId: string;
      memberId: string;
      emoji: string;
      added: boolean;
      userReactions: string[];
      reactionCounts: Record<string, number>;
    }) => {
      queryClient.setQueryData<InfiniteData<CursorPaginatedMessages>>(
        CHAT_KEYS.messages(channelId),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) => {
                if (m.id !== payload.messageId) return m;
                return {
                  ...m,
                  reactionCounts: payload.reactionCounts,
                  userReactions: payload.userReactions,
                };
              }),
            })),
          };
        },
      );
    };

    const handlePin = (payload: { messageId: string }) => {
      queryClient.setQueryData<InfiniteData<CursorPaginatedMessages>>(
        CHAT_KEYS.messages(channelId),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) =>
                m.id === payload.messageId ? { ...m, isPinned: true } : m,
              ),
            })),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.pins(channelId) });
    };

    const handleUnpin = (payload: { messageId: string }) => {
      queryClient.setQueryData<InfiniteData<CursorPaginatedMessages>>(
        CHAT_KEYS.messages(channelId),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) =>
                m.id === payload.messageId ? { ...m, isPinned: false } : m,
              ),
            })),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.pins(channelId) });
    };

    if (socket) {
      socket.on('chat:message', handleNewMessage);
      socket.on('chat:reaction', handleReaction);
      socket.on('chat:pin', handlePin);
      socket.on('chat:unpin', handleUnpin);
    }

    return () => {
      if (socket) {
        socket.off('chat:message', handleNewMessage);
        socket.off('chat:reaction', handleReaction);
        socket.off('chat:pin', handlePin);
        socket.off('chat:unpin', handleUnpin);
      }
      leaveChannelRoom(channelId);
    };
  }, [channelId, queryClient]);

  // Flatten all messages across pages
  const messages = query.data?.pages.flatMap((page) => page.messages) || [];

  return {
    ...query,
    messages,
  };
}

/**
 * Mutation to send a message in a channel.
 */
export function useSendMessageMutation(channelId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendMessageInput & { tempId?: string }) => {
      if (!channelId) throw new Error('Channel ID is required');
      const { tempId, ...cleanInput } = input;
      const res = await apiRequest<MessageEntity>(`/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify(cleanInput),
      });
      return { message: res.data, tempId };
    },
    onMutate: async (input) => {
      if (!channelId) return;

      const tempId =
        input.tempId || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const optimisticMessage: MessageEntity = {
        id: tempId,
        tempId,
        channelId,
        memberId: 'optimistic_me',
        type: (input.type as MessageType) || MessageType.TEXT,
        content: input.content || null,
        fileUrl: input.fileUrl || null,
        fileName: input.fileName || null,
        fileSize: input.fileSize || null,
        replyToId: input.replyToId || null,
        sentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'SENDING',
      };

      queryClient.setQueryData<InfiniteData<CursorPaginatedMessages>>(
        CHAT_KEYS.messages(channelId),
        (oldData) => {
          if (!oldData || oldData.pages.length === 0) {
            return {
              pageParams: [null],
              pages: [{ messages: [optimisticMessage], nextCursor: null, hasMore: false }],
            };
          }
          const lastPageIndex = oldData.pages.length - 1;
          const updatedPages = [...oldData.pages];
          updatedPages[lastPageIndex] = {
            ...updatedPages[lastPageIndex],
            messages: [...updatedPages[lastPageIndex].messages, optimisticMessage],
          };
          return { ...oldData, pages: updatedPages };
        },
      );

      return { tempId };
    },
    onSuccess: ({ message, tempId }) => {
      if (!channelId) return;

      queryClient.setQueryData<InfiniteData<CursorPaginatedMessages>>(
        CHAT_KEYS.messages(channelId),
        (oldData) => {
          if (!oldData) return oldData;

          let replaced = false;
          const updatedPages = oldData.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) => {
              if (m.tempId === tempId || m.id === tempId) {
                replaced = true;
                return { ...message, status: 'SENT' as const };
              }
              return m;
            }),
          }));

          const alreadyExists = updatedPages.some((page) =>
            page.messages.some((m) => m.id === message.id),
          );

          if (!replaced && !alreadyExists) {
            const lastPageIndex = updatedPages.length - 1;
            updatedPages[lastPageIndex] = {
              ...updatedPages[lastPageIndex],
              messages: [
                ...updatedPages[lastPageIndex].messages,
                { ...message, status: 'SENT' as const },
              ],
            };
          }

          return { ...oldData, pages: updatedPages };
        },
      );
    },
    onError: (_err, _input, context) => {
      if (!channelId || !context?.tempId) return;
      queryClient.setQueryData<InfiniteData<CursorPaginatedMessages>>(
        CHAT_KEYS.messages(channelId),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) => {
                if (m.tempId === context.tempId || m.id === context.tempId) {
                  return { ...m, status: 'FAILED' as const };
                }
                return m;
              }),
            })),
          };
        },
      );
    },
  });
}

/**
 * Mutation to react to a message with an emoji.
 */
export function useReactMessageMutation(channelId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const res = await apiRequest<{
        messageId: string;
        memberId: string;
        emoji: string;
        added: boolean;
        userReactions: string[];
        reactionCounts: Record<string, number>;
      }>(`/messages/${messageId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji } as ReactMessageInput),
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (!channelId) return;
      queryClient.setQueryData<InfiniteData<CursorPaginatedMessages>>(
        CHAT_KEYS.messages(channelId),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) => {
                if (m.id !== data.messageId) return m;
                return {
                  ...m,
                  reactionCounts: data.reactionCounts,
                  userReactions: data.userReactions,
                };
              }),
            })),
          };
        },
      );
    },
  });
}

/**
 * Mutation to pin or unpin a message.
 */
export function usePinMessageMutation(channelId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, isPinned }: { messageId: string; isPinned: boolean }) => {
      if (isPinned) {
        const res = await apiRequest(`/messages/${messageId}/pin`, { method: 'DELETE' });
        return { messageId, isPinned: false, data: res.data };
      } else {
        const res = await apiRequest(`/messages/${messageId}/pin`, { method: 'POST' });
        return { messageId, isPinned: true, data: res.data };
      }
    },
    onSuccess: ({ messageId, isPinned }) => {
      if (!channelId) return;
      queryClient.setQueryData<InfiniteData<CursorPaginatedMessages>>(
        CHAT_KEYS.messages(channelId),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) =>
                m.id === messageId ? { ...m, isPinned } : m,
              ),
            })),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.pins(channelId) });
    },
  });
}

/**
 * Hook to fetch all pinned messages in a channel.
 */
export function usePinnedMessagesQuery(channelId: string | null) {
  return useQuery({
    queryKey: CHAT_KEYS.pins(channelId || ''),
    queryFn: async () => {
      if (!channelId) return [];
      const res = await apiRequest<MessageEntity[]>(`/channels/${channelId}/pins`);
      return res.data;
    },
    enabled: Boolean(channelId),
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to manage typing indicators in a channel.
 */
export interface TypingUser {
  userId: string;
  userName: string;
}

export function useChannelTyping(channelId: string | null) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const myTypingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!channelId) return;

    const socket = getSocket();
    if (!socket) return;

    const handleUserTyping = (data: {
      channelId: string;
      userId: string;
      userName?: string;
      isTyping: boolean;
    }) => {
      if (data.channelId !== channelId) return;

      const { userId, isTyping, userName } = data;
      const timeouts = typingTimeoutsRef.current;
      const resolvedName = userName || 'Thành viên';

      if (isTyping) {
        if (timeouts.has(userId)) {
          clearTimeout(timeouts.get(userId)!);
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
          clearTimeout(timeouts.get(userId)!);
          timeouts.delete(userId);
        }
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
      }
    };

    socket.on('chat:user-typing', handleUserTyping);

    return () => {
      socket.off('chat:user-typing', handleUserTyping);
      typingTimeoutsRef.current.forEach((t) => clearTimeout(t));
      typingTimeoutsRef.current.clear();
    };
  }, [channelId]);

  const reportTyping = useCallback(
    (isTyping: boolean, userName?: string) => {
      if (!channelId) return;

      sendTypingStatus(channelId, isTyping, userName);

      if (myTypingTimerRef.current) {
        clearTimeout(myTypingTimerRef.current);
      }

      if (isTyping) {
        myTypingTimerRef.current = setTimeout(() => {
          sendTypingStatus(channelId, false, userName);
          myTypingTimerRef.current = null;
        }, 2500);
      }
    },
    [channelId],
  );

  return {
    typingUsers,
    reportTyping,
  };
}
