'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ChevronDown,
  Bell,
  Loader2,
  CalendarDays,
  Users,
  Check,
  HelpCircle,
  Lock,
  AlertCircle,
  Repeat,
  Share2,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import { EventLocationDisplay } from './EventLocationDisplay';
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

export const formatAppleDate = (d: Date) => {
  return `${d.getDate()} thg ${d.getMonth() + 1}, ${d.getFullYear()}`;
};

export const formatTimeOnly = (h: number, m: number) => {
  return `${pad2(h)}:${pad2(m)}`;
};

export const createDateFromParts = (d: Date, h: number, m: number): Date => {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0);
};

export const REPEAT_OPTIONS = [
  { label: 'Không lặp lại', value: 'none' },
  { label: 'Hằng ngày', value: 'daily' },
  { label: 'Hằng tuần', value: 'weekly' },
  { label: 'Hằng tháng', value: 'monthly' },
  { label: 'Hằng năm', value: 'yearly' },
  { label: 'Tùy chỉnh...', value: 'custom' },
];

export const REMINDER_OPTIONS = [
  { label: 'Không nhắc', value: 'none' },
  { label: 'Khi sự kiện diễn ra', value: '0' },
  { label: 'Trước 5 phút', value: '5' },
  { label: 'Trước 15 phút', value: '15' },
  { label: 'Trước 30 phút', value: '30' },
  { label: 'Trước 1 giờ', value: '60' },
  { label: 'Trước 2 giờ', value: '120' },
  { label: 'Trước 1 ngày', value: '1440' },
  { label: 'Trước 2 ngày', value: '2880' },
];

export function serializeRecurrence(config: RecurrenceConfig, baseDesc?: string): string {
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
}

export function parseEventRecurrence(desc?: string | null): {
  cleanDesc: string;
  recurrenceConfig: RecurrenceConfig | null;
} {
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
      return { cleanDesc: cleanDesc.replace(/\[RECURRENCE:[\s\S]*?\]/g, '').replace(/\[Lặp lại:[^\]]*?\]/g, '').trim(), recurrenceConfig: config };
    } catch {
      // Fallback
    }
  }

  // Fallback nếu có tag chữ [Lặp lại: ...]
  if (desc.includes('[Lặp lại:')) {
    cleanDesc = cleanDesc.replace(/\[Lặp lại:[^\]]*?\]/g, '').trim();
  }

  return { cleanDesc, recurrenceConfig };
}

export function isEventOccurringOnDate(ev: CalendarEventEntity, targetDate: Date): boolean {
  const evStart = new Date(ev.startTime);
  const evEnd = ev.endTime ? new Date(ev.endTime) : evStart;

  const targetY = targetDate.getFullYear();
  const targetM = targetDate.getMonth();
  const targetD = targetDate.getDate();

  const dayStartTime = new Date(targetY, targetM, targetD, 0, 0, 0, 0).getTime();
  const dayEndTime = new Date(targetY, targetM, targetD, 23, 59, 59, 999).getTime();

  // Kiểm tra cấu hình lặp lại
  const { recurrenceConfig } = parseEventRecurrence(ev.description);

  // Không có cấu hình lặp lại -> So sánh khoảng thời gian gốc
  if (!recurrenceConfig || recurrenceConfig.frequency === 'none') {
    const startMs = evStart.getTime();
    const endMs = evEnd.getTime();
    return startMs <= dayEndTime && endMs >= dayStartTime;
  }

  // Trường hợp lặp lại (Recurrence)
  // 1. Kiểm tra nếu lần diễn ra này đã bị xóa riêng (excludedDates)
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
}

export function isEventCancelledOnDate(ev: CalendarEventEntity, targetDate: Date): boolean {
  if (ev.isCancelled) return true;
  const { recurrenceConfig } = parseEventRecurrence(ev.description);
  if (!recurrenceConfig) return false;
  const targetDateKey = formatDateKey(targetDate);
  return Boolean(recurrenceConfig.cancelledDates && recurrenceConfig.cancelledDates.includes(targetDateKey));
}

export function formatEventTimeForDate(ev: CalendarEventEntity, targetDate: Date): string {
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
}

interface CircleCalendarViewProps {
  circleId: string;
}

