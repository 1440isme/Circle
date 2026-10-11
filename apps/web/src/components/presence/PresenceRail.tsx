'use client';

import React from 'react';
import {
  Calendar,
  Radio,
  Video,
  Phone,
  PhoneCall,
  ShieldCheck,
  UserCheck,
  Users,
  Settings,
  Crown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleStore } from '../../stores/circle.store';
import { useCircleMembersQuery, useCircleJoinRequestsQuery } from '../../hooks/use-circle-queries';
import { useCirclePresence } from '../../hooks/use-circle-presence';
import {
  useActiveCallQuery,
  useInitiateCallMutation,
  useJoinCallMutation,
} from '../../hooks/use-call-queries';
import { MemberRole, CallType, CallStatus } from '@circle/types';

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
  const setActiveCallStageSession = useCircleStore((s) => s.setActiveCallStageSession);
  const { data: activeCall } = useActiveCallQuery(activeCircle?.id || null);
  const initiateCallMutation = useInitiateCallMutation();
  const joinCallMutation = useJoinCallMutation();

  const handleStartCall = async (type: CallType) => {
    if (!activeCircle) return;
    try {
      const res = await initiateCallMutation.mutateAsync({
        circleId: activeCircle.id,
        callType: type,
      });
      const session = (res as any)?.callSession || res;
      if (session) {
        setActiveCallStageSession(session);
      }
    } catch {}
  };

  const handleJoinActiveCall = () => {
    if (!activeCall) return;
    joinCallMutation.mutate({ callSessionId: activeCall.id });
    setActiveCallStageSession(activeCall);
  };

  const activeParticipants = (activeCall?.participants || []).filter((p: any) => !p.leftAt);

  const { data: members = [] } = useCircleMembersQuery(activeCircle?.id || null);
  const { isUserOnline, onlineCount } = useCirclePresence(activeCircle?.id || null);

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
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{onlineCount} {t.presence.online}</span>
              </span>
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
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {members.map((m) => {
              const memberName =
                m.user?.profile?.displayName || m.user?.email?.split('@')[0] || t.auth.member;
              const memberInitials = getInitials(memberName);
              const isOnline = isUserOnline(m.userId) || m.userId === user?.id;

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-circle-canvas/60 dark:hover:bg-circle-dark-canvas/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal text-[10px] font-bold">
                        {memberInitials}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-1 ring-white dark:ring-circle-dark-surface ${
                          isOnline ? 'bg-emerald-500' : 'bg-circle-slate/40 dark:bg-circle-dark-muted/40'
                        }`}
                      />
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

      {/* Voice & Video Stage Status (Dynamic Realtime Stage) */}
      <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-gradient-to-br from-circle-primary/5 via-white dark:via-circle-dark-surface to-circle-canvas dark:to-circle-dark-canvas p-4 shadow-circle-card transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-circle-primary" />
            <span className="text-xs font-semibold text-circle-slate dark:text-circle-dark-muted uppercase tracking-wider">
              {t.home.realtimeVoiceStage}
            </span>
          </div>
          {activeCall && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE</span>
            </span>
          )}
        </div>

        {activeCall ? (
          /* Active Call State */
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  activeCall.callType === CallType.VIDEO
                    ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {activeCall.callType === CallType.VIDEO ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <PhoneCall className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                  {activeCall.callType === CallType.VIDEO
                    ? t.calls.groupVideoCall
                    : t.calls.groupVoiceRoom}
                </h4>
                <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
                  {t.calls.participantsCountShort.replace('{count}', String(activeParticipants.length))}
                </p>
              </div>
            </div>

            {/* Participant Avatars */}
            {activeParticipants.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3.5 pl-1">
                {activeParticipants.slice(0, 4).map((p: any) => {
                  const matchedMember = members.find(
                    (m) =>
                      m.id === p.memberId ||
                      m.userId === p.member?.userId ||
                      m.userId === p.userId,
                  );
                  const pName =
                    matchedMember?.user?.profile?.displayName ||
                    p.member?.user?.profile?.displayName ||
                    matchedMember?.nickname ||
                    matchedMember?.user?.email?.split('@')[0] ||
                    p.member?.user?.email?.split('@')[0] ||
                    t.calls.memberDefault;
                  return (
                    <div
                      key={p.id}
                      title={pName}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-circle-primary text-circle-charcoal text-[9px] font-bold ring-2 ring-white dark:ring-circle-dark-surface shadow-xs"
                    >
                      {getInitials(pName)}
                    </div>
                  );
                })}
                {activeParticipants.length > 4 && (
                  <span className="text-[10px] text-circle-slate dark:text-circle-dark-muted font-bold ml-1">
                    +{activeParticipants.length - 4}
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleJoinActiveCall}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white py-2 px-3 text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
            >
              <PhoneCall className="h-3.5 w-3.5 animate-pulse" />
              <span>{t.calls.joinCall}</span>
            </button>
          </div>
        ) : (
          /* Empty Call State with Quick Start Options */
          <div>
            <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1">
              {t.home.noVoiceStageOpen}
            </h4>
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted mb-3 leading-relaxed">
              {t.calls.startCallHint}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleStartCall(CallType.AUDIO)}
                disabled={initiateCallMutation.isPending}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400 py-2 px-2 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-98 disabled:opacity-50"
              >
                <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t.calls.startAudioCall}</span>
              </button>
              <button
                type="button"
                onClick={() => handleStartCall(CallType.VIDEO)}
                disabled={initiateCallMutation.isPending}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-indigo-400 py-2 px-2 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-98 disabled:opacity-50"
              >
                <Video className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>{t.calls.startVideoCall}</span>
              </button>
            </div>
          </div>
        )}
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
