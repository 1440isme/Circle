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
  FileText,
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

  // Dynamic system message action tracker (thay đổi nội dung theo tạo, sửa, có người bình chọn)
  const getActionType = (data: CalendarEventMessagePayload): 'CREATED' | 'UPDATED' | 'CANCELLED' | 'RSVP_UPDATED' => {
    if (data.isCancelled || data.action === 'CANCELLED' || data.latestAction === 'CANCELLED') {
      return 'CANCELLED';
    }
    const act = data.latestAction || data.action;
    if (act === 'UPDATED') return 'UPDATED';
    if (act === 'RSVP_UPDATED') return 'RSVP_UPDATED';
    return 'CREATED';
  };

  const [lastAction, setLastAction] = useState<{
    type: 'CREATED' | 'UPDATED' | 'CANCELLED' | 'RSVP_UPDATED';
    actorName?: string;
    actorUserId?: string;
    rsvpStatus?: EventRsvpStatus;
  }>(() => {
    const actType = getActionType(eventData);
    return {
      type: actType,
      actorName: eventData.lastActorName || senderDisplayName || eventData.creatorName,
      actorUserId: eventData.lastActorUserId || (isSenderMe && actType === 'CREATED' ? currentUserId : undefined),
      rsvpStatus: eventData.lastRsvpStatus,
    };
  });

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

  // Đồng bộ trạng thái khi prop eventData thay đổi (ví dụ khi tin nhắn cập nhật realtime qua chat:message-updated)
  useEffect(() => {
    const actType = getActionType(eventData);
    setLastAction({
      type: actType,
      actorName: eventData.lastActorName || senderDisplayName || eventData.creatorName,
      actorUserId: eventData.lastActorUserId || (isSenderMe && actType === 'CREATED' ? currentUserId : undefined),
      rsvpStatus: eventData.lastRsvpStatus,
    });
  }, [
    eventData.action,
    eventData.latestAction,
    eventData.isCancelled,
    eventData.lastActorName,
    eventData.lastActorUserId,
    eventData.lastRsvpStatus,
    eventData.creatorName,
    senderDisplayName,
    isSenderMe,
    currentUserId,
  ]);

  // Realtime Socket.IO sync for RSVP updates (COL-09)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRsvpUpdated = (data: { eventId: string; circleId: string; rsvps: any; rsvp?: any }) => {
      if (data.eventId === eventData.eventId) {
        if (data.rsvps) {
          setRsvps(data.rsvps);
        }
        if (data.rsvp) {
          setLastAction({
            type: 'RSVP_UPDATED',
            actorName: data.rsvp.user?.profile?.displayName || 'Thành viên',
            actorUserId: data.rsvp.userId,
            rsvpStatus: data.rsvp.status,
          });
        }
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

      // Cập nhật thông báo hệ thống phía trên thẻ
      setLastAction({
        type: 'RSVP_UPDATED',
        actorName: 'Bạn',
        actorUserId: currentUserId,
        rsvpStatus: status,
      });

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

  const handleOpenCalendar = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetCalendarEvent(eventData.startTime, eventData.eventId);
    setActiveCircleView('calendar');
  };

  const yesUsers = useMemo(
    () => rsvps?.userRsvps?.filter((u) => u.status === EventRsvpStatus.YES) || [],
    [rsvps]
  );

  // Nội dung thông báo hệ thống động theo hành động: Tạo, Sửa, Huỷ, hoặc Bình chọn
  const systemMessageText = useMemo(() => {
    const isMe =
      (lastAction.actorUserId && lastAction.actorUserId === currentUserId) ||
      lastAction.actorName === 'Bạn' ||
      (isSenderMe && lastAction.type === 'CREATED');
    const actor = isMe
      ? 'Bạn'
      : (lastAction.actorName || senderDisplayName || eventData.creatorName || 'Một thành viên');

    if (lastAction.type === 'CANCELLED' || isCancelled) {
      return isMe ? 'Bạn đã hủy lịch hẹn' : `${actor} đã hủy lịch hẹn`;
    }
    if (lastAction.type === 'UPDATED') {
      return isMe ? 'Bạn đã cập nhật lịch hẹn' : `${actor} đã cập nhật lịch hẹn`;
    }
    if (eventData.action === 'REMINDER' || eventData.latestAction === 'REMINDER') {
      return `Nhắc hẹn: ${eventData.eventTitle || 'Sự kiện sắp diễn ra'}`;
    }
    if (lastAction.type === 'RSVP_UPDATED') {
      let actionVerb = 'tham gia';
      if (lastAction.rsvpStatus === EventRsvpStatus.MAYBE) {
        actionVerb = 'có thể tham gia';
      } else if (lastAction.rsvpStatus === EventRsvpStatus.NO) {
        actionVerb = 'từ chối tham gia';
      }
      return isMe ? `Bạn đã xác nhận ${actionVerb}` : `${actor} đã xác nhận ${actionVerb}`;
    }
    return isMe ? 'Bạn tạo nhắc hẹn mới' : `${actor} tạo nhắc hẹn mới`;
  }, [
    lastAction,
    isCancelled,
    currentUserId,
    isSenderMe,
    senderDisplayName,
    eventData.creatorName,
    eventData.action,
    eventData.latestAction,
    eventData.eventTitle,
  ]);

  // "và chỉ cần thẻ sự kiện khi tạo hoặc nhắc thui"
  // Các hành động sửa, bình chọn, hủy chỉ hiển thị dòng thông báo hệ thống (System Message)
  const showCard =
    eventData.action === 'CREATED' ||
    eventData.action === 'REMINDER' ||
    !eventData.action;

  if (!showCard) {
    return (
      <div className="w-full flex items-center justify-center my-2 select-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-circle-wash/80 dark:bg-circle-dark-wash/80 text-circle-slate dark:text-circle-dark-muted border border-circle-hairline/60 dark:border-circle-dark-hairline/60 shadow-2xs">
          <CalendarDays className="w-3.5 h-3.5 text-circle-primary shrink-0" />
          <span>{systemMessageText}</span>
          <span className="opacity-50">…</span>
          <button
            type="button"
            onClick={handleOpenCalendar}
            className="text-circle-primary dark:text-circle-dark-primary font-bold hover:underline cursor-pointer transition-colors"
          >
            Xem
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto transition-all select-text">
      {/* 1. Dòng thông báo hệ thống nằm phía trên thẻ (System Message động) */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-circle-slate dark:text-circle-dark-muted mb-2 font-medium select-none">
        <span>{systemMessageText}</span>
        <span className="opacity-60">…</span>
        <button
          type="button"
          onClick={handleOpenCalendar}
          className="text-circle-primary dark:text-circle-dark-primary font-bold hover:underline cursor-pointer transition-colors"
        >
          Xem
        </button>
      </div>

      {/* Container thẻ sự kiện */}
      <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-md overflow-hidden transition-all hover:border-circle-primary/40">
        {/* 2. Ảnh bìa (Màu chủ đạo của Web: Emerald/Sage Brand Gradient) & Tên sự kiện */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-5 pt-5 pb-5 text-white select-none">
          {/* Decorative Pattern & Glass elements */}
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10 blur-xl" />
          <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-lg" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/20 backdrop-blur-md border border-white/25 text-white shadow-xs">
                <CalendarIcon className="h-3.5 w-3.5 text-emerald-100" />
                <span>Lịch hẹn</span>
              </div>

              <button
                type="button"
                onClick={handleOpenCalendar}
                title={t.collab.viewOnCalendar}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 transition-all shrink-0 cursor-pointer active:scale-95 shadow-xs"
              >
                <CalendarDays className="h-3.5 w-3.5 text-emerald-100" />
                <span>Xem lịch</span>
              </button>
            </div>

            <div className="space-y-1">
              <h3
                className={`text-lg sm:text-xl font-bold tracking-tight text-white leading-snug break-words drop-shadow-xs ${
                  isCancelled ? 'line-through opacity-70 text-rose-200' : ''
                }`}
              >
                {eventData.eventTitle}
              </h3>
              {isCancelled && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/80 text-white border border-rose-400 shadow-xs">
                  Sự kiện đã bị hủy
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Chi tiết: Địa điểm, Thời gian, Lặp lại, Nhắc hẹn, Ghi chú (Chỉ giữ lại icon, bỏ các chữ nhãn) */}
        <div className="p-4 sm:p-5 space-y-3 text-xs text-circle-charcoal dark:text-circle-dark-text">
          {/* Thời gian bắt đầu – kết thúc (chỉ có icon Clock + thông tin thời gian) */}
          <div className="flex items-center gap-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text">
            <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {isSameDay ? (
              <span className="font-semibold text-sm">
                {startTimeStr}{endTimeStr ? ` – ${endTimeStr}` : ''} • {weekdayStr}, {formatDateOnly(startDate)}
              </span>
            ) : (
              <div className="font-semibold text-sm flex items-center gap-1.5 flex-wrap">
                <span>{startTimeStr}, {formatDateOnly(startDate)}</span>
                <span className="text-circle-slate dark:text-circle-dark-muted font-bold">➔</span>
                <span>{endTimeStr || ''}, {formatDateOnly(endDate!)}</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  {durationDays} ngày
                </span>
              </div>
            )}
          </div>

          {/* Địa điểm (chỉ có icon MapPin + địa điểm) */}
          {eventData.location && (
            <div className="flex items-center gap-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text">
              <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
              <div className="min-w-0 flex-1 font-semibold text-sm break-words">
                <EventLocationDisplay
                  location={eventData.location}
                  className="text-sm font-semibold"
                  iconClassName="hidden"
                />
              </div>
            </div>
          )}

          {/* Lặp lại (chỉ có icon Repeat + tóm tắt lặp) */}
          {isRecurring && recurrenceSummaryText && (
            <div className="flex items-center gap-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text">
              <Repeat className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold text-sm">{recurrenceSummaryText}</span>
            </div>
          )}

          {/* Nhắc hẹn nếu có (chỉ có icon Bell + thời gian nhắc) */}
          {reminderStr && (
            <div className="flex items-center gap-2.5 text-xs text-amber-600 dark:text-amber-400 font-semibold">
              <Bell className="h-4 w-4 shrink-0" />
              <span>{reminderStr}</span>
            </div>
          )}

          {/* Ghi chú được tách thành một vùng riêng (chỉ có icon FileText + nội dung ghi chú) */}
          {cleanDesc && (
            <div className="rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 p-3 flex items-start gap-2.5 mt-1.5">
              <FileText className="h-4 w-4 text-circle-slate dark:text-circle-dark-muted shrink-0 mt-0.5" />
              <p className="text-xs text-circle-charcoal dark:text-circle-dark-text leading-relaxed whitespace-pre-wrap flex-1 italic">
                {cleanDesc}
              </p>
            </div>
          )}
        </div>

        {/* 4. Số thành viên xác nhận & Ba nút phản hồi (Tham gia, Có thể, Từ chối) */}
        <div className="px-4 sm:px-5 py-4 bg-circle-canvas/50 dark:bg-circle-dark-canvas/50 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60 space-y-3.5">
          {/* Header: Số thành viên xác nhận */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-circle-charcoal dark:text-circle-dark-text">
                {yesUsers.length} thành viên xác nhận
              </span>
            </div>

            {/* Circular avatars of confirmed attendees */}
            {yesUsers.length > 0 && (
              <div className="flex items-center -space-x-1.5 shrink-0 pl-2">
                {yesUsers.slice(0, 5).map((u, idx) => {
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
                {yesUsers.length > 5 && (
                  <span
                    title={yesUsers.slice(5).map((u) => u.displayName).join(', ')}
                    className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-circle-charcoal/80 dark:bg-circle-slate text-white text-[9px] font-bold ring-2 ring-white dark:ring-circle-dark-surface shrink-0"
                  >
                    +{yesUsers.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Ba nút phản hồi: Tham gia, Có thể, Từ chối */}
          <div className="grid grid-cols-3 gap-2">
            {/* 1. Tham gia */}
            <button
              type="button"
              disabled={isLocked || rsvpMutation.isPending}
              onClick={() => handleVoteOptionClick(EventRsvpStatus.YES)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isLocked ? 'cursor-not-allowed opacity-60' : 'active:scale-95'
              } ${
                myRsvp === EventRsvpStatus.YES
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              <Check className="h-4 w-4 shrink-0" />
              <span>Tham gia</span>
              <span className="text-[11px] opacity-80">({rsvps?.yesCount || 0})</span>
            </button>

            {/* 2. Có thể */}
            <button
              type="button"
              disabled={isLocked || rsvpMutation.isPending}
              onClick={() => handleVoteOptionClick(EventRsvpStatus.MAYBE)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isLocked ? 'cursor-not-allowed opacity-60' : 'active:scale-95'
              } ${
                myRsvp === EventRsvpStatus.MAYBE
                  ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/30'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span>Có thể</span>
              <span className="text-[11px] opacity-80">({rsvps?.maybeCount || 0})</span>
            </button>

            {/* 3. Từ chối */}
            <button
              type="button"
              disabled={isLocked || rsvpMutation.isPending}
              onClick={() => handleVoteOptionClick(EventRsvpStatus.NO)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isLocked ? 'cursor-not-allowed opacity-60' : 'active:scale-95'
              } ${
                myRsvp === EventRsvpStatus.NO
                  ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/30'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/20'
              }`}
            >
              <X className="h-4 w-4 shrink-0" />
              <span>Từ chối</span>
              <span className="text-[11px] opacity-80">({rsvps?.noCount || 0})</span>
            </button>
          </div>

          {/* Locked / Notice banner */}
          {isCancelled && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium pt-1">
              <Lock className="h-3.5 w-3.5" />
              <span>{t.collab.eventCancelledBanner}</span>
            </div>
          )}
          {!isCancelled && isStarted && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-circle-slate dark:text-circle-dark-muted font-medium pt-1">
              <Lock className="h-3.5 w-3.5" />
              <span>{t.collab.rsvpClosed}</span>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================
          MODAL XÁC NHẬN PHẠM VI BÌNH CHỌN CHO SỰ KIỆN LẶP LẠI
          =================================================================== */}
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
