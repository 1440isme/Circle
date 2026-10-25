'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  ExternalLink,
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

  const isDeleted = eventData.action === 'DELETED';
  const isUpdated = eventData.action === 'UPDATED';
  const isStarted = new Date(eventData.startTime) <= new Date();
  const isLocked = isStarted || isDeleted;

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
    setActiveCircleView('calendar');
  };

  return (
    <div className="w-full max-w-lg mx-auto transition-all select-text">
      {/* Container with modern card styling and soft shadow */}
      <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/95 dark:bg-circle-dark-surface/95 backdrop-blur-md shadow-md overflow-hidden transition-all hover:border-circle-primary/40">
        {/* Header Ribbon */}
        <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
          isDeleted
            ? 'bg-rose-500/10 border-rose-500/20'
            : 'bg-gradient-to-r from-circle-primary/15 via-circle-wash to-circle-canvas dark:from-circle-primary/20 dark:via-circle-dark-wash dark:to-circle-dark-canvas border-circle-hairline/70 dark:border-circle-dark-hairline/70'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full shadow-2xs ${
              isDeleted ? 'bg-rose-500 text-white' : 'bg-circle-primary text-circle-charcoal'
            }`}>
              <CalendarIcon className="h-3 w-3" />
            </span>
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isDeleted ? 'text-rose-600 dark:text-rose-400' : 'text-circle-sage dark:text-circle-primary'
            }`}>
              {isDeleted
                ? (isVi ? 'Đã hủy lịch hẹn' : 'Event Cancelled')
                : isUpdated
                  ? (isVi ? 'Cập nhật lịch hẹn' : 'Event Updated')
                  : (isVi ? 'Lịch hẹn mới • Mời tham gia' : 'New Event • RSVP')}
            </span>
          </div>
          <span className="text-[11px] font-medium text-circle-slate dark:text-circle-dark-muted">
            {isVi ? `Bởi ${eventData.creatorName}` : `By ${eventData.creatorName}`}
          </span>
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
              isDeleted ? 'line-through opacity-60' : ''
            }`}>
              {eventData.eventTitle} {isDeleted && <span className="text-xs text-rose-500 font-semibold no-underline">({isVi ? 'Đã hủy' : 'Cancelled'})</span>}
            </h3>

            {/* Time row */}
            <div className="flex items-center gap-2 text-xs text-circle-charcoal dark:text-circle-dark-text font-medium">
              <Clock className="h-3.5 w-3.5 text-circle-primary shrink-0" />
              <span>{timeRangeStr}</span>
              <span className="text-circle-slate dark:text-circle-dark-muted">• {weekdayStr}, {dayNum} {monthStr}</span>
            </div>

            {/* Location row (if provided) */}
            {eventData.location && (
              <div className="flex items-center gap-2 text-xs text-circle-slate dark:text-circle-dark-muted">
                <MapPin className="h-3.5 w-3.5 text-red-500/80 shrink-0" />
                <span className="truncate">{eventData.location}</span>
              </div>
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

        {/* RSVP Section (COL-09) */}
        <div className="px-4 py-3 bg-circle-canvas/50 dark:bg-circle-dark-canvas/50 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-circle-charcoal dark:text-circle-dark-text flex items-center gap-1.5">
              {isDeleted ? (
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
                  <span>{isVi ? 'Bạn có tham gia không?' : 'Are you attending?'}</span>
                </>
              )}
            </span>
            <div className="flex items-center gap-2 text-[11px] font-medium text-circle-slate dark:text-circle-dark-muted">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{rsvps?.yesCount || 0} {isVi ? 'Tham gia' : 'Going'}</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">{rsvps?.maybeCount || 0} {isVi ? 'Chưa chắc' : 'Maybe'}</span>
              <span>•</span>
              <span className="text-rose-500 dark:text-rose-400 font-semibold">{rsvps?.noCount || 0} {isVi ? 'Bận' : 'No'}</span>
            </div>
          </div>

          {/* 3 Interactive Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isLocked || rsvpMutation.isPending}
              onClick={() => handleRsvp(EventRsvpStatus.YES)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${isLocked ? 'cursor-not-allowed opacity-60' : 'active:scale-95'} ${
                myRsvp === EventRsvpStatus.YES
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-circle-dark-surface hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-circle-charcoal dark:text-circle-dark-text border border-circle-hairline dark:border-circle-dark-hairline'
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isVi ? 'Tham gia' : 'Going'}</span>
            </button>

            <button
              type="button"
              disabled={isLocked || rsvpMutation.isPending}
              onClick={() => handleRsvp(EventRsvpStatus.MAYBE)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${isLocked ? 'cursor-not-allowed opacity-60' : 'active:scale-95'} ${
                myRsvp === EventRsvpStatus.MAYBE
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-circle-dark-surface hover:bg-amber-50 dark:hover:bg-amber-950/30 text-circle-charcoal dark:text-circle-dark-text border border-circle-hairline dark:border-circle-dark-hairline'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>{isVi ? 'Chưa chắc' : 'Maybe'}</span>
            </button>

            <button
              type="button"
              disabled={isLocked || rsvpMutation.isPending}
              onClick={() => handleRsvp(EventRsvpStatus.NO)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${isLocked ? 'cursor-not-allowed opacity-60' : 'active:scale-95'} ${
                myRsvp === EventRsvpStatus.NO
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-circle-dark-surface hover:bg-rose-50 dark:hover:bg-rose-950/30 text-circle-charcoal dark:text-circle-dark-text border border-circle-hairline dark:border-circle-dark-hairline'
              }`}
            >
              <X className="h-3.5 w-3.5" />
              <span>{isVi ? 'Bận' : 'No'}</span>
            </button>
          </div>

          {/* Attendee Avatar Stacking */}
          {rsvps?.userRsvps && rsvps.userRsvps.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex -space-x-1.5 overflow-hidden">
                {rsvps.userRsvps.slice(0, 7).map((u, i) => (
                  <div
                    key={u.userId || i}
                    title={`${u.displayName} (${u.status === 'YES' ? (isVi ? 'Tham gia' : 'Going') : u.status === 'MAYBE' ? (isVi ? 'Chưa chắc' : 'Maybe') : (isVi ? 'Bận' : 'No')})`}
                    className="relative inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-circle-dark-surface overflow-hidden bg-circle-primary text-circle-charcoal text-[10px] font-bold flex items-center justify-center shrink-0"
                  >
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.displayName} className="h-full w-full object-cover" />
                    ) : (
                      <span>{u.displayName?.charAt(0)?.toUpperCase() || '?'}</span>
                    )}
                    <span
                      className={`absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full ring-1 ring-white dark:ring-circle-dark-surface ${
                        u.status === 'YES' ? 'bg-emerald-500' : u.status === 'MAYBE' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                    />
                  </div>
                ))}
              </div>
              {rsvps.userRsvps.length > 7 && (
                <span className="text-[10px] font-medium text-circle-slate dark:text-circle-dark-muted">
                  +{rsvps.userRsvps.length - 7} {isVi ? 'người khác' : 'others'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions (No reaction emojis, clean and focused) */}
        <div className="flex items-center justify-end px-4 py-2.5 bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
          {/* Jump to Calendar button */}
          <button
            type="button"
            onClick={handleOpenCalendar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-circle-charcoal hover:bg-circle-sage text-white dark:bg-circle-primary dark:text-circle-charcoal dark:hover:bg-circle-primary/90 text-xs font-semibold shadow-xs transition-all active:scale-98"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{isVi ? 'Xem trên Lịch nhóm' : 'View in Calendar'}</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
};
