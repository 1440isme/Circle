'use client';

import React, { useState } from 'react';
import { X, Vote, Plus, Trash2, Clock, Loader2 } from 'lucide-react';
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
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createPollMutation = useCreatePollMutation(circleId);

  if (!isOpen) return null;

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
      });

      playMessageSentSound();
      await onPollCreated(createdPoll);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tạo bình chọn');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-6 shadow-xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-circle-primary/10 text-circle-primary flex items-center justify-center font-bold">
              <Vote className="w-4 h-4" />
            </div>
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
            className="p-1 rounded-lg text-circle-slate hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-circle-primary hover:text-circle-primary-hover transition-colors"
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
                className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-wash dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:border-circle-primary transition-all"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-circle-slate hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-circle-primary hover:bg-circle-primary-hover text-white transition-all shadow-xs disabled:opacity-50"
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
        </form>
      </div>
    </div>
  );
};
