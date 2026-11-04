'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Minus,
  Clock,
  MapPin,
  Trash2,
  Pencil,
  Ban,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  Loader2,
  CalendarDays,
  Check,
  HelpCircle,
  AlertCircle,
  Repeat,
  Share2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import { EventLocationDisplay } from './EventLocationDisplay';
import { LocationSearchInput } from './LocationSearchInput';
import { CustomDateTimePicker } from './CustomDateTimePicker';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleStore } from '../../stores/circle.store';
import {
  useCalendarEventsQuery,
  useCreateCalendarEventMutation,
  useCancelCalendarEventMutation,
  useDeleteCalendarEventMutation,
  useUpdateCalendarEventMutation,
  useRespondEventRsvpMutation,
  useUpcomingCalendarEventsQuery,
  useShareCalendarEventToChatMutation,
  TOOLS_KEYS,
} from '../../hooks/use-circle-tools';
import { CalendarEventEntity, EventRsvpStatus } from '@circle/types';

// ==========================================
// RECURRENCE TYPES & HELPERS (PARITY WITH MOBILE)
// ==========================================
export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type NthWeekdayOrder = 'first' | 'second' | 'third' | 'fourth' | 'last';
export type MonthlyType = 'day_of_month' | 'nth_weekday';
export type YearlyType = 'specific_date' | 'nth_weekday';
export type RecurrenceEndType = 'never' | 'on_date';

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval: number; // Mỗi N ngày/tuần/tháng/năm (>= 1)
  weeklyDays: number[]; // 1 = T2, ..., 7 = CN
  monthlyType: MonthlyType;
  monthlyDay: number; // 1 - 31
  monthlyNthOrder: NthWeekdayOrder;
  monthlyNthWeekday: number; // 1 = T2 ... 7 = CN
  yearlyType: YearlyType;
  yearlyDay: number; // 1 - 31
  yearlyMonth: number; // 1 - 12
  yearlyNthOrder: NthWeekdayOrder;
  yearlyNthWeekday: number; // 1 = T2 ... 7 = CN
  yearlyNthMonth: number; // 1 - 12
  endType: RecurrenceEndType;
  endDate: Date | null;
  isCustom?: boolean;
  excludedDates?: string[]; // Danh sách 'YYYY-MM-DD' các lần diễn ra đã bị xóa riêng
  cancelledDates?: string[]; // Danh sách 'YYYY-MM-DD' các lần diễn ra đã bị hủy riêng
}

export const WEEKDAY_INFO: Record<number, { full: string; short: string }> = {
  1: { full: 'Thứ Hai', short: 'T2' },
  2: { full: 'Thứ Ba', short: 'T3' },
  3: { full: 'Thứ Tư', short: 'T4' },
  4: { full: 'Thứ Năm', short: 'T5' },
  5: { full: 'Thứ Sáu', short: 'T6' },
  6: { full: 'Thứ Bảy', short: 'T7' },
  7: { full: 'Chủ Nhật', short: 'CN' },
};

export const NTH_ORDER_INFO: Record<NthWeekdayOrder, string> = {
  first: 'đầu tiên',
  second: 'thứ hai',
  third: 'thứ ba',
  fourth: 'thứ tư',
  last: 'cuối cùng',
};

const pad2 = (n: number) => String(n).padStart(2, '0');

