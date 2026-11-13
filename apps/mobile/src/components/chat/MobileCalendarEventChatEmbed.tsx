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
} from 'lucide-react-native';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../stores/auth.store';
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
  const authUserId = useAuthStore((s) => s.user?.id);
  const effectiveUserId = currentUserId || authUserId;

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
  const isLocked = isStarted || isCancelled;

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

  // "và chỉ cần thẻ sự kiện khi tạo hoặc nhắc thui" (chỉ có tạo với nhắc lại mới hiện thẻ banner mà)
  // Chỉ có Tạo mới (CREATED) và Nhắc hẹn (REMINDER) mới hiển thị thẻ banner đầy đủ.
  // Khi Sửa (UPDATED), Hủy (CANCELLED), hoặc xóa: KHÔNG BAO GIỜ hiện thẻ banner, chỉ hiện dòng thông báo hệ thống dạng text.
  const effectiveAction = data.latestAction || data.action;
  const showCard =
    (effectiveAction === 'CREATED' || effectiveAction === 'REMINDER') &&
    data.action !== 'UPDATED' &&
    data.latestAction !== 'UPDATED' &&
    data.action !== 'CANCELLED' &&
    data.latestAction !== 'CANCELLED' &&
    !data.isCancelled;

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
      {/* 1. Dòng thông báo hệ thống nằm phía trên thẻ (System Message) */}
      <View style={styles.systemMessageRow}>
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

      {/* Thẻ sự kiện */}
      <View
        style={[
          styles.cardContainer,
          {
            backgroundColor: colors.surface || '#FFFFFF',
            borderColor: colors.hairline || '#E2E8F0',
          },
        ]}
      >
        {/* 2. Ảnh bìa (Màu chủ đạo Emerald Brand) & Tên sự kiện */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerHeaderRow}>
            {(onOpenCalendar || onViewOnCalendar) && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleOpenCalendar}
                style={styles.bannerViewCalendarBtn}
              >
                <CalendarDays size={13} color="#FFFFFF" />
                <Text style={styles.bannerViewCalendarBtnText}>Xem lịch</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bannerTitleCol}>
            <Text
              numberOfLines={2}
              style={[
                styles.bannerEventTitle,
                isCancelled && styles.titleCancelled,
              ]}
            >
              {eventTitle}
            </Text>
            {isCancelled && (
              <View style={styles.cancelledBadge}>
                <Text style={styles.cancelledBadgeText}>Sự kiện đã bị hủy</Text>
              </View>
            )}
          </View>
        </View>

        {/* 3. Event Details: Thời gian, Địa điểm, Lặp lại, Nhắc hẹn, Ghi chú (Chỉ giữ lại icon) */}
        <View style={styles.detailsContainer}>
          {/* Thời gian bắt đầu – kết thúc (icon Clock + text) */}
          <View style={styles.detailRow}>
            <Clock size={15} color="#10B981" />
            {isSameDay ? (
              <Text style={[styles.detailTimeText, { color: colors.text || '#0F172A' }]}>
                {startTimeStr}{endTimeStr ? ` – ${endTimeStr}` : ''} • {weekdayStr}, {startDateStr}
              </Text>
            ) : (
              <View style={styles.multiDayRow}>
                <Text style={[styles.detailTimeText, { color: colors.text || '#0F172A' }]}>
                  {startTimeStr}, {startDateStr}
                </Text>
                <Text style={styles.multiDayArrow}>➔</Text>
                <Text style={[styles.detailTimeText, { color: colors.text || '#0F172A' }]}>
                  {endTimeStr || ''}, {endDateStr}
                </Text>
                <View style={styles.durationPill}>
                  <Text style={styles.durationPillText}>{durationDays} ngày</Text>
                </View>
              </View>
            )}
          </View>

          {/* Địa điểm (icon MapPin) */}
          {Boolean(data.location) && (
            <View style={styles.detailRow}>
              <MapPin size={15} color="#F43F5E" />
              <Text
                numberOfLines={2}
                style={[styles.detailText, { color: colors.text || '#0F172A' }]}
              >
                {data.location}
              </Text>
            </View>
          )}

          {/* Lặp lại (icon Repeat) */}
          {isRecurring && recurrenceSummaryText && (
            <View style={styles.detailRow}>
              <Repeat size={15} color="#10B981" />
              <Text
                numberOfLines={1}
                style={[styles.recurrenceText, { color: colors.text || '#0F172A' }]}
              >
                {recurrenceSummaryText}
              </Text>
            </View>
          )}

          {/* Nhắc hẹn nếu có (icon Bell) */}
          {reminderStr && (
            <View style={styles.detailRow}>
              <Bell size={15} color="#D97706" />
              <Text style={styles.reminderBadgeText}>{reminderStr}</Text>
            </View>
          )}

          {/* Ghi chú được tách thành vùng riêng (icon FileText) */}
          {cleanDesc ? (
            <View
              style={[
                styles.quoteBox,
                {
                  backgroundColor: colors.wash || '#F8FAFC',
                  borderColor: colors.hairline || '#E2E8F0',
                },
              ]}
            >
              <FileText size={14} color="#64748B" style={{ marginTop: 2 }} />
              <Text
                style={[styles.quoteText, { color: colors.text || '#0F172A' }]}
                numberOfLines={4}
              >
                {cleanDesc}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 4. RSVP Section: Số thành viên xác nhận & 3 nút phản hồi */}
        <View
          style={[
            styles.pollSection,
            {
              backgroundColor: colors.wash || '#F8FAFC',
              borderTopColor: colors.hairline || '#E2E8F0',
            },
          ]}
        >
          {/* Header: Số thành viên xác nhận & Avatars */}
          <View style={styles.pollHeaderRow}>
            <View style={styles.pollHeaderLeft}>
              <Users size={14} color="#10B981" />
              <Text style={[styles.pollStatusText, { color: colors.text || '#0F172A' }]}>
                {yesUsers.length} thành viên xác nhận
              </Text>
            </View>
            {yesUsers.length > 0 && (
              <View style={styles.respondentsWrap}>
                {yesUsers.slice(0, 4).map((u, idx) => (
                  <View
                    key={u.userId || idx}
                    style={[
                      styles.respAvatarWrap,
                      { marginLeft: idx === 0 ? 0 : -8 },
                    ]}
                  >
                    {u.avatarUrl ? (
                      <Image source={{ uri: u.avatarUrl }} style={styles.respAvatarImg} />
                    ) : (
                      <View style={[styles.respAvatarFallback, { backgroundColor: '#10B981' }]}>
                        <Text style={styles.respAvatarInitial}>
                          {(u.displayName || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
                {yesUsers.length > 4 && (
                  <View style={[styles.respAvatarWrap, styles.respAvatarMore]}>
                    <Text style={styles.respAvatarMoreText}>
                      +{yesUsers.length - 4}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* 3 nút/thanh phản hồi: Tham gia, Có thể, Từ chối */}
          <View style={styles.pollOptionsCol}>
            {pollOptions.map((opt) => {
              const isSelected = myRsvp === opt.status;
              return (
                <TouchableOpacity
                  key={opt.status}
                  activeOpacity={0.8}
                  disabled={isLocked || isSubmitting}
                  onPress={() => handleVoteOptionClick(opt.status)}
                  style={[
                    styles.pollBarContainer,
                    {
                      borderColor: isSelected
                        ? opt.activeBorder
                        : colors.hairline || '#E2E8F0',
                      backgroundColor: colors.surface || '#FFFFFF',
                    },
                    isSelected && styles.pollBarActive,
                  ]}
                >
                  {/* Progress Fill Layer */}
                  <View
                    style={[
                      styles.pollProgressFill,
                      {
                        width: `${Math.max(0, Math.min(100, opt.percent))}%`,
                        backgroundColor: isSelected ? opt.activeBarColor : opt.barColor,
                      },
                    ]}
                  />

                  {/* Content Row: Check radio + Icon + Label + Respondent Avatars */}
                  <View style={styles.pollBarContent}>
                    <View style={styles.pollBarLeft}>
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && {
                            backgroundColor: opt.activeBorder,
                            borderColor: opt.activeBorder,
                          },
                        ]}
                      >
                        {isSelected && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                      <opt.icon size={14} color={opt.iconColor} />
                      <Text
                        style={[
                          styles.pollOptionLabel,
                          { color: colors.text || '#0F172A' },
                          isSelected && { fontWeight: '700' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </View>

                    {/* Circular Avatar Stack of Respondents */}
                    <View style={styles.respondentsWrap}>
                      {opt.users.slice(0, 4).map((u, idx) => (
                        <View
                          key={u.userId || idx}
                          style={[
                            styles.respAvatarWrap,
                            { marginLeft: idx === 0 ? 0 : -8 },
                          ]}
                        >
                          {u.avatarUrl ? (
                            <Image source={{ uri: u.avatarUrl }} style={styles.respAvatarImg} />
                          ) : (
                            <View style={styles.respAvatarFallback}>
                              <Text style={styles.respAvatarInitial}>
                                {(u.displayName || 'U').charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                      ))}
                      {opt.users.length > 4 && (
                        <View style={[styles.respAvatarWrap, styles.respAvatarMore]}>
                          <Text style={styles.respAvatarMoreText}>
                            +{opt.users.length - 4}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

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
    maxWidth: 340,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerContainer: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bannerViewCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  bannerViewCalendarBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bannerTitleCol: {
    marginTop: 2,
    gap: 4,
  },
  bannerEventTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  titleCancelled: {
    textDecorationLine: 'line-through',
    color: '#FECACA',
    opacity: 0.8,
  },
  cancelledBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
    borderWidth: 1,
    borderColor: '#F87171',
    marginTop: 2,
  },
  cancelledBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailsContainer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailTimeText: {
    fontSize: 12.5,
    fontWeight: '600',
    flexShrink: 1,
  },
  multiDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    flex: 1,
  },
  multiDayArrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  durationPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: '#D1FAE5',
  },
  durationPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  detailText: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  recurrenceText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reminderBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#D97706',
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  quoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
    flex: 1,
  },
  pollSection: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  pollHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pollHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pollStatusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  pollCountText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  pollOptionsCol: {
    gap: 6,
  },
  pollBarContainer: {
    position: 'relative',
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  pollBarActive: {
    borderWidth: 1.5,
  },
  pollProgressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 10,
  },
  pollBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    zIndex: 1,
  },
  pollBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pollOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  respondentsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
  },
  respAvatarWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  respAvatarImg: {
    width: '100%',
    height: '100%',
  },
  respAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  respAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  respAvatarMore: {
    backgroundColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  respAvatarMoreText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
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
});
