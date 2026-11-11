import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Plus,
  Minus,
  Clock,
  MapPin,
  Ban,
  Video,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bell,
  CalendarDays,
  AlertCircle,
  Check,
  HelpCircle,
  Search,
  Info,
  Repeat,
  Trash2,
  Pencil,
  Users,
} from 'lucide-react-native';
import {
  getCalendarEventsApi,
  createCalendarEventApi,
  updateCalendarEventApi,
  cancelCalendarEventApi,
  deleteCalendarEventApi,
  respondEventRsvpApi,
} from '../../services/circle-tools.service';
import { getMobileSocket } from '../../services/socket';
import { CalendarEventEntity, EventRsvpStatus } from '@circle/types';
import { TranslationDictionary } from '@circle/shared';
import { ColorTheme } from '../../constants/theme';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useAuthStore } from '../../stores/auth.store';

const isCallUrl = (loc?: string | null): boolean => {
  if (!loc) return false;
  return /(meet\.google\.com|zoom\.us|teams\.microsoft\.com|call|video|facetime|webex)/i.test(loc);
};

const extractLocationUrl = (loc?: string | null): string | null => {
  if (!loc) return null;
  const match = loc.match(
    /(https?:\/\/[^\s]+|(?:meet\.google\.com|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl\/maps)\/[^\s]+)/i,
  );
  if (!match) return null;
  return match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
};

const cleanLocationText = (loc: string | null | undefined, t: TranslationDictionary): string => {
  if (!loc) return '';
  const cleaned = loc
    .replace(/https?:\/\/[^\s]+/g, '')
    .trim()
    .replace(/\s*[-–—:]+\s*$/g, '')
    .trim();
  if (!cleaned) {
    if (/meet\.google\.com/i.test(loc)) return 'Google Meet';
    if (/zoom\.us/i.test(loc)) return 'Zoom';
    if (/teams\.microsoft\.com/i.test(loc)) return 'Microsoft Teams';
    if (/maps/i.test(loc)) return t.collab.locationOnMapFallback;
    return t.collab.locationViewLinkFallback;
  }
  return cleaned;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type NthWeekdayOrder = 'first' | 'second' | 'third' | 'fourth' | 'last';
export type MonthlyType = 'day_of_month' | 'nth_weekday';
export type YearlyType = 'specific_date' | 'nth_weekday';
export type RecurrenceEndType = 'never' | 'on_date';

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval: number;
  weeklyDays: number[]; // 1 = Mon ... 7 = Sun
  monthlyType: MonthlyType;
  monthlyDay: number;
  monthlyNthOrder: NthWeekdayOrder;
  monthlyNthWeekday: number;
  yearlyType: YearlyType;
  yearlyDay: number;
  yearlyMonth: number;
  yearlyNthOrder: NthWeekdayOrder;
  yearlyNthWeekday: number;
  yearlyNthMonth: number;
  endType: RecurrenceEndType;
  endDate: Date | null;
  isCustom?: boolean;
}

const getWeekdayInfo = (
  t: TranslationDictionary,
): Record<number, { full: string; short: string }> => ({
  1: { full: t.collab.calendarWeekdayMonFull, short: t.collab.weekdayMon },
  2: { full: t.collab.calendarWeekdayTueFull, short: t.collab.weekdayTue },
  3: { full: t.collab.calendarWeekdayWedFull, short: t.collab.weekdayWed },
  4: { full: t.collab.calendarWeekdayThuFull, short: t.collab.weekdayThu },
  5: { full: t.collab.calendarWeekdayFriFull, short: t.collab.weekdayFri },
  6: { full: t.collab.calendarWeekdaySatFull, short: t.collab.weekdaySat },
  7: { full: t.collab.calendarWeekdaySunFull, short: t.collab.weekdaySun },
});

const getNthOrderLowerInfo = (t: TranslationDictionary): Record<NthWeekdayOrder, string> => ({
  first: t.collab.calendarOrderFirstLower,
  second: t.collab.calendarOrderSecondLower,
  third: t.collab.calendarOrderThirdLower,
  fourth: t.collab.calendarOrderFourthLower,
  last: t.collab.calendarOrderLastLower,
});

const getMonthShortLabels = (t: TranslationDictionary): string[] => [
  t.collab.monthShort1,
  t.collab.monthShort2,
  t.collab.monthShort3,
  t.collab.monthShort4,
  t.collab.monthShort5,
  t.collab.monthShort6,
  t.collab.monthShort7,
  t.collab.monthShort8,
  t.collab.monthShort9,
  t.collab.monthShort10,
  t.collab.monthShort11,
  t.collab.monthShort12,
];

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
    if (!result.includes(wk)) result.push(wk);
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

export const formatRecurrenceSummary = (
  config: RecurrenceConfig,
  t: TranslationDictionary,
): string => {
  if (config.frequency === 'none') {
    return t.collab.recurrenceNever;
  }

  const weekdayInfo = getWeekdayInfo(t);
  const nthOrderInfo = getNthOrderLowerInfo(t);
  const monthLabels = getMonthShortLabels(t);
  const interval = Math.max(1, config.interval || 1);

  if (config.frequency === 'daily') {
    return interval === 1
      ? t.collab.recurrenceDaily
      : t.collab.calendarEveryNDays.replace('{n}', String(interval));
  }

  if (config.frequency === 'weekly') {
    const daysStr = [...config.weeklyDays]
      .sort((a, b) => a - b)
      .map((d) => weekdayInfo[d]?.short || String(d))
      .join(', ');
    if (interval === 1) {
      return daysStr
        ? t.collab.calendarWeeklyOn.replace('{days}', daysStr)
        : t.collab.recurrenceWeekly;
    }
    return daysStr
      ? t.collab.calendarEveryNWeeksOn
          .replace('{n}', String(interval))
          .replace('{days}', daysStr)
      : t.collab.calendarEveryNWeeks.replace('{n}', String(interval));
  }

  if (config.frequency === 'monthly') {
    if (config.monthlyType === 'day_of_month') {
      return interval === 1
        ? t.collab.calendarMonthlyOnDay.replace('{day}', String(config.monthlyDay))
        : t.collab.calendarEveryNMonthsOnDay
            .replace('{n}', String(interval))
            .replace('{day}', String(config.monthlyDay));
    }
    const orderName = nthOrderInfo[config.monthlyNthOrder] || '';
    const dayName = weekdayInfo[config.monthlyNthWeekday]?.full || '';
    return interval === 1
      ? t.collab.calendarMonthlyOnNth.replace('{day}', dayName).replace('{order}', orderName)
      : t.collab.calendarEveryNMonthsOnNth
          .replace('{n}', String(interval))
          .replace('{day}', dayName)
          .replace('{order}', orderName);
  }

  if (config.frequency === 'yearly') {
    if (config.yearlyType === 'specific_date') {
      return interval === 1
        ? t.collab.calendarYearlyOnDate
            .replace('{day}', String(config.yearlyDay))
            .replace('{month}', String(config.yearlyMonth))
        : t.collab.calendarEveryNYearsOnDate
            .replace('{n}', String(interval))
            .replace('{day}', String(config.yearlyDay))
            .replace('{month}', String(config.yearlyMonth));
    }
    const orderName = nthOrderInfo[config.yearlyNthOrder] || '';
    const dayName = weekdayInfo[config.yearlyNthWeekday]?.full || '';
    const monthName =
      monthLabels[(config.yearlyNthMonth || 1) - 1] ||
      `${t.collab.monthShortPrefix} ${config.yearlyNthMonth}`;
    return interval === 1
      ? t.collab.calendarYearlyOnNth
          .replace('{day}', dayName)
          .replace('{order}', orderName)
          .replace('{monthName}', monthName)
      : t.collab.calendarEveryNYearsOnNth
          .replace('{n}', String(interval))
          .replace('{day}', dayName)
          .replace('{order}', orderName)
          .replace('{monthName}', monthName);
  }

  return t.collab.recurrenceNever;
};

export const createDefaultRecurrenceConfig = (
  baseDate: Date,
  endDate?: Date,
): RecurrenceConfig => {
  const dayNum = baseDate.getDate();
  const monthNum = baseDate.getMonth() + 1;
  const weekday = getWeekdayNumber(baseDate);
  const nthOrder = getNthOrderFromDate(baseDate);
  const initialWeeklyDays = endDate ? getDefaultWeeklyDays(baseDate, endDate) : [weekday];

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
  };
};

const formatDateOnly = (d: Date, dateLocale: string) =>
  d.toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatTimeOnly = (h: number, m: number) => `${pad2(h)}:${pad2(m)}`;

const createDateFromParts = (d: Date, h: number, m: number): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0);

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const YEARS = Array.from({ length: 35 }, (_, i) => 2015 + i);

const WHEEL_ITEM_HEIGHT = 38;
const WHEEL_VISIBLE_HEIGHT = 228;
const WHEEL_PADDING = (WHEEL_VISIBLE_HEIGHT - WHEEL_ITEM_HEIGHT) / 2;

export function parseEventRecurrence(desc?: string | null): {
  cleanDesc: string;
  recurrenceConfig: RecurrenceConfig | null;
} {
  if (!desc) return { cleanDesc: '', recurrenceConfig: null };
  const match = desc.match(/\[RECURRENCE:(.*?)\]/);
  if (match) {
    try {
      const raw = JSON.parse(match[1]);
      const config: RecurrenceConfig = {
        frequency: raw.frequency || 'none',
        interval: raw.interval || 1,
        weeklyDays: raw.weeklyDays || [],
        monthlyType: raw.monthlyType || 'day_of_month',
        monthlyDay: raw.monthlyDay || 1,
        monthlyNthOrder: raw.monthlyNthOrder || 'first',
        monthlyNthWeekday: raw.monthlyNthWeekday || 1,
        yearlyType: raw.yearlyType || 'specific_date',
        yearlyMonth: raw.yearlyMonth || 1,
        yearlyNthMonth: raw.yearlyNthMonth || raw.yearlyMonth || 1,
        yearlyDay: raw.yearlyDay || 1,
        yearlyNthOrder: raw.yearlyNthOrder || 'first',
        yearlyNthWeekday: raw.yearlyNthWeekday || 1,
        endType: raw.endType || 'never',
        endDate: raw.endDate ? new Date(raw.endDate) : null,
        isCustom: true,
      };
      const cleanDesc = desc
        .replace(/\[RECURRENCE:.*?\]/g, '')
        .replace(/\[(Lặp lại|Repeat):.*?\]/g, '')
        .trim();
      return { cleanDesc, recurrenceConfig: config };
    } catch {
      // ignore parse error
    }
  }
  const cleanDesc = desc.replace(/\[(Lặp lại|Repeat):.*?\]/g, '').trim();
  return { cleanDesc, recurrenceConfig: null };
}

export function isEventOccurringOnDate(ev: CalendarEventEntity, targetDate: Date): boolean {
  const targetY = targetDate.getFullYear();
  const targetM = targetDate.getMonth();
  const targetD = targetDate.getDate();
  const targetTime = new Date(targetY, targetM, targetD).getTime();

  const startDate = new Date(ev.startTime);
  const startDayTime = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  ).getTime();

  if (targetTime < startDayTime) return false;

  const { recurrenceConfig } = parseEventRecurrence(ev.description);

  if (!recurrenceConfig || recurrenceConfig.frequency === 'none') {
    const endDate = ev.endTime ? new Date(ev.endTime) : startDate;
    const endDayTime = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
    ).getTime();
    return targetTime >= startDayTime && targetTime <= endDayTime;
  }

  if (recurrenceConfig.endType === 'on_date' && recurrenceConfig.endDate) {
    const repeatEndDate = new Date(recurrenceConfig.endDate);
    const repeatEndDayTime = new Date(
      repeatEndDate.getFullYear(),
      repeatEndDate.getMonth(),
      repeatEndDate.getDate(),
    ).getTime();
    if (targetTime > repeatEndDayTime) return false;
  }

  const diffDays = Math.round((targetTime - startDayTime) / (24 * 60 * 60 * 1000));
  const interval = Math.max(1, recurrenceConfig.interval || 1);

  switch (recurrenceConfig.frequency) {
    case 'daily':
      return diffDays >= 0 && diffDays % interval === 0;

    case 'weekly': {
      const dayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay();
      const weeklyDays =
        recurrenceConfig.weeklyDays && recurrenceConfig.weeklyDays.length > 0
          ? recurrenceConfig.weeklyDays
          : [startDate.getDay() === 0 ? 7 : startDate.getDay()];

      if (!weeklyDays.includes(dayOfWeek)) return false;

      const diffWeeks = Math.floor(diffDays / 7);
      return diffWeeks >= 0 && diffWeeks % interval === 0;
    }

    case 'monthly': {
      if (recurrenceConfig.monthlyType === 'day_of_month') {
        const dayOfMonth = recurrenceConfig.monthlyDay || startDate.getDate();
        if (targetD !== dayOfMonth) return false;
        const diffMonths =
          (targetY - startDate.getFullYear()) * 12 + (targetM - startDate.getMonth());
        return diffMonths >= 0 && diffMonths % interval === 0;
      }
      return targetD === startDate.getDate();
    }

    case 'yearly': {
      if (targetD === startDate.getDate() && targetM === startDate.getMonth()) {
        const diffYears = targetY - startDate.getFullYear();
        return diffYears >= 0 && diffYears % interval === 0;
      }
      return false;
    }

    default:
      return false;
  }
}

