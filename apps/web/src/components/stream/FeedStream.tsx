'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  KeyRound,
  ShieldCheck,
  Send,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Compass,
  Users,
  Link2,
  MessageSquare,
  Globe,
  Lock,
  Camera,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleStore } from '../../stores/circle.store';
import { useMyCirclesQuery, useCircleDetailQuery } from '../../hooks/use-circle-queries';
import { DailyMomentsFeed } from '../moments/DailyMomentsFeed';
import { ChannelChatView } from '../chat/ChannelChatView';

export const FeedStream: React.FC = () => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const activeCircleView = useCircleStore((s) => s.activeCircleView);
  const activeChannelId = useCircleStore((s) => s.activeChannelId);
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const setCreateModalOpen = useCircleStore((s) => s.setCreateModalOpen);
  const setJoinModalOpen = useCircleStore((s) => s.setJoinModalOpen);

  const { data: circles = [], isLoading: isLoadingCircles } = useMyCirclesQuery();
  const { data: circleDetail } = useCircleDetailQuery(activeCircle ? activeCircle.id : null);

  const channels = circleDetail?.channels || (activeCircle as any)?.channels || [];
  const currentChannel =
    channels.find((c: any) => c.id === activeChannelId) ||
    channels.find((c: any) => c.name === activeCircleView) ||
    channels[0];

  const displayName =
    user?.profile?.displayName || user?.email?.split('@')[0] || t.auth.guest;

  const handleCopyLink = () => {
    if (activeCircle) {
      const url = `${window.location.origin}/@${activeCircle.handle}`;
      navigator.clipboard.writeText(url);
      alert(t.home.linkCopiedNotice);
    }
  };

  // =========================================================================
  // VIEW 1: HOME HUB DASHBOARD (When no Circle is actively opened)
  // =========================================================================
  if (!activeCircle) {
    return (
      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 py-2">
        {/* Welcome Hero Banner: ONLY displayed when user has 0 circles */}
        {circles.length === 0 && !isLoadingCircles && (
          <div className="relative overflow-hidden rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-gradient-to-br from-circle-wash/80 via-white/90 to-circle-canvas dark:from-circle-dark-wash dark:via-circle-dark-surface dark:to-circle-dark-canvas p-6 sm:p-8 shadow-circle-card transition-colors animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-circle-primary text-circle-charcoal shadow-sm text-2xl font-bold">
                  C
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-circle-primary/20 dark:bg-circle-primary/10 px-2.5 py-0.5 text-xs font-semibold text-circle-sage dark:text-circle-primary">
                    <Sparkles className="h-3 w-3" />
                    <span>{t.home.createFirstCirclePrompt}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-circle-charcoal dark:text-circle-dark-text">
                    {t.home.welcomeTitle.replace('{name}', displayName)}
                  </h2>
                  <p className="text-sm text-circle-slate dark:text-circle-dark-muted max-w-xl leading-relaxed">
                    {t.home.welcomeSubtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-circle-hairline/80 dark:border-circle-dark-hairline">
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 rounded-full bg-circle-charcoal dark:bg-circle-primary px-5 py-2 text-xs sm:text-sm font-semibold text-white dark:text-circle-charcoal shadow-sm hover:bg-circle-sage dark:hover:bg-circle-sage dark:hover:text-white transition-all active:scale-98"
              >
                <Plus className="h-4 w-4" />
                <span>{t.home.createCircleBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => setJoinModalOpen(true)}
                className="flex items-center gap-2 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white/80 dark:bg-circle-dark-surface/80 px-4 py-2 text-xs sm:text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text shadow-sm hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated transition-colors"
              >
                <KeyRound className="h-4 w-4 text-circle-slate dark:text-circle-dark-muted" />
                <span>{t.home.joinWithCodeBtn}</span>
              </button>
            </div>
          </div>
        )}

        {/* My Circles Section (Grid of Cards) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.home.myCirclesHeading}
              </h3>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
                {t.home.myCirclesSubheading}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-circle-canvas dark:bg-circle-dark-canvas px-3 py-1 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted border border-circle-hairline dark:border-circle-dark-hairline">
                {circles.length}
              </span>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-1 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface px-3 py-1 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-sage dark:hover:text-circle-primary transition-all shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t.home.createCircleBtn}</span>
              </button>
            </div>
          </div>

          {isLoadingCircles ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/50 dark:bg-circle-dark-canvas/50 animate-pulse"
                />
              ))}
            </div>
          ) : circles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {circles.map((circle) => (
                <div
                  key={circle.id}
                  onClick={() => setActiveCircle(circle)}
                  className="group cursor-pointer rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-5 shadow-circle-card hover:shadow-circle-hover hover:border-circle-sage/50 dark:hover:border-circle-primary/50 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-circle-primary/10 text-circle-sage dark:text-circle-primary font-bold text-base uppercase shadow-sm">
                        {circle.name ? circle.name.slice(0, 2) : 'C'}
                      </div>
                      <div className="truncate">
                        <h4 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text group-hover:text-circle-sage dark:group-hover:text-circle-primary transition-colors truncate">
                          {circle.name}
                        </h4>
                        <p className="text-xs text-circle-slate dark:text-circle-dark-muted font-mono truncate">
                          @{circle.handle}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        circle.role === 'OWNER'
                          ? 'bg-circle-primary/20 text-circle-sage dark:text-circle-primary'
                          : 'bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted'
                      }`}
                    >
                      {circle.role === 'OWNER' ? t.home.roleOwner : t.home.roleMember}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-circle-hairline dark:border-circle-dark-hairline text-xs">
                    <span className="text-circle-slate dark:text-circle-dark-muted flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{t.circle.membersCount.replace('{count}', String(circle.memberCount))}</span>
                    </span>
                    <span className="font-semibold text-circle-sage dark:text-circle-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      {t.home.enterCircleBtn} →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-white/60 dark:bg-circle-dark-surface/60 p-10 text-center shadow-circle-card flex flex-col items-center justify-center gap-4 transition-colors">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-circle-canvas dark:bg-circle-dark-canvas text-circle-sage dark:text-circle-primary border border-circle-hairline dark:border-circle-dark-hairline shadow-sm">
                <Compass className="h-8 w-8 stroke-[1.5]" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {t.home.feedEmptyTitle}
                </h3>
                <p className="text-xs sm:text-sm text-circle-slate dark:text-circle-dark-muted leading-relaxed">
                  {t.home.feedEmptyDesc}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="rounded-full bg-circle-charcoal dark:bg-circle-primary px-5 py-2 text-xs font-semibold text-white dark:text-circle-charcoal shadow-sm hover:bg-circle-sage transition-all"
                >
                  + {t.home.createCircleBtn}
                </button>
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface px-4 py-2 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text shadow-sm hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-sage dark:hover:text-circle-primary transition-all"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>{t.home.joinWithCodeBtn}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE CIRCLE WORKSPACE (Clean, Direct Chat & Moments without top banner)
  // =========================================================================
  return (
    <main className="flex-1 max-w-4xl flex flex-col gap-4 p-4 sm:p-6 min-h-[calc(100vh-4rem)]">
      {activeCircleView === 'moments' ? (
        <DailyMomentsFeed circleId={activeCircle.id} />
      ) : currentChannel ? (
        <ChannelChatView
          key={currentChannel.id}
          channelId={currentChannel.id}
          channelName={activeCircle.name}
          channelTopic={t.home.circleFeedSubtitle}
          circleId={activeCircle.id}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-circle-slate dark:text-circle-dark-muted">
          <p className="text-sm font-semibold">{t.chat.channelNotFound}</p>
        </div>
      )}
    </main>
  );
};
