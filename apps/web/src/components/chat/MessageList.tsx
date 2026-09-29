'use client';

import React, { useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, ArrowUpCircle } from 'lucide-react';
import { MessageEntity } from '@circle/types';
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
}) => {
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstRenderRef = useRef(true);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      if (isFirstRenderRef.current) {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' });
        isFirstRenderRef.current = false;
      } else {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages.length]);

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

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[300px]"
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
        /* Message Groups */
        groupedMessages.map((group) => (
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

            {/* Messages in Group */}
            <div className="space-y-1">
              {group.items.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onReact={onReact}
                  onTogglePin={onTogglePin}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Invisible anchor for scrolling */}
      <div ref={bottomRef} className="h-1" />
    </div>
  );
};
