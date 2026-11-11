'use client';

import React, { useState, useEffect } from 'react';
import {
  Vote,
  Plus,
  Trash2,
  Lock,
  Clock,
  Users,
  AlertCircle,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguageStore } from '../../stores/language.store';
import {
  usePollsQuery,
  useCreatePollMutation,
  useVotePollMutation,
  useClosePollMutation,
  useDeletePollMutation,
  TOOLS_KEYS,
} from '../../hooks/use-circle-tools';
import { getSocket } from '../../lib/socket';

interface CirclePollViewProps {
  circleId: string;
}

export const CirclePollView: React.FC<CirclePollViewProps> = ({ circleId }) => {
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [deadline, setDeadline] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    pollId: string;
    type: 'close' | 'delete';
  } | null>(null);

  const { data: polls = [], isLoading: isLoadingPolls } = usePollsQuery(circleId);
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !circleId) return;

    const onPollUpdated = () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.polls(circleId) });
    };

    socket.on('circle:poll-created', onPollUpdated);
    socket.on('circle:poll-voted', onPollUpdated);
    socket.on('circle:poll-closed', onPollUpdated);
    socket.on('circle:poll-deleted', onPollUpdated);

    return () => {
      socket.off('circle:poll-created', onPollUpdated);
      socket.off('circle:poll-voted', onPollUpdated);
      socket.off('circle:poll-closed', onPollUpdated);
      socket.off('circle:poll-deleted', onPollUpdated);
    };
  }, [circleId, queryClient]);

  useEffect(() => {
    if (!isCreateModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCreateModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen]);

  const createPollMutation = useCreatePollMutation(circleId);
  const votePollMutation = useVotePollMutation(circleId);
  const closePollMutation = useClosePollMutation(circleId);
  const deletePollMutation = useDeletePollMutation(circleId);

  const handleOpenCreateModal = () => {
    setCreateError(null);
    setQuestion('');
    setOptions(['', '']);
    setDeadline('');
    setIsCreateModalOpen(true);
  };

  const handleAddOptionField = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOptionField = (idx: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!question.trim()) {
      setCreateError(t.collab.pollValidationQuestion);
      return;
    }
    if (validOptions.length < 2) {
      setCreateError(t.collab.pollValidationOptions);
      return;
    }

    try {
      await createPollMutation.mutateAsync({
        question: question.trim(),
        options: validOptions,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      });
      setQuestion('');
      setOptions(['', '']);
      setDeadline('');
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setCreateError(err?.message || t.collab.createPollError);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    setPollError(null);
    try {
      await votePollMutation.mutateAsync({
        pollId,
        input: { optionId },
      });
    } catch (err: any) {
      setPollError(err?.message || t.collab.votePollError);
    }
  };

  const handleConfirmPollAction = async () => {
    if (!pendingAction) return;
    setPollError(null);
    try {
      if (pendingAction.type === 'close') {
        await closePollMutation.mutateAsync(pendingAction.pollId);
      } else {
        await deletePollMutation.mutateAsync(pendingAction.pollId);
      }
      setPendingAction(null);
    } catch (err: any) {
      setPollError(
        err?.message ||
          (pendingAction.type === 'close' ? t.collab.closePollError : t.collab.deletePollError),
      );
    }
  };

  return (
    <div className="relative flex-1 flex flex-col h-full bg-white dark:bg-circle-dark-bg overflow-hidden">
      {/* Floating Pill Controls (Bỏ heading & text 'Bình chọn nhóm', thay bằng Floating Pill Button tạo bình chọn) */}
      <div className="pointer-events-none absolute top-14 lg:top-3 left-0 right-0 z-20 flex flex-col items-center gap-2 px-4">
        <div className="max-w-4xl w-full flex justify-end">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-4 h-9 rounded-full backdrop-blur-xl bg-circle-primary hover:bg-circle-sage text-circle-charcoal dark:text-circle-dark-canvas hover:text-white dark:hover:text-white font-semibold text-xs sm:text-sm shadow-sm border border-circle-hairline/60 dark:border-white/12 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>{t.collab.createPoll}</span>
          </button>
        </div>
      </div>

      {/* Poll Cards List (Scroll-under content with safe top padding) */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-28 lg:pt-20 pb-12">
        {pollError && (
          <div className="mb-4 max-w-5xl mx-auto flex items-center justify-between gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{pollError}</span>
            </div>
            <button
              type="button"
              onClick={() => setPollError(null)}
              className="p-1 hover:opacity-75"
              aria-label={t.common.close}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {isLoadingPolls ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-circle-sage dark:text-circle-dark-primary" />
          </div>
        ) : polls.length === 0 ? (
          <div className="h-80 max-w-3xl mx-auto flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-circle-hairline dark:border-circle-dark-border rounded-3xl bg-circle-canvas/50 dark:bg-circle-dark-surface/30">
            <Vote className="w-9 h-9 text-circle-sage dark:text-circle-dark-primary opacity-75 mb-3" />
            <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text mb-1">
              {t.collab.pollEmptyTitle}
            </h3>
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted max-w-sm mb-5">
              {t.collab.pollEmptyDesc}
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-xl bg-circle-primary hover:bg-circle-sage text-circle-charcoal dark:text-circle-dark-canvas hover:text-white dark:hover:text-white text-xs font-bold transition-colors shadow-sm"
            >
              {t.collab.pollCreateFirst}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {polls.map((poll) => {
              const isExpired = poll.deadline ? new Date() > new Date(poll.deadline) : false;
              const isClosed = poll.isClosed || isExpired;
              const isPendingAction = pendingAction?.pollId === poll.id;

              return (
                <div
                  key={poll.id}
                  className="rounded-3xl border border-circle-hairline dark:border-circle-dark-border bg-white dark:bg-circle-dark-surface p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isClosed ? (
                          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-circle-wash dark:bg-circle-dark-hover text-circle-slate dark:text-circle-dark-muted flex items-center gap-1">
                            <Lock className="w-3 h-3" /> {t.collab.pollClosedBadge}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {t.collab.pollOpenBadge}
                          </span>
                        )}
                        <span className="text-xs text-circle-slate dark:text-circle-dark-muted">
                          {t.collab.pollTotalVotes.replace('{count}', String(poll.totalVotes))}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!isClosed && (
                          <button
                            type="button"
                            onClick={() =>
                              setPendingAction(
                                isPendingAction && pendingAction?.type === 'close'
                                  ? null
                                  : { pollId: poll.id, type: 'close' },
                              )
                            }
                            className="p-1.5 text-circle-slate dark:text-circle-dark-muted hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors"
                            title={t.collab.pollCloseTitle}
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setPendingAction(
                              isPendingAction && pendingAction?.type === 'delete'
                                ? null
                                : { pollId: poll.id, type: 'delete' },
                            )
                          }
                          className="p-1.5 text-circle-slate dark:text-circle-dark-muted hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title={t.collab.pollDeleteTitle}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Confirmation Bar */}
                    {isPendingAction && (
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
                        <span className="text-circle-charcoal dark:text-circle-dark-text font-medium">
                          {pendingAction.type === 'close'
                            ? `${t.collab.pollCloseConfirm} ${t.collab.pollCloseDesc}`
                            : t.collab.pollDeleteConfirm}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                          <button
                            type="button"
                            onClick={() => setPendingAction(null)}
                            className="px-2.5 py-1 rounded-lg text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash font-semibold"
                          >
                            {t.common.cancel}
                          </button>
                          <button
                            type="button"
                            disabled={closePollMutation.isPending || deletePollMutation.isPending}
                            onClick={handleConfirmPollAction}
                            className={`px-2.5 py-1 rounded-lg text-white font-semibold disabled:opacity-50 ${
                              pendingAction.type === 'close'
                                ? 'bg-amber-600 hover:bg-amber-700'
                                : 'bg-rose-600 hover:bg-rose-700'
                            }`}
                          >
                            {t.common.confirm}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Question */}
                    <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text mb-4">
                      {poll.question}
                    </h3>

                    {/* Options List */}
                    <div className="space-y-3 mb-5">
                      {poll.options.map((opt) => {
                        const isSelected = poll.userVotedOptionId === opt.id;

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={isClosed || votePollMutation.isPending}
                            onClick={() => !isClosed && handleVote(poll.id, opt.id)}
                            className={`w-full text-left relative overflow-hidden rounded-2xl border p-3.5 transition-all ${
                              isSelected
                                ? 'border-circle-sage dark:border-circle-dark-primary bg-circle-primary/10 dark:bg-circle-dark-primary/10 shadow-sm'
                                : 'border-circle-hairline dark:border-circle-dark-border hover:border-circle-sage/50 dark:hover:border-circle-dark-hover bg-circle-canvas/50 dark:bg-circle-dark-bg/50'
                            } ${isClosed ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            {/* Animated Percentage Fill Bar */}
                            <div
                              style={{ width: `${opt.percentage}%` }}
                              className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ease-out pointer-events-none ${
                                isSelected
                                  ? 'bg-circle-primary/25 dark:bg-circle-dark-primary/25'
                                  : 'bg-circle-slate/15 dark:bg-white/10'
                              }`}
                            />

                            <div className="relative z-10 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'border-circle-primary bg-circle-primary text-circle-charcoal dark:text-circle-dark-canvas'
                                      : 'border-circle-hairline dark:border-gray-600'
                                  }`}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                                <span
                                  className={`text-sm truncate ${
                                    isSelected
                                      ? 'font-bold text-circle-sage dark:text-circle-dark-primary'
                                      : 'font-medium text-circle-charcoal dark:text-circle-dark-text'
                                  }`}
                                >
                                  {opt.optionText}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-xs font-bold text-circle-charcoal dark:text-circle-dark-text shrink-0">
                                <span>{t.collab.pollVoteUnit.replace('{count}', String(opt.voteCount))}</span>
                                <span className="text-circle-slate dark:text-circle-dark-muted font-normal">
                                  ({opt.percentage}%)
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="pt-3 border-t border-circle-hairline/70 dark:border-circle-dark-border/60 flex items-center justify-between text-[11px] text-circle-slate dark:text-circle-dark-muted gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {t.collab.pollCreatedBy.replace(
                          '{name}',
                          poll.creator?.user?.profile?.displayName || t.collab.memberDefault,
                        )}
                      </span>
                    </div>

                    {poll.deadline && (
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>
                          {t.collab.pollDeadlinePrefix.replace(
                            '{date}',
                            new Date(poll.deadline).toLocaleDateString(
                              locale === 'vi' ? 'vi-VN' : 'en-US',
                            ),
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Poll */}
      {isCreateModalOpen && (
        <div
          onClick={(e) => e.target === e.currentTarget && setIsCreateModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
        >
          <div className="glass-sheet rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.collab.pollCreateModalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white"
                aria-label={t.common.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1.5">
                  {t.collab.pollQuestionLabel}
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t.collab.pollQuestionExample}
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-circle-hairline dark:border-circle-dark-border bg-white dark:bg-circle-dark-bg text-circle-charcoal dark:text-circle-dark-text text-sm outline-none focus:border-circle-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1.5">
                  {t.collab.pollOptionsLabel}
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={t.collab.pollOptionPlaceholder.replace('{index}', String(idx + 1))}
                        required
                        className="flex-1 px-3 py-2 rounded-xl border border-circle-hairline dark:border-circle-dark-border bg-white dark:bg-circle-dark-bg text-circle-charcoal dark:text-circle-dark-text text-xs outline-none focus:border-circle-primary"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionField(idx)}
                          className="p-2 text-circle-slate dark:text-circle-dark-muted hover:text-rose-500 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-hover"
                          title={t.collab.removeOption}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {options.length < 8 && (
                  <button
                    type="button"
                    onClick={handleAddOptionField}
                    className="mt-2 text-xs font-bold text-circle-sage dark:text-circle-dark-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> {t.collab.addOption}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1.5">
                  {t.collab.pollDeadline}
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-circle-hairline dark:border-circle-dark-border bg-white dark:bg-circle-dark-bg text-circle-charcoal dark:text-circle-dark-text text-xs outline-none focus:border-circle-primary [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              {createError && (
                <div className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-hover rounded-xl"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createPollMutation.isPending}
                  className="px-5 py-2 text-xs font-bold bg-circle-primary hover:bg-circle-sage text-circle-charcoal dark:text-circle-dark-canvas hover:text-white dark:hover:text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {createPollMutation.isPending ? t.collab.pollCreating : t.collab.createPoll}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
