'use client';

import React from 'react';
import { Compass, Users, Sparkles, ArrowRight } from 'lucide-react';
import { LiveWheelMessagePayload } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';
import { useJoinLiveWheelMutation } from '../../hooks/use-circle-tools';

export interface LiveWheelChatEmbedProps {
  payload: LiveWheelMessagePayload;
  circleId: string;
  isSenderMe?: boolean;
}

export const LiveWheelChatEmbed: React.FC<LiveWheelChatEmbedProps> = ({
  payload,
  circleId,
  isSenderMe = false,
}) => {
  const { locale } = useLanguageStore();
  const joinMutation = useJoinLiveWheelMutation(circleId);

  const handleJoin = async () => {
    try {
      await joinMutation.mutateAsync({ sessionId: payload.sessionId });
    } catch {}

    // Dispatch event để mở overlay trực tiếp trên thiết bị của người bấm
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('circle:open-live-wheel', {
          detail: { circleId, sessionId: payload.sessionId },
        })
      );
    }
  };

  const participants = payload.participants || [];
  const participantsCount = participants.length;

  return (
    <div className="w-full max-w-sm rounded-3xl border border-teal-500/30 bg-gradient-to-br from-white via-teal-50/30 to-amber-50/20 dark:from-circle-dark-surface dark:via-circle-dark-card dark:to-teal-950/20 p-4 shadow-lg shadow-teal-500/5 transition-all hover:border-teal-500/50">
      {/* Top Header Card */}
      <div className="flex items-center justify-between pb-3 border-b border-circle-hairline/80 dark:border-circle-dark-hairline">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Compass className="w-4.5 h-4.5 animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-sm font-black text-circle-charcoal dark:text-circle-dark-text tracking-tight">
              {payload.wheelTitle || (locale === 'vi' ? 'Vòng quay may mắn' : 'Lucky Wheel')}
            </h4>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold uppercase tracking-wider">
              {locale === 'vi' ? 'Tương tác trực tiếp' : 'Live Interactive'}
            </span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 text-[11px] font-bold border border-teal-500/20">
          <Sparkles className="w-3 h-3 text-teal-500" />
          {locale === 'vi' ? 'Hoạt động nhóm' : 'Group Fun'}
        </span>
      </div>

      {/* Creator Info */}
      <div className="py-3 flex items-center gap-2.5">
        {payload.creatorAvatar ? (
          <img
            src={payload.creatorAvatar}
            alt={payload.creatorName}
            className="w-9 h-9 rounded-full object-cover border border-circle-hairline dark:border-circle-dark-hairline"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-circle-primary/20 text-circle-primary flex items-center justify-center font-bold text-xs">
            {payload.creatorName?.charAt(0) || 'U'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-circle-slate dark:text-circle-dark-muted leading-tight">
            <span className="font-bold text-circle-charcoal dark:text-circle-dark-text">
              {payload.creatorName}
            </span>{' '}
            {locale === 'vi' ? 'đã mở phiên vòng quay may mắn' : 'started a lucky wheel session'}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-circle-slate dark:text-circle-dark-muted font-medium">
            <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>
              {participantsCount > 0
                ? locale === 'vi'
                  ? `${participantsCount} người đang tham gia`
                  : `${participantsCount} participants`
                : locale === 'vi'
                ? 'Chưa có người tham gia'
                : 'No participants yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Stack of Participants Avatars */}
      {participantsCount > 0 && (
        <div className="flex items-center gap-1.5 pb-3">
          <div className="flex -space-x-2 overflow-hidden py-1">
            {participants.slice(0, 5).map((p, idx) => (
              <div
                key={p.userId || idx}
                className="w-7 h-7 rounded-full border-2 border-white dark:border-circle-dark-surface bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-[10px] font-bold text-teal-700 dark:text-teal-300 overflow-hidden"
                title={p.displayName}
              >
                {p.avatarUrl ? (
                  <img src={p.avatarUrl} alt={p.displayName} className="w-full h-full object-cover" />
                ) : (
                  p.displayName?.charAt(0) || 'U'
                )}
              </div>
            ))}
          </div>
          {participantsCount > 5 && (
            <span className="text-[11px] font-semibold text-circle-slate dark:text-circle-dark-muted">
              +{participantsCount - 5}
            </span>
          )}
        </div>
      )}

      {/* Action Button: Tham gia vòng quay */}
      <button
        type="button"
        onClick={handleJoin}
        disabled={joinMutation.isPending}
        className="w-full py-2.5 px-4 rounded-2xl bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal dark:text-circle-dark-canvas font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
      >
        <Compass className="w-4 h-4" />
        <span>{locale === 'vi' ? 'Tham gia vòng quay' : 'Join Wheel'}</span>
        <ArrowRight className="w-4 h-4 ml-0.5" />
      </button>
    </div>
  );
};
