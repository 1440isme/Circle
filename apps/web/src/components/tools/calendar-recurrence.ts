import { CalendarEventEntity } from '@circle/types';

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

export const getWeekdayNumber = (d: Date): number => {
  const day = d.getDay();
  return day === 0 ? 7 : day;
};

export const getDefaultWeeklyDays = (start: Date, _end?: Date): number[] => {
  // Mặc định lặp lại vào đúng thứ của ngày bắt đầu sự kiện, không tự cộng dồn
  return [getWeekdayNumber(start)];
};

export const getNthOrderFromDate = (d: Date): NthWeekdayOrder => {
  const day = d.getDate();
  if (day <= 7) return 'first';
  if (day <= 14) return 'second';
  if (day <= 21) return 'third';
  if (day <= 28) return 'fourth';
  return 'last';
};

export const formatRecurrenceSummary = (
  config: RecurrenceConfig,
  includeEndDate = false,
): string => {
  if (config.frequency === 'none') {
    return 'Không lặp lại';
  }

  // Nếu không phải tùy chỉnh (preset cơ bản: Hằng ngày, Hằng tuần, Hằng tháng, Hằng năm):
  if (!config.isCustom && (config.interval || 1) === 1) {
    let base = '';
    if (config.frequency === 'daily') base = 'Hằng ngày';
    else if (config.frequency === 'weekly') base = 'Hằng tuần';
    else if (config.frequency === 'monthly') base = 'Hằng tháng';
    else if (config.frequency === 'yearly') base = 'Hằng năm';

    if (includeEndDate && config.endType === 'on_date' && config.endDate) {
      const end = new Date(config.endDate);
      return `${base} đến ${formatDateOnly(end)}`;
    }
    return base;
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

  if (includeEndDate && config.endType === 'on_date' && config.endDate) {
    const end = new Date(config.endDate);
    text += ` đến ${formatDateOnly(end)}`;
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
  const clean = (baseDesc || '')
    .replace(/\[RECURRENCE:(\{[\s\S]*?\}|[^\]]*?)\]/g, '')
    .replace(/\[Lặp lại:[^\]]*?\]/g, '')
    .replace(/\[RECURRENCE:[\s\S]*?\]/g, '')
    .replace(/,?\s*\"(?:monthlyType|frequency|interval|weeklyDays|endType|yearlyType|yearlyMonth|yearlyDay|monthlyDay|monthlyNthOrder|monthlyNthWeekday|yearlyNthOrder|yearlyNthWeekday|yearlyNthMonth|endDate|isCustom|excludedDates|cancelledDates)\":[\s\S]*?\}\]/g, '')
    .replace(/,?\s*\"(?:monthlyType|frequency|interval|weeklyDays|endType|yearlyType|yearlyMonth|yearlyDay|monthlyDay|monthlyNthOrder|monthlyNthWeekday|yearlyNthOrder|yearlyNthWeekday|yearlyNthMonth|endDate|isCustom|excludedDates|cancelledDates)\":[\s\S]*?$/g, '')
    .trim();
  const normalizedClean = clean.toLowerCase() === 'body' || clean === 'null' ? '' : clean;

  if (!config || config.frequency === 'none') {
    return normalizedClean;
  }

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
    yearlyNthMonth: config.yearlyNthMonth,
    endType: config.endType,
    endDate: config.endDate ? (config.endDate instanceof Date ? config.endDate.toISOString() : config.endDate) : null,
    isCustom: Boolean(config.isCustom),
    excludedDates: config.excludedDates || [],
    cancelledDates: config.cancelledDates || [],
  });
  const recurrenceTag = `[RECURRENCE:${serialized}]`;
  const userRepeatText = `[Lặp lại: ${repeatSummary}]`;
  return normalizedClean ? `${normalizedClean}\n${userRepeatText}\n${recurrenceTag}` : `${userRepeatText}\n${recurrenceTag}`;
};

