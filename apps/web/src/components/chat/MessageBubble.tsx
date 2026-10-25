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
  Video,
  Phone,
  Smile,
} from 'lucide-react';
import { MessageEntity, MessageType, CalendarEventMessagePayload } from '@circle/types';
import { CalendarEventChatEmbed } from './CalendarEventChatEmbed';
import { PROMINENT_QUICK_EMOJIS } from '@circle/shared';
import { useLanguageStore } from '../../stores/language.store';
import {
  MomentCardChatEmbed,
  parseMomentReplyMetadata,
} from './MomentCardChatEmbed';
import { Emoji } from '../ui/Emoji';
import { FullEmojiPickerModal } from '../ui/FullEmojiPickerModal';

interface MessageBubbleProps {
  message: MessageEntity;
  allMessages?: MessageEntity[];
  currentUserId?: string;
  isFirstInCluster?: boolean;
  isLastInCluster?: boolean;
  isSingleInCluster?: boolean;
  isLatestSentByMe?: boolean;
  isLatestMessage?: boolean;
  isHighlighted?: boolean;
  onReply: (message: MessageEntity) => void;
  onReact: (messageId: string, emoji: string) => void;
  onTogglePin: (messageId: string, isPinned: boolean) => void;
  onRetry?: (message: MessageEntity) => void;
  onJumpToMessage?: (messageId: string) => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  allMessages,
  currentUserId,
  isFirstInCluster = true,
  isLastInCluster = true,
  isSingleInCluster = true,
  isLatestSentByMe = false,
  isLatestMessage = false,
  isHighlighted = false,
  onReply,
  onReact,
  onTogglePin,
  onRetry,
  onJumpToMessage,
}) => {
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isFullEmojiOpen, setIsFullEmojiOpen] = useState(false);

  const momentMeta = parseMomentReplyMetadata(message.fileName);
  const isMomentReply = Boolean(
    momentMeta || (message.fileUrl && message.fileUrl.includes('#pip=')),
  );

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

  const fileUrlStr = message.fileUrl || '';
  const cleanFileUrl = fileUrlStr.split('#')[0].split('?')[0];
  const isImageAttachment =
    message.type === MessageType.FILE &&
    Boolean(message.fileUrl) &&
    (isMomentReply ||
      fileUrlStr.startsWith('data:image/') ||
      /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(cleanFileUrl) ||
      fileUrlStr.includes('#pip='));

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

  const isCalendarEvent = Boolean(message.content?.startsWith('[CALENDAR_EVENT]:'));
  let calendarEventData: CalendarEventMessagePayload | null = null;
  if (isCalendarEvent) {
    try {
      calendarEventData = JSON.parse(message.content!.replace('[CALENDAR_EVENT]:', ''));
    } catch {}
  }

  const isCallSummary = message.content?.startsWith('[CALL_SUMMARY]:');
  let callSummaryData: {
    callType: 'AUDIO' | 'VIDEO';
    durationSeconds: number;
    startedAt: string;
    endedAt: string;
  } | null = null;

  if (isCallSummary) {
    try {
      callSummaryData = JSON.parse(message.content!.replace('[CALL_SUMMARY]:', ''));
    } catch {}
  }

  const formatDuration = (sec: number) => {
    if (sec < 60) return t.calls.durationSeconds.replace('{sec}', String(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0
      ? t.calls.durationMinutesSeconds.replace('{min}', String(m)).replace('{sec}', String(s))
      : t.calls.durationMinutes.replace('{min}', String(m));
  };

  const renderContentWithMentions = (text: string) => {
    const parts = text.split(/(@[a-zA-Z0-9_\.\u00C0-\u024F\u1EA0-\u1EF9]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@') && part.length > 1) {
        return (
          <span
            key={i}
            className={`font-semibold rounded px-1.5 py-0.5 ${
              isSenderMe
                ? 'bg-black/10 dark:bg-white/15 text-current'
                : 'msg-bubble-mention-other'
            }`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const hasReactions =
    message.reactionCounts && Object.keys(message.reactionCounts).length > 0;

  return (
    <div
      id={`message-${message.id}`}
      className={`group relative flex flex-col transition-all w-full ${
        isSenderMe ? 'items-end' : 'items-start'
      }`}
    >
      {/* Pinned indicator badge */}
      {message.isPinned && (
        <div className="flex items-center gap-1 text-[10px] font-medium text-circle-slate dark:text-circle-dark-muted mb-1 px-1">
          <Pin className="h-3 w-3" />
          <span>{t.chat.pinnedBadge}</span>
        </div>
      )}

      {/* Timestamp ON TOP (ONLY on click/tap) */}
      {showTimestamp && (
        <div
          className={`text-[10px] font-mono mb-1 px-1 text-circle-slate/60 dark:text-circle-dark-muted/60 select-none animate-in fade-in transition-opacity ${
            isSenderMe ? 'text-right' : 'text-left'
          }`}
        >
          {sentTime}
        </div>
      )}

      {/* Message Bubble Container - w-fit ensures it hugs only the content width and NEVER stretches */}
      <div className="relative inline-block w-fit max-w-full">
        <div
          onClick={() => setShowTimestamp((prev) => !prev)}
          className={`relative cursor-pointer select-text transition-all shadow-sm w-fit max-w-full ${getBubbleRadius()} ${
            isMomentReply && !message.content
              ? 'p-0 bg-transparent border-0 shadow-none'
              : isMomentReply && message.content
              ? 'p-1.5 ' + (isSenderMe ? 'msg-bubble-me' : 'msg-bubble-other')
              : 'px-4 py-2.5 ' + (isSenderMe ? 'msg-bubble-me' : 'msg-bubble-other')
          } ${message.isPinned ? 'ring-2 ring-amber-400/40' : ''} ${
            isHighlighted
              ? 'ring-2 ring-circle-primary dark:ring-circle-dark-primary shadow-lg scale-[1.02] bg-circle-primary/10 transition-all duration-300'
              : ''
          }`}
        >
          {/* Reply Quote Banner - Click to jump smoothly to replied message */}
          {hasValidReply && replyTarget && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (replyTargetId && onJumpToMessage) {
                  onJumpToMessage(replyTargetId);
                }
              }}
              title={t.chat.replyAction}
              className={`flex items-center gap-2 mb-1.5 rounded-xl px-2.5 py-1 text-xs max-w-full cursor-pointer hover:opacity-80 active:scale-[0.98] transition-all select-none ${
                isSenderMe
                  ? 'msg-bubble-reply-quote-me'
                  : 'msg-bubble-reply-quote-other'
              }`}
            >
              <Reply className="h-3 w-3 shrink-0 scale-x-[-1] opacity-75" />
              <span className={`font-semibold shrink-0 ${isSenderMe ? '' : 'msg-bubble-reply-author-other'}`}>
                {replyTarget.sender?.nickname ||
                  replyTarget.sender?.user?.profile?.displayName ||
                  (replyTarget.sender as any)?.profile?.displayName ||
                  (replyTarget.sender as any)?.user?.email?.split('@')[0] ||
                  t.auth.guest}
                :
              </span>
              <span className="truncate opacity-90">
                {replyTarget.content ||
                  (() => {
                    const meta = parseMomentReplyMetadata(
                      (replyTarget as any).fileName,
                    );
                    if (meta) {
                      return meta.caption
                        ? `📸 "${meta.caption}"`
                        : `📸 Khoảnh khắc của ${meta.authorName}`;
                    }
                    return null;
                  })() ||
                  (replyTarget.type === MessageType.FILE ? `[${t.chat.fileDownload}]` : '') ||
                  t.calls.messageFallback}
              </span>
            </div>
          )}

          {/* Moment Card Chat Embed (Đồng bộ chuẩn vuông 1:1, PiP, góc trên phải với app) */}
          {isMomentReply && message.fileUrl && (
            <div className={message.content ? 'mb-1.5' : ''} onClick={(e) => e.stopPropagation()}>
              <MomentCardChatEmbed
                fileUrl={message.fileUrl}
                metadata={momentMeta}
                fallbackCreatedAt={message.sentAt}
                locale={locale}
              />
            </div>
          )}

          {/* Message Content: Call Summary vs Standard Text */}
          {isCallSummary && callSummaryData ? (
            <div className="flex items-center gap-2.5 py-1 pr-1">
              {callSummaryData.callType === 'VIDEO' ? (
                <Video
                  className={`h-5 w-5 shrink-0 ${
                    isSenderMe
                      ? 'text-current'
                      : 'text-circle-slate dark:text-circle-dark-muted'
                  }`}
                />
              ) : (
                <Phone
                  className={`h-5 w-5 shrink-0 ${
                    isSenderMe
                      ? 'text-current'
                      : 'text-circle-slate dark:text-circle-dark-muted'
                  }`}
                />
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-bold truncate">
                  {callSummaryData.callType === 'VIDEO'
                    ? t.calls.videoCallEnded
                    : t.calls.audioCallEnded}
                </span>
                <span
                  className={`text-[11px] font-medium ${
                    isSenderMe
                      ? 'text-current opacity-85'
                      : 'text-circle-slate dark:text-circle-dark-muted'
                  }`}
                >
                  {t.calls.durationLabel.replace('{duration}', formatDuration(callSummaryData.durationSeconds || 0))}
                </span>
              </div>
            </div>
          ) : message.content ? (
            <div
              className={`text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed font-normal ${
                isMomentReply ? 'px-2 pt-1 pb-1 font-medium' : ''
              }`}
            >
              {renderContentWithMentions(message.content)}
            </div>
          ) : null}

          {/* Attachment: Image (Standard Non-Moment Image) */}
          {!isMomentReply && isImageAttachment && message.fileUrl && (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  setPreviewImageUrl(message.fileUrl!);
                  setIsImageModalOpen(true);
                }}
                className="group/img relative max-w-sm overflow-hidden rounded-2xl border border-white/20 dark:border-black/20 shadow-sm hover:opacity-95 transition-opacity"
              >
                <img
                  src={message.fileUrl}
                  alt={message.fileName || 'Attachment'}
                  className="max-h-72 w-auto object-cover rounded-2xl"
                />
              </button>
            </div>
          )}

          {/* Lightbox Modal */}
          {isImageModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150"
              onClick={() => {
                setIsImageModalOpen(false);
                setPreviewImageUrl(null);
              }}
            >
              <img
                src={previewImageUrl || message.fileUrl!}
                alt={message.fileName || 'Attachment'}
                className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl select-none"
              />
            </div>
          )}

          {/* Attachment: Document / Generic File */}
          {message.type === MessageType.FILE && !isImageAttachment && message.fileUrl && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`mt-2 inline-flex items-center gap-3 rounded-xl p-2.5 max-w-sm shadow-sm ${
                isSenderMe
                  ? 'bg-black/5 dark:bg-white/10 text-current border border-black/10 dark:border-white/10'
                  : 'bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text'
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isSenderMe
                    ? 'bg-black/10 dark:bg-white/15 text-current'
                    : 'bg-black/5 dark:bg-white/5 text-circle-slate dark:text-circle-dark-muted'
                }`}
              >
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
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10 dark:bg-white/20 hover:bg-black/15 dark:hover:bg-white/30 text-current transition-colors"
                title={t.chat.fileDownload}
              >
                <Download className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Overlapping Reaction Badge (Bottom-Right Corner, High-Quality Vector Emojis, No Counts, Flat) */}
          {hasReactions && (
            <div className="absolute -bottom-2 right-1.5 flex items-center gap-1 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white/95 dark:bg-circle-dark-surface px-1.5 py-0.5 shadow-2xs select-none">
              {Object.keys(message.reactionCounts!).map((emoji) => (
                <Emoji key={emoji} emoji={emoji} size={14} />
              ))}
            </div>
          )}
        </div>

        {/* Hover Action Bar (Pin, Reply, Quick Emojis) - High up above bubble, level with timestamp, never covers bubble */}
        <div
          className={`absolute bottom-[calc(100%+4px)] hidden group-hover:flex items-center gap-0.5 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-1 shadow-circle-hover transition-all z-20 before:absolute before:-bottom-2 before:left-0 before:right-0 before:h-3 ${
            isSenderMe ? 'right-0' : 'left-0'
          }`}
        >
          {/* Quick Emoji Buttons (High-Quality Vector Emojis) */}
          <div className="flex items-center gap-0.5 pr-1 border-r border-circle-hairline dark:border-circle-dark-hairline">
            {PROMINENT_QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(message.id, emoji)}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-transform hover:scale-125"
                title={emoji}
              >
                <Emoji emoji={emoji} size={16} />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsFullEmojiOpen(true)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-charcoal dark:hover:text-white transition-colors"
              title="Thêm biểu cảm khác"
            >
              <Smile className="h-3.5 w-3.5" />
            </button>
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

          {/* Pin / Unpin Action (Forbidden for call summaries) */}
          {!isCallSummary && (
            <button
              type="button"
              onClick={() => onTogglePin(message.id, !!message.isPinned)}
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                message.isPinned
                  ? 'text-circle-charcoal dark:text-circle-dark-text bg-circle-canvas dark:bg-circle-dark-canvas'
                  : 'text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas hover:text-circle-charcoal dark:hover:text-circle-dark-text'
              }`}
              title={message.isPinned ? t.chat.unpinAction : t.chat.pinAction}
            >
              <Pin className={`h-3.5 w-3.5 ${message.isPinned ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Sibling Below Bubble: Seen status / Avatar / Sending status */}
      {isLatestMessage ? (
        isSenderMe ? (
          /* Latest Message sent by ME: ALWAYS show who has seen with mini avatar stack on the RIGHT */
          <div className="w-full flex items-center justify-end gap-1.5 mt-1 px-0.5 select-none animate-in fade-in">
            {/* Sending/Failed status if sent by me */}
            {(message.status === 'SENDING' || message.status === 'FAILED') && (
              <span className="inline-flex items-center">
                {message.status === 'SENDING' ? (
                  <span title={t.chat.sendingStatus} className="inline-flex items-center">
                    <Clock className="w-3 h-3 text-circle-primary animate-spin" />
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetry?.(message);
                    }}
                    className="inline-flex items-center text-red-500 hover:opacity-80 cursor-pointer"
                    title={t.chat.retryAction}
                  >
                    <AlertCircle className="w-3 h-3 text-red-500" />
                  </button>
                )}
              </span>
            )}

            {/* Mini avatar stack on the right */}
            {message.readers && message.readers.length > 0 ? (
              <div
                className="flex items-center -space-x-1"
                title={message.readers.map((r) => r.displayName || (r as any).nickname || 'Member').join(', ')}
              >
                {message.readers.slice(0, 5).map((reader) => (
                  <span
                    key={reader.userId}
                    className="w-4 h-4 rounded-full overflow-hidden border border-white dark:border-circle-dark-surface bg-circle-wash dark:bg-circle-dark-wash inline-flex items-center justify-center shrink-0 shadow-xs"
                    title={reader.displayName || (reader as any).nickname || 'Member'}
                  >
                    {reader.avatarUrl ? (
                      <img
                        src={reader.avatarUrl}
                        alt={reader.displayName || 'Member'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-[8px] font-bold text-circle-charcoal dark:text-circle-dark-text bg-circle-primary/20">
                        {((reader.displayName || (reader as any).nickname || 'U')).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              /* Sent check mark when sent by me and no one has read yet */
              message.status !== 'SENDING' && message.status !== 'FAILED' && (
                <span
                  className="inline-flex items-center text-circle-primary dark:text-circle-dark-primary"
                  title={t.chat.sentStatus}
                >
                  <Check className="w-3 h-3" />
                </span>
              )
            )}
          </div>
        ) : null
      ) : (
        /* Older messages: Seen by info shown as pure TEXT below ONLY when clicked, NO eye icon */
        showTimestamp && message.readers && message.readers.length > 0 ? (
          <div
            className={`text-[10px] text-circle-slate/70 dark:text-circle-dark-muted/70 mt-1 px-1 font-sans select-none transition-opacity animate-in fade-in max-w-full ${
              isSenderMe ? 'text-right' : 'text-left'
            }`}
          >
            {(() => {
              const names = message.readers
                .map((r) => r.displayName || (r as any).nickname || (r as any).name || 'Member')
                .join(', ');
              if (message.readers.length <= 2) {
                const tmpl = t.chat.seenBy || 'Đã xem bởi {names}';
                return tmpl.includes('{names}') ? tmpl.replace('{names}', names) : `${tmpl} ${names}`;
              }
              const countTmpl = t.chat.seenByCount || 'Đã xem bởi {count} người';
              return countTmpl.includes('{count}')
                ? countTmpl.replace('{count}', String(message.readers.length))
                : `${countTmpl}: ${message.readers.length} người`;
            })()}
          </div>
        ) : isSenderMe && (message.status === 'SENDING' || message.status === 'FAILED') ? (
          <div className="w-full flex items-center justify-end mt-1 px-1">
            {message.status === 'SENDING' ? (
              <Clock className="w-3 h-3 text-circle-primary animate-spin" />
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry?.(message);
                }}
              >
                <AlertCircle className="w-3 h-3 text-red-500" />
              </button>
            )}
          </div>
        ) : null
      )}

      {/* Full Emoji Picker Modal */}
      <FullEmojiPickerModal
        isOpen={isFullEmojiOpen}
        onClose={() => setIsFullEmojiOpen(false)}
        onSelectEmoji={(emoji) => onReact(message.id, emoji)}
      />
    </div>
  );
};