export const formatDateKey = (d: Date): string => {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const getWeekdayNumber = (d: Date): number => {
  const day = d.getDay();
  return day === 0 ? 7 : day;
};

const getDefaultWeeklyDays = (start: Date, end: Date): number[] => {
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diffDays = Math.round((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return [getWeekdayNumber(start)];
  }

  if (diffDays >= 6) {
    return [1, 2, 3, 4, 5, 6, 7];
  }

  const result: number[] = [];
  const current = new Date(startDay);
  for (let i = 0; i <= diffDays; i++) {
    const wk = getWeekdayNumber(current);
    if (!result.includes(wk)) {
      result.push(wk);
    }
    current.setDate(current.getDate() + 1);
  }
  return result.sort((a, b) => a - b);
};

const getNthOrderFromDate = (d: Date): NthWeekdayOrder => {
  const day = d.getDate();
  if (day <= 7) return 'first';
  if (day <= 14) return 'second';
  if (day <= 21) return 'third';
  if (day <= 28) return 'fourth';
  return 'last';
};

export const formatRecurrenceSummary = (config: RecurrenceConfig): string => {
  if (config.frequency === 'none') {
    return 'Không lặp lại';
  }

  let text = '';
  const { interval } = config;

  if (config.frequency === 'daily') {
    text = interval === 1 ? 'Hằng ngày' : `Mỗi ${interval} ngày`;
  } else if (config.frequency === 'weekly') {
    const days = Array.isArray(config.weeklyDays) ? [...config.weeklyDays] : [];
    const daysStr = days
      .sort((a, b) => a - b)
      .map((d) => WEEKDAY_INFO[d]?.short || `T${d}`)
      .join(', ');
    if (interval === 1) {
      text = daysStr ? `Hằng tuần vào ${daysStr}` : 'Hằng tuần';
    } else {
      text = daysStr ? `Mỗi ${interval} tuần vào ${daysStr}` : `Mỗi ${interval} tuần`;
    }
  } else if (config.frequency === 'monthly') {
    if (config.monthlyType === 'day_of_month') {
      text = interval === 1
        ? `Hằng tháng vào ngày ${config.monthlyDay}`
        : `Mỗi ${interval} tháng vào ngày ${config.monthlyDay}`;
    } else {
      const orderName = NTH_ORDER_INFO[config.monthlyNthOrder] || '';
      const dayName = WEEKDAY_INFO[config.monthlyNthWeekday]?.full || '';
      text = interval === 1
        ? `Hằng tháng vào ${dayName} ${orderName}`
        : `Mỗi ${interval} tháng vào ${dayName} ${orderName}`;
    }
  } else if (config.frequency === 'yearly') {
    if (config.yearlyType === 'specific_date') {
      text = interval === 1
        ? `Hằng năm vào ngày ${config.yearlyDay}/${config.yearlyMonth}`
        : `Mỗi ${interval} năm vào ngày ${config.yearlyDay}/${config.yearlyMonth}`;
    } else {
      const orderName = NTH_ORDER_INFO[config.yearlyNthOrder] || '';
      const dayName = WEEKDAY_INFO[config.yearlyNthWeekday]?.full || '';
      text = interval === 1
        ? `Hằng năm vào ${dayName} ${orderName} của Tháng ${config.yearlyNthMonth}`
        : `Mỗi ${interval} năm vào ${dayName} ${orderName} của Tháng ${config.yearlyNthMonth}`;
    }
  }

  return text;
};

export const createDefaultRecurrenceConfig = (
  baseDate: Date,
  endDate?: Date,
): RecurrenceConfig => {
  const dayNum = baseDate.getDate();
  const monthNum = baseDate.getMonth() + 1;
  const weekday = getWeekdayNumber(baseDate);
  const nthOrder = getNthOrderFromDate(baseDate);

  const initialWeeklyDays = endDate
    ? getDefaultWeeklyDays(baseDate, endDate)
    : [weekday];

  return {
    frequency: 'none',
    interval: 1,
    weeklyDays: initialWeeklyDays,
    monthlyType: 'day_of_month',
    monthlyDay: dayNum,
    monthlyNthOrder: nthOrder,
    monthlyNthWeekday: weekday,
    yearlyType: 'specific_date',
    yearlyDay: dayNum,
    yearlyMonth: monthNum,
    yearlyNthOrder: nthOrder,
    yearlyNthWeekday: weekday,
    yearlyNthMonth: monthNum,
    endType: 'never',
    endDate: null,
    excludedDates: [],
    cancelledDates: [],
  };
};

export const formatDateOnly = (d: Date) => {
  const day = pad2(d.getDate());
  const month = pad2(d.getMonth() + 1);
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const serializeRecurrence = (config: RecurrenceConfig, baseDesc?: string): string => {
  const repeatSummary = formatRecurrenceSummary(config);
  const serialized = JSON.stringify({
    frequency: config.frequency,
    interval: config.interval,
    weeklyDays: config.weeklyDays,
    monthlyType: config.monthlyType,
    monthlyDay: config.monthlyDay,
    monthlyNthOrder: config.monthlyNthOrder,
    monthlyNthWeekday: config.monthlyNthWeekday,
    yearlyType: config.yearlyType,
    yearlyMonth: config.yearlyMonth,
    yearlyDay: config.yearlyDay,
    yearlyNthOrder: config.yearlyNthOrder,
    yearlyNthWeekday: config.yearlyNthWeekday,
    endType: config.endType,
    endDate: config.endDate ? (config.endDate instanceof Date ? config.endDate.toISOString() : config.endDate) : null,
    isCustom: Boolean(config.isCustom),
    excludedDates: config.excludedDates || [],
    cancelledDates: config.cancelledDates || [],
  });
  const recurrenceTag = `[RECURRENCE:${serialized}]`;
  const userRepeatText = `[Lặp lại: ${repeatSummary}]`;
  const clean = (baseDesc || '')
    .replace(/\[RECURRENCE:[\s\S]*?\]/g, '')
    .replace(/\[Lặp lại:[^\]]*?\]/g, '')
    .trim();
  return clean ? `${clean}\n${userRepeatText}\n${recurrenceTag}` : `${userRepeatText}\n${recurrenceTag}`;
};

export const parseEventRecurrence = (desc?: string | null): {
  cleanDesc: string;
  recurrenceConfig: RecurrenceConfig | null;
} => {
  if (!desc) {
    return { cleanDesc: '', recurrenceConfig: null };
  }

  let cleanDesc = desc;
  let recurrenceConfig: RecurrenceConfig | null = null;

  const recurrenceMatch = desc.match(/\[RECURRENCE:([\s\S]*?)\]/);
  if (recurrenceMatch && recurrenceMatch[1]) {
    try {
      const raw = JSON.parse(recurrenceMatch[1]);
      const config: RecurrenceConfig = {
        frequency: raw.frequency || 'none',
        interval: Number(raw.interval) || 1,
        weeklyDays: Array.isArray(raw.weeklyDays) ? raw.weeklyDays : [],
        monthlyType: raw.monthlyType || 'day_of_month',
        monthlyDay: Number(raw.monthlyDay) || 1,
        monthlyNthOrder: raw.monthlyNthOrder || 'first',
        monthlyNthWeekday: Number(raw.monthlyNthWeekday) || 1,
        yearlyType: raw.yearlyType || 'specific_date',
        yearlyDay: Number(raw.yearlyDay) || 1,
        yearlyMonth: Number(raw.yearlyMonth) || 1,
        yearlyNthOrder: raw.yearlyNthOrder || 'first',
        yearlyNthWeekday: Number(raw.yearlyNthWeekday) || 1,
        yearlyNthMonth: Number(raw.yearlyNthMonth) || 1,
        endType: raw.endType || 'never',
        endDate: raw.endDate ? new Date(raw.endDate) : null,
        isCustom: Boolean(raw.isCustom),
        excludedDates: Array.isArray(raw.excludedDates) ? raw.excludedDates : [],
        cancelledDates: Array.isArray(raw.cancelledDates) ? raw.cancelledDates : [],
      };
      return {
        cleanDesc: cleanDesc.replace(/\[RECURRENCE:[\s\S]*?\]/g, '').replace(/\[Lặp lại:[^\]]*?\]/g, '').trim(),
        recurrenceConfig: config,
      };
    } catch {
      // Fallback
    }
  }

  if (desc.includes('[Lặp lại:')) {
    cleanDesc = cleanDesc.replace(/\[Lặp lại:[^\]]*?\]/g, '').trim();
  }

  return { cleanDesc, recurrenceConfig };
};