export const CircleCalendarView: React.FC<CircleCalendarViewProps> = ({ circleId }) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const setActiveCircleView = useCircleStore((s) => s.setActiveCircleView);
  const targetCalendarDate = useCircleStore((s) => s.targetCalendarDate);
  const targetCalendarEventId = useCircleStore((s) => s.targetCalendarEventId);
  const setTargetCalendarEvent = useCircleStore((s) => s.setTargetCalendarEvent);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states matching Mobile
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [startHour, setStartHour] = useState<number>(9);
  const [startMinute, setStartMinute] = useState<number>(0);
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [endHour, setEndHour] = useState<number>(10);
  const [endMinute, setEndMinute] = useState<number>(0);
  const [reminderMinutes, setReminderMinutes] = useState('15');

  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>(() =>
    createDefaultRecurrenceConfig(new Date())
  );
  const [customRecConfig, setCustomRecConfig] = useState<RecurrenceConfig>(() =>
    createDefaultRecurrenceConfig(new Date())
  );

  // Pickers and sub-modals state
  const [activePickerTarget, setActivePickerTarget] = useState<
    'none' | 'start_date' | 'start_time' | 'end_date' | 'end_time' | 'end_repeat_date'
  >('none');
  const [pickerYear, setPickerYear] = useState<number>(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState<number>(new Date().getMonth() + 1);

  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isCustomRepeatOpen, setIsCustomRepeatOpen] = useState(false);
  const [isEndRepeatPickerOpen, setIsEndRepeatPickerOpen] = useState(false);

  // Location suggestions state
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationWrapperRef = useRef<HTMLDivElement>(null);

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

  // Debounced location search
  useEffect(() => {
    const trimmed = location.trim();
    if (
      !trimmed ||
      trimmed.length < 2 ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.includes('meet.google.com') ||
      trimmed.includes('google.com/maps')
    ) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const res = await fetch(`/api/locations/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setLocationSuggestions(data);
            setShowLocationSuggestions(true);
          } else {
            setLocationSuggestions([]);
            setShowLocationSuggestions(false);
          }
        }
      } catch (err) {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [location]);

  // Close location suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationWrapperRef.current && !locationWrapperRef.current.contains(e.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrowStart = todayStart + 86400000;
    const weekEnd = todayStart + 7 * 86400000;

    const today: CalendarEventEntity[] = [];
    const tomorrow: CalendarEventEntity[] = [];
    const thisWeek: CalendarEventEntity[] = [];
    const later: CalendarEventEntity[] = [];

    for (const ev of upcomingEvents) {
      const start = new Date(ev.startTime).getTime();
      if (start >= todayStart && start < tomorrowStart) {
        today.push(ev);
      } else if (start >= tomorrowStart && start < tomorrowStart + 86400000) {
        tomorrow.push(ev);
      } else if (start >= tomorrowStart + 86400000 && start < weekEnd) {
        thisWeek.push(ev);
      } else {
        later.push(ev);
      }
    }

    return { today, tomorrow, thisWeek, later };
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
    const curNow = new Date();
    const isToday =
      baseDate.getFullYear() === curNow.getFullYear() &&
      baseDate.getMonth() === curNow.getMonth() &&
      baseDate.getDate() === curNow.getDate();

    const initStartHour = isToday ? Math.min(23, curNow.getHours() + 1) : 9;
    const initStartMinute = 0;
    const initEndHour = Math.min(23, initStartHour + 1);
    const initEndMinute = 0;

    setStartDate(baseDate);
    setStartHour(initStartHour);
    setStartMinute(initStartMinute);

    const initEndDate = new Date(baseDate);
    if (initStartHour === 23) {
      initEndDate.setDate(initEndDate.getDate() + 1);
    }
    setEndDate(initEndDate);
    setEndHour(initEndHour);
    setEndMinute(initEndMinute);

    setRecurrenceConfig(createDefaultRecurrenceConfig(baseDate, initEndDate));
    setActivePickerTarget('none');
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
      setStartDate(occStart);

      const diffDays = Math.round(
        (new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime() -
          new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const occEnd = new Date(selectedDate);
      occEnd.setDate(occEnd.getDate() + Math.max(0, diffDays));
      occEnd.setHours(e.getHours(), e.getMinutes(), 0, 0);
      setEndDate(occEnd);
    } else {
      setStartDate(s);
      setEndDate(e);
    }

    setStartHour(s.getHours());
    setStartMinute(s.getMinutes());
    setEndHour(e.getHours());
    setEndMinute(e.getMinutes());

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

    setActivePickerTarget('none');
    setIsAddModalOpen(true);
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
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
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
      setSubmitError('Vui lòng nhập tiêu đề sự kiện');
      return;
    }

    const start = createDateFromParts(startDate, startHour, startMinute);
    const end = createDateFromParts(endDate, endHour, endMinute);

    if (end.getTime() <= start.getTime()) {
      setSubmitError('Thời gian kết thúc phải sau thời gian bắt đầu');
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
          // Thêm ngày này vào excludedDates của sự kiện lặp gốc
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

          // Tạo sự kiện đơn lẻ riêng biệt cho ngày này
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
          // Cắt chuỗi lặp lại cũ tại ngày hôm trước
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

          // Tạo chuỗi lặp mới từ ngày được chọn trở đi
          await createMutation.mutateAsync({
            eventTitle: title.trim(),
            description: finalDesc,
            location: location.trim() || undefined,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            reminderTime: reminderIso,
          });
        } else {
          // Cập nhật toàn bộ chuỗi
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
        // Chỉ hủy lần này
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

  // Inline Picker toggle
  const togglePicker = (target: 'start_date' | 'start_time' | 'end_date' | 'end_time' | 'end_repeat_date') => {
    if (activePickerTarget === target) {
      setActivePickerTarget('none');
    } else {
      setActivePickerTarget(target);
      if (target === 'start_date') {
        setPickerYear(startDate.getFullYear());
        setPickerMonth(startDate.getMonth() + 1);
      } else if (target === 'end_date') {
        setPickerYear(endDate.getFullYear());
        setPickerMonth(endDate.getMonth() + 1);
      } else if (target === 'end_repeat_date') {
        const base = recurrenceConfig.endDate || startDate;
        setPickerYear(base.getFullYear());
        setPickerMonth(base.getMonth() + 1);
      }
    }
  };

  const currentRepeatLabel = useMemo(() => {
    return formatRecurrenceSummary(recurrenceConfig);
  }, [recurrenceConfig]);

  const currentReminderLabel = useMemo(() => {
    const item = REMINDER_OPTIONS.find((r) => r.value === reminderMinutes);
    return item ? item.label : 'Trước 15 phút';
  }, [reminderMinutes]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Inline Month / Year Nav for Inline DatePicker
  const handleInlinePickerPrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pickerMonth === 1) {
      setPickerMonth(12);
      setPickerYear((y) => y - 1);
    } else {
      setPickerMonth((m) => m - 1);
    }
  };

  const handleInlinePickerNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pickerMonth === 12) {
      setPickerMonth(1);
      setPickerYear((y) => y + 1);
    } else {
      setPickerMonth((m) => m + 1);
    }
  };

  // Render Inline Date Picker (Calendar Grid)
  const renderInlineDatePicker = (
    currentSelectedDate: Date,
    onSelectDate: (d: Date) => void
  ) => {
    const totalDays = new Date(pickerYear, pickerMonth, 0).getDate();
    const rawFirstDay = new Date(pickerYear, pickerMonth - 1, 1).getDay();
    const firstCol = rawFirstDay === 0 ? 7 : rawFirstDay; // 1 = T2, 7 = CN

    return (
      <div className="p-3 bg-white dark:bg-circle-dark-surface border-t border-circle-hairline dark:border-circle-dark-hairline animate-in fade-in duration-100">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60">
          <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
            Tháng {pickerMonth} {pickerYear}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleInlinePickerPrevMonth}
              className="p-1 rounded-md text-circle-slate hover:text-circle-charcoal dark:hover:text-white hover:bg-circle-wash dark:hover:bg-circle-dark-wash"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleInlinePickerNextMonth}
              className="p-1 rounded-md text-circle-slate hover:text-circle-charcoal dark:hover:text-white hover:bg-circle-wash dark:hover:bg-circle-dark-wash"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-circle-slate dark:text-circle-dark-muted mb-1.5">
          <span>T2</span>
          <span>T3</span>
          <span>T4</span>
          <span>T5</span>
          <span>T6</span>
          <span>T7</span>
          <span className="text-rose-500">CN</span>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstCol - 1 }).map((_, i) => (
            <div key={`empty-${i}`} className="h-7 w-7" />
          ))}

          {Array.from({ length: totalDays }).map((_, i) => {
            const dayNum = i + 1;
            const isSel =
              currentSelectedDate.getDate() === dayNum &&
              currentSelectedDate.getMonth() + 1 === pickerMonth &&
              currentSelectedDate.getFullYear() === pickerYear;

            const isToday =
              new Date().getDate() === dayNum &&
              new Date().getMonth() + 1 === pickerMonth &&
              new Date().getFullYear() === pickerYear;

            return (
              <button
                key={`day-${dayNum}`}
                type="button"
                onClick={() => onSelectDate(new Date(pickerYear, pickerMonth - 1, dayNum))}
                className={`h-7 w-7 mx-auto rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  isSel
                    ? 'bg-teal-600 text-white font-bold shadow-xs'
                    : isToday
                    ? 'border border-teal-500 text-teal-600 dark:text-teal-400 font-semibold'
                    : 'text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                }`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Inline Time Picker (Hours & Minutes)
  const renderInlineTimePicker = (
    currentH: number,
    currentM: number,
    onSelectH: (h: number) => void,
    onSelectM: (m: number) => void
  ) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minuteSlots = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

    return (
      <div className="p-3 bg-white dark:bg-circle-dark-surface border-t border-circle-hairline dark:border-circle-dark-hairline animate-in fade-in duration-100">
        <div className="grid grid-cols-2 gap-3">
          {/* Cột Giờ */}
          <div>
            <span className="block text-[11px] font-bold text-circle-slate dark:text-circle-dark-muted mb-1.5 text-center">
              Giờ (24h)
            </span>
            <div className="max-h-44 overflow-y-auto grid grid-cols-4 gap-1 p-1 bg-circle-canvas dark:bg-circle-dark-canvas rounded-xl border border-circle-hairline/80 dark:border-circle-dark-hairline/80">
              {hours.map((h) => {
                const isSel = currentH === h;
                return (
                  <button
                    key={`h-${h}`}
                    type="button"
                    onClick={() => onSelectH(h)}
                    className={`py-1.5 text-center text-xs rounded-lg font-medium transition-colors ${
                      isSel
                        ? 'bg-teal-600 text-white font-bold'
                        : 'text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                    }`}
                  >
                    {pad2(h)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cột Phút */}
          <div>
            <span className="block text-[11px] font-bold text-circle-slate dark:text-circle-dark-muted mb-1.5 text-center">
              Phút
            </span>
            <div className="max-h-44 overflow-y-auto grid grid-cols-3 gap-1 p-1 bg-circle-canvas dark:bg-circle-dark-canvas rounded-xl border border-circle-hairline/80 dark:border-circle-dark-hairline/80">
              {minuteSlots.map((m) => {
                const isSel = currentM === m;
                return (
                  <button
                    key={`m-${m}`}
                    type="button"
                    onClick={() => onSelectM(m)}
                    className={`py-2 text-center text-xs rounded-lg font-medium transition-colors ${
                      isSel
                        ? 'bg-teal-600 text-white font-bold'
                        : 'text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                    }`}
                  >
                    :{pad2(m)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                          ].map(({ status, label, icon: Icon, color }) => {
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
      {/* ADD / EDIT EVENT MODAL (APPLE CALENDAR HIG STYLE - IDENTICAL TO MOBILE) */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-2xl flex flex-col max-h-[92vh] overflow-hidden relative">
            {/* Apple Navigation Bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface sticky top-0 z-20">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
                className="text-sm font-semibold text-circle-slate hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                Hủy
              </button>

              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                {editingEvent ? 'Chỉnh sửa lịch hẹn' : 'Sự kiện mới'}
              </h3>

              <button
                type="button"
                onClick={handleAttemptSubmit}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>{editingEvent ? 'Lưu' : 'Thêm'}</span>
                )}
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
              {/* Group 1: Tiêu đề & Vị trí */}
              <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-slate-50/80 dark:bg-circle-dark-canvas/60 overflow-hidden divide-y divide-circle-hairline/80 dark:divide-circle-dark-hairline/80 shadow-2xs">
                {/* Hàng Tiêu đề */}
                <div className="px-4 py-3 bg-transparent">
                  <input
                    type="text"
                    required
                    placeholder="Tiêu đề"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/60 dark:placeholder:text-circle-dark-muted/60 focus:outline-hidden"
                  />
                </div>

                {/* Hàng Vị trí */}
                <div ref={locationWrapperRef} className="px-4 py-2.5 flex items-center gap-2.5 relative bg-transparent">
                  <MapPin className="h-4 w-4 text-circle-slate dark:text-circle-dark-muted shrink-0" />
                  <input
                    type="text"
                    placeholder="Vị trí hoặc Cuộc gọi video"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/60 dark:placeholder:text-circle-dark-muted/60 focus:outline-hidden"
                  />
                  {isSearchingLocation && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-circle-slate shrink-0" />
                  )}
                  {location.length > 0 && !isSearchingLocation && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocation('');
                        setLocationSuggestions([]);
                        setShowLocationSuggestions(false);
                      }}
                      className="p-1 text-circle-slate hover:text-circle-charcoal"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Autocomplete dropdown */}
                  {showLocationSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-xl p-1.5 space-y-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-circle-slate uppercase tracking-wider">
                        Gợi ý địa điểm từ bản đồ
                      </div>
                      {locationSuggestions.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const name = item.name || item.display_name?.split(',')?.[0] || 'Địa điểm';
                            setLocation(name);
                            setShowLocationSuggestions(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-wash flex items-start gap-2 transition-colors"
                        >
                          <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                              {item.name || item.display_name?.split(',')?.[0]}
                            </p>
                            <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted truncate">
                              {item.display_name}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Group 2: Thời gian (Bắt đầu & Kết thúc) */}
              <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-slate-50/80 dark:bg-circle-dark-canvas/60 overflow-hidden divide-y divide-circle-hairline/80 dark:divide-circle-dark-hairline/80 shadow-2xs">
                {/* Hàng Bắt đầu */}
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                    Bắt đầu
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePicker('start_date')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        activePickerTarget === 'start_date'
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/20'
                          : 'border-circle-hairline bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash'
                      }`}
                    >
                      {formatDateOnly(startDate)}
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePicker('start_time')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        activePickerTarget === 'start_time'
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/20'
                          : 'border-circle-hairline bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash'
                      }`}
                    >
                      {formatTimeOnly(startHour, startMinute)}
                    </button>
                  </div>
                </div>

                {/* Inline DatePicker Bắt đầu */}
                {activePickerTarget === 'start_date' &&
                  renderInlineDatePicker(startDate, (d) => {
                    setStartDate(d);
                    if (endDate.getTime() < d.getTime()) {
                      setEndDate(d);
                    }
                  })}

                {/* Inline TimePicker Bắt đầu */}
                {activePickerTarget === 'start_time' &&
                  renderInlineTimePicker(startHour, startMinute, setStartHour, setStartMinute)}

                {/* Hàng Kết thúc */}
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                    Kết thúc
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePicker('end_date')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        activePickerTarget === 'end_date'
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/20'
                          : 'border-circle-hairline bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash'
                      }`}
                    >
                      {formatDateOnly(endDate)}
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePicker('end_time')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        activePickerTarget === 'end_time'
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/20'
                          : 'border-circle-hairline bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash'
                      }`}
                    >
                      {formatTimeOnly(endHour, endMinute)}
                    </button>
                  </div>
                </div>

                {/* Inline DatePicker Kết thúc */}
                {activePickerTarget === 'end_date' &&
                  renderInlineDatePicker(endDate, (d) => {
                    setEndDate(d);
                  })}

                {/* Inline TimePicker Kết thúc */}
                {activePickerTarget === 'end_time' &&
                  renderInlineTimePicker(endHour, endMinute, setEndHour, setEndMinute)}
              </div>

              {/* Group 3: Cấu hình Lặp lại (Recurrence) */}
              <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-slate-50/80 dark:bg-circle-dark-canvas/60 overflow-hidden divide-y divide-circle-hairline/80 dark:divide-circle-dark-hairline/80 shadow-2xs">
                {/* Hàng Lặp lại */}
                <button
                  type="button"
                  onClick={() => setIsRepeatModalOpen(true)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-circle-wash/50 transition-colors"
                >
                  <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text shrink-0">
                    Lặp lại
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-circle-slate dark:text-circle-dark-muted max-w-[280px] text-right truncate">
                    <span className="truncate">{currentRepeatLabel}</span>
                    <ChevronRight className="h-4 w-4 text-circle-slate/60 shrink-0" />
                  </div>
                </button>

                {/* Hàng Kết thúc lặp lại */}
                {recurrenceConfig.frequency !== 'none' && (
                  <>
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                        Kết thúc lặp
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => togglePicker('end_repeat_date')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            activePickerTarget === 'end_repeat_date'
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/20'
                              : 'border-circle-hairline bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash'
                          }`}
                        >
                          {recurrenceConfig.endDate
                            ? formatDateOnly(recurrenceConfig.endDate)
                            : 'Không giới hạn'}
                        </button>
                        {Boolean(recurrenceConfig.endDate) && (
                          <button
                            type="button"
                            onClick={() => {
                              setRecurrenceConfig((prev) => ({
                                ...prev,
                                endType: 'never',
                                endDate: null,
                              }));
                              setActivePickerTarget('none');
                            }}
                            className="p-1 text-circle-slate hover:text-circle-charcoal"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {activePickerTarget === 'end_repeat_date' &&
                      renderInlineDatePicker(recurrenceConfig.endDate || startDate, (d) => {
                        setRecurrenceConfig((prev) => ({
                          ...prev,
                          endType: 'on_date',
                          endDate: d,
                        }));
                      })}
                  </>
                )}
              </div>

              {/* Group 4: Nhắc trước & Ghi chú */}
              <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-slate-50/80 dark:bg-circle-dark-canvas/60 overflow-hidden divide-y divide-circle-hairline/80 dark:divide-circle-dark-hairline/80 shadow-2xs">
                {/* Hàng Nhắc trước */}
                <button
                  type="button"
                  onClick={() => setIsReminderModalOpen(true)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-circle-wash/50 transition-colors"
                >
                  <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text shrink-0">
                    Nhắc trước
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-circle-slate dark:text-circle-dark-muted">
                    <span>{currentReminderLabel}</span>
                    <ChevronRight className="h-4 w-4 text-circle-slate/60 shrink-0" />
                  </div>
                </button>

                {/* Hàng Ghi chú */}
                <div className="px-4 py-3 bg-transparent">
                  <textarea
                    rows={3}
                    placeholder="Ghi chú"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-transparent text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/60 dark:placeholder:text-circle-dark-muted/60 focus:outline-hidden resize-none"
                  />
                </div>
              </div>

              {submitError && (
                <div className="flex items-center gap-1.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* SUB-MODAL 1: CHỌN LẶP LẠI (IN-MODAL OVERLAY) */}
            {/* ============================================================== */}
            {isRepeatModalOpen && (
              <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="w-full max-w-sm rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-4 shadow-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-circle-hairline dark:border-circle-dark-hairline">
                    <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                      Lặp lại
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsRepeatModalOpen(false)}
                      className="text-xs font-bold text-circle-primary hover:underline"
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="divide-y divide-circle-hairline dark:divide-circle-dark-hairline max-h-64 overflow-y-auto">
                    {REPEAT_OPTIONS.map((item) => {
                      const isSelected =
                        item.value === 'custom'
                          ? Boolean(recurrenceConfig.isCustom)
                          : !recurrenceConfig.isCustom && recurrenceConfig.frequency === item.value;

                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setIsRepeatModalOpen(false);
                            if (item.value === 'custom') {
                              const baseWk = getDefaultWeeklyDays(startDate, endDate);
                              const baseDay = startDate.getDate();
                              const baseMonth = startDate.getMonth() + 1;
                              const baseOrder = getNthOrderFromDate(startDate);
                              setCustomRecConfig({
                                ...recurrenceConfig,
                                frequency:
                                  recurrenceConfig.frequency === 'none'
                                    ? 'weekly'
                                    : recurrenceConfig.frequency,
                                interval: Math.max(1, recurrenceConfig.interval || 1),
                                weeklyDays:
                                  recurrenceConfig.weeklyDays.length > 0
                                    ? recurrenceConfig.weeklyDays
                                    : baseWk,
                                monthlyDay: recurrenceConfig.monthlyDay || baseDay,
                                monthlyNthWeekday:
                                  recurrenceConfig.monthlyNthWeekday || getWeekdayNumber(startDate),
                                monthlyNthOrder: recurrenceConfig.monthlyNthOrder || baseOrder,
                                yearlyDay: recurrenceConfig.yearlyDay || baseDay,
                                yearlyMonth: recurrenceConfig.yearlyMonth || baseMonth,
                                yearlyNthWeekday:
                                  recurrenceConfig.yearlyNthWeekday || getWeekdayNumber(startDate),
                                yearlyNthOrder: recurrenceConfig.yearlyNthOrder || baseOrder,
                                yearlyNthMonth: recurrenceConfig.yearlyNthMonth || baseMonth,
                                isCustom: true,
                              });
                              setIsCustomRepeatOpen(true);
                              return;
                            }

                            const nextFreq = item.value as RecurrenceFrequency;
                            if (nextFreq === 'none') {
                              setRecurrenceConfig((prev) => ({
                                ...prev,
                                frequency: 'none',
                                isCustom: false,
                              }));
                            } else {
                              const baseWk = getDefaultWeeklyDays(startDate, endDate);
                              const baseDay = startDate.getDate();
                              const baseMonth = startDate.getMonth() + 1;
                              const baseOrder = getNthOrderFromDate(startDate);
                              setRecurrenceConfig((prev) => ({
                                ...prev,
                                frequency: nextFreq,
                                interval: 1,
                                weeklyDays: baseWk,
                                monthlyType: 'day_of_month',
                                monthlyDay: baseDay,
                                monthlyNthWeekday: getWeekdayNumber(startDate),
                                monthlyNthOrder: baseOrder,
                                yearlyType: 'specific_date',
                                yearlyDay: baseDay,
                                yearlyMonth: baseMonth,
                                yearlyNthWeekday: getWeekdayNumber(startDate),
                                yearlyNthOrder: baseOrder,
                                yearlyNthMonth: baseMonth,
                                isCustom: false,
                              }));
                            }
                          }}
                          className="w-full py-2.5 px-2 flex items-center justify-between text-left hover:bg-circle-wash dark:hover:bg-circle-dark-wash rounded-lg transition-colors"
                        >
                          <span
                            className={`text-xs ${
                              isSelected
                                ? 'font-bold text-teal-600 dark:text-teal-400'
                                : 'text-circle-charcoal dark:text-circle-dark-text'
                            }`}
                          >
                            {item.label}
                          </span>
                          {isSelected && <Check className="h-4 w-4 text-teal-600 dark:text-teal-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SUB-MODAL 2: CHỌN NHẮC TRƯỚC (IN-MODAL OVERLAY) */}
            {/* ============================================================== */}
            {isReminderModalOpen && (
              <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="w-full max-w-sm rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-4 shadow-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-circle-hairline dark:border-circle-dark-hairline">
                    <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                      Nhắc trước
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsReminderModalOpen(false)}
                      className="text-xs font-bold text-circle-primary hover:underline"
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="divide-y divide-circle-hairline dark:divide-circle-dark-hairline max-h-64 overflow-y-auto">
                    {REMINDER_OPTIONS.map((item) => {
                      const isSelected = reminderMinutes === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setReminderMinutes(item.value);
                            setIsReminderModalOpen(false);
                          }}
                          className="w-full py-2.5 px-2 flex items-center justify-between text-left hover:bg-circle-wash dark:hover:bg-circle-dark-wash rounded-lg transition-colors"
                        >
                          <span
                            className={`text-xs ${
                              isSelected
                                ? 'font-bold text-teal-600 dark:text-teal-400'
                                : 'text-circle-charcoal dark:text-circle-dark-text'
                            }`}
                          >
                            {item.label}
                          </span>
                          {isSelected && <Check className="h-4 w-4 text-teal-600 dark:text-teal-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SUB-MODAL 3: TÙY CHỈNH LẶP LẠI (CUSTOM RECURRENCE VIEW) */}
            {/* ============================================================== */}
            {isCustomRepeatOpen && (
              <div className="absolute inset-0 z-40 bg-white dark:bg-circle-dark-surface flex flex-col animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface sticky top-0 z-10">
                  <button
                    type="button"
                    onClick={() => setIsCustomRepeatOpen(false)}
                    className="text-sm font-semibold text-circle-slate hover:text-rose-600 transition-colors"
                  >
                    Hủy
                  </button>

                  <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                    Tùy chỉnh
                  </h4>

                  <button
                    type="button"
                    onClick={() => {
                      setRecurrenceConfig({
                        ...customRecConfig,
                        isCustom: true,
                      });
                      setIsCustomRepeatOpen(false);
                    }}
                    className="text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    Xong
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
                  {/* Card 1: Chu kỳ & Khoảng cách lặp */}
                  <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-slate-50/80 dark:bg-circle-dark-canvas/60 overflow-hidden divide-y divide-circle-hairline/80 dark:divide-circle-dark-hairline/80 shadow-2xs">
                    {/* Hàng Chu kỳ */}
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                        Chu kỳ
                      </span>
                      <div className="flex items-center rounded-xl bg-circle-wash dark:bg-circle-dark-wash p-1 border border-circle-hairline dark:border-circle-dark-hairline">
                        {[
                          { key: 'daily', label: 'Ngày' },
                          { key: 'weekly', label: 'Tuần' },
                          { key: 'monthly', label: 'Tháng' },
                          { key: 'yearly', label: 'Năm' },
                        ].map((seg) => {
                          const isSel = customRecConfig.frequency === seg.key;
                          return (
                            <button
                              key={seg.key}
                              type="button"
                              onClick={() =>
                                setCustomRecConfig((prev) => ({
                                  ...prev,
                                  frequency: seg.key as RecurrenceFrequency,
                                }))
                              }
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                                isSel
                                  ? 'bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text shadow-2xs'
                                  : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal'
                              }`}
                            >
                              {seg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Hàng Khoảng cách lặp */}
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                        Khoảng cách lặp
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setCustomRecConfig((prev) => ({
                              ...prev,
                              interval: Math.max(1, prev.interval - 1),
                            }))
                          }
                          className="h-7 w-7 rounded-lg border border-circle-hairline bg-white dark:bg-circle-dark-surface flex items-center justify-center text-teal-600 hover:bg-circle-wash transition-colors"
                        >
                          <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={customRecConfig.interval || 1}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setCustomRecConfig((prev) => ({
                              ...prev,
                              interval: isNaN(val) ? 1 : Math.max(1, Math.min(99, val)),
                            }));
                          }}
                          className="w-10 text-center font-bold text-xs bg-white dark:bg-circle-dark-surface border border-circle-hairline rounded-lg py-1 text-circle-charcoal dark:text-circle-dark-text"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setCustomRecConfig((prev) => ({
                              ...prev,
                              interval: Math.min(99, prev.interval + 1),
                            }))
                          }
                          className="h-7 w-7 rounded-lg border border-circle-hairline bg-white dark:bg-circle-dark-surface flex items-center justify-center text-teal-600 hover:bg-circle-wash transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                        <span className="text-xs text-circle-slate dark:text-circle-dark-muted ml-1">
                          {customRecConfig.frequency === 'daily' && 'ngày'}
                          {customRecConfig.frequency === 'weekly' && 'tuần'}
                          {customRecConfig.frequency === 'monthly' && 'tháng'}
                          {customRecConfig.frequency === 'yearly' && 'năm'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Chi tiết theo chu kỳ */}
                  {customRecConfig.frequency === 'weekly' && (
                    <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-slate-50/80 dark:bg-circle-dark-canvas/60 p-4 shadow-2xs space-y-3">
                      <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                        Vào các ngày trong tuần
                      </span>
                      <div className="grid grid-cols-7 gap-1.5">
                        {[
                          { w: 1, label: 'T2' },
                          { w: 2, label: 'T3' },
                          { w: 3, label: 'T4' },
                          { w: 4, label: 'T5' },
                          { w: 5, label: 'T6' },
                          { w: 6, label: 'T7' },
                          { w: 7, label: 'CN' },
                        ].map(({ w, label }) => {
                          const isSel = customRecConfig.weeklyDays.includes(w);
                          return (
                            <button
                              key={w}
                              type="button"
                              onClick={() =>
                                setCustomRecConfig((prev) => {
                                  const exists = prev.weeklyDays.includes(w);
                                  if (exists && prev.weeklyDays.length === 1) return prev;
                                  const next = exists
                                    ? prev.weeklyDays.filter((d) => d !== w)
                                    : [...prev.weeklyDays, w];
                                  return { ...prev, weeklyDays: next };
                                })
                              }
                              className={`h-9 rounded-xl flex items-center justify-center text-xs font-semibold transition-all border ${
                                isSel
                                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                                  : 'border-circle-hairline bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {customRecConfig.frequency === 'monthly' && (
                    <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-slate-50/80 dark:bg-circle-dark-canvas/60 p-4 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                          Quy tắc lặp
                        </span>
                        <div className="flex items-center rounded-xl bg-circle-wash dark:bg-circle-dark-wash p-1 border border-circle-hairline">
                          <button
                            type="button"
                            onClick={() =>
                              setCustomRecConfig((prev) => ({
                                ...prev,
                                monthlyType: 'day_of_month',
                              }))
                            }
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                              customRecConfig.monthlyType === 'day_of_month'
                                ? 'bg-white dark:bg-circle-dark-surface text-circle-charcoal shadow-2xs'
                                : 'text-circle-slate'
                            }`}
                          >
                            Theo ngày
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCustomRecConfig((prev) => ({
                                ...prev,
                                monthlyType: 'nth_weekday',
                              }))
                            }
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                              customRecConfig.monthlyType === 'nth_weekday'
                                ? 'bg-white dark:bg-circle-dark-surface text-circle-charcoal shadow-2xs'
                                : 'text-circle-slate'
                            }`}
                          >
                            Theo thứ
                          </button>
                        </div>
                      </div>

                      {customRecConfig.monthlyType === 'day_of_month' ? (
                        <div>
                          <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mb-2">
                            Chọn ngày trong tháng:
                          </p>
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() =>
                                  setCustomRecConfig((prev) => ({
                                    ...prev,
                                    monthlyDay: d,
                                  }))
                                }
                                className={`h-7 rounded-lg text-xs font-medium transition-colors border ${
                                  customRecConfig.monthlyDay === d
                                    ? 'bg-teal-600 text-white border-teal-600 font-bold'
                                    : 'border-circle-hairline bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash'
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-circle-slate mb-1">
                              Thứ tự
                            </label>
                            <select
                              value={customRecConfig.monthlyNthOrder}
                              onChange={(e) =>
                                setCustomRecConfig((prev) => ({
                                  ...prev,
                                  monthlyNthOrder: e.target.value as NthWeekdayOrder,
                                }))
                              }
                              className="w-full text-xs font-semibold rounded-xl border border-circle-hairline bg-white dark:bg-circle-dark-surface p-2 text-circle-charcoal dark:text-circle-dark-text"
                            >
                              <option value="first">Đầu tiên</option>
                              <option value="second">Thứ hai</option>
                              <option value="third">Thứ ba</option>
                              <option value="fourth">Thứ tư</option>
                              <option value="last">Cuối cùng</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-circle-slate mb-1">
                              Thứ trong tuần
                            </label>
                            <select
                              value={customRecConfig.monthlyNthWeekday}
                              onChange={(e) =>
                                setCustomRecConfig((prev) => ({
                                  ...prev,
                                  monthlyNthWeekday: Number(e.target.value),
                                }))
                              }
                              className="w-full text-xs font-semibold rounded-xl border border-circle-hairline bg-white dark:bg-circle-dark-surface p-2 text-circle-charcoal dark:text-circle-dark-text"
                            >
                              <option value={1}>Thứ Hai</option>
                              <option value={2}>Thứ Ba</option>
                              <option value={3}>Thứ Tư</option>
                              <option value={4}>Thứ Năm</option>
                              <option value={5}>Thứ Sáu</option>
                              <option value={6}>Thứ Bảy</option>
                              <option value={7}>Chủ Nhật</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {customRecConfig.frequency === 'yearly' && (
                    <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-slate-50/80 dark:bg-circle-dark-canvas/60 p-4 shadow-2xs space-y-3">
                      <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                        Vào ngày / tháng
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-circle-slate mb-1">
                            Ngày
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={31}
                            value={customRecConfig.yearlyDay}
                            onChange={(e) =>
                              setCustomRecConfig((prev) => ({
                                ...prev,
                                yearlyDay: Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 1)),
                              }))
                            }
                            className="w-full text-xs font-semibold rounded-xl border border-circle-hairline bg-white dark:bg-circle-dark-surface p-2 text-circle-charcoal dark:text-circle-dark-text"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-circle-slate mb-1">
                            Tháng
                          </label>
                          <select
                            value={customRecConfig.yearlyMonth}
                            onChange={(e) =>
                              setCustomRecConfig((prev) => ({
                                ...prev,
                                yearlyMonth: Number(e.target.value),
                              }))
                            }
                            className="w-full text-xs font-semibold rounded-xl border border-circle-hairline bg-white dark:bg-circle-dark-surface p-2 text-circle-charcoal dark:text-circle-dark-text"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                              <option key={m} value={m}>
                                Tháng {m}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SUB-MODAL 4: SCOPE CONFIRMATION (CHỈNH SỬA SỰ KIỆN LẶP LẠI) */}
            {/* ============================================================== */}
            {showScopeModal && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="w-full max-w-sm rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-5 shadow-2xl space-y-4">
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
                      className="w-full text-left p-3 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-slate-50 dark:bg-circle-dark-canvas hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-all"
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
                      className="w-full text-left p-3 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-slate-50 dark:bg-circle-dark-canvas hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-all"
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
                      className="w-full text-left p-3 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-slate-50 dark:bg-circle-dark-canvas hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-all"
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
        </div>
      )}
    </div>
  );
};
