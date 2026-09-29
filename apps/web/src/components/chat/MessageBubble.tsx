'use client';

import React, { useState } from 'react';
import {
  Pin,
  Reply,
  Smile,
  FileText,
  Download,
  Check,
  MoreVertical,
  Shield,
  Crown,
} from 'lucide-react';
import { MessageEntity, MessageType, MemberRole } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';

interface MessageBubbleProps {
  message: MessageEntity;
  currentUserId?: string;
  onReply: (message: MessageEntity) => void;
  onReact: (messageId: string, emoji: string) => void;
  onTogglePin: (messageId: string, isPinned: boolean) => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUserId,
  onReply,
  onReact,
  onTogglePin,
}) => {
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const senderUser = message.sender?.user;
  const senderProfile = senderUser?.profile;
  const senderName =
    message.sender?.nickname ||
    senderProfile?.displayName ||
    senderUser?.email?.split('@')[0] ||
    t.auth.guest;

  const isSenderMe = currentUserId && senderUser?.id === currentUserId;
  const senderRole = message.sender?.role;

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

  return (
    <div
      className={`group relative flex items-start gap-3 px-3 py-2 rounded-2xl transition-colors hover:bg-circle-canvas/60 dark:hover:bg-circle-dark-elevated/40 ${
        message.isPinned ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''
      }`}
    >
      {/* Pinned indicator banner */}
      {message.isPinned && (
        <div className="absolute top-1 right-3 flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
          <Pin className="h-3 w-3 fill-amber-500 text-amber-500" />
          <span>{t.chat.pinnedBadge}</span>
        </div>
      )}

      {/* Avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-circle-primary/10 text-circle-sage dark:text-circle-primary font-bold text-xs uppercase shadow-sm overflow-hidden select-none">
        {senderProfile?.avatarUrl ? (
          <img
            src={senderProfile.avatarUrl}
            alt={senderName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{senderName.slice(0, 2)}</span>
        )}
      </div>

      {/* Message Content Container */}
      <div className="flex-1 min-w-0">
        {/* Header: Sender Name, Badges & Time */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
            {senderName}
          </span>

          {/* Role badge if Owner or Admin */}
          {senderRole === MemberRole.OWNER && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-circle-primary/20 text-circle-sage dark:text-circle-primary px-1.5 py-0.2 text-[9px] font-semibold">
              <Crown className="h-2.5 w-2.5" />
              <span>{t.home.roleOwner}</span>
            </span>
          )}
          {senderRole === MemberRole.ADMIN && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted px-1.5 py-0.2 text-[9px] font-semibold">
              <Shield className="h-2.5 w-2.5" />
              <span>Admin</span>
            </span>
          )}

          <span className="text-[10px] text-circle-slate dark:text-circle-dark-muted font-mono">
            {sentTime}
          </span>
        </div>

        {/* Reply Quote Banner */}
        {message.replyTo && (
          <div className="flex items-center gap-2 mb-1.5 rounded-lg border-l-2 border-circle-sage/80 bg-circle-canvas/80 dark:bg-circle-dark-canvas/80 px-2 py-1 text-xs">
            <Reply className="h-3 w-3 text-circle-sage shrink-0 scale-x-[-1]" />
            <span className="font-semibold text-circle-sage dark:text-circle-primary shrink-0">
              {message.replyTo.sender?.nickname ||
                message.replyTo.sender?.user?.profile?.displayName ||
                t.auth.guest}
              :
            </span>
            <span className="text-circle-slate dark:text-circle-dark-muted truncate">
              {message.replyTo.type === MessageType.FILE
                ? `[${t.chat.fileDownload}]`
                : message.replyTo.content}
            </span>
          </div>
        )}

        {/* Message Body (Text) */}
        {message.content && (
          <div className="text-xs sm:text-sm text-circle-charcoal dark:text-circle-dark-text whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </div>
        )}

        {/* Attachment: Image */}
        {isImageAttachment && message.fileUrl && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setIsImageModalOpen(true)}
              className="group/img relative max-w-sm overflow-hidden rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline shadow-sm hover:opacity-95 transition-opacity"
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
          <div className="mt-2 inline-flex items-center gap-3 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 p-3 max-w-sm shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-circle-primary/10 text-circle-sage dark:text-circle-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                {message.fileName || 'File'}
              </p>
              <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted">
                {formatFileSize(message.fileSize)}
              </p>
            </div>
            <a
              href={message.fileUrl}
              download={message.fileName || 'download'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-circle-dark-surface text-circle-slate dark:text-circle-dark-muted hover:text-circle-sage hover:bg-circle-wash transition-colors shadow-sm"
              title={t.chat.fileDownload}
            >
              <Download className="h-4 w-4" />
            </a>
          </div>
        )}

        {/* Reaction Chips */}
        {message.reactionCounts && Object.keys(message.reactionCounts).length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {Object.entries(message.reactionCounts).map(([emoji, count]) => {
              const hasReacted = message.userReactions?.includes(emoji);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact(message.id, emoji)}
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all ${
                    hasReacted
                      ? 'border border-circle-sage bg-circle-wash/60 text-circle-sage dark:border-circle-primary dark:bg-circle-dark-wash dark:text-circle-primary shadow-sm'
                      : 'border border-circle-hairline dark:border-circle-dark-hairline bg-white/70 dark:bg-circle-dark-surface/70 text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="text-[10px] font-semibold">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Hover Action Bar */}
      <div className="absolute right-2 -top-3 hidden group-hover:flex items-center gap-0.5 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-1 shadow-circle-hover transition-all z-10">
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
