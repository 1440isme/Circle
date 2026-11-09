'use client';

import React, { useEffect } from 'react';
import { Vote, Check, Clock, CheckCircle2, Lock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { usePollDetailQuery, useVotePollMutation, TOOLS_KEYS } from '../../hooks/use-circle-tools';
import { playReactionPopSound } from '../../utils/sound-effects';
import { getSocket } from '../../lib/socket';

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
  const { data: poll, isLoading } = usePollDetailQuery(circleId, pollId);
  const voteMutation = useVotePollMutation(circleId);

  // Realtime Socket Listener for Poll Votes & Status Changes
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !pollId) return;

    const onPollUpdated = (updatedPoll: any) => {
      if (updatedPoll?.id === pollId) {
        queryClient.setQueryData(TOOLS_KEYS.pollDetail(circleId, pollId), updatedPoll);
        queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.polls(circleId) });
      }
    };

    socket.on('circle:poll-voted', onPollUpdated);
    socket.on('circle:poll-closed', onPollUpdated);

    return () => {
      socket.off('circle:poll-voted', onPollUpdated);
      socket.off('circle:poll-closed', onPollUpdated);
    };
  }, [circleId, pollId, queryClient]);

  const question = poll?.question || initialQuestion || t.collab.pollTitle;
  const isClosed = poll?.isClosed || false;
  const options = poll?.options || initialOptions.map((opt, idx) => ({
    id: `opt-${idx}`,
    pollId,
    optionText: opt,
    orderIndex: idx,
    votes: [],
  }));

  const totalVotes = options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
  const myVote = options.find((opt) =>
    opt.votes?.some((v: any) => v.member?.userId === user?.id || (v as any).memberId === user?.id),
  );

  const handleVote = async (optionId: string) => {
    if (isClosed || voteMutation.isPending) return;
    try {
      playReactionPopSound();
      await voteMutation.mutateAsync({
        pollId,
        input: { optionId },
      });
    } catch (err: any) {
      console.error('Vote failed:', err);
    }
  };

  return (
    <div
      className={`flex flex-col gap-2.5 py-0.5 min-w-[240px] max-w-[340px] select-none text-left`}
    >
      {/* Question */}
      <h4
        className={`text-sm font-bold leading-snug ${
          isSenderMe ? 'text-current' : 'text-circle-charcoal dark:text-circle-dark-text'
        }`}
      >
        {question}
      </h4>

      {/* Options List */}
      <div className="flex flex-col gap-2 pt-0.5">
        {options.map((option: any) => {
          const voteCount = option.votes?.length || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = myVote?.id === option.id;

          return (
            <button
              key={option.id}
              type="button"
              disabled={isClosed || voteMutation.isPending}
              onClick={() => handleVote(option.id)}
              className={`relative overflow-hidden w-full text-left rounded-xl border p-2.5 transition-all text-xs flex items-center justify-between gap-3 active:scale-[0.99] ${
                isSelected
                  ? isSenderMe
                    ? 'border-white/40 bg-white/20 text-current font-bold'
                    : 'border-circle-primary bg-circle-primary/10 text-circle-primary font-bold shadow-xs'
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
                        : 'border-circle-primary bg-circle-primary text-white dark:text-circle-dark-canvas'
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
    </div>
  );
};