export const isEventOccurringOnDate = (ev: CalendarEventEntity, targetDate: Date): boolean => {
  const evStart = new Date(ev.startTime);
  const evEnd = ev.endTime ? new Date(ev.endTime) : evStart;

  const targetY = targetDate.getFullYear();
  const targetM = targetDate.getMonth();
  const targetD = targetDate.getDate();

  const dayStartTime = new Date(targetY, targetM, targetD, 0, 0, 0, 0).getTime();
  const dayEndTime = new Date(targetY, targetM, targetD, 23, 59, 59, 999).getTime();

  const { recurrenceConfig } = parseEventRecurrence(ev.description);

  if (!recurrenceConfig || recurrenceConfig.frequency === 'none') {
    const startMs = evStart.getTime();
    const endMs = evEnd.getTime();
    return startMs <= dayEndTime && endMs >= dayStartTime;
  }

  const targetDateKey = `${targetY}-${pad2(targetM + 1)}-${pad2(targetD)}`;
  if (recurrenceConfig.excludedDates && recurrenceConfig.excludedDates.includes(targetDateKey)) {
    return false;
  }

  if (recurrenceConfig.endType === 'on_date' && recurrenceConfig.endDate) {
    const repeatEndDate = new Date(recurrenceConfig.endDate);
    const repeatEndDayTime = new Date(
      repeatEndDate.getFullYear(),
      repeatEndDate.getMonth(),
      repeatEndDate.getDate(),
      23,
      59,
      59,
      999,
    ).getTime();
    if (dayStartTime > repeatEndDayTime) {
      return false;
    }
  }

  const baseStartDayTime = new Date(
    evStart.getFullYear(),
    evStart.getMonth(),
    evStart.getDate(),
    0,
    0,
    0,
    0,
  ).getTime();

  if (dayEndTime < baseStartDayTime) {
    return false;
  }

  const { frequency, interval } = recurrenceConfig;
  const safeInterval = Math.max(1, interval || 1);

  if (frequency === 'daily') {
    const diffDays = Math.round((dayStartTime - baseStartDayTime) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays % safeInterval === 0;
  }

  if (frequency === 'weekly') {
    const targetWeekday = targetDate.getDay() === 0 ? 7 : targetDate.getDay();
    const allowedDays =
      recurrenceConfig.weeklyDays && recurrenceConfig.weeklyDays.length > 0
        ? recurrenceConfig.weeklyDays
        : [evStart.getDay() === 0 ? 7 : evStart.getDay()];

    if (!allowedDays.includes(targetWeekday)) {
      return false;
    }

    if (safeInterval === 1) {
      return true;
    }

    const startWkMonday = new Date(evStart);
    const startWkDay = startWkMonday.getDay() === 0 ? 7 : startWkMonday.getDay();
    startWkMonday.setDate(startWkMonday.getDate() - (startWkDay - 1));
    startWkMonday.setHours(0, 0, 0, 0);

    const targetWkMonday = new Date(targetDate);
    targetWkMonday.setDate(targetWkMonday.getDate() - (targetWeekday - 1));
    targetWkMonday.setHours(0, 0, 0, 0);

    const diffWeeks = Math.round(
      (targetWkMonday.getTime() - startWkMonday.getTime()) / (1000 * 60 * 60 * 24 * 7),
    );
    return diffWeeks >= 0 && diffWeeks % safeInterval === 0;
  }

  if (frequency === 'monthly') {
    const diffMonths = (targetY - evStart.getFullYear()) * 12 + (targetM - evStart.getMonth());
    if (diffMonths < 0 || diffMonths % safeInterval !== 0) {
      return false;
    }

    if (recurrenceConfig.monthlyType === 'day_of_month') {
      const neededDay = recurrenceConfig.monthlyDay || evStart.getDate();
      return targetD === neededDay;
    }

    const neededWk = recurrenceConfig.monthlyNthWeekday || (evStart.getDay() === 0 ? 7 : evStart.getDay());
    const curWk = targetDate.getDay() === 0 ? 7 : targetDate.getDay();
    if (curWk !== neededWk) return false;

    const neededOrder = recurrenceConfig.monthlyNthOrder || getNthOrderFromDate(evStart);
    return getNthOrderFromDate(targetDate) === neededOrder;
  }

  if (frequency === 'yearly') {
    const diffYears = targetY - evStart.getFullYear();
    if (diffYears < 0 || diffYears % safeInterval !== 0) {
      return false;
    }

    if (recurrenceConfig.yearlyType === 'specific_date') {
      const neededMonth = (recurrenceConfig.yearlyMonth || evStart.getMonth() + 1) - 1;
      const neededDay = recurrenceConfig.yearlyDay || evStart.getDate();
      return targetM === neededMonth && targetD === neededDay;
    }

    const neededMonth = (recurrenceConfig.yearlyNthMonth || evStart.getMonth() + 1) - 1;
    if (targetM !== neededMonth) return false;

    const neededWk = recurrenceConfig.yearlyNthWeekday || (evStart.getDay() === 0 ? 7 : evStart.getDay());
    const curWk = targetDate.getDay() === 0 ? 7 : targetDate.getDay();
    if (curWk !== neededWk) return false;

    const neededOrder = recurrenceConfig.yearlyNthOrder || getNthOrderFromDate(evStart);
    return getNthOrderFromDate(targetDate) === neededOrder;
  }

  return false;
};

export const isEventCancelledOnDate = (ev: CalendarEventEntity, targetDate: Date): boolean => {
  if (ev.isCancelled) return true;
  const { recurrenceConfig } = parseEventRecurrence(ev.description);
  if (!recurrenceConfig) return false;
  const targetDateKey = formatDateKey(targetDate);
  return Boolean(recurrenceConfig.cancelledDates && recurrenceConfig.cancelledDates.includes(targetDateKey));
};

export const formatEventTimeForDate = (ev: CalendarEventEntity, targetDate: Date): string => {
  const evStart = new Date(ev.startTime);
  const evEnd = ev.endTime ? new Date(ev.endTime) : null;
  const { recurrenceConfig } = parseEventRecurrence(ev.description);

  if (!recurrenceConfig || recurrenceConfig.frequency === 'none') {
    const sStr = `${pad2(evStart.getHours())}:${pad2(evStart.getMinutes())}`;
    if (!evEnd) return sStr;
    const isSameDay =
      evStart.getFullYear() === evEnd.getFullYear() &&
      evStart.getMonth() === evEnd.getMonth() &&
      evStart.getDate() === evEnd.getDate();
    const eStr = `${pad2(evEnd.getHours())}:${pad2(evEnd.getMinutes())}`;
    return isSameDay ? `${sStr} - ${eStr}` : `${sStr} (${formatDateOnly(evStart)}) - ${eStr} (${formatDateOnly(evEnd)})`;
  }

  const sStr = `${pad2(evStart.getHours())}:${pad2(evStart.getMinutes())}`;
  if (!evEnd) return sStr;
  const eStr = `${pad2(evEnd.getHours())}:${pad2(evEnd.getMinutes())}`;
  return `${sStr} - ${eStr}`;
};

interface CircleCalendarViewProps {
  circleId: string;
}

export const CircleCalendarView: React.FC<CircleCalendarViewProps> = ({ circleId }) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const setActiveCircleView = useCircleStore((s) => s.setActiveCircleView);
  const targetCalendarDate = useCircleStore((s) => s.targetCalendarDate);
  const targetCalendarEventId = useCircleStore((s) => s.targetCalendarEventId);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const now = new Date();
  const formatToLocalDateTimeInput = (date: Date, hours = 0, minutes = 0) => {
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day}T${h}:${min}`;
  };

  const nowIsoLocal = formatToLocalDateTimeInput(now, now.getHours(), now.getMinutes());

  // Form states matching web style (mặc định 06:00 đến 23:59)
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(() => formatToLocalDateTimeInput(now, 6, 0));
  const [endTime, setEndTime] = useState(() => formatToLocalDateTimeInput(now, 23, 59));
  const [reminderMinutes, setReminderMinutes] = useState('15');

  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>(() =>
    createDefaultRecurrenceConfig(new Date())
  );

  // Scope modal state for recurring event edit
  const [editingEvent, setEditingEvent] = useState<CalendarEventEntity | null>(null);
  const [editingOccurrenceDate, setEditingOccurrenceDate] = useState<Date | null>(null);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data: events = [], isLoading } = useCalendarEventsQuery(circleId, month, year);
  const createMutation = useCreateCalendarEventMutation(circleId);
  const updateMutation = useUpdateCalendarEventMutation(circleId);
  const cancelMutation = useCancelCalendarEventMutation(circleId);
  const deleteMutation = useDeleteCalendarEventMutation(circleId);
  const rsvpMutation = useRespondEventRsvpMutation(circleId);
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'month' | 'upcoming'>('month');
  const { data: upcomingEvents = [], isLoading: isUpcomingLoading } = useUpcomingCalendarEventsQuery(circleId);
  const shareToChatMutation = useShareCalendarEventToChatMutation(circleId);
  const [shareSuccessId, setShareSuccessId] = useState<string | null>(null);

  // Realtime Socket.IO sync for RSVP updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRsvpUpdated = () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.calendar(circleId) });
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.upcomingCalendar(circleId) });
    };

    socket.on('circle:calendar-event-rsvp-updated', handleRsvpUpdated);
    return () => {
      socket.off('circle:calendar-event-rsvp-updated', handleRsvpUpdated);
    };
  }, [circleId, queryClient]);

  const handleShareToChat = async (eventId: string) => {
    try {
      await shareToChatMutation.mutateAsync(eventId);
      setShareSuccessId(eventId);
      setTimeout(() => setShareSuccessId(null), 2500);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi chia sẻ sự kiện');
    }
  };

  // Group upcoming events chronologically
  const groupedUpcoming = useMemo(() => {
    const nowTime = new Date();
    const todayStart = new Date(nowTime.getFullYear(), nowTime.getMonth(), nowTime.getDate()).getTime();
    const tomorrowStart = todayStart + 86400000;
    const weekEnd = todayStart + 7 * 86400000;

    const todayList: CalendarEventEntity[] = [];
    const tomorrowList: CalendarEventEntity[] = [];
    const thisWeekList: CalendarEventEntity[] = [];
    const laterList: CalendarEventEntity[] = [];

    for (const ev of upcomingEvents) {
      const start = new Date(ev.startTime).getTime();
      if (start >= todayStart && start < tomorrowStart) {
        todayList.push(ev);
      } else if (start >= tomorrowStart && start < tomorrowStart + 86400000) {
        tomorrowList.push(ev);
      } else if (start >= tomorrowStart + 86400000 && start < weekEnd) {
        thisWeekList.push(ev);
      } else {
        laterList.push(ev);
      }
    }

    return { today: todayList, tomorrow: tomorrowList, thisWeek: thisWeekList, later: laterList };
  }, [upcomingEvents]);

  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setEditingOccurrenceDate(null);
    setSubmitError(null);
    setTitle('');
    setLocation('');
    setDescription('');
    setReminderMinutes('15');

    const baseDate = new Date(selectedDate);
    // Mặc định ngày đó từ 06:00 đến 23:59 (cả 2 đều bắt buộc)
    setStartTime(formatToLocalDateTimeInput(baseDate, 6, 0));
    setEndTime(formatToLocalDateTimeInput(baseDate, 23, 59));
    setRecurrenceConfig(createDefaultRecurrenceConfig(baseDate));
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (ev: CalendarEventEntity) => {
    setEditingEvent(ev);
    setEditingOccurrenceDate(selectedDate ? new Date(selectedDate) : new Date(ev.startTime));
    setSubmitError(null);
    setTitle(ev.eventTitle);
    setLocation(ev.location || '');

    const { cleanDesc, recurrenceConfig: parsedRec } = parseEventRecurrence(ev.description);
    setDescription(cleanDesc);

    const s = new Date(ev.startTime);
    const e = ev.endTime ? new Date(ev.endTime) : new Date(s.getTime() + 3600000);

    if (parsedRec && parsedRec.frequency !== 'none' && selectedDate) {
      const occStart = new Date(selectedDate);
      occStart.setHours(s.getHours(), s.getMinutes(), 0, 0);
      setStartTime(formatToLocalDateTimeInput(occStart, s.getHours(), s.getMinutes()));

      const diffDays = Math.round(
        (new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime() -
          new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const occEnd = new Date(selectedDate);
      occEnd.setDate(occEnd.getDate() + Math.max(0, diffDays));
      setEndTime(formatToLocalDateTimeInput(occEnd, e.getHours(), e.getMinutes()));
    } else {
      setStartTime(formatToLocalDateTimeInput(s, s.getHours(), s.getMinutes()));
      setEndTime(formatToLocalDateTimeInput(e, e.getHours(), e.getMinutes()));
    }

    if (parsedRec) {
      setRecurrenceConfig(parsedRec);
    } else {
      setRecurrenceConfig(createDefaultRecurrenceConfig(s, e));
    }

    if (ev.reminderTime && ev.startTime) {
      const diffMins = Math.round(
        (new Date(ev.startTime).getTime() - new Date(ev.reminderTime).getTime()) / 60000
      );
      if ([0, 5, 15, 30, 60, 120, 1440, 2880].includes(diffMins)) {
        setReminderMinutes(String(diffMins));
      } else {
        setReminderMinutes('none');
      }
    } else {
      setReminderMinutes('none');
    }

    setIsAddModalOpen(true);
  };

  const handleRepeatOptionChange = (value: string) => {
    if (value === 'custom') {
      const sDate = startTime ? new Date(startTime) : new Date();
      const eDate = endTime ? new Date(endTime) : sDate;
      const baseWk = getDefaultWeeklyDays(sDate, eDate);
      setRecurrenceConfig((prev) => ({
        ...prev,
        frequency: prev.frequency === 'none' ? 'weekly' : prev.frequency,
        interval: Math.max(1, prev.interval || 1),
        weeklyDays: prev.weeklyDays.length > 0 ? prev.weeklyDays : baseWk,
        isCustom: true,
      }));
      return;
    }

    const freq = value as RecurrenceFrequency;
    if (freq === 'none') {
      setRecurrenceConfig((prev) => ({
        ...prev,
        frequency: 'none',
        isCustom: false,
      }));
    } else {
      const sDate = startTime ? new Date(startTime) : new Date();
      const eDate = endTime ? new Date(endTime) : sDate;
      const baseWk = getDefaultWeeklyDays(sDate, eDate);
      setRecurrenceConfig((prev) => ({
        ...prev,
        frequency: freq,
        interval: 1,
        weeklyDays: baseWk,
        monthlyType: 'day_of_month',
        monthlyDay: sDate.getDate(),
        monthlyNthWeekday: getWeekdayNumber(sDate),
        monthlyNthOrder: getNthOrderFromDate(sDate),
        yearlyType: 'specific_date',
        yearlyDay: sDate.getDate(),
        yearlyMonth: sDate.getMonth() + 1,
        isCustom: false,
      }));
    }
  };

  // Calendar math
  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(year, month - 1, 1).getDay();
  }, [year, month]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const today = () => {
    const nowTime = new Date();
    setCurrentDate(nowTime);
    setSelectedDate(nowTime);
  };

  // Recurrence aware events by day
  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEventEntity[]>();
    const totalDays = new Date(year, month, 0).getDate();

    for (let d = 1; d <= totalDays; d++) {
      const targetDate = new Date(year, month - 1, d);
      for (const ev of events) {
        if (isEventOccurringOnDate(ev, targetDate)) {
          if (!map.has(d)) map.set(d, []);
          map.get(d)!.push(ev);
        }
      }
    }
    return map;
  }, [events, month, year]);

  // Sync calendar target date from navigation
  useEffect(() => {
    if (targetCalendarDate) {
      const d = new Date(targetCalendarDate);
      if (!isNaN(d.getTime())) {
        setCurrentDate(d);
        setSelectedDate(d);
      }
    }
  }, [targetCalendarDate]);

  const selectedDayEvents = useMemo(() => {
    if (
      selectedDate.getMonth() + 1 !== month ||
      selectedDate.getFullYear() !== year
    ) {
      return [];
    }
    return eventsByDay.get(selectedDate.getDate()) || [];
  }, [eventsByDay, selectedDate, month, year]);

  useEffect(() => {
    if (targetCalendarEventId && selectedDayEvents.length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`calendar-event-${targetCalendarEventId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [targetCalendarEventId, selectedDayEvents]);

  // Form Submit Handler supporting isolated occurrence scopes
  const handleCreateOrUpdateEvent = async (scope: 'this' | 'future' | 'all' = 'all') => {
    setSubmitError(null);

    if (!title.trim()) {
      setSubmitError('Vui lòng nhập tên sự kiện');
      return;
    }
    if (!startTime) {
      setSubmitError('Vui lòng chọn thời gian bắt đầu');
      return;
    }
    if (!endTime) {
      setSubmitError('Vui lòng chọn thời gian kết thúc');
      return;
    }

    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      setSubmitError('Thời gian bắt đầu không hợp lệ');
      return;
    }

    const end = new Date(endTime);
    if (isNaN(end.getTime())) {
      setSubmitError('Thời gian kết thúc không hợp lệ');
      return;
    }
    if (end.getTime() <= start.getTime()) {
      setSubmitError('Thời gian kết thúc phải lớn hơn thời gian bắt đầu');
      return;
    }

    const finalDesc = serializeRecurrence(recurrenceConfig, description);

    let reminderIso: string | undefined = undefined;
    if (reminderMinutes && reminderMinutes !== 'none') {
      const mins = parseInt(reminderMinutes, 10);
      reminderIso = new Date(start.getTime() - mins * 60 * 1000).toISOString();
    }

    try {
      if (editingEvent) {
        const isRecurring = Boolean(
          recurrenceConfig.frequency !== 'none' ||
          (editingEvent.description &&
            (editingEvent.description.includes('[RECURRENCE:') || editingEvent.description.includes('[Lặp lại:')))
        );

        if (isRecurring && scope === 'this' && editingOccurrenceDate) {
          const occKey = formatDateKey(editingOccurrenceDate);
          const { recurrenceConfig: parentConfig, cleanDesc: parentCleanDesc } = parseEventRecurrence(editingEvent.description);
          const currentExcluded = parentConfig?.excludedDates || [];
          const nextExcluded = currentExcluded.includes(occKey) ? currentExcluded : [...currentExcluded, occKey];
          const updatedParentRecurrence: RecurrenceConfig = {
            ...(parentConfig || recurrenceConfig),
            excludedDates: nextExcluded,
          };
          const updatedParentDesc = serializeRecurrence(updatedParentRecurrence, parentCleanDesc);

          await updateMutation.mutateAsync({
            eventId: editingEvent.id,
            input: {
              description: updatedParentDesc,
            },
          });

          const standaloneConfig: RecurrenceConfig = {
            ...recurrenceConfig,
            frequency: 'none',
            endType: 'never',
            endDate: null,
            isCustom: false,
          };
          const standaloneDesc = serializeRecurrence(standaloneConfig, description);

          await createMutation.mutateAsync({
            eventTitle: title.trim(),
            description: standaloneDesc,
            location: location.trim() || undefined,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            reminderTime: reminderIso,
          });
        } else if (isRecurring && scope === 'future' && editingOccurrenceDate) {
          const dayBefore = new Date(editingOccurrenceDate);
          dayBefore.setDate(dayBefore.getDate() - 1);

          const { recurrenceConfig: parentConfig, cleanDesc: parentCleanDesc } = parseEventRecurrence(editingEvent.description);
          const updatedParentRecurrence: RecurrenceConfig = {
            ...(parentConfig || recurrenceConfig),
            endType: 'on_date',
            endDate: dayBefore,
          };
          const updatedParentDesc = serializeRecurrence(updatedParentRecurrence, parentCleanDesc);

          await updateMutation.mutateAsync({
            eventId: editingEvent.id,
            input: {
              description: updatedParentDesc,
            },
          });

          await createMutation.mutateAsync({
            eventTitle: title.trim(),
            description: finalDesc,
            location: location.trim() || undefined,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            reminderTime: reminderIso,
          });
        } else {
          await updateMutation.mutateAsync({
            eventId: editingEvent.id,
            input: {
              eventTitle: title.trim(),
              description: finalDesc,
              location: location.trim() || undefined,
              startTime: start.toISOString(),
              endTime: end.toISOString(),
              reminderTime: reminderIso,
            },
          });
        }
      } else {
        await createMutation.mutateAsync({
          eventTitle: title.trim(),
          description: finalDesc,
          location: location.trim() || undefined,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          reminderTime: reminderIso,
        });
        setActiveCircleView('chat');
      }

      setIsAddModalOpen(false);
      setEditingEvent(null);
    } catch (err: any) {
      setSubmitError(err?.message || 'Có lỗi xảy ra khi lưu sự kiện');
    }
  };

  const handleAttemptSubmit = () => {
    if (editingEvent) {
      const isRecurring = Boolean(
        recurrenceConfig.frequency !== 'none' ||
        (editingEvent.description &&
          (editingEvent.description.includes('[RECURRENCE:') || editingEvent.description.includes('[Lặp lại:')))
      );
      if (isRecurring) {
        setShowScopeModal(true);
        return;
      }
    }
    handleCreateOrUpdateEvent('all');
  };

  const handleCancelEvent = async (ev: CalendarEventEntity) => {
    const isRecurring = Boolean(
      ev.description && (ev.description.includes('[RECURRENCE:') || ev.description.includes('[Lặp lại:'))
    );

    if (isRecurring) {
      const answer = confirm(
        'Bạn có muốn CHỈ HỦY LẦN NÀY không?\n\n- Nhấn OK để CHỈ HỦY LẦN NÀY (các lần khác vẫn diễn ra bình thường).\n- Nhấn Cancel để chọn tiếp xem có muốn hủy toàn bộ chuỗi không.'
      );
      if (answer) {
        const occKey = formatDateKey(selectedDate);
        const { recurrenceConfig: parentConfig, cleanDesc: parentCleanDesc } = parseEventRecurrence(ev.description);
        const currentCancelled = parentConfig?.cancelledDates || [];
        const nextCancelled = currentCancelled.includes(occKey) ? currentCancelled : [...currentCancelled, occKey];
        const updatedParentRecurrence: RecurrenceConfig = {
          ...(parentConfig || createDefaultRecurrenceConfig(new Date(ev.startTime))),
          cancelledDates: nextCancelled,
        };
        const updatedParentDesc = serializeRecurrence(updatedParentRecurrence, parentCleanDesc);

        await updateMutation.mutateAsync({
          eventId: ev.id,
          input: {
            description: updatedParentDesc,
          },
        });
        return;
      }

      if (confirm('Bạn có chắc chắn muốn HỦY TOÀN BỘ CHUỖI sự kiện lặp lại này?')) {
        await cancelMutation.mutateAsync(ev.id);
      }
      return;
    }

    if (confirm('Bạn có chắc chắn muốn HỦY lịch hẹn này? Sự kiện sẽ được đánh dấu [ĐÃ HỦY] và giữ lại trên lịch để cả nhóm theo dõi.')) {
      try {
        await cancelMutation.mutateAsync(ev.id);
      } catch (err: any) {
        alert(err?.message || 'Có lỗi xảy ra khi hủy lịch hẹn');
      }
    }
  };

  const handleDeleteEvent = async (ev: CalendarEventEntity) => {
    const isRecurring = Boolean(
      ev.description && (ev.description.includes('[RECURRENCE:') || ev.description.includes('[Lặp lại:'))
    );

    if (isRecurring) {
      const answer = confirm(
        'Bạn có muốn CHỈ XÓA LẦN NÀY khỏi lịch không?\n\n- Nhấn OK để CHỈ XÓA LẦN NÀY (các lần khác vẫn hiển thị đầy đủ).\n- Nhấn Cancel nếu muốn xóa toàn bộ chuỗi.'
      );
      if (answer) {
        const occKey = formatDateKey(selectedDate);
        const { recurrenceConfig: parentConfig, cleanDesc: parentCleanDesc } = parseEventRecurrence(ev.description);
        const currentExcluded = parentConfig?.excludedDates || [];
        const nextExcluded = currentExcluded.includes(occKey) ? currentExcluded : [...currentExcluded, occKey];
        const updatedParentRecurrence: RecurrenceConfig = {
          ...(parentConfig || createDefaultRecurrenceConfig(new Date(ev.startTime))),
          excludedDates: nextExcluded,
        };
        const updatedParentDesc = serializeRecurrence(updatedParentRecurrence, parentCleanDesc);

        await updateMutation.mutateAsync({
          eventId: ev.id,
          input: {
            description: updatedParentDesc,
          },
        });
        return;
      }

      if (confirm('Bạn có chắc chắn muốn XÓA VĨNH VIỄN TOÀN BỘ CHUỖI sự kiện này?')) {
        await deleteMutation.mutateAsync(ev.id);
      }
      return;
    }

    if (confirm('Bạn có chắc chắn muốn XÓA VĨNH VIỄN sự kiện này khỏi lịch? Sự kiện sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu.')) {
      try {
        await deleteMutation.mutateAsync(ev.id);
      } catch (err: any) {
        alert(err?.message || 'Có lỗi xảy ra khi xóa sự kiện');
      }
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex-1 flex flex-col h-full bg-circle-canvas dark:bg-circle-dark-surface overflow-y-auto p-4 md:p-6 transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-circle-hairline dark:border-circle-dark-hairline mb-6 gap-3">
        <div>
          <h1 className="text-lg font-bold text-circle-charcoal dark:text-circle-dark-text">
            {t.nav.calendarEvents}
          </h1>
          <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-0.5">
            Lịch hẹn, sự kiện và nhắc nhở dành riêng cho các thành viên trong nhóm
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg bg-circle-wash dark:bg-circle-dark-wash p-0.5 border border-circle-hairline dark:border-circle-dark-hairline mr-2">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text shadow-2xs'
                  : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>{t.collab?.monthView || 'Lưới tháng'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('upcoming')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'upcoming'
                  ? 'bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text shadow-2xs'
                  : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{t.collab?.upcomingView || 'Kèo sắp tới'}</span>
              {upcomingEvents.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-circle-primary/20 text-circle-charcoal dark:text-white font-bold">
                  {upcomingEvents.length}
                </span>
              )}
            </button>
          </div>

          {viewMode === 'month' && (
            <>
              <button
                type="button"
                onClick={today}
                className="rounded-lg border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas px-3 py-1.5 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash transition-colors shadow-2xs"
              >
                Hôm nay
              </button>
              <div className="flex items-center rounded-lg border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 text-circle-slate hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  Tháng {month} / {year}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 text-circle-slate hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 rounded-lg bg-circle-charcoal dark:bg-circle-primary px-3.5 py-1.5 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            <span>Lên lịch hẹn</span>
          </button>
        </div>
      </div>

      {viewMode === 'upcoming' ? (
        /* Upcoming View */
        <div className="max-w-3xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-circle-hairline dark:border-circle-dark-hairline">
            <h2 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
              Danh sách kèo sắp tới trong nhóm ({upcomingEvents.length})
            </h2>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1 text-xs font-bold text-circle-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm lịch hẹn mới</span>
            </button>
          </div>

          {isUpcomingLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-circle-slate" />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline p-8">
              <CalendarDays className="h-10 w-10 text-circle-slate/50 mx-auto mb-2" />
              <p className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                Chưa có kèo nào sắp tới
              </p>
              <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-1">
                Tạo lịch hẹn để cùng tham gia nhé!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {[
                { title: 'Hôm nay', list: groupedUpcoming.today },
                { title: 'Ngày mai', list: groupedUpcoming.tomorrow },
                { title: 'Trong tuần này', list: groupedUpcoming.thisWeek },
                { title: 'Sắp tới', list: groupedUpcoming.later },
              ].map(({ title: groupTitle, list }) => {
                if (list.length === 0) return null;
                return (
                  <div key={groupTitle} className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted">
                      {groupTitle} ({list.length})
                    </h3>
                    <div className="space-y-3">
                      {list.map((ev) => (
                        <div
                          key={ev.id}
                          className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas p-4 shadow-2xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                                  {ev.eventTitle}
                                </span>
                                {ev.isCancelled && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                    Đã hủy
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-circle-slate dark:text-circle-dark-muted mt-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatEventTimeForDate(ev, new Date(ev.startTime))}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleShareToChat(ev.id)}
                                className="p-1 text-circle-slate hover:text-circle-primary transition-colors"
                                title="Chia sẻ vào chat"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </button>
                              {!ev.isCancelled && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(ev)}
                                  className="p-1 text-circle-slate hover:text-circle-charcoal transition-colors"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {ev.location && (
                            <EventLocationDisplay location={ev.location} className="text-xs" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Month Grid & Day Events View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid (2 cols on large screen) */}
          <div className="lg:col-span-2 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas p-4 shadow-2xs">
            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-circle-slate dark:text-circle-dark-muted pb-2 border-b border-circle-hairline dark:border-circle-dark-hairline">
              <span className="text-rose-500">CN</span>
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square opacity-0" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected =
                  selectedDate.getDate() === dayNum &&
                  selectedDate.getMonth() + 1 === month &&
                  selectedDate.getFullYear() === year;
                const isCurrentToday =
                  new Date().getDate() === dayNum &&
                  new Date().getMonth() + 1 === month &&
                  new Date().getFullYear() === year;

                const dayEvents = eventsByDay.get(dayNum) || [];

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => setSelectedDate(new Date(year, month - 1, dayNum))}
                    className={`group aspect-square rounded-xl p-1.5 flex flex-col justify-between transition-all relative border ${
                      isSelected
                        ? 'border-circle-primary bg-circle-primary/10 shadow-xs'
                        : isCurrentToday
                        ? 'border-circle-slate/30 bg-circle-wash/40 dark:bg-circle-dark-surface'
                        : 'border-transparent hover:border-circle-hairline hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                    }`}
                  >
                    <span
                      className={`text-xs font-semibold self-start h-5 w-5 flex items-center justify-center rounded-full ${
                        isSelected
                          ? 'bg-circle-primary text-white font-bold'
                          : isCurrentToday
                          ? 'bg-circle-charcoal text-white dark:bg-white dark:text-circle-charcoal font-bold'
                          : 'text-circle-charcoal dark:text-circle-dark-text'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Event indicators */}
                    <div className="w-full space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const isCancelled = isEventCancelledOnDate(ev, new Date(year, month - 1, dayNum));
                        return (
                          <div
                            key={ev.id}
                            className={`text-[9px] px-1 py-0.2 rounded-sm truncate text-left font-medium ${
                              isCancelled
                                ? 'bg-rose-500/10 text-rose-600 line-through'
                                : 'bg-teal-500/15 text-teal-800 dark:text-teal-300'
                            }`}
                          >
                            {ev.eventTitle}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-[8px] font-bold text-circle-slate text-center">
                          +{dayEvents.length - 2}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Events Details (1 col) */}
          <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas p-4 shadow-2xs flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline mb-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted">
                  Lịch trình ngày
                </h2>
                <p className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {selectedDate.toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="p-1 rounded-lg border border-circle-hairline text-circle-slate hover:text-circle-charcoal hover:bg-circle-wash transition-colors"
                title="Thêm lịch hẹn"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-circle-slate" />
                </div>
              ) : selectedDayEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-8 w-8 text-circle-slate/40 mx-auto mb-2" />
                  <p className="text-xs font-medium text-circle-slate dark:text-circle-dark-muted">
                    Không có lịch hẹn nào trong ngày này
                  </p>
                </div>
              ) : (
                selectedDayEvents.map((ev) => {
                  const isOccCancelled = isEventCancelledOnDate(ev, selectedDate);
                  const { recurrenceConfig: rec } = parseEventRecurrence(ev.description);

                  return (
                    <div
                      key={ev.id}
                      id={`calendar-event-${ev.id}`}
                      className={`rounded-xl border p-3 space-y-2.5 transition-all ${
                        isOccCancelled
                          ? 'border-rose-200 bg-rose-50/40 dark:bg-rose-950/20'
                          : 'border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-surface'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-xs font-bold ${
                                isOccCancelled
                                  ? 'text-rose-700 dark:text-rose-400 line-through'
                                  : 'text-circle-charcoal dark:text-circle-dark-text'
                              }`}
                            >
                              {ev.eventTitle}
                            </span>
                            {isOccCancelled && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                Đã hủy
                              </span>
                            )}
                            {rec && rec.frequency !== 'none' && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-teal-500/10 text-teal-700 border border-teal-500/20">
                                <Repeat className="h-2.5 w-2.5" />
                                {formatRecurrenceSummary(rec)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-circle-slate dark:text-circle-dark-muted mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatEventTimeForDate(ev, selectedDate)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleShareToChat(ev.id)}
                            className="p-1 text-circle-slate hover:text-circle-primary transition-colors"
                            title="Chia sẻ vào chat"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                          {!isOccCancelled && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(ev)}
                                className="p-1 text-circle-slate hover:text-circle-charcoal transition-colors"
                                title="Chỉnh sửa lịch hẹn"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelEvent(ev)}
                                className="p-1 text-amber-600 hover:text-amber-700 transition-colors"
                                title="Hủy lịch hẹn"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev)}
                            className="p-1 text-rose-600 hover:text-rose-700 transition-colors"
                            title="Xóa vĩnh viễn"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {ev.location && (
                        <EventLocationDisplay location={ev.location} className="text-xs" />
                      )}

                      {/* RSVP Poll Section */}
                      <div className="pt-2 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-circle-slate">
                          <span>Bình chọn tham gia</span>
                          <span className={`text-[10px] font-bold ${isOccCancelled ? 'text-rose-600' : 'text-teal-600'}`}>
                            {isOccCancelled ? 'Đã đóng (Đã hủy)' : 'Đang diễn ra'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { status: EventRsvpStatus.YES, label: 'Tham gia', icon: Check, color: 'emerald' },
                            { status: EventRsvpStatus.MAYBE, label: 'Có thể', icon: HelpCircle, color: 'amber' },
                            { status: EventRsvpStatus.NO, label: 'Bận', icon: X, color: 'rose' },
                          ].map(({ status, label, icon: Icon }) => {
                            const isMyVote = ev.rsvps?.some(
                              (r) => r.userId === user?.id && r.status === status
                            );
                            const count = ev.rsvps?.filter((r) => r.status === status).length || 0;

                            return (
                              <button
                                key={status}
                                type="button"
                                disabled={isOccCancelled || rsvpMutation.isPending}
                                onClick={() => rsvpMutation.mutate({ eventId: ev.id, status })}
                                className={`py-1.5 px-2 rounded-lg text-center text-xs font-semibold flex items-center justify-center gap-1 transition-all border ${
                                  isMyVote
                                    ? 'bg-circle-charcoal text-white border-circle-charcoal shadow-2xs'
                                    : 'border-circle-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash text-circle-charcoal dark:text-circle-dark-text'
                                } disabled:opacity-50`}
                              >
                                <Icon className="h-3 w-3" />
                                <span>{label}</span>
                                {count > 0 && <span className="text-[10px] opacity-80">({count})</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD / EDIT EVENT MODAL - WEB STYLE VỚI 2 THẺ (THÔNG TIN & NHẮC NHỞ) */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 md:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-5 md:p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline">
              <div>
                <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {editingEvent ? 'Chỉnh Sửa Lịch Hẹn' : 'Lên Lịch Hẹn & Sự Kiện Nhóm'}
                </h3>
                <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-0.5">
                  Lịch hẹn, sự kiện và nhắc nhở dành riêng cho các thành viên trong nhóm
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAttemptSubmit();
              }}
              className="space-y-4"
            >
              {/* ========================================== */}
              {/* THẺ 1: THÔNG TIN SỰ KIỆN & LỊCH TRÌNH */}
              {/* ========================================== */}
              <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/50 dark:bg-circle-dark-canvas/40 p-4 space-y-3.5 shadow-2xs">
                {/* Tên sự kiện */}
                <div>
                  <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                    Tên sự kiện / Lịch hẹn *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Họp đồ án tốt nghiệp, Đi ăn sinh nhật..."
                    className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage"
                  />
                </div>

                {/* Vị trí / Địa điểm */}
                <div>
                  <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                    Địa điểm (tùy chọn)
                  </label>
                  <LocationSearchInput
                    value={location}
                    onChange={setLocation}
                    placeholder="Tìm kiếm địa điểm trên bản đồ hoặc dán link Google Meet / Google Maps..."
                  />
                </div>

                {/* Thời gian Bắt đầu & Kết thúc */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                      Bắt đầu lúc *
                    </label>
                    <CustomDateTimePicker
                      required
                      value={startTime}
                      onChange={setStartTime}
                      min={!editingEvent ? nowIsoLocal : undefined}
                      placeholder="dd/mm/yyyy --:--"
                      align="left"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                      Kết thúc lúc *
                    </label>
                    <CustomDateTimePicker
                      required
                      value={endTime}
                      onChange={setEndTime}
                      min={startTime || (!editingEvent ? nowIsoLocal : undefined)}
                      placeholder="dd/mm/yyyy --:--"
                      align="right"
                    />
                  </div>
                </div>

                {/* Cấu hình Lặp lại */}
                <div className="space-y-2.5 pt-2 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted">
                      Lặp lại
                    </label>
                    {recurrenceConfig.frequency !== 'none' && (
                      <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                        {formatRecurrenceSummary(recurrenceConfig)}
                      </span>
                    )}
                  </div>

                  <select
                    value={recurrenceConfig.isCustom ? 'custom' : recurrenceConfig.frequency}
                    onChange={(e) => handleRepeatOptionChange(e.target.value)}
                    className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage"
                  >
                    <option value="none">Không lặp lại</option>
                    <option value="daily">Hằng ngày</option>
                    <option value="weekly">Hằng tuần</option>
                    <option value="monthly">Hằng tháng</option>
                    <option value="yearly">Hằng năm</option>
                    <option value="custom">Tùy chỉnh...</option>
                  </select>

                  {/* Kết thúc lặp lại (chỉ hiển thị khi có lặp lại) */}
                  {recurrenceConfig.frequency !== 'none' && (
                    <div className="pt-2 space-y-2 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-circle-slate dark:text-circle-dark-muted">
                          Kết thúc lặp
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setRecurrenceConfig((prev) => ({
                                ...prev,
                                endType: 'never',
                                endDate: null,
                              }))
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              recurrenceConfig.endType === 'never'
                                ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                                : 'bg-white dark:bg-circle-dark-surface border-circle-hairline text-circle-slate hover:text-circle-charcoal'
                            }`}
                          >
                            Không giới hạn
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setRecurrenceConfig((prev) => ({
                                ...prev,
                                endType: 'on_date',
                                endDate: prev.endDate || (startTime ? new Date(startTime) : new Date()),
                              }))
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              recurrenceConfig.endType === 'on_date'
                                ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                                : 'bg-white dark:bg-circle-dark-surface border-circle-hairline text-circle-slate hover:text-circle-charcoal'
                            }`}
                          >
                            Đến ngày
                          </button>
                        </div>
                      </div>

                      {recurrenceConfig.endType === 'on_date' && (
                        <div className="pt-1">
                          <CustomDateTimePicker
                            dateOnly
                            required
                            value={
                              recurrenceConfig.endDate
                                ? formatDateKey(recurrenceConfig.endDate)
                                : formatDateKey(new Date())
                            }
                            onChange={(val) => {
                              if (val) {
                                const parts = val.split('-').map(Number);
                                setRecurrenceConfig((prev) => ({
                                  ...prev,
                                  endType: 'on_date',
                                  endDate: new Date(parts[0], parts[1] - 1, parts[2]),
                                }));
                              }
                            }}
                            min={startTime ? startTime.split('T')[0] : undefined}
                            placeholder="dd/mm/yyyy"
                            align="left"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bảng tùy chỉnh nâng cao (khi chọn Tùy chỉnh...) */}
                  {recurrenceConfig.isCustom && (
                    <div className="p-3 rounded-xl border border-teal-500/30 bg-teal-50/40 dark:bg-teal-950/20 space-y-3 pt-2 mt-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-teal-500/20">
                        <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
                          Tùy chỉnh quy tắc lặp
                        </span>
                      </div>

                      {/* Chu kỳ & Khoảng cách */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-circle-slate mb-1">
                            Chu kỳ
                          </label>
                          <select
                            value={recurrenceConfig.frequency}
                            onChange={(e) =>
                              setRecurrenceConfig((prev) => ({
                                ...prev,
                                frequency: e.target.value as RecurrenceFrequency,
                              }))
                            }
                            className="w-full text-xs font-semibold rounded-xl border border-circle-hairline bg-white dark:bg-circle-dark-surface p-1.5 text-circle-charcoal dark:text-circle-dark-text"
                          >
                            <option value="daily">Ngày</option>
                            <option value="weekly">Tuần</option>
                            <option value="monthly">Tháng</option>
                            <option value="yearly">Năm</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-circle-slate mb-1">
                            Khoảng cách ({recurrenceConfig.frequency === 'daily' ? 'ngày' : recurrenceConfig.frequency === 'weekly' ? 'tuần' : recurrenceConfig.frequency === 'monthly' ? 'tháng' : 'năm'})
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setRecurrenceConfig((prev) => ({
                                  ...prev,
                                  interval: Math.max(1, prev.interval - 1),
                                }))
                              }
                              className="h-7 w-7 rounded-lg border border-circle-hairline bg-white dark:bg-circle-dark-surface flex items-center justify-center text-teal-600 hover:bg-circle-wash"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={recurrenceConfig.interval || 1}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setRecurrenceConfig((prev) => ({
                                  ...prev,
                                  interval: isNaN(val) ? 1 : Math.max(1, Math.min(99, val)),
                                }));
                              }}
                              className="w-10 text-center font-bold text-xs bg-white dark:bg-circle-dark-surface border border-circle-hairline rounded-lg py-1 text-circle-charcoal dark:text-circle-dark-text"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setRecurrenceConfig((prev) => ({
                                  ...prev,
                                  interval: Math.min(99, prev.interval + 1),
                                }))
                              }
                              className="h-7 w-7 rounded-lg border border-circle-hairline bg-white dark:bg-circle-dark-surface flex items-center justify-center text-teal-600 hover:bg-circle-wash"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Nếu là Tuần: 7 nút chọn thứ */}
                      {recurrenceConfig.frequency === 'weekly' && (
                        <div>
                          <label className="block text-[10px] font-bold text-circle-slate mb-1.5">
                            Vào các ngày trong tuần:
                          </label>
                          <div className="grid grid-cols-7 gap-1">
                            {[
                              { w: 1, label: 'T2' },
                              { w: 2, label: 'T3' },
                              { w: 3, label: 'T4' },
                              { w: 4, label: 'T5' },
                              { w: 5, label: 'T6' },
                              { w: 6, label: 'T7' },
                              { w: 7, label: 'CN' },
                            ].map(({ w, label }) => {
                              const isSel = recurrenceConfig.weeklyDays.includes(w);
                              return (
                                <button
                                  key={w}
                                  type="button"
                                  onClick={() => {
                                    const exists = recurrenceConfig.weeklyDays.includes(w);
                                    if (exists && recurrenceConfig.weeklyDays.length === 1) return;
                                    const next = exists
                                      ? recurrenceConfig.weeklyDays.filter((d) => d !== w)
                                      : [...recurrenceConfig.weeklyDays, w];
                                    setRecurrenceConfig((prev) => ({ ...prev, weeklyDays: next }));
                                  }}
                                  className={`h-7 rounded-lg text-xs font-semibold transition-all border ${
                                    isSel
                                      ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-2xs'
                                      : 'bg-white dark:bg-circle-dark-surface border-circle-hairline text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash'
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ========================================== */}
              {/* THẺ 2: NHẮC NHỞ & GHI CHÚ */}
              {/* ========================================== */}
              <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/50 dark:bg-circle-dark-canvas/40 p-4 space-y-3.5 shadow-2xs">
                {/* Nhắc nhở trước */}
                <div>
                  <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                    Nhắc nhở trước
                  </label>
                  <select
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(e.target.value)}
                    className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage"
                  >
                    <option value="none">Không nhắc</option>
                    <option value="0">Khi sự kiện diễn ra</option>
                    <option value="5">Trước 5 phút</option>
                    <option value="15">Trước 15 phút</option>
                    <option value="30">Trước 30 phút</option>
                    <option value="60">Trước 1 giờ</option>
                    <option value="120">Trước 2 giờ</option>
                    <option value="1440">Trước 1 ngày</option>
                    <option value="2880">Trước 2 ngày</option>
                  </select>
                </div>

                {/* Ghi chú nội dung */}
                <div>
                  <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                    Ghi chú nội dung
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Chi tiết công việc hoặc nội dung chuẩn bị cho cuộc họp / sự kiện..."
                    className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage resize-none"
                  />
                </div>
              </div>

              {submitError && (
                <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-circle-charcoal dark:bg-circle-primary px-5 py-2 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>{editingEvent ? 'Lưu thay đổi' : 'Lên lịch ngay'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SCOPE CONFIRMATION MODAL (KHI CHỈNH SỬA SỰ KIỆN LẶP LẠI) */}
      {/* ============================================================== */}
      {showScopeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-5 shadow-2xl space-y-4">
            <div>
              <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                Chỉnh sửa sự kiện lặp lại
              </h4>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1">
                Đây là sự kiện thuộc chuỗi lặp lại. Bạn muốn lưu thay đổi này cho:
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowScopeModal(false);
                  handleCreateOrUpdateEvent('this');
                }}
                className="w-full text-left p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-all"
              >
                <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  Chỉ lần này
                </p>
                <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                  Chỉ thay đổi riêng ngày {editingOccurrenceDate ? formatDateOnly(editingOccurrenceDate) : ''}, các lần khác giữ nguyên.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowScopeModal(false);
                  handleCreateOrUpdateEvent('future');
                }}
                className="w-full text-left p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-all"
              >
                <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  Lần này và các lần tiếp theo
                </p>
                <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                  Áp dụng thay đổi từ ngày {editingOccurrenceDate ? formatDateOnly(editingOccurrenceDate) : ''} trở đi.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowScopeModal(false);
                  handleCreateOrUpdateEvent('all');
                }}
                className="w-full text-left p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-all"
              >
                <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  Tất cả các lần
                </p>
                <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                  Cập nhật toàn bộ các lần diễn ra trong chuỗi lặp lại.
                </p>
              </button>
            </div>

            <div className="pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline flex justify-end">
              <button
                type="button"
                onClick={() => setShowScopeModal(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-circle-slate hover:bg-circle-wash transition-colors"
              >
                Hủy thao tác
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
