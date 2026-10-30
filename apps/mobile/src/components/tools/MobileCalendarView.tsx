import { useAuthStore } from '../../stores/auth.store';
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
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Calendar as CalendarIcon,
  Plus,
  Minus,
  Clock,
  MapPin,
  Trash2,
  Pencil,
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
  Search,
  Info,
  HelpCircle,
  Users,
  Repeat,
} from 'lucide-react-native';
import {
  getCalendarEventsApi,
  createCalendarEventApi,
  updateCalendarEventApi,
  cancelCalendarEventApi,
  deleteCalendarEventApi,
  respondCalendarEventRsvpApi,
} from '../../services/circle-tools.service';
import { CalendarEventEntity, CalendarEventRsvpEntity, EventRsvpStatus } from '@circle/types';

const isLocationUrl = (loc?: string | null): boolean => {
  if (!loc) return false;
  return /(https?:\/\/[^\s]+|(?:meet\.google\.com|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl\/maps)\/[^\s]+)/i.test(loc);
};

const extractLocationUrl = (loc?: string | null): string | null => {
  if (!loc) return null;
  const match = loc.match(/(https?:\/\/[^\s]+|(?:meet\.google\.com|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl\/maps)\/[^\s]+)/i);
  if (!match) return null;
  return match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
};

const isCallUrl = (loc?: string | null): boolean => {
  if (!loc) return false;
  return /(meet\.google\.com|zoom\.us|teams\.microsoft\.com|call|video|facetime|webex)/i.test(loc);
};

const cleanLocationText = (loc?: string | null): string => {
  if (!loc) return '';
  const cleaned = loc.replace(/https?:\/\/[^\s]+/g, '').trim().replace(/\s*[-–—:]+\s*$/g, '').trim();
  if (!cleaned) {
    if (/meet\.google\.com/i.test(loc)) return 'Google Meet';
    if (/zoom\.us/i.test(loc)) return 'Zoom Meeting';
    if (/maps/i.test(loc)) return 'Vị trí trên bản đồ';
    return 'Xem liên kết';
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
    const daysStr = config.weeklyDays
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
  };
};

const formatDateOnly = (d: Date) => {
  const day = pad2(d.getDate());
  const month = pad2(d.getMonth() + 1);
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatAppleDate = (d: Date) => {
  return `${d.getDate()} thg ${d.getMonth() + 1}, ${d.getFullYear()}`;
};

const formatTimeOnly = (h: number, m: number) => {
  return `${pad2(h)}:${pad2(m)}`;
};

const formatDateTimeDisplay = (d: Date, h: number, m: number) => {
  const day = pad2(d.getDate());
  const month = pad2(d.getMonth() + 1);
  const year = d.getFullYear();
  const hour = pad2(h);
  const min = pad2(m);
  return `${day}/${month}/${year} ${hour}:${min}`;
};

const createDateFromParts = (d: Date, h: number, m: number): Date => {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0);
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 00 - 59
const MONTH_NAMES = Array.from({ length: 12 }, (_, i) => `Tháng ${String(i + 1).padStart(2, '0')}`);
const YEARS = Array.from({ length: 35 }, (_, i) => 2015 + i); // 2015 - 2049

const WHEEL_ITEM_HEIGHT = 38;
const WHEEL_VISIBLE_HEIGHT = 228;
const WHEEL_PADDING = (WHEEL_VISIBLE_HEIGHT - WHEEL_ITEM_HEIGHT) / 2; // 95px

const REPEAT_OPTIONS = [
  { label: 'Không lặp lại', value: 'none' },
  { label: 'Hằng ngày', value: 'daily' },
  { label: 'Hằng tuần', value: 'weekly' },
  { label: 'Hằng tháng', value: 'monthly' },
  { label: 'Hằng năm', value: 'yearly' },
  { label: 'Tùy chỉnh...', value: 'custom' },
];

const REMINDER_OPTIONS = [
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
        yearlyNthMonth: raw.yearlyNthMonth || 1,
        yearlyDay: raw.yearlyDay || 1,
        yearlyNthOrder: raw.yearlyNthOrder || 'first',
        yearlyNthWeekday: raw.yearlyNthWeekday || 1,
        endType: raw.endType || 'never',
        endDate: raw.endDate ? new Date(raw.endDate) : null,
      };
      const cleanDesc = desc
        .replace(/\[RECURRENCE:.*?\]/g, '')
        .replace(/\[Lặp lại:.*?\]/g, '')
        .trim();
      return { cleanDesc, recurrenceConfig: config };
    } catch {
      // ignore parse error
    }
  }
  const cleanDesc = desc.replace(/\[Lặp lại:.*?\]/g, '').trim();
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

  // Trước ngày bắt đầu -> không hiển thị
  if (targetTime < startDayTime) return false;

  const { recurrenceConfig } = parseEventRecurrence(ev.description);

  // Trường hợp không lặp: kiểm tra khoảng [startTime, endTime] (hỗ trợ nhiều ngày)
  if (!recurrenceConfig || recurrenceConfig.frequency === 'none') {
    const endDate = ev.endTime ? new Date(ev.endTime) : startDate;
    const endDayTime = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
    ).getTime();
    return targetTime >= startDayTime && targetTime <= endDayTime;
  }

  // Trường hợp lặp lại (Recurrence)
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

export function formatEventTimeForDate(ev: CalendarEventEntity, targetDate: Date): string {
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

  const startHourStr = evStart.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endHourStr = evEnd.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Sự kiện diễn ra trong cùng một ngày
  if (startDayTime === endDayTime) {
    return ev.endTime ? `${startHourStr} – ${endHourStr}` : startHourStr;
  }

  // Sự kiện kéo dài qua nhiều ngày (Multi-day):
  // 1. Ngày đầu tiên: Từ giờ bắt đầu đến hết ngày (23:59)
  if (targetDayTime === startDayTime) {
    return `${startHourStr} – 23:59`;
  }
  // 2. Ngày cuối cùng: Từ đầu ngày (00:00) đến giờ kết thúc
  if (targetDayTime === endDayTime) {
    return `00:00 – ${endHourStr}`;
  }
  // 3. Các ngày ở giữa: Trọn vẹn cả ngày (00:00 – 23:59)
  if (targetDayTime > startDayTime && targetDayTime < endDayTime) {
    return '00:00 – 23:59';
  }

  return ev.endTime ? `${startHourStr} – ${endHourStr}` : startHourStr;
}

interface MobileCalendarViewProps {
  circleId: string;
}

