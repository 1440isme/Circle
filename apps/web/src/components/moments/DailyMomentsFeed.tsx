'use client';

import React, { useState } from 'react';
import {
  Camera,
  Heart,
  Volume2,
  VolumeX,
  Trash2,
  Plus,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguageStore } from '@/stores/language.store';
import { useCircleStore } from '@/stores/circle.store';
import {
  useMomentsFeedQuery,
  useCircleMomentsQuery,
  useReactMomentMutation,
  useDeleteMomentMutation,
} from '@/hooks/use-moment-queries';
import { CreateMomentModal } from './CreateMomentModal';

interface DailyMomentsFeedProps {
  circleId?: string;
}

const EMOJI_OPTIONS = ['❤️', '🔥', '😂', '👏', '😍'];

export const DailyMomentsFeed: React.FC<DailyMomentsFeedProps> = ({ circleId }) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const activeCircleStore = useCircleStore((s) => s.activeCircle);
  const targetCircleId = circleId || activeCircleStore?.id;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [unmutedVideoIds, setUnmutedVideoIds] = useState<Record<string, boolean>>({});

  // Queries
  const { data: feedMoments = [], isLoading: isLoadingFeed } = useMomentsFeedQuery();
  const { data: circleMoments = [], isLoading: isLoadingCircle } = useCircleMomentsQuery(
    targetCircleId || null,
  );

  const moments = targetCircleId ? circleMoments : feedMoments;
  const isLoading = targetCircleId ? isLoadingCircle : isLoadingFeed;

  const reactMutation = useReactMomentMutation();
  const deleteMutation = useDeleteMomentMutation();

  const handleToggleSound = (momentId: string) => {
    setUnmutedVideoIds((prev) => ({
      ...prev,
      [momentId]: !prev[momentId],
    }));
  };

  const handleReact = async (momentId: string, emoji: string) => {
    try {
      await reactMutation.mutateAsync({ momentId, emoji });
    } catch {
      // Ignore
    }
  };

  const handleDelete = async (momentId: string) => {
    if (window.confirm(t.moments.deleteConfirm)) {
      try {
        await deleteMutation.mutateAsync(momentId);
      } catch {
        // Ignore
      }
    }
  };

  const formatMomentTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return t.moments.justNow;
      if (diffMins < 60) return `${diffMins}p trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h trước`;
      return d.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex-1 w-full max-w-xl mx-auto flex flex-col gap-6 py-2">
      {/* Feed Top Header & Quick Capture CTA */}
      <div className="rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/80 dark:bg-circle-dark-surface/80 p-5 shadow-circle-card backdrop-blur-md transition-colors flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 font-bold shadow-sm">
            <Camera className="h-5 w-5 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text">
              {t.moments.locketWidgetTitle}
            </h3>
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
              {moments.length > 0
                ? `${moments.length} khoảnh khắc được chia sẻ`
                : t.moments.subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 py-2 text-xs font-bold shadow-sm hover:shadow-circle-hover transition-all active:scale-95"
        >
          <Camera className="h-4 w-4" />
          <span>{t.moments.sendLocketBtn}</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && moments.length === 0 && (
        <div className="flex flex-col gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-4 shadow-circle-card animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-circle-canvas dark:bg-circle-dark-canvas" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-28 bg-circle-canvas dark:bg-circle-dark-canvas rounded" />
                  <div className="h-2.5 w-16 bg-circle-canvas dark:bg-circle-dark-canvas rounded" />
                </div>
              </div>
              <div className="aspect-[4/5] w-full rounded-2xl bg-circle-canvas/60 dark:bg-circle-dark-canvas/60" />
            </div>
          ))}
        </div>
      )}

      {/* Vertical Feed Stream ("Bản tin lướt dọc") */}
      {moments.length > 0 ? (
        <div className="flex flex-col gap-6 pb-12">
          {moments.map((moment) => {
            const authorName = moment.author?.profile?.displayName || 'Bạn bè';
            const authorAvatar = moment.author?.profile?.avatarUrl;
            const authorInitial = authorName.slice(0, 2).toUpperCase();
            const isAuthor = moment.authorId === user?.id;
            const isVideo =
              moment.mediaType === 'VIDEO' || Boolean(moment.photoUrl?.startsWith('data:video/'));
            const isSoundOn = Boolean(unmutedVideoIds[moment.id]);

            return (
              <article
                key={moment.id}
                className="rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-4 sm:p-5 shadow-circle-card transition-colors flex flex-col gap-3.5"
              >
                {/* Author Info Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-circle-primary text-circle-charcoal font-bold text-xs flex items-center justify-center overflow-hidden shadow-sm">
                      {authorAvatar ? (
                        <img
                          src={authorAvatar}
                          alt={authorName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        authorInitial
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                        {authorName}
                      </h4>
                      <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted font-medium">
                        {formatMomentTime(moment.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Delete button (Author only) */}
                    {isAuthor && (
                      <button
                        type="button"
                        onClick={() => handleDelete(moment.id)}
                        className="p-2 rounded-full hover:bg-rose-500/10 text-circle-slate dark:text-circle-dark-muted hover:text-rose-500 transition-colors"
                        title={t.moments.deleteTitle}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Media Container (Large rounded card for vertical newsfeed) */}
                <div className="relative aspect-[4/5] sm:aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 border border-stone-800 dark:border-stone-700/60 shadow-inner group select-none">
                  {isVideo ? (
                    <video
                      src={moment.photoUrl}
                      autoPlay
                      loop
                      playsInline
                      muted={!isSoundOn}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={moment.photoUrl}
                      alt={moment.caption || 'Khoảnh khắc thường ngày'}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Gradient Overlay for Caption readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Sound Toggle (if video) */}
                  {isVideo && (
                    <button
                      type="button"
                      onClick={() => handleToggleSound(moment.id)}
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-md z-10"
                      title={isSoundOn ? 'Tắt âm' : 'Bật âm'}
                    >
                      {isSoundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </button>
                  )}

                  {/* Caption Overlay */}
                  {moment.caption && (
                    <div className="absolute bottom-3 inset-x-3 flex justify-center pointer-events-none z-10">
                      <div className="bg-black/70 backdrop-blur-md text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-2xl max-w-[92%] text-center border border-white/15 shadow-md">
                        {moment.caption}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Reactions Dock */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 p-1.5 rounded-full border border-circle-hairline dark:border-circle-dark-hairline">
                    {EMOJI_OPTIONS.map((emoji) => {
                      const isSelected = moment.userReaction === emoji;
                      const count = moment.reactionCounts?.[emoji] || 0;

                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleReact(moment.id, emoji)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all active:scale-125 ${
                            isSelected
                              ? 'bg-amber-500/20 border border-amber-500/50 scale-105 shadow-sm'
                              : 'hover:bg-circle-wash dark:hover:bg-circle-dark-wash opacity-80 hover:opacity-100'
                          }`}
                          title={emoji}
                        >
                          <span>{emoji}</span>
                          {count > 0 && (
                            <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-xs text-circle-slate dark:text-circle-dark-muted font-medium px-2">
                    {Object.values(moment.reactionCounts || {}).reduce((a, b) => a + b, 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                        <span>
                          {Object.values(moment.reactionCounts || {}).reduce((a, b) => a + b, 0)}{' '}
                          cảm xúc
                        </span>
                      </span>
                    )}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      ) : !isLoading ? (
        /* Empty Feed State */
        <div className="rounded-3xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-white/60 dark:bg-circle-dark-surface/60 p-10 text-center shadow-circle-card flex flex-col items-center justify-center gap-4 transition-colors">
          <div className="h-16 w-16 rounded-3xl bg-amber-500/15 text-amber-500 flex items-center justify-center shadow-sm">
            <Camera className="h-8 w-8 stroke-[1.5]" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h4 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text">
              {t.moments.emptyLocketTitle}
            </h4>
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted leading-relaxed">
              {t.moments.emptyLocketDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 px-6 py-2.5 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Camera className="h-4 w-4" />
            <span>{t.moments.sendLocketBtn}</span>
          </button>
        </div>
      ) : null}

      {/* Realtime Camera & Short Video Capture Modal */}
      <CreateMomentModal
        isOpen={isCreateOpen}
        circleId={targetCircleId || undefined}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
};