export function formatEventTimeForDate(
  ev: CalendarEventEntity,
  targetDate: Date,
  dateLocale: string,
): string {
  const evStart = new Date(ev.startTime);
  const evEnd = ev.endTime ? new Date(ev.endTime) : evStart;

  const targetDayTime = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
  ).getTime();
  const startDayTime = new Date(
    evStart.getFullYear(),
    evStart.getMonth(),
    evStart.getDate(),
  ).getTime();
  const endDayTime = new Date(
    evEnd.getFullYear(),
    evEnd.getMonth(),
    evEnd.getDate(),
  ).getTime();

  const startHourStr = evStart.toLocaleTimeString(dateLocale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const endHourStr = evEnd.toLocaleTimeString(dateLocale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (startDayTime === endDayTime) {
    return ev.endTime ? `${startHourStr} – ${endHourStr}` : startHourStr;
  }
  if (targetDayTime === startDayTime) {
    return `${startHourStr} – 23:59`;
  }
  if (targetDayTime === endDayTime) {
    return `00:00 – ${endHourStr}`;
  }
  if (targetDayTime > startDayTime && targetDayTime < endDayTime) {
    return '00:00 – 23:59';
  }

  return ev.endTime ? `${startHourStr} – ${endHourStr}` : startHourStr;
}

interface MobileCalendarViewProps {
  circleId: string;
}

export const MobileCalendarView: React.FC<MobileCalendarViewProps> = ({ circleId }) => {
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { t, locale } = useLanguageStore();
  const currentUser = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();
  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  const topClearance = Math.max(insets.top + 52, Platform.OS === 'ios' ? 74 : 64);
  const bottomClearance = Math.max(insets.bottom + 16, 24);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const monthShortLabels = useMemo(() => getMonthShortLabels(t), [t]);
  const weekdayShortSunFirst = useMemo(
    () => [
      t.collab.weekdaySun,
      t.collab.weekdayMon,
      t.collab.weekdayTue,
      t.collab.weekdayWed,
      t.collab.weekdayThu,
      t.collab.weekdayFri,
      t.collab.weekdaySat,
    ],
    [t],
  );
  const weekdayMinSunFirst = useMemo(
    () => [
      t.collab.calendarWeekdayMinSun,
      t.collab.calendarWeekdayMinMon,
      t.collab.calendarWeekdayMinTue,
      t.collab.calendarWeekdayMinWed,
      t.collab.calendarWeekdayMinThu,
      t.collab.calendarWeekdayMinFri,
      t.collab.calendarWeekdayMinSat,
    ],
    [t],
  );
  const repeatOptions = useMemo(
    () => [
      { label: t.collab.recurrenceNever, value: 'none' },
      { label: t.collab.recurrenceDaily, value: 'daily' },
      { label: t.collab.recurrenceWeekly, value: 'weekly' },
      { label: t.collab.recurrenceMonthly, value: 'monthly' },
      { label: t.collab.recurrenceYearly, value: 'yearly' },
      { label: t.collab.calendarRepeatCustom, value: 'custom' },
    ],
    [t],
  );
  const reminderOptions = useMemo(
    () => [
      { label: t.collab.calendarReminderNone, value: 'none' },
      { label: t.collab.calendarReminderAtEvent, value: '0' },
      { label: t.collab.calendarReminder5m, value: '5' },
      { label: t.collab.calendarReminder15m, value: '15' },
      { label: t.collab.calendarReminder30m, value: '30' },
      { label: t.collab.calendarReminder1h, value: '60' },
      { label: t.collab.calendarReminder2h, value: '120' },
      { label: t.collab.calendarReminder1d, value: '1440' },
      { label: t.collab.calendarReminder2d, value: '2880' },
    ],
    [t],
  );

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEventEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Inline feedback & confirmations (zero Alert.alert)
  const [statusNotice, setStatusNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [confirmDetailAction, setConfirmDetailAction] = useState<'cancel' | 'delete' | null>(null);
  const [isMutatingDetail, setIsMutatingDetail] = useState(false);
  const [rsvpSubmitting, setRsvpSubmitting] = useState<EventRsvpStatus | null>(null);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  // Add/Edit modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventEntity | null>(null);
  const [detailEvent, setDetailEvent] = useState<CalendarEventEntity | null>(null);
  const [isYearView, setIsYearView] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const MONTH_PAGE_HEIGHT = 276;
  const nowYear = new Date().getFullYear();

  const MONTHS_RANGE = useMemo(() => {
    const list: { year: number; month: number; key: string }[] = [];
    for (let y = nowYear - 2; y <= nowYear + 3; y++) {
      for (let m = 1; m <= 12; m++) {
        list.push({ year: y, month: m, key: `${y}-${m}` });
      }
    }
    return list;
  }, [nowYear]);

  const YEARS_RANGE = useMemo(() => {
    const list: number[] = [];
    for (let y = nowYear - 2; y <= nowYear + 3; y++) {
      list.push(y);
    }
    return list;
  }, [nowYear]);

  const monthScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const yearLayoutsRef = useRef<Record<number, number>>({});
  const yearScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const scrollToMonth = useCallback(
    (targetYear: number, targetMonth: number, animated = true) => {
      const idx = MONTHS_RANGE.findIndex(
        (it) => it.year === targetYear && it.month === targetMonth,
      );
      if (idx !== -1 && monthScrollRef.current) {
        monthScrollRef.current.scrollTo({ y: idx * MONTH_PAGE_HEIGHT, animated });
      }
    },
    [MONTHS_RANGE],
  );

  const scrollToYear = useCallback((targetYear: number, animated = true) => {
    const posY = yearLayoutsRef.current[targetYear];
    if (posY !== undefined && yearScrollRef.current) {
      yearScrollRef.current.scrollTo({ y: posY, animated });
    }
  }, []);

  const handleMonthScrollEnd = useCallback(
    (e: any) => {
      const scrollY = e.nativeEvent.contentOffset.y;
      const pageIndex = Math.min(
        MONTHS_RANGE.length - 1,
        Math.max(0, Math.round(scrollY / MONTH_PAGE_HEIGHT)),
      );
      const item = MONTHS_RANGE[pageIndex];
      if (
        item &&
        (item.year !== currentDate.getFullYear() || item.month !== currentDate.getMonth() + 1)
      ) {
        setCurrentDate(new Date(item.year, item.month - 1, 1));
        Haptics.selectionAsync();
      }
    },
    [MONTHS_RANGE, currentDate],
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState('15');
  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>(() =>
    createDefaultRecurrenceConfig(new Date()),
  );
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [isCustomRepeatOpen, setIsCustomRepeatOpen] = useState(false);
  const [customRecConfig, setCustomRecConfig] = useState<RecurrenceConfig>(() =>
    createDefaultRecurrenceConfig(new Date()),
  );
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // End repeat date picker states
  const [isEndRepeatPickerOpen, setIsEndRepeatPickerOpen] = useState(false);
  const [isEndRepeatMonthYearOpen, setIsEndRepeatMonthYearOpen] = useState(false);
  const [endRepeatPickerMonthDate, setEndRepeatPickerMonthDate] = useState<Date>(new Date());
  const endRepeatPickerMonthScrollRef = useRef<any>(null);
  const endRepeatPickerYearScrollRef = useRef<any>(null);

  // Start Date & Time
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [startHour, setStartHour] = useState(6);
  const [startMinute, setStartMinute] = useState(0);

  // End Date & Time
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [endHour, setEndHour] = useState(23);
  const [endMinute, setEndMinute] = useState(59);

  // Location suggestions
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Date & Time Picker states
  const [activePickerTarget, setActivePickerTarget] = useState<
    'start_date' | 'start_time' | 'end_date' | 'end_time' | null
  >(null);
  const [isPickerMonthYearOpen, setIsPickerMonthYearOpen] = useState(false);
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date());

  const pickerYear = pickerMonthDate.getFullYear();
  const pickerMonth = pickerMonthDate.getMonth() + 1;
  const pickerDaysInMonth = new Date(pickerYear, pickerMonth, 0).getDate();
  const pickerFirstDayOfWeek = new Date(pickerYear, pickerMonth - 1, 1).getDay();

  const pickerMonthScrollRef = useRef<any>(null);
  const pickerYearScrollRef = useRef<any>(null);
  const pickerHoursScrollRef = useRef<any>(null);
  const pickerMinutesScrollRef = useRef<any>(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const showNotice = useCallback((message: string, type: 'success' | 'error' = 'error') => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setStatusNotice({ type, message });
    statusTimerRef.current = setTimeout(() => {
      setStatusNotice(null);
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  const loadEvents = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setIsLoading(true);
        const data = await getCalendarEventsApi(circleId, month, year);
        setEvents(data);
        setDetailEvent((prev) => {
          if (!prev) return null;
          const fresh = data.find((ev) => ev.id === prev.id);
          return fresh || prev;
        });
      } catch (err: any) {
        showNotice(err?.message || t.collab.loadEventsError, 'error');
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [circleId, month, year, showNotice, t.collab.loadEventsError],
  );

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Realtime Calendar & RSVP socket updates
  useEffect(() => {
    let isMounted = true;
    let sockRef: any = null;
    const handleCalendarChanged = (payload?: { circleId?: string }) => {
      if (!isMounted) return;
      if (payload?.circleId && payload.circleId !== circleId) return;
      loadEvents(true);
    };

    getMobileSocket().then((sock) => {
      if (!isMounted || !sock) return;
      sockRef = sock;
      sock.on('circle:calendar-event-updated', handleCalendarChanged);
      sock.on('circle:calendar-event-rsvp-updated', handleCalendarChanged);
    });

    return () => {
      isMounted = false;
      if (sockRef) {
        sockRef.off('circle:calendar-event-updated', handleCalendarChanged);
        sockRef.off('circle:calendar-event-rsvp-updated', handleCalendarChanged);
      }
    };
  }, [circleId, loadEvents]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToMonth(year, month, false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isYearView) {
      const timer = setTimeout(() => {
        scrollToYear(year, false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isYearView, year, scrollToYear]);

  const currentRepeatLabel = useMemo(() => {
    if (recurrenceConfig.frequency === 'none') {
      return t.collab.recurrenceNever;
    }
    if (recurrenceConfig.isCustom) {
      return formatRecurrenceSummary(recurrenceConfig, t);
    }
    switch (recurrenceConfig.frequency) {
      case 'daily':
        return t.collab.recurrenceDaily;
      case 'weekly':
        return t.collab.recurrenceWeekly;
      case 'monthly':
        return t.collab.recurrenceMonthly;
      case 'yearly':
        return t.collab.recurrenceYearly;
      default:
        return t.collab.recurrenceNever;
    }
  }, [recurrenceConfig, t]);

  const currentReminderLabel = useMemo(() => {
    return (
      reminderOptions.find((r) => r.value === reminderMinutes)?.label ||
      t.collab.calendarReminder15m
    );
  }, [reminderMinutes, reminderOptions, t.collab.calendarReminder15m]);

  const closeAllPickers = useCallback(() => {
    setActivePickerTarget(null);
    setIsPickerMonthYearOpen(false);
    setIsEndRepeatPickerOpen(false);
    setIsEndRepeatMonthYearOpen(false);
  }, []);

  const dismissKeyboardAndPickers = useCallback(() => {
    Keyboard.dismiss();
    closeAllPickers();
  }, [closeAllPickers]);

  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setFormError(null);
    setTitle('');
    setLocation('');
    setDescription('');
    setReminderMinutes('15');
    const targetDate = selectedDate;
    const defaultConfig = createDefaultRecurrenceConfig(targetDate, targetDate);
    setRecurrenceConfig(defaultConfig);
    setIsRepeatModalOpen(false);
    setIsCustomRepeatOpen(false);
    setIsReminderModalOpen(false);
    setIsEndRepeatPickerOpen(false);
    setIsEndRepeatMonthYearOpen(false);
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);

    setStartDate(targetDate);
    setStartHour(6);
    setStartMinute(0);

    setEndDate(targetDate);
    setEndHour(23);
    setEndMinute(59);
    setActivePickerTarget(null);
    setIsPickerMonthYearOpen(false);

    setIsAddModalOpen(true);
  };

  // Location search autocomplete via Photon API
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

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          trimmed,
        )}&lat=10.7769&lon=106.7009&limit=5`;
        const res = await fetch(url, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          const mapped = (data.features || []).map((f: any) => {
            const p = f.properties || {};
            const name = p.name || p.street || trimmed;
            const streetLine = [p.housenumber, p.street].filter(Boolean).join(' ');
            const parts = [
              p.name,
              streetLine,
              p.locality || p.district,
              p.city,
              p.country,
            ].filter(Boolean);
            const address = Array.from(new Set(parts)).join(', ');
            return {
              name,
              address: address || name,
              lat: f.geometry?.coordinates?.[1],
              lon: f.geometry?.coordinates?.[0],
            };
          });
          setLocationSuggestions(mapped);
          setShowLocationSuggestions(mapped.length > 0);
        }
      } catch {
        // Ignore aborted or offline location search errors
      } finally {
        setIsSearchingLocation(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [location]);

  const handleSelectLocation = (item: any) => {
    const displayName = item.name || item.address;
    setLocation(displayName);
    setShowLocationSuggestions(false);
    Keyboard.dismiss();
    Haptics.selectionAsync();
  };

  const validateForm = (): string | null => {
    if (!title.trim()) return t.collab.calendarEventRequired;

    const start = createDateFromParts(startDate, startHour, startMinute);
    const end = createDateFromParts(endDate, endHour, endMinute);

    if (end.getTime() <= start.getTime()) {
      return t.collab.calendarEndAfterStartMsg;
    }

    if (
      recurrenceConfig.frequency !== 'none' &&
      recurrenceConfig.endType === 'on_date' &&
      recurrenceConfig.endDate
    ) {
      const startDay = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      );
      const endRepeatDay = new Date(
        recurrenceConfig.endDate.getFullYear(),
        recurrenceConfig.endDate.getMonth(),
        recurrenceConfig.endDate.getDate(),
      );
      if (endRepeatDay.getTime() < startDay.getTime()) {
        return t.collab.calendarEndRepeatAfterStartMsg;
      }
    }

    return null;
  };

  const handleOpenEditModal = (ev: CalendarEventEntity) => {
    setEditingEvent(ev);
    setFormError(null);
    setTitle(ev.eventTitle);
    setLocation(ev.location || '');

    const { cleanDesc, recurrenceConfig: savedConfig } = parseEventRecurrence(ev.description);
    const validDesc = cleanDesc.trim().toLowerCase() === 'body' ? '' : cleanDesc;
    setDescription(validDesc);

    const evStart = new Date(ev.startTime);
    setStartDate(evStart);
    setStartHour(evStart.getHours());
    setStartMinute(evStart.getMinutes());

    if (ev.endTime) {
      const evEnd = new Date(ev.endTime);
      setEndDate(evEnd);
      setEndHour(evEnd.getHours());
      setEndMinute(evEnd.getMinutes());
    } else {
      setEndDate(evStart);
      setEndHour(23);
      setEndMinute(59);
    }

    if (ev.reminderTime) {
      const remDate = new Date(ev.reminderTime);
      const diffMins = Math.round((evStart.getTime() - remDate.getTime()) / (60 * 1000));
      setReminderMinutes(diffMins >= 0 ? String(diffMins) : '15');
    } else {
      setReminderMinutes('none');
    }

    if (savedConfig) {
      setRecurrenceConfig(savedConfig);
    } else {
      setRecurrenceConfig(
        createDefaultRecurrenceConfig(evStart, ev.endTime ? new Date(ev.endTime) : evStart),
      );
    }

    setIsRepeatModalOpen(false);
    setIsCustomRepeatOpen(false);
    setIsReminderModalOpen(false);
    setIsEndRepeatPickerOpen(false);
    setIsEndRepeatMonthYearOpen(false);
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
    setActivePickerTarget(null);
    setIsPickerMonthYearOpen(false);

    setIsAddModalOpen(true);
  };

  const handleCreateOrUpdateEvent = async () => {
    const validationError = validateForm();
    if (validationError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setFormError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const evStart = createDateFromParts(startDate, startHour, startMinute);
      const evEnd = endDate ? createDateFromParts(endDate, endHour, endMinute) : undefined;

      let reminderTime: string | undefined = undefined;
      if (reminderMinutes !== 'none') {
        const mins = parseInt(reminderMinutes, 10);
        reminderTime = new Date(evStart.getTime() - mins * 60 * 1000).toISOString();
      }

      let fullDesc = description.trim() || undefined;
      if (recurrenceConfig.frequency !== 'none') {
        const repeatSummary = formatRecurrenceSummary(recurrenceConfig, t);
        const serialized = JSON.stringify({
          frequency: recurrenceConfig.frequency,
          interval: recurrenceConfig.interval,
          weeklyDays: recurrenceConfig.weeklyDays,
          monthlyType: recurrenceConfig.monthlyType,
          monthlyDay: recurrenceConfig.monthlyDay,
          monthlyNthOrder: recurrenceConfig.monthlyNthOrder,
          monthlyNthWeekday: recurrenceConfig.monthlyNthWeekday,
          yearlyType: recurrenceConfig.yearlyType,
          yearlyMonth: recurrenceConfig.yearlyMonth,
          yearlyNthMonth: recurrenceConfig.yearlyNthMonth,
          yearlyDay: recurrenceConfig.yearlyDay,
          yearlyNthOrder: recurrenceConfig.yearlyNthOrder,
          yearlyNthWeekday: recurrenceConfig.yearlyNthWeekday,
          endType: recurrenceConfig.endType,
          endDate: recurrenceConfig.endDate ? recurrenceConfig.endDate.toISOString() : null,
        });
        const recurrenceTag = `[RECURRENCE:${serialized}]`;
        const userRepeatText = `[${t.collab.calendarRepeatPrefixTag}: ${repeatSummary}]`;
        fullDesc = description.trim()
          ? `${description.trim()}\n${userRepeatText}\n${recurrenceTag}`
          : `${userRepeatText}\n${recurrenceTag}`;
      }

      if (editingEvent) {
        const updatedEv = await updateCalendarEventApi(circleId, editingEvent.id, {
          eventTitle: title.trim(),
          description: fullDesc,
          location: location.trim() || undefined,
          startTime: evStart.toISOString(),
          endTime: evEnd ? evEnd.toISOString() : undefined,
          reminderTime,
        });
        setDetailEvent((prev) => (prev && prev.id === editingEvent.id ? updatedEv : prev));
        showNotice(t.collab.calendarEventUpdatedMsg, 'success');
      } else {
        await createCalendarEventApi(circleId, {
          eventTitle: title.trim(),
          description: fullDesc,
          location: location.trim() || undefined,
          startTime: evStart.toISOString(),
          endTime: evEnd ? evEnd.toISOString() : undefined,
          reminderTime,
        });
        showNotice(t.collab.calendarEventCreatedMsg, 'success');
      }

      setIsAddModalOpen(false);
      setEditingEvent(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadEvents(true);
    } catch (err: any) {
      setFormError(
        err?.message || (editingEvent ? t.collab.updateEventError : t.collab.createEventError),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDetailAction = async () => {
    if (!detailEvent || !confirmDetailAction || isMutatingDetail) return;
    const eventId = detailEvent.id;

    try {
      setIsMutatingDetail(true);
      if (confirmDetailAction === 'cancel') {
        await cancelCalendarEventApi(circleId, eventId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDetailEvent((prev) =>
          prev && prev.id === eventId ? { ...prev, isCancelled: true } : prev,
        );
        setConfirmDetailAction(null);
        showNotice(t.collab.eventCancelledToast, 'success');
      } else {
        await deleteCalendarEventApi(circleId, eventId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setConfirmDetailAction(null);
        setDetailEvent(null);
      }
      loadEvents(true);
    } catch (err: any) {
      showNotice(
        err?.message ||
          (confirmDetailAction === 'cancel'
            ? t.collab.cancelEventError
            : t.collab.deleteEventError),
        'error',
      );
    } finally {
      setIsMutatingDetail(false);
    }
  };

  const handleRsvp = async (eventId: string, nextStatus: EventRsvpStatus) => {
    if (rsvpSubmitting) return;
    setRsvpError(null);
    Haptics.selectionAsync();

    try {
      setRsvpSubmitting(nextStatus);
      await respondEventRsvpApi(circleId, eventId, { status: nextStatus });
      await loadEvents(true);
    } catch (err: any) {
      setRsvpError(err?.message || t.collab.rsvpUpdateError);
    } finally {
      setRsvpSubmitting(null);
    }
  };

  const togglePickerTarget = (
    target: 'start_date' | 'start_time' | 'end_date' | 'end_time',
  ) => {
    Keyboard.dismiss();
    Haptics.selectionAsync();
    if (activePickerTarget === target) {
      setActivePickerTarget(null);
      setIsPickerMonthYearOpen(false);
      return;
    }
    setActivePickerTarget(target);
    setIsPickerMonthYearOpen(false);
    if (target === 'start_date') {
      setPickerMonthDate(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
    } else if (target === 'end_date') {
      setPickerMonthDate(new Date(endDate.getFullYear(), endDate.getMonth(), 1));
    }
  };

  const handlePickerPrev = () => {
    Haptics.selectionAsync();
    setPickerMonthDate(new Date(pickerYear, pickerMonth - 2, 1));
  };

  const handlePickerNext = () => {
    Haptics.selectionAsync();
    setPickerMonthDate(new Date(pickerYear, pickerMonth, 1));
  };

  useEffect(() => {
    if (activePickerTarget === 'start_time' || activePickerTarget === 'end_time') {
      const activeH = activePickerTarget === 'start_time' ? startHour : endHour;
      const activeM = activePickerTarget === 'start_time' ? startMinute : endMinute;
      const timer = setTimeout(() => {
        pickerHoursScrollRef.current?.scrollTo({
          y: activeH * WHEEL_ITEM_HEIGHT,
          animated: false,
        });
        pickerMinutesScrollRef.current?.scrollTo({
          y: activeM * WHEEL_ITEM_HEIGHT,
          animated: false,
        });
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [activePickerTarget, startHour, startMinute, endHour, endMinute]);

  useEffect(() => {
    if (
      isPickerMonthYearOpen &&
      (activePickerTarget === 'start_date' || activePickerTarget === 'end_date')
    ) {
      const timer = setTimeout(() => {
        pickerMonthScrollRef.current?.scrollTo({
          y: (pickerMonth - 1) * WHEEL_ITEM_HEIGHT,
          animated: false,
        });
        const yIdx = YEARS.indexOf(pickerYear);
        if (yIdx !== -1) {
          pickerYearScrollRef.current?.scrollTo({ y: yIdx * WHEEL_ITEM_HEIGHT, animated: false });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isPickerMonthYearOpen, pickerMonth, pickerYear, activePickerTarget]);

  const selectedDayEvents = useMemo(
    () => events.filter((ev) => isEventOccurringOnDate(ev, selectedDate)),
    [events, selectedDate],
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return events
      .filter((ev) => {
        const { cleanDesc } = parseEventRecurrence(ev.description);
        const creatorName =
          ev.creator?.nickname || ev.creator?.user?.profile?.displayName || '';
        return (
          ev.eventTitle.toLowerCase().includes(q) ||
          (ev.location || '').toLowerCase().includes(q) ||
          cleanDesc.toLowerCase().includes(q) ||
          creatorName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events, searchQuery]);

  const renderDatePicker = (target: 'start' | 'end') => {
    const isStart = target === 'start';
    const targetDate = isStart ? startDate : endDate;
    const setTargetDate = isStart ? setStartDate : setEndDate;
    const todayObj = new Date();
    const isTodayYearMonth =
      todayObj.getFullYear() === pickerYear && todayObj.getMonth() + 1 === pickerMonth;

    return (
      <View style={styles.appleInlinePickerContainer}>
        <View style={styles.applePickerMonthNav}>
          <TouchableOpacity
            onPress={() => {
              setIsPickerMonthYearOpen((prev) => !prev);
              Haptics.selectionAsync();
            }}
            style={styles.applePickerMonthBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.applePickerMonthText}>
              {monthShortLabels[pickerMonth - 1]} {pickerYear}
            </Text>
            {isPickerMonthYearOpen ? (
              <ChevronDown size={16} color={colors.sage} />
            ) : (
              <ChevronRight size={16} color={colors.sage} />
            )}
          </TouchableOpacity>

          {!isPickerMonthYearOpen && (
            <View style={styles.applePickerArrows}>
              <TouchableOpacity
                onPress={handlePickerPrev}
                style={styles.applePickerArrowBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronLeft size={20} color={colors.sage} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePickerNext}
                style={styles.applePickerArrowBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronRight size={20} color={colors.sage} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.applePickerBodyFixedContainer}>
          {isPickerMonthYearOpen ? (
            <View style={styles.wheelStage}>
              <View style={styles.wheelCenterPill} pointerEvents="none" />

              <ScrollView
                ref={pickerMonthScrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={WHEEL_ITEM_HEIGHT}
                decelerationRate="fast"
                contentContainerStyle={{ paddingVertical: WHEEL_PADDING }}
                style={styles.wheelColumn}
                onMomentumScrollEnd={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  const idx = Math.min(11, Math.max(0, Math.round(y / WHEEL_ITEM_HEIGHT)));
                  setPickerMonthDate(new Date(pickerYear, idx, 1));
                  Haptics.selectionAsync();
                }}
              >
                {monthShortLabels.map((mName, idx) => {
                  const isSelected = idx === pickerMonth - 1;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={styles.wheelItem}
                      onPress={() => {
                        pickerMonthScrollRef.current?.scrollTo({
                          y: idx * WHEEL_ITEM_HEIGHT,
                          animated: true,
                        });
                        setPickerMonthDate(new Date(pickerYear, idx, 1));
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text style={[styles.wheelItemText, isSelected && styles.wheelItemTextSelected]}>
                        {mName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.wheelDivider} pointerEvents="none">
                <Text style={styles.wheelDividerText}>/</Text>
              </View>

              <ScrollView
                ref={pickerYearScrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={WHEEL_ITEM_HEIGHT}
                decelerationRate="fast"
                contentContainerStyle={{ paddingVertical: WHEEL_PADDING }}
                style={styles.wheelColumn}
                onMomentumScrollEnd={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  const idx = Math.min(
                    YEARS.length - 1,
                    Math.max(0, Math.round(y / WHEEL_ITEM_HEIGHT)),
                  );
                  setPickerMonthDate(new Date(YEARS[idx], pickerMonth - 1, 1));
                  Haptics.selectionAsync();
                }}
              >
                {YEARS.map((y, idx) => {
                  const isSelected = y === pickerYear;
                  return (
                    <TouchableOpacity
                      key={y}
                      style={styles.wheelItem}
                      onPress={() => {
                        pickerYearScrollRef.current?.scrollTo({
                          y: idx * WHEEL_ITEM_HEIGHT,
                          animated: true,
                        });
                        setPickerMonthDate(new Date(y, pickerMonth - 1, 1));
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text style={[styles.wheelItemText, isSelected && styles.wheelItemTextSelected]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <View>
              <View style={styles.appleWeekdaysRow}>
                {weekdayShortSunFirst.map((d, di) => (
                  <Text key={di} style={styles.appleWeekdayText}>
                    {d}
                  </Text>
                ))}
              </View>

              <View style={styles.appleDaysGrid}>
                {Array.from({ length: pickerFirstDayOfWeek }).map((_, i) => (
                  <View key={`empty-p-${i}`} style={styles.appleDayCell} />
                ))}

                {Array.from({ length: pickerDaysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected =
                    targetDate.getDate() === dayNum &&
                    targetDate.getMonth() + 1 === pickerMonth &&
                    targetDate.getFullYear() === pickerYear;
                  const isToday = isTodayYearMonth && todayObj.getDate() === dayNum;

                  return (
                    <TouchableOpacity
                      key={`p-day-${dayNum}`}
                      style={styles.appleDayCell}
                      onPress={() => {
                        const newD = new Date(pickerYear, pickerMonth - 1, dayNum);
                        setTargetDate(newD);
                        Haptics.selectionAsync();
                      }}
                      activeOpacity={0.6}
                    >
                      <View
                        style={[
                          styles.appleDayCircle,
                          isSelected && styles.appleDayCircleSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.appleDayNumber,
                            isToday && !isSelected && styles.appleDayNumberToday,
                            isSelected && styles.appleDayNumberSelected,
                          ]}
                        >
                          {dayNum}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTimePicker = (target: 'start' | 'end') => {
    const isStart = target === 'start';
    const activeHour = isStart ? startHour : endHour;
    const activeMinute = isStart ? startMinute : endMinute;
    const setHour = isStart ? setStartHour : setEndHour;
    const setMinute = isStart ? setStartMinute : setEndMinute;

    return (
      <View style={styles.appleInlinePickerContainer}>
        <View style={styles.wheelStage}>
          <View style={styles.wheelCenterPill} pointerEvents="none" />

          <ScrollView
            ref={pickerHoursScrollRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={WHEEL_ITEM_HEIGHT}
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: WHEEL_PADDING }}
            style={styles.wheelColumn}
            onMomentumScrollEnd={(e) => {
              const y = e.nativeEvent.contentOffset.y;
              const idx = Math.min(23, Math.max(0, Math.round(y / WHEEL_ITEM_HEIGHT)));
              setHour(idx);
              Haptics.selectionAsync();
            }}
          >
            {HOURS.map((h) => {
              const isSelected = activeHour === h;
              return (
                <TouchableOpacity
                  key={`wh-${h}`}
                  style={styles.wheelItem}
                  onPress={() => {
                    pickerHoursScrollRef.current?.scrollTo({
                      y: h * WHEEL_ITEM_HEIGHT,
                      animated: true,
                    });
                    setHour(h);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={[styles.wheelItemText, isSelected && styles.wheelItemTextSelected]}>
                    {pad2(h)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.wheelDivider} pointerEvents="none">
            <Text style={styles.wheelDividerText}>:</Text>
          </View>

          <ScrollView
            ref={pickerMinutesScrollRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={WHEEL_ITEM_HEIGHT}
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: WHEEL_PADDING }}
            style={styles.wheelColumn}
            onMomentumScrollEnd={(e) => {
              const y = e.nativeEvent.contentOffset.y;
              const idx = Math.min(59, Math.max(0, Math.round(y / WHEEL_ITEM_HEIGHT)));
              setMinute(idx);
              Haptics.selectionAsync();
            }}
          >
            {MINUTES.map((m) => {
              const isSelected = activeMinute === m;
              return (
                <TouchableOpacity
                  key={`wm-${m}`}
                  style={styles.wheelItem}
                  onPress={() => {
                    pickerMinutesScrollRef.current?.scrollTo({
                      y: m * WHEEL_ITEM_HEIGHT,
                      animated: true,
                    });
                    setMinute(m);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={[styles.wheelItemText, isSelected && styles.wheelItemTextSelected]}>
                    {pad2(m)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  };

  const endRepeatPickerYear = endRepeatPickerMonthDate.getFullYear();
  const endRepeatPickerMonth = endRepeatPickerMonthDate.getMonth() + 1;
  const endRepeatPickerDaysInMonth = new Date(
    endRepeatPickerYear,
    endRepeatPickerMonth,
    0,
  ).getDate();
  const endRepeatPickerFirstDayOfWeek = new Date(
    endRepeatPickerYear,
    endRepeatPickerMonth - 1,
    1,
  ).getDay();

  const handleEndRepeatPickerPrev = () => {
    Haptics.selectionAsync();
    setEndRepeatPickerMonthDate(new Date(endRepeatPickerYear, endRepeatPickerMonth - 2, 1));
  };

  const handleEndRepeatPickerNext = () => {
    Haptics.selectionAsync();
    setEndRepeatPickerMonthDate(new Date(endRepeatPickerYear, endRepeatPickerMonth, 1));
  };

  useEffect(() => {
    if (isEndRepeatMonthYearOpen) {
      const timer = setTimeout(() => {
        endRepeatPickerMonthScrollRef.current?.scrollTo({
          y: (endRepeatPickerMonth - 1) * WHEEL_ITEM_HEIGHT,
          animated: false,
        });
        const yIdx = YEARS.indexOf(endRepeatPickerYear);
        if (yIdx !== -1) {
          endRepeatPickerYearScrollRef.current?.scrollTo({
            y: yIdx * WHEEL_ITEM_HEIGHT,
            animated: false,
          });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isEndRepeatMonthYearOpen, endRepeatPickerMonth, endRepeatPickerYear]);

  const renderEndRepeatDatePicker = () => {
    const todayObj = new Date();
    const isTodayYearMonth =
      todayObj.getFullYear() === endRepeatPickerYear &&
      todayObj.getMonth() + 1 === endRepeatPickerMonth;

    return (
      <View style={styles.appleInlinePickerContainer}>
        <View style={styles.applePickerMonthNav}>
          <TouchableOpacity
            onPress={() => {
              setIsEndRepeatMonthYearOpen((prev) => !prev);
              Haptics.selectionAsync();
            }}
            style={styles.applePickerMonthBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.applePickerMonthText}>
              {monthShortLabels[endRepeatPickerMonth - 1]} {endRepeatPickerYear}
            </Text>
            {isEndRepeatMonthYearOpen ? (
              <ChevronDown size={16} color={colors.sage} />
            ) : (
              <ChevronRight size={16} color={colors.sage} />
            )}
          </TouchableOpacity>

          {!isEndRepeatMonthYearOpen && (
            <View style={styles.applePickerArrows}>
              <TouchableOpacity
                onPress={handleEndRepeatPickerPrev}
                style={styles.applePickerArrowBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronLeft size={20} color={colors.sage} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEndRepeatPickerNext}
                style={styles.applePickerArrowBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronRight size={20} color={colors.sage} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.applePickerBodyFixedContainer}>
          {isEndRepeatMonthYearOpen ? (
            <View style={styles.wheelStage}>
              <View style={styles.wheelCenterPill} pointerEvents="none" />
              <ScrollView
                ref={endRepeatPickerMonthScrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={WHEEL_ITEM_HEIGHT}
                decelerationRate="fast"
                contentContainerStyle={{ paddingVertical: WHEEL_PADDING }}
                style={styles.wheelColumn}
                onMomentumScrollEnd={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  const idx = Math.min(11, Math.max(0, Math.round(y / WHEEL_ITEM_HEIGHT)));
                  setEndRepeatPickerMonthDate(new Date(endRepeatPickerYear, idx, 1));
                  Haptics.selectionAsync();
                }}
              >
                {monthShortLabels.map((mName, idx) => {
                  const isSelected = idx === endRepeatPickerMonth - 1;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={styles.wheelItem}
                      onPress={() => {
                        endRepeatPickerMonthScrollRef.current?.scrollTo({
                          y: idx * WHEEL_ITEM_HEIGHT,
                          animated: true,
                        });
                        setEndRepeatPickerMonthDate(new Date(endRepeatPickerYear, idx, 1));
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text
                        style={[styles.wheelItemText, isSelected && styles.wheelItemTextSelected]}
                      >
                        {mName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.wheelDivider} pointerEvents="none">
                <Text style={styles.wheelDividerText}>/</Text>
              </View>

              <ScrollView
                ref={endRepeatPickerYearScrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={WHEEL_ITEM_HEIGHT}
                decelerationRate="fast"
                contentContainerStyle={{ paddingVertical: WHEEL_PADDING }}
                style={styles.wheelColumn}
                onMomentumScrollEnd={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  const idx = Math.min(
                    YEARS.length - 1,
                    Math.max(0, Math.round(y / WHEEL_ITEM_HEIGHT)),
                  );
                  setEndRepeatPickerMonthDate(new Date(YEARS[idx], endRepeatPickerMonth - 1, 1));
                  Haptics.selectionAsync();
                }}
              >
                {YEARS.map((y, idx) => {
                  const isSelected = y === endRepeatPickerYear;
                  return (
                    <TouchableOpacity
                      key={y}
                      style={styles.wheelItem}
                      onPress={() => {
                        endRepeatPickerYearScrollRef.current?.scrollTo({
                          y: idx * WHEEL_ITEM_HEIGHT,
                          animated: true,
                        });
                        setEndRepeatPickerMonthDate(new Date(y, endRepeatPickerMonth - 1, 1));
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text
                        style={[styles.wheelItemText, isSelected && styles.wheelItemTextSelected]}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <View>
              <View style={styles.appleWeekdaysRow}>
                {weekdayShortSunFirst.map((d, di) => (
                  <Text key={di} style={styles.appleWeekdayText}>
                    {d}
                  </Text>
                ))}
              </View>

              <View style={styles.appleDaysGrid}>
                {Array.from({ length: endRepeatPickerFirstDayOfWeek }).map((_, i) => (
                  <View key={`empty-end-rep-${i}`} style={styles.appleDayCell} />
                ))}

                {Array.from({ length: endRepeatPickerDaysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected = Boolean(
                    recurrenceConfig.endDate &&
                      recurrenceConfig.endDate.getDate() === dayNum &&
                      recurrenceConfig.endDate.getMonth() + 1 === endRepeatPickerMonth &&
                      recurrenceConfig.endDate.getFullYear() === endRepeatPickerYear,
                  );
                  const isToday = isTodayYearMonth && todayObj.getDate() === dayNum;

                  return (
                    <TouchableOpacity
                      key={`end-rep-day-${dayNum}`}
                      style={styles.appleDayCell}
                      onPress={() => {
                        const newD = new Date(
                          endRepeatPickerYear,
                          endRepeatPickerMonth - 1,
                          dayNum,
                        );
                        setRecurrenceConfig((prev) => ({
                          ...prev,
                          endType: 'on_date',
                          endDate: newD,
                        }));
                        Haptics.selectionAsync();
                      }}
                      activeOpacity={0.6}
                    >
                      <View
                        style={[
                          styles.appleDayCircle,
                          isSelected && styles.appleDayCircleSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.appleDayNumber,
                            isToday && !isSelected && styles.appleDayNumberToday,
                            isSelected && styles.appleDayNumberSelected,
                          ]}
                        >
                          {dayNum}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.hairline,
          }}
        >
          <Text style={{ fontSize: 13, color: colors.subtle }}>
            {recurrenceConfig.endDate
              ? t.collab.calendarEndRepeatSelected
              : t.collab.calendarEndRepeatUnset}
          </Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setRecurrenceConfig((prev) => ({
                ...prev,
                endType: 'never',
                endDate: null,
              }));
              setIsEndRepeatPickerOpen(false);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.danger }}>
              {t.common.cancel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCustomRepeatModal = () => {
    if (!isCustomRepeatOpen) return null;

    const orderItems = [
      { key: 'first' as const, label: t.collab.calendarOrderFirst },
      { key: 'second' as const, label: t.collab.calendarOrderSecond },
      { key: 'third' as const, label: t.collab.calendarOrderThird },
      { key: 'fourth' as const, label: t.collab.calendarOrderFourth },
      { key: 'last' as const, label: t.collab.calendarOrderLast },
    ];

    const weekdayFullItems = [
      { w: 2, label: t.collab.calendarWeekdayTueFull, short: t.collab.weekdayTue },
      { w: 3, label: t.collab.calendarWeekdayWedFull, short: t.collab.weekdayWed },
      { w: 4, label: t.collab.calendarWeekdayThuFull, short: t.collab.weekdayThu },
      { w: 5, label: t.collab.calendarWeekdayFriFull, short: t.collab.weekdayFri },
      { w: 6, label: t.collab.calendarWeekdaySatFull, short: t.collab.weekdaySat },
      { w: 7, label: t.collab.calendarWeekdaySunFull, short: t.collab.weekdaySun },
      { w: 1, label: t.collab.calendarWeekdayMonFull, short: t.collab.weekdayMon },
    ];
    // Mon -> Sun visual order (1..7) matching WEEKDAY_INFO:
    const weekdaysMonFirst = [
      { w: 1, label: t.collab.calendarWeekdayMonFull, short: t.collab.weekdayMon },
      { w: 2, label: t.collab.calendarWeekdayTueFull, short: t.collab.weekdayTue },
      { w: 3, label: t.collab.calendarWeekdayWedFull, short: t.collab.weekdayWed },
      { w: 4, label: t.collab.calendarWeekdayThuFull, short: t.collab.weekdayThu },
      { w: 5, label: t.collab.calendarWeekdayFriFull, short: t.collab.weekdayFri },
      { w: 6, label: t.collab.calendarWeekdaySatFull, short: t.collab.weekdaySat },
      { w: 7, label: t.collab.calendarWeekdaySunFull, short: t.collab.weekdaySun },
    ];
    void weekdayFullItems;

    return (
      <View style={styles.customRepeatModalContainer}>
        <View style={styles.customRepeatHeader}>
          <TouchableOpacity
            onPress={() => setIsCustomRepeatOpen(false)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.customRepeatCancelText}>{t.common.cancel}</Text>
          </TouchableOpacity>

          <Text style={styles.customRepeatTitle}>{t.collab.calendarCustomTitle}</Text>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setRecurrenceConfig({
                ...customRecConfig,
                isCustom: true,
              });
              setIsCustomRepeatOpen(false);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.customRepeatDoneText}>{t.common.done}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.customRepeatScrollContent}>
          {/* Card 1: Frequency & Interval */}
          <View style={styles.appleGroupCard}>
            <View style={styles.appleRow}>
              <Text style={styles.appleRowLabel}>{t.collab.calendarFrequencyLabel}</Text>
              <View style={styles.appleSegmentWrapper}>
                {[
                  { key: 'daily', label: t.collab.calendarFreqDay },
                  { key: 'weekly', label: t.collab.calendarFreqWeek },
                  { key: 'monthly', label: t.collab.calendarFreqMonth },
                  { key: 'yearly', label: t.collab.calendarFreqYear },
                ].map((seg) => {
                  const isSel = customRecConfig.frequency === seg.key;
                  return (
                    <TouchableOpacity
                      key={seg.key}
                      style={[
                        styles.appleSegmentBtn,
                        isSel && styles.appleSegmentBtnActive,
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setCustomRecConfig((prev) => ({
                          ...prev,
                          frequency: seg.key as RecurrenceFrequency,
                        }));
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.appleSegmentBtnText,
                          isSel && styles.appleSegmentBtnTextActive,
                        ]}
                      >
                        {seg.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.hairlineDivider} />

            <View style={styles.appleRow}>
              <Text style={styles.appleRowLabel}>{t.collab.calendarIntervalLabel}</Text>
              <View style={styles.appleStepperGroup}>
                <TouchableOpacity
                  style={styles.appleStepperMinusBtn}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCustomRecConfig((prev) => ({
                      ...prev,
                      interval: Math.max(1, prev.interval - 1),
                    }));
                  }}
                  activeOpacity={0.6}
                >
                  <Minus size={14} color={colors.sage} strokeWidth={2.5} />
                </TouchableOpacity>

                <TextInput
                  style={styles.appleStepperInput}
                  keyboardType="number-pad"
                  value={String(customRecConfig.interval || 1)}
                  onChangeText={(val) => {
                    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
                    setCustomRecConfig((prev) => ({
                      ...prev,
                      interval: isNaN(num) ? 1 : Math.min(99, Math.max(1, num)),
                    }));
                  }}
                  selectTextOnFocus
                  maxLength={2}
                />

                <TouchableOpacity
                  style={styles.appleStepperPlusBtn}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCustomRecConfig((prev) => ({
                      ...prev,
                      interval: Math.min(99, prev.interval + 1),
                    }));
                  }}
                  activeOpacity={0.6}
                >
                  <Plus size={14} color={colors.sage} strokeWidth={2.5} />
                </TouchableOpacity>

                <Text style={styles.appleStepperUnit}>
                  {customRecConfig.frequency === 'daily' && t.collab.calendarUnitDay}
                  {customRecConfig.frequency === 'weekly' && t.collab.calendarUnitWeek}
                  {customRecConfig.frequency === 'monthly' && t.collab.calendarUnitMonth}
                  {customRecConfig.frequency === 'yearly' && t.collab.calendarUnitYear}
                </Text>
              </View>
            </View>
          </View>

          {/* Card 2: Weekly */}
          {customRecConfig.frequency === 'weekly' && (
            <View style={styles.appleGroupCard}>
              <View style={styles.appleSubRow}>
                <Text style={styles.appleSubRowLabel}>{t.collab.calendarOnWeekdaysLabel}</Text>
              </View>
              <View style={styles.appleWeekdaysRowWrapper}>
                {weekdaysMonFirst.map(({ w, short }) => {
                  const isSelected = customRecConfig.weeklyDays.includes(w);
                  return (
                    <TouchableOpacity
                      key={`apple-wk-${w}`}
                      style={[
                        styles.appleWeekdayPill,
                        isSelected && styles.appleWeekdayPillActive,
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setCustomRecConfig((prev) => {
                          const exists = prev.weeklyDays.includes(w);
                          if (exists && prev.weeklyDays.length === 1) return prev;
                          const next = exists
                            ? prev.weeklyDays.filter((d) => d !== w)
                            : [...prev.weeklyDays, w];
                          return { ...prev, weeklyDays: next };
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.appleWeekdayPillText,
                          isSelected && styles.appleWeekdayPillTextActive,
                        ]}
                      >
                        {short}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Monthly */}
          {customRecConfig.frequency === 'monthly' && (
            <View style={styles.appleGroupCard}>
              <View style={styles.appleRow}>
                <Text style={styles.appleRowLabel}>{t.collab.calendarRepeatRuleLabel}</Text>
                <View style={styles.appleSegmentWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.appleSegmentBtn,
                      customRecConfig.monthlyType === 'day_of_month' &&
                        styles.appleSegmentBtnActive,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCustomRecConfig((prev) => ({
                        ...prev,
                        monthlyType: 'day_of_month',
                      }));
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.appleSegmentBtnText,
                        customRecConfig.monthlyType === 'day_of_month' &&
                          styles.appleSegmentBtnTextActive,
                      ]}
                    >
                      {t.collab.calendarByDayOfMonth}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.appleSegmentBtn,
                      customRecConfig.monthlyType === 'nth_weekday' &&
                        styles.appleSegmentBtnActive,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCustomRecConfig((prev) => ({
                        ...prev,
                        monthlyType: 'nth_weekday',
                      }));
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.appleSegmentBtnText,
                        customRecConfig.monthlyType === 'nth_weekday' &&
                          styles.appleSegmentBtnTextActive,
                      ]}
                    >
                      {t.collab.calendarByNthWeekday}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {customRecConfig.monthlyType === 'day_of_month' ? (
                <View style={styles.appleMainMonthGrid}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                    const isSelected = customRecConfig.monthlyDay === d;
                    return (
                      <TouchableOpacity
                        key={`c-m-day-${d}`}
                        style={styles.appleDayCellContainer}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setCustomRecConfig((prev) => ({ ...prev, monthlyDay: d }));
                        }}
                        activeOpacity={0.6}
                      >
                        <View
                          style={[
                            styles.appleDayNumberCircle,
                            isSelected && styles.appleDayNumberCircleActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.appleDayNumberText,
                              isSelected && styles.appleDayNumberTextActive,
                            ]}
                          >
                            {d}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View>
                  <View style={styles.hairlineDivider} />
                  <View style={styles.appleSubRow}>
                    <Text style={styles.appleSubRowLabel}>
                      {t.collab.calendarOccurrenceOrderLabel}
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.applePillsScroll}
                    >
                      {orderItems.map((item) => {
                        const isSel = customRecConfig.monthlyNthOrder === item.key;
                        return (
                          <TouchableOpacity
                            key={item.key}
                            style={[styles.applePill, isSel && styles.applePillActive]}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setCustomRecConfig((prev) => ({
                                ...prev,
                                monthlyNthOrder: item.key,
                              }));
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[styles.applePillText, isSel && styles.applePillTextActive]}
                            >
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  <View style={styles.hairlineDivider} />
                  <View style={styles.appleSubRow}>
                    <Text style={styles.appleSubRowLabel}>
                      {t.collab.calendarWeekdayOfWeekLabel}
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.applePillsScroll}
                    >
                      {weekdaysMonFirst.map(({ w, label }) => {
                        const isSel = customRecConfig.monthlyNthWeekday === w;
                        return (
                          <TouchableOpacity
                            key={`c-mnth-w-${w}`}
                            style={[styles.applePill, isSel && styles.applePillActive]}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setCustomRecConfig((prev) => ({
                                ...prev,
                                monthlyNthWeekday: w,
                              }));
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[styles.applePillText, isSel && styles.applePillTextActive]}
                            >
                              {label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Yearly */}
          {customRecConfig.frequency === 'yearly' && (
            <View style={styles.appleGroupCard}>
              <View style={styles.appleRow}>
                <Text style={styles.appleRowLabel}>{t.collab.calendarRepeatRuleLabel}</Text>
                <View style={styles.appleSegmentWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.appleSegmentBtn,
                      customRecConfig.yearlyType === 'specific_date' &&
                        styles.appleSegmentBtnActive,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCustomRecConfig((prev) => ({
                        ...prev,
                        yearlyType: 'specific_date',
                      }));
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.appleSegmentBtnText,
                        customRecConfig.yearlyType === 'specific_date' &&
                          styles.appleSegmentBtnTextActive,
                      ]}
                    >
                      {t.collab.calendarByDayOfMonth}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.appleSegmentBtn,
                      customRecConfig.yearlyType === 'nth_weekday' &&
                        styles.appleSegmentBtnActive,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCustomRecConfig((prev) => ({
                        ...prev,
                        yearlyType: 'nth_weekday',
                      }));
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.appleSegmentBtnText,
                        customRecConfig.yearlyType === 'nth_weekday' &&
                          styles.appleSegmentBtnTextActive,
                      ]}
                    >
                      {t.collab.calendarByNthWeekday}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {customRecConfig.yearlyType === 'specific_date' ? (
                <View>
                  <View style={styles.hairlineDivider} />
                  <View style={styles.appleSubRow}>
                    <Text style={styles.appleSubRowLabel}>
                      {t.collab.calendarSelectMonthLabel}
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.applePillsScroll}
                    >
                      {monthShortLabels.map((mLabel, idx) => {
                        const m = idx + 1;
                        const isSel = customRecConfig.yearlyMonth === m;
                        return (
                          <TouchableOpacity
                            key={`c-yr-m-${m}`}
                            style={[styles.applePill, isSel && styles.applePillActive]}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setCustomRecConfig((prev) => ({ ...prev, yearlyMonth: m }));
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[styles.applePillText, isSel && styles.applePillTextActive]}
                            >
                              {mLabel}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  <View style={styles.appleMonthDaysGrid}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                      const isSelected = customRecConfig.yearlyDay === d;
                      return (
                        <TouchableOpacity
                          key={`c-yr-day-${d}`}
                          style={styles.appleDayCellContainer}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setCustomRecConfig((prev) => ({ ...prev, yearlyDay: d }));
                          }}
                          activeOpacity={0.6}
                        >
                          <View
                            style={[
                              styles.appleDayNumberCircle,
                              isSelected && styles.appleDayNumberCircleActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.appleDayNumberText,
                                isSelected && styles.appleDayNumberTextActive,
                              ]}
                            >
                              {d}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.hairlineDivider} />
                  <View style={styles.appleSubRow}>
                    <Text style={styles.appleSubRowLabel}>
                      {t.collab.calendarOccurrenceOrderLabel}
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.applePillsScroll}
                    >
                      {orderItems.map((item) => {
                        const isSel = customRecConfig.yearlyNthOrder === item.key;
                        return (
                          <TouchableOpacity
                            key={`c-yr-nth-${item.key}`}
                            style={[styles.applePill, isSel && styles.applePillActive]}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setCustomRecConfig((prev) => ({
                                ...prev,
                                yearlyNthOrder: item.key,
                              }));
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[styles.applePillText, isSel && styles.applePillTextActive]}
                            >
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  <View style={styles.hairlineDivider} />
                  <View style={styles.appleSubRow}>
                    <Text style={styles.appleSubRowLabel}>
                      {t.collab.calendarWeekdayOfWeekLabel}
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.applePillsScroll}
                    >
                      {weekdaysMonFirst.map(({ w, label }) => {
                        const isSel = customRecConfig.yearlyNthWeekday === w;
                        return (
                          <TouchableOpacity
                            key={`c-yr-wk-${w}`}
                            style={[styles.applePill, isSel && styles.applePillActive]}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setCustomRecConfig((prev) => ({
                                ...prev,
                                yearlyNthWeekday: w,
                              }));
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[styles.applePillText, isSel && styles.applePillTextActive]}
                            >
                              {label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  <View style={styles.hairlineDivider} />
                  <View style={styles.appleSubRow}>
                    <Text style={styles.appleSubRowLabel}>{t.collab.calendarInMonthLabel}</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.applePillsScroll}
                    >
                      {monthShortLabels.map((mLabel, idx) => {
                        const m = idx + 1;
                        const isSel = customRecConfig.yearlyNthMonth === m;
                        return (
                          <TouchableOpacity
                            key={`c-yr-nth-m-${m}`}
                            style={[styles.applePill, isSel && styles.applePillActive]}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setCustomRecConfig((prev) => ({
                                ...prev,
                                yearlyNthMonth: m,
                              }));
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[styles.applePillText, isSel && styles.applePillTextActive]}
                            >
                              {mLabel}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Summary Card */}
          <View style={[styles.appleGroupCard, { padding: 0 }]}>
            <View style={styles.appleSectionFooter}>
              <Info size={14} color={colors.sage} style={{ marginTop: 2 }} />
              <Text style={styles.appleSectionFooterText}>
                {formatRecurrenceSummary(customRecConfig, t)}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Full-Screen Event Detail View (with topClearance & 3-state RSVP)
  const renderDetailScreen = () => {
    if (!detailEvent) return null;
    const { cleanDesc, recurrenceConfig: savedRec } = parseEventRecurrence(
      detailEvent.description,
    );
    const isBodyPlaceholder = cleanDesc.trim().toLowerCase() === 'body';
    const hasValidDesc = Boolean(cleanDesc && !isBodyPlaceholder);
    const cleanDescriptionText = hasValidDesc ? cleanDesc.trim() : '';

    const isCall =
      (detailEvent.location && isCallUrl(detailEvent.location)) ||
      extractLocationUrl(detailEvent.location)?.includes('meet.google.com') ||
      extractLocationUrl(detailEvent.location)?.includes('zoom.us');

    const callUrl = isCall ? extractLocationUrl(detailEvent.location) : null;
    const isPhysicalLoc = Boolean(detailEvent.location && !isCall);

    const startDateObj = new Date(detailEvent.startTime);
    const endDateObj = detailEvent.endTime ? new Date(detailEvent.endTime) : null;

    const repeatSummary =
      savedRec && savedRec.frequency !== 'none'
        ? formatRecurrenceSummary(savedRec, t)
        : null;

    // 3-state RSVP breakdown
    const allRsvps = detailEvent.rsvps || [];
    const yesRsvps = allRsvps.filter((r) => r.status === EventRsvpStatus.YES);
    const maybeRsvps = allRsvps.filter((r) => r.status === EventRsvpStatus.MAYBE);
    const noRsvps = allRsvps.filter((r) => r.status === EventRsvpStatus.NO);
    const totalRsvps = allRsvps.length;
    const myRsvp = allRsvps.find((r) => r.userId === currentUser?.id)?.status || null;
    const isStarted = Date.now() > startDateObj.getTime();
    const isRsvpLocked = isStarted || Boolean(detailEvent.isCancelled);

    const rsvpOptions = [
      {
        status: EventRsvpStatus.YES,
        label: t.collab.rsvpGoing,
        icon: Check,
        rsvps: yesRsvps,
        accent: colors.sage,
        washBg: colors.wash,
      },
      {
        status: EventRsvpStatus.MAYBE,
        label: t.collab.rsvpMaybe,
        icon: HelpCircle,
        rsvps: maybeRsvps,
        accent: isDark ? '#FBBF24' : '#D97706',
        washBg: isDark ? 'rgba(251, 191, 36, 0.14)' : 'rgba(245, 158, 11, 0.12)',
      },
      {
        status: EventRsvpStatus.NO,
        label: t.collab.rsvpDecline,
        icon: X,
        rsvps: noRsvps,
        accent: colors.danger,
        washBg: isDark ? 'rgba(248, 113, 113, 0.14)' : 'rgba(220, 38, 38, 0.10)',
      },
    ];

    return (
      <View style={[styles.detailFullScreenContainer, { backgroundColor: colors.canvas }]}>
        {/* Navigation Header below parent tool modal pill bar */}
        <View style={[styles.detailNavHeader, { paddingTop: topClearance }]}>
          <TouchableOpacity
            style={styles.detailBackBtn}
            activeOpacity={0.7}
            onPress={() => {
              setConfirmDetailAction(null);
              setRsvpError(null);
              setDetailEvent(null);
              Haptics.selectionAsync();
            }}
          >
            <ChevronLeft size={20} color={colors.sage} />
            <Text style={styles.detailBackBtnText}>{t.collab.calendarTitleShort}</Text>
          </TouchableOpacity>

          <Text style={styles.detailNavTitle} numberOfLines={1}>
            {t.collab.calendarDetailsTitle}
          </Text>

          {!detailEvent.isCancelled ? (
            <TouchableOpacity
              style={styles.detailNavEditBtn}
              activeOpacity={0.7}
              onPress={() => {
                setConfirmDetailAction(null);
                handleOpenEditModal(detailEvent);
              }}
            >
              <Pencil size={15} color={colors.sage} />
              <Text style={styles.detailNavEditText}>{t.collab.calendarEditShort}</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 56 }} />
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.detailFullScreenContent,
            { paddingBottom: bottomClearance + 24 },
          ]}
        >
          {/* Main Card */}
          <View style={styles.detailMainCard}>
            <Text
              style={[
                styles.detailEventTitleLarge,
                detailEvent.isCancelled && styles.eventCardTitleCancelled,
              ]}
            >
              {detailEvent.eventTitle}
            </Text>

            {detailEvent.isCancelled ? (
              <View style={styles.detailStatusCancelledBadge}>
                <Ban size={13} color={colors.danger} />
                <Text style={styles.detailStatusCancelledText}>
                  {t.collab.calendarStatusCancelledBadge}
                </Text>
              </View>
            ) : (
              <View style={styles.detailStatusActiveBadge}>
                <View style={styles.detailStatusActiveDot} />
                <Text style={styles.detailStatusActiveText}>
                  {t.collab.calendarStatusActiveBadge}
                </Text>
              </View>
            )}
          </View>

          {/* 3-State Attendance Poll (RSVP) */}
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeaderRow}>
              <View style={styles.detailCardHeader}>
                <Users size={18} color={colors.sage} />
                <Text style={styles.detailCardTitle}>{t.collab.attendancePoll}</Text>
              </View>
              <Text style={[styles.detailRsvpTotalText, { color: colors.subtle }]}>
                {isRsvpLocked
                  ? t.collab.rsvpClosed
                  : t.collab.responsesCount.replace('{count}', String(totalRsvps))}
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              {rsvpOptions.map((opt) => {
                const IconComp = opt.icon;
                const isSelected = myRsvp === opt.status;
                const count = opt.rsvps.length;
                const percent = totalRsvps > 0 ? Math.round((count / totalRsvps) * 100) : 0;

                return (
                  <View key={opt.status} style={{ gap: 4 }}>
                    <TouchableOpacity
                      disabled={isRsvpLocked || rsvpSubmitting !== null}
                      activeOpacity={0.75}
                      onPress={() => handleRsvp(detailEvent.id, opt.status)}
                      style={[
                        styles.rsvpOptionCard,
                        {
                          backgroundColor: isSelected ? opt.washBg : colors.canvas,
                          borderColor: isSelected ? opt.accent : colors.hairline,
                        },
                        isRsvpLocked && { opacity: 0.7 },
                      ]}
                    >
                      <View
                        style={[
                          styles.rsvpProgressFill,
                          {
                            width: `${percent}%`,
                            backgroundColor: opt.accent,
                            opacity: isSelected ? 0.18 : 0.1,
                          },
                        ]}
                      />
                      <View style={styles.rsvpOptionInner}>
                        <View style={styles.rsvpOptionLeft}>
                          <IconComp size={15} color={opt.accent} />
                          <Text
                            style={[
                              styles.rsvpOptionLabel,
                              { color: colors.text },
                              isSelected && { fontWeight: '700' },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.rsvpOptionCount,
                            { color: isSelected ? opt.accent : colors.subtle },
                          ]}
                        >
                          {rsvpSubmitting === opt.status ? '...' : `${count} (${percent}%)`}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {opt.rsvps.length > 0 && (
                      <Text style={[styles.rsvpAttendeesLine, { color: colors.subtle }]} numberOfLines={1}>
                        {opt.rsvps
                          .map((r) => r.user?.profile?.displayName || t.collab.memberDefault)
                          .join(', ')}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>

            {rsvpError ? (
              <Text style={[styles.inlineErrorSmall, { color: colors.danger }]}>{rsvpError}</Text>
            ) : null}
          </View>

          {/* Time Card (Bare icon invariant) */}
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Clock size={18} color={colors.sage} />
              <Text style={styles.detailCardTitle}>{t.collab.calendarTimeSectionTitle}</Text>
            </View>

            <View style={styles.detailTimeRow}>
              <View style={styles.detailTimeCol}>
                <Text style={styles.detailTimeLabel}>{t.collab.startsAt}</Text>
                <Text style={styles.detailTimeValueHour}>
                  {startDateObj.toLocaleTimeString(dateLocale, {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </Text>
                <Text style={styles.detailTimeValueDate}>
                  {startDateObj.toLocaleDateString(dateLocale, {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <View style={styles.detailTimeDivider} />

              <View style={styles.detailTimeCol}>
                <Text style={styles.detailTimeLabel}>{t.collab.endsAt}</Text>
                {endDateObj ? (
                  <>
                    <Text style={styles.detailTimeValueHour}>
                      {endDateObj.toLocaleTimeString(dateLocale, {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </Text>
                    <Text style={styles.detailTimeValueDate}>
                      {endDateObj.toLocaleDateString(dateLocale, {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.detailTimeValueHour, { color: colors.subtle }]}>
                    -- : --
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Online Call Card */}
          {isCall ? (
            <View style={[styles.detailCard, styles.detailCallCard]}>
              <View style={styles.detailCardHeader}>
                <Video size={18} color={colors.sage} />
                <Text style={styles.detailCardTitle}>{t.collab.calendarOnlineCallTitle}</Text>
              </View>

              <Text style={styles.detailCallDesc}>
                {cleanLocationText(detailEvent.location, t) || t.collab.calendarOnlineCallDefault}
              </Text>

              {callUrl && (
                <TouchableOpacity
                  style={[styles.detailJoinCallBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                  onPress={() => Linking.openURL(callUrl).catch(() => {})}
                >
                  <Video size={16} color={colors.onPrimary} />
                  <Text style={[styles.detailJoinCallBtnText, { color: colors.onPrimary }]}>
                    {t.collab.calendarJoinCallNow}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {/* Physical Location Card */}
          {isPhysicalLoc ? (
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <MapPin size={18} color={isDark ? '#FBBF24' : '#D97706'} />
                <Text style={styles.detailCardTitle}>{t.collab.calendarLocationSectionTitle}</Text>
              </View>

              <Text style={styles.detailCardBodyText}>
                {cleanLocationText(detailEvent.location, t)}
              </Text>

              <TouchableOpacity
                style={styles.detailMapLinkBtn}
                activeOpacity={0.7}
                onPress={() => {
                  const locUrl = extractLocationUrl(detailEvent.location);
                  if (locUrl) {
                    Linking.openURL(locUrl).catch(() => {});
                  } else {
                    const mapQuery = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      detailEvent.location!,
                    )}`;
                    Linking.openURL(mapQuery).catch(() => {});
                  }
                }}
              >
                <MapPin size={14} color={colors.sage} />
                <Text style={styles.detailMapLinkBtnText}>{t.collab.calendarDirectionsBtn}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Recurrence Card */}
          {repeatSummary ? (
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <Repeat size={18} color={colors.subtle} />
                <Text style={styles.detailCardTitle}>{t.collab.calendarRepeatSectionTitle}</Text>
              </View>
              <Text style={styles.detailCardBodyText}>{repeatSummary}</Text>
            </View>
          ) : null}

          {/* Reminder Card */}
          {detailEvent.reminderTime ? (
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <Bell size={18} color={isDark ? '#FBBF24' : '#D97706'} />
                <Text style={styles.detailCardTitle}>{t.collab.calendarReminderSectionTitle}</Text>
              </View>
              <Text style={styles.detailCardBodyText}>{t.collab.calendarReminderActiveDesc}</Text>
            </View>
          ) : null}

          {/* Notes Card */}
          {hasValidDesc ? (
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <Info size={18} color={colors.subtle} />
                <Text style={styles.detailCardTitle}>{t.collab.calendarNotesSectionTitle}</Text>
              </View>
              <Text style={styles.detailNotesText}>{cleanDescriptionText}</Text>
            </View>
          ) : null}

          {/* Organizer Card */}
          {detailEvent.creator ? (
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <CalendarDays size={18} color={colors.subtle} />
                <Text style={styles.detailCardTitle}>{t.collab.calendarCreatorSectionTitle}</Text>
              </View>
              <Text style={styles.detailCardBodyText}>
                {detailEvent.creator?.nickname ||
                  detailEvent.creator?.user?.profile?.displayName ||
                  t.collab.memberDefault}
              </Text>
            </View>
          ) : null}

          {/* Actions + Inline 2-Step Confirmations */}
          <View style={styles.detailActionButtonsGroup}>
            {confirmDetailAction ? (
              <View
                style={[
                  styles.inlineDetailConfirmCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: confirmDetailAction === 'delete' ? '#DC2626' : colors.hairline,
                  },
                ]}
              >
                <Text style={[styles.inlineDetailConfirmTitle, { color: colors.text }]}>
                  {confirmDetailAction === 'cancel'
                    ? t.collab.calendarCancelTitle
                    : t.collab.calendarDeleteTitle}
                </Text>
                <Text style={[styles.inlineDetailConfirmDesc, { color: colors.subtle }]}>
                  {confirmDetailAction === 'cancel'
                    ? t.collab.cancelEventWarning
                    : t.collab.deleteEventWarning}
                </Text>
                <View style={styles.inlineDetailConfirmBtns}>
                  <TouchableOpacity
                    onPress={() => setConfirmDetailAction(null)}
                    disabled={isMutatingDetail}
                    style={[styles.inlineDetailCancelBtn, { borderColor: colors.hairline }]}
                  >
                    <Text style={[styles.inlineDetailCancelText, { color: colors.text }]}>
                      {t.common.cancel}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmDetailAction}
                    disabled={isMutatingDetail}
                    style={[
                      styles.inlineDetailDestroyBtn,
                      {
                        backgroundColor:
                          confirmDetailAction === 'cancel' ? '#D97706' : '#DC2626',
                      },
                    ]}
                  >
                    {isMutatingDetail ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.inlineDetailDestroyText}>
                        {confirmDetailAction === 'cancel'
                          ? t.collab.calendarCancelConfirmBtn
                          : t.collab.calendarDeleteConfirmBtn}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {!detailEvent.isCancelled && (
                  <TouchableOpacity
                    style={styles.detailActionCancelBtn}
                    activeOpacity={0.8}
                    onPress={() => setConfirmDetailAction('cancel')}
                  >
                    <Ban size={18} color={isDark ? '#FBBF24' : '#B45309'} />
                    <Text style={styles.detailActionCancelBtnText}>
                      {t.collab.calendarCancelDetailBtn}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.detailActionDeleteBtn}
                  activeOpacity={0.8}
                  onPress={() => setConfirmDetailAction('delete')}
                >
                  <Trash2 size={18} color={colors.danger} />
                  <Text style={styles.detailActionDeleteBtnText}>
                    {t.collab.calendarDeleteDetailBtn}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderYearView = () => {
    const today = new Date();

    return (
      <View style={[styles.container, { backgroundColor: colors.canvas }]}>
        <View style={[styles.appleYearHeader, { paddingTop: topClearance }]}>
          <View style={{ flex: 1 }} />

          <View style={styles.appleHeaderActions}>
            <TouchableOpacity
              style={styles.appleMonthTodayBtn}
              onPress={() => {
                const now = new Date();
                setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
                setSelectedDate(now);
                scrollToYear(now.getFullYear(), true);
                Haptics.selectionAsync();
              }}
            >
              <Text style={styles.appleMonthTodayBtnText}>{t.collab.today}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.appleSearchBtn}
              activeOpacity={0.7}
              onPress={() => {
                setIsYearView(false);
                setIsSearchOpen(true);
                Haptics.selectionAsync();
              }}
              accessibilityLabel={t.common.search}
            >
              <Search size={18} color={colors.sage} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.appleMonthAddBtn}
              activeOpacity={0.7}
              onPress={handleOpenCreateModal}
              accessibilityLabel={t.collab.addEvent}
            >
              <Plus size={16} color={colors.onPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.yearCloseBtn}
              onPress={() => {
                setIsYearView(false);
                Haptics.selectionAsync();
              }}
              accessibilityLabel={t.common.close}
            >
              <X size={18} color={colors.subtle} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          ref={yearScrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.yearScrollContent, { paddingBottom: bottomClearance }]}
        >
          {YEARS_RANGE.map((y) => (
            <View
              key={`year-sec-${y}`}
              onLayout={(e) => {
                yearLayoutsRef.current[y] = e.nativeEvent.layout.y;
              }}
              style={styles.yearSectionContainer}
            >
              <Text style={styles.yearSectionTitle}>{y}</Text>

              <View style={styles.yearGridContainer}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const daysInM = new Date(y, m, 0).getDate();
                  const firstDayM = new Date(y, m - 1, 1).getDay();
                  const isCurrentMonthOfToday =
                    today.getFullYear() === y && today.getMonth() + 1 === m;

                  return (
                    <TouchableOpacity
                      key={`year-${y}-m-${m}`}
                      style={[
                        styles.miniMonthBox,
                        isCurrentMonthOfToday && styles.miniMonthBoxActive,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setCurrentDate(new Date(y, m - 1, 1));
                        setIsYearView(false);
                        setTimeout(() => scrollToMonth(y, m, false), 80);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text
                        style={[
                          styles.miniMonthName,
                          isCurrentMonthOfToday && styles.miniMonthNameActive,
                        ]}
                      >
                        {monthShortLabels[m - 1]}
                      </Text>

                      <View style={styles.miniWeekdaysHeader}>
                        {weekdayMinSunFirst.map((d, di) => (
                          <Text
                            key={di}
                            style={[
                              styles.miniWeekdayChar,
                              di === 0 && { color: colors.danger },
                            ]}
                          >
                            {d}
                          </Text>
                        ))}
                      </View>

                      <View style={styles.miniDaysGrid}>
                        {Array.from({ length: firstDayM }).map((_, ei) => (
                          <View key={`empty-${y}-${m}-${ei}`} style={styles.miniDayCell} />
                        ))}
                        {Array.from({ length: daysInM }).map((_, di) => {
                          const dNum = di + 1;
                          const isDToday =
                            today.getDate() === dNum &&
                            today.getMonth() + 1 === m &&
                            today.getFullYear() === y;

                          return (
                            <View key={`d-${y}-${m}-${dNum}`} style={styles.miniDayCell}>
                              <Text
                                style={[styles.miniDayNumText, isDToday && styles.miniDayNumToday]}
                              >
                                {dNum}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (isYearView) {
    return (
      <>
        {renderYearView()}
        {detailEvent && renderDetailScreen()}
      </>
    );
  }

  const renderEventRowCard = (ev: CalendarEventEntity, targetDate?: Date) => {
    const timeDisplayStr = formatEventTimeForDate(ev, targetDate || new Date(ev.startTime), dateLocale);
    const isCall = isCallUrl(ev.location);
    const locClean = cleanLocationText(ev.location, t);
    const goingCount = (ev.rsvps || []).filter((r) => r.status === EventRsvpStatus.YES).length;

    return (
      <TouchableOpacity
        key={ev.id}
        style={[styles.eventCard, ev.isCancelled && styles.eventCardCancelled]}
        activeOpacity={0.75}
        onPress={() => {
          Haptics.selectionAsync();
          setConfirmDetailAction(null);
          setRsvpError(null);
          setDetailEvent(ev);
        }}
      >
        <View style={styles.eventCardHeader}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            <Text style={[styles.eventCardTitle, ev.isCancelled && styles.eventCardTitleCancelled]}>
              {ev.eventTitle}
            </Text>
            {ev.isCancelled && (
              <View style={styles.cancelledBadge}>
                <Text style={styles.cancelledBadgeText}>{t.collab.eventCancelledTag}</Text>
              </View>
            )}
          </View>
          <ChevronRight size={16} color={colors.subtle} />
        </View>

        <View style={styles.eventInfoRow}>
          <Clock size={12} color={colors.sage} />
          <Text style={styles.eventInfoText}>
            {targetDate
              ? timeDisplayStr
              : `${formatDateOnly(new Date(ev.startTime), dateLocale)} · ${timeDisplayStr}`}
          </Text>
          {goingCount > 0 && (
            <Text style={[styles.eventGoingCountTag, { color: colors.sage }]}>
              · {t.collab.railMembersGoing.replace('{count}', String(goingCount))}
            </Text>
          )}
        </View>

        {ev.location && !isCall ? (
          <View style={styles.eventInfoRow}>
            <MapPin size={12} color={colors.subtle} />
            <Text style={styles.eventInfoText} numberOfLines={1}>
              {locClean || ev.location}
            </Text>
          </View>
        ) : null}

        {ev.location && isCall ? (
          <View style={styles.eventInfoRow}>
            <Video size={12} color={colors.sage} />
            <Text
              style={[styles.eventInfoText, { color: colors.sage, fontWeight: '500' }]}
              numberOfLines={1}
            >
              {locClean}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const isSearchingActive = isSearchOpen && searchQuery.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {statusNotice ? (
        <View pointerEvents="box-none" style={[styles.noticeWrapper, { top: topClearance + 4 }]}>
          <View
            style={[
              styles.noticeBanner,
              {
                backgroundColor: colors.surface,
                borderColor: statusNotice.type === 'success' ? colors.sage : '#DC2626',
              },
            ]}
          >
            {statusNotice.type === 'success' ? (
              <Check size={14} color={colors.sage} />
            ) : (
              <X size={14} color="#DC2626" />
            )}
            <Text style={[styles.noticeText, { color: colors.text }]} numberOfLines={2}>
              {statusNotice.message}
            </Text>
            <TouchableOpacity
              onPress={() => setStatusNotice(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={t.common.close}
            >
              <X size={14} color={colors.subtle} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Month Calendar Header */}
      <View style={[styles.appleMonthCalendarHeader, { paddingTop: topClearance }]}>
        <View style={styles.appleMonthTitleContainer}>
          <TouchableOpacity
            style={styles.appleYearBtn}
            activeOpacity={0.7}
            onPress={() => {
              setIsYearView(true);
              Haptics.selectionAsync();
            }}
          >
            <Text style={styles.appleYearBtnText}>{year}</Text>
          </TouchableOpacity>
          <Text style={styles.appleMonthTitleText}>{monthShortLabels[month - 1]}</Text>
        </View>

        <View style={styles.appleHeaderActions}>
          <TouchableOpacity
            style={styles.appleMonthTodayBtn}
            onPress={() => {
              const now = new Date();
              setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelectedDate(now);
              setIsSearchOpen(false);
              setSearchQuery('');
              scrollToMonth(now.getFullYear(), now.getMonth() + 1, true);
              Haptics.selectionAsync();
            }}
          >
            <Text style={styles.appleMonthTodayBtnText}>{t.collab.today}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.appleSearchBtn,
              isSearchOpen && { backgroundColor: colors.wash, borderColor: colors.sage, borderWidth: 1 },
            ]}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.selectionAsync();
              setIsSearchOpen((prev) => {
                if (prev) setSearchQuery('');
                return !prev;
              });
            }}
            accessibilityLabel={t.collab.calendarSearchTitle}
          >
            <Search size={18} color={colors.sage} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.appleMonthAddBtn}
            onPress={handleOpenCreateModal}
            accessibilityLabel={t.collab.addEvent}
          >
            <Plus size={16} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Inline Search Bar */}
      {isSearchOpen && (
        <View style={styles.searchBarContainer}>
          <View
            style={[
              styles.searchBarBox,
              { backgroundColor: colors.surface, borderColor: colors.hairline },
            ]}
          >
            <Search size={15} color={colors.subtle} />
            <TextInput
              style={[styles.searchBarInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t.collab.calendarSearchPlaceholderShort}
              placeholderTextColor={colors.subtle}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => {
                if (searchQuery) {
                  setSearchQuery('');
                } else {
                  setIsSearchOpen(false);
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={t.common.close}
            >
              <X size={15} color={colors.subtle} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search Results Mode OR Standard Month Grid + Day Events */}
      {isSearchingActive ? (
        <ScrollView
          style={styles.eventsScrollView}
          contentContainerStyle={[
            styles.eventsScrollContent,
            { paddingBottom: bottomClearance },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {searchResults.length > 0 ? (
            <View style={{ gap: 10 }}>
              {searchResults.map((ev) => renderEventRowCard(ev))}
            </View>
          ) : (
            <View style={styles.noEventsCard}>
              <CalendarDays size={32} color={colors.subtle} />
              <Text style={styles.noEventsText}>{t.collab.calendarNoMatchingEvents}</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <>
          <View style={styles.calendarTopContainer}>
            <View style={styles.appleMonthWeekdaysRowFixed}>
              {weekdayShortSunFirst.map((d, i) => (
                <Text
                  key={i}
                  style={[styles.appleMonthWeekdayText, i === 0 && { color: colors.danger }]}
                >
                  {d}
                </Text>
              ))}
            </View>

            <ScrollView
              ref={monthScrollRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={MONTH_PAGE_HEIGHT}
              decelerationRate="fast"
              snapToAlignment="start"
              style={styles.monthScrollViewport}
              contentContainerStyle={styles.monthScrollContent}
              onMomentumScrollEnd={handleMonthScrollEnd}
            >
              {MONTHS_RANGE.map((item) => {
                const itemYear = item.year;
                const itemMonth = item.month;
                const itemDaysInMonth = new Date(itemYear, itemMonth, 0).getDate();
                const itemFirstDay = new Date(itemYear, itemMonth - 1, 1).getDay();
                const totalSlots = 42;
                const trailingEmpty = totalSlots - (itemFirstDay + itemDaysInMonth);

                return (
                  <View key={item.key} style={styles.monthPageBlock}>
                    <View style={styles.appleMainMonthGrid}>
                      {Array.from({ length: itemFirstDay }).map((_, i) => (
                        <View
                          key={`empty-lead-${item.key}-${i}`}
                          style={styles.appleMonthEmptyDayCell}
                        />
                      ))}

                      {Array.from({ length: itemDaysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const now = new Date();
                        const isSelected =
                          selectedDate.getDate() === dayNum &&
                          selectedDate.getMonth() + 1 === itemMonth &&
                          selectedDate.getFullYear() === itemYear;

                        const isToday =
                          now.getDate() === dayNum &&
                          now.getMonth() + 1 === itemMonth &&
                          now.getFullYear() === itemYear;

                        const dayEventsCount = events.filter((ev) =>
                          isEventOccurringOnDate(ev, new Date(itemYear, itemMonth - 1, dayNum)),
                        ).length;
                        const dotsCount = Math.min(dayEventsCount, 5);

                        return (
                          <TouchableOpacity
                            key={`day-${item.key}-${dayNum}`}
                            style={styles.appleMonthDayCell}
                            activeOpacity={0.7}
                            onPress={() => {
                              const newSel = new Date(itemYear, itemMonth - 1, dayNum);
                              setSelectedDate(newSel);
                              if (itemMonth !== month || itemYear !== year) {
                                setCurrentDate(new Date(itemYear, itemMonth - 1, 1));
                              }
                              Haptics.selectionAsync();
                            }}
                          >
                            <View
                              style={[
                                styles.appleMonthDayCircle,
                                isSelected &&
                                  (isToday
                                    ? styles.appleMonthDayCircleTodaySelected
                                    : styles.appleMonthDayCircleSelected),
                              ]}
                            >
                              <Text
                                style={[
                                  styles.appleMonthDayText,
                                  isToday && !isSelected && styles.appleMonthDayTextToday,
                                  isSelected &&
                                    (isToday
                                      ? styles.appleMonthDayTextTodaySelected
                                      : styles.appleMonthDayTextSelected),
                                ]}
                              >
                                {dayNum}
                              </Text>
                            </View>

                            <View style={styles.appleMonthEventDotsContainer}>
                              {Array.from({ length: dotsCount }).map((_, dotIdx) => (
                                <View
                                  key={`dot-${dotIdx}`}
                                  style={[
                                    styles.appleMonthEventDot,
                                    isSelected && !isToday && styles.appleMonthEventDotSelected,
                                  ]}
                                />
                              ))}
                            </View>
                          </TouchableOpacity>
                        );
                      })}

                      {Array.from({ length: Math.max(0, trailingEmpty) }).map((_, i) => (
                        <View
                          key={`empty-trail-${item.key}-${i}`}
                          style={styles.appleMonthEmptyDayCell}
                        />
                      ))}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            style={styles.eventsScrollView}
            contentContainerStyle={[
              styles.eventsScrollContent,
              { paddingBottom: bottomClearance },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.subtle} style={{ marginTop: 20 }} />
            ) : selectedDayEvents.length > 0 ? (
              <View style={{ gap: 10, marginTop: 4 }}>
                {selectedDayEvents.map((ev) => renderEventRowCard(ev, selectedDate))}
              </View>
            ) : (
              <View style={styles.noEventsCard}>
                <CalendarDays size={32} color={colors.subtle} />
                <Text style={styles.noEventsText}>{t.collab.noEventsOnDay}</Text>
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* Add / Edit Event Modal */}
      <Modal
        visible={isAddModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={styles.appleModalContent}>
            {/* Modal Nav Bar */}
            <View style={styles.appleNavBar}>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setIsAddModalOpen(false);
                }}
                disabled={isSubmitting}
                style={styles.appleNavBtn}
              >
                <Text style={styles.appleCancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>

              <Text style={styles.appleNavTitle}>
                {editingEvent ? t.collab.calendarEditEventShort : t.collab.calendarNewEventShort}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  handleCreateOrUpdateEvent();
                }}
                disabled={isSubmitting}
                style={styles.appleNavBtn}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.sage} />
                ) : (
                  <Text style={styles.appleAddText}>
                    {editingEvent ? t.common.save : t.collab.calendarAddShort}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {formError ? (
              <View style={styles.modalFormErrorWrap}>
                <View style={styles.errorBanner}>
                  <AlertCircle size={15} color={isDark ? '#F87171' : '#DC2626'} />
                  <Text style={styles.errorBannerText}>{formError}</Text>
                  <TouchableOpacity onPress={() => setFormError(null)}>
                    <X size={14} color={isDark ? '#F87171' : '#DC2626'} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onScrollBeginDrag={dismissKeyboardAndPickers}
              contentContainerStyle={[
                styles.appleScrollView,
                { paddingBottom: bottomClearance + 20 },
              ]}
            >
              {/* Group 1: Title & Location */}
              <View style={styles.appleGroupCard}>
                <TextInput
                  style={styles.appleTitleInput}
                  placeholder={t.collab.calendarTitleShortPlaceholder}
                  placeholderTextColor={colors.subtle}
                  value={title}
                  onChangeText={(val) => {
                    setTitle(val);
                    if (formError) setFormError(null);
                  }}
                  onFocus={closeAllPickers}
                />
                <View style={styles.hairlineDivider} />
                <View style={styles.appleLocationRow}>
                  <MapPin size={16} color={colors.subtle} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.appleLocationInput}
                    placeholder={t.collab.calendarLocationOrCallPlaceholder}
                    placeholderTextColor={colors.subtle}
                    value={location}
                    onChangeText={setLocation}
                    onFocus={closeAllPickers}
                  />
                  {isSearchingLocation && (
                    <ActivityIndicator size="small" color={colors.subtle} style={{ marginRight: 8 }} />
                  )}
                  {location.length > 0 && !isSearchingLocation && (
                    <TouchableOpacity
                      onPress={() => {
                        setLocation('');
                        setLocationSuggestions([]);
                        setShowLocationSuggestions(false);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={14} color={colors.subtle} />
                    </TouchableOpacity>
                  )}
                </View>

                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <View style={styles.suggestionsDropdown}>
                    <Text style={styles.suggestionsHeader}>{t.collab.calendarMapSuggestionsCaps}</Text>
                    {locationSuggestions.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectLocation(item)}
                      >
                        <MapPin size={13} color={colors.danger} style={{ marginTop: 2 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.suggestionName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.suggestionAddress} numberOfLines={1}>
                            {item.address}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Group 2: Start & End Time */}
              <View style={styles.appleGroupCard}>
                <View style={styles.appleRow}>
                  <Text style={styles.appleRowLabel}>{t.collab.startsAt}</Text>
                  <View style={styles.applePillsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.applePill,
                        activePickerTarget === 'start_date' && styles.applePillActive,
                      ]}
                      onPress={() => togglePickerTarget('start_date')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.applePillText,
                          activePickerTarget === 'start_date' && styles.applePillTextActive,
                        ]}
                      >
                        {formatDateOnly(startDate, dateLocale)}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.applePill,
                        activePickerTarget === 'start_time' && styles.applePillActive,
                      ]}
                      onPress={() => togglePickerTarget('start_time')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.applePillText,
                          activePickerTarget === 'start_time' && styles.applePillTextActive,
                        ]}
                      >
                        {formatTimeOnly(startHour, startMinute)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {activePickerTarget === 'start_date' && renderDatePicker('start')}
                {activePickerTarget === 'start_time' && renderTimePicker('start')}

                <View style={styles.hairlineDivider} />

                <View style={styles.appleRow}>
                  <Text style={styles.appleRowLabel}>{t.collab.endsAt}</Text>
                  <View style={styles.applePillsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.applePill,
                        activePickerTarget === 'end_date' && styles.applePillActive,
                      ]}
                      onPress={() => togglePickerTarget('end_date')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.applePillText,
                          activePickerTarget === 'end_date' && styles.applePillTextActive,
                        ]}
                      >
                        {formatDateOnly(endDate, dateLocale)}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.applePill,
                        activePickerTarget === 'end_time' && styles.applePillActive,
                      ]}
                      onPress={() => togglePickerTarget('end_time')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.applePillText,
                          activePickerTarget === 'end_time' && styles.applePillTextActive,
                        ]}
                      >
                        {formatTimeOnly(endHour, endMinute)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {activePickerTarget === 'end_date' && renderDatePicker('end')}
                {activePickerTarget === 'end_time' && renderTimePicker('end')}
              </View>

              {/* Group 3: Recurrence */}
              <View style={styles.appleGroupCard}>
                <TouchableOpacity
                  style={[styles.appleRow, { minHeight: 44, paddingVertical: 11, alignItems: 'center' }]}
                  onPress={() => {
                    closeAllPickers();
                    setIsRepeatModalOpen(true);
                    Haptics.selectionAsync();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.appleRowLabel, { minWidth: 70 }]}>
                    {t.collab.calendarRepeatLabel}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      flex: 1,
                      justifyContent: 'flex-end',
                      marginLeft: 24,
                    }}
                  >
                    <Text
                      style={[
                        styles.appleRowValue,
                        { textAlign: 'right', flexShrink: 1, lineHeight: 20 },
                      ]}
                      numberOfLines={2}
                    >
                      {currentRepeatLabel}
                    </Text>
                    <ChevronRight size={14} color={colors.subtle} style={{ flexShrink: 0 }} />
                  </View>
                </TouchableOpacity>

                {recurrenceConfig.frequency !== 'none' && (
                  <>
                    <View style={styles.hairlineDivider} />
                    <View style={styles.appleRow}>
                      <Text style={styles.appleRowLabel}>{t.collab.calendarEndRepeatLabel}</Text>
                      <View style={styles.applePillsContainer}>
                        <TouchableOpacity
                          style={[
                            styles.applePill,
                            isEndRepeatPickerOpen && styles.applePillActive,
                          ]}
                          onPress={() => {
                            Haptics.selectionAsync();
                            const baseD = recurrenceConfig.endDate || startDate;
                            setEndRepeatPickerMonthDate(
                              new Date(baseD.getFullYear(), baseD.getMonth(), 1),
                            );
                            setIsEndRepeatPickerOpen((prev) => !prev);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.applePillText,
                              isEndRepeatPickerOpen && styles.applePillTextActive,
                              !recurrenceConfig.endDate && {
                                color: colors.subtle,
                                fontWeight: '400',
                              },
                            ]}
                          >
                            {recurrenceConfig.endDate
                              ? formatDateOnly(recurrenceConfig.endDate, dateLocale)
                              : t.collab.calendarEndRepeatUnset}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {isEndRepeatPickerOpen && renderEndRepeatDatePicker()}
                  </>
                )}
              </View>

              {/* Group 4: Reminder & Notes */}
              <View style={styles.appleGroupCard}>
                <TouchableOpacity
                  style={styles.appleRow}
                  onPress={() => {
                    closeAllPickers();
                    setIsReminderModalOpen(true);
                    Haptics.selectionAsync();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.appleRowLabel}>{t.collab.calendarRemindBeforeLabel}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.appleRowValue}>{currentReminderLabel}</Text>
                    <ChevronRight size={14} color={colors.subtle} />
                  </View>
                </TouchableOpacity>

                <View style={styles.hairlineDivider} />

                <View style={styles.appleNotesRow}>
                  <TextInput
                    style={styles.appleNotesInput}
                    placeholder={t.collab.calendarNotesShortPlaceholder}
                    placeholderTextColor={colors.subtle}
                    multiline
                    numberOfLines={3}
                    value={description}
                    onChangeText={setDescription}
                    onFocus={closeAllPickers}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={{ height: 80 }}
                activeOpacity={1}
                onPress={dismissKeyboardAndPickers}
              />
            </ScrollView>

            {/* In-Modal Repeat Popup */}
            {isRepeatModalOpen && (
              <View style={styles.inModalPopupBackdrop}>
                <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  activeOpacity={1}
                  onPress={() => setIsRepeatModalOpen(false)}
                />
                <View style={styles.popupCard}>
                  <View style={styles.popupHeader}>
                    <Text style={styles.popupTitle}>{t.collab.calendarRepeatLabel}</Text>
                    <TouchableOpacity
                      onPress={() => setIsRepeatModalOpen(false)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.popupCloseText}>{t.common.close}</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.popupList}>
                    {repeatOptions.map((item, idx) => {
                      const isSelected =
                        item.value === 'custom'
                          ? Boolean(recurrenceConfig.isCustom)
                          : !recurrenceConfig.isCustom &&
                            recurrenceConfig.frequency === item.value;

                      return (
                        <TouchableOpacity
                          key={item.value}
                          style={[
                            styles.popupItem,
                            idx < repeatOptions.length - 1 && styles.popupItemBorder,
                          ]}
                          onPress={() => {
                            Haptics.selectionAsync();
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
                          activeOpacity={0.6}
                        >
                          <Text
                            style={[
                              styles.popupItemText,
                              isSelected && styles.popupItemTextSelected,
                            ]}
                          >
                            {item.label}
                          </Text>
                          {isSelected && <Check size={18} color={colors.sage} />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* In-Modal Reminder Popup */}
            {isReminderModalOpen && (
              <View style={styles.inModalPopupBackdrop}>
                <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  activeOpacity={1}
                  onPress={() => setIsReminderModalOpen(false)}
                />
                <View style={styles.popupCard}>
                  <View style={styles.popupHeader}>
                    <Text style={styles.popupTitle}>{t.collab.calendarRemindBeforeLabel}</Text>
                    <TouchableOpacity
                      onPress={() => setIsReminderModalOpen(false)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.popupCloseText}>{t.common.close}</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.popupList}>
                    {reminderOptions.map((item, idx) => {
                      const isSelected = reminderMinutes === item.value;
                      return (
                        <TouchableOpacity
                          key={item.value}
                          style={[
                            styles.popupItem,
                            idx < reminderOptions.length - 1 && styles.popupItemBorder,
                          ]}
                          onPress={() => {
                            setReminderMinutes(item.value);
                            Haptics.selectionAsync();
                            setIsReminderModalOpen(false);
                          }}
                          activeOpacity={0.6}
                        >
                          <Text
                            style={[
                              styles.popupItemText,
                              isSelected && styles.popupItemTextSelected,
                            ]}
                          >
                            {item.label}
                          </Text>
                          {isSelected && <Check size={18} color={colors.sage} />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            )}

            {renderCustomRepeatModal()}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {detailEvent && renderDetailScreen()}
    </View>
  );
};

const createStyles = (colors: ColorTheme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    noticeWrapper: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 60,
    },
    noticeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    noticeText: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
    },
    searchBarContainer: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    searchBarBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
    },
    searchBarInput: {
      flex: 1,
      fontSize: 13,
      padding: 0,
    },
    eventCardCancelled: {
      opacity: 0.78,
      borderColor: colors.hairline,
      backgroundColor: colors.canvas,
    },
    eventCardTitleCancelled: {
      textDecorationLine: 'line-through',
      color: colors.subtle,
    },
    cancelledBadge: {
      backgroundColor: isDark ? 'rgba(248, 113, 113, 0.15)' : '#FEE2E2',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    cancelledBadgeText: {
      color: colors.danger,
      fontSize: 11,
      fontWeight: '600',
    },
    // Detail Full-Screen Overlay
    detailFullScreenContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.canvas,
      zIndex: 999,
    },
    detailNavHeader: {
      backgroundColor: colors.surface,
      paddingBottom: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      gap: 8,
    },
    detailBackBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 4,
      gap: 2,
      minWidth: 56,
    },
    detailBackBtnText: {
      fontSize: 15,
      color: colors.sage,
      fontWeight: '600',
    },
    detailNavTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    detailNavEditBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: colors.wash,
      minWidth: 56,
      justifyContent: 'center',
    },
    detailNavEditText: {
      fontSize: 13,
      color: colors.sage,
      fontWeight: '600',
    },
    detailFullScreenContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    detailMainCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      gap: 10,
    },
    detailEventTitleLarge: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 30,
    },
    detailStatusCancelledBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(248, 113, 113, 0.14)' : '#FEF2F2',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(248, 113, 113, 0.35)' : '#FECACA',
    },
    detailStatusCancelledText: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: '600',
    },
    detailStatusActiveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(52, 211, 153, 0.14)' : '#F0FDF4',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(52, 211, 153, 0.35)' : '#BBF7D0',
    },
    detailStatusActiveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.sage,
    },
    detailStatusActiveText: {
      color: colors.sage,
      fontSize: 12,
      fontWeight: '600',
    },
    detailCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    detailCallCard: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.10)' : '#F0F9FF',
      borderColor: isDark ? 'rgba(56, 189, 248, 0.28)' : '#BAE6FD',
    },
    detailCardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    detailCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    detailCardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    detailRsvpTotalText: {
      fontSize: 11,
      fontWeight: '600',
      marginBottom: 10,
    },
    rsvpOptionCard: {
      position: 'relative',
      borderWidth: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    rsvpProgressFill: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
    },
    rsvpOptionInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
      zIndex: 1,
    },
    rsvpOptionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    rsvpOptionLabel: {
      fontSize: 13,
      fontWeight: '500',
    },
    rsvpOptionCount: {
      fontSize: 12,
      fontWeight: '600',
    },
    rsvpAttendeesLine: {
      fontSize: 11,
      paddingHorizontal: 4,
    },
    inlineErrorSmall: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 8,
    },
    detailTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.canvas,
      borderRadius: 12,
      padding: 12,
    },
    detailTimeCol: {
      flex: 1,
    },
    detailTimeDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.hairline,
      marginHorizontal: 12,
    },
    detailTimeLabel: {
      fontSize: 12,
      color: colors.subtle,
      marginBottom: 2,
      fontWeight: '500',
    },
    detailTimeValueHour: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    detailTimeValueDate: {
      fontSize: 12,
      color: colors.subtle,
      marginTop: 2,
    },
    detailCardBodyText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      fontWeight: '500',
    },
    detailNotesText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 22,
      backgroundColor: colors.canvas,
      padding: 12,
      borderRadius: 10,
    },
    detailCallDesc: {
      fontSize: 14,
      color: isDark ? '#7DD3FC' : '#0369A1',
      fontWeight: '500',
      marginBottom: 12,
    },
    detailJoinCallBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 999,
      paddingVertical: 12,
    },
    detailJoinCallBtnText: {
      fontSize: 15,
      fontWeight: '700',
    },
    detailMapLinkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      paddingVertical: 4,
    },
    detailMapLinkBtnText: {
      fontSize: 13,
      color: colors.sage,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    detailActionButtonsGroup: {
      marginTop: 12,
      gap: 12,
    },
    inlineDetailConfirmCard: {
      borderRadius: 14,
      borderWidth: 1,
      padding: 14,
      gap: 6,
    },
    inlineDetailConfirmTitle: {
      fontSize: 14,
      fontWeight: '700',
    },
    inlineDetailConfirmDesc: {
      fontSize: 12,
      lineHeight: 18,
    },
    inlineDetailConfirmBtns: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 8,
    },
    inlineDetailCancelBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
    },
    inlineDetailCancelText: {
      fontSize: 12,
      fontWeight: '600',
    },
    inlineDetailDestroyBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      minWidth: 90,
      alignItems: 'center',
    },
    inlineDetailDestroyText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    detailActionCancelBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.12)' : '#FFFBEB',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(251, 191, 36, 0.35)' : '#FDE68A',
      borderRadius: 14,
      paddingVertical: 14,
    },
    detailActionCancelBtnText: {
      color: isDark ? '#FBBF24' : '#B45309',
      fontSize: 15,
      fontWeight: '600',
    },
    detailActionDeleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDark ? 'rgba(248, 113, 113, 0.12)' : '#FEF2F2',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(248, 113, 113, 0.35)' : '#FECACA',
      borderRadius: 14,
      paddingVertical: 14,
    },
    detailActionDeleteBtnText: {
      color: colors.danger,
      fontSize: 15,
      fontWeight: '600',
    },
    appleYearBtn: {
      paddingVertical: 2,
      paddingHorizontal: 4,
      borderRadius: 8,
    },
    appleYearBtnText: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.sage,
      letterSpacing: -0.4,
    },
    appleSearchBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    calendarTopContainer: {
      backgroundColor: colors.surface,
      height: 312,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    appleMonthWeekdaysRowFixed: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    monthScrollViewport: {
      height: 276,
    },
    monthScrollContent: {
      flexGrow: 0,
    },
    monthPageBlock: {
      height: 276,
      paddingHorizontal: 16,
      justifyContent: 'flex-start',
    },
    yearSectionContainer: {
      marginBottom: 28,
    },
    yearSectionTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    eventsScrollView: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    eventsScrollContent: {
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    appleYearHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    yearCloseBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    yearScrollContent: {
      paddingHorizontal: 14,
      paddingTop: 12,
    },
    yearGridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
    },
    miniMonthBox: {
      width: '30.5%',
      backgroundColor: isDark ? colors.elevated : colors.surface,
      borderRadius: 12,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    miniMonthBoxActive: {
      borderColor: colors.sage,
      backgroundColor: colors.wash,
    },
    miniMonthName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
      textAlign: 'center',
    },
    miniMonthNameActive: {
      color: colors.sage,
    },
    miniWeekdaysHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    miniWeekdayChar: {
      fontSize: 7.5,
      fontWeight: '600',
      color: colors.subtle,
      width: `${100 / 7}%`,
      textAlign: 'center',
    },
    miniDaysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    miniDayCell: {
      width: `${100 / 7}%`,
      height: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    miniDayNumText: {
      fontSize: 7.5,
      color: colors.text,
      fontWeight: '400',
    },
    miniDayNumToday: {
      color: colors.danger,
      fontWeight: '800',
    },
    appleMonthCalendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 8,
      backgroundColor: 'transparent',
    },
    appleMonthTitleContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    appleMonthTitleText: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.4,
    },
    appleHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    appleMonthTodayBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.surface,
    },
    appleMonthTodayBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.sage,
    },
    appleMonthAddBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appleMonthWeekdayText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.subtle,
      width: `${100 / 7}%`,
      textAlign: 'center',
    },
    appleMonthEmptyDayCell: {
      width: `${100 / 7}%`,
      height: 46,
    },
    appleMonthDayCell: {
      width: `${100 / 7}%`,
      height: 46,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 2,
    },
    appleMonthDayCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appleMonthDayCircleSelected: {
      backgroundColor: colors.text,
    },
    appleMonthDayCircleTodaySelected: {
      backgroundColor: '#DC2626',
    },
    appleMonthDayText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    appleMonthDayTextToday: {
      color: colors.danger,
      fontWeight: '700',
    },
    appleMonthDayTextSelected: {
      color: colors.canvas,
      fontWeight: '700',
    },
    appleMonthDayTextTodaySelected: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    appleMonthEventDotsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      height: 5,
      marginTop: 2,
    },
    appleMonthEventDot: {
      width: 3.5,
      height: 3.5,
      borderRadius: 2,
      backgroundColor: colors.subtle,
    },
    appleMonthEventDotSelected: {
      backgroundColor: colors.canvas,
    },
    eventCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.hairline,
      gap: 6,
    },
    eventCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    eventCardTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    eventInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    eventInfoText: {
      fontSize: 11,
      color: colors.subtle,
      fontWeight: '500',
    },
    eventGoingCountTag: {
      fontSize: 11,
      fontWeight: '600',
    },
    noEventsCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.hairline,
      gap: 8,
      marginTop: 8,
    },
    noEventsText: {
      fontSize: 12,
      color: colors.subtle,
      fontWeight: '500',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'flex-end',
    },
    appleModalContent: {
      backgroundColor: isDark ? colors.canvas : colors.surface,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      height: '92%',
      overflow: 'hidden',
    },
    inModalPopupBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
      padding: 24,
    },
    applePickerBodyFixedContainer: {
      minHeight: 250,
      justifyContent: 'center',
    },
    appleNavBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    appleNavBtn: {
      paddingVertical: 4,
      paddingHorizontal: 6,
      minWidth: 48,
    },
    appleNavTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    appleCancelText: {
      fontSize: 16,
      color: colors.sage,
      fontWeight: '500',
    },
    appleAddText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.sage,
      textAlign: 'right',
    },
    modalFormErrorWrap: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDark ? 'rgba(248, 113, 113, 0.14)' : '#FFE4E6',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(248, 113, 113, 0.35)' : '#FECDD3',
      borderRadius: 10,
      padding: 10,
    },
    errorBannerText: {
      fontSize: 12,
      color: isDark ? '#FCA5A5' : '#DC2626',
      fontWeight: '600',
      flex: 1,
    },
    appleScrollView: {
      padding: 16,
    },
    appleGroupCard: {
      backgroundColor: isDark ? colors.surface : colors.canvas,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.hairline,
      marginBottom: 16,
      overflow: 'hidden',
    },
    appleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 48,
    },
    appleRowLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    appleRowValue: {
      fontSize: 15,
      color: colors.subtle,
      fontWeight: '400',
    },
    popupCard: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.hairline,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    popupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
      backgroundColor: colors.canvas,
    },
    popupTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    popupCloseText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.sage,
    },
    popupList: {
      maxHeight: 380,
    },
    popupItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 13,
    },
    popupItemBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    popupItemText: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '400',
    },
    popupItemTextSelected: {
      color: colors.sage,
      fontWeight: '600',
    },
    hairlineDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.hairline,
      marginLeft: 16,
    },
    appleTitleInput: {
      fontSize: 16,
      color: colors.text,
      paddingHorizontal: 16,
      paddingVertical: 13,
    },
    appleLocationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    appleLocationInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      padding: 0,
    },
    suggestionsDropdown: {
      margin: 10,
      backgroundColor: isDark ? colors.elevated : colors.canvas,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 10,
      overflow: 'hidden',
    },
    suggestionsHeader: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.subtle,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: colors.wash,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    suggestionName: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    suggestionAddress: {
      fontSize: 10,
      color: colors.subtle,
      marginTop: 1,
    },
    applePillsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    applePill: {
      backgroundColor: isDark ? colors.elevated : 'rgba(118, 118, 128, 0.12)',
      borderRadius: 8,
      paddingHorizontal: 11,
      paddingVertical: 6,
    },
    applePillActive: {
      backgroundColor: colors.wash,
    },
    applePillText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    applePillTextActive: {
      color: colors.sage,
      fontWeight: '600',
    },
    appleInlinePickerContainer: {
      backgroundColor: isDark ? colors.surface : colors.canvas,
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hairline,
    },
    applePickerMonthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 4,
    },
    applePickerMonthBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    applePickerMonthText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    applePickerArrows: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    applePickerArrowBtn: {
      padding: 4,
    },
    appleWeekdaysRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 6,
      marginBottom: 2,
    },
    appleWeekdayText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.subtle,
      width: `${100 / 7}%`,
      textAlign: 'center',
    },
    appleDaysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    appleDayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 1,
    },
    appleDayCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appleDayCircleSelected: {
      backgroundColor: colors.primary,
    },
    appleDayNumber: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '400',
    },
    appleDayNumberToday: {
      color: colors.danger,
      fontWeight: '700',
    },
    appleDayNumberSelected: {
      color: colors.onPrimary,
      fontWeight: '700',
    },
    appleNotesRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    appleNotesInput: {
      fontSize: 15,
      color: colors.text,
      minHeight: 64,
      textAlignVertical: 'top',
      padding: 0,
    },
    wheelStage: {
      height: WHEEL_VISIBLE_HEIGHT,
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      marginVertical: 4,
    },
    wheelCenterPill: {
      position: 'absolute',
      left: 8,
      right: 8,
      top: WHEEL_PADDING,
      height: WHEEL_ITEM_HEIGHT,
      backgroundColor: colors.hairline,
      borderRadius: 10,
      zIndex: 1,
    },
    wheelColumn: {
      flex: 1,
      height: '100%',
      zIndex: 2,
    },
    wheelItem: {
      height: WHEEL_ITEM_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wheelItemText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.subtle,
      opacity: 0.65,
    },
    wheelItemTextSelected: {
      color: colors.text,
      fontWeight: '700',
      opacity: 1,
      transform: [{ scale: 1.08 }],
    },
    wheelDivider: {
      zIndex: 2,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wheelDividerText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.subtle,
    },
    appleStepperGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    appleStepperMinusBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDark ? colors.elevated : 'rgba(118, 118, 128, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    appleStepperPlusBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDark ? colors.elevated : 'rgba(118, 118, 128, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    appleStepperInput: {
      minWidth: 40,
      height: 32,
      backgroundColor: isDark ? colors.elevated : 'rgba(118, 118, 128, 0.08)',
      borderRadius: 8,
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      paddingVertical: 0,
      paddingHorizontal: 6,
    },
    appleStepperUnit: {
      fontSize: 15,
      color: colors.subtle,
      fontWeight: '400',
      marginLeft: 4,
    },
    appleWeekdaysRowWrapper: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    appleWeekdayPill: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? colors.elevated : 'rgba(118, 118, 128, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    appleWeekdayPillActive: {
      backgroundColor: colors.primary,
    },
    appleWeekdayPillText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.text,
    },
    appleWeekdayPillTextActive: {
      color: colors.onPrimary,
      fontWeight: '700',
    },
    appleSegmentWrapper: {
      flexDirection: 'row',
      backgroundColor: isDark ? colors.elevated : 'rgba(118, 118, 128, 0.12)',
      borderRadius: 8,
      padding: 2,
    },
    appleSegmentBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appleSegmentBtnActive: {
      backgroundColor: isDark ? colors.canvas : colors.surface,
    },
    appleSegmentBtnText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.subtle,
    },
    appleSegmentBtnTextActive: {
      color: colors.sage,
      fontWeight: '600',
    },
    appleMainMonthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: isDark ? colors.surface : colors.canvas,
      paddingVertical: 4,
    },
    appleMonthDaysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: isDark ? colors.surface : colors.canvas,
    },
    appleDayCellContainer: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 2,
    },
    appleDayNumberCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    appleDayNumberCircleActive: {
      backgroundColor: colors.primary,
    },
    appleDayNumberText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.text,
    },
    appleDayNumberTextActive: {
      color: colors.onPrimary,
      fontWeight: '700',
    },
    appleSubRow: {
      paddingVertical: 10,
      paddingLeft: 16,
    },
    appleSubRowLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.subtle,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    applePillsScroll: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 16,
    },
    appleSectionFooter: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 11,
      backgroundColor: colors.wash,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hairline,
    },
    appleSectionFooterText: {
      fontSize: 13,
      color: colors.sage,
      lineHeight: 18,
      flex: 1,
      fontWeight: '600',
    },
    customRepeatModalContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDark ? colors.canvas : colors.surface,
      zIndex: 1100,
    },
    customRepeatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    customRepeatTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
    },
    customRepeatCancelText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '400',
    },
    customRepeatDoneText: {
      fontSize: 16,
      color: colors.sage,
      fontWeight: '600',
    },
    customRepeatScrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
  });
