'use client';

import React from 'react';
import {
  Calendar,
  Radio,
  Video,
  ShieldCheck,
  UserCheck,
  Users,
  Settings,
  Crown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleStore } from '../../stores/circle.store';
import { useCircleMembersQuery, useCircleJoinRequestsQuery } from '../../hooks/use-circle-queries';
import { MemberRole } from '@circle/types';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const PresenceRail: React.FC = () => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const setManageModalOpen = useCircleStore((s) => s.setManageModalOpen);

  const { data: members = [] } = useCircleMembersQuery(activeCircle?.id || null);

  // Check caller role in active circle (2-role hierarchy: OWNER and MEMBER)
  const currentMember = members.find((m) => m.userId === user?.id);
  const isOwner = currentMember?.role === MemberRole.OWNER;

  const { data: joinRequests = [] } = useCircleJoinRequestsQuery(
    activeCircle?.id || null,
    isOwner,
  );

  const displayName = user?.profile?.displayName || user?.email?.split('@')[0] || t.auth.guest;
  const initials = getInitials(displayName);
  const roleLabel = user?.globalRole === 'ADMIN' ? t.auth.admin : t.auth.member;

  return (
    <aside className="hidden xl:flex w-80 flex-col gap-5 border-l border-circle-hairline dark:border-circle-dark-hairline bg-white/50 dark:bg-circle-dark-surface/50 p-5 backdrop-blur-sm h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto transition-colors">
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

      {/* Active Circle Members Rail */}
      {activeCircle && (
        <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-4 shadow-circle-card transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-circle-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-circle-charcoal dark:text-circle-dark-text">
                {t.circle.membersTitle} ({members.length})
              </span>
            </div>
            <button
              onClick={() => setManageModalOpen(true, 'members')}
              className="relative p-1.5 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas text-circle-slate hover:text-circle-charcoal dark:text-circle-dark-muted dark:hover:text-circle-dark-text transition-colors"
              title={t.circle.manageMembers}
            >
              <Settings className="h-3.5 w-3.5" />
              {joinRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-circle-primary ring-2 ring-white dark:ring-circle-dark-surface animate-pulse" />
              )}
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {members.map((m) => {
              const memberName =
                m.user?.profile?.displayName || m.user?.email?.split('@')[0] || t.auth.member;
              const memberInitials = getInitials(memberName);

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-circle-canvas/60 dark:hover:bg-circle-dark-canvas/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal text-[10px] font-bold flex-shrink-0">
                      {memberInitials}
                    </div>
                    <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                      {memberName}
                    </span>
                  </div>

                  {m.role === MemberRole.OWNER && (
                    <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Invite / Manage Button */}
          <button
            onClick={() => setManageModalOpen(true, isOwner && joinRequests.length > 0 ? 'requests' : 'invites')}
            className="mt-3 w-full py-2 px-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/80 dark:bg-circle-dark-canvas/80 hover:bg-circle-primary/10 text-xs font-bold text-circle-charcoal dark:text-circle-dark-text transition-colors flex items-center justify-center gap-1.5"
          >
            <span>{t.circle.invitesAndRequests}</span>
            {joinRequests.length > 0 && (
              <span className="rounded-full px-1.5 py-0.2 text-[10px] bg-circle-primary text-circle-charcoal font-bold">
                {joinRequests.length}
              </span>
            )}
          </button>
        </div>
      )}

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
