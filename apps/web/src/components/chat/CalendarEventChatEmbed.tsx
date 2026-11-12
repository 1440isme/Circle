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
  Repeat,
} from 'lucide-react';
import { CalendarEventMessagePayload, EventRsvpStatus } from '@circle/types';
import { useCircleStore } from '../../stores/circle.store';
import { useLanguageStore } from '../../stores/language.store';
import {
  useRespondEventRsvpMutation,
  useUpdateCalendarEventMutation,
  useCreateCalendarEventMutation,
} from '../../hooks/use-circle-tools';
import { getSocket } from '../../lib/socket';
import { EventLocationDisplay } from '../tools/EventLocationDisplay';
import {
  parseEventRecurrence,
  formatRecurrenceSummary,
  formatDateOnly,
  formatDateKey,
  serializeRecurrence,
  RecurrenceConfig,
} from '../tools/calendar-recurrence';

export interface CalendarEventChatEmbedProps {
  eventData: CalendarEventMessagePayload;
  isSenderMe?: boolean;
  messageId?: string;
  currentUserId?: string;
  senderDisplayName?: string;
  senderAvatarUrl?: string | null;
  sentAt?: string;
}

export const CalendarEventChatEmbed: React.FC<CalendarEventChatEmbedProps> = ({
  eventData,
  isSenderMe = false,
  currentUserId,
  senderDisplayName,
  senderAvatarUrl,
  sentAt,
}) => {
  const activeCircleId = useCircleStore((s) => s.activeCircleId);
  const setActiveCircleView = useCircleStore((s) => s.setActiveCircleView);
  const setTargetCalendarEvent = useCircleStore((s) => s.setTargetCalendarEvent);
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);

  // Recurrence & Description Parsing
  const { cleanDesc, recurrenceConfig } = useMemo(
    () => parseEventRecurrence(eventData.description),
    [eventData.description]
  );
  const isRecurring = Boolean(recurrenceConfig && recurrenceConfig.frequency !== 'none');

  // Modal scope voting for recurring events
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [pendingVoteStatus, setPendingVoteStatus] = useState<EventRsvpStatus | null>(null);

  const rsvpMutation = useRespondEventRsvpMutation(activeCircleId || '');
  const updateMutation = useUpdateCalendarEventMutation(activeCircleId || '');
  const createMutation = useCreateCalendarEventMutation(activeCircleId || '');

  // "Phản hồi tham gia sẽ được tạo lúc đầu" (COL-09)
  // Ensure creator RSVP is always created and initialized as YES (1 Tham gia)
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
  const endDate = eventData.endTime ? new Date(eventData.endTime) : null;

  const recurrenceSummaryText = useMemo(() => {
    if (!recurrenceConfig || recurrenceConfig.frequency === 'none') return null;
    return formatRecurrenceSummary(recurrenceConfig);
  }, [recurrenceConfig]);

  const isSameDay = useMemo(() => {
    if (!endDate) return true;
    return (
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getDate() === endDate.getDate()
    );
  }, [startDate, endDate]);

  const durationDays = useMemo(() => {
    if (!endDate) return 1;
    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
    const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
    return Math.max(1, Math.round((endDay - startDay) / (24 * 60 * 60 * 1000)) + 1);
  }, [startDate, endDate]);

  const weekdayShorts = [
    t.collab.weekdaySun,
    t.collab.weekdayMon,
    t.collab.weekdayTue,
    t.collab.weekdayWed,
    t.collab.weekdayThu,
    t.collab.weekdayFri,
    t.collab.weekdaySat,
  ];
  const weekdayStr = weekdayShorts[startDate.getDay()];

  const startTimeStr = startDate.toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const endTimeStr = endDate
    ? endDate.toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : null;

  const sentTimeStr = useMemo(() => {
    if (!sentAt) return null;
    const d = new Date(sentAt);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, [sentAt, locale]);

  // Reminder format
  let reminderStr: string | null = null;
  if (eventData.reminderTime) {
    const remDate = new Date(eventData.reminderTime);
    const diffMinutes = Math.round((startDate.getTime() - remDate.getTime()) / (60 * 1000));
    if (diffMinutes > 0) {
      if (diffMinutes >= 1440) {
        const days = Math.round(diffMinutes / 1440);
        reminderStr = t.collab.remindDaysBefore.replace('{count}', String(days));
      } else if (diffMinutes >= 60) {
        const hours = Math.round(diffMinutes / 60);
        reminderStr = t.collab.remindHoursBefore.replace('{count}', String(hours));
      } else {
        reminderStr = t.collab.remindMinutesBefore.replace('{count}', String(diffMinutes));
      }
    }
  }

  const isCancelled = Boolean(eventData.isCancelled || eventData.action === 'CANCELLED' || eventData.action === 'DELETED');
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
          displayName: t.calls.youLabel,
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

  const handleVoteOptionClick = (status: EventRsvpStatus) => {
    if (isLocked || rsvpMutation.isPending) return;
    if (isRecurring) {
      setPendingVoteStatus(status);
      setShowScopeModal(true);
    } else {
      handleRsvp(status);
    }
  };

  const handleApplyVoteScope = async (scope: 'this' | 'future' | 'all') => {
    const status = pendingVoteStatus;
    if (!status || !activeCircleId) return;
    setShowScopeModal(false);

    try {
      if (isRecurring && scope === 'this') {
        const occKey = formatDateKey(startDate);
        const currentExcluded = recurrenceConfig?.excludedDates || [];
        const nextExcluded = currentExcluded.includes(occKey)
          ? currentExcluded
          : [...currentExcluded, occKey];
        const updatedParentRecurrence: RecurrenceConfig = {
          ...(recurrenceConfig!),
          excludedDates: nextExcluded,
        };
        const updatedParentDesc = serializeRecurrence(updatedParentRecurrence, cleanDesc);

        await updateMutation.mutateAsync({
          eventId: eventData.eventId,
          input: { description: updatedParentDesc },
        });

        const standaloneConfig: RecurrenceConfig = {
          ...(recurrenceConfig!),
          frequency: 'none',
          endType: 'never',
          endDate: null,
          isCustom: false,
        };
        const standaloneDesc = serializeRecurrence(standaloneConfig, cleanDesc);
        const evEnd = eventData.endTime ? new Date(eventData.endTime) : startDate;

        const created = await createMutation.mutateAsync({
          eventTitle: eventData.eventTitle,
          description: standaloneDesc,
          location: eventData.location || undefined,
          startTime: startDate.toISOString(),
          endTime: evEnd.toISOString(),
          reminderTime: eventData.reminderTime || undefined,
        });

        await rsvpMutation.mutateAsync({ eventId: created.id, status });
      } else {
        await handleRsvp(status);
      }
    } catch (err: any) {
      console.warn('Failed to apply vote scope in chat embed:', err);
      await handleRsvp(status);
    } finally {
      setPendingVoteStatus(null);
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
      label: t.collab.rsvpGoing,
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
      label: t.collab.rsvpMaybe,
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
      label: t.collab.rsvpDecline,
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
      {/* Container with balanced legible card styling */}
      <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/95 dark:bg-circle-dark-surface/95 backdrop-blur-md shadow-md overflow-hidden transition-all hover:border-circle-primary/40">
        {/* 1. Log Tin nhắn: Người tạo/chia sẻ + Thời gian gửi */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60 bg-circle-canvas/30 dark:bg-circle-dark-canvas/30 text-xs text-circle-slate dark:text-circle-dark-muted">
          <div className="flex items-center gap-2 min-w-0">
            {senderAvatarUrl ? (
              <img
                src={senderAvatarUrl}
                alt={senderDisplayName || eventData.creatorName || 'Member'}
                className="h-5 w-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-circle-primary/20 text-circle-charcoal dark:text-circle-dark-text text-[10px] font-bold flex items-center justify-center shrink-0">
                {(senderDisplayName || eventData.creatorName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
              {senderDisplayName || eventData.creatorName || 'Thành viên'}
            </span>
            <span className="text-[11px] opacity-75 shrink-0">
              đã tạo lịch hẹn
            </span>
          </div>
          {sentTimeStr && (
            <span className="text-[11px] opacity-60 font-mono shrink-0">
              {sentTimeStr}
            </span>
          )}
        </div>

        {/* 2. Tiêu đề sự kiện & Nút Xem trên Lịch (BỎ text "LỊCH HẸN NHÓM") */}
        <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-circle-primary/10 flex items-center justify-center text-circle-sage dark:text-circle-dark-primary shrink-0">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3
                className={`text-base font-bold text-circle-charcoal dark:text-circle-dark-text leading-snug break-words ${
                  isCancelled ? 'line-through opacity-60 text-rose-600 dark:text-rose-400' : ''
                }`}
              >
                {eventData.eventTitle}
              </h3>
            </div>
            {isCancelled && (
              <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                Đã hủy
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenCalendar}
            title={t.collab.viewOnCalendar}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-circle-slate hover:text-circle-charcoal dark:hover:text-white bg-circle-wash dark:bg-circle-dark-wash hover:bg-circle-canvas transition-all shrink-0 cursor-pointer active:scale-95 border border-circle-hairline/60 dark:border-white/10"
          >
            <CalendarDays className="h-3.5 w-3.5 text-circle-sage dark:text-circle-dark-primary" />
            <span className="hidden sm:inline">Xem lịch</span>
          </button>
        </div>

        {/* 3. Event Details: Khung thời gian text (Time Capsule Box), Địa điểm, Lặp lại, Nhắc hẹn, Ghi chú */}
        <div className="px-4 pb-3 space-y-3">
          {/* Time Capsule Box (Dạng text thuần túy: bao quát cả 1 ngày lẫn nhiều ngày) */}
          <div className="rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 px-3.5 py-2.5 flex items-center gap-2.5 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
            <Clock className="h-4 w-4 text-circle-sage dark:text-circle-dark-primary shrink-0" />
            {isSameDay ? (
              <span>
                {startTimeStr}{endTimeStr ? ` – ${endTimeStr}` : ''} • {weekdayStr}, {formatDateOnly(startDate)}
              </span>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>{startTimeStr}, {formatDateOnly(startDate)}</span>
                <span className="text-circle-slate dark:text-circle-dark-muted font-bold">➔</span>
                <span>{endTimeStr || ''}, {formatDateOnly(endDate!)}</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-circle-primary/15 text-circle-sage dark:text-circle-dark-primary">
                  {durationDays} ngày
                </span>
              </div>
            )}
          </div>

          {/* Location row */}
          {eventData.location && (
            <div className="flex items-center gap-2 text-xs text-circle-slate dark:text-circle-dark-muted">
              <MapPin className="h-3.5 w-3.5 text-circle-sage dark:text-circle-dark-primary shrink-0" />
              <EventLocationDisplay
                location={eventData.location}
                className="text-xs"
                iconClassName="hidden"
              />
            </div>
          )}

          {/* Recurrence summary row (Chu kỳ lặp lại) */}
          {isRecurring && recurrenceSummaryText && (
            <div className="flex items-center gap-2 text-xs text-circle-charcoal dark:text-circle-dark-text font-medium">
              <Repeat className="h-3.5 w-3.5 text-circle-sage dark:text-circle-dark-primary shrink-0" />
              <span>{recurrenceSummaryText}</span>
            </div>
          )}

          {/* Reminder badge (Nhắc hẹn) */}
          {reminderStr && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
              <Bell className="h-3 w-3 shrink-0" />
              <span>{reminderStr}</span>
            </div>
          )}

          {/* Clean description (Ghi chú mô tả) */}
          {cleanDesc && (
            <div className="text-xs text-circle-slate dark:text-circle-dark-muted bg-circle-canvas/50 dark:bg-circle-dark-canvas/50 rounded-xl p-2.5 border border-circle-hairline/60 dark:border-circle-dark-hairline/60 leading-relaxed italic">
              "{cleanDesc}"
            </div>
          )}
        </div>

        {/* 4. RSVP Section (Giữ nguyên phần bình chọn cũ: 3 thanh Poll progress bar + avatar stack) */}
        <div className="px-4 py-3 bg-circle-canvas/50 dark:bg-circle-dark-canvas/50 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-circle-charcoal dark:text-circle-dark-text flex items-center gap-1.5">
              {isCancelled ? (
                <>
                  <Lock className="h-3.5 w-3.5 text-rose-500" />
                  <span className="text-rose-600 dark:text-rose-400">{t.collab.eventCancelledBanner}</span>
                </>
              ) : isStarted ? (
                <>
                  <Lock className="h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted" />
                  <span className="text-circle-slate dark:text-circle-dark-muted">{t.collab.rsvpClosed}</span>
                </>
              ) : (
                <>
                  <Users className="h-3.5 w-3.5 text-circle-sage dark:text-circle-primary" />
                  <span>{t.collab.attendancePoll}</span>
                </>
              )}
            </span>
            <span className="text-[11px] text-circle-slate dark:text-circle-dark-muted font-medium">
              {t.collab.responsesCount.replace('{count}', String(totalVotes))}
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
                    onClick={() => handleVoteOptionClick(opt.status)}
                    className={`relative w-full overflow-hidden rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
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
                          const name = isMe ? t.calls.youLabel : u.displayName;
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

      {/* ============================================================== */}
      {/* MODAL XÁC NHẬN PHẠM VI ÁP DỤNG KHI BÌNH CHỌN SỰ KIỆN LẶP LẠI */}
      {/* ============================================================== */}
      {showScopeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-5 shadow-2xl space-y-4">
            <div>
              <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                Bạn muốn áp dụng thay đổi như thế nào ?
              </h4>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleApplyVoteScope('this')}
                className="w-full text-left p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:border-circle-primary hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-all cursor-pointer"
              >
                <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  Chỉ lần này
                </p>
                <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                  Chỉ áp dụng phản hồi cho riêng lần diễn ra này ({formatDateOnly(startDate)}).
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyVoteScope('future')}
                className="w-full text-left p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:border-circle-primary hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-all cursor-pointer"
              >
                <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  Lần này và các lần tiếp theo
                </p>
                <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                  Áp dụng phản hồi từ ngày {formatDateOnly(startDate)} trở đi.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyVoteScope('all')}
                className="w-full text-left p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:border-circle-primary hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-all cursor-pointer"
              >
                <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  Tất cả các lần
                </p>
                <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                  Áp dụng cho toàn bộ các lần trong chuỗi lặp lại.
                </p>
              </button>
            </div>

            <div className="pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline flex justify-end">
              <button
                type="button"
                onClick={() => setShowScopeModal(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-circle-slate hover:bg-circle-wash transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