export const MobileCalendarView: React.FC<MobileCalendarViewProps> = ({ circleId }) => {
  const user = useAuthStore((s) => s.user);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEventEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add event modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventEntity | null>(null);
  const [detailEvent, setDetailEvent] = useState<CalendarEventEntity | null>(null);
  const [isYearView, setIsYearView] = useState(false);

  const MONTH_PAGE_HEIGHT = 276;

  // Dải tháng hiển thị cuộn lướt theo từng tháng (từ 2024 đến 2028: 60 tháng)
  const MONTHS_RANGE = useMemo(() => {
    const list: { year: number; month: number; key: string }[] = [];
    for (let y = 2024; y <= 2028; y++) {
      for (let m = 1; m <= 12; m++) {
        list.push({ year: y, month: m, key: `${y}-${m}` });
      }
    }
    return list;
  }, []);

  // Dải năm hiển thị cuộn dọc trong chế độ Year View (2023 đến 2028)
  const YEARS_RANGE = useMemo(() => {
    const list: number[] = [];
    for (let y = 2023; y <= 2028; y++) {
      list.push(y);
    }
    return list;
  }, []);

  const monthScrollRef = useRef<ScrollView>(null);
  const yearLayoutsRef = useRef<Record<number, number>>({});
  const yearScrollRef = useRef<ScrollView>(null);

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
        (item.year !== currentDate.getFullYear() ||
          item.month !== currentDate.getMonth() + 1)
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
  const [isQuickReminderModalOpen, setIsQuickReminderModalOpen] = useState(false);
  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);

  // End repeat date picker states (độc lập với ngày kết thúc sự kiện)
  const [isEndRepeatPickerOpen, setIsEndRepeatPickerOpen] = useState(false);
  const [isEndRepeatMonthYearOpen, setIsEndRepeatMonthYearOpen] = useState(false);
  const [endRepeatPickerMonthDate, setEndRepeatPickerMonthDate] = useState<Date>(new Date());
  const endRepeatPickerMonthScrollRef = useRef<any>(null);
  const endRepeatPickerYearScrollRef = useRef<any>(null);

  // Start Date & Time
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [startHour, setStartHour] = useState(6);
  const [startMinute, setStartMinute] = useState(0);

  // End Date & Time (Mặc định là ngày đó và lúc 23:59)
  const [hasEndTime, setHasEndTime] = useState(true);
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [endHour, setEndHour] = useState(23);
  const [endMinute, setEndMinute] = useState(59);

  // Location suggestions
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Date & Time Picker (Hiển thị ngay dưới, tách riêng ngày và giờ)
  const [activePickerTarget, setActivePickerTarget] = useState<
    'start_date' | 'start_time' | 'end_date' | 'end_time' | null
  >(null);
  const [isPickerMonthYearOpen, setIsPickerMonthYearOpen] = useState(false);
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date());

  // Picker Month calculations
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

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = await getCalendarEventsApi(circleId, month, year);
      setEvents(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tải lịch hẹn');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [circleId, month, year]);

  // Tự động cuộn đến tháng hiện tại sau khi layout khởi tạo
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToMonth(year, month, false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Tự động cuộn đến năm hiện tại khi mở Year View
  useEffect(() => {
    if (isYearView) {
      const timer = setTimeout(() => {
        scrollToYear(year, false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isYearView, year]);

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const firstDayOfWeek = useMemo(
    () => new Date(year, month - 1, 1).getDay(),
    [year, month],
  );

  const currentRepeatLabel = useMemo(() => {
    if (recurrenceConfig.frequency === 'none') {
      return 'Không lặp lại';
    }
    if (recurrenceConfig.isCustom) {
      return formatRecurrenceSummary(recurrenceConfig);
    }
    switch (recurrenceConfig.frequency) {
      case 'daily':
        return 'Hằng ngày';
      case 'weekly':
        return 'Hằng tuần';
      case 'monthly':
        return 'Hằng tháng';
      case 'yearly':
        return 'Hằng năm';
      default:
        return 'Không lặp lại';
    }
  }, [recurrenceConfig]);

  const currentReminderLabel = useMemo(() => {
    return REMINDER_OPTIONS.find((r) => r.value === reminderMinutes)?.label || 'Trước 15 phút';
  }, [reminderMinutes]);

  // Đóng các bộ chọn ngày/giờ mà không tắt bàn phím (dùng khi người dùng focus ô nhập text)
  const closeAllPickers = useCallback(() => {
    setActivePickerTarget(null);
    setIsPickerMonthYearOpen(false);
    setIsEndRepeatPickerOpen(false);
    setIsEndRepeatMonthYearOpen(false);
  }, []);

  // Tắt cả bàn phím lẫn đóng bộ chọn ngày/giờ (dùng khi cuộn hoặc chạm nền ngoài)
  const dismissKeyboardAndPickers = useCallback(() => {
    Keyboard.dismiss();
    setActivePickerTarget(null);
    setIsPickerMonthYearOpen(false);
    setIsEndRepeatPickerOpen(false);
    setIsEndRepeatMonthYearOpen(false);
  }, []);

  // Open Create Modal with smart defaults matching Web
  const handleOpenCreateModal = () => {
    setEditingEvent(null);
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

    // Mặc định giờ bắt đầu là 06:00 ngày đó (per user request)
    setStartDate(targetDate);
    setStartHour(6);
    setStartMinute(0);

    // Mặc định kết thúc là ngày đó và lúc 23:59 (bắt buộc có)
    setHasEndTime(true);
    setEndDate(targetDate);
    setEndHour(23);
    setEndMinute(59);
    setActivePickerTarget(null);
    setIsPickerMonthYearOpen(false);

    setIsAddModalOpen(true);
  };

  // Location search autocomplete with Photon API
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
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          trimmed,
        )}&lat=10.7769&lon=106.7009&limit=5`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const mapped = (data.features || []).map((f: any) => {
            const p = f.properties || {};
            const name = p.name || p.street || trimmed;
            const parts = [
              p.name,
              p.housenumber ? `Số ${p.housenumber}` : '',
              p.street,
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
      } catch (err) {
        console.warn('Mobile location search error:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [location]);

  const handleSelectLocation = (item: any) => {
    // Để tên địa điểm (ví dụ: Gigamall thay vì Gigamall, số 240-242...)
    const displayName = item.name || item.address;
    setLocation(displayName);
    setShowLocationSuggestions(false);
    Keyboard.dismiss();
    Haptics.selectionAsync();
  };

  // Hàm kiểm tra tính hợp lệ khi người dùng nhấn "Thêm"
  const validateForm = (): string | null => {
    if (!title.trim()) return 'Vui lòng nhập tên sự kiện';

    const start = createDateFromParts(startDate, startHour, startMinute);
    const end = createDateFromParts(endDate, endHour, endMinute);

    if (end.getTime() <= start.getTime()) {
      return 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu';
    }

    if (recurrenceConfig.frequency !== 'none' && recurrenceConfig.endType === 'on_date' && recurrenceConfig.endDate) {
      const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endRepeatDay = new Date(
        recurrenceConfig.endDate.getFullYear(),
        recurrenceConfig.endDate.getMonth(),
        recurrenceConfig.endDate.getDate(),
      );
      if (endRepeatDay.getTime() < startDay.getTime()) {
        return 'Ngày kết thúc lặp lại phải sau hoặc cùng ngày bắt đầu sự kiện';
      }
    }

    return null;
  };

const handleOpenEditModal = (ev: CalendarEventEntity) => {
    setEditingEvent(ev);
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
      setHasEndTime(true);
      setEndDate(evEnd);
      setEndHour(evEnd.getHours());
      setEndMinute(evEnd.getMinutes());
    } else {
      setHasEndTime(false);
      setEndDate(evStart);
      setEndHour(23);
      setEndMinute(59);
    }

    if (ev.reminderTime) {
      const remDate = new Date(ev.reminderTime);
      const diffMins = Math.round((evStart.getTime() - remDate.getTime()) / (60 * 1000));
      setReminderMinutes(diffMins > 0 ? String(diffMins) : '15');
    } else {
      setReminderMinutes('none');
    }

    if (savedConfig) {
      setRecurrenceConfig(savedConfig);
    } else {
      setRecurrenceConfig(
        createDefaultRecurrenceConfig(
          evStart,
          ev.endTime ? new Date(ev.endTime) : evStart,
        ),
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
      Alert.alert('Chưa hợp lệ', validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      const evStart = createDateFromParts(startDate, startHour, startMinute);
      const evEnd = endDate ? createDateFromParts(endDate, endHour, endMinute) : undefined;

      let reminderTime: string | undefined = undefined;
      if (reminderMinutes !== 'none') {
        const mins = parseInt(reminderMinutes, 10);
        reminderTime = new Date(evStart.getTime() - mins * 60 * 1000).toISOString();
      }

      let fullDesc = description.trim() || undefined;
      if (recurrenceConfig.frequency !== 'none') {
        const repeatSummary = formatRecurrenceSummary(recurrenceConfig);
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
          yearlyDay: recurrenceConfig.yearlyDay,
          yearlyNthOrder: recurrenceConfig.yearlyNthOrder,
          yearlyNthWeekday: recurrenceConfig.yearlyNthWeekday,
          endType: recurrenceConfig.endType,
          endDate: recurrenceConfig.endDate ? recurrenceConfig.endDate.toISOString() : null,
        });
        const recurrenceTag = `[RECURRENCE:${serialized}]`;
        const userRepeatText = `[Lặp lại: ${repeatSummary}]`;
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
      } else {
        await createCalendarEventApi(circleId, {
          eventTitle: title.trim(),
          description: fullDesc,
          location: location.trim() || undefined,
          startTime: evStart.toISOString(),
          endTime: evEnd ? evEnd.toISOString() : undefined,
          reminderTime,
        });
      }

      setIsAddModalOpen(false);
      setEditingEvent(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadEvents();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || (editingEvent ? 'Không thể cập nhật sự kiện' : 'Không thể tạo sự kiện'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEvent = (eventId: string) => {
    Alert.alert(
      'Hủy lịch hẹn',
      'Bạn có chắc chắn muốn hủy lịch hẹn này? Sự kiện sẽ được đánh dấu là Đã hủy và hiển thị trên lịch nhóm.',
      [
        { text: 'Quay lại', style: 'cancel' },
        {
          text: 'Xác nhận hủy',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelCalendarEventApi(circleId, eventId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadEvents();
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể hủy lịch hẹn');
            }
          },
        },
      ],
    );
  };

  const handleDeleteEvent = (eventId: string) => {
    Alert.alert(
      'Xóa vĩnh viễn',
      'Bạn có chắc chắn muốn xóa vĩnh viễn sự kiện này khỏi lịch nhóm?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCalendarEventApi(circleId, eventId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadEvents();
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể xóa sự kiện');
            }
          },
        },
      ],
    );
  };

  const handleCancelEventInDetail = (eventId: string) => {
    Alert.alert(
      'Hủy lịch hẹn',
      'Bạn có chắc chắn muốn hủy lịch hẹn này? Sự kiện sẽ được đánh dấu là Đã hủy và hiển thị trên lịch nhóm.',
      [
        { text: 'Quay lại', style: 'cancel' },
        {
          text: 'Xác nhận hủy',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelCalendarEventApi(circleId, eventId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setDetailEvent((prev) => (prev && prev.id === eventId ? { ...prev, isCancelled: true } : prev));
              loadEvents();
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể hủy lịch hẹn');
            }
          },
        },
      ],
    );
  };

  const handleDeleteEventInDetail = (eventId: string) => {
    Alert.alert(
      'Xóa vĩnh viễn',
      'Bạn có chắc chắn muốn xóa vĩnh viễn sự kiện này khỏi lịch nhóm?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCalendarEventApi(circleId, eventId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setDetailEvent(null);
              loadEvents();
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể xóa sự kiện');
            }
          },
        },
      ],
    );
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

  // Cuộn bánh xe giờ & phút vào vị trí trung tâm khi hiển thị bộ chọn giờ
  useEffect(() => {
    if (activePickerTarget === 'start_time' || activePickerTarget === 'end_time') {
      const activeH = activePickerTarget === 'start_time' ? startHour : endHour;
      const activeM = activePickerTarget === 'start_time' ? startMinute : endMinute;
      const timer = setTimeout(() => {
        pickerHoursScrollRef.current?.scrollTo({ y: activeH * WHEEL_ITEM_HEIGHT, animated: false });
        pickerMinutesScrollRef.current?.scrollTo({ y: activeM * WHEEL_ITEM_HEIGHT, animated: false });
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [activePickerTarget, startHour, startMinute, endHour, endMinute]);

  // Cuộn bánh xe tháng & năm vào vị trí trung tâm khi sổ xuống
  useEffect(() => {
    if (
      isPickerMonthYearOpen &&
      (activePickerTarget === 'start_date' || activePickerTarget === 'end_date')
    ) {
      const timer = setTimeout(() => {
        pickerMonthScrollRef.current?.scrollTo({ y: (pickerMonth - 1) * WHEEL_ITEM_HEIGHT, animated: false });
        const yIdx = YEARS.indexOf(pickerYear);
        if (yIdx !== -1) {
          pickerYearScrollRef.current?.scrollTo({ y: yIdx * WHEEL_ITEM_HEIGHT, animated: false });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isPickerMonthYearOpen, pickerMonth, pickerYear, activePickerTarget]);

  const selectedDayEvents = useMemo(() => {
    return events.filter((ev) => isEventOccurringOnDate(ev, selectedDate));
  }, [events, selectedDate]);

  const renderDatePicker = (target: 'start' | 'end') => {
    const isStart = target === 'start';
    const targetDate = isStart ? startDate : endDate;
    const setTargetDate = isStart ? setStartDate : setEndDate;

    const todayObj = new Date();
    const isTodayYearMonth =
      todayObj.getFullYear() === pickerYear && todayObj.getMonth() + 1 === pickerMonth;

    return (
      <View style={styles.appleInlinePickerContainer}>
        {/* Month Navigation Row: Left has "Tháng MM YYYY", Right has < and > arrows */}
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
              Tháng {pickerMonth} {pickerYear}
            </Text>
            {isPickerMonthYearOpen ? (
              <ChevronDown size={16} color="#0D9488" />
            ) : (
              <ChevronRight size={16} color="#0D9488" />
            )}
          </TouchableOpacity>

          {!isPickerMonthYearOpen && (
            <View style={styles.applePickerArrows}>
              <TouchableOpacity
                onPress={handlePickerPrev}
                style={styles.applePickerArrowBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronLeft size={20} color="#0D9488" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePickerNext}
                style={styles.applePickerArrowBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronRight size={20} color="#0D9488" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Cố định chiều cao vùng nội dung lịch / bánh xe tháng năm để không bị co dãn */}
        <View style={styles.applePickerBodyFixedContainer}>
          {isPickerMonthYearOpen ? (
            /* Bánh xe cuộn Tháng & Năm có cục xám cố định */
            <View style={styles.wheelStage}>
              <View style={styles.wheelCenterPill} pointerEvents="none" />

              {/* Cột Tháng */}
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
                {MONTH_NAMES.map((mName, idx) => {
                  const isSelected = idx === pickerMonth - 1;
                  return (
                    <TouchableOpacity
                      key={mName}
                      style={styles.wheelItem}
                      onPress={() => {
                        pickerMonthScrollRef.current?.scrollTo({ y: idx * WHEEL_ITEM_HEIGHT, animated: true });
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

              {/* Cột Năm */}
              <ScrollView
                ref={pickerYearScrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={WHEEL_ITEM_HEIGHT}
                decelerationRate="fast"
                contentContainerStyle={{ paddingVertical: WHEEL_PADDING }}
                style={styles.wheelColumn}
                onMomentumScrollEnd={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  const idx = Math.min(YEARS.length - 1, Math.max(0, Math.round(y / WHEEL_ITEM_HEIGHT)));
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
                        pickerYearScrollRef.current?.scrollTo({ y: idx * WHEEL_ITEM_HEIGHT, animated: true });
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
            /* Chế độ xem Lưới ngày chuẩn Apple: số tròn, hôm nay màu nhấn */
            <View>
              <View style={styles.appleWeekdaysRow}>
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d) => (
                  <Text key={d} style={styles.appleWeekdayText}>
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
        {/* Bánh xe cuộn Giờ 24h & Phút thuần túy chuẩn Apple Drum-roll có cục xám cố định */}
        <View style={styles.wheelStage}>
          {/* Cục xám cố định ở chính giữa */}
          <View style={styles.wheelCenterPill} pointerEvents="none" />

          {/* Cột Giờ 24h (00 - 23) */}
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
                    pickerHoursScrollRef.current?.scrollTo({ y: h * WHEEL_ITEM_HEIGHT, animated: true });
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

          {/* Dấu hai chấm cố định */}
          <View style={styles.wheelDivider} pointerEvents="none">
            <Text style={styles.wheelDividerText}>:</Text>
          </View>

          {/* Cột Phút (00 - 59) */}
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
                    pickerMinutesScrollRef.current?.scrollTo({ y: m * WHEEL_ITEM_HEIGHT, animated: true });
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

  // Picker Month calculations cho Ngày kết thúc lặp lại
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
    setEndRepeatPickerMonthDate(
      new Date(endRepeatPickerYear, endRepeatPickerMonth - 2, 1),
    );
  };

  const handleEndRepeatPickerNext = () => {
    Haptics.selectionAsync();
    setEndRepeatPickerMonthDate(
      new Date(endRepeatPickerYear, endRepeatPickerMonth, 1),
    );
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
              Tháng {endRepeatPickerMonth} {endRepeatPickerYear}
            </Text>
            {isEndRepeatMonthYearOpen ? (
              <ChevronDown size={16} color="#0D9488" />
            ) : (
              <ChevronRight size={16} color="#0D9488" />
            )}
          </TouchableOpacity>

          {!isEndRepeatMonthYearOpen && (
            <View style={styles.applePickerArrows}>
              <TouchableOpacity
                onPress={handleEndRepeatPickerPrev}
                style={styles.applePickerArrowBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronLeft size={20} color="#0D9488" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEndRepeatPickerNext}
                style={styles.applePickerArrowBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronRight size={20} color="#0D9488" />
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
                {MONTH_NAMES.map((mName, idx) => {
                  const isSelected = idx === endRepeatPickerMonth - 1;
                  return (
                    <TouchableOpacity
                      key={mName}
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
                        style={[
                          styles.wheelItemText,
                          isSelected && styles.wheelItemTextSelected,
                        ]}
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
                  setEndRepeatPickerMonthDate(
                    new Date(YEARS[idx], endRepeatPickerMonth - 1, 1),
                  );
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
                        setEndRepeatPickerMonthDate(
                          new Date(y, endRepeatPickerMonth - 1, 1),
                        );
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text
                        style={[
                          styles.wheelItemText,
                          isSelected && styles.wheelItemTextSelected,
                        ]}
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
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d) => (
                  <Text key={d} style={styles.appleWeekdayText}>
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
                    recurrenceConfig.endDate.getFullYear() === endRepeatPickerYear
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

        {/* Nút Hủy ở trong lịch để đưa về dạng dd/mm/yyyy khi không muốn kết thúc lặp */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: '#E5E5EA',
          }}
        >
          <Text style={{ fontSize: 13, color: '#8E8E93' }}>
            {recurrenceConfig.endDate ? 'Đang chọn ngày kết thúc' : 'Chưa đặt ngày kết thúc'}
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
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#EF4444' }}>
              Hủy
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCustomRepeatModal = () => {
    if (!isCustomRepeatOpen) return null;

    return (
      <View style={styles.customRepeatModalContainer}>
        {/* Navigation Header */}
        <View style={styles.customRepeatHeader}>
          <TouchableOpacity
            onPress={() => setIsCustomRepeatOpen(false)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.customRepeatCancelText}>Hủy</Text>
          </TouchableOpacity>

          <Text style={styles.customRepeatTitle}>Tùy chỉnh</Text>

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
            <Text style={styles.customRepeatDoneText}>Xong</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.customRepeatScrollContent}>
          {/* Card 1: Chu kỳ & Khoảng cách lặp */}
          <View style={styles.appleGroupCard}>
            {/* Hàng Chu kỳ */}
            <View style={styles.appleRow}>
              <Text style={styles.appleRowLabel}>Chu kỳ</Text>
              <View style={styles.appleSegmentWrapper}>
                {[
                  { key: 'daily', label: 'Ngày' },
                  { key: 'weekly', label: 'Tuần' },
                  { key: 'monthly', label: 'Tháng' },
                  { key: 'yearly', label: 'Năm' },
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

            {/* Hàng Khoảng cách lặp (Tần suất) */}
            <View style={styles.appleRow}>
              <Text style={styles.appleRowLabel}>Khoảng cách lặp</Text>
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
                  <Minus size={14} color="#0D9488" strokeWidth={2.5} />
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
                  <Plus size={14} color="#0D9488" strokeWidth={2.5} />
                </TouchableOpacity>

                <Text style={styles.appleStepperUnit}>
                  {customRecConfig.frequency === 'daily' && 'ngày'}
                  {customRecConfig.frequency === 'weekly' && 'tuần'}
                  {customRecConfig.frequency === 'monthly' && 'tháng'}
                  {customRecConfig.frequency === 'yearly' && 'năm'}
                </Text>
              </View>
            </View>
          </View>

          {/* Card 2: Cấu hình chi tiết theo chu kỳ */}
          {/* Hằng tuần: Dải 7 nút tròn T2..CN */}
          {customRecConfig.frequency === 'weekly' && (
            <View style={styles.appleGroupCard}>
              <View style={styles.appleSubRow}>
                <Text style={styles.appleSubRowLabel}>Vào các ngày trong tuần</Text>
              </View>
              <View style={styles.appleWeekdaysRowWrapper}>
                {[
                  { w: 2, label: 'T2' },
                  { w: 3, label: 'T3' },
                  { w: 4, label: 'T4' },
                  { w: 5, label: 'T5' },
                  { w: 6, label: 'T6' },
                  { w: 7, label: 'T7' },
                  { w: 1, label: 'CN' },
                ].map(({ w, label }) => {
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
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Hằng tháng: Segmented Control Theo ngày / Theo thứ */}
          {customRecConfig.frequency === 'monthly' && (
            <View style={styles.appleGroupCard}>
              <View style={styles.appleRow}>
                <Text style={styles.appleRowLabel}>Quy tắc lặp</Text>
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
                      Theo ngày
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
                      Theo thứ
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
                          setCustomRecConfig((prev) => ({
                            ...prev,
                            monthlyDay: d,
                          }));
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
                    <Text style={styles.appleSubRowLabel}>Thứ tự xuất hiện</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.applePillsScroll}
                    >
                      {(
                        [
                          { key: 'first', label: 'Đầu tiên' },
                          { key: 'second', label: 'Thứ 2' },
                          { key: 'third', label: 'Thứ 3' },
                          { key: 'fourth', label: 'Thứ 4' },
                          { key: 'last', label: 'Cuối cùng' },
                        ] as const
                      ).map((item) => {
                        const isSel = customRecConfig.monthlyNthOrder === item.key;
                        return (
                          <TouchableOpacity
                            key={item.key}
                            style={[
                              styles.applePill,
                              isSel && styles.applePillActive,
                            ]}
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
                              style={[
                                styles.applePillText,
                                isSel && styles.applePillTextActive,
                              ]}
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
                    <Text style={styles.appleSubRowLabel}>Thứ trong tuần</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.applePillsScroll}
                    >
                      {[
                        { w: 2, label: 'Thứ Hai' },
                        { w: 3, label: 'Thứ Ba' },
                        { w: 4, label: 'Thứ Tư' },
                        { w: 5, label: 'Thứ Năm' },
                        { w: 6, label: 'Thứ Sáu' },
                        { w: 7, label: 'Thứ Bảy' },
                        { w: 1, label: 'Chủ Nhật' },
                      ].map(({ w, label }) => {
                        const isSel = customRecConfig.monthlyNthWeekday === w;
                        return (
                          <TouchableOpacity
                            key={`c-mnth-w-${w}`}
                            style={[
                              styles.applePill,
                              isSel && styles.applePillActive,
                            ]}
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
                              style={[
                                styles.applePillText,
                                isSel && styles.applePillTextActive,
                              ]}
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

          {/* Hằng năm: Segmented Control Theo ngày / Theo thứ */}
          {customRecConfig.frequency === 'yearly' && (
            <View style={styles.appleGroupCard}>
              <View style={styles.appleRow}>
                <Text style={styles.appleRowLabel}>Quy tắc lặp</Text>
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
                      Theo ngày
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
                      Theo thứ
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {customRecConfig.yearlyType === 'specific_date' ? (
                <View>
                  <View style={styles.hairlineDivider} />
                  <View style={styles.appleSubRow}>
                    <Text style={styles.appleSubRowLabel}>Chọn Tháng</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.applePillsScroll}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                        const isSel = customRecConfig.yearlyMonth === m;
                        return (
                          <TouchableOpacity
                            key={`c-yr-m-${m}`}
                            style={[
                              styles.applePill,
                              isSel && styles.applePillActive,
                            ]}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setCustomRecConfig((prev) => ({
                                ...prev,
                                yearlyMonth: m,
                              }));
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.applePillText,
                                isSel && styles.applePillTextActive,
                              ]}
                            >
                              Tháng {m}
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
                            setCustomRecConfig((prev) => ({
                              ...prev,
                              yearlyDay: d,
                            }));
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
                    <Text style={styles.appleSubRowLabel}>Thứ tự xuất hiện</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.applePillsScroll}
                    >
                      {(
                        [
                          { key: 'first', label: 'Đầu tiên' },
                          { key: 'second', label: 'Thứ 2' },
                          { key: 'third', label: 'Thứ 3' },
                          { key: 'fourth', label: 'Thứ 4' },
                          { key: 'last', label: 'Cuối cùng' },
                        ] as const
                      ).map((item) => {
                        const isSel = customRecConfig.yearlyNthOrder === item.key;
                        return (
                          <TouchableOpacity
                            key={`c-yr-nth-${item.key}`}
                            style={[
                              styles.applePill,
                              isSel && styles.applePillActive,
                            ]}
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
                              style={[
                                styles.applePillText,
                                isSel && styles.applePillTextActive,
                              ]}
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
                    <Text style={styles.appleSubRowLabel}>Thứ trong tuần</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.applePillsScroll}
                    >
                      {[
                        { w: 2, label: 'Thứ Hai' },
                        { w: 3, label: 'Thứ Ba' },
                        { w: 4, label: 'Thứ Tư' },
                        { w: 5, label: 'Thứ Năm' },
                        { w: 6, label: 'Thứ Sáu' },
                        { w: 7, label: 'Thứ Bảy' },
                        { w: 1, label: 'Chủ Nhật' },
                      ].map(({ w, label }) => {
                        const isSel = customRecConfig.yearlyNthWeekday === w;
                        return (
                          <TouchableOpacity
                            key={`c-yr-wk-${w}`}
                            style={[
                              styles.applePill,
                              isSel && styles.applePillActive,
                            ]}
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
                              style={[
                                styles.applePillText,
                                isSel && styles.applePillTextActive,
                              ]}
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
                    <Text style={styles.appleSubRowLabel}>Trong tháng</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.applePillsScroll}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                        const isSel = customRecConfig.yearlyNthMonth === m;
                        return (
                          <TouchableOpacity
                            key={`c-yr-nth-m-${m}`}
                            style={[
                              styles.applePill,
                              isSel && styles.applePillActive,
                            ]}
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
                              style={[
                                styles.applePillText,
                                isSel && styles.applePillTextActive,
                              ]}
                            >
                              Tháng {m}
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

          {/* Card 3: Tóm tắt */}
          <View style={[styles.appleGroupCard, { padding: 0 }]}>
            <View style={styles.appleSectionFooter}>
              <Info size={14} color="#0D9488" style={{ marginTop: 2 }} />
              <Text style={styles.appleSectionFooterText}>
                {formatRecurrenceSummary(customRecConfig)}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  const handleRsvp = async (status: EventRsvpStatus) => {
    if (!detailEvent || detailEvent.isCancelled) return;
    try {
      Haptics.selectionAsync();
      await respondCalendarEventRsvpApi(circleId, detailEvent.id, { status });

      setDetailEvent((prev) => {
        if (!prev) return null;
        const existing = prev.rsvps || [];
        const filtered = existing.filter((r) => r.userId !== user?.id);
        const newRsvp: CalendarEventRsvpEntity = {
          id: `rsvp-${Date.now()}`,
          eventId: prev.id,
          userId: user?.id || '',
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: user
            ? {
                id: user.id,
                email: user.email,
                profile: user.profile
                  ? {
                      displayName: user.profile.displayName || 'Tôi',
                      avatarUrl: user.profile.avatarUrl,
                    }
                  : null,
              }
            : undefined,
        };
        return {
          ...prev,
          rsvps: [...filtered, newRsvp],
        };
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadEvents();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi phản hồi tham gia');
    }
  };

  const handleQuickUpdateReminder = async (optionValue: string) => {
    if (!detailEvent) return;
    setIsUpdatingReminder(true);
    try {
      let newReminderTime: string | null = null;
      if (optionValue !== 'none') {
        const minutes = parseInt(optionValue, 10);
        const startMs = new Date(detailEvent.startTime).getTime();
        newReminderTime = new Date(startMs - minutes * 60 * 1000).toISOString();
      }

      await updateCalendarEventApi(circleId, detailEvent.id, {
        reminderTime: newReminderTime as any,
      });

      setDetailEvent((prev) =>
        prev && prev.id === detailEvent.id
          ? { ...prev, reminderTime: newReminderTime as any }
          : prev,
      );
      setIsQuickReminderModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadEvents();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật nhắc nhở');
    } finally {
      setIsUpdatingReminder(false);
    }
  };

  {/* Màn hình Chi tiết lịch hẹn (Full-Screen View, không phải popup) */}
  const renderDetailScreen = () => {
    if (!detailEvent) return null;
    const { cleanDesc, recurrenceConfig } = parseEventRecurrence(detailEvent.description);
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

    // Luôn hiển thị Lặp lại rõ ràng
    let repeatSummary = 'Không lặp lại';
    if (recurrenceConfig && recurrenceConfig.frequency !== 'none') {
      repeatSummary = formatRecurrenceSummary(recurrenceConfig);
    } else if (detailEvent.description) {
      const match = detailEvent.description.match(/\[Lặp lại:\s*(.*?)\]/);
      if (match) {
        repeatSummary = match[1].trim();
      }
    }

    let reminderLabel = 'Không nhắc';
    if (detailEvent.reminderTime) {
      const remDate = new Date(detailEvent.reminderTime);
      const diffMinutes = Math.round((startDateObj.getTime() - remDate.getTime()) / (60 * 1000));
      if (diffMinutes <= 0) {
        reminderLabel = 'Khi sự kiện diễn ra';
      } else if (diffMinutes >= 1440) {
        const days = Math.round(diffMinutes / 1440);
        reminderLabel = `Trước ${days} ngày (${remDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})`;
      } else if (diffMinutes >= 60) {
        const hours = Math.round(diffMinutes / 60);
        reminderLabel = `Trước ${hours} giờ (${remDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})`;
      } else {
        reminderLabel = `Trước ${diffMinutes} phút (${remDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})`;
      }
    }

    const yesRsvps = detailEvent.rsvps?.filter((r) => r.status === EventRsvpStatus.YES) || [];
    const maybeRsvps = detailEvent.rsvps?.filter((r) => r.status === EventRsvpStatus.MAYBE) || [];
    const noRsvps = detailEvent.rsvps?.filter((r) => r.status === EventRsvpStatus.NO) || [];
    const totalRsvps = yesRsvps.length + maybeRsvps.length + noRsvps.length;
    const myRsvp = detailEvent.rsvps?.find((r) => r.userId === user?.id)?.status;
    const isStarted = new Date(detailEvent.startTime) <= new Date();

    const activeReminderOptionValue = (() => {
      if (!detailEvent?.reminderTime) return 'none';
      const remMs = new Date(detailEvent.reminderTime).getTime();
      const startMs = new Date(detailEvent.startTime).getTime();
      const diffMinutes = Math.round((startMs - remMs) / (60 * 1000));
      if (diffMinutes <= 0) return '0';
      const found = REMINDER_OPTIONS.find((o) => o.value === String(diffMinutes));
      return found ? found.value : String(diffMinutes);
    })();

    return (
      <View style={styles.detailFullScreenContainer}>
        {/* Navigation Header */}
        <View style={styles.detailNavHeader}>
          <TouchableOpacity
            style={styles.detailBackBtn}
            activeOpacity={0.7}
            onPress={() => {
              setDetailEvent(null);
              Haptics.selectionAsync();
            }}
          >
            <ChevronLeft size={22} color="#0D9488" />
            <Text style={styles.detailBackBtnText}>Lịch</Text>
          </TouchableOpacity>

          <Text style={styles.detailNavTitle}>Chi tiết lịch hẹn</Text>

          {!detailEvent.isCancelled ? (
            <TouchableOpacity
              style={styles.detailNavEditBtn}
              activeOpacity={0.7}
              onPress={() => {
                const evToEdit = detailEvent;
                handleOpenEditModal(evToEdit);
              }}
            >
              <Pencil size={16} color="#0D9488" />
              <Text style={styles.detailNavEditText}>Sửa</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 50 }} />
          )}
        </View>

        {/* Scrollable Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailFullScreenContent}
        >
          {/* TOÀN BỘ THÔNG TIN SỰ KIỆN GOM CHUNG TRONG 1 THẺ DUY NHẤT */}
          <View style={styles.detailUnifiedCard}>
            {/* 1. Tên sự kiện & Trạng thái */}
            <View style={styles.detailUnifiedHeader}>
              <Text
                style={[
                  styles.detailEventTitleLarge,
                  detailEvent.isCancelled && styles.eventCardTitleCancelled,
                ]}
              >
                {detailEvent.eventTitle}
              </Text>

              {detailEvent.isCancelled && (
                <View style={styles.detailStatusCancelledBadge}>
                  <Ban size={13} color="#EF4444" />
                  <Text style={styles.detailStatusCancelledText}>Đã hủy lịch hẹn</Text>
                </View>
              )}
            </View>

            {/* Phân cách */}
            <View style={styles.detailUnifiedDivider} />

            {/* 2. Thời gian diễn ra */}
            <View style={styles.detailUnifiedSection}>
              <View style={styles.detailSectionHeader}>
                <Clock size={16} color="#0D9488" />
                <Text style={styles.detailSectionTitle}>Thời gian diễn ra</Text>
              </View>

              <View style={styles.detailTimeRow}>
                <View style={styles.detailTimeCol}>
                  <Text style={styles.detailTimeLabel}>Bắt đầu</Text>
                  <Text style={styles.detailTimeValueHour}>
                    {startDateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.detailTimeValueDate}>
                    {startDateObj.toLocaleDateString('vi-VN', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                <View style={styles.detailTimeDivider} />

                <View style={styles.detailTimeCol}>
                  <Text style={styles.detailTimeLabel}>Kết thúc</Text>
                  {endDateObj ? (
                    <>
                      <Text style={styles.detailTimeValueHour}>
                        {endDateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Text style={styles.detailTimeValueDate}>
                        {endDateObj.toLocaleDateString('vi-VN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.detailTimeValueHour, { color: '#94A3B8' }]}>-- : --</Text>
                  )}
                </View>
              </View>
            </View>

            {/* KHẢO SÁT THAM GIA / RSVP (GIỐNG WEB) */}
            <View style={styles.detailUnifiedDivider} />
            <View style={styles.detailUnifiedSection}>
              <View style={styles.detailSectionHeaderBetween}>
                <View style={styles.detailSectionHeader}>
                  <Users size={16} color="#0D9488" />
                  <Text style={styles.detailSectionTitle}>
                    {detailEvent.isCancelled
                      ? 'Lịch hẹn đã bị hủy'
                      : isStarted
                      ? 'Khảo sát đã đóng'
                      : 'Khảo sát tham gia'}
                  </Text>
                </View>
                <Text style={styles.detailRsvpTotalText}>
                  {totalRsvps} phản hồi
                </Text>
              </View>

              <View style={styles.detailRsvpOptionsCol}>
                {[
                  {
                    status: EventRsvpStatus.YES,
                    label: 'Tham gia',
                    count: yesRsvps.length,
                    percent: totalRsvps > 0 ? Math.round((yesRsvps.length / totalRsvps) * 100) : 0,
                    bgColor: '#ECFDF5',
                    activeBgColor: '#D1FAE5',
                    borderColor: '#10B981',
                    textColor: '#047857',
                    icon: Check,
                  },
                  {
                    status: EventRsvpStatus.MAYBE,
                    label: 'Có thể',
                    count: maybeRsvps.length,
                    percent: totalRsvps > 0 ? Math.round((maybeRsvps.length / totalRsvps) * 100) : 0,
                    bgColor: '#FFFBEB',
                    activeBgColor: '#FEF3C7',
                    borderColor: '#F59E0B',
                    textColor: '#B45309',
                    icon: HelpCircle,
                  },
                  {
                    status: EventRsvpStatus.NO,
                    label: 'Không tham gia',
                    count: noRsvps.length,
                    percent: totalRsvps > 0 ? Math.round((noRsvps.length / totalRsvps) * 100) : 0,
                    bgColor: '#FEF2F2',
                    activeBgColor: '#FEE2E2',
                    borderColor: '#EF4444',
                    textColor: '#B91C1C',
                    icon: X,
                  },
                ].map((opt) => {
                  const isSelected = myRsvp === opt.status;
                  const IconComp = opt.icon;
                  return (
                    <TouchableOpacity
                      key={opt.status}
                      style={[
                        styles.detailRsvpBtn,
                        { backgroundColor: isSelected ? opt.activeBgColor : '#F8FAFC' },
                        isSelected && { borderColor: opt.borderColor, borderWidth: 1.5 },
                      ]}
                      activeOpacity={0.7}
                      disabled={Boolean(detailEvent.isCancelled) || isStarted}
                      onPress={() => handleRsvp(opt.status)}
                    >
                      {/* Progress bar background fill */}
                      <View
                        style={[
                          styles.detailRsvpProgressFill,
                          {
                            width: `${opt.percent}%`,
                            backgroundColor: isSelected ? opt.activeBgColor : opt.bgColor,
                          },
                        ]}
                      />

                      <View style={styles.detailRsvpBtnContent}>
                        <View style={styles.detailRsvpLabelLeft}>
                          <View
                            style={[
                              styles.detailRsvpCheckCircle,
                              isSelected && { backgroundColor: opt.borderColor, borderColor: opt.borderColor },
                            ]}
                          >
                            {isSelected && <Check size={10} color="#FFFFFF" />}
                          </View>
                          <IconComp size={15} color={isSelected ? opt.textColor : '#64748B'} />
                          <Text
                            style={[
                              styles.detailRsvpOptionLabel,
                              isSelected && { color: opt.textColor, fontWeight: '700' },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </View>

                        <View style={styles.detailRsvpStatsRight}>
                          <Text style={styles.detailRsvpCountText}>
                            {opt.count} ({opt.percent}%)
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Cuộc gọi trực tuyến nếu có */}
            {isCall ? (
              <>
                <View style={styles.detailUnifiedDivider} />
                <View style={styles.detailUnifiedSection}>
                  <View style={styles.detailSectionHeader}>
                    <Video size={16} color="#0284C7" />
                    <Text style={styles.detailSectionTitle}>Cuộc gọi trực tuyến</Text>
                  </View>

                  <View style={styles.detailCallEmbed}>
                    <Text style={styles.detailCallDesc}>
                      {cleanLocationText(detailEvent.location) || 'Cuộc gọi video (Google Meet / Zoom)'}
                    </Text>

                    {callUrl && (
                      <TouchableOpacity
                        style={styles.detailJoinCallBtn}
                        activeOpacity={0.8}
                        onPress={() => Linking.openURL(callUrl).catch(() => {})}
                      >
                        <Video size={16} color="#FFFFFF" />
                        <Text style={styles.detailJoinCallBtnText}>Tham gia ngay</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </>
            ) : null}

            {/* 4. Địa điểm trực tiếp nếu có */}
            {isPhysicalLoc ? (
              <>
                <View style={styles.detailUnifiedDivider} />
                <View style={styles.detailUnifiedSection}>
                  <View style={styles.detailSectionHeader}>
                    <MapPin size={16} color="#D97706" />
                    <Text style={styles.detailSectionTitle}>Địa điểm</Text>
                  </View>

                  <Text style={styles.detailCardBodyText}>
                    {cleanLocationText(detailEvent.location)}
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
                    <MapPin size={14} color="#0D9488" />
                    <Text style={styles.detailMapLinkBtnText}>Xem chỉ đường trên bản đồ</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}

            {/* 5. LẶP LẠI (LUÔN HIỂN THỊ ĐẦY ĐỦ) */}
            <View style={styles.detailUnifiedDivider} />
            <View style={styles.detailUnifiedSection}>
              <View style={styles.detailSectionHeader}>
                <Repeat size={16} color="#0D9488" />
                <Text style={styles.detailSectionTitle}>Lặp lại</Text>
              </View>
              <Text style={styles.detailCardBodyText}>{repeatSummary}</Text>
            </View>

            {/* 6. GHI CHÚ (NẰM CHUNG TRONG THẺ, TRÊN THÔNG BÁO NHẮC NHỞ) */}
            <View style={styles.detailUnifiedDivider} />
            <View style={styles.detailUnifiedSection}>
              <View style={styles.detailSectionHeader}>
                <Info size={16} color="#0D9488" />
                <Text style={styles.detailSectionTitle}>Ghi chú</Text>
              </View>
              {hasValidDesc ? (
                <Text style={styles.detailNotesText}>{cleanDescriptionText}</Text>
              ) : (
                <Text style={[styles.detailCardBodyText, { color: '#94A3B8', fontStyle: 'italic' }]}>
                  Không có ghi chú
                </Text>
              )}
            </View>

            {/* 7. THÔNG BÁO NHẮC NHỞ (CHỈNH NHANH TRỰC TIẾP TẠI CHỖ) */}
            <View style={styles.detailUnifiedDivider} />
            <View style={styles.detailUnifiedSection}>
              <View style={styles.detailSectionHeaderBetween}>
                <View style={styles.detailSectionHeader}>
                  <Bell size={16} color="#D97706" />
                  <Text style={styles.detailSectionTitle}>Thông báo nhắc nhở</Text>
                </View>
                {!detailEvent.isCancelled && (
                  <TouchableOpacity
                    style={styles.detailQuickReminderBtn}
                    activeOpacity={0.7}
                    disabled={isUpdatingReminder}
                    onPress={() => setIsQuickReminderModalOpen(true)}
                  >
                    <Text style={styles.detailQuickReminderBtnText}>Chỉnh nhanh</Text>
                    <ChevronDown size={14} color="#0D9488" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.detailReminderRowTouch}
                activeOpacity={0.7}
                disabled={detailEvent.isCancelled || isUpdatingReminder}
                onPress={() => setIsQuickReminderModalOpen(true)}
              >
                <Text style={styles.detailReminderValueText}>{reminderLabel}</Text>
                {!detailEvent.isCancelled && (
                  <Text style={styles.detailReminderTapHint}>Chạm để đổi</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 8. NGƯỜI TẠO */}
            {detailEvent.creator ? (
              <>
                <View style={styles.detailUnifiedDivider} />
                <View style={styles.detailUnifiedSection}>
                  <View style={styles.detailSectionHeader}>
                    <CalendarDays size={16} color="#64748B" />
                    <Text style={styles.detailSectionTitle}>Người tạo</Text>
                  </View>
                  <Text style={styles.detailCardBodyText}>
                    {detailEvent.creator?.nickname ||
                      detailEvent.creator?.user?.profile?.displayName ||
                      'Thành viên Circle'}
                  </Text>
                </View>
              </>
            ) : null}
          </View>

          {/* Nhóm nút hành động: Hủy lịch hẹn & Xóa sự kiện */}
          <View style={styles.detailActionButtonsGroup}>
            {!detailEvent.isCancelled && (
              <TouchableOpacity
                style={styles.detailActionCancelBtn}
                activeOpacity={0.8}
                onPress={() => handleCancelEventInDetail(detailEvent.id)}
              >
                <Ban size={18} color="#D97706" />
                <Text style={styles.detailActionCancelBtnText}>Hủy lịch hẹn này</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.detailActionDeleteBtn}
              activeOpacity={0.8}
              onPress={() => handleDeleteEventInDetail(detailEvent.id)}
            >
              <Trash2 size={18} color="#EF4444" />
              <Text style={styles.detailActionDeleteBtnText}>Xóa vĩnh viễn khỏi lịch nhóm</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Popup Overlay Chọn Nhanh Thông Báo Nhắc Nhở */}
        {isQuickReminderModalOpen && (
          <View style={styles.inModalPopupBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setIsQuickReminderModalOpen(false)}
            />
            <View style={styles.popupCard}>
              <View style={styles.popupHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Bell size={18} color="#D97706" />
                  <Text style={styles.popupTitle}>Chọn thông báo nhắc nhở</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsQuickReminderModalOpen(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.popupCloseText}>Đóng</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.popupList}>
                {REMINDER_OPTIONS.map((item, idx) => {
                  const isSelected = activeReminderOptionValue === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.popupItem,
                        idx < REMINDER_OPTIONS.length - 1 && styles.popupItemBorder,
                      ]}
                      onPress={() => handleQuickUpdateReminder(item.value)}
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
                      {isSelected && <Check size={18} color="#0D9488" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    );
  };

    const renderYearView = () => {
    const today = new Date();

    return (
      <View style={styles.container}>
        {/* Year View Header */}
        <View style={styles.appleYearHeader}>
          <View style={{ flex: 1 }} />

          <View style={styles.appleHeaderActions}>
            {/* Nút Hôm nay - lướt tới năm hiện tại */}
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
              <Text style={styles.appleMonthTodayBtnText}>Hôm nay</Text>
            </TouchableOpacity>

            {/* Nút Tìm kiếm */}
            <TouchableOpacity
              style={styles.appleSearchBtn}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.selectionAsync();
              }}
            >
              <Search size={18} color="#0D9488" />
            </TouchableOpacity>

            {/* Nút Tạo sự kiện */}
            <TouchableOpacity
              style={styles.appleMonthAddBtn}
              activeOpacity={0.7}
              onPress={handleOpenCreateModal}
            >
              <Plus size={16} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Nút Đóng Year View */}
            <TouchableOpacity
              style={styles.yearCloseBtn}
              onPress={() => {
                setIsYearView(false);
                Haptics.selectionAsync();
              }}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danh sách các năm cuộn dọc liên tục */}
        <ScrollView
          ref={yearScrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.yearScrollContent}
        >
          {YEARS_RANGE.map((y) => (
            <View
              key={`year-sec-${y}`}
              onLayout={(e) => {
                yearLayoutsRef.current[y] = e.nativeEvent.layout.y;
              }}
              style={styles.yearSectionContainer}
            >
              {/* Tiêu đề Năm to đậm */}
              <Text style={styles.yearSectionTitle}>{y}</Text>

              {/* Lưới 12 tháng thu nhỏ (3 cột x 4 hàng) */}
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
                        Tháng {m}
                      </Text>

                      {/* Mini Weekday */}
                      <View style={styles.miniWeekdaysHeader}>
                        {['C', '2', '3', '4', '5', '6', '7'].map((d, di) => (
                          <Text
                            key={di}
                            style={[
                              styles.miniWeekdayChar,
                              di === 0 && { color: '#EF4444' },
                            ]}
                          >
                            {d}
                          </Text>
                        ))}
                      </View>

                      {/* Mini Days Grid */}
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
                                style={[
                                  styles.miniDayNumText,
                                  isDToday && styles.miniDayNumToday,
                                ]}
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
    return renderYearView();
  }

  return (
    <View style={styles.container}>
      {/* Month Calendar Header */}
      <View style={styles.appleMonthCalendarHeader}>
        <View style={styles.appleMonthTitleContainer}>
          {/* Năm nằm trước Tháng - Chạm vào Năm để mở danh sách Năm cuộn dọc */}
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
          <Text style={styles.appleMonthTitleText}>Tháng {month}</Text>
        </View>

        <View style={styles.appleHeaderActions}>
          {/* Nút Hôm nay */}
          <TouchableOpacity
            style={styles.appleMonthTodayBtn}
            onPress={() => {
              const now = new Date();
              setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelectedDate(now);
              scrollToMonth(now.getFullYear(), now.getMonth() + 1, true);
              Haptics.selectionAsync();
            }}
          >
            <Text style={styles.appleMonthTodayBtnText}>Hôm nay</Text>
          </TouchableOpacity>

          {/* Nút Tìm kiếm */}
          <TouchableOpacity
            style={styles.appleSearchBtn}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.selectionAsync();
            }}
          >
            <Search size={18} color="#0D9488" />
          </TouchableOpacity>

          {/* Nút Tạo sự kiện */}
          <TouchableOpacity style={styles.appleMonthAddBtn} onPress={handleOpenCreateModal}>
            <Plus size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* PHẦN 1: LỊCH Ở TRÊN (Lướt theo từng tháng, snap chuẩn xác từng tháng) */}
      <View style={styles.calendarTopContainer}>
        {/* Days of Week - Cố định trên đầu */}
        <View style={styles.appleMonthWeekdaysRowFixed}>
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d, i) => (
            <Text key={i} style={[styles.appleMonthWeekdayText, i === 0 && { color: '#EF4444' }]}>
              {d}
            </Text>
          ))}
        </View>

        {/* Lướt theo từng tháng (paging / snap chuẩn từng tháng) */}
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
              <View
                key={item.key}
                style={styles.monthPageBlock}
              >
                {/* Lưới ngày 7 cột x 6 hàng cố định không hiển thị chữ tháng năm ở góc */}
                <View style={styles.appleMainMonthGrid}>
                  {Array.from({ length: itemFirstDay }).map((_, i) => (
                    <View key={`empty-lead-${item.key}-${i}`} style={styles.appleMonthEmptyDayCell} />
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
                              isSelected && styles.appleMonthDayTextSelected,
                            ]}
                          >
                            {dayNum}
                          </Text>
                        </View>

                        {/* Chấm sự kiện (1 sự kiện = 1 chấm) */}
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

                  {/* Bù các ô trống cuối tháng để mọi tháng đều đúng 6 hàng */}
                  {Array.from({ length: Math.max(0, trailingEmpty) }).map((_, i) => (
                    <View key={`empty-trail-${item.key}-${i}`} style={styles.appleMonthEmptyDayCell} />
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* PHẦN 2: SỰ KIỆN Ở DƯỚI (Lướt cuộn độc lập, đã bỏ thứ ngày tháng) */}
      <ScrollView
        style={styles.eventsScrollView}
        contentContainerStyle={styles.eventsScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#64748B" style={{ marginTop: 20 }} />
        ) : selectedDayEvents.length > 0 ? (
          <View style={{ gap: 10, marginTop: 4 }}>
            {selectedDayEvents.map((ev) => {
              const timeDisplayStr = formatEventTimeForDate(ev, selectedDate);
              const isCall = isCallUrl(ev.location);
              const locClean = cleanLocationText(ev.location);

              return (
                <TouchableOpacity
                  key={ev.id}
                  style={[styles.eventCard, ev.isCancelled && styles.eventCardCancelled]}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setDetailEvent(ev);
                  }}
                >
                  <View style={styles.eventCardHeader}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[styles.eventCardTitle, ev.isCancelled && styles.eventCardTitleCancelled]}>
                        {ev.eventTitle}
                      </Text>
                      {ev.isCancelled && (
                        <View style={styles.cancelledBadge}>
                          <Text style={styles.cancelledBadgeText}>Đã hủy</Text>
                        </View>
                      )}
                    </View>
                    <ChevronRight size={16} color="#94A3B8" />
                  </View>

                  {/* 1. Thời gian */}
                  <View style={styles.eventInfoRow}>
                    <Clock size={12} color="#0D9488" />
                    <Text style={styles.eventInfoText}>
                      {timeDisplayStr}
                    </Text>
                  </View>

                  {/* 2. Địa chỉ thực tế */}
                  {ev.location && !isCall ? (
                    <View style={styles.eventInfoRow}>
                      <MapPin size={12} color="#64748B" />
                      <Text style={styles.eventInfoText} numberOfLines={1}>
                        {locClean || ev.location}
                      </Text>
                    </View>
                  ) : null}

                  {/* 3. Cuộc gọi video */}
                  {ev.location && (isCall || ev.location.includes('meet.google.com') || ev.location.includes('zoom.us')) ? (
                    <View style={styles.eventInfoRow}>
                      <Video size={12} color="#0284C7" />
                      <Text style={[styles.eventInfoText, { color: '#0284C7', fontWeight: '500' }]} numberOfLines={1}>
                        {locClean.includes('Meet') || locClean.includes('Zoom') || locClean.includes('Google')
                          ? locClean
                          : 'Cuộc gọi video (Google Meet)'}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.noEventsCard}>
            <CalendarDays size={32} color="#94A3B8" />
            <Text style={styles.noEventsText}>Không có lịch hẹn trong ngày này</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Event Modal
      {/* Add Event Modal - Mở to sẵn lên trên, chuẩn Apple HIG */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.appleModalContent}>
            {/* Apple Navigation Bar */}
            <View style={styles.appleNavBar}>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setIsAddModalOpen(false);
                }}
                disabled={isSubmitting}
                style={styles.appleNavBtn}
              >
                <Text style={styles.appleCancelText}>Hủy</Text>
              </TouchableOpacity>

              <Text style={styles.appleNavTitle}>{editingEvent ? 'Chỉnh sửa lịch hẹn' : 'Sự kiện mới'}</Text>

              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  handleCreateOrUpdateEvent();
                }}
                disabled={isSubmitting}
                style={styles.appleNavBtn}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#0D9488" />
                ) : (
                  <Text style={styles.appleAddText}>{editingEvent ? 'Lưu' : 'Thêm'}</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onScrollBeginDrag={dismissKeyboardAndPickers}
              contentContainerStyle={styles.appleScrollView}
            >
              {/* Group 1: Tiêu đề & Vị trí */}
              <View style={styles.appleGroupCard}>
                <TextInput
                  style={styles.appleTitleInput}
                  placeholder="Tiêu đề"
                  placeholderTextColor="#8E8E93"
                  value={title}
                  onChangeText={setTitle}
                  onFocus={closeAllPickers}
                />
                <View style={styles.hairlineDivider} />
                <View style={styles.appleLocationRow}>
                  <MapPin size={16} color="#8E8E93" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.appleLocationInput}
                    placeholder="Vị trí hoặc Cuộc gọi video"
                    placeholderTextColor="#8E8E93"
                    value={location}
                    onChangeText={setLocation}
                    onFocus={closeAllPickers}
                  />
                  {isSearchingLocation && (
                    <ActivityIndicator size="small" color="#8E8E93" style={{ marginRight: 8 }} />
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
                      <X size={14} color="#8E8E93" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Dropdown gợi ý vị trí */}
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <View style={styles.suggestionsDropdown}>
                    <Text style={styles.suggestionsHeader}>GỢI Ý TỪ BẢN ĐỒ</Text>
                    {locationSuggestions.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectLocation(item)}
                      >
                        <MapPin size={13} color="#E11D48" style={{ marginTop: 2 }} />
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

              {/* Group 2: Thời gian & Lặp lại (Apple Calendar Style - Đã bỏ Cả ngày) */}
              <View style={styles.appleGroupCard}>
                {/* Hàng Bắt đầu */}
                <View style={styles.appleRow}>
                  <Text style={styles.appleRowLabel}>Bắt đầu</Text>
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
                        {formatDateOnly(startDate)}
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

                {/* Bộ chọn Ngày bắt đầu trượt xuống ngay dưới hàng Bắt đầu */}
                {activePickerTarget === 'start_date' && renderDatePicker('start')}

                {/* Bộ chọn Giờ bắt đầu trượt xuống ngay dưới hàng Bắt đầu */}
                {activePickerTarget === 'start_time' && renderTimePicker('start')}

                <View style={styles.hairlineDivider} />

                {/* Hàng Kết thúc (Bắt buộc có, không có nút x) */}
                <View style={styles.appleRow}>
                  <Text style={styles.appleRowLabel}>Kết thúc</Text>
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
                        {formatDateOnly(endDate)}
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

                {/* Bộ chọn Ngày kết thúc trượt xuống ngay dưới hàng Kết thúc */}
                {activePickerTarget === 'end_date' && renderDatePicker('end')}

                {/* Bộ chọn Giờ kết thúc trượt xuống ngay dưới hàng Kết thúc */}
                {activePickerTarget === 'end_time' && renderTimePicker('end')}
              </View>

              {/* Group 3: Cấu hình Lặp lại (Tách riêng độc lập khỏi Thời gian bắt đầu và kết thúc) */}
              <View style={styles.appleGroupCard}>
                {/* Hàng Lặp lại (Hiển thị như Nhắc trước, nếu text dài thì tự động bẻ thành 2 dòng căn phải) */}
                <TouchableOpacity
                  style={[
                    styles.appleRow,
                    { minHeight: 44, paddingVertical: 11, alignItems: 'center' },
                  ]}
                  onPress={() => {
                    closeAllPickers();
                    setIsRepeatModalOpen(true);
                    Haptics.selectionAsync();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.appleRowLabel, { minWidth: 70 }]}>Lặp lại</Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      flex: 1,
                      justifyContent: 'flex-end',
                      marginLeft: 36,
                    }}
                  >
                    <Text
                      style={[
                        styles.appleRowValue,
                        {
                          textAlign: 'right',
                          flexShrink: 1,
                          lineHeight: 20,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {currentRepeatLabel}
                    </Text>
                    <ChevronRight size={14} color="#C7C7CC" style={{ flexShrink: 0 }} />
                  </View>
                </TouchableOpacity>

                {/* Hàng Kết thúc lặp lại tách riêng ra (chỉ hiện khi có lặp lại) */}
                {recurrenceConfig.frequency !== 'none' && (
                  <>
                    <View style={styles.hairlineDivider} />
                    <View style={styles.appleRow}>
                      <Text style={styles.appleRowLabel}>Kết thúc lặp</Text>
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
                              new Date(
                                baseD.getFullYear(),
                                baseD.getMonth(),
                                1,
                              ),
                            );
                            setIsEndRepeatPickerOpen((prev) => !prev);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.applePillText,
                              isEndRepeatPickerOpen && styles.applePillTextActive,
                              !recurrenceConfig.endDate && { color: '#8E8E93', fontWeight: '400' },
                            ]}
                          >
                            {recurrenceConfig.endDate
                              ? formatDateOnly(recurrenceConfig.endDate)
                              : 'dd/mm/yyyy'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Bộ chọn ngày kết thúc chuỗi lặp hiển thị trượt ngay dưới */}
                    {isEndRepeatPickerOpen && renderEndRepeatDatePicker()}
                  </>
                )}
              </View>

              {/* Group 3: Nhắc trước (Popup In-Modal) & Ghi chú */}
              <View style={styles.appleGroupCard}>
                {/* Hàng Nhắc trước */}
                <TouchableOpacity
                  style={styles.appleRow}
                  onPress={() => {
                    closeAllPickers();
                    setIsReminderModalOpen(true);
                    Haptics.selectionAsync();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.appleRowLabel}>Nhắc trước</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.appleRowValue}>{currentReminderLabel}</Text>
                    <ChevronRight size={14} color="#C7C7CC" />
                  </View>
                </TouchableOpacity>

                <View style={styles.hairlineDivider} />

                <View style={styles.appleNotesRow}>
                  <TextInput
                    style={styles.appleNotesInput}
                    placeholder="Ghi chú"
                    placeholderTextColor="#8E8E93"
                    multiline
                    numberOfLines={3}
                    value={description}
                    onChangeText={setDescription}
                    onFocus={closeAllPickers}
                  />
                </View>
              </View>

              {/* Vùng đệm cuối trang: chạm vào đóng bàn phím và pickers */}
              <TouchableOpacity
                style={{ height: 100 }}
                activeOpacity={1}
                onPress={dismissKeyboardAndPickers}
              />
            </ScrollView>

            {/* Popup Overlay Chọn Lặp lại (In-Modal Overlay như Nhắc trước) */}
            {isRepeatModalOpen && (
              <View style={styles.inModalPopupBackdrop}>
                <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  activeOpacity={1}
                  onPress={() => setIsRepeatModalOpen(false)}
                />
                <View style={styles.popupCard}>
                  <View style={styles.popupHeader}>
                    <Text style={styles.popupTitle}>Lặp lại</Text>
                    <TouchableOpacity
                      onPress={() => setIsRepeatModalOpen(false)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.popupCloseText}>Đóng</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.popupList}>
                    {REPEAT_OPTIONS.map((item, idx) => {
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
                            idx < REPEAT_OPTIONS.length - 1 && styles.popupItemBorder,
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
                                interval: 1, // Lặp cơ bản thì khoảng cách = 1
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
                          {isSelected && <Check size={18} color="#0D9488" />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Popup Overlay Chọn Nhắc trước (In-Modal Overlay) */}
            {isReminderModalOpen && (
              <View style={styles.inModalPopupBackdrop}>
                <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  activeOpacity={1}
                  onPress={() => setIsReminderModalOpen(false)}
                />
                <View style={styles.popupCard}>
                  <View style={styles.popupHeader}>
                    <Text style={styles.popupTitle}>Nhắc trước</Text>
                    <TouchableOpacity
                      onPress={() => setIsReminderModalOpen(false)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.popupCloseText}>Đóng</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.popupList}>
                    {REMINDER_OPTIONS.map((item, idx) => {
                      const isSelected = reminderMinutes === item.value;
                      return (
                        <TouchableOpacity
                          key={item.value}
                          style={[
                            styles.popupItem,
                            idx < REMINDER_OPTIONS.length - 1 && styles.popupItemBorder,
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
                          {isSelected && <Check size={18} color="#0D9488" />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Modal / Sheet Tùy chỉnh Lặp lại (Custom Recurrence View) */}
            {renderCustomRepeatModal()}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    
      {/* Màn hình Chi tiết lịch hẹn (Full-Screen View, không phải popup) */}
      {detailEvent && renderDetailScreen()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navArrow: {
    padding: 4,
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    width: 36,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyDayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: '#0F172A',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  eventDotsContainer: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2.5,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0D9488',
  },
  eventDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  eventsSection: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  eventCardCancelled: {
    opacity: 0.75,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  eventCardTitleCancelled: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  cancelledBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cancelledBadgeText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
  },
  eventActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventActionBtn: {
    padding: 2,
  },
  // Full-Screen Event Detail View Styles
  detailFullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8FAFC',
    zIndex: 999,
  },
  detailNavHeader: {
    backgroundColor: '#FFFFFF',
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  detailBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 2,
  },
  detailBackBtnText: {
    fontSize: 16,
    color: '#0D9488',
    fontWeight: '600',
  },
  detailNavTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailNavEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
  },
  detailNavEditText: {
    fontSize: 14,
    color: '#0D9488',
    fontWeight: '600',
  },
  detailFullScreenContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  detailUnifiedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  detailUnifiedHeader: {
    gap: 10,
    paddingBottom: 2,
  },
  detailUnifiedDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  detailSectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailQuickReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  detailQuickReminderBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D9488',
  },
  detailReminderRowTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailReminderValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  detailReminderTapHint: {
    fontSize: 12,
    color: '#0D9488',
    fontWeight: '500',
  },
  detailRsvpTotalText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  detailRsvpOptionsCol: {
    gap: 8,
    marginTop: 4,
  },
  detailRsvpBtn: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
    justifyContent: 'center',
  },
  detailRsvpProgressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 12,
  },
  detailRsvpBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    zIndex: 1,
  },
  detailRsvpLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailRsvpCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  detailRsvpOptionLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  detailRsvpStatsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailRsvpCountText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  detailUnifiedSection: {
    gap: 10,
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  detailCallEmbed: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 2,
  },
  detailMainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  detailEventTitleLarge: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 30,
  },
  detailStatusCancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  detailStatusCancelledText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  detailStatusActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  detailStatusActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  detailStatusActiveText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailCallCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  detailCardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  detailTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  detailTimeCol: {
    flex: 1,
  },
  detailTimeDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  detailTimeLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
    fontWeight: '500',
  },
  detailTimeValueHour: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailTimeValueDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  detailCardBodyText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
  },
  detailNotesText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
  },
  detailCallDesc: {
    fontSize: 14,
    color: '#0369A1',
    fontWeight: '500',
    marginBottom: 12,
  },
  detailJoinCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 12,
  },
  detailJoinCallBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
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
    color: '#0D9488',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  detailActionButtonsGroup: {
    marginTop: 12,
    gap: 12,
  },
  detailActionCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    paddingVertical: 14,
  },
  detailActionCancelBtnText: {
    color: '#B45309',
    fontSize: 15,
    fontWeight: '600',
  },
  detailActionDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
  },
  detailActionDeleteBtnText: {
    color: '#EF4444',
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
    color: '#0D9488',
    letterSpacing: -0.4,
  },
  appleSearchBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTopContainer: {
    backgroundColor: '#FFFFFF',
    height: 312,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  appleMonthWeekdaysRowFixed: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F2F2F7',
    backgroundColor: '#FFFFFF',
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
    color: '#000000',
    letterSpacing: -0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  eventsScrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  eventsScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 32,
  },
  yearViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  appleYearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  appleYearHeaderTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.5,
  },
  yearCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearScrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 36,
  },
  yearGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  miniMonthBox: {
    width: '30.5%',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  miniMonthBoxActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  miniMonthName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
    textAlign: 'center',
  },
  miniMonthNameActive: {
    color: '#0D9488',
  },
  miniWeekdaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  miniWeekdayChar: {
    fontSize: 7.5,
    fontWeight: '600',
    color: '#94A3B8',
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
    color: '#334155',
    fontWeight: '400',
  },
  miniDayNumToday: {
    color: '#FF3B30',
    fontWeight: '800',
  },
  appleMonthCalendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  appleMonthTitleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  appleMonthTitleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.4,
  },
  appleYearSubtitleText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#8E8E93',
  },
  appleHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appleMonthTodayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
  },
  appleMonthTodayBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D9488',
  },
  appleMonthNavGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 2,
  },
  appleNavArrowBtn: {
    padding: 6,
  },
  appleMonthAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleMonthWeekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  appleMonthWeekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  appleMainMonthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
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
    backgroundColor: '#1C1C1E',
  },
  appleMonthDayCircleTodaySelected: {
    backgroundColor: '#FF3B30',
  },
  appleMonthDayText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  appleMonthDayTextToday: {
    color: '#FF3B30',
    fontWeight: '700',
  },
  appleMonthDayTextSelected: {
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
    backgroundColor: '#8E8E93',
  },
  appleMonthEventDotSelected: {
    backgroundColor: '#1C1C1E',
  },
  appleMonthHairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginTop: 10,
    marginBottom: 4,
  },
  appleMonthSelectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 8,
  },
  appleMonthSelectedDayDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    textTransform: 'capitalize',
  },
  appleMonthSelectedDayCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
    flex: 1,
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventInfoText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  eventCardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  noEventsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginTop: 8,
  },
  noEventsText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  appleModalContent: {
    backgroundColor: '#F2F2F7',
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  appleNavBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    minWidth: 44,
  },
  appleNavTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  appleCancelText: {
    fontSize: 16,
    color: '#0D9488',
    fontWeight: '400',
  },
  appleAddText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D9488',
    textAlign: 'right',
  },
  appleScrollView: {
    padding: 16,
    paddingBottom: 36,
  },
  appleGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
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
    color: '#000000',
  },
  appleRowValue: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
  },
  popupBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popupCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
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
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#F8FAFC',
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  popupCloseText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0D9488',
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
    borderBottomColor: '#F2F2F7',
  },
  popupItemText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '400',
  },
  popupItemTextSelected: {
    color: '#0D9488',
    fontWeight: '600',
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 16,
  },
  appleTitleInput: {
    fontSize: 16,
    color: '#000000',
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
    color: '#000000',
    padding: 0,
  },
  applePillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  applePill: {
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  applePillActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
  },
  applePillText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
  },
  applePillTextActive: {
    color: '#0D9488',
    fontWeight: '600',
  },
  appleAddEndPill: {
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  appleAddEndPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0D9488',
  },
  appleInlinePickerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
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
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
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
    color: '#8E8E93',
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
    backgroundColor: '#0D9488',
  },
  appleDayNumber: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '400',
  },
  appleDayNumberToday: {
    color: '#0D9488',
    fontWeight: '700',
  },
  appleDayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  appleRemoveEndBtn: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
    marginLeft: 2,
  },
  appleReminderChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  appleReminderChipSelected: {
    backgroundColor: '#0D9488',
  },
  appleReminderChipText: {
    fontSize: 13,
    color: '#636366',
    fontWeight: '500',
  },
  appleReminderChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  appleNotesRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appleNotesInput: {
    fontSize: 15,
    color: '#000000',
    minHeight: 60,
    textAlignVertical: 'top',
    padding: 0,
  },
  appleSubmitBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  appleSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  suggestionsDropdown: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  suggestionsHeader: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  suggestionAddress: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  splitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
  },
  splitBtnActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  splitBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  endTimeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  removeEndTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  addEndTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
  },
  addEndTimeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  dateTimeGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  dateTimeCol: {
    flex: 1,
  },
  endTimeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pickerTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: '#F8FAFC',
  },
  pickerTriggerBtnEmpty: {
    borderStyle: 'dashed',
    backgroundColor: '#F1F5F9',
  },
  pickerTriggerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  pickerTriggerEmptyText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFE4E6',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 11,
    color: '#E11D48',
    fontWeight: '600',
    flex: 1,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
  },
  chipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  submitBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  pickerTriggerBtnActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  inlinePickerContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  inlinePickerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  inlinePickerTargetBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  inlinePickerCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inlinePickerCloseBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pickerMonthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 4,
  },
  pickerMonthYearHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  pickerMonthYearHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  // BỎ BO KHUNG: không có border, không có backgroundColor thẻ hộp
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
    backgroundColor: '#E5E5EA', // Màu xám nhạt Apple thay vì màu đen
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
    color: '#8E8E93',
    opacity: 0.65,
  },
  wheelItemTextSelected: {
    color: '#0F172A', // Chữ tối đậm, nổi bật trên nền xám nhạt
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
    color: '#64748B', // Màu xám trung tính thay vì màu trắng
  },
  pickerDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 4,
  },
  pickerDayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginVertical: 1,
  },
  pickerDayCellSelected: {
    backgroundColor: '#0F172A',
  },
  pickerDayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  pickerDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timeWheelSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timeSectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    textAlign: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stepperLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0D9488',
    lineHeight: 20,
  },
  stepperValueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    minWidth: 26,
    textAlign: 'center',
  },
  stepperUnitText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  weekdaysSelectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  weekdayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  weekdayBtnActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  weekdayBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  weekdayBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: '#0D9488',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0D9488',
  },
  radioLabel: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
    flex: 1,
  },
  monthDaysGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F2F2F7',
  },
  monthDayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  monthDayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthDayCircleSelected: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  monthDayNumber: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
  },
  monthDayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pillPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  optionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionPillSelected: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  optionPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  optionPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  monthsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
  },
  monthBtnPill: {
    width: '22.8%',
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthBtnPillSelected: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  monthBtnPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
  },
  monthBtnPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summaryPreviewBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryPreviewText: {
    fontSize: 14,
    color: '#0F766E',
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  // Apple Style Stepper
  appleStepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appleStepperMinusBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleStepperPlusBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleStepperInput: {
    minWidth: 40,
    height: 32,
    backgroundColor: 'rgba(118, 118, 128, 0.08)',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    paddingVertical: 0,
    paddingHorizontal: 6,
  },
  appleStepperUnit: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
    marginLeft: 4,
  },

  // Apple Weekdays Pill Selector (7 circle buttons in 1 row)
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
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleWeekdayPillActive: {
    backgroundColor: '#0D9488',
  },
  appleWeekdayPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  appleWeekdayPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Apple Segmented Control (Theo ngày / Theo thứ)
  appleSegmentWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
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
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  appleSegmentBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  appleSegmentBtnTextActive: {
    color: '#0D9488',
    fontWeight: '600',
  },

  // Apple Month Days Grid (7 columns for 1..31 days)
  appleMonthDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#0D9488',
  },
  appleDayNumberText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
  },
  appleDayNumberTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Apple Sub-row with horizontal scroll pills
  appleSubRow: {
    paddingVertical: 10,
    paddingLeft: 16,
  },
  appleSubRowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  applePillsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },

  // Apple Section Footer (Note/Summary)
  appleSectionFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: 'rgba(13, 148, 136, 0.05)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  appleSectionFooterText: {
    fontSize: 13,
    color: '#0F766E',
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },

  // Custom Repeat Modal Styles
  customRepeatModalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8FAFC',
    zIndex: 1100,
  },
  customRepeatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  customRepeatTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  customRepeatCancelText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
  },
  customRepeatDoneText: {
    fontSize: 16,
    color: '#0D9488',
    fontWeight: '600',
  },
  customRepeatScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
});
