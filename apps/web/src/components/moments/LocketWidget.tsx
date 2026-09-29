'use client';

import React, { useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Heart,
  Smile,
  Flame,
  ThumbsUp,
  Sparkles,
  Volume2,
  VolumeX,
  Trash2,
  Share2,
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

interface LocketWidgetProps {
  circleId?: string;
}

const EMOJI_OPTIONS = ['❤️', '🔥', '😂', '👏', '😍'];

export const LocketWidget: React.FC<LocketWidgetProps> = ({ circleId }) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const activeCircleStore = useCircleStore((s) => s.activeCircle);
  const targetCircleId = circleId || activeCircleStore?.id;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Queries
  const { data: feedMoments = [], isLoading: isLoadingFeed } = useMomentsFeedQuery();
  const { data: circleMoments = [], isLoading: isLoadingCircle } = useCircleMomentsQuery(
    targetCircleId || null,
  );

  const moments = targetCircleId ? circleMoments : feedMoments;
  const isLoading = targetCircleId ? isLoadingCircle : isLoadingFeed;

  const reactMutation = useReactMomentMutation();
  const deleteMutation = useDeleteMomentMutation();

  const totalMoments = moments.length;
  // Guard index out of range
  const safeIndex = Math.min(currentIndex, Math.max(0, totalMoments - 1));
  const currentMoment = moments[safeIndex];

  const isAuthor = currentMoment?.authorId === user?.id;
  const isVideo =
    currentMoment?.mediaType === 'VIDEO' ||
    Boolean(currentMoment?.photoUrl?.startsWith('data:video/'));

  const handlePrev = () => {
    if (safeIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (safeIndex < totalMoments - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleReact = async (emoji: string) => {
    if (!currentMoment) return;
    try {
      await reactMutation.mutateAsync({
        momentId: currentMoment.id,
        emoji,
      });
    } catch {
      // Ignore
    }
  };

  const handleDelete = async () => {
    if (!currentMoment) return;
    if (window.confirm(t.moments.deleteConfirm)) {
      try {
        await deleteMutation.mutateAsync(currentMoment.id);
        if (safeIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      } catch {
        // Ignore
      }
    }
  };

  const authorName = currentMoment?.author?.profile?.displayName || 'Bạn bè';
  const authorAvatar = currentMoment?.author?.profile?.avatarUrl;
  const authorInitial = authorName.slice(0, 2).toUpperCase();

  // Format relative timestamp
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
    <div className="w-full max-w-md mx-auto my-2">
      {/* Widget Header Controls */}
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs shadow-sm">
            <Sparkles className="h-3.5 w-3.5 fill-current" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-circle-charcoal dark:text-circle-dark-text">
            {t.moments.locketWidgetTitle}
          </span>
        </div>

        {totalMoments > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={safeIndex === 0}
              className="p-1 rounded-full hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[11px] font-mono font-semibold text-circle-slate dark:text-circle-dark-muted">
              {safeIndex + 1} / {totalMoments}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={safeIndex === totalMoments - 1}
              className="p-1 rounded-full hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Locket Square Frame (iOS / Android Locket Widget Style) */}
      <div className="relative aspect-square w-full rounded-[36px] overflow-hidden bg-gradient-to-b from-stone-900 via-neutral-900 to-black border-4 border-stone-800/80 dark:border-stone-700/60 shadow-2xl flex items-center justify-center group select-none">
        {/* Loading State */}
        {isLoading && totalMoments === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-white/50 animate-pulse">
            <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
              <Camera className="h-8 w-8 text-white/30" />
            </div>
            <p className="text-xs font-medium">Đang tải Locket...</p>
          </div>
        ) : totalMoments > 0 && currentMoment ? (
          /* Moment Media Display */
          <>
            {isVideo ? (
              <video
                src={currentMoment.photoUrl}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={currentMoment.photoUrl}
                alt={currentMoment.caption || 'Locket moment'}
                className="w-full h-full object-cover"
              />
            )}

            {/* Left & Right Tap Navigators */}
            {totalMoments > 1 && (
              <>
                <div
                  onClick={handlePrev}
                  className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
                />
                <div
                  onClick={handleNext}
                  className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
                />
              </>
            )}

            {/* Top Bar: Author Badge & Quick Tools (Floating Locket Pill) */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-2 bg-black/55 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 shadow-md">
                <div className="h-6 w-6 rounded-full bg-circle-primary text-circle-charcoal font-bold text-[10px] flex items-center justify-center overflow-hidden shrink-0">
                  {authorAvatar ? (
                    <img src={authorAvatar} alt={authorName} className="h-full w-full object-cover" />
                  ) : (
                    authorInitial
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white">
                  <span className="font-bold truncate max-w-[120px]">{authorName}</span>
                  <span className="text-[10px] text-white/70">
                    • {formatMomentTime(currentMoment.createdAt)}
                  </span>
                </div>
              </div>

              <div className="pointer-events-auto flex items-center gap-1.5">
                {/* Sound Toggle (if video) */}
                {isVideo && (
                  <button
                    type="button"
                    onClick={() => setIsMuted((m) => !m)}
                    className="h-8 w-8 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:bg-black/70 transition-colors shadow-md"
                  >
                    {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                )}

                {/* Author Delete Button */}
                {isAuthor && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="h-8 w-8 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-rose-400 hover:text-rose-300 hover:bg-black/70 flex items-center justify-center transition-colors shadow-md"
                    title={t.moments.deleteTitle}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Caption Overlay (Classic Locket Style) */}
            {currentMoment.caption && (
              <div className="absolute bottom-16 inset-x-4 flex justify-center z-20 pointer-events-none">
                <div className="bg-black/70 backdrop-blur-md text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-2xl max-w-[90%] text-center shadow-lg border border-white/15 drop-shadow">
                  {currentMoment.caption}
                </div>
              </div>
            )}

            {/* Bottom Reaction Dock (Directly inside Locket widget) */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-1 z-20">
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 shadow-lg">
                {EMOJI_OPTIONS.map((emoji) => {
                  const isSelected = currentMoment.userReaction === emoji;
                  const count = currentMoment.reactionCounts?.[emoji] || 0;

                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleReact(emoji)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm transition-all active:scale-125 ${
                        isSelected
                          ? 'bg-amber-500/30 border border-amber-400/60 scale-110'
                          : 'hover:bg-white/10 opacity-80 hover:opacity-100'
                      }`}
                      title={emoji}
                    >
                      <span>{emoji}</span>
                      {count > 0 && (
                        <span className="text-[10px] font-bold text-white/90">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* Empty Locket State */
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-white">
            <div className="h-18 w-18 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg animate-bounce">
              <Camera className="h-8 w-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h4 className="text-sm font-bold text-white">{t.moments.emptyLocketTitle}</h4>
              <p className="text-[11px] text-white/60 leading-relaxed">
                {t.moments.emptyLocketDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mt-2 flex items-center gap-2 rounded-full bg-amber-500 text-stone-950 px-5 py-2 text-xs font-bold shadow-lg hover:bg-amber-400 transition-all active:scale-95"
            >
              <Camera className="h-4 w-4" />
              <span>{t.moments.sendLocketBtn}</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Action Button: "Gửi Locket" */}
      {totalMoments > 0 && (
        <div className="mt-3 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 px-6 py-2.5 text-xs sm:text-sm font-bold shadow-circle-card hover:shadow-circle-hover transition-all active:scale-95"
          >
            <Camera className="h-4 w-4" />
            <span>{t.moments.sendLocketBtn}</span>
          </button>
        </div>
      )}

      {/* Realtime Camera & Short Video Capture Modal */}
      <CreateMomentModal
        isOpen={isCreateOpen}
        circleId={targetCircleId || undefined}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
};
