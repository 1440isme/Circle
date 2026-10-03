'use client';

import React, { useState } from 'react';
import {
  Pin,
  Reply,
  FileText,
  Download,
  Clock,
  Check,
  AlertCircle,
} from 'lucide-react';
import { MessageEntity, MessageType } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';

interface MessageBubbleProps {
  message: MessageEntity;
  allMessages?: MessageEntity[];
  currentUserId?: string;
  isFirstInCluster?: boolean;
  isLastInCluster?: boolean;
  isSingleInCluster?: boolean;
  onReply: (message: MessageEntity) => void;
  onReact: (messageId: string, emoji: string) => void;
  onTogglePin: (messageId: string, isPinned: boolean) => void;
  onRetry?: (message: MessageEntity) => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  allMessages,
  currentUserId,
  isFirstInCluster = true,
  isLastInCluster = true,
  isSingleInCluster = true,
  onReply,
  onReact,
  onTogglePin,
  onRetry,
}) => {
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const replyTargetId =
    typeof message.replyTo === 'string'
      ? message.replyTo
      : (message.replyTo?.id || message.replyToId);
  const replyTarget =
    (typeof message.replyTo === 'object' &&
    message.replyTo !== null &&
    (message.replyTo.content || (message.replyTo as any).text || (message.replyTo as any).fileUrl)
      ? message.replyTo
      : null) ||
    (allMessages && replyTargetId ? allMessages.find((m) => m.id === replyTargetId) : null);

  const hasValidReply = Boolean(
    replyTarget &&
      (replyTarget.content ||
        (replyTarget as any).text ||
        (replyTarget as any).message ||
        (replyTarget as any).fileName ||
        (replyTarget as any).fileUrl),
  );

  const senderUserId = message.sender?.user?.id || message.sender?.userId;
  const isSenderMe = Boolean(
    currentUserId &&
      (senderUserId === currentUserId ||
        message.memberId === currentUserId ||
        message.sender?.user?.id === currentUserId),
  );

  // Format sent time (e.g., 14:30)
  const sentTime = new Date(message.sentAt).toLocaleTimeString(
    locale === 'vi' ? 'vi-VN' : 'en-US',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
  );

  // Format file size
  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImageAttachment =
    message.type === MessageType.FILE &&
    message.fileUrl &&
    (message.fileUrl.startsWith('data:image/') ||
      /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(message.fileUrl));

  // Determine corner radius styles for smart stacking
  const getBubbleRadius = () => {
    if (isSingleInCluster) {
      return isSenderMe ? 'rounded-2xl rounded-br-xs' : 'rounded-2xl rounded-bl-xs';
    }
    if (isSenderMe) {
      if (isFirstInCluster) return 'rounded-2xl rounded-br-md';
      if (isLastInCluster) return 'rounded-2xl rounded-tr-md rounded-br-xs';
      return 'rounded-2xl rounded-r-md';
    } else {
      if (isFirstInCluster) return 'rounded-2xl rounded-bl-md';
      if (isLastInCluster) return 'rounded-2xl rounded-tl-md rounded-bl-xs';
      return 'rounded-2xl rounded-l-md';
    }
  };

  const hasReactions =
    message.reactionCounts && Object.keys(message.reactionCounts).length > 0;

  return (
    <div
      className={`group relative flex flex-col transition-all ${
        isSenderMe ? 'items-end' : 'items-start'
      }`}
    >
      {/* Pinned indicator badge */}
      {message.isPinned && (
        <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 mb-1 px-1">
          <Pin className="h-3 w-3 fill-amber-500 text-amber-500" />
          <span>{t.chat.pinnedBadge}</span>
        </div>
      )}

      {/* Message Bubble Container with Click-to-Toggle-Timestamp */}
      <div className="relative inline-block max-w-full">
        <div
          onClick={() => setShowTimestamp((prev) => !prev)}
          className={`relative cursor-pointer select-text px-4 py-2.5 transition-all shadow-sm ${getBubbleRadius()} ${
            isSenderMe
              ? 'bg-circle-primary text-white dark:bg-circle-dark-primary dark:text-circle-dark-canvas'
              : 'bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text border border-circle-hairline dark:border-circle-dark-hairline'
          } ${message.isPinned ? 'ring-2 ring-amber-400/40' : ''}`}
        >
          {/* Reply Quote Banner - Flat rounded container, NO side borders */}
          {hasValidReply && replyTarget && (
            <div
              className={`flex items-center gap-2 mb-1.5 rounded-xl px-2.5 py-1 text-xs max-w-full ${
                isSenderMe
                  ? 'bg-white/20 dark:bg-black/20 text-white/95 dark:text-circle-dark-canvas/95'
                  : 'bg-circle-wash/70 dark:bg-circle-dark-wash text-circle-primary dark:text-circle-dark-muted'
              }`}
            >
              <Reply className="h-3 w-3 shrink-0 scale-x-[-1] opacity-75" />
              <span className="font-semibold shrink-0">
                {replyTarget.sender?.nickname ||
                  replyTarget.sender?.user?.profile?.displayName ||
                  (replyTarget.sender as any)?.profile?.displayName ||
                  (replyTarget.sender as any)?.user?.email?.split('@')[0] ||
                  t.auth.guest}
                :
              </span>
              <span className="truncate opacity-90">
                {replyTarget.content ||
                  (replyTarget.type === MessageType.FILE ? `[${t.chat.fileDownload}]` : '') ||
                  'Tin nhắn'}
              </span>
            </div>
          )}

          {/* Message Text Content */}
          {message.content && (
            <div className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed font-normal">
              {message.content}
            </div>
          )}

          {/* Attachment: Image */}
          {isImageAttachment && message.fileUrl && (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                className="group/img relative max-w-sm overflow-hidden rounded-2xl border border-white/20 dark:border-black/20 shadow-sm hover:opacity-95 transition-opacity"
              >
                <img
                  src={message.fileUrl}
                  alt={message.fileName || 'Attachment'}
                  className="max-h-72 w-auto object-cover rounded-2xl"
                />
              </button>

              {/* Lightbox Modal */}
              {isImageModalOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                  onClick={() => setIsImageModalOpen(false)}
                >
                  <img
                    src={message.fileUrl}
                    alt={message.fileName || 'Attachment'}
                    className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
                  />
                </div>
              )}
            </div>
          )}

          {/* Attachment: Document / Generic File */}
          {message.type === MessageType.FILE && !isImageAttachment && message.fileUrl && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`mt-2 inline-flex items-center gap-3 rounded-xl p-2.5 max-w-sm shadow-sm ${
                isSenderMe
                  ? 'bg-white/15 dark:bg-black/15 text-white dark:text-circle-charcoal'
                  : 'bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text'
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-circle-primary/20 text-circle-primary">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">
                  {message.fileName || 'File'}
                </p>
                <p className="text-[10px] opacity-75">
                  {formatFileSize(message.fileSize)}
                </p>
              </div>
              <a
                href={message.fileUrl}
                download={message.fileName || 'download'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                title={t.chat.fileDownload}
              >
                <Download className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Overlapping Reaction Badge (Bottom-Right Corner, Icons Only, No Counts, Flat) */}
          {hasReactions && (
            <div className="absolute -bottom-2 right-1.5 flex items-center gap-0.5 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white/95 dark:bg-circle-dark-surface px-1.5 py-0.5 text-xs select-none">
              {Object.keys(message.reactionCounts!).map((emoji) => (
                <span key={emoji} className="text-[12px] leading-none">{emoji}</span>
              ))}
            </div>
          )}
        </div>

        {/* Sent Timestamp & Status (Displayed when clicked/tapped or when FAILED) */}
        {(showTimestamp || message.status === 'FAILED') && (
          <div
            className={`text-[10px] mt-1 px-1 font-mono transition-opacity animate-in fade-in flex items-center gap-1.5 ${
              isSenderMe
                ? 'justify-end text-circle-slate/60 dark:text-circle-dark-muted/60'
                : 'justify-start text-circle-slate/60 dark:text-circle-dark-muted/60'
            }`}
          >
            <span>{sentTime}</span>
            {isSenderMe && (
              <span className="inline-flex items-center">
                {message.status === 'SENDING' ? (
                  <span className="inline-flex items-center gap-1 text-circle-slate/60 dark:text-circle-dark-muted/60">
                    <Clock className="w-3 h-3 animate-spin text-circle-primary" />
                    <span>{t.chat.sendingStatus}</span>
                  </span>
                ) : message.status === 'FAILED' ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetry?.(message);
                    }}
                    className="inline-flex items-center gap-1 text-red-500 font-semibold hover:underline cursor-pointer"
                  >
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span>{t.chat.retryAction}</span>
                  </button>
                ) : (
                  <Check className="w-3 h-3 text-circle-primary" />
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover Action Bar (Pin, Reply, Quick Emojis) */}
      <div
        className={`absolute -top-3 hidden group-hover:flex items-center gap-0.5 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-1 shadow-circle-hover transition-all z-20 ${
          isSenderMe ? 'right-2' : 'left-2'
        }`}
      >
        {/* Quick Emoji Buttons */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-circle-hairline dark:border-circle-dark-hairline">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(message.id, emoji)}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-xs transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Reply Action */}
        <button
          type="button"
          onClick={() => onReply(message)}
          className="flex h-6 w-6 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas hover:text-circle-sage transition-colors"
          title={t.chat.replyAction}
        >
          <Reply className="h-3.5 w-3.5 scale-x-[-1]" />
        </button>

        {/* Pin / Unpin Action */}
        <button
          type="button"
          onClick={() => onTogglePin(message.id, !!message.isPinned)}
          className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
            message.isPinned
              ? 'text-amber-500 hover:bg-amber-100/60 dark:hover:bg-amber-950/30'
              : 'text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas hover:text-amber-500'
          }`}
          title={message.isPinned ? t.chat.unpinAction : t.chat.pinAction}
        >
          <Pin className={`h-3.5 w-3.5 ${message.isPinned ? 'fill-amber-500' : ''}`} />
        </button>
      </div>
    </div>
  );
};
