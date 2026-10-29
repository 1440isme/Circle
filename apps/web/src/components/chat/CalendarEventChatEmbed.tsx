'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  Calendar as CalendarIcon,
  Bell,
  Users,
  Check,
  HelpCircle,
  Lock,
  X,
} from 'lucide-react';
import { CalendarEventMessagePayload, EventRsvpStatus } from '@circle/types';
import { useCircleStore } from '../../stores/circle.store';
import { useLanguageStore } from '../../stores/language.store';
import { useRespondEventRsvpMutation } from '../../hooks/use-circle-tools';
import { getSocket } from '../../lib/socket';
import { EventLocationDisplay } from '../tools/EventLocationDisplay';

export interface CalendarEventChatEmbedProps {
  eventData: CalendarEventMessagePayload;
  isSenderMe?: boolean;
  messageId?: string;
  currentUserId?: string;
}

export const CalendarEventChatEmbed: React.FC<CalendarEventChatEmbedProps> = ({
  eventData,
  isSenderMe = false,
  currentUserId,
}) => {
  const activeCircleId = useCircleStore((s) => s.activeCircleId);
  const setActiveCircleView = useCircleStore((s) => s.setActiveCircleView);
  const setTargetCalendarEvent = useCircleStore((s) => s.setTargetCalendarEvent);
  const locale = useLanguageStore((s) => s.locale);

  // "Phản hồi tham gia sẽ được tạo lúc đầu" (COL-09)
  // Ensure the creator RSVP is always created and initialized as YES (1 Tham gia)
  const initialRsvps = useMemo(() => {
    if (
      eventData.rsvps &&
      (eventData.rsvps.yesCount > 0 ||
        eventData.rsvps.noCount > 0 ||
        eventData.rsvps.maybeCount > 0)
    ) {
      return eventData.rsvps;
    }
    return {
      yesCount: 1,
      noCount: 0,
      maybeCount: 0,
      userRsvps: [
        {
          userId: isSenderMe ? (currentUserId || '') : '',
          status: EventRsvpStatus.YES,
          displayName: eventData.creatorName,
          avatarUrl: null,
        },
      ],
    };
  }, [eventData.rsvps, eventData.creatorName, isSenderMe, currentUserId]);

  const [rsvps, setRsvps] = useState(initialRsvps);

  const rsvpMutation = useRespondEventRsvpMutation(activeCircleId || '');

  // Keep local state in sync when prop changes
  useEffect(() => {
    setRsvps(initialRsvps);
  }, [initialRsvps]);

  // Realtime Socket.IO sync for RSVP updates (COL-09)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRsvpUpdated = (data: { eventId: string; circleId: string; rsvps: any }) => {
      if (data.eventId === eventData.eventId && data.rsvps) {
        setRsvps(data.rsvps);
      }
    };

    socket.on('circle:calendar-event-rsvp-updated', handleRsvpUpdated);
    return () => {
      socket.off('circle:calendar-event-rsvp-updated', handleRsvpUpdated);
    };
  }, [eventData.eventId]);

  const startDate = new Date(eventData.startTime);
  const isVi = locale === 'vi';

  const monthNamesVi = [
    'THG 1', 'THG 2', 'THG 3', 'THG 4', 'THG 5', 'THG 6',
    'THG 7', 'THG 8', 'THG 9', 'THG 10', 'THG 11', 'THG 12',
  ];
  const weekdayNamesVi = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  const monthStr = isVi
    ? monthNamesVi[startDate.getMonth()]
    : startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dayNum = startDate.getDate();
  const weekdayStr = isVi
    ? weekdayNamesVi[startDate.getDay()]
    : startDate.toLocaleDateString('en-US', { weekday: 'short' });

  // Time format
  const startTimeStr = startDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  let timeRangeStr = startTimeStr;
  if (eventData.endTime) {
    const endDate = new Date(eventData.endTime);
    const endTimeStr = endDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    timeRangeStr = `${startTimeStr} – ${endTimeStr}`;
  }

  // Reminder format
  let reminderStr: string | null = null;
  if (eventData.reminderTime) {
    const remDate = new Date(eventData.reminderTime);
    const diffMinutes = Math.round((startDate.getTime() - remDate.getTime()) / (60 * 1000));
    if (diffMinutes > 0) {
      if (diffMinutes >= 1440) {
        const days = Math.round(diffMinutes / 1440);
        reminderStr = isVi ? `Nhắc trước ${days} ngày` : `Remind ${days}d before`;
      } else if (diffMinutes >= 60) {
        const hours = Math.round(diffMinutes / 60);
        reminderStr = isVi ? `Nhắc trước ${hours} giờ` : `Remind ${hours}h before`;
      } else {
        reminderStr = isVi ? `Nhắc trước ${diffMinutes} phút` : `Remind ${diffMinutes}m before`;
      }
    }
  }

  const isCancelled = Boolean(eventData.isCancelled || eventData.action === 'CANCELLED' || eventData.action === 'DELETED');
  const isUpdated = eventData.action === 'UPDATED';
  const isStarted = new Date(eventData.startTime) <= new Date();
  const isLocked = isStarted || isCancelled;

  const myRsvp = useMemo(() => {
    const found = rsvps?.userRsvps?.find((u) => u.userId && u.userId === currentUserId)?.status;
    if (found) return found;
    if (isSenderMe) return EventRsvpStatus.YES;
    return undefined;
  }, [rsvps, currentUserId, isSenderMe]);

  const handleRsvp = async (status: EventRsvpStatus) => {
    if (!activeCircleId) return;
    try {
      // Optimistic update
      const prevUserRsvps = rsvps?.userRsvps || [];
      const updatedUserRsvps = [
        ...prevUserRsvps.filter((u) => u.userId !== currentUserId),
        {
          userId: currentUserId || '',
          status,
          displayName: isVi ? 'Bạn' : 'You',
        },
      ];
      const yesCount = updatedUserRsvps.filter((u) => u.status === EventRsvpStatus.YES).length;
      const maybeCount = updatedUserRsvps.filter((u) => u.status === EventRsvpStatus.MAYBE).length;
      const noCount = updatedUserRsvps.filter((u) => u.status === EventRsvpStatus.NO).length;
      setRsvps({ yesCount, maybeCount, noCount, userRsvps: updatedUserRsvps });

      await rsvpMutation.mutateAsync({ eventId: eventData.eventId, status });
    } catch (err) {
      console.error('Failed to update RSVP:', err);
    }
  };

  const handleOpenCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetCalendarEvent(eventData.startTime, eventData.eventId);
    setActiveCircleView('calendar');
  };

  const yesUsers = useMemo(
    () => rsvps?.userRsvps?.filter((u) => u.status === EventRsvpStatus.YES) || [],
    [rsvps]
  );
  const maybeUsers = useMemo(
    () => rsvps?.userRsvps?.filter((u) => u.status === EventRsvpStatus.MAYBE) || [],
    [rsvps]
  );
  const noUsers = useMemo(
    () => rsvps?.userRsvps?.filter((u) => u.status === EventRsvpStatus.NO) || [],
    [rsvps]
  );

  const totalVotes =
    (rsvps?.yesCount || 0) + (rsvps?.maybeCount || 0) + (rsvps?.noCount || 0);

  const yesPercent =
    totalVotes > 0 ? Math.round(((rsvps?.yesCount || 0) / totalVotes) * 100) : 0;
  const maybePercent =
    totalVotes > 0 ? Math.round(((rsvps?.maybeCount || 0) / totalVotes) * 100) : 0;
  const noPercent =
    totalVotes > 0 ? Math.round(((rsvps?.noCount || 0) / totalVotes) * 100) : 0;

  const pollOptions = [
    {
      status: EventRsvpStatus.YES,
      label: isVi ? 'Tham gia' : 'Going',
      icon: Check,
      count: rsvps?.yesCount || 0,
      percent: yesPercent,
      users: yesUsers,
      barColor: 'bg-emerald-500/15 dark:bg-emerald-500/20',
      activeBarColor: 'bg-emerald-500/25 dark:bg-emerald-500/35',
      activeBorder: 'border-emerald-500/70 dark:border-emerald-400/80 ring-1 ring-emerald-500/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      status: EventRsvpStatus.MAYBE,
      label: isVi ? 'Chưa chắc' : 'Maybe',
      icon: HelpCircle,
      count: rsvps?.maybeCount || 0,
      percent: maybePercent,
      users: maybeUsers,
      barColor: 'bg-amber-500/15 dark:bg-amber-500/20',
      activeBarColor: 'bg-amber-500/25 dark:bg-amber-500/35',
      activeBorder: 'border-amber-500/70 dark:border-amber-400/80 ring-1 ring-amber-500/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      status: EventRsvpStatus.NO,
      label: isVi ? 'Bận' : "Can't go",
      icon: X,
      count: rsvps?.noCount || 0,
      percent: noPercent,
      users: noUsers,
      barColor: 'bg-rose-500/15 dark:bg-rose-500/20',
      activeBarColor: 'bg-rose-500/25 dark:bg-rose-500/35',
      activeBorder: 'border-rose-500/70 dark:border-rose-400/80 ring-1 ring-rose-500/30',
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
  ];

  return (
    <div className="w-full max-w-lg mx-auto transition-all select-text">
      {/* Container with modern card styling and soft shadow */}
      <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/95 dark:bg-circle-dark-surface/95 backdrop-blur-md shadow-md overflow-hidden transition-all hover:border-circle-primary/40">
        {/* Header Ribbon */}
        <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
          isCancelled
            ? 'bg-rose-500/10 border-rose-500/20'
            : 'bg-gradient-to-r from-circle-primary/15 via-circle-wash to-circle-canvas dark:from-circle-primary/20 dark:via-circle-dark-wash dark:to-circle-dark-canvas border-circle-hairline/70 dark:border-circle-dark-hairline/70'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full shadow-2xs ${
              isCancelled ? 'bg-rose-500 text-white' : 'bg-circle-primary text-circle-charcoal'
            }`}>
              <CalendarIcon className="h-3 w-3" />
            </span>
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isCancelled ? 'text-rose-600 dark:text-rose-400' : 'text-circle-sage dark:text-circle-primary'
            }`}>
              {isCancelled
                ? (isVi ? 'Đã hủy lịch hẹn' : 'Event Cancelled')
                : isUpdated
                  ? (isVi ? 'Cập nhật lịch hẹn' : 'Event Updated')
                  : (isVi ? 'Lịch hẹn mới • Mời tham gia' : 'New Event • RSVP')}
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenCalendar}
            title={isVi ? 'Xem trên Lịch nhóm' : 'View in Calendar'}
            className="flex items-center justify-center h-6 w-6 rounded-md text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash/80 dark:hover:bg-circle-dark-wash/80 transition-all active:scale-90"
          >
            <CalendarDays className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Event Body with Calendar Tile + Event Info */}
        <div className="p-4 flex flex-col sm:flex-row items-start gap-4">
          {/* Calendar Date Block (iOS / Calendar Style) */}
          <div className="flex sm:flex-col items-center justify-center shrink-0 w-full sm:w-16 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/80 overflow-hidden shadow-2xs">
            <div className="w-full bg-circle-primary text-circle-charcoal text-[10px] font-bold py-1 text-center uppercase tracking-wider">
              {monthStr}
            </div>
            <div className="flex items-baseline sm:flex-col items-center justify-center p-2 sm:py-2 gap-1.5 sm:gap-0">
              <span className="text-2xl font-black text-circle-charcoal dark:text-circle-dark-text leading-none">
                {dayNum}
              </span>
              <span className="text-[10px] font-semibold text-circle-slate dark:text-circle-dark-muted uppercase mt-0.5">
                {weekdayStr}
              </span>
            </div>
          </div>

          {/* Event Content Details */}
          <div className="flex-1 min-w-0 space-y-2">
            <h3 className={`text-base font-bold text-circle-charcoal dark:text-circle-dark-text leading-snug break-words ${
              isCancelled ? 'line-through opacity-60' : ''
            }`}>
              {eventData.eventTitle} {isCancelled && <span className="text-xs text-rose-500 font-semibold no-underline">({isVi ? 'Đã hủy' : 'Cancelled'})</span>}
            </h3>

            {/* Time row */}
            <div className="flex items-center gap-2 text-xs text-circle-charcoal dark:text-circle-dark-text font-medium">
              <Clock className="h-3.5 w-3.5 text-circle-primary shrink-0" />
              <span>{timeRangeStr}</span>
              <span className="text-circle-slate dark:text-circle-dark-muted">• {weekdayStr}, {dayNum} {monthStr}</span>
            </div>

            {/* Location row (if provided) */}
            {eventData.location && (
              <EventLocationDisplay
                location={eventData.location}
                className="text-xs text-circle-slate dark:text-circle-dark-muted"
                iconClassName="h-3.5 w-3.5 shrink-0"
              />
            )}

            {/* Reminder Badge */}
            {reminderStr && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
                <Bell className="h-3 w-3 shrink-0" />
                <span>{reminderStr}</span>
              </div>
            )}

            {/* Description note */}
            {eventData.description && (
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 rounded-xl p-2.5 italic border border-circle-hairline/60 dark:border-circle-dark-hairline/60">
                "{eventData.description}"
              </p>
            )}
          </div>
        </div>

        {/* RSVP Section (COL-09 - Poll Style) */}
        <div className="px-4 py-3 bg-circle-canvas/50 dark:bg-circle-dark-canvas/50 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-circle-charcoal dark:text-circle-dark-text flex items-center gap-1.5">
              {isCancelled ? (
                <>
                  <Lock className="h-3.5 w-3.5 text-rose-500" />
                  <span className="text-rose-600 dark:text-rose-400">{isVi ? 'Lịch hẹn đã bị hủy' : 'Event cancelled'}</span>
                </>
              ) : isStarted ? (
                <>
                  <Lock className="h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted" />
                  <span className="text-circle-slate dark:text-circle-dark-muted">{isVi ? 'Bình chọn đã đóng' : 'RSVP closed'}</span>
                </>
              ) : (
                <>
                  <Users className="h-3.5 w-3.5 text-circle-sage dark:text-circle-primary" />
                  <span>{isVi ? 'Khảo sát tham gia' : 'Attendance Poll'}</span>
                </>
              )}
            </span>
            <span className="text-[11px] text-circle-slate dark:text-circle-dark-muted font-medium">
              {totalVotes} {isVi ? 'phản hồi' : 'votes'}
            </span>
          </div>

          {/* Poll Options List */}
          <div className="space-y-2">
            {pollOptions.map((opt) => {
              const isSelected = myRsvp === opt.status;
              return (
                <div key={opt.status} className="space-y-1.5">
                  <button
                    type="button"
                    disabled={isLocked || rsvpMutation.isPending}
                    onClick={() => handleRsvp(opt.status)}
                    className={`relative w-full overflow-hidden rounded-xl border p-2.5 text-left transition-all ${
                      isLocked ? 'cursor-not-allowed opacity-75' : 'hover:border-circle-primary/50 active:scale-[0.99]'
                    } ${
                      isSelected
                        ? `${opt.activeBorder} bg-circle-canvas/90 dark:bg-circle-dark-canvas/90 font-bold shadow-2xs`
                        : 'border-circle-hairline/80 dark:border-circle-dark-hairline/80 bg-white/90 dark:bg-circle-dark-surface/90'
                    }`}
                  >
                    {/* Progress Bar Fill */}
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
                        isSelected ? opt.activeBarColor : opt.barColor
                      }`}
                      style={{ width: `${opt.percent}%` }}
                    />

                    {/* Bar Labels */}
                    <div className="relative z-10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                            isSelected
                              ? 'border-circle-primary bg-circle-primary text-circle-charcoal'
                              : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface'
                          }`}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </span>
                        <opt.icon className={`h-3.5 w-3.5 ${opt.iconColor}`} />
                        <span className="font-semibold text-circle-charcoal dark:text-circle-dark-text">
                          {opt.label}
                        </span>
                      </div>

                      {/* Circular avatars of respondents replacing percent & count */}
                      <div className="flex items-center -space-x-1.5 shrink-0 pl-2">
                        {opt.users.slice(0, 5).map((u, idx) => {
                          const isMe = u.userId === currentUserId;
                          const name = isMe ? (isVi ? 'Bạn' : 'You') : u.displayName;
                          return (
                            <div
                              key={u.userId || idx}
                              title={name}
                              className="relative inline-flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white dark:ring-circle-dark-surface bg-circle-wash dark:bg-circle-dark-wash overflow-hidden shrink-0 shadow-xs"
                            >
                              {u.avatarUrl ? (
                                <img
                                  src={u.avatarUrl}
                                  alt={name}
                                  className="h-full w-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center rounded-full bg-circle-primary text-circle-charcoal text-[10px] font-bold">
                                  {name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {opt.users.length > 5 && (
                          <span
                            title={opt.users.slice(5).map((u) => u.displayName).join(', ')}
                            className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-circle-charcoal/80 dark:bg-circle-slate text-white text-[9px] font-bold ring-2 ring-white dark:ring-circle-dark-surface shrink-0"
                          >
                            +{opt.users.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>


      </div>
    </div>
  );
};
