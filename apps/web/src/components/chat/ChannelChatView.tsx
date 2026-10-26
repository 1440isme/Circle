'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import { MessageSquare, Pin, Users, Hash, WifiOff, Phone, Video, Radio, PhoneCall, PhoneOff, Search, X, Loader2 } from 'lucide-react';
import { MessageEntity, CursorPaginatedMessages, CallType, CallSessionDetailEntity } from '@circle/types';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleStore } from '../../stores/circle.store';
import {
  CHAT_KEYS,
  useChannelMessagesQuery,
  useSendMessageMutation,
  useReactMessageMutation,
  usePinMessageMutation,
  usePinnedMessagesQuery,
  useChannelTyping,
  useEditMessageMutation,
  useRecallMessageMutation,
  useSearchMessagesQuery,
} from '../../hooks/use-chat-queries';
import { useCircleMembersQuery, useCircleDetailQuery } from '../../hooks/use-circle-queries';
import { useInitiateCallMutation, useJoinCallMutation } from '../../hooks/use-call-queries';
import { subscribeSocketConnection, sendMessageRead, getSocket } from '../../lib/socket';
import { MessageList } from './MessageList';
import { ChatComposer } from './ChatComposer';
import { PinnedMessagesModal } from './PinnedMessagesModal';

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
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const setActiveCallStageSession = useCircleStore((s) => s.setActiveCallStageSession);

  const { data: circleDetail } = useCircleDetailQuery(circleId);
  const circleTheme = activeCircle?.themeColor || circleDetail?.themeColor || 'sage';

  const [replyingMessage, setReplyingMessage] = useState<MessageEntity | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageEntity | null>(null);
  const [isPinnedModalOpen, setIsPinnedModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSocketConnected, setIsSocketConnected] = useState(true);
  const [incomingCallAlert, setIncomingCallAlert] = useState<{
    callSessionId: string;
    circleId: string;
    circleName: string;
    callType: CallType;
    caller: {
      userId: string;
      displayName: string;
      avatarUrl: string | null;
    };
  } | null>(null);

  const initiateCallMutation = useInitiateCallMutation();
  const joinCallMutation = useJoinCallMutation();
  const { data: circleMembers = [] } = useCircleMembersQuery(circleId);

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
    const unsub = subscribeSocketConnection((connected) => {
      setIsSocketConnected(connected);
    });

    const socket = getSocket();
    if (socket) {
      const handleIncomingCall = (payload: any) => {
        // Only show incoming call popup if it is for the current circle and not initiated by current user
        if (payload.circleId === circleId && payload.caller?.userId !== user?.id) {
          setIncomingCallAlert(payload);
        }
      };

      const handleCallEnded = (payload: any) => {
        if (payload.circleId === circleId) {
          setIncomingCallAlert(null);
        }
      };

      const handleThemeUpdated = (payload: { circleId: string; themeColor: string }) => {
        if (payload.circleId === circleId) {
          if (activeCircle) {
            setActiveCircle({ ...activeCircle, themeColor: payload.themeColor as any });
          }
        }
      };

      socket.on('call:incoming', handleIncomingCall);
      socket.on('call:ended', handleCallEnded);
      socket.on('circle:theme_updated', handleThemeUpdated);

      return () => {
        unsub();
        socket.off('call:incoming', handleIncomingCall);
        socket.off('call:ended', handleCallEnded);
        socket.off('circle:theme_updated', handleThemeUpdated);
      };
    }

    return unsub;
  }, [circleId, user?.id, activeCircle, setActiveCircle]);

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
  const editMessageMutation = useEditMessageMutation(channelId);
  const recallMessageMutation = useRecallMessageMutation(channelId);
  const reactMessageMutation = useReactMessageMutation(channelId);
  const pinMessageMutation = usePinMessageMutation(channelId);
  const { data: pinnedMessages = [], isLoading: isLoadingPins } = usePinnedMessagesQuery(channelId);
  const { typingUsers, reportTyping } = useChannelTyping(channelId);
  const { data: searchResults, isLoading: isSearching } = useSearchMessagesQuery(
    isSearchOpen ? channelId : null,
    searchQuery,
  );

  const handleReply = (message: MessageEntity) => {
    setReplyingMessage(message);
    setEditingMessage(null);
  };

  const handleEdit = (message: MessageEntity) => {
    setEditingMessage(message);
    setReplyingMessage(null);
  };

  const handleRecall = async (messageId: string) => {
    if (window.confirm(t.chat.recallConfirmMsg)) {
      try {
        await recallMessageMutation.mutateAsync(messageId);
      } catch (err: any) {
        alert(err.message || 'Lỗi khi thu hồi tin nhắn');
      }
    }
  };

  const handleSaveEdit = async (messageId: string, content: string) => {
    await editMessageMutation.mutateAsync({ messageId, content });
    setEditingMessage(null);
  };

  const handleReact = (messageId: string, emoji: string) => {
    reactMessageMutation.mutate({ messageId, emoji });
  };

  const handleTogglePin = (messageId: string, isPinned: boolean) => {
    const targetMsg = messages.find((m) => m.id === messageId);
    if (targetMsg?.content?.startsWith('[CALL_SUMMARY]:')) return;
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

  // Locally hidden messages ("Xóa phía tôi" - CHT-11)
  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`circle_hidden_messages_${channelId}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`circle_hidden_messages_${channelId}`);
      setHiddenMessageIds(stored ? new Set(JSON.parse(stored)) : new Set());
    } catch {
      setHiddenMessageIds(new Set());
    }
  }, [channelId]);

  const handleDeleteForMe = (messageId: string) => {
    setHiddenMessageIds((prev) => {
      const next = new Set(prev);
      next.add(messageId);
      try {
        localStorage.setItem(
          `circle_hidden_messages_${channelId}`,
          JSON.stringify(Array.from(next)),
        );
      } catch {}
      return next;
    });
  };

  const visibleMessages = React.useMemo(() => {
    return messages.filter((m) => !hiddenMessageIds.has(m.id));
  }, [messages, hiddenMessageIds]);

  return (
    <div
      data-circle-theme={circleTheme}
      className="flex-1 flex flex-col h-full min-h-0 bg-white dark:bg-circle-dark-surface overflow-hidden transition-colors"
    >
      {/* Channel Header Bar with Call Actions: seamless background without dividing line */}
      <div className="w-full bg-white dark:bg-circle-dark-surface z-10 shrink-0">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Hash className="h-4.5 w-4.5 shrink-0 text-circle-slate dark:text-circle-dark-muted" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                {channelName}
              </h3>
            </div>
          </div>

          {/* Channel Action Controls: Mobile Call icons & Pinned */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex xl:hidden items-center gap-1">
              <button
                type="button"
                onClick={() => handleStartCall(CallType.AUDIO)}
                disabled={initiateCallMutation.isPending}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas transition-colors active:scale-95"
                title={t.calls.startAudioCallTooltip}
              >
                <Phone className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleStartCall(CallType.VIDEO)}
                disabled={initiateCallMutation.isPending}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas transition-colors active:scale-95"
                title={t.calls.startVideoCallTooltip}
              >
                <Video className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) setSearchQuery('');
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors active:scale-95 ${
                isSearchOpen
                  ? 'bg-circle-primary/10 text-circle-primary'
                  : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas'
              }`}
              title="Tìm kiếm tin nhắn"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPinnedModalOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas transition-colors active:scale-95"
              title={t.chat.pinnedBadge}
            >
              <Pin className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Channel Message Search Bar (CHT-17) */}
        {isSearchOpen && (
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pb-3 pt-1 border-b border-circle-hairline dark:border-circle-dark-hairline animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-circle-slate dark:text-circle-dark-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.chat.searchPlaceholder}
                autoFocus
                className="w-full rounded-xl bg-circle-canvas dark:bg-circle-dark-canvas pl-9 pr-9 py-1.5 text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted border border-circle-hairline dark:border-circle-dark-hairline focus:outline-none focus:ring-1 focus:ring-circle-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {searchQuery.trim() && (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-lg p-1.5">
                {isSearching ? (
                  <div className="flex items-center justify-center py-4 text-xs text-circle-slate dark:text-circle-dark-muted gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-circle-primary" />
                    <span>Đang tìm kiếm...</span>
                  </div>
                ) : searchResults && searchResults.messages.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {searchResults.messages.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          const el = document.getElementById(`message-${m.id}`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                          setIsSearchOpen(false);
                        }}
                        className="flex flex-col gap-0.5 rounded-lg p-2 hover:bg-circle-wash dark:hover:bg-circle-dark-wash cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-circle-charcoal dark:text-circle-dark-text">
                            {m.sender?.nickname || m.sender?.user?.profile?.displayName || 'Thành viên'}
                          </span>
                          <span className="text-circle-slate dark:text-circle-dark-muted text-[10px]">
                            {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-circle-slate dark:text-circle-dark-muted line-clamp-2">
                          {m.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-3 text-center text-xs text-circle-slate dark:text-circle-dark-muted">
                    {t.chat.noSearchResults}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Centered Chat Column: Synchronized responsive proportion matching moments feed (max-w-4xl) */}
      <div className="flex-1 flex flex-col min-h-0 w-full max-w-4xl mx-auto px-2 sm:px-4">
        {/* Network Reconnection Banner */}
        {!isSocketConnected && (
          <div className="flex items-center justify-center gap-2 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 py-1.5 px-4 text-xs font-medium animate-pulse transition-all">
            <WifiOff className="h-3.5 w-3.5" />
            <span>{t.chat.reconnecting}</span>
          </div>
        )}

        {/* Pinned Messages Bar (Subtle & gentle top strip) */}
        {pinnedMessages.length > 0 && (
          <div className="flex items-center justify-between mx-4 mb-2 rounded-xl px-3 py-1 bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 border border-circle-hairline dark:border-circle-dark-hairline backdrop-blur-sm z-10 text-xs">
            <div
              onClick={() => {
                const latest = pinnedMessages[pinnedMessages.length - 1];
                if (latest?.id) {
                  const el = document.getElementById(`message-${latest.id}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="flex items-center gap-2 text-circle-slate dark:text-circle-dark-muted font-normal truncate min-w-0 pr-2 cursor-pointer hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors"
              title={t.chat.pinnedBadge}
            >
              <Pin className="h-3 w-3 text-circle-primary shrink-0 opacity-80" />
              <span className="truncate">{pinnedMessages[pinnedMessages.length - 1]?.content || t.chat.pinnedBadge}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsPinnedModalOpen(true)}
              className="flex items-center gap-1 shrink-0 rounded-full bg-circle-primary/10 hover:bg-circle-primary/20 text-circle-primary dark:text-circle-primary px-2 py-0.5 text-[11px] font-medium transition-colors"
            >
              <span>{pinnedMessages.length} {t.chat.pinnedBadge}</span>
            </button>
          </div>
        )}

        {/* Messages Scroll Area */}
        <MessageList
          messages={visibleMessages}
          currentUserId={user?.id}
          isLoading={isLoadingMessages}
          hasMore={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadEarlier={() => fetchNextPage()}
          onReply={handleReply}
          onEdit={handleEdit}
          onRecall={handleRecall}
          onDeleteForMe={handleDeleteForMe}
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
          members={circleMembers}
          replyingMessage={replyingMessage}
          onCancelReply={() => setReplyingMessage(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          onSaveEdit={handleSaveEdit}
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
      </div>

      {/* Pinned Messages Modal */}
      <PinnedMessagesModal
        isOpen={isPinnedModalOpen}
        onClose={() => setIsPinnedModalOpen(false)}
        pinnedMessages={pinnedMessages}
        isLoading={isLoadingPins}
        onUnpin={(messageId) => handleTogglePin(messageId, true)}
        onJumpToMessage={(messageId) => {
          const el = document.getElementById(`message-${messageId}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />

      {/* Realtime Incoming Call Ringing Dialog */}
      {incomingCallAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-circle-charcoal/95 p-6 text-white shadow-2xl animate-scaleUp">
            {/* Header with pulsating icon */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-white">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/20 opacity-75"></span>
                {incomingCallAlert.callType === CallType.VIDEO ? (
                  <Video className="relative h-10 w-10 text-white animate-bounce" />
                ) : (
                  <PhoneCall className="relative h-10 w-10 text-white animate-bounce" />
                )}
              </div>

              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                {incomingCallAlert.callType === CallType.VIDEO ? t.calls.incomingVideoCall : t.calls.incomingAudioCall}
              </span>

              <h3 className="mt-1 text-xl font-bold text-white">
                {incomingCallAlert.caller?.displayName || t.calls.circleMemberDefault}
              </h3>

              <p className="mt-1 text-xs text-white/70">
                {t.calls.callingInGroup} <span className="font-semibold text-white">{incomingCallAlert.circleName}</span>
              </p>
            </div>

            {/* Action Buttons: Decline & Accept */}
            <div className="mt-8 flex items-center justify-center gap-6">
              {/* Decline button */}
              <button
                type="button"
                onClick={() => setIncomingCallAlert(null)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/20 group-hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition-all active:scale-95 shadow-lg shadow-rose-500/10">
                  <PhoneOff className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-white/70 group-hover:text-white">{t.calls.ignoreCall}</span>
              </button>

              {/* Accept button */}
              <button
                type="button"
                data-testid="accept-incoming-call-btn"
                onClick={async () => {
                  try {
                    await joinCallMutation.mutateAsync({
                      callSessionId: incomingCallAlert.callSessionId,
                    });
                  } catch (e) {
                    console.error('Error joining call session in backend:', e);
                  }
                  const targetCallSession: CallSessionDetailEntity = {
                    id: incomingCallAlert.callSessionId,
                    circleId: incomingCallAlert.circleId,
                    callType: incomingCallAlert.callType,
                    status: 'ACTIVE' as any,
                    startedAt: new Date().toISOString(),
                    participants: [],
                    circle: {
                      id: incomingCallAlert.circleId,
                      name: incomingCallAlert.circleName,
                    } as any,
                  };
                  setIncomingCallAlert(null);
                  setActiveCallStageSession(targetCallSession);
                }}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/25">
                  <Phone className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold text-white group-hover:text-emerald-300">{t.calls.joinCallAction}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
