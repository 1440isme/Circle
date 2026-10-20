'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Heart,
  Smile,
  Flame,
  ThumbsUp,
  Sparkles,
  Pause,
  Play,
  Send,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguageStore } from '@/stores/language.store';
import { useCircleStore } from '@/stores/circle.store';
import { MomentEntity } from '@circle/types';
import {
  useReactMomentMutation,
  useDeleteMomentMutation,
  useReplyMomentMutation,
} from '@/hooks/use-moment-queries';
import { MomentReactorsModal } from './MomentReactorsModal';
import { MomentPipView } from './MomentPipView';
import { parseMomentPhotos } from '@/lib/moment-photos';

interface StoryViewerModalProps {
  moments: MomentEntity[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const EMOJI_OPTIONS = ['❤️', '😂', '🔥', '👏', '😍'];
const STORY_DURATION_MS = 5000;

const STORY_VIEWER_CORNERS: Record<number, string> = {
  0: 'top-16 left-4',
  1: 'top-16 right-4',
  2: 'bottom-28 right-4',
  3: 'bottom-28 left-4',
};

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  moments,
  initialIndex = 0,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isReactorsOpen, setIsReactorsOpen] = useState(false);
  const [swappedMoments, setSwappedMoments] = useState<Record<string, boolean>>({});
  const [viewerPipCorners, setViewerPipCorners] = useState<Record<string, number>>({});

  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  const reactMutation = useReactMomentMutation();
  const deleteMutation = useDeleteMomentMutation();
  const replyMutation = useReplyMomentMutation();
  const activeCircle = useCircleStore((s) => s.activeCircle);

  const [replyText, setReplyText] = useState('');
  const [targetCircleId, setTargetCircleId] = useState<string>('');
  const [replySuccess, setReplySuccess] = useState(false);

  const currentMoment = moments[currentIndex];
  const isAuthor = currentMoment?.authorId === user?.id;

  const { mainUrl, pipUrl, cornerIndex: defaultCorner } = parseMomentPhotos(currentMoment?.photoUrl);
  const isSwapped = Boolean(currentMoment && swappedMoments[currentMoment.id]);
  const displayMain = isSwapped ? pipUrl : mainUrl;
  const displayPip = isSwapped ? mainUrl : pipUrl;
  const activeCornerIndex =
    currentMoment && viewerPipCorners[currentMoment.id] !== undefined
      ? viewerPipCorners[currentMoment.id]
      : defaultCorner;

  const isVideo =
    currentMoment?.mediaType === 'VIDEO' ||
    Boolean(displayMain?.includes('.webm')) ||
    Boolean(displayMain?.includes('.mp4')) ||
    Boolean(displayMain?.startsWith('data:video/'));

