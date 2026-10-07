'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import { MessageSquare, Pin, Users, Hash, WifiOff, Phone, Video, Radio } from 'lucide-react';
import { MessageEntity, CursorPaginatedMessages, CallType, CallSessionDetailEntity } from '@circle/types';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import {
  CHAT_KEYS,
  useChannelMessagesQuery,
  useSendMessageMutation,
  useReactMessageMutation,
  usePinMessageMutation,
  usePinnedMessagesQuery,
  useChannelTyping,
} from '../../hooks/use-chat-queries';
import { useActiveCallQuery, useInitiateCallMutation } from '../../hooks/use-call-queries';
import { subscribeSocketConnection, sendMessageRead } from '../../lib/socket';
import { MessageList } from './MessageList';
import { ChatComposer } from './ChatComposer';
import { PinnedMessagesModal } from './PinnedMessagesModal';
import { CallStageModal } from '../call/CallStageModal';

interface ChannelChatViewProps {
  channelId: string;
  channelName: string;
  channelTopic?: string | null;
  circleId: string;
}

export const ChannelChatView: React.FC<ChannelChatViewProps> = ({
  channelId,
  channelName,
  channelTopic,
  circleId,
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);

  const [replyingMessage, setReplyingMessage] = useState<MessageEntity | null>(null);
  const [isPinnedModalOpen, setIsPinnedModalOpen] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(true);
  const [activeCallStageSession, setActiveCallStageSession] = useState<CallSessionDetailEntity | null>(null);

  const { data: activeCircleCall } = useActiveCallQuery(circleId);
  const initiateCallMutation = useInitiateCallMutation();

  const handleStartCall = async (callType: CallType) => {
    try {
      const res: any = await initiateCallMutation.mutateAsync({ circleId, callType });
      const session = res?.callSession || res;
      if (session && session.id) {
        setActiveCallStageSession(session);
      }
    } catch (err: any) {
      console.error('Error starting call:', err);
    }
  };

  useEffect(() => {
    return subscribeSocketConnection((connected) => {
      setIsSocketConnected(connected);
    });
  }, []);

  // Queries & Mutations
  const {
    messages,
    isLoading: isLoadingMessages,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useChannelMessagesQuery(channelId);

  // Mark latest unread message as read when channel is viewed or updated
  useEffect(() => {
    if (!channelId || !circleId || messages.length === 0 || !user?.id) return;

    try {
      const stored = localStorage.getItem(`circle_${circleId}_read_receipts`);
      if (stored === 'false') return;
    } catch {}

    const unreadMessages = messages.filter((m) => {
      const senderUserId = m.sender?.user?.id || m.sender?.userId;
      if (senderUserId === user.id || m.memberId === 'optimistic_me') return false;
      const alreadyRead = (m.readers || []).some((r) => r.userId === user.id);
      return !alreadyRead;
    });

    if (unreadMessages.length > 0) {
      const latestUnread = unreadMessages[unreadMessages.length - 1];
      sendMessageRead(channelId, latestUnread.id);

      // Optimistically add current user as reader to latestUnread immediately
      const currentReader = {
        userId: user.id,
        displayName: user.profile?.displayName || (user as any).displayName || user.email?.split('@')[0] || 'Me',
        avatarUrl: user.profile?.avatarUrl || (user as any).avatarUrl || null,
        readAt: new Date().toISOString(),
      };

      queryClient.setQueryData<InfiniteData<CursorPaginatedMessages>>(
        CHAT_KEYS.messages(channelId),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) => {
                if (m.id !== latestUnread.id) return m;
                const existing = m.readers || [];
                if (existing.some((r) => r.userId === user.id)) return m;
                return {
                  ...m,
                  readers: [...existing, currentReader],
                };
              }),
            })),
          };
        },
      );
    }
  }, [channelId, circleId, messages, user?.id, queryClient]);

  const sendMessageMutation = useSendMessageMutation(channelId);
  const reactMessageMutation = useReactMessageMutation(channelId);
  const pinMessageMutation = usePinMessageMutation(channelId);
  const { data: pinnedMessages = [], isLoading: isLoadingPins } = usePinnedMessagesQuery(channelId);
  const { typingUsers, reportTyping } = useChannelTyping(channelId);

  const handleReply = (message: MessageEntity) => {
    setReplyingMessage(message);
  };

  const handleReact = (messageId: string, emoji: string) => {
    reactMessageMutation.mutate({ messageId, emoji });
  };

  const handleTogglePin = (messageId: string, isPinned: boolean) => {
    pinMessageMutation.mutate({ messageId, isPinned });
  };

  const handleRetry = (msg: MessageEntity) => {
    sendMessageMutation.mutate({
      content: msg.content || undefined,
      type: msg.type,
      fileUrl: msg.fileUrl || undefined,
      fileName: msg.fileName || undefined,
      fileSize: msg.fileSize || undefined,
      replyToId: msg.replyToId || undefined,
      tempId: msg.tempId || msg.id,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-circle-card overflow-hidden transition-colors">
      {/* Channel Header Bar with Call Actions */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-circle-hairline dark:border-circle-dark-hairline bg-white/80 dark:bg-circle-dark-surface/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-circle-wash dark:bg-circle-dark-wash text-circle-sage dark:text-circle-primary font-bold">
            <Hash className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
              {channelName}
            </h3>
            {channelTopic && (
              <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted truncate hidden sm:block">
                {channelTopic}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls: Audio Call, Video Call */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleStartCall(CallType.AUDIO)}
            disabled={initiateCallMutation.isPending}
            className="flex h-8 w-8 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors active:scale-95 shadow-2xs"
            title="Bắt đầu phòng gọi thoại / Start Audio Call"
          >
            <Phone className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleStartCall(CallType.VIDEO)}
            disabled={initiateCallMutation.isPending}
            className="flex h-8 w-8 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors active:scale-95 shadow-2xs"
            title="Bắt đầu cuộc gọi video / Start Video Call"
          >
            <Video className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Active Call In-Progress Alert Banner */}
      {activeCircleCall && (
        <div className="flex items-center justify-between px-4 py-2 bg-emerald-500/10 dark:bg-emerald-500/15 border-b border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold truncate">
              {activeCircleCall.callType === CallType.VIDEO ? 'Phòng gọi Video' : 'Phòng đàm thoại'}{' '}
              đang diễn ra ({activeCircleCall.participants?.length || 1} người)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveCallStageSession(activeCircleCall)}
            className="flex items-center gap-1 shrink-0 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shadow-sm transition-all active:scale-95"
          >
            <span>Tham gia</span>
          </button>
        </div>
      )}

      {/* Network Reconnection Banner */}
      {!isSocketConnected && (
        <div className="flex items-center justify-center gap-2 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 py-1.5 px-4 text-xs font-medium border-b border-amber-500/20 animate-pulse transition-all">
          <WifiOff className="h-3.5 w-3.5" />
          <span>{t.chat.reconnecting}</span>
        </div>
      )}

      {/* Pinned Messages Bar (ONLY shown when pinned messages exist) */}
      {pinnedMessages.length > 0 && (
        <div className="flex items-center justify-between border-b border-circle-hairline dark:border-circle-dark-hairline px-4 py-2 bg-circle-wash/60 dark:bg-circle-dark-wash/60 backdrop-blur-sm z-10 text-xs">
          <div className="flex items-center gap-2 text-circle-charcoal dark:text-circle-dark-text font-medium truncate min-w-0 pr-2">
            <Pin className="h-3.5 w-3.5 fill-circle-primary text-circle-primary shrink-0" />
            <span className="truncate">{pinnedMessages[pinnedMessages.length - 1]?.content || t.chat.pinnedBadge}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsPinnedModalOpen(true)}
            className="flex items-center gap-1 shrink-0 rounded-full bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline px-2.5 py-1 text-[11px] font-semibold text-circle-sage dark:text-circle-primary hover:bg-circle-primary/10 transition-colors shadow-xs"
          >
            <span>{pinnedMessages.length} {t.chat.pinnedBadge}</span>
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <MessageList
        messages={messages}
        currentUserId={user?.id}
        isLoading={isLoadingMessages}
        hasMore={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadEarlier={() => fetchNextPage()}
        onReply={handleReply}
        onReact={handleReact}
        onTogglePin={handleTogglePin}
        onRetry={handleRetry}
      />

      {/* Typing Indicator Bar */}
      {typingUsers.length > 0 && (
        <div className="px-5 py-1 text-[11px] text-circle-slate dark:text-circle-dark-muted flex items-center gap-1.5 animate-pulse bg-circle-canvas/30 dark:bg-circle-dark-canvas/30">
          <span className="flex h-1.5 w-1.5 rounded-full bg-circle-primary animate-ping" />
          <span>
            {t.chat.typingIndicator.replace(
              '{names}',
              typingUsers.map((u) => u.userName).join(', '),
            )}
          </span>
        </div>
      )}

      {/* Chat Composer */}
      <ChatComposer
        channelId={channelId}
        channelName={channelName}
        replyingMessage={replyingMessage}
        onCancelReply={() => setReplyingMessage(null)}
        onSendMessage={async (data) => {
          await sendMessageMutation.mutateAsync(data);
        }}
        reportTyping={(isTyping) => {
          try {
            const stored = localStorage.getItem(`circle_${circleId}_typing_indicator`);
            if (stored === 'false') return;
          } catch {}
          reportTyping(isTyping, user?.profile?.displayName || user?.email);
        }}
      />

      {/* Pinned Messages Modal */}
      <PinnedMessagesModal
        isOpen={isPinnedModalOpen}
        onClose={() => setIsPinnedModalOpen(false)}
        pinnedMessages={pinnedMessages}
        isLoading={isLoadingPins}
        onUnpin={(messageId) => handleTogglePin(messageId, true)}
      />

      {/* WebRTC Call Stage Modal */}
      {activeCallStageSession && (
        <CallStageModal
          callSession={activeCallStageSession}
          isOpen={!!activeCallStageSession}
          onClose={() => setActiveCallStageSession(null)}
        />
      )}
    </div>
  );
};
