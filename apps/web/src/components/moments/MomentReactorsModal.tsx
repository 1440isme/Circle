'use client';

import React, { useState, useEffect } from 'react';
import { X, Heart, Smile } from 'lucide-react';
import { MomentEntity, MomentReactionEntity } from '@circle/types';
import { useLanguageStore } from '@/stores/language.store';

interface MomentReactorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  moment: MomentEntity | null;
}

export const MomentReactorsModal: React.FC<MomentReactorsModalProps> = ({
  isOpen,
  onClose,
  moment,
}) => {
  const { locale } = useLanguageStore();
  const [selectedEmojiFilter, setSelectedEmojiFilter] = useState<string>('ALL');

  useEffect(() => {
    if (!isOpen) {
      setSelectedEmojiFilter('ALL');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !moment) return null;

  const reactions: MomentReactionEntity[] = moment.reactions || [];

  // Group counts by emoji
  const emojiCounts: Record<string, number> = {};
  reactions.forEach((r) => {
    emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
  });

  const uniqueEmojis = Object.keys(emojiCounts);

  const filteredReactions =
    selectedEmojiFilter === 'ALL'
      ? reactions
      : reactions.filter((r) => r.emoji === selectedEmojiFilter);

  const formatRelativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return locale === 'vi' ? 'Vừa xong' : 'Just now';
      if (diffMins < 60) return `${diffMins}p ${locale === 'vi' ? 'trước' : 'ago'}`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ${locale === 'vi' ? 'trước' : 'ago'}`;
      return d.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-circle-dark-surface rounded-3xl shadow-circle-card border border-circle-hairline dark:border-circle-dark-hairline overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-circle-hairline dark:border-circle-dark-hairline">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text">
              {locale === 'vi' ? 'Lượt bày tỏ cảm xúc' : 'Reactions'}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-circle-primary/20 text-circle-sage dark:text-circle-primary text-xs font-bold">
              {reactions.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Emoji Filters */}
        {reactions.length > 0 && uniqueEmojis.length > 0 && (
          <div className="flex items-center gap-1.5 px-5 py-2.5 overflow-x-auto border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60 bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedEmojiFilter('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedEmojiFilter === 'ALL'
                  ? 'bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal shadow-sm'
                  : 'bg-circle-canvas dark:bg-circle-dark-surface text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash border border-circle-hairline dark:border-circle-dark-hairline'
              }`}
            >
              {locale === 'vi' ? 'Tất cả' : 'All'} ({reactions.length})
            </button>

            {uniqueEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedEmojiFilter(emoji)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  selectedEmojiFilter === emoji
                    ? 'bg-circle-primary/20 border border-circle-primary/50 text-circle-sage dark:text-circle-primary shadow-sm scale-105'
                    : 'bg-circle-canvas dark:bg-circle-dark-surface text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash border border-circle-hairline dark:border-circle-dark-hairline'
                }`}
              >
                <span>{emoji}</span>
                <span>{emojiCounts[emoji]}</span>
              </button>
            ))}
          </div>
        )}

        {/* Reactors List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredReactions.length === 0 ? (
            <div className="py-12 text-center text-circle-slate dark:text-circle-dark-muted space-y-2">
              <Smile className="h-10 w-10 mx-auto opacity-40 stroke-[1.5]" />
              <p className="text-xs">
                {locale === 'vi'
                  ? 'Chưa có ai thả cảm xúc này.'
                  : 'No reactions in this category.'}
              </p>
            </div>
          ) : (
            filteredReactions.map((r) => {
              const displayName = r.user?.displayName || 'Người dùng';
              const avatarUrl = r.user?.avatarUrl;
              const initials = displayName.slice(0, 2).toUpperCase();

              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-circle-wash/60 dark:hover:bg-circle-dark-wash/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar with small emoji badge */}
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full bg-circle-primary text-circle-charcoal font-bold text-xs flex items-center justify-center overflow-hidden border border-circle-hairline dark:border-circle-dark-hairline shadow-sm">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline flex items-center justify-center text-xs shadow-sm">
                        {r.emoji}
                      </div>
                    </div>

                    {/* Name & Time */}
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                        {displayName}
                      </h4>
                      <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
                        {formatRelativeTime(r.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Emoji display pill */}
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-circle-wash dark:bg-circle-dark-wash text-base shrink-0 border border-circle-hairline dark:border-circle-dark-hairline">
                    {r.emoji}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
