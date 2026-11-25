'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Vote, Check, Clock, CheckCircle2, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { usePollDetailQuery, useVotePollMutation, TOOLS_KEYS } from '../../hooks/use-circle-tools';
import { playReactionPopSound } from '../../utils/sound-effects';
import { getSocket } from '../../lib/socket';
import { ApiError } from '../../lib/api';

interface ChatPollCardProps {
  circleId: string;
  pollId: string;
  initialQuestion?: string;
  initialOptions?: string[];
  isSenderMe?: boolean;
}

export const ChatPollCard: React.FC<ChatPollCardProps> = ({
  circleId,
  pollId,
  initialQuestion,
  initialOptions = [],
  isSenderMe = false,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const t = useLanguageStore((s) => s.t);
  const { data: poll, isError, error } = usePollDetailQuery(circleId, pollId);
  const voteMutation = useVotePollMutation(circleId);
  const isDeleted = poll === null || (error instanceof ApiError && error.statusCode === 404);

  // Realtime Socket Listener for Poll Votes & Status Changes
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !pollId) return;

    const detailsKey = TOOLS_KEYS.pollDetail(circleId, pollId);
    const onPollUpdated = (event: { id?: string; pollId?: string }) => {
      if ((event.pollId ?? event.id) === pollId) {
        queryClient.invalidateQueries({ queryKey: detailsKey, exact: true });
      }
    };
    const onPollDeleted = async (event: { pollId: string }) => {
      if (event.pollId !== pollId) return;
      await queryClient.cancelQueries({ queryKey: detailsKey, exact: true });
      queryClient.setQueryData(detailsKey, null);
    };

    socket.on('circle:poll-updated', onPollUpdated);
    socket.on('circle:poll-voted', onPollUpdated);
    socket.on('circle:poll-closed', onPollUpdated);
    socket.on('circle:poll-deleted', onPollDeleted);
    return () => {
      socket.off('circle:poll-updated', onPollUpdated);
      socket.off('circle:poll-voted', onPollUpdated);
      socket.off('circle:poll-closed', onPollUpdated);
      socket.off('circle:poll-deleted', onPollDeleted);
    };
  }, [circleId, pollId, queryClient]);

  const question = poll?.question || initialQuestion || t.collab.pollTitle;
  const isClosed = Boolean(poll?.isClosed || (poll?.deadline && new Date(poll.deadline) <= new Date()));
  const options = poll?.options || initialOptions.map((opt, idx) => ({
    id: `opt-${idx}`,
    pollId,
    optionText: opt,
    orderIndex: idx,
    votes: [],
  }));

  const totalVotes = options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
  const myVotes = poll?.userVotedOptionIds ?? (poll?.userVotedOptionId ? [poll.userVotedOptionId] : []);
  const [draftVotes, setDraftVotes] = useState<string[]>([]);
  const ballot = draftVotes.filter((id) => options.some((option) => option.id === id));
  const canVote = Boolean(poll && !isClosed && myVotes.length === 0);
  const toggleOption = (id: string) => setDraftVotes(poll?.isMultipleChoice
    ? ballot.includes(id) ? ballot.filter((selected) => selected !== id) : [...ballot, id]
    : [id]);

  const [isExpandedLogs, setIsExpandedLogs] = useState(false);
  const [voteError, setVoteError] = useState(false);

  // Compute vote interaction logs
  const voteLogs = useMemo(() => {
    if (!poll?.options || poll.isAnonymous) return [];
    const logs: Array<{ id: string; text: string }> = [];
    poll.options.forEach((opt: any) => {
      (opt.votes || []).forEach((v: any) => {
        const isMe = v.member?.userId === user?.id || (v as any).memberId === user?.id;
        const actorName = isMe
          ? (t.collab.meLabel || 'Bạn')
          : (v.member?.user?.profile?.displayName || t.collab.memberDefault || 'Thành viên');
        const text = isMe
          ? (t.collab.pollVotedLogMe || 'Bạn đã bình chọn cho "{option}"').replace('{option}', opt.optionText)
          : (t.collab.pollVotedLog || '{actor} đã bình chọn cho "{option}"')
              .replace('{actor}', actorName)
              .replace('{option}', opt.optionText);
        logs.push({
          id: v.id || `${opt.id}-${v.memberId || Math.random()}`,
          text,
        });
      });
    });
    return logs;
  }, [poll?.options, poll?.isAnonymous, user?.id, t]);

  const handleVote = async () => {
    if (!canVote || voteMutation.isPending || !ballot.length) return;
    try {
      setVoteError(false);
      playReactionPopSound();
      await voteMutation.mutateAsync({
        pollId,
        input: { optionIds: ballot },
      });
    } catch {
      setVoteError(true);
    }
  };

  return (
    <div
      className={`flex flex-col gap-2.5 py-0.5 min-w-[240px] max-w-[340px] select-none text-left`}
    >
      {/* Question */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap pb-0.5">
          {isClosed && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 font-semibold text-[10px]">
              <Lock className="w-2.5 h-2.5" />
              {t.collab.pollClosedBadge || 'Đã kết thúc'}
            </span>
          )}
          {poll?.isMultipleChoice && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px]">
              {t.collab.pollIsMultipleChoice || 'Nhiều lựa chọn'}
            </span>
          )}
          {poll?.isAnonymous && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">
              <Lock className="w-2.5 h-2.5" />
              {t.collab.pollIsAnonymous || 'Ẩn danh'}
            </span>
          )}
        </div>
        <h4
          className={`text-sm font-bold leading-snug ${
            isSenderMe ? 'text-current' : 'text-circle-charcoal dark:text-circle-dark-text'
          }`}
        >
          {question}
        </h4>
      </div>

      {(isDeleted || isError) && (
        <p className="text-[11px] italic text-circle-slate dark:text-circle-dark-muted">
          {isDeleted ? t.chat.pollDeletedOrNotFound : t.collab.loadPollsError}
        </p>
      )}

      {canVote && <p className="text-xs">{t.collab.pollBallotFinal}</p>}
      {voteError && <p role="alert" className="text-xs">{t.collab.votePollError}</p>}
      {/* Options List */}
      <div className="flex flex-col gap-2 pt-0.5">
        {!isDeleted && options.map((option: any) => {
          const voteCount = option.votes?.length || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = (myVotes.length ? myVotes : ballot).includes(option.id);

          return (
            <button
              key={option.id}
              type="button"
              disabled={!canVote || isError || voteMutation.isPending}
              aria-pressed={isSelected}
              onClick={() => toggleOption(option.id)}
              className={`relative overflow-hidden w-full text-left rounded-xl border p-2.5 transition-all text-xs flex items-center justify-between gap-3 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-75 ${
                isSelected
                  ? isSenderMe
                    ? 'border-white/40 bg-white/20 text-current font-bold'
                    : 'border-circle-primary bg-circle-primary/10 text-circle-sage dark:text-circle-primary font-bold shadow-xs'
                  : isSenderMe
                  ? 'border-white/15 dark:border-white/20 bg-black/10 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15 text-current'
                  : 'border-circle-hairline dark:border-circle-dark-hairline bg-white/60 dark:bg-circle-dark-surface/60 hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text'
              }`}
            >
              {/* Animated Progress Bar Fill */}
              <div
                style={{ width: `${percentage}%` }}
                className={`absolute inset-y-0 left-0 transition-all duration-300 pointer-events-none ${
                  isSelected
                    ? isSenderMe
                      ? 'bg-white/20'
                      : 'bg-circle-primary/20'
                    : isSenderMe
                    ? 'bg-black/10 dark:bg-white/10'
                    : 'bg-circle-slate/10 dark:bg-white/5'
                }`}
              />

              <div className="relative z-10 flex items-center gap-2 truncate">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? isSenderMe
                        ? 'border-current bg-current text-circle-charcoal'
                        : 'border-circle-primary bg-circle-primary text-circle-charcoal dark:text-circle-dark-canvas'
                      : isSenderMe
                      ? 'border-current/40'
                      : 'border-circle-slate/40 dark:border-circle-dark-muted/40'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span className="truncate">{option.optionText}</span>
              </div>

              <div className="relative z-10 flex items-center gap-1.5 shrink-0 font-mono text-[11px] opacity-80">
                <span>{percentage}%</span>
                <span className="text-[10px]">({voteCount})</span>
              </div>
            </button>
          );
        })}
      </div>

      {canVote && !isError && (
        <button type="button" disabled={!ballot.length || voteMutation.isPending} onClick={handleVote}
          className="min-h-11 rounded-xl bg-circle-primary px-3 text-xs font-semibold text-circle-charcoal disabled:opacity-50">
          {t.collab.pollSubmitVote}
        </button>
      )}

      {/* Inline Activity Logs for Votes */}
      {!isDeleted && voteLogs.length > 0 && (
        <div className="pt-2 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60 flex flex-col items-center gap-1 text-center select-none">
          {(isExpandedLogs ? voteLogs : [voteLogs[voteLogs.length - 1]]).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-center gap-1.5 text-[11px] text-circle-slate dark:text-circle-dark-muted font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-circle-primary shrink-0 opacity-80" />
              <span className="truncate">{log.text}</span>
            </div>
          ))}

          {voteLogs.length > 1 && (
            <button
              type="button"
              onClick={() => setIsExpandedLogs(!isExpandedLogs)}
              className="inline-flex items-center gap-1 mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-circle-primary dark:text-circle-dark-primary bg-circle-primary/10 hover:bg-circle-primary/15 transition-all cursor-pointer active:scale-95"
            >
              <span>
                {isExpandedLogs
                  ? (t.common.collapse || 'Thu gọn')
                  : (t.common.viewMoreCount?.replace('{count}', String(voteLogs.length)) || `Xem thêm (${voteLogs.length})`)}
              </span>
              {isExpandedLogs ? (
                <ChevronUp className="w-2.5 h-2.5" />
              ) : (
                <ChevronDown className="w-2.5 h-2.5" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
