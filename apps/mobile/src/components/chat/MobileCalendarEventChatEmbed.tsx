import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Clock,
  MapPin,
  Check,
  HelpCircle,
  X,
  Users,
  Repeat,
  Bell,
  Lock,
  CalendarDays,
  FileText,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../stores/auth.store';
import { useLanguageStore } from '../../stores/language.store';
import {
  respondCalendarEventRsvpApi,
  updateCalendarEventApi,
  createCalendarEventApi,
} from '../../services/circle-tools.service';
import { EventRsvpStatus } from '@circle/types';
import {
  parseEventRecurrence,
  formatRecurrenceSummary,
  formatDateKey,
  serializeRecurrence,
  RecurrenceConfig,
} from '../tools/MobileCalendarView';

interface CalendarEmbedData {
  id?: string;
  eventId?: string;
  title?: string;
  eventTitle?: string;
  startTime: string;
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
  reminderTime?: string | null;
  creatorName?: string;
  action?: string;
  latestAction?: string;
  lastActorName?: string;
  lastActorUserId?: string;
  lastRsvpStatus?: EventRsvpStatus;
  isCancelled?: boolean;
  rsvps?:
    | {
        yesCount?: number;
        noCount?: number;
        maybeCount?: number;
        userRsvps?: Array<{
          userId: string;
          status: EventRsvpStatus;
          displayName?: string;
          avatarUrl?: string | null;
        }>;
      }
    | Array<{
        id?: string;
        userId: string;
        status: EventRsvpStatus;
        displayName?: string;
        avatarUrl?: string | null;
        user?: {
          id?: string;
          email?: string;
          profile?: {
            displayName?: string;
            avatarUrl?: string | null;
          };
        };
      }>;
}

export interface MobileCalendarEventChatEmbedProps {
  content?: string;
  data?: any;
  circleId: string;
  currentUserId?: string;
  isSenderMe?: boolean;
  senderDisplayName?: string;
  senderAvatarUrl?: string | null;
  sentAt?: string;
  senderTextColor?: string;
  colors?: {
    primary?: string;
    wash?: string;
    subtle?: string;
    text?: string;
    card?: string;
    border?: string;
    surface?: string;
    hairline?: string;
    danger?: string;
    sage?: string;
    onPrimary?: string;
  };
  onOpenCalendar?: () => void;
  onViewOnCalendar?: (eventId?: string) => void;
}

