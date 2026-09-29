'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Heart, Smile, Flame, ThumbsUp, Sparkles, Pause, Play } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguageStore } from '@/stores/language.store';
import { MomentEntity } from '@circle/types';
import { useReactMomentMutation, useDeleteMomentMutation } from '@/hooks/use-moment-queries';

interface StoryViewerModalProps {
  moments: MomentEntity[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const EMOJI_OPTIONS = ['❤️', '😂', '🔥', '👏', '😍'];
const STORY_DURATION_MS = 5000;

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  moments,
  initialIndex = 0,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const reactMutation = useReactMomentMutation();
  const deleteMutation = useDeleteMomentMutation();

  const currentMoment = moments[currentIndex];
  const isAuthor = currentMoment?.authorId === user?.id;

  // Sync initial index
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, initialIndex]);

  // Progress Bar timer
  useEffect(() => {
    if (!isOpen || isPaused || !currentMoment) return;

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
  }, [isOpen, isPaused, currentIndex, moments.length, currentMoment, onClose]);

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
                onClick={() => setIsPaused((p) => !p)}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title={isPaused ? t.moments.nextStory : t.moments.paused}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>

              {/* Author Delete */}
              {isAuthor && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-full text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors"
                  title={t.moments.deleteTitle}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              {/* Close */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title={t.moments.closeStory}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Center Photo Area with Left/Right Click Navigators */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          <img
            src={currentMoment.photoUrl}
            alt={currentMoment.caption || 'Moment'}
            className="w-full h-full object-cover"
          />

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
              onClick={handlePrev}
              className="absolute left-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors z-20 hidden sm:block"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {currentIndex < moments.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors z-20 hidden sm:block"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Bottom Area: Caption & Quick Reaction Bar */}
        <div className="relative z-20 p-4 space-y-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          {/* Caption */}
          {currentMoment.caption && (
            <p className="text-xs text-white leading-relaxed px-1">
              {currentMoment.caption}
            </p>
          )}

          {/* Reaction Bar & Stats */}
          <div className="flex items-center justify-between pt-1">
            {/* Emoji Quick Buttons */}
            <div className="flex items-center gap-2">
              {EMOJI_OPTIONS.map((emoji) => {
                const isSelected = currentMoment.userReaction === emoji;
                const count = currentMoment.reactionCounts?.[emoji] || 0;

                return (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm transition-all transform active:scale-90 ${
                      isSelected
                        ? 'bg-white/30 scale-110 shadow-sm border border-white/50'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <span>{emoji}</span>
                    {count > 0 && (
                      <span className="text-[10px] text-white font-bold">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Total reactions counter */}
            {currentMoment.reactions && currentMoment.reactions.length > 0 && (
              <span className="text-[10px] text-white/70 font-mono">
                {currentMoment.reactions.length} cảm xúc
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
