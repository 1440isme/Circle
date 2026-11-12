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
  Calendar,
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
        });

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
      activeBorder: '#16A34A',
      iconColor: '#15803D',
      textColor: '#15803D',
    },
    {
      status: EventRsvpStatus.MAYBE,
      label: 'Chưa chắc',
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
      label: 'Bận',
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

  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.cardContainer,
          {
            backgroundColor: colors.surface || '#FFFFFF',
            borderColor: colors.hairline || '#E2E8F0',
          },
        ]}
      >
        {/* 1. Log Tin nhắn: Người tạo/chia sẻ + Thời gian gửi */}
        <View
          style={[
            styles.logHeaderRow,
            {
              backgroundColor: colors.wash || '#F8FAFC',
              borderBottomColor: colors.hairline || '#E2E8F0',
            },
          ]}
        >
          <View style={styles.logSenderInfo}>
            {senderAvatarUrl ? (
              <Image source={{ uri: senderAvatarUrl }} style={styles.logAvatarImg} />
            ) : (
              <View style={[styles.logAvatarFallback, { backgroundColor: '#CCFBF1' }]}>
                <Text style={styles.logAvatarInitial}>
                  {(senderDisplayName || data.creatorName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text numberOfLines={1} style={[styles.logSenderName, { color: colors.text || '#0F172A' }]}>
              {senderDisplayName || data.creatorName || 'Thành viên'}
            </Text>
            <Text style={[styles.logActionText, { color: colors.subtle || '#64748B' }]}>
              đã tạo lịch hẹn
            </Text>
          </View>
          {sentTimeStr && (
            <Text style={[styles.logTimeText, { color: colors.subtle || '#64748B' }]}>
              {sentTimeStr}
            </Text>
          )}
        </View>

        {/* 2. Tiêu đề sự kiện & Nút Xem trên Lịch (BỎ text "LỊCH HẸN NHÓM") */}
        <View style={styles.titleActionRow}>
          <View style={styles.titleLeftCol}>
            <View style={[styles.iconBadge, { backgroundColor: '#CCFBF1' }]}>
              <Calendar size={18} color="#0D9488" />
            </View>
            <View style={styles.titleTextCol}>
              <Text
                numberOfLines={2}
                style={[
                  styles.eventTitleText,
                  { color: colors.text || '#0F172A' },
                  isCancelled && styles.titleCancelled,
                ]}
              >
                {eventTitle}
              </Text>
            </View>
            {isCancelled && (
              <View style={styles.cancelledBadge}>
                <Text style={styles.cancelledBadgeText}>Đã hủy</Text>
              </View>
            )}
          </View>

          {(onOpenCalendar || onViewOnCalendar) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenCalendar}
              style={[
                styles.viewCalendarBtn,
                {
                  backgroundColor: colors.wash || '#F1F5F9',
                  borderColor: colors.hairline || '#E2E8F0',
                },
              ]}
            >
              <CalendarDays size={13} color="#0D9488" />
              <Text style={styles.viewCalendarBtnText}>Xem lịch</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 3. Event Details: Time Capsule Box, Địa điểm, Lặp lại, Nhắc hẹn, Ghi chú */}
        <View style={styles.detailsContainer}>
          {/* Time Capsule Box (Dạng text thuần túy: bao quát cả 1 ngày lẫn nhiều ngày) */}
          <View
            style={[
              styles.timeCapsuleBox,
              {
                backgroundColor: colors.wash || '#F8FAFC',
                borderColor: colors.hairline || '#E2E8F0',
              },
            ]}
          >
            <Clock size={15} color="#0D9488" />
            {isSameDay ? (
              <Text style={[styles.timeCapsuleText, { color: colors.text || '#0F172A' }]}>
                {startTimeStr}
                {endTimeStr ? ` – ${endTimeStr}` : ''} • {weekdayStr}, {startDateStr}
              </Text>
            ) : (
              <View style={styles.multiDayRow}>
                <Text style={[styles.timeCapsuleText, { color: colors.text || '#0F172A' }]}>
                  {startTimeStr}, {startDateStr}
                </Text>
                <Text style={styles.multiDayArrow}>➔</Text>
                <Text style={[styles.timeCapsuleText, { color: colors.text || '#0F172A' }]}>
                  {endTimeStr || ''}, {endDateStr}
                </Text>
                <View style={styles.durationPill}>
                  <Text style={styles.durationPillText}>{durationDays} ngày</Text>
                </View>
              </View>
            )}
          </View>

          {/* Location row */}
          {Boolean(data.location) && (
            <View style={styles.detailRow}>
              <MapPin size={14} color="#0D9488" />
              <Text
                numberOfLines={2}
                style={[styles.detailText, { color: colors.subtle || '#475569' }]}
              >
                {data.location}
              </Text>
            </View>
          )}

          {/* Recurrence summary row */}
          {isRecurring && recurrenceSummaryText && (
            <View style={styles.detailRow}>
              <Repeat size={14} color="#0D9488" />
              <Text
                numberOfLines={1}
                style={[styles.recurrenceText, { color: colors.text || '#0F172A' }]}
              >
                {recurrenceSummaryText}
              </Text>
            </View>
          )}

          {/* Reminder badge */}
          {reminderStr && (
            <View style={styles.reminderRow}>
              <View style={styles.reminderBadge}>
                <Bell size={11} color="#D97706" />
                <Text style={styles.reminderBadgeText}>{reminderStr}</Text>
              </View>
            </View>
          )}

          {/* Clean description quote */}
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
              <Text
                style={[styles.quoteText, { color: colors.subtle || '#64748B' }]}
                numberOfLines={4}
              >
                "{cleanDesc}"
              </Text>
            </View>
          ) : null}
        </View>

        {/* 4. RSVP Section: 3 Poll Progress Bars with Respondent Avatars */}
        <View
          style={[
            styles.pollSection,
            {
              backgroundColor: colors.wash || '#F8FAFC',
              borderTopColor: colors.hairline || '#E2E8F0',
            },
          ]}
        >
          {/* Poll Header */}
          <View style={styles.pollHeaderRow}>
            <View style={styles.pollHeaderLeft}>
              {isCancelled ? (
                <>
                  <Lock size={13} color="#DC2626" />
                  <Text style={[styles.pollStatusText, { color: '#DC2626' }]}>
                    Sự kiện đã bị hủy
                  </Text>
                </>
              ) : isStarted ? (
                <>
                  <Lock size={13} color="#64748B" />
                  <Text style={[styles.pollStatusText, { color: '#64748B' }]}>
                    Đã khóa bình chọn
                  </Text>
                </>
              ) : (
                <>
                  <Users size={13} color="#0D9488" />
                  <Text style={[styles.pollStatusText, { color: colors.text || '#0F172A' }]}>
                    Phản hồi tham gia
                  </Text>
                </>
              )}
            </View>
            <Text style={[styles.pollCountText, { color: colors.subtle || '#64748B' }]}>
              {totalVotes} phản hồi
            </Text>
          </View>

          {/* Poll Options Progress Bars */}
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
  logHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logSenderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  logAvatarImg: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  logAvatarFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logAvatarInitial: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
  },
  logSenderName: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 110,
  },
  logActionText: {
    fontSize: 11,
    opacity: 0.85,
  },
  logTimeText: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    marginLeft: 6,
  },
  titleActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
  },
  titleLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextCol: {
    flex: 1,
    minWidth: 0,
  },
  eventTitleText: {
    fontSize: 14.5,
    fontWeight: '700',
    lineHeight: 19,
  },
  titleCancelled: {
    textDecorationLine: 'line-through',
    color: '#DC2626',
    opacity: 0.7,
  },
  cancelledBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelledBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  viewCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  viewCalendarBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0D9488',
  },
  detailsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  timeCapsuleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeCapsuleText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  multiDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  multiDayArrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  durationPill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    backgroundColor: '#CCFBF1',
  },
  durationPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
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
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  quoteBox: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  quoteText: {
    fontSize: 11.5,
    fontStyle: 'italic',
    lineHeight: 16,
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
    backgroundColor: '#0D9488',
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
