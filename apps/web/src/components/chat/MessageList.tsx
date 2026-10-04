'use client';

import React, { useRef, useEffect } from 'react';
import { Sparkles, ArrowUpCircle } from 'lucide-react';
import { MessageEntity, MemberRole } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: MessageEntity[];
  currentUserId?: string;
  isLoading: boolean;
  hasMore?: boolean;
  isFetchingNextPage?: boolean;
  onLoadEarlier?: () => void;
  onReply: (message: MessageEntity) => void;
  onReact: (messageId: string, emoji: string) => void;
  onTogglePin: (messageId: string, isPinned: boolean) => void;
  onRetry?: (message: MessageEntity) => void;
}

interface MessageCluster {
  senderUserId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  senderRole?: MemberRole;
  isSenderMe: boolean;
  messages: MessageEntity[];
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  isLoading,
  hasMore,
  isFetchingNextPage,
  onLoadEarlier,
  onReply,
  onReact,
  onTogglePin,
  onRetry,
}) => {
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;
  const prevLastMessageIdRef = useRef<string | null>(null);
  const isFirstRenderRef = useRef<boolean>(true);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Auto-scroll to bottom on first render or when a new message is appended at the bottom
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    const isSenderMe = Boolean(
      (currentUserId &&
        (lastMsg.sender?.user?.id === currentUserId ||
          lastMsg.sender?.userId === currentUserId ||
          lastMsg.memberId === currentUserId)) ||
        lastMsg.memberId === 'optimistic_me' ||
        lastMsg.status === 'SENDING' ||
        lastMsg.tempId,
    );

    if (isFirstRenderRef.current) {
      setTimeout(() => scrollToBottom('auto'), 60);
      isFirstRenderRef.current = false;
      prevLastMessageIdRef.current = lastMessageId;
      return;
    }

    // Only scroll to bottom if a new message was added at the bottom
    if (lastMessageId && lastMessageId !== prevLastMessageIdRef.current) {
      prevLastMessageIdRef.current = lastMessageId;
      const container = containerRef.current;
      if (container) {
        const isNearBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight < 300;
        // If sender is ME (user sent message) or user is already near bottom, scroll down
        if (isSenderMe || isNearBottom) {
          setTimeout(() => scrollToBottom('smooth'), 50);
        }
      }
    }
  }, [messages.length, lastMessageId, currentUserId]);

  // Format date separator label
  const getDateLabel = (dateStr: string) => {
    const msgDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return t.chat.today;
    }
    if (msgDate.toDateString() === yesterday.toDateString()) {
      return t.chat.yesterday;
    }

    return msgDate.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Group messages by date
  const groupedMessages: { date: string; items: MessageEntity[] }[] = [];
  messages.forEach((msg) => {
    const dateLabel = getDateLabel(msg.sentAt);
    const existingGroup = groupedMessages.find((g) => g.date === dateLabel);
    if (existingGroup) {
      existingGroup.items.push(msg);
    } else {
      groupedMessages.push({ date: dateLabel, items: [msg] });
    }
  });

  // Helper to build consecutive clusters
  const buildClusters = (items: MessageEntity[]): MessageCluster[] => {
    const clusters: MessageCluster[] = [];
    let currentCluster: MessageCluster | null = null;

    items.forEach((msg) => {
      const senderUserId = msg.sender?.user?.id || msg.sender?.userId || msg.memberId || '';
      const isSenderMe = Boolean(
        (currentUserId &&
          (senderUserId === currentUserId ||
            msg.memberId === currentUserId ||
            msg.sender?.user?.id === currentUserId)) ||
          msg.memberId === 'optimistic_me' ||
          msg.status === 'SENDING' ||
          msg.tempId,
      );
      const senderName =
        msg.sender?.nickname ||
        msg.sender?.user?.profile?.displayName ||
        msg.sender?.user?.email?.split('@')[0] ||
        t.auth.guest;
      const senderAvatarUrl = msg.sender?.user?.profile?.avatarUrl;
      const senderRole = msg.sender?.role;

      const msgTime = new Date(msg.sentAt).getTime();
      const lastMsg = currentCluster?.messages[currentCluster.messages.length - 1];
      const lastMsgTime = lastMsg ? new Date(lastMsg.sentAt).getTime() : 0;
      const isWithin3Min = msgTime - lastMsgTime < 3 * 60 * 1000;

      if (
        currentCluster &&
        currentCluster.senderUserId === senderUserId &&
        currentCluster.isSenderMe === isSenderMe &&
        isWithin3Min
      ) {
        currentCluster.messages.push(msg);
      } else {
        if (currentCluster) {
          clusters.push(currentCluster);
        }
        currentCluster = {
          senderUserId,
          senderName,
          senderAvatarUrl,
          senderRole,
          isSenderMe,
          messages: [msg],
        };
      }
    });

    if (currentCluster) {
      clusters.push(currentCluster);
    }

    return clusters;
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4"
    >
      {/* Load earlier messages button */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadEarlier}
            disabled={isFetchingNextPage}
            className="flex items-center gap-1.5 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white/80 dark:bg-circle-dark-surface/80 px-4 py-1 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:text-circle-sage dark:hover:text-circle-primary hover:bg-circle-canvas transition-all shadow-sm"
          >
            <ArrowUpCircle className="h-3.5 w-3.5" />
            <span>
              {isFetchingNextPage ? '...' : t.chat.loadEarlierMessages}
            </span>
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && messages.length === 0 ? (
        <div className="space-y-4 py-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-circle-canvas dark:bg-circle-dark-canvas animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-28 bg-circle-canvas dark:bg-circle-dark-canvas rounded animate-pulse" />
                <div className="h-10 w-2/3 bg-circle-canvas dark:bg-circle-dark-canvas rounded-2xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-circle-wash/60 dark:bg-circle-dark-wash/60 text-circle-sage dark:text-circle-primary mb-3 shadow-sm">
            <Sparkles className="h-7 w-7" />
          </div>
          <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
            {t.chat.noMessagesYet}
          </h4>
          <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1 max-w-xs leading-relaxed">
            {t.chat.firstMessageHint}
          </p>
        </div>
      ) : (
        /* Message Date Groups */
        groupedMessages.map((group) => {
          const clusters = buildClusters(group.items);

          return (
            <div key={group.date} className="space-y-2">
              {/* Date Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-circle-hairline dark:border-circle-dark-hairline" />
                </div>
                <span className="relative rounded-full bg-circle-canvas dark:bg-circle-dark-canvas px-3 py-0.5 text-[11px] font-semibold text-circle-slate dark:text-circle-dark-muted border border-circle-hairline dark:border-circle-dark-hairline shadow-sm">
                  {group.date}
                </span>
              </div>

              {/* Message Clusters */}
              <div className="space-y-3">
                {clusters.map((cluster, clusterIdx) => {
                  const isSenderMe = cluster.isSenderMe;

                  if (isSenderMe) {
                    return (
                      <div
                        key={`cluster-me-${clusterIdx}`}
                        className="flex flex-col items-end gap-1 ml-auto max-w-[82%]"
                      >
                        {cluster.messages.map((msg, msgIdx) => (
                          <MessageBubble
                            key={msg.id}
                            message={msg}
                            allMessages={messages}
                            currentUserId={currentUserId}
                            isFirstInCluster={msgIdx === 0}
                            isLastInCluster={msgIdx === cluster.messages.length - 1}
                            isSingleInCluster={cluster.messages.length === 1}
                            onReply={onReply}
                            onReact={onReact}
                            onTogglePin={onTogglePin}
                            onRetry={onRetry}
                          />
                        ))}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`cluster-other-${clusterIdx}`}
                      className="flex items-end gap-2.5 mr-auto max-w-[82%]"
                    >
                      {/* Avatar aligned with bottom edge of last message in cluster */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-circle-primary/10 text-circle-sage dark:text-circle-primary font-bold text-xs uppercase shadow-sm overflow-hidden select-none mb-0.5">
                        {cluster.senderAvatarUrl ? (
                          <img
                            src={cluster.senderAvatarUrl}
                            alt={cluster.senderName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{cluster.senderName.slice(0, 2)}</span>
                        )}
                      </div>

                      {/* Cluster Messages Column */}
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        {/* Header: Sender Name (Once at top of cluster) */}
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[12px] font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                            {cluster.senderName}
                          </span>
                        </div>

                        {/* Consecutive Message Bubbles Stacked */}
                        <div className="flex flex-col gap-1 items-start w-full">
                          {cluster.messages.map((msg, msgIdx) => (
                            <MessageBubble
                              key={msg.id}
                              message={msg}
                              allMessages={messages}
                              currentUserId={currentUserId}
                              isFirstInCluster={msgIdx === 0}
                              isLastInCluster={msgIdx === cluster.messages.length - 1}
                              isSingleInCluster={cluster.messages.length === 1}
                              onReply={onReply}
                              onReact={onReact}
                              onTogglePin={onTogglePin}
                              onRetry={onRetry}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Invisible anchor for scrolling */}
      <div ref={bottomRef} className="h-1" />
    </div>
  );
};
