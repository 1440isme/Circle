'use client';

import React from 'react';
import { X, Pin, FileText, Download } from 'lucide-react';
import { MessageEntity, MessageType } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';

interface PinnedMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedMessages: MessageEntity[];
  isLoading: boolean;
  onUnpin: (messageId: string) => void;
}

export const PinnedMessagesModal: React.FC<PinnedMessagesModalProps> = ({
  isOpen,
  onClose,
  pinnedMessages,
  isLoading,
  onUnpin,
}) => {
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-circle-modal overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-circle-hairline dark:border-circle-dark-hairline px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Pin className="h-4 w-4 fill-amber-500" />
            </div>
            <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text">
              {t.chat.pinnedMessagesTitle.replace('{count}', String(pinnedMessages.length))}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-circle-canvas dark:bg-circle-dark-canvas animate-pulse"
                />
              ))}
            </div>
          ) : pinnedMessages.length > 0 ? (
            pinnedMessages.map((msg) => {
              const senderUser = msg.sender?.user;
              const senderProfile = senderUser?.profile;
              const senderName =
                msg.sender?.nickname ||
                senderProfile?.displayName ||
                senderUser?.email?.split('@')[0] ||
                t.auth.guest;

              const sentTime = new Date(msg.sentAt).toLocaleDateString(
                locale === 'vi' ? 'vi-VN' : 'en-US',
                {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                },
              );

              return (
                <div
                  key={msg.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 p-3 hover:bg-circle-canvas transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-circle-primary/10 text-circle-sage dark:text-circle-primary font-bold text-xs uppercase overflow-hidden">
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
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                          {senderName}
                        </span>
                        <span className="text-[10px] text-circle-slate dark:text-circle-dark-muted font-mono">
                          {sentTime}
                        </span>
                      </div>
                      {msg.content && (
                        <p className="text-xs text-circle-charcoal dark:text-circle-dark-text whitespace-pre-wrap break-words line-clamp-3">
                          {msg.content}
                        </p>
                      )}
                      {msg.type === MessageType.FILE && msg.fileUrl && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-circle-slate">
                          <FileText className="h-3.5 w-3.5 text-circle-sage" />
                          <span className="truncate">{msg.fileName || 'Attachment'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onUnpin(msg.id)}
                    className="shrink-0 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface px-2.5 py-1 text-[11px] font-semibold text-circle-slate dark:text-circle-dark-muted hover:text-circle-coral hover:border-circle-coral/50 transition-colors shadow-sm"
                    title={t.chat.unpinAction}
                  >
                    {t.chat.unpinAction}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-circle-slate dark:text-circle-dark-muted">
              <Pin className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>{t.chat.noPinnedMessages}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-circle-hairline dark:border-circle-dark-hairline px-6 py-3 bg-circle-canvas/30 dark:bg-circle-dark-canvas/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-circle-charcoal dark:bg-circle-primary px-4 py-1.5 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all"
          >
            {t.chat.closePinned}
          </button>
        </div>
      </div>
    </div>
  );
};
