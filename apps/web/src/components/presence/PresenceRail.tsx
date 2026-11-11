'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  CalendarDays,
  MapPin,
  Navigation,
  Plus,
  ChevronRight,
  Radio,
  Video,
  Phone,
  PhoneCall,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  Settings,
  Crown,
  Sparkles,
  Vote,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleStore } from '../../stores/circle.store';
import { useCircleMembersQuery, useCircleJoinRequestsQuery } from '../../hooks/use-circle-queries';
import { useCalendarEventsQuery, useLiveLocationsQuery, usePollsQuery } from '../../hooks/use-circle-tools';
import { useCirclePresence } from '../../hooks/use-circle-presence';
import {
  useActiveCallQuery,
  useInitiateCallMutation,
  useJoinCallMutation,
} from '../../hooks/use-call-queries';
import { MemberRole, CallType, CallStatus } from '@circle/types';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const PresenceRail: React.FC = () => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const setManageModalOpen = useCircleStore((s) => s.setManageModalOpen);
  const setActiveCallStageSession = useCircleStore((s) => s.setActiveCallStageSession);
  const setActiveCircleView = useCircleStore((s) => s.setActiveCircleView);
  const activeCircleView = useCircleStore((s) => s.activeCircleView);
  const setTargetCalendarEvent = useCircleStore((s) => s.setTargetCalendarEvent);
  const setTargetLocationCoords = useCircleStore((s) => s.setTargetLocationCoords);
  const setTargetPollId = useCircleStore((s) => s.setTargetPollId);
  const { data: activeCall } = useActiveCallQuery(activeCircle?.id || null);
  const initiateCallMutation = useInitiateCallMutation();
  const joinCallMutation = useJoinCallMutation();
  const { data: calendarEvents = [] } = useCalendarEventsQuery(activeCircle?.id || null);
  const { data: activeLocations = [] } = useLiveLocationsQuery(activeCircle?.id || null);
  const { data: polls = [] } = usePollsQuery(activeCircle?.id || null);
  const queryClient = useQueryClient();

  const activePolls = React.useMemo(() => {
    const now = Date.now();
    return polls.filter((p) => {
      if (p.isClosed) return false;
      if (p.deadline && new Date(p.deadline).getTime() <= now) return false;
      return true;
    });
  }, [polls]);

  React.useEffect(() => {
    if (!activeCircle?.id) return;
    const socket = getSocket();
    if (!socket) return;

    const handlePollUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['circle-polls', activeCircle.id] });
    };

    socket.on('circle:poll-created', handlePollUpdate);
    socket.on('circle:poll-voted', handlePollUpdate);
    socket.on('circle:poll-closed', handlePollUpdate);

    return () => {
      socket.off('circle:poll-created', handlePollUpdate);
      socket.off('circle:poll-voted', handlePollUpdate);
      socket.off('circle:poll-closed', handlePollUpdate);
    };
  }, [activeCircle?.id, queryClient]);

  const upcomingEvents = React.useMemo(() => {
    const now = new Date().getTime();
    return calendarEvents
      .filter((ev: any) => new Date(ev.startTime).getTime() >= now - 1000 * 60 * 30)
      .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 4);
  }, [calendarEvents]);

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

  const handleJumpToPoll = (pollId: string) => {
    if (activeCircleView !== 'general' && activeCircleView !== 'chat') {
      setActiveCircleView('chat');
    }
    setTargetPollId(pollId);

    // Precise scroll into view with container relative offset
    setTimeout(() => {
      const el = document.getElementById(`message-poll-${pollId}`);
      if (el) {
        const container = el.closest('.overflow-y-auto') as HTMLElement;
        if (container) {
          let offset = 0;
          let curr: HTMLElement | null = el;
          while (curr && curr !== container) {
            offset += curr.offsetTop;
            curr = curr.offsetParent as HTMLElement;
          }
          const targetScrollTop = offset - (container.clientHeight / 2) + (el.clientHeight / 2);
          container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        el.classList.add('ring-2', 'ring-circle-primary', 'shadow-lg', 'transition-all');
        setTimeout(() => el.classList.remove('ring-2', 'ring-circle-primary', 'shadow-lg'), 2500);
      }
    }, 120);
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
    <aside className="hidden lg:flex w-72 2xl:w-76 shrink-0 flex-col gap-4 bg-white dark:bg-circle-dark-surface p-3 pt-16 min-[1680px]:pt-3 h-full overflow-y-auto transition-colors border-l border-circle-hairline/60 dark:border-circle-dark-hairline/60">

      {/* Active Circle Members Rail (Flat container without visible border barrier) */}
      {activeCircle && (
        <div className="p-1 transition-colors">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 px-1">
              <Users className="h-4 w-4 text-circle-sage dark:text-circle-primary shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-circle-charcoal dark:text-circle-dark-text">
                {t.circle.membersTitle} ({members.length})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{onlineCount} {t.presence.online}</span>
              </span>
              <button
                onClick={() => setManageModalOpen(true, 'members')}
                className="relative p-1.5 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-sage dark:text-circle-primary transition-colors"
                title={t.circle.manageMembers}
              >
                <Settings className="h-3.5 w-3.5 text-circle-sage dark:text-circle-primary" />
                {joinRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-circle-primary ring-2 ring-white dark:ring-circle-dark-surface animate-pulse" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-0.5 max-h-56 overflow-y-auto pr-1">
            {members.map((m) => {
              const memberName =
                m.user?.profile?.displayName || m.user?.email?.split('@')[0] || t.auth.member;
              const memberInitials = getInitials(memberName);
              const isOnline = isUserOnline(m.userId) || m.userId === user?.id;

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal text-[10px] font-bold">
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
                    <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Invite / Manage Button (Distinct card border & elevation on both light & dark mode) */}
          <button
            onClick={() => setManageModalOpen(true, isOwner && joinRequests.length > 0 ? 'requests' : 'invites')}
            className="mt-2.5 w-full py-2 px-3 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/80 dark:bg-circle-dark-canvas/80 hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text transition-all flex items-center justify-center gap-2 shadow-xs active:scale-98"
          >
            <UserPlus className="h-3.5 w-3.5 text-circle-primary shrink-0" />
            <span>{t.circle.invitesAndRequests}</span>
            {joinRequests.length > 0 && (
              <span className="rounded-full px-1.5 py-0.2 text-[10px] bg-circle-primary text-circle-charcoal dark:text-circle-dark-canvas font-bold ml-auto">
                {joinRequests.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Divider line between members list and voice stage */}
      <div className="border-t border-circle-hairline/80 dark:border-circle-dark-hairline/80 my-1 mx-1" />

      {/* Voice & Video Stage Status (Flat container without visible border barrier) */}
      <div className="p-1 transition-all">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-circle-primary shrink-0" />
            <span className="text-[11px] font-bold text-circle-slate dark:text-circle-dark-muted uppercase tracking-wider">
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
              {activeCall.callType === CallType.VIDEO ? (
                <Video className="h-5 w-5 text-circle-primary shrink-0" />
              ) : (
                <PhoneCall className="h-5 w-5 text-circle-primary shrink-0" />
              )}
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
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-circle-primary hover:bg-circle-primary/90 active:scale-98 text-circle-charcoal dark:text-circle-dark-canvas py-2 px-3 text-xs font-bold transition-all shadow-md shadow-circle-primary/20"
            >
              <PhoneCall className="h-3.5 w-3.5 animate-pulse" />
              <span>{t.calls.joinCall}</span>
            </button>
          </div>
        ) : (
          /* Empty Call State with Quick Start Options */
          <div>
            <h4 className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-2">
              {t.home.noVoiceStageOpen}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleStartCall(CallType.AUDIO)}
                disabled={initiateCallMutation.isPending}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas py-1.5 px-2 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-98 disabled:opacity-50"
              >
                <Phone className="h-3.5 w-3.5 text-circle-primary" />
                <span>{t.calls.startAudioCall}</span>
              </button>
              <button
                type="button"
                onClick={() => handleStartCall(CallType.VIDEO)}
                disabled={initiateCallMutation.isPending}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas py-1.5 px-2 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-98 disabled:opacity-50"
              >
                <Video className="h-3.5 w-3.5 text-circle-primary" />
                <span>{t.calls.startVideoCall}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Circle Events (Issue #101 & #117) */}
      <div className="flex flex-col gap-2 pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-circle-sage dark:text-circle-primary shrink-0" />
            <span className="text-[11px] font-bold text-circle-charcoal dark:text-circle-dark-text uppercase tracking-wider">
              {t.collab.railUpcomingEvents}
            </span>
            {upcomingEvents.length > 0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-circle-primary/15 text-circle-sage dark:text-circle-primary">
                {upcomingEvents.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActiveCircleView('calendar')}
            className="text-[11px] font-semibold text-circle-sage dark:text-circle-primary hover:underline flex items-center gap-0.5"
          >
            <span>{t.collab.railOpenCalendar}</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="space-y-1.5">
            {upcomingEvents.map((ev: any) => {
              const start = new Date(ev.startTime);
              const yesCount = ev.rsvps?.filter((r: any) => r.status === 'YES').length || 0;
              return (
                <div
                  key={ev.id}
                  onClick={() => setActiveCircleView('calendar')}
                  className="rounded-xl border border-circle-hairline/80 dark:border-circle-dark-hairline/80 bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 p-2.5 hover:border-circle-primary/50 transition-all cursor-pointer group flex items-start gap-2.5"
                >
                  <CalendarDays className="h-4 w-4 text-circle-sage dark:text-circle-primary shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text group-hover:text-circle-sage dark:group-hover:text-circle-primary truncate">
                        {ev.eventTitle}
                      </span>
                      <span className="text-[10px] font-mono text-circle-slate dark:text-circle-dark-muted shrink-0">
                        {start.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { month: 'numeric', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-circle-slate dark:text-circle-dark-muted">
                      <div className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5 text-circle-sage dark:text-circle-primary" />
                        <span>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {yesCount > 0 && (
                        <span className="text-circle-sage dark:text-circle-primary font-semibold">
                          {t.collab.railMembersGoing.replace('{count}', String(yesCount))}
                        </span>
                      )}
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-1 text-[10px] text-circle-slate dark:text-circle-dark-muted pt-0.5">
                        <MapPin className="h-2.5 w-2.5 shrink-0 text-circle-sage dark:text-circle-primary" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 p-3 text-center">
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
              {t.home.upcomingEventsEmpty}
            </p>
            <button
              type="button"
              onClick={() => setActiveCircleView('calendar')}
              className="mt-2 text-[11px] font-semibold text-circle-sage dark:text-circle-primary hover:underline inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>{t.collab.railNewEvent}</span>
            </button>

          </div>
        )}
      </div>

      {/* Live Locations Broadcasting Status (Realtime Collab Status Column 3) */}
      <div className="flex flex-col gap-2 pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-circle-sage dark:text-circle-primary shrink-0" />
            <span className="text-[11px] font-bold text-circle-charcoal dark:text-circle-dark-text uppercase tracking-wider">
              {t.collab.railLiveLocations}
            </span>
            {activeLocations.length > 0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-circle-primary/15 text-circle-sage dark:text-circle-primary">
                {activeLocations.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActiveCircleView('location')}
            className="text-[11px] font-semibold text-circle-sage dark:text-circle-primary hover:underline flex items-center gap-0.5"
          >
            <span>{t.collab.railOpenMap}</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {activeLocations.length > 0 ? (
          <div className="space-y-1.5">
            {activeLocations.map((loc) => {
              const isMe = loc.member?.userId === user?.id;
              const name = loc.member?.user?.profile?.displayName || t.collab.memberDefault;
              const avatar = loc.member?.user?.profile?.avatarUrl;
              const initials = name.substring(0, 2).toUpperCase();

              return (
                <div
                  key={loc.id}
                  onClick={() => {
                    setActiveCircleView('location');
                    setTargetLocationCoords({ lat: loc.latitude, lng: loc.longitude });
                  }}
                  className="rounded-xl border border-circle-hairline/80 dark:border-circle-dark-hairline/80 bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 p-2 hover:border-circle-primary/50 transition-all cursor-pointer group flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative w-7 h-7 rounded-full overflow-hidden bg-circle-primary/20 text-circle-sage dark:text-circle-primary font-bold text-[9px] flex items-center justify-center shrink-0">
                      {avatar ? (
                        <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{initials}</span>
                      )}
                      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-circle-primary ring-1 ring-white dark:ring-circle-dark-surface" />
                    </div>
                    <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text group-hover:text-circle-sage dark:group-hover:text-circle-primary truncate">
                      {name} {isMe && ` ${t.collab.meLabel}`}
                    </span>
                  </div>

                  <span className="text-[10px] font-medium text-circle-sage dark:text-circle-primary shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-circle-primary animate-pulse" />
                    {t.collab.railSharingActive}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 p-2.5 text-center">
            <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
              {t.collab.railNoOneSharing}
            </p>
            <button
              type="button"
              onClick={() => setActiveCircleView('location')}
              className="mt-1.5 text-[11px] font-semibold text-circle-sage dark:text-circle-primary hover:underline inline-flex items-center gap-1"
            >
              <Radio className="h-3 w-3" />
              <span>{t.collab.railStartSharing}</span>
            </button>
          </div>
        )}
      </div>

      {/* Active Group Polls (Issue #119 / #123) */}
      <div className="flex flex-col gap-2 pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <Vote className="h-4 w-4 text-circle-sage dark:text-circle-primary shrink-0" />
            <span className="text-[11px] font-bold text-circle-charcoal dark:text-circle-dark-text uppercase tracking-wider">
              {t.collab.railActivePolls}
            </span>
            {activePolls.length > 0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-circle-primary/15 text-circle-sage dark:text-circle-primary">
                {activePolls.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActiveCircleView('polls')}
            className="text-[11px] font-semibold text-circle-sage dark:text-circle-primary hover:underline flex items-center gap-0.5"
          >
            <span>{t.collab.railOpenPolls}</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {activePolls.length > 0 ? (
          <div className="space-y-1.5">
            {activePolls.map((poll) => {
              const hasVoted = Boolean(poll.userVotedOptionId);
              return (
                <div
                  key={poll.id}
                  onClick={() => handleJumpToPoll(poll.id)}
                  className="rounded-xl border border-circle-hairline/80 dark:border-circle-dark-hairline/80 bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 p-2.5 hover:border-circle-primary/50 transition-all cursor-pointer group flex items-start gap-2.5"
                >
                  <Vote className="h-4 w-4 text-circle-sage dark:text-circle-primary shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text group-hover:text-circle-sage dark:group-hover:text-circle-primary line-clamp-2 block leading-snug">
                      {poll.question}
                    </span>
                    <div className="flex items-center justify-between text-[10px] text-circle-slate dark:text-circle-dark-muted pt-0.5">
                      <span className="font-medium">
                        {t.collab.railTotalVotes.replace('{count}', String(poll.totalVotes || 0))}
                      </span>
                      {hasVoted && (
                        <span className="text-circle-sage dark:text-circle-primary font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{t.collab.railVoted}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 p-2.5 text-center">
            <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
              {t.collab.railNoActivePolls}
            </p>
            <button
              type="button"
              onClick={() => setActiveCircleView('polls')}
              className="mt-1.5 text-[11px] font-semibold text-circle-sage dark:text-circle-primary hover:underline inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>{t.collab.railNewPoll}</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
