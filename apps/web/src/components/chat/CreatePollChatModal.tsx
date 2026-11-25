'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Vote, Plus, Trash2, Clock, Loader2, Lock } from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';
import { useCreatePollMutation } from '../../hooks/use-circle-tools';
import { playMessageSentSound } from '../../utils/sound-effects';

interface CreatePollChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId: string;
  onPollCreated: (poll: any) => Promise<void>;
}

export const CreatePollChatModal: React.FC<CreatePollChatModalProps> = ({
  isOpen,
  onClose,
  circleId,
  onPollCreated,
}) => {
  const t = useLanguageStore((s) => s.t);
  const [mounted, setMounted] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [deadline, setDeadline] = useState('');
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuestion('');
      setOptions(['', '']);
      setDeadline('');
      setIsMultipleChoice(false);
      setIsAnonymous(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  const createPollMutation = useCreatePollMutation(circleId);

  if (!isOpen || !mounted) return null;

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const next = [...options];
    next[index] = val;
    setOptions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setErrorMsg(t.collab.pollValidationQuestion);
      return;
    }

    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (validOptions.length < 2) {
      setErrorMsg(t.collab.pollValidationOptions);
      return;
    }

    try {
      setIsSubmitting(true);
      const createdPoll = await createPollMutation.mutateAsync({
        question: trimmedQuestion,
        options: validOptions,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        isMultipleChoice,
        isAnonymous,
      });

      playMessageSentSound();
      await onPollCreated(createdPoll);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || t.collab.createPollError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl glass-sheet p-6 shadow-xl animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <Vote className="w-5 h-5 text-circle-sage dark:text-circle-primary shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.collab.createPoll}
              </h3>
              <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
                {t.collab.createPollHint}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label={t.common.close}
            className="p-1 rounded-lg text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium shrink-0">
            {errorMsg}
          </div>
        )}

        <form
          id="create-poll-chat-form"
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 pr-1 pb-2"
        >
          {/* Quick Template Chips */}
          <div>
            <label className="block text-[11px] font-semibold text-circle-slate dark:text-circle-dark-muted mb-1.5">
              {t.collab.pollQuickTemplates || 'Mẫu bình chọn nhanh'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                {
                  label: t.collab.pollTemplateFood || '🍜 Trưa nay ăn gì?',
                  question: 'Trưa nay ăn gì cả nhà?',
                  options: ['Cơm tấm', 'Bún bò Huế', 'Phở bò', 'Trà sữa'],
                },
                {
                  label: t.collab.pollTemplateOuting || '🏖️ Cuối tuần đi đâu?',
                  question: 'Cuối tuần này đi đâu chơi?',
                  options: ['Cà phê chill', 'Dã ngoại cắm trại', 'Đi xem phim', 'Ở nhà ngủ'],
                },
                {
                  label: t.collab.pollTemplateTime || '⏰ Giờ hẹn?',
                  question: 'Mấy giờ hẹn gặp nhau?',
                  options: ['08:00 sáng', '10:30 sáng', '14:00 chiều', '18:30 tối'],
                },
              ].map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setQuestion(tpl.question);
                    setOptions([...tpl.options]);
                  }}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-circle-hairline dark:border-circle-dark-hairline bg-black/5 dark:bg-white/5 hover:bg-circle-primary/10 hover:border-circle-primary/30 hover:text-circle-primary transition-all active:scale-95"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question */}
          <div>
            <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1.5">
              {t.collab.pollTitle} *
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t.collab.pollQuestionPlaceholder}
              autoFocus
              className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-wash dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/60 focus:outline-none focus:border-circle-primary transition-all"
            />
          </div>

          {/* Options */}
          <div>
            <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1.5">
              {t.collab.addOption} *
            </label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={t.collab.pollOptionPlaceholder.replace('{index}', String(idx + 1))}
                    className="flex-1 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-wash dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/60 focus:outline-none focus:border-circle-primary transition-all"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title={t.collab.removeOption}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 8 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-circle-sage dark:text-circle-primary hover:opacity-80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.collab.addOption}</span>
              </button>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1.5">
              {t.collab.pollDeadline}
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-wash dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:border-circle-primary transition-all"
              />
            </div>
          </div>

          {/* Advanced Poll Options */}
          <div className="space-y-2.5 pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isMultipleChoice}
                onChange={(e) => setIsMultipleChoice(e.target.checked)}
                className="w-4 h-4 rounded text-circle-primary focus:ring-circle-primary accent-circle-primary cursor-pointer"
              />
              <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                {t.collab.pollIsMultipleChoice || 'Cho phép chọn nhiều phương án'}
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded text-circle-primary focus:ring-circle-primary accent-circle-primary mt-0.5 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-500" />
                  {t.collab.pollIsAnonymous || 'Bình chọn ẩn danh'}
                </span>
                <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                  {t.collab.pollAnonymousNotice || 'Danh tính người bỏ phiếu được giữ kín.'}
                </p>
              </div>
            </label>
          </div>
        </form>

        {/* Pinned Footer Submit Buttons (Never scrolled out of view) */}
        <div className="flex items-center justify-end gap-2.5 pt-3 mt-2 border-t border-circle-hairline dark:border-circle-dark-hairline shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            form="create-poll-chat-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-dark-canvas hover:bg-circle-sage dark:hover:bg-circle-sage dark:hover:text-white transition-all shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t.common.loading}</span>
              </>
            ) : (
              <span>{t.collab.createPoll}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
