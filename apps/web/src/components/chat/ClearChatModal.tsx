'use client';

import React, { useState } from 'react';
import { Trash2, X, User, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { ClearChatMode } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';

interface ClearChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: ClearChatMode) => Promise<void>;
  isLoading?: boolean;
}

export const ClearChatModal: React.FC<ClearChatModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const t = useLanguageStore((s) => s.t);
  const [selectedMode, setSelectedMode] = useState<ClearChatMode>('FOR_ME');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(selectedMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-circle-slate/15 dark:border-circle-dark-surface bg-white dark:bg-circle-charcoal text-circle-charcoal dark:text-white shadow-2xl animate-scaleUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-chat-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-circle-slate/10 dark:border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 id="clear-chat-title" className="text-base font-bold text-circle-charcoal dark:text-white">
                {t.chat.clearChatModalTitle}
              </h3>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
                {t.chat.clearChatModalDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Option 1: FOR_ME (Default) */}
          <label
            onClick={() => setSelectedMode('FOR_ME')}
            className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedMode === 'FOR_ME'
                ? 'border-circle-primary bg-circle-primary/5 dark:bg-circle-primary/10 shadow-xs'
                : 'border-circle-slate/15 dark:border-white/10 hover:bg-circle-wash/50 dark:hover:bg-circle-dark-wash/50'
            }`}
          >
            <input
              type="radio"
              name="clearChatMode"
              value="FOR_ME"
              checked={selectedMode === 'FOR_ME'}
              onChange={() => setSelectedMode('FOR_ME')}
              className="mt-1 text-circle-primary focus:ring-circle-primary h-4 w-4"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-circle-primary" />
                <span className="text-sm font-semibold text-circle-charcoal dark:text-white">
                  {t.chat.clearChatForMeTitle}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-circle-primary/10 text-circle-primary">
                  Mặc định
                </span>
              </div>
              <p className="mt-1 text-xs text-circle-slate dark:text-circle-dark-muted leading-relaxed">
                {t.chat.clearChatForMeDesc}
              </p>
            </div>
          </label>

          {/* Option 2: EVERYONE */}
          <label
            onClick={() => setSelectedMode('EVERYONE')}
            className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedMode === 'EVERYONE'
                ? 'border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 shadow-xs'
                : 'border-circle-slate/15 dark:border-white/10 hover:bg-circle-wash/50 dark:hover:bg-circle-dark-wash/50'
            }`}
          >
            <input
              type="radio"
              name="clearChatMode"
              value="EVERYONE"
              checked={selectedMode === 'EVERYONE'}
              onChange={() => setSelectedMode('EVERYONE')}
              className="mt-1 text-rose-500 focus:ring-rose-500 h-4 w-4"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                  {t.chat.clearChatEveryoneTitle}
                </span>
              </div>
              <p className="mt-1 text-xs text-circle-slate dark:text-circle-dark-muted leading-relaxed">
                {t.chat.clearChatEveryoneDesc}
              </p>
            </div>
          </label>

          {/* Alert banner if EVERYONE is chosen */}
          {selectedMode === 'EVERYONE' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Hành động này sẽ xóa toàn bộ nội dung trong nhóm và không thể hoàn tác!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-circle-slate/20 dark:border-white/10 text-sm font-medium text-circle-charcoal dark:text-white hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
            >
              {t.chat.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-all shadow-md shadow-rose-500/20 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{t.chat.clearChatAction}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
