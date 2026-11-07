'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import { MessageSquare, Pin, Users, Hash, WifiOff, Phone, Video, Radio, PhoneCall, PhoneOff, Calendar, Search, X, Loader2, MoreVertical, Trash2, Volume2, VolumeX } from 'lucide-react';
import { MessageEntity, CursorPaginatedMessages, CallType, CallSessionDetailEntity, ClearChatMode, MessageType } from '@circle/types';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleStore } from '../../stores/circle.store';
import { useSoundStore } from '../../stores/sound.store';
import {
  playMessageSentSound,
  playReactionPopSound,
  playIncomingCallChime,
  stopIncomingCallChime,
  playRoomJoinSound,
} from '../../utils/sound-effects';
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
  useClearChatMutation,
} from '../../hooks/use-chat-queries';
import { useCircleMembersQuery, useCircleDetailQuery } from '../../hooks/use-circle-queries';
import { useInitiateCallMutation, useJoinCallMutation } from '../../hooks/use-call-queries';
import { subscribeSocketConnection, sendMessageRead, getSocket } from '../../lib/socket';
import { MessageList } from './MessageList';
import { ChatComposer } from './ChatComposer';
import { PinnedMessagesModal } from './PinnedMessagesModal';
import { ClearChatModal } from './ClearChatModal';

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
  const setActiveCircleView = useCircleStore((s) => s.setActiveCircleView);

  const { data: circleDetail } = useCircleDetailQuery(circleId);
  const circleTheme = activeCircle?.themeColor || circleDetail?.themeColor || 'sage';

  const [replyingMessage, setReplyingMessage] = useState<MessageEntity | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageEntity | null>(null);
  const [isPinnedModalOpen, setIsPinnedModalOpen] = useState(false);
  const [isClearChatModalOpen, setIsClearChatModalOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
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
  const soundEnabled = useSoundStore((s) => s.soundEnabled);
  const toggleSound = useSoundStore((s) => s.toggleSound);

  const handleStartCall = async (callType: CallType) => {
    try {
      stopIncomingCallChime();
      playRoomJoinSound();
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
          playIncomingCallChime();
          setIncomingCallAlert(payload);
        }
      };

      const handleCallEnded = (payload: any) => {
        if (payload.circleId === circleId) {
          stopIncomingCallChime();
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

      const handleChannelCleared = (payload: any) => {
        if (payload.channelId === channelId) {
          queryClient.setQueryData(CHAT_KEYS.messages(channelId), () => ({
            pages: [{ messages: [], nextCursor: null }],
            pageParams: [undefined],
          }));
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages(channelId) });
        }
      };

      const handlePollVoted = (poll: any) => {
        if (!poll?.id || !channelId) return;
        queryClient.setQueryData(CHAT_KEYS.messages(channelId), (oldData: any) => {
          if (!oldData?.pages) return oldData;
          let targetMsg: any = null;
          const newPages = oldData.pages.map((page: any) => {
            const filtered = page.messages.filter((m: any) => {
              if (m.content?.startsWith('[GROUP_POLL]:')) {
                try {
                  const data = JSON.parse(m.content.replace('[GROUP_POLL]:', ''));
                  if (data?.pollId === poll.id) {
                    targetMsg = {
                      ...m,
                      sentAt: new Date().toISOString(),
                      createdAt: new Date().toISOString(),
                    };
                    return false; // remove older location!
                  }
                } catch {}
              }
              return true;
            });
            return { ...page, messages: filtered };
          });
          if (targetMsg && newPages.length > 0) {
            newPages[newPages.length - 1].messages.push(targetMsg);
          }
          return { ...oldData, pages: newPages };
        });
      };

      socket.on('call:incoming', handleIncomingCall);
      socket.on('call:ended', handleCallEnded);
      socket.on('circle:theme_updated', handleThemeUpdated);
      socket.on('chat:channel-cleared', handleChannelCleared);
      socket.on('circle:poll-voted', handlePollVoted);
      socket.on('circle:poll-closed', handlePollVoted);

      return () => {
        unsub();
        socket.off('call:incoming', handleIncomingCall);
        socket.off('call:ended', handleCallEnded);
        socket.off('circle:theme_updated', handleThemeUpdated);
        socket.off('chat:channel-cleared', handleChannelCleared);
        socket.off('circle:poll-voted', handlePollVoted);
        socket.off('circle:poll-closed', handlePollVoted);
      };
    }

    return unsub;
  }, [circleId, user?.id, activeCircle, setActiveCircle, channelId, queryClient]);

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
  const clearChatMutation = useClearChatMutation(channelId);
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
        alert(err.message || t.chat.recallError);
      }
    }
  };

  const handleClearChat = async (mode: ClearChatMode) => {
    try {
      await clearChatMutation.mutateAsync({ mode });
      setIsClearChatModalOpen(false);
    } catch (err: any) {
      alert(err.message || t.chat.clearChatError);
    }
  };

  const handleSaveEdit = async (messageId: string, content: string) => {
    await editMessageMutation.mutateAsync({ messageId, content });
    setEditingMessage(null);
  };

  const handleReact = (messageId: string, emoji: string) => {
    playReactionPopSound();
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

  const handleSendIcebreaker = async (text: string) => {
    try {
      await sendMessageMutation.mutateAsync({
        content: text,
        type: MessageType.TEXT,
      });
    } catch (err) {
      console.error('Failed to send icebreaker:', err);
    }
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
    const unhidden = messages.filter((m) => !hiddenMessageIds.has(m.id));
    const seenPollIds = new Set<string>();
    const result: typeof messages = [];

    // Traverse newest to oldest to preserve only the most recent instance of any poll
    for (let i = unhidden.length - 1; i >= 0; i--) {
      const msg = unhidden[i];
      if (msg.content?.startsWith('[GROUP_POLL]:')) {
        try {
          const data = JSON.parse(msg.content.replace('[GROUP_POLL]:', ''));
          if (data?.pollId) {
            if (seenPollIds.has(data.pollId)) {
              continue; // Drop older occurrence so poll only appears once at latest position
            }
            seenPollIds.add(data.pollId);
          }
        } catch {}
      }
      result.unshift(msg);
    }

    return result;
  }, [messages, hiddenMessageIds]);

  return (
    <div
      data-circle-theme={circleTheme}
      className="relative flex-1 flex flex-col h-full min-h-0 bg-white dark:bg-circle-dark-surface overflow-hidden transition-colors"
    >
      {/* Top Scroll Edge Fade (Apple Liquid Glass scroll edge effect) */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/90 dark:from-circle-dark-surface/90 to-transparent z-10" />

      {/* Floating Channel Header Toolbar (Floating glass capsule with scroll-under content) */}
      <div className="pointer-events-none absolute top-3 left-0 right-0 z-20 flex flex-col items-center px-4 gap-2">
        <div className="pointer-events-auto flex items-center justify-between px-4 py-2 rounded-full backdrop-blur-xl bg-white/94 dark:bg-circle-dark-surface/92 border border-circle-hairline/80 dark:border-white/12 shadow-sm max-w-2xl w-full transition-all">
          <div className="flex items-center gap-2 min-w-0">
            <Hash className="h-4 w-4 shrink-0 text-circle-slate dark:text-circle-dark-muted" />
            <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
              {channelName}
            </h3>
          </div>

          {/* Channel Action Controls: Mobile Call icons & Pinned */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex xl:hidden items-center gap-1">
              <button
                type="button"
                onClick={() => handleStartCall(CallType.AUDIO)}
                disabled={initiateCallMutation.isPending}
                className="flex h-8 w-8 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white hover:bg-circle-canvas/80 dark:hover:bg-circle-dark-canvas/80 transition-colors active:scale-95"
                title={t.calls.startAudioCallTooltip}
              >
                <Phone className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleStartCall(CallType.VIDEO)}
                disabled={initiateCallMutation.isPending}
                className="flex h-8 w-8 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white hover:bg-circle-canvas/80 dark:hover:bg-circle-dark-canvas/80 transition-colors active:scale-95"
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
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors active:scale-95 ${
                isSearchOpen
                  ? 'bg-circle-primary/15 text-circle-primary'
                  : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white hover:bg-circle-canvas/80 dark:hover:bg-circle-dark-canvas/80'
              }`}
              title={t.chat.searchPlaceholder}
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPinnedModalOpen(true)}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors active:scale-95 ${
                pinnedMessages.length > 0
                  ? 'text-circle-primary bg-circle-primary/15 hover:bg-circle-primary/25'
                  : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white hover:bg-circle-canvas/80 dark:hover:bg-circle-dark-canvas/80'
              }`}
              title={pinnedMessages.length > 0 ? `${pinnedMessages.length} ${t.chat.pinnedBadge}` : t.chat.pinnedBadge}
            >
              <Pin className={`h-4 w-4 ${pinnedMessages.length > 0 ? 'fill-current' : ''}`} />
            </button>

            {/* Header Options Menu (More options: Clear Chat, etc.) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors active:scale-95 ${
                  isHeaderMenuOpen
                    ? 'bg-circle-primary/15 text-circle-primary'
                    : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white hover:bg-circle-canvas/80 dark:hover:bg-circle-dark-canvas/80'
                }`}
                title={t.chat.moreChatOptions}
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {isHeaderMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsHeaderMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-white/60 dark:border-white/10 bg-white/95 dark:bg-circle-dark-surface/95 backdrop-blur-md p-1.5 shadow-xl z-30 animate-scaleUp">
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsSearchOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-circle-charcoal dark:text-white hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors text-left"
                    >
                      <Search className="h-3.5 w-3.5 text-circle-slate" />
                      <span>{t.chat.searchPlaceholder}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsPinnedModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-circle-charcoal dark:text-white hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors text-left"
                    >
                      <Pin className="h-3.5 w-3.5 text-circle-slate" />
                      <span>{t.chat.pinnedBadge}</span>
                    </button>

                    <div className="my-1 border-t border-circle-slate/10 dark:border-white/10" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsClearChatModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      <span>{t.chat.clearChatAction}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Floating Channel Message Search Bar (CHT-17) */}
        {isSearchOpen && (
          <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-circle-hairline/80 dark:border-white/12 bg-white/96 dark:bg-circle-dark-surface/96 backdrop-blur-xl p-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
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
                    <span>{t.chat.searchingMessage}</span>
                  </div>
                ) : searchResults && searchResults.messages.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {searchResults.messages.map((msg) => (
                      <button
                        key={msg.id}
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          const el = document.getElementById(`message-${msg.id}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="w-full flex flex-col items-start gap-1 p-2 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors text-left"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] font-bold text-circle-charcoal dark:text-white">
                            {msg.sender?.nickname || msg.sender?.user?.profile?.displayName || (msg.sender as any)?.email || t.chat.defaultMemberName}
                          </span>
                          <span className="text-[10px] text-circle-slate dark:text-circle-dark-muted">
                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-circle-charcoal dark:text-circle-dark-text line-clamp-1">
                          {msg.content}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-circle-slate dark:text-circle-dark-muted">
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
          onStartCall={(type) => handleStartCall(type as CallType)}
          circleName={circleDetail?.name || activeCircle?.name}
          circleDescription={(circleDetail as any)?.description || (activeCircle as any)?.description}
          onSendIcebreaker={handleSendIcebreaker}
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
          circleId={circleId}
          channelId={channelId}
          channelName={channelName}
          members={circleMembers}
          replyingMessage={replyingMessage}
          onCancelReply={() => setReplyingMessage(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          onSaveEdit={handleSaveEdit}
          onSendMessage={async (data) => {
            playMessageSentSound();
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

      {/* Clear Chat History Modal */}
      <ClearChatModal
        isOpen={isClearChatModalOpen}
        onClose={() => setIsClearChatModalOpen(false)}
        onConfirm={handleClearChat}
        isLoading={clearChatMutation.isPending}
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
