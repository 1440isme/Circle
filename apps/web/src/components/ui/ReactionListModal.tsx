'use client';

import React, { useEffect, useState } from 'react';
import { X, Smile } from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';
import { Emoji } from './Emoji';

export interface NormalizedReactionItem {
  id?: string;
  emoji: string;
  name: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface ReactionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  reactions?: NormalizedReactionItem[] | any[];
  reactionCounts?: Record<string, number>;
}

export function normalizeReactionItem(r: any, defaultName: string): NormalizedReactionItem {
  if (!r) return { emoji: '', name: defaultName };
  const emoji = r.emoji || '';
  const memberUser = r.member?.user;
  const profile = memberUser?.profile;
  const name =
    r.name ||
    r.member?.nickname ||
    profile?.displayName ||
    r.user?.displayName ||
    r.user?.profile?.displayName ||
    memberUser?.email?.split('@')[0] ||
    defaultName;
  const avatarUrl =
    r.avatarUrl !== undefined
      ? r.avatarUrl
      : profile?.avatarUrl || r.user?.avatarUrl || r.user?.profile?.avatarUrl || null;

  return {
    id: r.id,
    emoji,
    name,
    avatarUrl,
    createdAt: r.createdAt,
  };
}

export const ReactionListModal: React.FC<ReactionListModalProps> = ({
  isOpen,
  onClose,
  title,
  reactions = [],
  reactionCounts,
}) => {
  const t = useLanguageStore((s) => s.t);
  const [selectedEmojiFilter, setSelectedEmojiFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedEmojiFilter(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultName = t.chat?.defaultMemberName || t.collab?.memberDefault || 'Thành viên';
  const normalizedList: NormalizedReactionItem[] = reactions.map((r) =>
    normalizeReactionItem(r, defaultName),
  );

  // Compute reaction counts if not provided
  const computedCounts: Record<string, number> = reactionCounts
    ? { ...reactionCounts }
    : normalizedList.reduce<Record<string, number>>((acc, item) => {
        if (item.emoji) {
          acc[item.emoji] = (acc[item.emoji] || 0) + 1;
        }
        return acc;
      }, {});

  const emojiTabs = Object.keys(computedCounts);
  const totalCount = Object.values(computedCounts).reduce((acc, count) => acc + count, 0);

  const filteredReactions = selectedEmojiFilter
    ? normalizedList.filter((r) => r.emoji === selectedEmojiFilter)
    : normalizedList;

  const headerTitle = title || t.chat?.reactorsListTitle || 'Người thả cảm xúc';

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
    >
      <div
        className="relative w-full max-w-sm max-h-[80vh] flex flex-col rounded-3xl glass-sheet text-circle-charcoal dark:text-white shadow-2xl animate-scaleUp overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reaction-list-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-circle-slate/10 dark:border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <Smile className="h-4 w-4 text-circle-sage dark:text-circle-primary shrink-0" />
            <h3
              id="reaction-list-title"
              className="text-sm font-bold text-circle-charcoal dark:text-white"
            >
              {headerTitle}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-circle-primary/10 text-circle-sage dark:text-circle-primary font-semibold">
              {totalCount}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common?.close || 'Đóng'}
            className="flex h-7 w-7 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Tabs by Emoji */}
        {emojiTabs.length > 1 && (
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-circle-slate/10 dark:border-white/10 overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedEmojiFilter(null)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
                selectedEmojiFilter === null
                  ? 'bg-circle-primary text-circle-charcoal dark:text-circle-dark-canvas shadow-xs'
                  : 'text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
              }`}
            >
              <span>{t.moments?.viewAll || t.common?.all || 'Tất cả'}</span>
              <span>{totalCount}</span>
            </button>
            {emojiTabs.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedEmojiFilter(emoji)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  selectedEmojiFilter === emoji
                    ? 'bg-circle-primary text-circle-charcoal dark:text-circle-dark-canvas shadow-xs'
                    : 'text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                }`}
              >
                <Emoji emoji={emoji} size={14} />
                <span>{computedCounts[emoji]}</span>
              </button>
            ))}
          </div>
        )}

        {/* Reaction List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {filteredReactions.length > 0 ? (
            filteredReactions.map((r, idx) => {
              const name = r.name;
              const avatar = r.avatarUrl;

              return (
                <div
                  key={r.id || `reaction-${idx}`}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-circle-primary/10 text-circle-sage dark:text-circle-primary font-bold text-xs uppercase overflow-hidden">
                      {avatar ? (
                        <img src={avatar} alt={name} className="h-full w-full object-cover" />
                      ) : (
                        <span>{name.slice(0, 2)}</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-circle-charcoal dark:text-white truncate">
                      {name}
                    </span>
                  </div>

                  <div className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline shadow-2xs">
                    <Emoji emoji={r.emoji} size={16} />
                  </div>
                </div>
              );
            })
          ) : emojiTabs.length > 0 ? (
            // Fallback if individual reactor records are not loaded yet: show emoji summary counts
            <div className="space-y-2 py-2">
              {emojiTabs.map((emoji) => (
                <div
                  key={emoji}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-circle-canvas/40 dark:bg-circle-dark-canvas/40"
                >
                  <div className="flex items-center gap-2">
                    <Emoji emoji={emoji} size={20} />
                    <span className="text-xs text-circle-slate dark:text-circle-dark-muted font-medium">
                      {computedCounts[emoji]} {(t.chat as any)?.reactionsCountSuffix || ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-circle-slate dark:text-circle-dark-muted">
              <Smile className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>{t.chat?.noReactionsYet || 'Chưa có phản ứng nào'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
