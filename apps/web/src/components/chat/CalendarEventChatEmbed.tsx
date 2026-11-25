'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Clock,
  MapPin,
  Bell,
  Users,
  Check,
  HelpCircle,
  Lock,
  X,
  Repeat,
  FileText,
  ArrowRight,
  ChevronDown,
  ChevronUp,
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
  const router = useRouter();
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

  // Dynamic system message action tracker (thay đổi nội dung theo tạo, sửa, có người bình chọn, hủy, xóa)
  const getActionType = (data: CalendarEventMessagePayload): 'CREATED' | 'UPDATED' | 'CANCELLED' | 'DELETED' | 'RSVP_UPDATED' => {
    if (data.action === 'DELETED' || data.latestAction === 'DELETED') {
      return 'DELETED';
    }
    if (data.isCancelled || data.action === 'CANCELLED' || data.latestAction === 'CANCELLED') {
      return 'CANCELLED';
    }
    const act = data.latestAction || data.action;
    if (act === 'UPDATED') return 'UPDATED';
    if (act === 'RSVP_UPDATED') return 'RSVP_UPDATED';
    return 'CREATED';
  };

  const [lastAction, setLastAction] = useState<{
    type: 'CREATED' | 'UPDATED' | 'CANCELLED' | 'DELETED' | 'RSVP_UPDATED';
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
  const isEnded = Boolean(eventData.endTime && new Date(eventData.endTime).getTime() < Date.now());
  const isHappeningNow = !isCancelled && !isEnded && isStarted;
  const isLocked = isStarted || isCancelled;

  const [isExpandedLogs, setIsExpandedLogs] = useState(false);

  // Compute RSVP interaction logs
  const rsvpLogs = useMemo(() => {
    const list: Array<{ id: string; text: string }> = [];
    const name = eventData.eventTitle || t.collab.calendarEventFallback || 'lịch hẹn';

    // Creator / initial created log
    const creator = isSenderMe ? (t.collab.meLabel || 'Bạn') : (eventData.creatorName || senderDisplayName || t.collab.memberDefault || 'Thành viên');
    list.push({
      id: 'created',
      text: isSenderMe
        ? (t.collab.eventCreatedLogMe || 'Bạn đã tạo lịch hẹn "{title}"').replace('{title}', name)
        : (t.collab.eventCreatedLog || '{creator} đã tạo lịch hẹn "{title}"').replace('{creator}', creator).replace('{title}', name),
    });

    const userRsvps = rsvps?.userRsvps || [];
    userRsvps.forEach((u: any, idx: number) => {
      const isMe = u.userId === currentUserId || (isSenderMe && idx === 0);
      const actor = isMe ? (t.collab.meLabel || 'Bạn') : (u.displayName || t.collab.memberDefault || 'Thành viên');
      let statusText = t.collab.eventRsvpYes || 'tham gia';
      if (u.status === EventRsvpStatus.MAYBE) {
        statusText = t.collab.eventRsvpMaybe || 'có thể tham gia';
      } else if (u.status === EventRsvpStatus.NO) {
        statusText = t.collab.eventRsvpNo || 'từ chối';
      }
      const text = isMe
        ? (t.collab.eventRsvpLogMe || 'Bạn đã xác nhận {status} lịch hẹn "{title}"')
            .replace('{status}', statusText)
            .replace('{title}', name)
        : (t.collab.eventRsvpLog || '{actor} đã xác nhận {status} lịch hẹn "{title}"')
            .replace('{actor}', actor)
            .replace('{status}', statusText)
            .replace('{title}', name);
      list.push({
        id: `${u.userId || idx}-${u.status}`,
        text,
      });
    });

    return list;
  }, [rsvps?.userRsvps, eventData.eventTitle, eventData.creatorName, isSenderMe, currentUserId, senderDisplayName, t]);

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
          isRecurrenceSplit: true,
        } as any);

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
    router.push('/calendar');
  };

  const yesUsers = useMemo(
    () => rsvps?.userRsvps?.filter((u) => u.status === EventRsvpStatus.YES) || [],
    [rsvps]
  );

  // Nội dung thông báo hệ thống động theo hành động: Tạo, Sửa, Huỷ, Xoá, hoặc Bình chọn
  // Tất cả đều có "lịch hẹn [tên lịch hẹn]" theo yêu cầu
  const systemMessageText = useMemo(() => {
    const isMe =
      (lastAction.actorUserId && lastAction.actorUserId === currentUserId) ||
      lastAction.actorName === 'Bạn' ||
      (isSenderMe && lastAction.type === 'CREATED');
    const actor = isMe
      ? 'Bạn'
      : (lastAction.actorName || senderDisplayName || eventData.creatorName || 'Một thành viên');
    const eventTitle = eventData.eventTitle || 'sự kiện';

    if (lastAction.type === 'DELETED' || eventData.action === 'DELETED' || eventData.latestAction === 'DELETED') {
      return isMe ? `Bạn đã xóa lịch hẹn "${eventTitle}"` : `${actor} đã xóa lịch hẹn "${eventTitle}"`;
    }
    if (lastAction.type === 'CANCELLED' || isCancelled) {
      return isMe ? `Bạn đã hủy lịch hẹn "${eventTitle}"` : `${actor} đã hủy lịch hẹn "${eventTitle}"`;
    }
    if (lastAction.type === 'UPDATED') {
      return isMe ? `Bạn đã cập nhật lịch hẹn "${eventTitle}"` : `${actor} đã cập nhật lịch hẹn "${eventTitle}"`;
    }
    if (eventData.action === 'REMINDER' || eventData.latestAction === 'REMINDER') {
      return `Nhắc hẹn: Lịch hẹn "${eventTitle}" sắp diễn ra`;
    }
    if (lastAction.type === 'RSVP_UPDATED') {
      let actionVerb = 'tham gia';
      if (lastAction.rsvpStatus === EventRsvpStatus.MAYBE) {
        actionVerb = 'có thể tham gia';
      } else if (lastAction.rsvpStatus === EventRsvpStatus.NO) {
        actionVerb = 'từ chối tham gia';
      }
      return isMe
        ? `Bạn đã xác nhận ${actionVerb} lịch hẹn "${eventTitle}"`
        : `${actor} đã xác nhận ${actionVerb} lịch hẹn "${eventTitle}"`;
    }
    return isMe ? `Bạn đã tạo lịch hẹn "${eventTitle}"` : `${actor} đã tạo lịch hẹn "${eventTitle}"`;
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

  // Chỉ có thẻ gốc (CREATED / REMINDER) mới hiển thị thẻ sự kiện.
  // Các thông báo hệ thống phụ (UPDATED, CANCELLED, DELETED) sẽ chỉ hiển thị dòng text thông báo duy nhất.
  const showCard =
    (eventData.action === 'CREATED' || eventData.action === 'REMINDER') &&
    eventData.latestAction !== 'DELETED';

  if (!showCard) {
    return (
      <div className="w-full flex items-center justify-center my-2 select-none">
        <div className="flex items-center justify-center gap-1.5 text-xs text-circle-slate dark:text-circle-dark-muted font-medium">
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
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto transition-all select-text">
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

      {/* Thẻ sự kiện - Cấu trúc và Style chuẩn theo Live Wheel Embed Card */}
      <div className="w-full rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 dark:from-circle-dark-surface dark:via-circle-dark-card dark:to-emerald-950/20 p-4 shadow-lg shadow-emerald-500/5 transition-all hover:border-emerald-500/50">
        {/* Top Header Card */}
        <div className="flex items-center justify-between pb-3 border-b border-circle-hairline/80 dark:border-circle-dark-hairline gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4.5 h-4.5" />
            </div>
            <h4
              title={eventData.eventTitle}
              className={`text-sm font-black text-circle-charcoal dark:text-circle-dark-text tracking-tight truncate ${
                isCancelled ? 'line-through text-rose-500/80 dark:text-rose-400/80' : ''
              }`}
            >
              {eventData.eventTitle}
            </h4>
          </div>

          {isCancelled ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
              {locale === 'vi' ? 'Đã hủy' : 'Cancelled'}
            </span>
          ) : isEnded ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-circle-wash dark:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted border border-circle-hairline/60 shrink-0">
              {locale === 'vi' ? 'Đã kết thúc' : 'Ended'}
            </span>
          ) : isHappeningNow ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{locale === 'vi' ? 'Đang diễn ra' : 'HAPPENING'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 shrink-0">
              {locale === 'vi' ? 'Sắp tới' : 'Upcoming'}
            </span>
          )}
        </div>

        {/* Creator Info */}
        <div className="py-3 flex items-center gap-2.5">
          {senderAvatarUrl || (eventData as any)?.creatorAvatar ? (
            <img
              src={senderAvatarUrl || (eventData as any)?.creatorAvatar || ''}
              alt={senderDisplayName || eventData.creatorName}
              className="w-9 h-9 rounded-full object-cover border border-circle-hairline dark:border-circle-dark-hairline shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
              {(senderDisplayName || eventData.creatorName)?.charAt(0) || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted leading-tight truncate">
              <span className="font-bold text-circle-charcoal dark:text-circle-dark-text">
                {senderDisplayName || eventData.creatorName}
              </span>{' '}
              {locale === 'vi' ? 'đã tạo lịch hẹn cho nhóm' : 'created an event for the circle'}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-circle-slate dark:text-circle-dark-muted font-medium">
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {yesUsers.length > 0
                  ? locale === 'vi'
                    ? `${yesUsers.length} người tham gia`
                    : `${yesUsers.length} participants`
                  : locale === 'vi'
                  ? 'Chưa có người tham gia'
                  : 'No participants yet'}
              </span>
            </div>
          </div>
        </div>

        {/* Event Details: Time & Location & Note */}
        <div className="pb-3 space-y-2">
          {/* Thời gian */}
          <div className="flex items-center gap-2 text-xs text-circle-charcoal dark:text-circle-dark-text bg-white/70 dark:bg-circle-dark-surface/70 rounded-2xl p-2.5 border border-circle-hairline/60 dark:border-circle-dark-hairline/60">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold text-xs leading-tight">
              {isSameDay ? (
                `${startTimeStr}${endTimeStr ? ` – ${endTimeStr}` : ''} • ${weekdayStr}, ${formatDateOnly(startDate)}`
              ) : (
                `${startTimeStr}, ${formatDateOnly(startDate)} ➔ ${endTimeStr || ''}, ${formatDateOnly(endDate!)} (${durationDays} ngày)`
              )}
            </span>
          </div>

          {/* Địa điểm nếu có */}
          {eventData.location && (
            <div className="flex items-center gap-2 text-xs text-circle-charcoal dark:text-circle-dark-text bg-white/70 dark:bg-circle-dark-surface/70 rounded-2xl p-2.5 border border-circle-hairline/60 dark:border-circle-dark-hairline/60">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <div className="min-w-0 flex-1 font-semibold text-xs leading-tight truncate">
                <EventLocationDisplay
                  location={eventData.location}
                  className="text-xs font-semibold"
                  iconClassName="hidden"
                />
              </div>
            </div>
          )}

          {/* Lặp lại nếu có */}
          {isRecurring && recurrenceSummaryText && (
            <div className="flex items-center gap-2 text-xs text-circle-charcoal dark:text-circle-dark-text bg-white/70 dark:bg-circle-dark-surface/70 rounded-2xl p-2 border border-circle-hairline/60 dark:border-circle-dark-hairline/60">
              <Repeat className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium text-[11px] leading-tight truncate">{recurrenceSummaryText}</span>
            </div>
          )}

          {/* Ghi chú nếu có */}
          {cleanDesc && (
            <div className="flex items-start gap-2 text-xs text-circle-slate dark:text-circle-dark-muted bg-white/70 dark:bg-circle-dark-surface/70 rounded-2xl p-2.5 border border-circle-hairline/60 dark:border-circle-dark-hairline/60">
              <FileText className="w-3.5 h-3.5 text-circle-slate dark:text-circle-dark-muted shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed line-clamp-2 italic">{cleanDesc}</p>
            </div>
          )}
        </div>

        {/* Stack of Participants Avatars */}
        {yesUsers.length > 0 && (
          <div className="flex items-center gap-1.5 pb-3">
            <div className="flex -space-x-2 overflow-hidden py-1">
              {yesUsers.slice(0, 5).map((p, idx) => (
                <div
                  key={p.userId || idx}
                  className="w-7 h-7 rounded-full border-2 border-white dark:border-circle-dark-surface bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300 overflow-hidden"
                  title={p.displayName}
                >
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt={p.displayName} className="w-full h-full object-cover" />
                  ) : (
                    p.displayName?.charAt(0) || 'U'
                  )}
                </div>
              ))}
            </div>
            {yesUsers.length > 5 && (
              <span className="text-[11px] font-semibold text-circle-slate dark:text-circle-dark-muted">
                +{yesUsers.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Quick RSVP 3-Option Buttons */}
        {!isCancelled && !isStarted && (
          <div className="grid grid-cols-3 gap-1.5 pb-3">
            <button
              type="button"
              disabled={isLocked || rsvpMutation.isPending}
              onClick={() => handleVoteOptionClick(EventRsvpStatus.YES)}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                myRsvp === EventRsvpStatus.YES
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white/80 dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text border border-circle-hairline hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
              }`}
            >
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span>{locale === 'vi' ? 'Tham gia' : 'Yes'}</span>
              <span className="text-[10px] opacity-75">({rsvps?.yesCount || 0})</span>
            </button>
            <button
              type="button"
              disabled={isLocked || rsvpMutation.isPending}
              onClick={() => handleVoteOptionClick(EventRsvpStatus.MAYBE)}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                myRsvp === EventRsvpStatus.MAYBE
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white/80 dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text border border-circle-hairline hover:bg-amber-50 dark:hover:bg-amber-950/20'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{locale === 'vi' ? 'Có thể' : 'Maybe'}</span>
              <span className="text-[10px] opacity-75">({rsvps?.maybeCount || 0})</span>
            </button>
            <button
              type="button"
              disabled={isLocked || rsvpMutation.isPending}
              onClick={() => handleVoteOptionClick(EventRsvpStatus.NO)}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                myRsvp === EventRsvpStatus.NO
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white/80 dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text border border-circle-hairline hover:bg-rose-50 dark:hover:bg-rose-950/20'
              }`}
            >
              <X className="h-3.5 w-3.5 shrink-0" />
              <span>{locale === 'vi' ? 'Từ chối' : 'No'}</span>
              <span className="text-[10px] opacity-75">({rsvps?.noCount || 0})</span>
            </button>
          </div>
        )}

        {/* Action Button: Xem chi tiết lịch hẹn (chuẩn theo Live Wheel Embed) */}
        {isCancelled ? (
          <div className="w-full py-2.5 px-4 rounded-2xl bg-circle-wash dark:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-default border border-circle-hairline/80 dark:border-circle-dark-hairline">
            <span>{locale === 'vi' ? 'Lịch hẹn đã bị hủy' : 'Event cancelled'}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOpenCalendar}
            className="w-full py-2.5 px-4 rounded-2xl bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal dark:text-circle-dark-canvas font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <CalendarDays className="w-4 h-4" />
            <span>{locale === 'vi' ? 'Xem chi tiết lịch hẹn' : 'View Event Details'}</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        )}
      </div>

      {/* Inline Activity Logs for RSVP changes */}
      {rsvpLogs.length > 0 && (
        <div className="mt-2.5 flex flex-col items-center gap-1 text-center select-none">
          {(isExpandedLogs ? rsvpLogs : [rsvpLogs[rsvpLogs.length - 1]]).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-center gap-1.5 text-[11px] text-circle-slate dark:text-circle-dark-muted font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 opacity-80" />
              <span>{log.text}</span>
            </div>
          ))}

          {rsvpLogs.length > 1 && (
            <button
              type="button"
              onClick={() => setIsExpandedLogs(!isExpandedLogs)}
              className="inline-flex items-center gap-1 mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-circle-primary dark:text-circle-dark-primary bg-circle-primary/10 hover:bg-circle-primary/15 transition-all cursor-pointer active:scale-95"
            >
              <span>
                {isExpandedLogs
                  ? (t.common.collapse || 'Thu gọn')
                  : (t.common.viewMoreCount?.replace('{count}', String(rsvpLogs.length)) || `Xem thêm (${rsvpLogs.length})`)}
              </span>
              {isExpandedLogs ? (
                <ChevronUp className="w-2.5 h-2.5" />
              ) : (
                <ChevronDown className="w-2.5 h-2.5" />
              )}
            </button>
          )}
        </div>
      )}

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
