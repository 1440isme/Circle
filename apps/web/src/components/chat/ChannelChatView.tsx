'use client';

import React, { useState } from 'react';
import { MessageSquare, Pin, Users, Hash } from 'lucide-react';
import { MessageEntity } from '@circle/types';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import {
  useChannelMessagesQuery,
  useSendMessageMutation,
  useReactMessageMutation,
  usePinMessageMutation,
  usePinnedMessagesQuery,
  useChannelTyping,
} from '../../hooks/use-chat-queries';
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
}) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);

  const [replyingMessage, setReplyingMessage] = useState<MessageEntity | null>(null);
  const [isPinnedModalOpen, setIsPinnedModalOpen] = useState(false);

  // Queries & Mutations
  const {
    messages,
    isLoading: isLoadingMessages,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useChannelMessagesQuery(channelId);

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

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-10rem)] rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-circle-card overflow-hidden transition-colors">
      {/* Channel Header Bar */}
      <div className="flex items-center justify-between border-b border-circle-hairline dark:border-circle-dark-hairline px-5 py-3 bg-white/80 dark:bg-circle-dark-surface/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-circle-primary/10 text-circle-sage dark:text-circle-primary shrink-0">
            <Hash className="h-4 w-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                {channelName}
              </h3>
            </div>
            {channelTopic && (
              <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted truncate">
                {channelTopic}
              </p>
            )}
          </div>
        </div>

        {/* Pinned Messages Trigger */}
        <button
          type="button"
          onClick={() => setIsPinnedModalOpen(true)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
            pinnedMessages.length > 0
              ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100/50'
              : 'border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash hover:text-circle-sage'
          }`}
          title={t.chat.viewPinned}
        >
          <Pin className={`h-3.5 w-3.5 ${pinnedMessages.length > 0 ? 'fill-amber-500' : ''}`} />
          <span>{pinnedMessages.length}</span>
        </button>
      </div>

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
      />

      {/* Typing Indicator Bar */}
      {typingUsers.length > 0 && (
        <div className="px-5 py-1 text-[11px] text-circle-slate dark:text-circle-dark-muted flex items-center gap-1.5 animate-pulse bg-circle-canvas/30 dark:bg-circle-dark-canvas/30">
          <span className="flex h-1.5 w-1.5 rounded-full bg-circle-sage animate-ping" />
          <span>{t.chat.someoneTyping}</span>
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
        reportTyping={reportTyping}
      />

      {/* Pinned Messages Modal */}
      <PinnedMessagesModal
        isOpen={isPinnedModalOpen}
        onClose={() => setIsPinnedModalOpen(false)}
        pinnedMessages={pinnedMessages}
        isLoading={isLoadingPins}
        onUnpin={(messageId) => handleTogglePin(messageId, true)}
      />
    </div>
  );
};
