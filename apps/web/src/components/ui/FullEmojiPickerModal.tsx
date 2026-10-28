'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { EMOJI_CATEGORIES } from '@circle/shared';
import { useLanguageStore } from '@/stores/language.store';
import { Emoji } from './Emoji';

interface FullEmojiPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  title?: string;
}

export const FullEmojiPickerModal: React.FC<FullEmojiPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
  title,
}) => {
  const t = useLanguageStore((s) => s.t);
  const resolvedTitle = title || t.emoji?.title || 'Chọn biểu cảm';
  const [activeCategoryId, setActiveCategoryId] = useState<string>(EMOJI_CATEGORIES[0]?.id || 'smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentCategory = EMOJI_CATEGORIES.find((c) => c.id === activeCategoryId) || EMOJI_CATEGORIES[0];
  const displayedEmojis = searchQuery.trim().length > 0
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis)
    : currentCategory.emojis;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-3xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-circle-hairline dark:border-circle-dark-hairline">
          <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
            {resolvedTitle}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Categories Bar (Clean Icon-Only Tabs) */}
        <div className="flex items-center justify-around px-3 py-2 border-b border-circle-hairline dark:border-circle-dark-hairline">
          {EMOJI_CATEGORIES.map((cat) => {
            const isActive = activeCategoryId === cat.id;
            const categoryName = (t.emoji?.categories as any)?.[cat.id] || cat.name;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategoryId(cat.id);
                  setSearchQuery('');
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-all ${
                  isActive
                    ? 'bg-circle-canvas dark:bg-circle-dark-canvas border border-circle-hairline dark:border-circle-dark-hairline shadow-xs scale-110'
                    : 'hover:bg-circle-wash dark:hover:bg-circle-dark-wash opacity-60 hover:opacity-100'
                }`}
                title={categoryName}
                aria-label={categoryName}
              >
                <span>{cat.icon}</span>
              </button>
            );
          })}
        </div>

        {/* Emoji Grid */}
        <div className="p-4 overflow-y-auto max-h-[360px] custom-scrollbar grid grid-cols-8 gap-2">
          {displayedEmojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              type="button"
              onClick={() => {
                onSelectEmoji(emoji);
                onClose();
              }}
              className="flex items-center justify-center p-2 rounded-xl hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-transform hover:scale-125 active:scale-95"
              title={emoji}
            >
              <Emoji emoji={emoji} size={24} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
