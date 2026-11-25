'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';

export interface ActionChoiceOption {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  isDefault?: boolean;
  variant?: 'default' | 'danger';
}

export interface ActionChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  options: ActionChoiceOption[];
  defaultSelectedId?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'default' | 'danger';
  warningText?: string | ((selectedId: string) => string | null | undefined);
  errorText?: string | null;
  onConfirm: (selectedId: string) => void | Promise<void>;
  isLoading?: boolean;
}

export const ActionChoiceModal: React.FC<ActionChoiceModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  options,
  defaultSelectedId,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'danger',
  warningText,
  errorText,
  onConfirm,
  isLoading = false,
}) => {
  const t = useLanguageStore((s) => s.t);
  const initialId = defaultSelectedId || options[0]?.id || '';
  const [selectedId, setSelectedId] = useState<string>(initialId);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedId(defaultSelectedId || options[0]?.id || '');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, defaultSelectedId, options, onClose, isLoading]);

  if (!isOpen) return null;

  const currentOption = options.find((o) => o.id === selectedId) || options[0];
  const activeWarning =
    typeof warningText === 'function' ? warningText(selectedId) : warningText;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    await onConfirm(selectedId);
  };

  const isCurrentDanger = currentOption?.variant === 'danger';
  const effectiveConfirmVariant =
    confirmVariant === 'danger' || isCurrentDanger ? 'danger' : 'default';

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && !isLoading && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl glass-sheet text-circle-charcoal dark:text-white shadow-2xl animate-scaleUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-choice-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-circle-slate/10 dark:border-white/10 px-6 py-5">
          <div className="flex items-center gap-2.5">
            {icon}
            <div>
              <h3
                id="action-choice-title"
                className="text-base font-bold text-circle-charcoal dark:text-white"
              >
                {title}
              </h3>
              {description && (
                <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label={t.common.close}
            className="flex h-8 w-8 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-3">
            {options.map((option) => {
              const isSelected = selectedId === option.id;
              const isDanger = option.variant === 'danger';
              return (
                <label
                  key={option.id}
                  onClick={() => !isLoading && setSelectedId(option.id)}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? isDanger
                        ? 'border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 shadow-xs'
                        : 'border-circle-primary bg-circle-primary/5 dark:bg-circle-primary/10 shadow-xs'
                      : 'border-circle-slate/15 dark:border-white/10 hover:bg-circle-wash/50 dark:hover:bg-circle-dark-wash/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="actionChoice"
                    value={option.id}
                    checked={isSelected}
                    onChange={() => setSelectedId(option.id)}
                    disabled={isLoading}
                    className={`mt-1 h-4 w-4 ${
                      isDanger
                        ? 'text-rose-500 focus:ring-rose-500'
                        : 'text-circle-primary focus:ring-circle-primary'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {option.icon}
                      <span
                        className={`text-sm font-semibold ${
                          isSelected && isDanger
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-circle-charcoal dark:text-white'
                        }`}
                      >
                        {option.title}
                      </span>
                      {option.isDefault && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-circle-primary/15 text-circle-sage dark:text-circle-primary">
                          {t.common.default}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-circle-slate dark:text-circle-dark-muted leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Active Warning Banner */}
          {activeWarning && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{activeWarning}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorText && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors disabled:opacity-50"
            >
              {cancelLabel || t.chat.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all disabled:opacity-50 ${
                effectiveConfirmVariant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal'
              }`}
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{confirmLabel || t.chat.confirmBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
