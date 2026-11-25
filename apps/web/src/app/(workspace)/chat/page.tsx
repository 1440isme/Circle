'use client';

import React from 'react';
import { Plus, Link2 } from 'lucide-react';
import { ChannelChatView } from '@/components/chat/ChannelChatView';
import { useCircleStore } from '@/stores/circle.store';
import { useCircleDetailQuery, useMyCirclesQuery } from '@/hooks/use-circle-queries';
import { useLanguageStore } from '@/stores/language.store';
import { useAuth } from '@/context/AuthContext';

export default function ChatPage() {
  const { user } = useAuth();
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const activeChannelId = useCircleStore((s) => s.activeChannelId);
  const setCreateModalOpen = useCircleStore((s) => s.setCreateModalOpen);
  const setJoinModalOpen = useCircleStore((s) => s.setJoinModalOpen);
  const { data: circles = [], isLoading } = useMyCirclesQuery();
  const currentCircle = activeCircle || circles[0];
  const { data: circleDetail } = useCircleDetailQuery(currentCircle?.id || null);
  const t = useLanguageStore((s) => s.t);

  const displayName =
    user?.profile?.displayName || user?.email?.split('@')[0] || t.auth.guest;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-circle-primary border-t-transparent" />
      </div>
    );
  }

  // If user has NO circles yet -> Warm Onboarding to create/join first circle
  if (!currentCircle) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fadeIn select-none">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-circle-primary text-circle-charcoal shadow-md mb-6">
          <span className="text-2xl font-black">C</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-circle-charcoal dark:text-circle-dark-text mb-3">
          {t.home.welcomeTitle.replace('{name}', displayName)}
        </h2>
        <p className="text-sm sm:text-base text-circle-slate dark:text-circle-dark-muted mb-8 leading-relaxed max-w-md">
          {t.home.emptyCirclesDesc || t.home.welcomeSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-circle-primary py-3 px-4 text-sm font-bold text-circle-charcoal shadow-sm hover:brightness-105 active:scale-98 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>{t.home.createCircleBtn}</span>
          </button>
          <button
            type="button"
            onClick={() => setJoinModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface py-3 px-4 text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text shadow-xs hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas active:scale-98 transition-all"
          >
            <Link2 className="h-4 w-4 text-circle-slate dark:text-circle-dark-muted" />
            <span>{t.home.joinWithCodeBtn}</span>
          </button>
        </div>
      </div>
    );
  }

  const channels = circleDetail?.channels || (currentCircle as any)?.channels || [];
  const currentChannel =
    channels.find((c: any) => c.id === activeChannelId) ||
    channels[0];

  const circleName = currentCircle.name || circleDetail?.name || '';

  if (!currentChannel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-circle-slate dark:text-circle-dark-muted">
        <p className="text-sm font-semibold">{t.chat.channelNotFound || 'Chưa có kênh trò chuyện'}</p>
      </div>
    );
  }

  return (
    <ChannelChatView
      key={currentChannel.id}
      channelId={currentChannel.id}
      channelName={circleName}
      channelTopic={t.home.circleFeedSubtitle}
      circleId={currentCircle.id}
    />
  );
}