export const parseEventRecurrence = (desc?: string | null): {
  cleanDesc: string;
  recurrenceConfig: RecurrenceConfig | null;
} => {
  if (!desc) {
    return { cleanDesc: '', recurrenceConfig: null };
  }

  let cleanDesc = desc
    .replace(/\[RECURRENCE:(\{[\s\S]*?\}|[^\]]*?)\]/g, '')
    .replace(/\[Lặp lại:[^\]]*?\]/g, '')
    .replace(/\[RECURRENCE:[\s\S]*?\]/g, '')
    .replace(/,?\s*\"(?:monthlyType|frequency|interval|weeklyDays|endType|yearlyType|yearlyMonth|yearlyDay|monthlyDay|monthlyNthOrder|monthlyNthWeekday|yearlyNthOrder|yearlyNthWeekday|yearlyNthMonth|endDate|isCustom|excludedDates|cancelledDates)\":[\s\S]*?\}\]/g, '')
    .replace(/,?\s*\"(?:monthlyType|frequency|interval|weeklyDays|endType|yearlyType|yearlyMonth|yearlyDay|monthlyDay|monthlyNthOrder|monthlyNthWeekday|yearlyNthOrder|yearlyNthWeekday|yearlyNthMonth|endDate|isCustom|excludedDates|cancelledDates)\":[\s\S]*?$/g, '')
    .trim();

  if (cleanDesc.toLowerCase() === 'body' || cleanDesc === 'null') {
    cleanDesc = '';
  }

  let recurrenceConfig: RecurrenceConfig | null = null;
  const recurrenceMatch = desc.match(/\[RECURRENCE:(\{[\s\S]*?\})\]/);
  if (recurrenceMatch && recurrenceMatch[1]) {
    try {
      const raw = JSON.parse(recurrenceMatch[1]);
      recurrenceConfig = {
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
    } catch {
      // Fallback
    }
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
    const allowedDays = !recurrenceConfig.isCustom
      ? [evStart.getDay() === 0 ? 7 : evStart.getDay()]
      : recurrenceConfig.weeklyDays && recurrenceConfig.weeklyDays.length > 0
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
  const sStr = `${pad2(evStart.getHours())}:${pad2(evStart.getMinutes())}`;
  if (!evEnd) return sStr;
  const eStr = `${pad2(evEnd.getHours())}:${pad2(evEnd.getMinutes())}`;

  const diffMs = evEnd.getTime() - evStart.getTime();
  const occStart = new Date(targetDate);
  occStart.setHours(evStart.getHours(), evStart.getMinutes(), 0, 0);
  const occEnd = new Date(occStart.getTime() + Math.max(0, diffMs));

  const isSameDay =
    occStart.getFullYear() === occEnd.getFullYear() &&
    occStart.getMonth() === occEnd.getMonth() &&
    occStart.getDate() === occEnd.getDate();

  return isSameDay
    ? `${sStr} - ${eStr}`
    : `Từ ${sStr} ngày ${formatDateOnly(occStart)} - ${eStr} ngày ${formatDateOnly(occEnd)}`;
};

// ==========================================
// OCCURRENCE STEPPERS FOR DETAIL NAVIGATION
// ==========================================
export function getNextOrPrevOccurrenceStep(
  currentDate: Date,
  config: RecurrenceConfig | null,
  direction: 'next' | 'prev',
): Date {
  const result = new Date(currentDate);
  if (!config || config.frequency === 'none') {
    result.setDate(result.getDate() + (direction === 'next' ? 1 : -1));
    return result;
  }

  const interval = Math.max(1, config.interval || 1);
  const factor = direction === 'next' ? 1 : -1;

  switch (config.frequency) {
    case 'daily':
      result.setDate(result.getDate() + factor * interval);
      break;

    case 'weekly': {
      if (!config.isCustom) {
        result.setDate(result.getDate() + factor * 7 * interval);
        break;
      }
      const weeklyDays =
        config.weeklyDays && config.weeklyDays.length > 0
          ? [...config.weeklyDays].sort((a, b) => a - b)
          : [result.getDay() === 0 ? 7 : result.getDay()];

      const curDay = result.getDay() === 0 ? 7 : result.getDay();
      if (direction === 'next') {
        const nextInWeek = weeklyDays.find((d) => d > curDay);
        if (nextInWeek) {
          result.setDate(result.getDate() + (nextInWeek - curDay));
        } else {
          const firstDay = weeklyDays[0];
          const daysToNextWeek = 7 - curDay + (interval - 1) * 7 + firstDay;
          result.setDate(result.getDate() + daysToNextWeek);
        }
      } else {
        const reversedDays = [...weeklyDays].reverse();
        const prevInWeek = reversedDays.find((d) => d < curDay);
        if (prevInWeek) {
          result.setDate(result.getDate() - (curDay - prevInWeek));
        } else {
          const lastDay = reversedDays[0];
          const daysBack = curDay + (interval - 1) * 7 + (7 - lastDay);
          result.setDate(result.getDate() - daysBack);
        }
      }
      break;
    }

    case 'monthly':
      result.setMonth(result.getMonth() + factor * interval);
      break;

    case 'yearly':
      result.setFullYear(result.getFullYear() + factor * interval);
      break;

    default:
      result.setDate(result.getDate() + factor);
      break;
  }

  return result;
}

export function getNextOrPrevOccurrence(
  currentDate: Date,
  config: RecurrenceConfig | null,
  direction: 'next' | 'prev',
): Date {
  let iter = new Date(currentDate);
  for (let step = 0; step < 100; step++) {
    iter = getNextOrPrevOccurrenceStep(iter, config, direction);
    if (!config?.excludedDates || config.excludedDates.length === 0) {
      return iter;
    }
    const key = formatDateKey(iter);
    if (!config.excludedDates.includes(key)) {
      return iter;
    }
  }
  return iter;
}
