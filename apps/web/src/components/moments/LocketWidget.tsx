'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Volume2,
  VolumeX,
  Trash2,
  Plus,
  Play,
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
  className?: string;
}

const EMOJI_OPTIONS = ['❤️', '🔥', '😂', '👏', '😍'];

export const LocketWidget: React.FC<LocketWidgetProps> = ({ circleId, className = '' }) => {
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
  const safeIndex = Math.min(currentIndex, Math.max(0, totalMoments - 1));
  const currentMoment = moments[safeIndex];

  // Auto-scroll the filmstrip to the active thumbnail
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const thumb = thumbRefs.current[safeIndex];
    if (thumb) {
      thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [safeIndex]);

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

  const formatMomentTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return t.moments.justNow;
      if (diffMins < 60) return `${diffMins}p`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;
      return d.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-4 shadow-circle-card transition-colors ${className}`}
    >
      {/* Header: Title + Navigation */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-6 w-6 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
            <Camera className="h-3.5 w-3.5 stroke-[2.2]" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-circle-charcoal dark:text-circle-dark-text truncate">
            {t.moments.locketWidgetTitle}
          </span>
        </div>

        {totalMoments > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              disabled={safeIndex === 0}
              className="p-1 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={t.moments.prevStory}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-mono font-semibold text-circle-slate dark:text-circle-dark-muted px-1">
              {safeIndex + 1}/{totalMoments}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={safeIndex === totalMoments - 1}
              className="p-1 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={t.moments.nextStory}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Moment Display or Empty State */}
      {isLoading && totalMoments === 0 ? (
        <div className="aspect-square w-full rounded-2xl bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 animate-pulse flex flex-col items-center justify-center gap-2 text-circle-slate dark:text-circle-dark-muted">
          <Camera className="h-7 w-7 opacity-30" />
          <span className="text-xs font-medium">Đang tải khoảnh khắc...</span>
        </div>
      ) : totalMoments > 0 && currentMoment ? (
        <div className="space-y-3">
          {/* Main Visual Display (Square Locket Viewport) */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 dark:border-stone-700/60 shadow-inner group select-none">
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
                alt={currentMoment.caption || 'Khoảnh khắc'}
                className="w-full h-full object-cover"
              />
            )}

            {/* Gradient Overlays for Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

            {/* Top Bar: Author Badge + Actions */}
            <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10 pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 shadow-sm max-w-[75%]">
                <div className="h-5 w-5 rounded-full bg-circle-primary text-circle-charcoal font-bold text-[9px] flex items-center justify-center overflow-hidden shrink-0">
                  {authorAvatar ? (
                    <img src={authorAvatar} alt={authorName} className="h-full w-full object-cover" />
                  ) : (
                    authorInitial
                  )}
                </div>
                <span className="text-[11px] font-bold text-white truncate">{authorName}</span>
                <span className="text-[10px] text-white/70 shrink-0">
                  • {formatMomentTime(currentMoment.createdAt)}
                </span>
              </div>

              <div className="pointer-events-auto flex items-center gap-1">
                {isVideo && (
                  <button
                    type="button"
                    onClick={() => setIsMuted((m) => !m)}
                    className="h-7 w-7 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-sm"
                  >
                    {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  </button>
                )}

                {isAuthor && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="h-7 w-7 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-rose-400 hover:text-rose-300 hover:bg-black/80 flex items-center justify-center transition-colors shadow-sm"
                    title={t.moments.deleteTitle}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Tap areas for next / prev */}
            {totalMoments > 1 && (
              <>
                <div
                  onClick={handlePrev}
                  className="absolute left-0 top-12 bottom-12 w-1/3 cursor-pointer z-10"
                />
                <div
                  onClick={handleNext}
                  className="absolute right-0 top-12 bottom-12 w-1/3 cursor-pointer z-10"
                />
              </>
            )}

            {/* Caption Overlay */}
            {currentMoment.caption && (
              <div className="absolute bottom-11 inset-x-2.5 flex justify-center z-10 pointer-events-none">
                <div className="bg-black/70 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1.5 rounded-xl max-w-[95%] text-center border border-white/15 shadow-sm truncate">
                  {currentMoment.caption}
                </div>
              </div>
            )}

            {/* Reactions Dock */}
            <div className="absolute bottom-2 inset-x-2 flex items-center justify-center gap-0.5 z-20">
              <div className="flex items-center gap-0.5 bg-black/65 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15 shadow-md">
                {EMOJI_OPTIONS.map((emoji) => {
                  const isSelected = currentMoment.userReaction === emoji;
                  const count = currentMoment.reactionCounts?.[emoji] || 0;

                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleReact(emoji)}
                      className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all active:scale-125 ${
                        isSelected
                          ? 'bg-amber-500/30 border border-amber-400/60 scale-105'
                          : 'hover:bg-white/15 opacity-75 hover:opacity-100'
                      }`}
                      title={emoji}
                    >
                      <span>{emoji}</span>
                      {count > 0 && (
                        <span className="text-[9px] font-bold text-white/90">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Horizontal Filmstrip Slider ("mấy ảnh lướt lướt đó") */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none">
            {/* Quick Capture (+) Thumbnail */}
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="h-12 w-12 shrink-0 rounded-xl border-2 border-dashed border-amber-500/50 hover:border-amber-500 bg-amber-500/10 hover:bg-amber-500/20 flex flex-col items-center justify-center text-amber-500 transition-all group shadow-sm active:scale-95"
              title={t.moments.sendLocketBtn}
            >
              <Camera className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-bold mt-0.5 leading-none">+</span>
            </button>

            {/* Moments Thumbnails */}
            {moments.map((m, idx) => {
              const isSelected = idx === safeIndex;
              const isVid = m.mediaType === 'VIDEO' || Boolean(m.photoUrl?.startsWith('data:video/'));

              return (
                <button
                  key={m.id || idx}
                  ref={(el) => {
                    thumbRefs.current[idx] = el;
                  }}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative h-12 w-12 shrink-0 rounded-xl overflow-hidden transition-all duration-150 border-2 ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-500/40 scale-105 shadow-md z-10'
                      : 'border-transparent opacity-60 hover:opacity-100 hover:scale-100'
                  }`}
                >
                  {isVid ? (
                    <>
                      <video
                        src={m.photoUrl}
                        className="w-full h-full object-cover pointer-events-none"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Play className="h-3 w-3 text-white fill-current opacity-80" />
                      </div>
                    </>
                  ) : (
                    <img
                      src={m.photoUrl}
                      alt={m.caption || 'Thumbnail'}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 p-4 text-center flex flex-col items-center justify-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shadow-sm">
            <Camera className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
              {t.moments.emptyLocketTitle}
            </h5>
            <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted leading-relaxed">
              {t.moments.emptyLocketDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="mt-1 flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 py-1.5 text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Camera className="h-3.5 w-3.5" />
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
