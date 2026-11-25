'use client';

import React, { useEffect } from 'react';
import { X, AlertTriangle, Info, Trash2, Loader2 } from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  icon,
  isLoading = false,
}) => {
  const t = useLanguageStore((s) => s.t);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const renderIcon = () => {
    if (icon) return icon;
    if (variant === 'danger') {
      return (
        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
          <Trash2 className="w-5 h-5" />
        </div>
      );
    }
    if (variant === 'warning') {
      return (
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-2xl bg-circle-primary/10 flex items-center justify-center text-circle-primary shrink-0">
        <Info className="w-5 h-5" />
      </div>
    );
  };

  const confirmBtnClass = () => {
    if (variant === 'danger') {
      return 'bg-rose-600 hover:bg-rose-700 text-white';
    }
    if (variant === 'warning') {
      return 'bg-amber-600 hover:bg-amber-700 text-white';
    }
    return 'bg-circle-primary hover:bg-circle-sage text-white';
  };

  const handleConfirmClick = async () => {
    if (isLoading) return;
    await onConfirm();
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && !isLoading && onClose()}
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-sm rounded-3xl glass-sheet text-circle-charcoal dark:text-white shadow-2xl p-6 border border-circle-hairline dark:border-white/10 animate-scaleUp">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {renderIcon()}
            <div>
              <h3 className="text-base font-bold text-circle-charcoal dark:text-white leading-tight">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-full text-circle-slate hover:text-circle-charcoal dark:hover:text-white hover:bg-circle-wash dark:hover:bg-circle-dark-hover transition-colors"
            aria-label={t.common.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {description && (
          <p className="text-xs text-circle-slate dark:text-circle-dark-muted mb-6 leading-relaxed">
            {description}
          </p>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 h-9 text-xs sm:text-sm font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-hover rounded-full transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel || t.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isLoading}
            className={`inline-flex items-center justify-center gap-1.5 px-5 h-9 text-xs sm:text-sm font-bold rounded-full shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${confirmBtnClass()}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel || t.common.confirm}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