  // Sync initial index and circle selection
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setProgress(0);
      setIsPaused(false);
      setReplyText('');
      setReplySuccess(false);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (currentMoment?.visibilities && currentMoment.visibilities.length > 0) {
      const match = currentMoment.visibilities.find((v) => v.circleId === activeCircle?.id);
      setTargetCircleId(match ? match.circleId : currentMoment.visibilities[0].circleId);
    }
    setReplyText('');
    setReplySuccess(false);
  }, [currentMoment, activeCircle?.id]);

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !targetCircleId || !currentMoment || replyMutation.isPending) return;

    try {
      await replyMutation.mutateAsync({
        momentId: currentMoment.id,
        message: replyText.trim(),
        circleId: targetCircleId,
      });
      setReplyText('');
      setReplySuccess(true);
      setTimeout(() => {
        setReplySuccess(false);
      }, 3000);
    } catch {
      // Handled by mutation
    }
  };

  // Image Progress Bar timer (Only active when NOT a video)
  useEffect(() => {
    if (!isOpen || isPaused || !currentMoment || isVideo) return;

    const interval = 50; // update progress every 50ms
    const step = (interval / STORY_DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next story if available
          if (currentIndex < moments.length - 1) {
            setCurrentIndex((c) => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, currentIndex, moments.length, currentMoment, isVideo, onClose]);

  // Video play/pause synchronization
  useEffect(() => {
    if (isVideo && videoPlayerRef.current) {
      if (isPaused) {
        videoPlayerRef.current.pause();
      } else {
        videoPlayerRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, isVideo, currentIndex]);

  // Keyboard navigation (ArrowLeft, ArrowRight, Escape, Space)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === ' ') {
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, moments.length]);

  if (!isOpen || !currentMoment) return null;

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((c) => c - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < moments.length - 1) {
      setCurrentIndex((c) => c + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleReact = async (emoji: string) => {
    if (!currentMoment || isAuthor) return;
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
    if (window.confirm(t.moments.deleteConfirm)) {
      try {
        await deleteMutation.mutateAsync(currentMoment.id);
        if (moments.length <= 1) {
          onClose();
        } else {
          handleNext();
        }
      } catch {
        // Ignore
      }
    }
  };

  const circlesText =
    currentMoment.visibilities && currentMoment.visibilities.length > 0
      ? currentMoment.visibilities.map((v) => v.circle?.name || '').filter(Boolean).join(', ')
      : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in select-none">
      {/* Main Story Container */}
      <div className="relative w-full max-w-md h-[88vh] max-h-[780px] bg-circle-charcoal rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
        
        {/* Top Header & Segmented Progress Bars */}
        <div className="relative z-20 p-4 space-y-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {/* Progress Bars */}
          <div className="flex items-center gap-1.5 w-full">
            {moments.map((m, idx) => {
              let segProgress = 0;
              if (idx < currentIndex) segProgress = 100;
              else if (idx === currentIndex) segProgress = progress;

              return (
                <div key={m.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all ease-linear"
                    style={{ width: `${segProgress}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Author Info & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-full bg-circle-primary text-circle-charcoal font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 border border-white/20">
                {currentMoment.author?.profile?.avatarUrl ? (
                  <img
                    src={currentMoment.author.profile.avatarUrl}
                    alt={currentMoment.author.profile.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  currentMoment.author?.profile?.displayName?.slice(0, 2).toUpperCase() || 'US'
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white truncate">
                    {currentMoment.author?.profile?.displayName || 'User'}
                  </h4>
                  <span className="text-[10px] text-white/70">
                    {new Date(currentMoment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {circlesText && (
                  <p className="text-[10px] text-white/80 truncate">
                    {t.moments.visibleToCircles.replace('{circles}', circlesText)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Pause/Play toggle */}
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title={isPaused ? t.moments.nextStory : t.moments.paused}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>

              {/* Author Delete */}
              {isAuthor && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-1.5 rounded-full text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors"
                  title={t.moments.deleteTitle}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title={t.moments.closeStory}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Center Media Area with Left/Right Click Navigators */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black select-none">
          {displayMain ? (
            isVideo ? (
              <video
                ref={videoPlayerRef}
                key={displayMain}
                src={displayMain}
                autoPlay
                playsInline
                loop={false}
                muted
                onTimeUpdate={() => {
                  const vid = videoPlayerRef.current;
                  if (vid && vid.duration) {
                    setProgress((vid.currentTime / vid.duration) * 100);
                  }
                }}
                onEnded={handleNext}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                key={displayMain}
                src={displayMain}
                alt={currentMoment?.caption || 'Moment'}
                className="w-full h-full object-cover"
              />
            )
          ) : null}

          {/* Dual Camera PiP Floating Thumbnail */}
          {displayPip && (
            <MomentPipView
              key={`${currentMoment?.id}-${isSwapped ? 'swapped' : 'normal'}`}
              pipUrl={displayPip}
              initialCornerIndex={activeCornerIndex}
              cornerClasses={STORY_VIEWER_CORNERS}
              sizeClasses="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl"
              onSwap={() => {
                if (currentMoment) {
                  setSwappedMoments((prev) => ({
                    ...prev,
                    [currentMoment.id]: !prev[currentMoment.id],
                  }));
                }
              }}
              onCornerChange={(newCorner) => {
                if (currentMoment) {
                  setViewerPipCorners((prev) => ({
                    ...prev,
                    [currentMoment.id]: newCorner,
                  }));
                }
              }}
            />
          )}

          {/* Transparent Click Navigators */}
          <div
            onClick={handlePrev}
            className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
          />
          <div
            onClick={handleNext}
            className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
          />

          {/* Left / Right Arrow Buttons on Desktop */}
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors z-20 hidden sm:block"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {currentIndex < moments.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors z-20 hidden sm:block"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Bottom Area: Caption & Quick Emoji Reactions */}
        <div className="relative z-20 p-4 space-y-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          {/* Caption */}
          {currentMoment.caption && (
            <p className="text-xs sm:text-sm text-white/95 leading-snug px-1 text-center font-medium drop-shadow-sm line-clamp-3">
              {currentMoment.caption}
            </p>
          )}

          {/* Reactions Bar / Author Reactors Stack */}
          {isAuthor ? (
            <button
              type="button"
              onClick={() => {
                setIsPaused(true);
                setIsReactorsOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all group self-start"
              title={locale === 'vi' ? 'Xem danh sách người thả cảm xúc' : 'View reactions'}
            >
              {currentMoment.reactions && currentMoment.reactions.length > 0 ? (
                <>
                  <div className="flex items-center -space-x-2 overflow-hidden py-0.5">
                    {currentMoment.reactions.slice(0, 5).map((r, idx) => (
                      <div
                        key={r.id || idx}
                        className="relative inline-block"
                        style={{ zIndex: 10 - idx }}
                      >
                        <div className="h-6 w-6 rounded-full border-2 border-white/80 bg-circle-primary text-circle-charcoal text-[9px] font-bold flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          {r.user?.avatarUrl ? (
                            <img
                              src={r.user.avatarUrl}
                              alt={r.user.displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{r.user?.displayName?.slice(0, 2).toUpperCase() || 'U'}</span>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-black/80 border border-white/30 flex items-center justify-center text-[8px] shadow-xs">
                          {r.emoji}
                        </div>
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-white pl-1 group-hover:text-circle-primary transition-colors">
                    {currentMoment.reactions.length} {locale === 'vi' ? 'cảm xúc' : 'reactions'}
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-white/70 font-medium">
                  <span>❤️</span>
                  <span>{locale === 'vi' ? 'Chưa có cảm xúc' : 'No reactions yet'}</span>
                </div>
              )}
            </button>
          ) : (
            <div className="flex items-center justify-between gap-1 bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/15">
              {EMOJI_OPTIONS.map((emoji) => {
                const isSelected = currentMoment.userReaction === emoji;

                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleReact(emoji)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-base transition-all active:scale-125 ${
                      isSelected
                        ? 'bg-circle-primary/30 border border-circle-primary/60 scale-110 shadow-sm'
                        : 'hover:bg-white/10 opacity-80 hover:opacity-100'
                    }`}
                    title={emoji}
                  >
                    <span>{emoji}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Reply Form to Circle Group Chat */}
          <form onSubmit={handleSendReply} className="space-y-1.5">
            {replySuccess ? (
              <div className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-300 text-xs font-medium animate-fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{t.moments.replySuccess || 'Đã gửi phản hồi vào khung chat của Vòng tròn!'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/15 focus-within:border-circle-primary/70 transition-colors">
                {currentMoment.visibilities && currentMoment.visibilities.length > 1 ? (
                  <select
                    value={targetCircleId}
                    onChange={(e) => setTargetCircleId(e.target.value)}
                    className="bg-transparent text-white/90 text-[11px] font-medium focus:outline-none cursor-pointer max-w-[100px] truncate"
                    title={t.moments.replySelectCircle || 'Chọn Vòng tròn'}
                  >
                    {currentMoment.visibilities.map((v) => (
                      <option key={v.circleId} value={v.circleId} className="bg-circle-charcoal text-white">
                        {v.circle?.name || 'Circle'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <MessageCircle className="h-4 w-4 text-white/60 shrink-0" />
                )}

                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setIsPaused(true)}
                  placeholder={t.moments.replyPlaceholder || 'Gửi tin nhắn vào nhóm chat...'}
                  maxLength={2000}
                  className="flex-1 bg-transparent text-white placeholder-white/50 text-xs focus:outline-none min-w-0"
                />

                <button
                  type="submit"
                  disabled={!replyText.trim() || replyMutation.isPending}
                  className="p-1.5 rounded-full bg-circle-primary text-circle-charcoal disabled:opacity-40 disabled:hover:bg-circle-primary hover:scale-105 active:scale-95 transition-all shrink-0 shadow-sm"
                  title={t.moments.replyButton || 'Gửi vào nhóm'}
                >
                  <Send className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Moment Reactors List Modal */}
      <MomentReactorsModal
        isOpen={isReactorsOpen}
        onClose={() => {
          setIsReactorsOpen(false);
          setIsPaused(false);
        }}
        moment={currentMoment}
      />
    </div>
  );
};
