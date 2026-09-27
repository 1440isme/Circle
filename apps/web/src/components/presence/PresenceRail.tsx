'use client';

import React from 'react';
import { Calendar, Radio, Video, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const PresenceRail: React.FC = () => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);

  const displayName = user?.profile?.displayName || user?.email?.split('@')[0] || t.auth.guest;
  const initials = getInitials(displayName);
  const roleLabel = user?.globalRole === 'ADMIN' ? t.auth.admin : t.auth.member;

  return (
    <aside className="hidden xl:flex w-80 flex-col gap-6 border-l border-circle-hairline dark:border-circle-dark-hairline bg-white/50 dark:bg-circle-dark-surface/50 p-5 backdrop-blur-sm h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto transition-colors">
      {/* Real User Profile Status Card */}
      <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-4 shadow-circle-card transition-colors">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted">
            {t.home.yourProfileCard}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-presence-breathe" />
            <span>{t.home.onlineStatus}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal text-sm font-bold shadow-sm">
              {initials}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
              {displayName}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-circle-slate dark:text-circle-dark-muted truncate">
              <UserCheck className="h-3 w-3 text-circle-sage dark:text-circle-primary" />
              <span>{roleLabel}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-circle-hairline/80 dark:border-circle-dark-hairline flex items-center gap-1.5 text-[11px] text-circle-slate dark:text-circle-dark-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-circle-sage" />
          <span className="truncate">{user?.email}</span>
        </div>
      </div>

      {/* Voice & Video Stage Status (Clean Empty State) */}
      <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-gradient-to-br from-circle-primary/5 via-white dark:via-circle-dark-surface to-circle-canvas dark:to-circle-dark-canvas p-4 shadow-circle-card transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <Radio className="h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted" />
          <span className="text-xs font-semibold text-circle-slate dark:text-circle-dark-muted uppercase tracking-wider">
            {t.home.realtimeVoiceStage}
          </span>
        </div>
        <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1">
          {t.home.noVoiceStageOpen}
        </h4>
        <p className="text-xs text-circle-slate dark:text-circle-dark-muted mb-3 leading-relaxed">
          {t.home.voiceStageReadyHint}
        </p>
        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-2 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas py-2 px-4 text-xs font-medium text-circle-slate dark:text-circle-dark-muted cursor-not-allowed opacity-60"
        >
          <Video className="h-3.5 w-3.5" />
          <span>{t.nav.groupCall}</span>
        </button>
      </div>

      {/* Upcoming Circle Events (Clean Empty State) */}
      <div className="flex flex-col gap-2 pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline">
        <div className="flex items-center gap-1.5 px-1 mb-1 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted uppercase tracking-wider">
          <Calendar className="h-3.5 w-3.5" />
          <span>{t.home.upcomingEventsTitle}</span>
        </div>
        <div className="rounded-xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 p-4 text-center">
          <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
            {t.home.upcomingEventsEmpty}
          </p>
        </div>
      </div>
    </aside>
  );
};