export const MobileCalendarEventChatEmbed: React.FC<MobileCalendarEventChatEmbedProps> = ({
  content,
  data: propData,
  circleId,
  currentUserId,
  isSenderMe = false,
  senderDisplayName,
  senderAvatarUrl,
  sentAt,
  senderTextColor = '#FFFFFF',
  colors = {},
  onOpenCalendar,
  onViewOnCalendar,
}) => {
  const { resolvedTheme, colors: themeColors } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const effectiveColors = { ...themeColors, ...colors };
  const authUserId = useAuthStore((s) => s.user?.id);
  const effectiveUserId = currentUserId || authUserId;
  const { t } = useLanguageStore();

  const [data, setData] = useState<CalendarEmbedData | null>(() => {
    if (propData) return propData;
    if (!content) return null;
    try {
      const jsonStr = content.startsWith('[CALENDAR_EVENT]:')
        ? content.replace('[CALENDAR_EVENT]:', '').trim()
        : content;
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  });

  // Đồng bộ data khi propData hoặc content thay đổi
  useEffect(() => {
    if (propData) {
      setData(propData);
    } else if (content) {
      try {
        const jsonStr = content.startsWith('[CALENDAR_EVENT]:')
          ? content.replace('[CALENDAR_EVENT]:', '').trim()
          : content;
        setData(JSON.parse(jsonStr));
      } catch {
        // ignore
      }
    }
  }, [propData, content]);

  // Trạng thái hành động mới nhất của lịch hẹn để hiển thị thông báo hệ thống động
  const getActionType = (raw: any): 'CREATED' | 'UPDATED' | 'CANCELLED' | 'DELETED' | 'RSVP_UPDATED' => {
    if (raw?.action === 'DELETED' || raw?.latestAction === 'DELETED') {
      return 'DELETED';
    }
    if (raw?.isCancelled || raw?.action === 'CANCELLED' || raw?.latestAction === 'CANCELLED') {
      return 'CANCELLED';
    }
    const act = raw?.latestAction || raw?.action;
    if (act === 'UPDATED') return 'UPDATED';
    if (act === 'RSVP_UPDATED') return 'RSVP_UPDATED';
    return 'CREATED';
  };

  const [lastAction, setLastAction] = useState<{
    type: 'CREATED' | 'UPDATED' | 'RSVP_UPDATED' | 'CANCELLED' | 'DELETED';
    actorName?: string;
    actorUserId?: string;
    rsvpStatus?: EventRsvpStatus;
  }>(() => {
    const castData = data as any;
    const actType = getActionType(data);
    return {
      type: actType,
      actorName: castData?.lastActorName || senderDisplayName || data?.creatorName,
      actorUserId: castData?.lastActorUserId || (isSenderMe && actType === 'CREATED' ? effectiveUserId : undefined),
      rsvpStatus: castData?.lastRsvpStatus,
    };
  });

  // Cập nhật lastAction khi data thay đổi (realtime update qua chat:message-updated)
  useEffect(() => {
    if (!data) return;
    const castData = data as any;
    const actType = getActionType(data);
    setLastAction({
      type: actType,
      actorName: castData.lastActorName || senderDisplayName || data.creatorName,
      actorUserId: castData.lastActorUserId || (isSenderMe && actType === 'CREATED' ? effectiveUserId : undefined),
      rsvpStatus: castData.lastRsvpStatus,
    });
  }, [
    data?.action,
    (data as any)?.latestAction,
    data?.isCancelled,
    (data as any)?.lastActorName,
    (data as any)?.lastActorUserId,
    (data as any)?.lastRsvpStatus,
    data?.creatorName,
    senderDisplayName,
    isSenderMe,
    effectiveUserId,
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [pendingVoteStatus, setPendingVoteStatus] = useState<EventRsvpStatus | null>(null);

  const eventId = data?.eventId || data?.id;
  const eventTitle = data?.eventTitle || data?.title || 'Sự kiện Vòng tròn';

  // Recurrence & Description Parsing
  const { cleanDesc, recurrenceConfig } = useMemo(
    () => parseEventRecurrence(data?.description),
    [data?.description]
  );
  const isRecurring = Boolean(recurrenceConfig && recurrenceConfig.frequency !== 'none');

  const recurrenceSummaryText = useMemo(() => {
    if (!isRecurring || !recurrenceConfig) return null;
    return formatRecurrenceSummary(recurrenceConfig);
  }, [isRecurring, recurrenceConfig]);

  // Normalize initial RSVPs
  const initialNormalizedRsvps = useMemo(() => {
    if (!data) return { yesCount: 0, noCount: 0, maybeCount: 0, userRsvps: [] };

    if (data.rsvps && !Array.isArray(data.rsvps) && data.rsvps.userRsvps) {
      return {
        yesCount: data.rsvps.yesCount || 0,
        noCount: data.rsvps.noCount || 0,
        maybeCount: data.rsvps.maybeCount || 0,
        userRsvps: data.rsvps.userRsvps || [],
      };
    }

    if (Array.isArray(data.rsvps) && data.rsvps.length > 0) {
      const yesUsers = data.rsvps.filter((r) => r.status === EventRsvpStatus.YES);
      const maybeUsers = data.rsvps.filter((r) => r.status === EventRsvpStatus.MAYBE);
      const noUsers = data.rsvps.filter((r) => r.status === EventRsvpStatus.NO);
      return {
        yesCount: yesUsers.length,
        maybeCount: maybeUsers.length,
        noCount: noUsers.length,
        userRsvps: data.rsvps.map((r: any) => ({
          userId: r.userId,
          status: r.status,
          displayName: r.user?.profile?.displayName || r.displayName || 'Thành viên',
          avatarUrl: r.user?.profile?.avatarUrl || r.avatarUrl || null,
        })),
      };
    }

    // Default: creator has YES RSVP per COL-09
    return {
      yesCount: 1,
      noCount: 0,
      maybeCount: 0,
      userRsvps: [
        {
          userId: isSenderMe ? (effectiveUserId || '') : '',
          status: EventRsvpStatus.YES,
          displayName: senderDisplayName || data.creatorName || 'Người tạo',
          avatarUrl: senderAvatarUrl || null,
        },
      ],
    };
  }, [data, isSenderMe, effectiveUserId, senderDisplayName, senderAvatarUrl]);

  const [rsvps, setRsvps] = useState(initialNormalizedRsvps);

  useEffect(() => {
    setRsvps(initialNormalizedRsvps);
  }, [initialNormalizedRsvps]);

  // Realtime Socket.IO sync for RSVP updates
  useEffect(() => {
    if (!eventId) return;

    const handleRsvpUpdated = (payload: any) => {
      if (payload.circleId === circleId && payload.eventId === eventId) {
        if (payload.rsvps) {
          setRsvps({
            yesCount: payload.rsvps.yesCount || 0,
            noCount: payload.rsvps.noCount || 0,
            maybeCount: payload.rsvps.maybeCount || 0,
            userRsvps: payload.rsvps.userRsvps || [],
          });
        }
        if (payload.rsvp) {
          setLastAction({
            type: 'RSVP_UPDATED',
            actorName: payload.rsvp.user?.profile?.displayName || 'Thành viên',
            actorUserId: payload.rsvp.userId,
            rsvpStatus: payload.rsvp.status,
          });
        }
      }
    };

    let activeSocket: any = null;
    getSocket().then((s) => {
      if (!s) return;
      activeSocket = s;
      s.on('circle:calendar-event-rsvp-updated', handleRsvpUpdated);
    });

    return () => {
      if (activeSocket) {
        activeSocket.off('circle:calendar-event-rsvp-updated', handleRsvpUpdated);
      }
    };
  }, [circleId, eventId]);

  if (!data || !eventId) {
    return null;
  }

  // Date and Time Calculations
  const startDate = new Date(data.startTime || Date.now());
  const endDate = data.endTime ? new Date(data.endTime) : null;

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
    const startDay = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    ).getTime();
    const endDay = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    ).getTime();
    return Math.max(1, Math.round((endDay - startDay) / (24 * 60 * 60 * 1000)) + 1);
  }, [startDate, endDate]);

  const WEEKDAY_NAMES = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ];
  const weekdayStr = WEEKDAY_NAMES[startDate.getDay()];

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const startTimeStr = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;
  const endTimeStr = endDate ? `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}` : null;
  const startDateStr = `${pad(startDate.getDate())}/${pad(
    startDate.getMonth() + 1
  )}/${startDate.getFullYear()}`;
  const endDateStr = endDate
    ? `${pad(endDate.getDate())}/${pad(endDate.getMonth() + 1)}/${endDate.getFullYear()}`
    : null;

  const sentTimeStr = useMemo(() => {
    if (!sentAt) return null;
    const d = new Date(sentAt);
    if (isNaN(d.getTime())) return null;
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, [sentAt]);

  // Reminder String
  const reminderStr = useMemo(() => {
    if (!data.reminderTime) return null;
    const remDate = new Date(data.reminderTime);
    const diffMinutes = Math.round((startDate.getTime() - remDate.getTime()) / (60 * 1000));
    if (diffMinutes <= 0) return null;
    if (diffMinutes >= 1440) {
      const days = Math.round(diffMinutes / 1440);
      return `Trước ${days} ngày`;
    }
    if (diffMinutes >= 60) {
      const hours = Math.round(diffMinutes / 60);
      return `Trước ${hours} giờ`;
    }
    return `Trước ${diffMinutes} phút`;
  }, [data.reminderTime, startDate]);

  const isCancelled = Boolean(
    data.isCancelled || data.action === 'CANCELLED' || data.action === 'DELETED'
  );
  const isStarted = startDate.getTime() <= Date.now();
  const isEnded = Boolean(endDate && endDate.getTime() < Date.now());
  const isHappeningNow = !isCancelled && !isEnded && isStarted;
  const isLocked = isStarted || isCancelled;

  const creatorName = senderDisplayName || data?.creatorName || 'Người tạo';
  const creatorAvatar = senderAvatarUrl || (data as any)?.creatorAvatar || null;

  const myRsvp = useMemo(() => {
    const found = rsvps?.userRsvps?.find(
      (u) => u.userId && u.userId === effectiveUserId
    )?.status;
    if (found) return found;
    if (isSenderMe) return EventRsvpStatus.YES;
    return undefined;
  }, [rsvps, effectiveUserId, isSenderMe]);

  // Voting Execution
  const executeVote = async (status: EventRsvpStatus) => {
    if (!circleId || !eventId) return;
    setIsSubmitting(true);

    // Optimistic update
    setRsvps((prev) => {
      const prevUsers = prev?.userRsvps || [];
      const filtered = prevUsers.filter((u) => u.userId !== effectiveUserId);
      filtered.push({
        userId: effectiveUserId || '',
        status,
        displayName: 'Bạn',
        avatarUrl: null,
      });
      const yesCount = filtered.filter((u) => u.status === EventRsvpStatus.YES).length;
      const maybeCount = filtered.filter((u) => u.status === EventRsvpStatus.MAYBE).length;
      const noCount = filtered.filter((u) => u.status === EventRsvpStatus.NO).length;
      return { yesCount, maybeCount, noCount, userRsvps: filtered };
    });

    // Cập nhật thông báo hệ thống phía trên thẻ
    setLastAction({
      type: 'RSVP_UPDATED',
      actorName: 'Bạn',
      actorUserId: effectiveUserId,
      rsvpStatus: status,
    });

    try {
      await respondCalendarEventRsvpApi(circleId, eventId, { status });
    } catch (err) {
      console.warn('Failed to update RSVP on mobile:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteOptionClick = (status: EventRsvpStatus) => {
    if (isLocked || isSubmitting) return;
    Haptics.selectionAsync();
    if (isRecurring) {
      setPendingVoteStatus(status);
      setShowScopeModal(true);
    } else {
      executeVote(status);
    }
  };

  const handleApplyVoteScope = async (scope: 'this' | 'future' | 'all') => {
    const status = pendingVoteStatus;
    if (!status || !circleId || !eventId) return;
    setShowScopeModal(false);

    try {
      if (isRecurring && scope === 'this') {
        setIsSubmitting(true);
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

        await updateCalendarEventApi(circleId, eventId, { description: updatedParentDesc });

        const standaloneConfig: RecurrenceConfig = {
          ...(recurrenceConfig!),
          frequency: 'none',
          endType: 'never',
          endDate: null,
          isCustom: false,
        };
        const standaloneDesc = serializeRecurrence(standaloneConfig, cleanDesc);
        const evEnd = data.endTime ? new Date(data.endTime) : startDate;

        const created = await createCalendarEventApi(circleId, {
          eventTitle: data.eventTitle || data.title || 'Sự kiện',
          description: standaloneDesc,
          location: data.location || undefined,
          startTime: startDate.toISOString(),
          endTime: evEnd.toISOString(),
          reminderTime: data.reminderTime || undefined,
          isRecurrenceSplit: true,
        } as any);

        await respondCalendarEventRsvpApi(circleId, created.id, { status });
      } else {
        await executeVote(status);
      }
    } catch (err: any) {
      console.warn('Failed to apply vote scope on mobile:', err);
      await executeVote(status);
    } finally {
      setIsSubmitting(false);
      setPendingVoteStatus(null);
    }
  };

  const handleOpenCalendar = () => {
    Haptics.selectionAsync();
    if (onOpenCalendar) {
      onOpenCalendar();
    } else if (onViewOnCalendar) {
      onViewOnCalendar(eventId);
    }
  };

  // Poll Statistics
  const totalVotes =
    (rsvps?.yesCount || 0) + (rsvps?.maybeCount || 0) + (rsvps?.noCount || 0);

  const yesPercent =
    totalVotes > 0 ? Math.round(((rsvps?.yesCount || 0) / totalVotes) * 100) : 0;
  const maybePercent =
    totalVotes > 0 ? Math.round(((rsvps?.maybeCount || 0) / totalVotes) * 100) : 0;
  const noPercent =
    totalVotes > 0 ? Math.round(((rsvps?.noCount || 0) / totalVotes) * 100) : 0;

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

  const pollOptions = [
    {
      status: EventRsvpStatus.YES,
      label: 'Tham gia',
      icon: Check,
      count: rsvps?.yesCount || 0,
      percent: yesPercent,
      users: yesUsers,
      barColor: '#DCFCE7',
      activeBarColor: '#BBF7D0',
      activeBorder: '#10B981',
      iconColor: '#059669',
      textColor: '#059669',
    },
    {
      status: EventRsvpStatus.MAYBE,
      label: 'Có thể',
      icon: HelpCircle,
      count: rsvps?.maybeCount || 0,
      percent: maybePercent,
      users: maybeUsers,
      barColor: '#FEF9C3',
      activeBarColor: '#FDE047',
      activeBorder: '#CA8A04',
      iconColor: '#A16207',
      textColor: '#A16207',
    },
    {
      status: EventRsvpStatus.NO,
      label: 'Từ chối',
      icon: X,
      count: rsvps?.noCount || 0,
      percent: noPercent,
      users: noUsers,
      barColor: '#FEE2E2',
      activeBarColor: '#FECACA',
      activeBorder: '#DC2626',
      iconColor: '#B91C1C',
      textColor: '#B91C1C',
    },
  ];

  // Nội dung thông báo hệ thống động theo hành động: Tạo, Sửa, Huỷ, Xoá, hoặc Bình chọn
  // Tất cả đều có "lịch hẹn [tên lịch hẹn]" theo yêu cầu
  const systemMessageText = useMemo(() => {
    const isMe =
      (lastAction.actorUserId && lastAction.actorUserId === effectiveUserId) ||
      lastAction.actorName === 'Bạn' ||
      (isSenderMe && lastAction.type === 'CREATED');
    const actor = isMe
      ? 'Bạn'
      : (lastAction.actorName || senderDisplayName || data?.creatorName || 'Một thành viên');
    const name = eventTitle || data?.eventTitle || (data as any)?.title || 'sự kiện';

    if (lastAction.type === 'DELETED' || data?.action === 'DELETED' || (data as any)?.latestAction === 'DELETED') {
      return isMe ? `Bạn đã xóa lịch hẹn "${name}"` : `${actor} đã xóa lịch hẹn "${name}"`;
    }
    if (lastAction.type === 'CANCELLED' || isCancelled) {
      return isMe ? `Bạn đã hủy lịch hẹn "${name}"` : `${actor} đã hủy lịch hẹn "${name}"`;
    }
    if (lastAction.type === 'UPDATED') {
      return isMe ? `Bạn đã cập nhật lịch hẹn "${name}"` : `${actor} đã cập nhật lịch hẹn "${name}"`;
    }
    if (data?.action === 'REMINDER' || (data as any)?.latestAction === 'REMINDER') {
      return `Nhắc hẹn: Lịch hẹn "${name}" sắp diễn ra`;
    }
    if (lastAction.type === 'RSVP_UPDATED') {
      let actionVerb = 'tham gia';
      if (lastAction.rsvpStatus === EventRsvpStatus.MAYBE) {
        actionVerb = 'có thể tham gia';
      } else if (lastAction.rsvpStatus === EventRsvpStatus.NO) {
        actionVerb = 'từ chối tham gia';
      }
      return isMe
        ? `Bạn đã xác nhận ${actionVerb} lịch hẹn "${name}"`
        : `${actor} đã xác nhận ${actionVerb} lịch hẹn "${name}"`;
    }
    return isMe ? `Bạn đã tạo lịch hẹn "${name}"` : `${actor} đã tạo lịch hẹn "${name}"`;
  }, [
    lastAction,
    isCancelled,
    effectiveUserId,
    isSenderMe,
    senderDisplayName,
    data?.creatorName,
    data?.action,
    (data as any)?.latestAction,
    eventTitle,
    data?.eventTitle,
  ]);

  const [isExpandedLogs, setIsExpandedLogs] = useState(false);

  // Compute RSVP interaction logs for events
  const rsvpLogs = useMemo(() => {
    const list: Array<{ id: string; text: string }> = [];
    const name = eventTitle || data?.eventTitle || (data as any)?.title || t.collab.calendarEventFallback || 'lịch hẹn';

    // Creator log
    const isMeCreator =
      (lastAction.actorUserId && lastAction.actorUserId === effectiveUserId) ||
      (isSenderMe && lastAction.type === 'CREATED');
    const creator = isMeCreator
      ? (t.collab.meLabel || 'Bạn')
      : (data?.creatorName || senderDisplayName || t.collab.memberDefault || 'Thành viên');
    list.push({
      id: 'created',
      text: isMeCreator
        ? (t.collab.eventCreatedLogMe || 'Bạn đã tạo lịch hẹn "{title}"').replace('{title}', name)
        : (t.collab.eventCreatedLog || '{actor} đã tạo lịch hẹn "{title}"')
            .replace('{actor}', creator)
            .replace('{title}', name),
    });

    const userRsvps = (rsvps as any)?.userRsvps || [];
    userRsvps.forEach((u: any, idx: number) => {
      const isMe = u.userId === effectiveUserId || (isSenderMe && idx === 0);
      const actor = isMe
        ? (t.collab.meLabel || 'Bạn')
        : (u.displayName || u.user?.profile?.displayName || t.collab.memberDefault || 'Thành viên');
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
  }, [rsvps, eventTitle, data?.eventTitle, data?.creatorName, lastAction, effectiveUserId, isSenderMe, senderDisplayName, t]);

  // Chỉ có thẻ gốc (CREATED / REMINDER) mới hiển thị thẻ sự kiện.
  // Các thông báo hệ thống phụ (UPDATED, CANCELLED, DELETED) sẽ chỉ hiển thị dòng text thông báo duy nhất.
  const showCard =
    (data.action === 'CREATED' || data.action === 'REMINDER') &&
    (data as any)?.latestAction !== 'DELETED';

  if (!showCard) {
    return (
      <View style={styles.standaloneSystemMessageRow}>
        <Text style={[styles.systemMessageText, { color: colors.subtle || '#64748B' }]}>
          {systemMessageText}
        </Text>
        <Text style={[styles.systemMessageDots, { color: colors.subtle || '#64748B' }]}>…</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleOpenCalendar}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.systemMessageAction, { color: colors.primary || '#10B981' }]}>
            Xem
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      {/* 1. Dòng thông báo hệ thống nằm phía trên thẻ */}
      <View style={styles.systemMessageRow}>
        <Text style={[styles.systemMessageText, { color: effectiveColors.subtle || '#64748B' }]}>
          {systemMessageText}
        </Text>
        <Text style={[styles.systemMessageDots, { color: effectiveColors.subtle || '#64748B' }]}>…</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleOpenCalendar}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.systemMessageAction, { color: effectiveColors.primary || '#10B981' }]}>
            Xem
          </Text>
        </TouchableOpacity>
      </View>

      {/* Thẻ sự kiện - Cấu trúc chuẩn theo Live Wheel Embed */}
      <View
        style={[
          styles.cardContainer,
          {
            backgroundColor: isDark ? (effectiveColors.elevated || '#1E293B') : '#FFFFFF',
            borderColor: isCancelled
              ? (isDark ? '#451A1A' : '#FECACA')
              : (isDark ? `${effectiveColors.primary || '#10B981'}50` : '#A7F3D0'),
          },
        ]}
      >
        {/* Header Row */}
        <View style={[styles.headerRow, { borderBottomColor: effectiveColors.hairline || '#E2E8F0' }]}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isCancelled
                    ? (isDark ? '#451A1A' : '#FEE2E2')
                    : `${effectiveColors.primary || '#10B981'}20`,
                },
              ]}
            >
              <CalendarDays
                size={17}
                color={isCancelled ? '#EF4444' : (effectiveColors.primary || '#10B981')}
              />
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.headerTitle,
                { color: effectiveColors.text || '#0F172A' },
                isCancelled && styles.titleCancelled,
              ]}
            >
              {eventTitle}
            </Text>
          </View>

          {isCancelled ? (
            <View style={[styles.tagBadge, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.tagBadgeText, { color: '#DC2626' }]}>Đã hủy</Text>
            </View>
          ) : isEnded ? (
            <View style={[styles.tagBadge, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
              <Text style={[styles.tagBadgeText, { color: isDark ? '#94A3B8' : '#64748B' }]}>Đã kết thúc</Text>
            </View>
          ) : isHappeningNow ? (
            <View style={[styles.tagBadge, { backgroundColor: `${effectiveColors.primary || '#10B981'}20` }]}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 4 }} />
              <Text style={[styles.tagBadgeText, { color: effectiveColors.primary || '#10B981' }]}>Đang diễn ra</Text>
            </View>
          ) : (
            <View style={[styles.tagBadge, { backgroundColor: `${effectiveColors.primary || '#10B981'}15` }]}>
              <Text style={[styles.tagBadgeText, { color: effectiveColors.primary || '#10B981' }]}>Sắp tới</Text>
            </View>
          )}
        </View>

        {/* Creator Info */}
        <View style={styles.creatorRow}>
          {creatorAvatar ? (
            <Image source={{ uri: creatorAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: `${effectiveColors.primary || '#10B981'}25` }]}>
              <Text style={[styles.avatarFallbackText, { color: effectiveColors.primary || '#10B981' }]}>
                {creatorName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.creatorTextCol}>
            <Text numberOfLines={1} style={[styles.creatorText, { color: effectiveColors.text || '#0F172A' }]}>
              <Text style={styles.creatorNameBold}>{creatorName}</Text> đã tạo lịch hẹn cho nhóm
            </Text>
            <View style={styles.participantsRow}>
              <Users size={12} color={effectiveColors.primary || '#10B981'} />
              <Text style={[styles.participantsCountText, { color: effectiveColors.subtle || '#64748B' }]}>
                {yesUsers.length > 0 ? `${yesUsers.length} người tham gia` : 'Chưa có người tham gia'}
              </Text>
            </View>
          </View>
        </View>

        {/* Details Area: Time, Location, Recurrence, Notes */}
        <View style={styles.detailsArea}>
          {/* Time */}
          <View style={[styles.detailItemBox, { backgroundColor: effectiveColors.wash || '#F8FAFC', borderColor: effectiveColors.hairline || '#E2E8F0' }]}>
            <Clock size={13} color={effectiveColors.primary || '#10B981'} />
            <Text numberOfLines={1} style={[styles.detailItemText, { color: effectiveColors.text || '#0F172A' }]}>
              {isSameDay
                ? `${startTimeStr}${endTimeStr ? ` – ${endTimeStr}` : ''} • ${weekdayStr}, ${startDateStr}`
                : `${startTimeStr}, ${startDateStr} ➔ ${endTimeStr || ''}, ${endDateStr}`}
            </Text>
          </View>

          {/* Location if exists */}
          {Boolean(data?.location) && (
            <View style={[styles.detailItemBox, { backgroundColor: effectiveColors.wash || '#F8FAFC', borderColor: effectiveColors.hairline || '#E2E8F0' }]}>
              <MapPin size={13} color="#EF4444" />
              <Text numberOfLines={1} style={[styles.detailItemText, { color: effectiveColors.text || '#0F172A' }]}>
                {data?.location}
              </Text>
            </View>
          )}

          {/* Recurrence if exists */}
          {isRecurring && recurrenceSummaryText ? (
            <View style={[styles.detailItemBox, { backgroundColor: effectiveColors.wash || '#F8FAFC', borderColor: effectiveColors.hairline || '#E2E8F0' }]}>
              <Repeat size={13} color={effectiveColors.primary || '#10B981'} />
              <Text numberOfLines={1} style={[styles.detailItemText, { color: effectiveColors.text || '#0F172A' }]}>
                {recurrenceSummaryText}
              </Text>
            </View>
          ) : null}

          {/* Notes if exists */}
          {cleanDesc ? (
            <View style={[styles.detailItemBox, { backgroundColor: effectiveColors.wash || '#F8FAFC', borderColor: effectiveColors.hairline || '#E2E8F0', alignItems: 'flex-start' }]}>
              <FileText size={13} color="#64748B" style={{ marginTop: 1 }} />
              <Text numberOfLines={2} style={[styles.detailItemText, { color: effectiveColors.subtle || '#64748B', fontStyle: 'italic', flex: 1 }]}>
                {cleanDesc}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Participants Avatars Stack */}
        {yesUsers.length > 0 && (
          <View style={styles.avatarStackRow}>
            {yesUsers.slice(0, 5).map((p, idx) => (
              <View
                key={p.userId || idx}
                style={[
                  styles.stackedAvatar,
                  {
                    borderColor: isDark ? (effectiveColors.elevated || '#1E293B') : '#FFFFFF',
                    backgroundColor: `${effectiveColors.primary || '#10B981'}30`,
                  },
                ]}
              >
                {p.avatarUrl ? (
                  <Image source={{ uri: p.avatarUrl }} style={styles.stackedImg} />
                ) : (
                  <Text style={[styles.stackedFallbackText, { color: effectiveColors.primary || '#10B981' }]}>
                    {(p.displayName || 'U').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            ))}
            {yesUsers.length > 5 && (
              <Text style={[styles.moreCountText, { color: effectiveColors.subtle || '#64748B' }]}>
                +{yesUsers.length - 5}
              </Text>
            )}
          </View>
        )}

        {/* Quick 3 RSVP Options Buttons */}
        {!isCancelled && !isStarted && (
          <View style={styles.quickRsvpRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isLocked || isSubmitting}
              onPress={() => handleVoteOptionClick(EventRsvpStatus.YES)}
              style={[
                styles.quickRsvpBtn,
                {
                  backgroundColor: myRsvp === EventRsvpStatus.YES ? '#059669' : (effectiveColors.wash || '#F8FAFC'),
                  borderColor: myRsvp === EventRsvpStatus.YES ? '#059669' : (effectiveColors.hairline || '#E2E8F0'),
                },
              ]}
            >
              <Check size={11} color={myRsvp === EventRsvpStatus.YES ? '#FFFFFF' : '#059669'} />
              <Text style={[styles.quickRsvpBtnText, { color: myRsvp === EventRsvpStatus.YES ? '#FFFFFF' : (effectiveColors.text || '#0F172A') }]}>
                Tham gia ({rsvps?.yesCount || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isLocked || isSubmitting}
              onPress={() => handleVoteOptionClick(EventRsvpStatus.MAYBE)}
              style={[
                styles.quickRsvpBtn,
                {
                  backgroundColor: myRsvp === EventRsvpStatus.MAYBE ? '#D97706' : (effectiveColors.wash || '#F8FAFC'),
                  borderColor: myRsvp === EventRsvpStatus.MAYBE ? '#D97706' : (effectiveColors.hairline || '#E2E8F0'),
                },
              ]}
            >
              <HelpCircle size={11} color={myRsvp === EventRsvpStatus.MAYBE ? '#FFFFFF' : '#D97706'} />
              <Text style={[styles.quickRsvpBtnText, { color: myRsvp === EventRsvpStatus.MAYBE ? '#FFFFFF' : (effectiveColors.text || '#0F172A') }]}>
                Có thể ({rsvps?.maybeCount || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isLocked || isSubmitting}
              onPress={() => handleVoteOptionClick(EventRsvpStatus.NO)}
              style={[
                styles.quickRsvpBtn,
                {
                  backgroundColor: myRsvp === EventRsvpStatus.NO ? '#E11D48' : (effectiveColors.wash || '#F8FAFC'),
                  borderColor: myRsvp === EventRsvpStatus.NO ? '#E11D48' : (effectiveColors.hairline || '#E2E8F0'),
                },
              ]}
            >
              <X size={11} color={myRsvp === EventRsvpStatus.NO ? '#FFFFFF' : '#E11D48'} />
              <Text style={[styles.quickRsvpBtnText, { color: myRsvp === EventRsvpStatus.NO ? '#FFFFFF' : (effectiveColors.text || '#0F172A') }]}>
                Từ chối ({rsvps?.noCount || 0})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Button: Xem chi tiết lịch hẹn */}
        {isCancelled ? (
          <View
            style={[
              styles.joinBtn,
              { backgroundColor: isDark ? '#334155' : '#F1F5F9', borderWidth: 1, borderColor: effectiveColors.hairline || '#E2E8F0' },
            ]}
          >
            <Text style={[styles.joinBtnText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Lịch hẹn đã bị hủy
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenCalendar}
            style={[styles.joinBtn, { backgroundColor: effectiveColors.primary || '#10B981' }]}
          >
            <CalendarDays size={15} color="#FFFFFF" />
            <Text style={styles.joinBtnText}>Xem chi tiết lịch hẹn</Text>
            <ArrowRight size={14} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Inline Activity Logs for RSVP changes */}
      {rsvpLogs.length > 0 && (
        <View style={styles.activityLogsContainer}>
          {(isExpandedLogs ? rsvpLogs : [rsvpLogs[rsvpLogs.length - 1]]).map((log) => (
            <View key={log.id} style={styles.singleLogItem}>
              <View style={[styles.logDot, { backgroundColor: colors.primary || '#10B981' }]} />
              <Text style={[styles.logText, { color: colors.subtle || '#64748B' }]}>
                {log.text}
              </Text>
            </View>
          ))}

          {rsvpLogs.length > 1 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setIsExpandedLogs(!isExpandedLogs);
              }}
              style={[
                styles.viewMoreBtn,
                {
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  borderColor: 'rgba(16, 185, 129, 0.2)',
                },
              ]}
            >
              <Text style={[styles.viewMoreText, { color: colors.primary || '#10B981' }]}>
                {isExpandedLogs
                  ? (t.common.collapse || 'Thu gọn')
                  : (t.common.viewMoreCount?.replace('{count}', String(rsvpLogs.length)) || `Xem thêm (${rsvpLogs.length})`)}
              </Text>
              {isExpandedLogs ? (
                <ChevronUp size={11} color={colors.primary || '#10B981'} />
              ) : (
                <ChevronDown size={11} color={colors.primary || '#10B981'} />
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 5. Scope Confirmation Modal for Recurring Events ("KHI BÌNH CHỌN THÌ CÓ XÁC NHẬN CHỌN CHO LẦN NÀO") */}
      <Modal
        visible={showScopeModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowScopeModal(false);
          setPendingVoteStatus(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalDialog,
              {
                backgroundColor: colors.surface || '#FFFFFF',
                borderColor: colors.hairline || '#E2E8F0',
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text || '#0F172A' }]}>
                Bạn muốn áp dụng thay đổi như thế nào ?
              </Text>
            </View>

            <View style={styles.modalOptionsCol}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.modalOptionBtn,
                  {
                    backgroundColor: colors.wash || '#F8FAFC',
                    borderColor: colors.hairline || '#E2E8F0',
                  },
                ]}
                onPress={() => handleApplyVoteScope('this')}
              >
                <Text style={[styles.modalOptionTitle, { color: colors.text || '#0F172A' }]}>
                  Chỉ lần này
                </Text>
                <Text style={[styles.modalOptionDesc, { color: colors.subtle || '#64748B' }]}>
                  Chỉ áp dụng phản hồi cho riêng lần diễn ra này ({startDateStr}).
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.modalOptionBtn,
                  {
                    backgroundColor: colors.wash || '#F8FAFC',
                    borderColor: colors.hairline || '#E2E8F0',
                  },
                ]}
                onPress={() => handleApplyVoteScope('future')}
              >
                <Text style={[styles.modalOptionTitle, { color: colors.text || '#0F172A' }]}>
                  Lần này và các lần tiếp theo
                </Text>
                <Text style={[styles.modalOptionDesc, { color: colors.subtle || '#64748B' }]}>
                  Áp dụng phản hồi từ ngày {startDateStr} trở đi.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.modalOptionBtn,
                  {
                    backgroundColor: colors.wash || '#F8FAFC',
                    borderColor: colors.hairline || '#E2E8F0',
                  },
                ]}
                onPress={() => handleApplyVoteScope('all')}
              >
                <Text style={[styles.modalOptionTitle, { color: colors.text || '#0F172A' }]}>
                  Tất cả các lần
                </Text>
                <Text style={[styles.modalOptionDesc, { color: colors.subtle || '#64748B' }]}>
                  Áp dụng cho toàn bộ các lần trong chuỗi lặp lại.
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setShowScopeModal(false);
                  setPendingVoteStatus(null);
                }}
                style={styles.modalCancelBtn}
              >
                <Text style={[styles.modalCancelText, { color: colors.subtle || '#64748B' }]}>
                  Hủy
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
  },
  standaloneSystemMessageRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  systemMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  systemMessageText: {
    fontSize: 12,
    fontWeight: '500',
  },
  systemMessageDots: {
    fontSize: 12,
    opacity: 0.6,
  },
  systemMessageAction: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  tagBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  creatorTextCol: {
    flex: 1,
  },
  creatorText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  creatorNameBold: {
    fontWeight: '800',
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  participantsCountText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  detailsArea: {
    gap: 6,
    paddingBottom: 10,
  },
  detailItemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailItemText: {
    fontSize: 11.5,
    fontWeight: '600',
    flexShrink: 1,
  },
  avatarStackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
  },
  stackedAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: -6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stackedImg: {
    width: '100%',
    height: '100%',
  },
  stackedFallbackText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  moreCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  quickRsvpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 10,
  },
  quickRsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickRsvpBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleCancelled: {
    textDecorationLine: 'line-through',
    color: '#EF4444',
    opacity: 0.8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalHeader: {
    gap: 4,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  modalOptionsCol: {
    gap: 8,
  },
  modalOptionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  modalOptionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  modalOptionDesc: {
    fontSize: 11,
  },
  modalFooter: {
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  modalCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalCancelText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  activityLogsContainer: {
    marginTop: 6,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  singleLogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 1,
    maxWidth: '100%',
  },
  logDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.8,
  },
  logText: {
    fontSize: 10.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 3,
  },
  viewMoreText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
