'use client';

import React, { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguageStore } from '@/stores/language.store';
import { useCircleStore } from '@/stores/circle.store';
import { useMomentsFeedQuery, useCircleMomentsQuery } from '@/hooks/use-moment-queries';
import { CreateMomentModal } from './CreateMomentModal';
import { StoryViewerModal } from './StoryViewerModal';

interface MomentsTrayProps {
  circleId?: string;
}

export const MomentsTray: React.FC<MomentsTrayProps> = ({ circleId }) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const activeCircleStore = useCircleStore((s) => s.activeCircle);
  const targetCircleId = circleId || activeCircleStore?.id;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);

  // If in a circle space, fetch circle moments; otherwise fetch all feed moments
  const { data: feedMoments = [], isLoading: isLoadingFeed } = useMomentsFeedQuery();
  const { data: circleMoments = [], isLoading: isLoadingCircle } = useCircleMomentsQuery(
    targetCircleId || null,
  );

  const moments = targetCircleId ? circleMoments : feedMoments;
  const isLoading = targetCircleId ? isLoadingCircle : isLoadingFeed;

  const displayName = user?.profile?.displayName || user?.email?.split('@')[0] || 'ME';
  const userInitial = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="w-full bg-white dark:bg-circle-dark-surface border-b border-circle-hairline dark:border-circle-dark-hairline py-3 px-4 sm:px-6">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
        
        {/* Button 1: Thêm Khoảnh Khắc Của Bạn */}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
        >
          <div className="relative">
            {/* User Avatar */}
            <div className="h-14 w-14 rounded-full bg-circle-primary/20 text-circle-charcoal dark:text-circle-primary font-bold text-sm flex items-center justify-center border-2 border-dashed border-circle-primary/60 group-hover:border-circle-primary transition-all overflow-hidden shadow-sm">
              {user?.profile?.avatarUrl ? (
                <img src={user.profile.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                userInitial
              )}
            </div>
            {/* Plus Icon Badge */}
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-circle-primary text-circle-charcoal flex items-center justify-center shadow-md border-2 border-white dark:border-circle-dark-surface group-hover:scale-110 transition-transform">
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
            </div>
          </div>
          <span className="text-[11px] font-semibold text-circle-charcoal dark:text-circle-dark-text truncate w-16 text-center">
            {t.moments.addMoment}
          </span>
        </button>

        {/* Loading Skeleton */}
        {isLoading && moments.length === 0 && (
          <div className="flex items-center gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-col items-center gap-1.5 shrink-0 animate-pulse">
                <div className="h-14 w-14 rounded-full bg-circle-canvas dark:bg-circle-dark-canvas" />
                <div className="h-2 w-12 rounded bg-circle-canvas dark:bg-circle-dark-canvas" />
              </div>
            ))}
          </div>
        )}

        {/* Moments Roster */}
        {moments.map((moment, index) => {
          const authorName = moment.author?.profile?.displayName || 'User';
          const authorInitial = authorName.slice(0, 2).toUpperCase();

          return (
            <button
              key={moment.id}
              onClick={() => setSelectedStoryIndex(index)}
              className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
            >
              {/* Vibrant Gradient Ring Container */}
              <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-circle-primary group-hover:scale-105 transition-transform shadow-sm">
                <div className="p-0.5 rounded-full bg-white dark:bg-circle-dark-surface">
                  <div className="h-13 w-13 rounded-full bg-circle-charcoal text-white font-bold text-xs flex items-center justify-center overflow-hidden">
                    {moment.author?.profile?.avatarUrl ? (
                      <img
                        src={moment.author.profile.avatarUrl}
                        alt={authorName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      authorInitial
                    )}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-circle-charcoal dark:text-circle-dark-text truncate w-16 text-center">
                {authorName}
              </span>
            </button>
          );
        })}

        {/* Empty State Banner Hint */}
        {!isLoading && moments.length === 0 && (
          <div className="flex items-center gap-2 pl-3 py-2 text-xs text-circle-slate dark:text-circle-dark-muted">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-[11px]">
              {targetCircleId ? t.moments.emptyCircleTitle : t.moments.emptyFeedDesc}
            </span>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateMomentModal
        isOpen={isCreateOpen}
        circleId={targetCircleId || undefined}
        onClose={() => setIsCreateOpen(false)}
      />

      <StoryViewerModal
        moments={moments}
        initialIndex={selectedStoryIndex ?? 0}
        isOpen={selectedStoryIndex !== null}
        onClose={() => setSelectedStoryIndex(null)}
      />
    </div>
  );
};
