'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
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
  Repeat,
  Share2,
  Info,
  RotateCcw,
  ArrowRight,
  AlignLeft,
  Check,
  HelpCircle,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import { EventLocationDisplay } from './EventLocationDisplay';
import { LocationSearchInput } from './LocationSearchInput';
import { CustomDateTimePicker } from './CustomDateTimePicker';
import { CustomRecurrenceModal } from './CustomRecurrenceModal';
import { CircleEventDetailModal } from './CircleEventDetailModal';
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
import {
  RecurrenceFrequency,
  NthWeekdayOrder,
  MonthlyType,
  YearlyType,
  RecurrenceEndType,
  RecurrenceConfig,
  WEEKDAY_INFO,
  NTH_ORDER_INFO,
  formatDateKey,
  getWeekdayNumber,
  getDefaultWeeklyDays,
  getNthOrderFromDate,
  formatRecurrenceSummary,
  createDefaultRecurrenceConfig,
  formatDateOnly,
  serializeRecurrence,
  parseEventRecurrence,
  isEventOccurringOnDate,
  isEventCancelledOnDate,
  formatEventTimeForDate,
  getNextOrPrevOccurrence,
} from './calendar-recurrence';

export type {
  RecurrenceFrequency,
  NthWeekdayOrder,
  MonthlyType,
  YearlyType,
  RecurrenceEndType,
  RecurrenceConfig,
};
export {
  WEEKDAY_INFO,
  NTH_ORDER_INFO,
  formatDateKey,
  formatRecurrenceSummary,
  createDefaultRecurrenceConfig,
  formatDateOnly,
  serializeRecurrence,
  parseEventRecurrence,
  isEventOccurringOnDate,
  isEventCancelledOnDate,
  formatEventTimeForDate,
  getNextOrPrevOccurrence,
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

  // Dedicated Scope & Modal States
  const [editingEvent, setEditingEvent] = useState<CalendarEventEntity | null>(null);
  const [editingOccurrenceDate, setEditingOccurrenceDate] = useState<Date | null>(null);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const previousDetailModalRef = useRef<{
    event: CalendarEventEntity;
    occDate: Date | null;
  } | null>(null);

  const initialFormSnapshotRef = useRef<{
    title: string;
    location: string;
    description: string;
    startTime: string;
    endTime: string;
    reminderMinutes: string;
    recurrenceConfigStr: string;
  } | null>(null);

  // Month & Year Picker State in Month Navigator (Dạng Bánh xe / Xe lăn)
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const wheelMonthsScrollRef = useRef<HTMLDivElement>(null);
  const wheelYearsScrollRef = useRef<HTMLDivElement>(null);
  const isWheelProgrammaticScrollRef = useRef(false);
  const wheelMonthTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wheelYearTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Poll Scope State khi bình chọn tham gia trên thẻ ngoài cho sự kiện lặp lại
  const [pollScopeState, setPollScopeState] = useState<{
    isOpen: boolean;
    event: CalendarEventEntity | null;
    status: EventRsvpStatus | null;
    occDate: Date;
  } | null>(null);
  const [isApplyingPollScope, setIsApplyingPollScope] = useState(false);

  // Delete & Cancel Scope Modals
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    event: CalendarEventEntity | null;
    occDate: Date | null;
  }>({ isOpen: false, event: null, occDate: null });

  const [cancelModalState, setCancelModalState] = useState<{
    isOpen: boolean;
    event: CalendarEventEntity | null;
    occDate: Date | null;
  }>({ isOpen: false, event: null, occDate: null });

  // Event Detail Modal & Custom Recurrence Popup Modal
  const [detailModalState, setDetailModalState] = useState<{
    isOpen: boolean;
    event: CalendarEventEntity | null;
    occDate: Date | null;
  }>({ isOpen: false, event: null, occDate: null });

  const [isCustomRepeatOpen, setIsCustomRepeatOpen] = useState(false);
  const [isRepeatDropdownOpen, setIsRepeatDropdownOpen] = useState(false);
  const repeatDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        repeatDropdownRef.current &&
        !repeatDropdownRef.current.contains(e.target as Node)
      ) {
        setIsRepeatDropdownOpen(false);
      }
    };
    if (isRepeatDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRepeatDropdownOpen]);

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
  const { data: allCalendarEvents = [], isLoading: isAllEventsLoading } = useCalendarEventsQuery(circleId);
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

  // Close Month-Year picker on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    if (isMonthPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMonthPickerOpen]);

  // Hằng số cho Bánh xe cuộn Tháng & Năm (Wheel Picker)
  const ITEM_HEIGHT = 40;
  const WHEEL_START_YEAR = 2015;
  const WHEEL_END_YEAR = 2035;
  const WHEEL_YEARS = useMemo(
    () => Array.from({ length: WHEEL_END_YEAR - WHEEL_START_YEAR + 1 }, (_, i) => WHEEL_START_YEAR + i),
    [],
  );
  const WHEEL_MONTH_NAMES = useMemo(
    () => [
      'Tháng 01',
      'Tháng 02',
      'Tháng 03',
      'Tháng 04',
      'Tháng 05',
      'Tháng 06',
      'Tháng 07',
      'Tháng 08',
      'Tháng 09',
      'Tháng 10',
      'Tháng 11',
      'Tháng 12',
    ],
    [],
  );

  // Định vị bánh xe Tháng & Năm ngay khi mở popover
  useEffect(() => {
    if (isMonthPickerOpen) {
      isWheelProgrammaticScrollRef.current = true;
      const timer = setTimeout(() => {
        if (wheelMonthsScrollRef.current) {
          wheelMonthsScrollRef.current.scrollTop = (month - 1) * ITEM_HEIGHT;
        }
        if (wheelYearsScrollRef.current) {
          const yIdx = Math.max(0, Math.min(WHEEL_YEARS.length - 1, year - WHEEL_START_YEAR));
          wheelYearsScrollRef.current.scrollTop = yIdx * ITEM_HEIGHT;
        }
        setTimeout(() => {
          isWheelProgrammaticScrollRef.current = false;
        }, 60);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isMonthPickerOpen, month, year, WHEEL_YEARS.length]);

  useEffect(() => {
    return () => {
      if (wheelMonthTimerRef.current) clearTimeout(wheelMonthTimerRef.current);
      if (wheelYearTimerRef.current) clearTimeout(wheelYearTimerRef.current);
    };
  }, []);

  const handleWheelSelectMonth = (mIdx: number) => {
    isWheelProgrammaticScrollRef.current = true;
    if (wheelMonthsScrollRef.current) {
      wheelMonthsScrollRef.current.scrollTo({ top: mIdx * ITEM_HEIGHT, behavior: 'smooth' });
    }
    setCurrentDate(new Date(year, mIdx, 1));
    setTimeout(() => {
      isWheelProgrammaticScrollRef.current = false;
    }, 250);
  };

  const handleWheelSelectYear = (targetYear: number) => {
    isWheelProgrammaticScrollRef.current = true;
    const yIdx = Math.max(0, targetYear - WHEEL_START_YEAR);
    if (wheelYearsScrollRef.current) {
      wheelYearsScrollRef.current.scrollTo({ top: yIdx * ITEM_HEIGHT, behavior: 'smooth' });
    }
    setCurrentDate(new Date(targetYear, month - 1, 1));
    setTimeout(() => {
      isWheelProgrammaticScrollRef.current = false;
    }, 250);
  };

  const handleWheelMonthScroll = () => {
    if (isWheelProgrammaticScrollRef.current || !wheelMonthsScrollRef.current) return;
    if (wheelMonthTimerRef.current) clearTimeout(wheelMonthTimerRef.current);
    wheelMonthTimerRef.current = setTimeout(() => {
      if (!wheelMonthsScrollRef.current || isWheelProgrammaticScrollRef.current) return;
      const scrollTop = wheelMonthsScrollRef.current.scrollTop;
      const idx = Math.min(11, Math.max(0, Math.round(scrollTop / ITEM_HEIGHT)));
      if (idx !== month - 1) {
        setCurrentDate(new Date(year, idx, 1));
      }
    }, 90);
  };

  const handleWheelYearScroll = () => {
    if (isWheelProgrammaticScrollRef.current || !wheelYearsScrollRef.current) return;
    if (wheelYearTimerRef.current) clearTimeout(wheelYearTimerRef.current);
    wheelYearTimerRef.current = setTimeout(() => {
      if (!wheelYearsScrollRef.current || isWheelProgrammaticScrollRef.current) return;
      const scrollTop = wheelYearsScrollRef.current.scrollTop;
      const idx = Math.min(WHEEL_YEARS.length - 1, Math.max(0, Math.round(scrollTop / ITEM_HEIGHT)));
      const targetYear = WHEEL_YEARS[idx];
      if (targetYear !== undefined && targetYear !== year) {
        setCurrentDate(new Date(targetYear, month - 1, 1));
      }
    }, 90);
  };

  const handleWheelJumpToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    handleWheelSelectMonth(now.getMonth());
    handleWheelSelectYear(now.getFullYear());
  };

  // Xử lý RSVP từ thẻ ngoài (Nếu là sự kiện lặp lại thì hỏi phạm vi áp dụng)
  const handleCardRsvpClick = (ev: CalendarEventEntity, status: EventRsvpStatus, occDate: Date) => {
    if (ev.isCancelled || rsvpMutation.isPending || isApplyingPollScope) return;
    const { recurrenceConfig } = parseEventRecurrence(ev.description);
    const isRecurring = Boolean(recurrenceConfig && recurrenceConfig.frequency !== 'none');
    if (isRecurring) {
      setPollScopeState({
        isOpen: true,
        event: ev,
        status,
        occDate,
      });
    } else {
      rsvpMutation.mutate({ eventId: ev.id, status });
    }
  };

  const handleApplyPollScope = async (scope: 'this' | 'future' | 'all') => {
    if (!pollScopeState || !pollScopeState.event || !pollScopeState.status) return;
    const { event, status, occDate } = pollScopeState;
    setIsApplyingPollScope(true);

    const { recurrenceConfig, cleanDesc } = parseEventRecurrence(event.description);
    const isRecurring = Boolean(recurrenceConfig && recurrenceConfig.frequency !== 'none');
    const evStart = new Date(event.startTime);
    const evEnd = event.endTime ? new Date(event.endTime) : evStart;
    const durationMs = Math.max(0, evEnd.getTime() - evStart.getTime());

    const occStartDate = new Date(occDate);
    occStartDate.setHours(evStart.getHours(), evStart.getMinutes(), evStart.getSeconds(), 0);
    const occEndDate = new Date(occStartDate.getTime() + durationMs);

    try {
      if (isRecurring && scope === 'this') {
        const occKey = formatDateKey(occDate);
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
          eventId: event.id,
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

        const created = await createMutation.mutateAsync({
          eventTitle: event.eventTitle,
          description: standaloneDesc,
          location: event.location || undefined,
          startTime: occStartDate.toISOString(),
          endTime: occEndDate.toISOString(),
          reminderTime: event.reminderTime || undefined,
        });

        await rsvpMutation.mutateAsync({ eventId: created.id, status });
      } else if (isRecurring && scope === 'future') {
        const splitDay = new Date(occStartDate.getFullYear(), occStartDate.getMonth(), occStartDate.getDate());
        const evOriginalStartDay = new Date(evStart.getFullYear(), evStart.getMonth(), evStart.getDate());

        if (splitDay.getTime() > evOriginalStartDay.getTime()) {
          const dayBefore = new Date(splitDay);
          dayBefore.setDate(dayBefore.getDate() - 1);
          dayBefore.setHours(23, 59, 59, 999);

          const updatedParentRecurrence: RecurrenceConfig = {
            ...(recurrenceConfig!),
            endType: 'on_date',
            endDate: dayBefore,
          };
          const updatedParentDesc = serializeRecurrence(updatedParentRecurrence, cleanDesc);

          await updateMutation.mutateAsync({
            eventId: event.id,
            input: { description: updatedParentDesc },
          });

          const childConfig: RecurrenceConfig = {
            ...(recurrenceConfig!),
            excludedDates: [],
            cancelledDates: [],
          };
          const childDesc = serializeRecurrence(childConfig, cleanDesc);

          const created = await createMutation.mutateAsync({
            eventTitle: event.eventTitle,
            description: childDesc,
            location: event.location || undefined,
            startTime: occStartDate.toISOString(),
            endTime: occEndDate.toISOString(),
            reminderTime: event.reminderTime || undefined,
          });

          await rsvpMutation.mutateAsync({ eventId: created.id, status });
        } else {
          await rsvpMutation.mutateAsync({ eventId: event.id, status });
        }
      } else {
        await rsvpMutation.mutateAsync({ eventId: event.id, status });
      }
    } catch (err: any) {
      console.warn('Failed to apply poll vote scope from card:', err);
    } finally {
      setIsApplyingPollScope(false);
      setPollScopeState(null);
    }
  };



  const handleShareToChat = async (eventId: string) => {
    try {
      await shareToChatMutation.mutateAsync(eventId);
      setShareSuccessId(eventId);
      setTimeout(() => setShareSuccessId(null), 2500);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi chia sẻ sự kiện');
    }
  };

  // Group schedule events chronologically by date: "Thứ, ngày tháng năm"
  const groupedScheduleByDate = useMemo(() => {
    const sorted = [...allCalendarEvents].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const now = new Date();
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const map = new Map<
      string,
      {
        dateObj: Date;
        dateLabel: string;
        isPast: boolean;
        isToday: boolean;
        isFuture: boolean;
        list: CalendarEventEntity[];
      }
    >();

    const addEventEntry = (d: Date, ev: CalendarEventEntity) => {
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (!map.has(dateKey)) {
        const rawWeekday = d.toLocaleDateString('vi-VN', { weekday: 'long' });
        const weekday = rawWeekday
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        const day = d.getDate();
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        const dateLabel = `${weekday}, ngày ${day} tháng ${month} năm ${year}`;

        const gDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const isToday = gDateOnly === todayDateOnly;
        const isPast = gDateOnly < todayDateOnly;
        const isFuture = gDateOnly > todayDateOnly;

        map.set(dateKey, { dateObj: d, dateLabel, isPast, isToday, isFuture, list: [] });
      }

      if (!map.get(dateKey)!.list.some((e) => e.id === ev.id)) {
        map.get(dateKey)!.list.push(ev);
      }
    };

    for (const ev of sorted) {
      const evStart = new Date(ev.startTime);
      const evEnd = ev.endTime ? new Date(ev.endTime) : evStart;
      const startDay = new Date(evStart.getFullYear(), evStart.getMonth(), evStart.getDate());
      const endDay = new Date(evEnd.getFullYear(), evEnd.getMonth(), evEnd.getDate());

      if (startDay.getTime() === endDay.getTime()) {
        addEventEntry(startDay, ev);
      } else {
        // Multi-day event: span every calendar day between startDay and endDay
        const cur = new Date(startDay);
        let count = 0;
        while (cur.getTime() <= endDay.getTime() && count < 60) {
          addEventEntry(new Date(cur), ev);
          cur.setDate(cur.getDate() + 1);
          count++;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [allCalendarEvents]);

  // Determine current active target for "Hôm nay" jump and red header highlighting
  const currentTargetDateLabel = useMemo(() => {
    const now = new Date();
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // 1. Try finding today
    const todayGroup = groupedScheduleByDate.find((g) => {
      const gTime = new Date(g.dateObj.getFullYear(), g.dateObj.getMonth(), g.dateObj.getDate()).getTime();
      return gTime === todayDateOnly;
    });
    if (todayGroup) return todayGroup.dateLabel;

    // 2. Try finding the first upcoming group (future)
    const nextGroup = groupedScheduleByDate.find((g) => {
      const gTime = new Date(g.dateObj.getFullYear(), g.dateObj.getMonth(), g.dateObj.getDate()).getTime();
      return gTime > todayDateOnly;
    });
    if (nextGroup) return nextGroup.dateLabel;

    // 3. Fallback to the last past group if everything is in the past
    if (groupedScheduleByDate.length > 0) {
      return groupedScheduleByDate[groupedScheduleByDate.length - 1].dateLabel;
    }
    return null;
  }, [groupedScheduleByDate]);

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
    const initialStart = formatToLocalDateTimeInput(baseDate, 6, 0);
    const initialEnd = formatToLocalDateTimeInput(baseDate, 23, 59);
    const initialRec = createDefaultRecurrenceConfig(baseDate);

    setStartTime(initialStart);
    setEndTime(initialEnd);
    setRecurrenceConfig(initialRec);

    previousDetailModalRef.current = null;
    initialFormSnapshotRef.current = {
      title: '',
      location: '',
      description: '',
      startTime: initialStart,
      endTime: initialEnd,
      reminderMinutes: '15',
      recurrenceConfigStr: JSON.stringify(initialRec),
    };

    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (ev: CalendarEventEntity, occDate?: Date) => {
    setEditingEvent(ev);
    const targetOcc = occDate || (selectedDate ? new Date(selectedDate) : new Date(ev.startTime));
    setEditingOccurrenceDate(targetOcc);
    setSubmitError(null);
    setTitle(ev.eventTitle);
    setLocation(ev.location || '');

    const { cleanDesc, recurrenceConfig: parsedRec } = parseEventRecurrence(ev.description);
    setDescription(cleanDesc);

    const s = new Date(ev.startTime);
    const e = ev.endTime ? new Date(ev.endTime) : new Date(s.getTime() + 3600000);

    let startVal = '';
    let endVal = '';

    if (parsedRec && parsedRec.frequency !== 'none' && targetOcc) {
      const occStart = new Date(targetOcc);
      occStart.setHours(s.getHours(), s.getMinutes(), 0, 0);
      startVal = formatToLocalDateTimeInput(occStart, s.getHours(), s.getMinutes());

      const diffDays = Math.round(
        (new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime() -
          new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const occEnd = new Date(targetOcc);
      occEnd.setDate(occEnd.getDate() + Math.max(0, diffDays));
      endVal = formatToLocalDateTimeInput(occEnd, e.getHours(), e.getMinutes());
    } else {
      startVal = formatToLocalDateTimeInput(s, s.getHours(), s.getMinutes());
      endVal = formatToLocalDateTimeInput(e, e.getHours(), e.getMinutes());
    }

    setStartTime(startVal);
    setEndTime(endVal);

    const recVal = parsedRec || createDefaultRecurrenceConfig(s, e);
    setRecurrenceConfig(recVal);

    let remVal = 'none';
    if (ev.reminderTime && ev.startTime) {
      const diffMins = Math.round(
        (new Date(ev.startTime).getTime() - new Date(ev.reminderTime).getTime()) / 60000
      );
      if ([0, 5, 15, 30, 60, 120, 1440, 2880].includes(diffMins)) {
        remVal = String(diffMins);
      }
    }
    setReminderMinutes(remVal);

    previousDetailModalRef.current = {
      event: ev,
      occDate: targetOcc,
    };
    initialFormSnapshotRef.current = {
      title: ev.eventTitle,
      location: ev.location || '',
      description: cleanDesc,
      startTime: startVal,
      endTime: endVal,
      reminderMinutes: remVal,
      recurrenceConfigStr: JSON.stringify(recVal),
    };

    setDetailModalState({ isOpen: false, event: null, occDate: null });
    setIsAddModalOpen(true);
  };

  const hasFormChanges = useCallback(() => {
    const initial = initialFormSnapshotRef.current;
    if (!initial) return false;
    if (title.trim() !== initial.title.trim()) return true;
    if (location.trim() !== initial.location.trim()) return true;
    if (description.trim() !== initial.description.trim()) return true;
    if (startTime !== initial.startTime) return true;
    if (endTime !== initial.endTime) return true;
    if (reminderMinutes !== initial.reminderMinutes) return true;
    if (JSON.stringify(recurrenceConfig) !== initial.recurrenceConfigStr) return true;
    return false;
  }, [title, location, description, startTime, endTime, reminderMinutes, recurrenceConfig]);

  const handleForceCloseForm = useCallback(() => {
    setShowUnsavedChangesModal(false);
    setIsAddModalOpen(false);
    const prev = previousDetailModalRef.current;
    setEditingEvent(null);
    setEditingOccurrenceDate(null);
    previousDetailModalRef.current = null;
    initialFormSnapshotRef.current = null;

    if (prev && prev.event) {
      setDetailModalState({
        isOpen: true,
        event: prev.event,
        occDate: prev.occDate,
      });
    }
  }, []);

  const handleRequestCloseForm = useCallback(() => {
    if (hasFormChanges()) {
      setShowUnsavedChangesModal(true);
    } else {
      handleForceCloseForm();
    }
  }, [hasFormChanges, handleForceCloseForm]);

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
      setIsCustomRepeatOpen(true);
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
    const day = new Date(year, month - 1, 1).getDay();
    return day === 0 ? 6 : day - 1; // 0 = Thứ Hai, 6 = Chủ Nhật
  }, [year, month]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);

    if (viewMode === 'upcoming') {
      setTimeout(() => {
        const el = document.getElementById('schedule-current-target');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  };

  // Auto-scroll to today or next upcoming event when switching to schedule view
  useEffect(() => {
    if (viewMode === 'upcoming' && !isAllEventsLoading && groupedScheduleByDate.length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById('schedule-current-target');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [viewMode, isAllEventsLoading, groupedScheduleByDate.length]);

  // Map events to days of the current month
  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEventEntity[]>();
    for (let d = 1; d <= daysInMonth; d++) {
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
      const targetEv = selectedDayEvents.find((e) => e.id === targetCalendarEventId);
      if (targetEv) {
        setDetailModalState({
          isOpen: true,
          event: targetEv,
          occDate: new Date(selectedDate),
        });
      }
      const timer = setTimeout(() => {
        const el = document.getElementById(`calendar-event-${targetCalendarEventId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [targetCalendarEventId, selectedDayEvents, selectedDate]);

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

          const created = await createMutation.mutateAsync({
            eventTitle: title.trim(),
            description: standaloneDesc,
            location: location.trim() || undefined,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            reminderTime: reminderIso,
          });

          if (previousDetailModalRef.current) {
            setDetailModalState({
              isOpen: true,
              event: created,
              occDate: new Date(created.startTime),
            });
          }
        } else if (isRecurring && scope === 'future' && (editingOccurrenceDate || startTime)) {
          const splitDate = startTime ? new Date(startTime) : editingOccurrenceDate ? new Date(editingOccurrenceDate) : new Date();
          const evOriginalStart = new Date(editingEvent.startTime);
          const evOriginalStartDay = new Date(
            evOriginalStart.getFullYear(),
            evOriginalStart.getMonth(),
            evOriginalStart.getDate(),
          );
          const splitDay = new Date(
            splitDate.getFullYear(),
            splitDate.getMonth(),
            splitDate.getDate(),
          );

          // Nếu ngày tách lớn hơn ngày bắt đầu đầu tiên của sự kiện: Tách làm 2 sự kiện có chu kỳ lặp khác nhau
          if (splitDay.getTime() > evOriginalStartDay.getTime()) {
            const dayBefore = new Date(splitDay);
            dayBefore.setDate(dayBefore.getDate() - 1);
            dayBefore.setHours(23, 59, 59, 999);

            const { recurrenceConfig: parentConfig, cleanDesc: parentCleanDesc } =
              parseEventRecurrence(editingEvent.description);
            const updatedParentRecurrence: RecurrenceConfig = {
              ...(parentConfig || recurrenceConfig),
              endType: 'on_date',
              endDate: dayBefore,
            };
            const updatedParentDesc = serializeRecurrence(
              updatedParentRecurrence,
              parentCleanDesc,
            );

            // 1. Cập nhật sự kiện cũ: kết thúc lặp vào ngày trước splitDate
            await updateMutation.mutateAsync({
              eventId: editingEvent.id,
              input: {
                description: updatedParentDesc,
              },
            });

            // 2. Tạo sự kiện mới: độ lặp mới bắt đầu từ splitDate
            // Reset excludedDates và cancelledDates để không bị ảnh hưởng bởi chuỗi cũ
            const childConfig: RecurrenceConfig = {
              ...recurrenceConfig,
              excludedDates: [],
              cancelledDates: [],
            };
            const childDesc = serializeRecurrence(childConfig, description);

            const created = await createMutation.mutateAsync({
              eventTitle: title.trim(),
              description: childDesc,
              location: location.trim() || undefined,
              startTime: start.toISOString(),
              endTime: end.toISOString(),
              reminderTime: reminderIso,
            });

            if (previousDetailModalRef.current) {
              setDetailModalState({
                isOpen: true,
                event: created,
                occDate: new Date(created.startTime),
              });
            }
          } else {
            // Nếu ngày tách trùng hoặc trước ngày bắt đầu ban đầu: cập nhật trực tiếp sự kiện hiện tại
            const updated = await updateMutation.mutateAsync({
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

            if (previousDetailModalRef.current) {
              setDetailModalState({
                isOpen: true,
                event: updated,
                occDate: editingOccurrenceDate || new Date(updated.startTime),
              });
            }
          }
        } else {
          const updated = await updateMutation.mutateAsync({
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

          if (previousDetailModalRef.current) {
            setDetailModalState({
              isOpen: true,
              event: updated,
              occDate: editingOccurrenceDate || new Date(updated.startTime),
            });
          }
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
      setEditingOccurrenceDate(null);
      previousDetailModalRef.current = null;
      initialFormSnapshotRef.current = null;
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

  // Execution handler for Deleting events with 3 options
  const executeDelete = async (scope: 'this' | 'future' | 'all') => {
    const ev = deleteModalState.event;
    const occD = deleteModalState.occDate || selectedDate || (ev ? new Date(ev.startTime) : new Date());
    if (!ev) return;

    try {
      const { recurrenceConfig: parentConfig, cleanDesc: parentCleanDesc } = parseEventRecurrence(ev.description);
      const isRecurring = Boolean(parentConfig && parentConfig.frequency !== 'none');

      if (isRecurring && parentConfig) {
        const occKey = formatDateKey(occD);

        if (scope === 'this') {
          const currentExcluded = parentConfig.excludedDates || [];
          const nextExcluded = Array.from(new Set([...currentExcluded, occKey]));
          const updatedParentRecurrence: RecurrenceConfig = {
            ...parentConfig,
            excludedDates: nextExcluded,
          };
          const updatedParentDesc = serializeRecurrence(updatedParentRecurrence, parentCleanDesc);

          await updateMutation.mutateAsync({
            eventId: ev.id,
            input: {
              description: updatedParentDesc,
            },
          });
        } else if (scope === 'future') {
          const startOfOld = new Date(ev.startTime);
          if (formatDateKey(occD) <= formatDateKey(startOfOld)) {
            await deleteMutation.mutateAsync(ev.id);
          } else {
            const dayBefore = new Date(occD);
            dayBefore.setDate(dayBefore.getDate() - 1);
            const updatedConfig: RecurrenceConfig = {
              ...parentConfig,
              endType: 'on_date',
              endDate: dayBefore,
            };
            const newDesc = serializeRecurrence(updatedConfig, parentCleanDesc);
            await updateMutation.mutateAsync({
              eventId: ev.id,
              input: {
                description: newDesc,
              },
            });
          }
        } else {
          await deleteMutation.mutateAsync(ev.id);
        }
      } else {
        await deleteMutation.mutateAsync(ev.id);
      }

      setDeleteModalState({ isOpen: false, event: null, occDate: null });
      if (detailModalState.event?.id === ev.id) {
        setDetailModalState({ isOpen: false, event: null, occDate: null });
      }
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra khi xóa sự kiện');
    }
  };

  // Execution handler for Cancelling events with 3 options
  const executeCancel = async (scope: 'this' | 'future' | 'all') => {
    const ev = cancelModalState.event;
    const occD = cancelModalState.occDate || selectedDate || (ev ? new Date(ev.startTime) : new Date());
    if (!ev) return;

    try {
      const { recurrenceConfig: parentConfig, cleanDesc: parentCleanDesc } = parseEventRecurrence(ev.description);
      const isRecurring = Boolean(parentConfig && parentConfig.frequency !== 'none');

      if (isRecurring && parentConfig) {
        const occKey = formatDateKey(occD);

        if (scope === 'this') {
          const currentCancelled = parentConfig.cancelledDates || [];
          const nextCancelled = Array.from(new Set([...currentCancelled, occKey]));
          const updatedParentRecurrence: RecurrenceConfig = {
            ...parentConfig,
            cancelledDates: nextCancelled,
          };
          const updatedParentDesc = serializeRecurrence(updatedParentRecurrence, parentCleanDesc);

          const updated = await updateMutation.mutateAsync({
            eventId: ev.id,
            input: {
              description: updatedParentDesc,
            },
          });

          if (detailModalState.event?.id === ev.id) {
            setDetailModalState((prev) => (prev.event ? { ...prev, event: updated } : prev));
          }
        } else if (scope === 'future') {
          const dayBefore = new Date(occD);
          dayBefore.setDate(dayBefore.getDate() - 1);
          const updatedConfig: RecurrenceConfig = {
            ...parentConfig,
            endType: 'on_date',
            endDate: dayBefore,
          };
          const newDesc = serializeRecurrence(updatedConfig, parentCleanDesc);
          const updated = await updateMutation.mutateAsync({
            eventId: ev.id,
            input: {
              description: newDesc,
            },
          });

          if (detailModalState.event?.id === ev.id) {
            setDetailModalState((prev) => (prev.event ? { ...prev, event: updated } : prev));
          }
        } else {
          await cancelMutation.mutateAsync(ev.id);
          if (detailModalState.event?.id === ev.id) {
            setDetailModalState((prev) =>
              prev.event ? { ...prev, event: { ...prev.event, isCancelled: true } } : prev
            );
          }
        }
      } else {
        await cancelMutation.mutateAsync(ev.id);
        if (detailModalState.event?.id === ev.id) {
          setDetailModalState((prev) =>
            prev.event ? { ...prev, event: { ...prev.event, isCancelled: true } } : prev
          );
        }
      }

      setCancelModalState({ isOpen: false, event: null, occDate: null });
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra khi hủy lịch hẹn');
    }
  };

  // Execution handler for Restoring cancelled events / occurrences
  const executeRestore = async (ev: CalendarEventEntity, occD: Date) => {
    try {
      const { recurrenceConfig: parentConfig, cleanDesc: parentCleanDesc } = parseEventRecurrence(ev.description);
      const isRecurring = Boolean(parentConfig && parentConfig.frequency !== 'none');
      const occKey = formatDateKey(occD);

      if (isRecurring && parentConfig) {
        const updatedConfig: RecurrenceConfig = {
          ...parentConfig,
          cancelledDates: (parentConfig.cancelledDates || []).filter((d) => d !== occKey),
        };
        const newDesc = serializeRecurrence(updatedConfig, parentCleanDesc);
        const updated = await updateMutation.mutateAsync({
          eventId: ev.id,
          input: {
            description: newDesc,
          },
        });
        if (detailModalState.event?.id === ev.id) {
          setDetailModalState((prev) => (prev.event ? { ...prev, event: updated } : prev));
        }
      } else {
        // If single event was marked isCancelled
        const updated = await updateMutation.mutateAsync({
          eventId: ev.id,
          input: {
            description: parentCleanDesc,
          },
        });
        if (detailModalState.event?.id === ev.id) {
          setDetailModalState((prev) =>
            prev.event ? { ...prev, event: { ...prev.event, isCancelled: false } } : prev
          );
        }
      }
    } catch (err: any) {
      alert(err?.message || 'Không thể khôi phục lịch hẹn');
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex-1 flex flex-col h-full bg-circle-canvas dark:bg-circle-dark-surface overflow-y-auto p-4 md:p-6 transition-colors">
      {isAddModalOpen ? (
        /* ============================================================== */
        /* FULL-VIEW FORM TẠO & CHỈNH SỬA SỰ KIỆN (ICON-DRIVEN VERTICAL) */
        /* ============================================================== */
        <div className="space-y-6 w-full pb-16 animate-in fade-in duration-200">
          {/* Floating Pill Buttons Bar (Bỏ heading, thay bằng Floating Pill Buttons) */}
          <div className="sticky top-0 z-30 pointer-events-none flex items-center justify-between gap-3 py-1 -mt-1 mb-2">
            {/* Left: Nút Quay lại - Floating Pill Button: "< Lịch" khi Tạo mới, "< Chi tiết" khi Chỉnh sửa */}
            <button
              type="button"
              onClick={handleRequestCloseForm}
              className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
              title={editingEvent ? 'Quay lại Chi tiết lịch hẹn' : 'Quay lại Lịch'}
            >
              <ChevronLeft className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{editingEvent ? 'Chi tiết' : 'Lịch'}</span>
            </button>

            {/* Right: Floating Pill Buttons: Đóng và Lưu (Cân bằng kích thước chuẩn xác) */}
            <div className="pointer-events-auto flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRequestCloseForm}
                className="inline-flex items-center justify-center w-20 sm:w-24 h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleAttemptSubmit}
                className="inline-flex items-center justify-center w-20 sm:w-24 h-9 rounded-full backdrop-blur-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Lưu</span>
                )}
              </button>
            </div>
          </div>

          {/* Form Fields: Xếp hàng dọc theo thứ tự, bỏ khung thẻ mượt mà trực tiếp */}
          <div className="space-y-6 pt-1">
            {/* 1. Tiêu đề sự kiện */}
            <div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Thêm tiêu đề sự kiện *"
                className="w-full text-xl sm:text-2xl font-bold tracking-tight text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/40 border-b border-circle-hairline dark:border-circle-dark-hairline pb-3 focus:outline-hidden focus:border-teal-600 bg-transparent transition-colors"
              />
            </div>

            {/* 2. Địa chỉ / Vị trí / Họp online (Icon MapPin - đồng bộ màu xanh teal) ngay dưới tiêu đề */}
            <div className="flex items-center gap-4 pt-2">
              <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <LocationSearchInput
                  value={location}
                  onChange={(loc) => setLocation(loc)}
                  placeholder="Thêm địa điểm trên bản đồ hoặc link họp online (Google Meet, Zoom...)"
                />
              </div>
            </div>

            {/* 3. Hàng Thời gian (Icon Clock): Bỏ label, giữa 2 picker có mũi tên ArrowRight */}
            <div className="flex items-center gap-4 pt-4 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
              <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <CustomDateTimePicker
                      required
                      value={startTime}
                      onChange={(val) => {
                        setStartTime(val);
                        if (val) {
                          const s = new Date(val);
                          setEditingOccurrenceDate(s);
                          if (!endTime || endTime <= val) {
                            s.setHours(s.getHours() + 1);
                            setEndTime(formatToLocalDateTimeInput(s, s.getHours(), s.getMinutes()));
                          }
                        }
                      }}
                      min={undefined}
                      placeholder="dd/mm/yyyy --:--"
                      align="left"
                    />
                  </div>

                  <div className="flex items-center justify-center px-1 text-circle-slate shrink-0">
                    <ArrowRight className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <CustomDateTimePicker
                      required
                      value={endTime}
                      onChange={(val) => setEndTime(val)}
                      min={startTime || undefined}
                      placeholder="dd/mm/yyyy --:--"
                      align="right"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Hàng Lặp lại (Icon Repeat) */}
            <div className="flex items-start gap-4 pt-4 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
              <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0 mt-0.5">
                <Repeat className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div ref={repeatDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsRepeatDropdownOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 px-3.5 py-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas/60 transition-colors text-left focus:outline-hidden focus:ring-1 focus:ring-circle-sage cursor-pointer"
                  >
                    <span className="truncate font-medium">
                      {recurrenceConfig.frequency === 'none'
                        ? 'Không lặp lại'
                        : recurrenceConfig.isCustom
                        ? formatRecurrenceSummary(recurrenceConfig, false)
                        : recurrenceConfig.frequency === 'daily'
                        ? 'Hằng ngày'
                        : recurrenceConfig.frequency === 'weekly'
                        ? 'Hằng tuần'
                        : recurrenceConfig.frequency === 'monthly'
                        ? 'Hằng tháng'
                        : 'Hằng năm'}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-circle-slate transition-transform duration-200 shrink-0 ml-2 ${
                        isRepeatDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isRepeatDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-full bg-white dark:bg-circle-dark-surface rounded-xl border border-circle-hairline dark:border-circle-dark-hairline shadow-lg z-50 py-1 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          handleRepeatOptionChange('none');
                          setIsRepeatDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left hover:bg-circle-wash dark:hover:bg-circle-dark-wash cursor-pointer transition-colors ${
                          recurrenceConfig.frequency === 'none'
                            ? 'font-bold text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30'
                            : 'text-circle-charcoal dark:text-circle-dark-text'
                        }`}
                      >
                        <span>Không lặp lại</span>
                        {recurrenceConfig.frequency === 'none' && (
                          <Check className="h-3.5 w-3.5 text-teal-600 shrink-0 ml-2" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleRepeatOptionChange('daily');
                          setIsRepeatDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left hover:bg-circle-wash dark:hover:bg-circle-dark-wash cursor-pointer transition-colors ${
                          !recurrenceConfig.isCustom && recurrenceConfig.frequency === 'daily'
                            ? 'font-bold text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30'
                            : 'text-circle-charcoal dark:text-circle-dark-text'
                        }`}
                      >
                        <span>Hằng ngày</span>
                        {!recurrenceConfig.isCustom && recurrenceConfig.frequency === 'daily' && (
                          <Check className="h-3.5 w-3.5 text-teal-600 shrink-0 ml-2" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleRepeatOptionChange('weekly');
                          setIsRepeatDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left hover:bg-circle-wash dark:hover:bg-circle-dark-wash cursor-pointer transition-colors ${
                          !recurrenceConfig.isCustom && recurrenceConfig.frequency === 'weekly'
                            ? 'font-bold text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30'
                            : 'text-circle-charcoal dark:text-circle-dark-text'
                        }`}
                      >
                        <span>Hằng tuần</span>
                        {!recurrenceConfig.isCustom && recurrenceConfig.frequency === 'weekly' && (
                          <Check className="h-3.5 w-3.5 text-teal-600 shrink-0 ml-2" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleRepeatOptionChange('monthly');
                          setIsRepeatDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left hover:bg-circle-wash dark:hover:bg-circle-dark-wash cursor-pointer transition-colors ${
                          !recurrenceConfig.isCustom && recurrenceConfig.frequency === 'monthly'
                            ? 'font-bold text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30'
                            : 'text-circle-charcoal dark:text-circle-dark-text'
                        }`}
                      >
                        <span>Hằng tháng</span>
                        {!recurrenceConfig.isCustom && recurrenceConfig.frequency === 'monthly' && (
                          <Check className="h-3.5 w-3.5 text-teal-600 shrink-0 ml-2" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleRepeatOptionChange('yearly');
                          setIsRepeatDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left hover:bg-circle-wash dark:hover:bg-circle-dark-wash cursor-pointer transition-colors ${
                          !recurrenceConfig.isCustom && recurrenceConfig.frequency === 'yearly'
                            ? 'font-bold text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30'
                            : 'text-circle-charcoal dark:text-circle-dark-text'
                        }`}
                      >
                        <span>Hằng năm</span>
                        {!recurrenceConfig.isCustom && recurrenceConfig.frequency === 'yearly' && (
                          <Check className="h-3.5 w-3.5 text-teal-600 shrink-0 ml-2" />
                        )}
                      </button>

                      <div className="my-1 border-t border-circle-hairline dark:border-circle-dark-hairline" />

                      <button
                        type="button"
                        onClick={() => {
                          setIsRepeatDropdownOpen(false);
                          handleRepeatOptionChange('custom');
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left hover:bg-circle-wash dark:hover:bg-circle-dark-wash cursor-pointer transition-colors ${
                          recurrenceConfig.isCustom
                            ? 'font-bold text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30'
                            : 'text-circle-charcoal dark:text-circle-dark-text'
                        }`}
                      >
                        <span>Tùy chỉnh...</span>
                        {recurrenceConfig.isCustom && (
                          <Check className="h-3.5 w-3.5 text-teal-600 shrink-0 ml-2" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Kết thúc lặp lại nếu frequency !== 'none' */}
                {recurrenceConfig.frequency !== 'none' && (
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <span className="text-xs font-semibold text-circle-slate dark:text-circle-dark-muted">
                      Kết thúc lặp:
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
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          recurrenceConfig.endType === 'never'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs font-bold'
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
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          recurrenceConfig.endType === 'on_date'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs font-bold'
                            : 'bg-white dark:bg-circle-dark-surface border-circle-hairline text-circle-slate hover:text-circle-charcoal'
                        }`}
                      >
                        Vào ngày
                      </button>
                    </div>

                    {recurrenceConfig.endType === 'on_date' && (
                      <div className="w-48">
                        <CustomDateTimePicker
                          dateOnly
                          value={
                            recurrenceConfig.endDate
                              ? formatDateKey(recurrenceConfig.endDate)
                              : ''
                          }
                          onChange={(val) => {
                            if (!val) {
                              setRecurrenceConfig((prev) => ({
                                ...prev,
                                endType: 'never',
                                endDate: null,
                              }));
                            } else {
                              const [y, m, d] = val.split('-').map(Number);
                              const targetDate = new Date(y, m - 1, d, 23, 59, 59);
                              setRecurrenceConfig((prev) => ({
                                ...prev,
                                endType: 'on_date',
                                endDate: targetDate,
                              }));
                            }
                          }}
                          min={
                            startTime
                              ? startTime.split('T')[0]
                              : undefined
                          }
                          placeholder="dd/mm/yyyy"
                          align="left"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 5. Hàng Nhắc nhở (Icon Bell) */}
            <div className="flex items-start gap-4 pt-4 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
              <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0 mt-0.5">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0 max-w-sm">
                <select
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(e.target.value)}
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 px-3.5 py-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage"
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
            </div>

            {/* 6. Hàng Ghi chú / Mô tả (Icon AlignLeft) */}
            <div className="flex items-start gap-4 pt-4 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
              <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0 mt-0.5">
                <AlignLeft className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Thêm ghi chú, tài liệu hoặc nội dung cần chuẩn bị cho cuộc họp / sự kiện..."
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 px-3.5 py-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:outline-hidden focus:ring-1 focus:ring-teal-500 resize-y min-h-[96px]"
                />
              </div>
            </div>

            {submitError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-medium">
                {submitError}
              </div>
            )}


          </div>
        </div>
      ) : detailModalState.isOpen && detailModalState.event ? (
        /* ============================================================== */
        /* FULL-VIEW CHI TIẾT LỊCH HẸN (TƯƠNG TỰ FORM TẠO/SỬA) */
        /* ============================================================== */
        <CircleEventDetailModal
          isOpen={detailModalState.isOpen}
          onClose={() => setDetailModalState({ isOpen: false, event: null, occDate: null })}
          event={detailModalState.event}
          occurrenceDate={detailModalState.occDate}
          circleId={circleId}
          onEdit={(ev, occDate) => {
            handleOpenEditModal(ev, occDate);
          }}
          onDelete={(ev, occDate) => {
            setDeleteModalState({
              isOpen: true,
              event: ev,
              occDate,
            });
          }}
          onCancel={(ev, occDate) => {
            setCancelModalState({
              isOpen: true,
              event: ev,
              occDate,
            });
          }}
          onRestore={(ev, occDate) => {
            executeRestore(ev, occDate);
          }}
          onShareToChat={handleShareToChat}
        />
      ) : (
        <>
          {/* Floating Pill Buttons Bar (Bỏ heading, thay bằng Floating Pill Buttons đồng bộ) */}
          <div className="sticky top-0 z-30 pointer-events-none flex items-center justify-between gap-3 py-1 -mt-1 mb-4">
            {/* Left: View mode toggle pill (Theo tháng / Sắp tới) */}
            <div className="pointer-events-auto inline-flex items-center p-1 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Theo tháng</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('upcoming')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'upcoming'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Theo lịch trình</span>
              </button>
            </div>

            {/* Right: Floating Pill Buttons: "Hôm nay" và "Tạo sự kiện" */}
            <div className="pointer-events-auto flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={goToToday}
                className="inline-flex items-center justify-center px-4 h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full backdrop-blur-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo sự kiện</span>
              </button>
            </div>
          </div>

      {/* Main Content Area */}
      {viewMode === 'upcoming' ? (
        /* Schedule feed */
        <div className="space-y-6 w-full">
          {isAllEventsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-circle-slate" />
            </div>
          ) : allCalendarEvents.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-circle-hairline bg-white dark:bg-circle-dark-canvas p-8">
              <CalendarIcon className="h-10 w-10 text-circle-slate/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text">
                Không có sự kiện nào theo lịch trình
              </p>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1">
                Tạo một sự kiện để lên lịch làm việc hoặc gặp gỡ cùng các thành viên.
              </p>
            </div>
          ) : (
            groupedScheduleByDate.map(({ dateLabel, dateObj, isPast, isToday, isFuture, list }) => {
              const isCurrentTarget = dateLabel === currentTargetDateLabel;

              return (
                <div
                  key={dateLabel}
                  id={isCurrentTarget ? 'schedule-current-target' : undefined}
                  className={`space-y-3 scroll-mt-24 ${isPast ? 'opacity-85' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-xs sm:text-sm font-bold transition-colors ${
                        isCurrentTarget
                          ? 'text-red-600 dark:text-red-400 font-extrabold'
                          : isPast
                          ? 'text-zinc-500/80 dark:text-zinc-400/80 font-medium'
                          : 'text-circle-charcoal dark:text-circle-dark-text font-bold'
                      }`}
                    >
                      {dateLabel}
                    </h3>
                    {isToday ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                        Hôm nay
                      </span>
                    ) : isCurrentTarget ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                        Sắp diễn ra
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    {list.map((ev) => {
                      const isCancelled = ev.isCancelled;
                      const myRsvp = ev.rsvps?.find((r) => r.userId === user?.id)?.status;

                      return (
                        <div
                          key={`${ev.id}-${dateLabel}`}
                          onClick={() =>
                            setDetailModalState({
                              isOpen: true,
                              event: ev,
                              occDate: dateObj,
                            })
                          }
                          className={`w-full group cursor-pointer hover:border-teal-500/60 hover:shadow-xs transition-all rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas p-4 shadow-2xs space-y-2.5 ${
                            isPast ? 'bg-zinc-50/40 dark:bg-zinc-900/20' : ''
                          }`}
                        >
                          {/* Row 1: Tiêu đề & Tag Đã Hủy (bên trái), 3 Nút phản hồi nhanh (bên phải) */}
                          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`text-sm sm:text-base font-bold truncate ${
                                  isPast
                                    ? 'text-zinc-600 dark:text-zinc-300'
                                    : 'text-circle-charcoal dark:text-circle-dark-text'
                                }`}
                              >
                                {ev.eventTitle}
                              </span>
                              {isCancelled && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 shrink-0">
                                  ĐÃ HỦY
                                </span>
                              )}
                            </div>

                            {/* 3 Nút phản hồi nhanh */}
                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {[
                                { status: EventRsvpStatus.YES, label: 'Tham gia', icon: Check, active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-bold', hover: 'hover:border-emerald-500/50 hover:text-emerald-600' },
                                { status: EventRsvpStatus.MAYBE, label: 'Chưa chắc', icon: HelpCircle, active: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold', hover: 'hover:border-amber-500/50 hover:text-amber-600' },
                                { status: EventRsvpStatus.NO, label: 'Bận', icon: X, active: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 font-bold', hover: 'hover:border-rose-500/50 hover:text-rose-600' },
                              ].map((btn) => {
                                const isSelected = myRsvp === btn.status;
                                const Icon = btn.icon;
                                return (
                                  <button
                                    key={btn.status}
                                    type="button"
                                    disabled={ev.isCancelled || rsvpMutation.isPending || isApplyingPollScope}
                                    onClick={() => handleCardRsvpClick(ev, btn.status, dateObj)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-all cursor-pointer shadow-2xs ${
                                      isSelected
                                        ? btn.active
                                        : `bg-white dark:bg-circle-dark-surface text-circle-slate dark:text-circle-dark-muted border-circle-hairline dark:border-white/10 ${btn.hover}`
                                    } disabled:opacity-50`}
                                  >
                                    {isSelected && <Icon className="h-3 w-3 shrink-0" />}
                                    <span>{btn.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Row 2: Thời gian diễn ra (dòng riêng) */}
                          <div className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-medium">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>{formatEventTimeForDate(ev, dateObj)}</span>
                          </div>

                          {/* Row 3: Địa điểm (dòng riêng bên dưới, duy nhất 1 icon từ EventLocationDisplay) */}
                          {ev.location && (
                            <div className="text-xs text-circle-slate dark:text-circle-dark-muted min-w-0">
                              <EventLocationDisplay location={ev.location} className="text-xs" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Month View Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Calendar Grid (2 cols) */}
          <div className="lg:col-span-2 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas p-4 shadow-2xs space-y-4">
            {/* Month Navigator */}
            <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg text-circle-slate hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors cursor-pointer"
                  title="Tháng trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Month & Year Picker Dropdown (Dạng Bánh xe / Xe lăn) */}
                <div ref={monthPickerRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMonthPickerOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash border border-transparent hover:border-circle-hairline dark:hover:border-white/10 transition-all cursor-pointer"
                    title="Chọn tháng và năm"
                  >
                    <span>Tháng {month} / {year}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-circle-slate transition-transform duration-200 ${isMonthPickerOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isMonthPickerOpen && (
                    <div className="absolute top-full left-0 mt-2 z-40 w-72 p-3.5 rounded-2xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-white/10 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted">
                          Chọn Tháng & Năm
                        </span>
                        <button
                          type="button"
                          onClick={handleWheelJumpToday}
                          className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                        >
                          Hôm nay
                        </button>
                      </div>

                      {/* BÁNH XE THÁNG VÀ NĂM CÓ CỤC ĐEN CỐ ĐỊNH (Dạng xe lăn) */}
                      <div className="relative h-[200px] w-full overflow-hidden flex justify-center items-center select-none bg-circle-wash/30 dark:bg-circle-dark-canvas/50 rounded-xl border border-circle-hairline/60">
                        {/* CỤC ĐEN CỐ ĐỊNH Ở CHÍNH GIỮA */}
                        <div className="absolute inset-x-2 top-[80px] h-10 rounded-xl bg-circle-charcoal dark:bg-teal-600 shadow-md pointer-events-none z-0 border border-white/10" />

                        {/* Cột Tháng (Tháng 01 - Tháng 12) - ẨN 100% THANH CUỘN */}
                        <div
                          ref={wheelMonthsScrollRef}
                          onScroll={handleWheelMonthScroll}
                          className="h-full w-28 overflow-y-auto snap-y snap-mandatory z-10 text-center py-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        >
                          <div className="h-[80px] shrink-0 pointer-events-none" />
                          {WHEEL_MONTH_NAMES.map((mName, idx) => {
                            const isSelected = idx === month - 1;
                            return (
                              <div
                                key={mName}
                                onClick={() => handleWheelSelectMonth(idx)}
                                className={`h-10 flex items-center justify-center snap-center text-xs font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'text-white dark:text-white scale-105 font-extrabold'
                                    : 'text-circle-slate dark:text-circle-dark-muted opacity-35 hover:opacity-80 scale-90'
                                }`}
                              >
                                {mName}
                              </div>
                            );
                          })}
                          <div className="h-[80px] shrink-0 pointer-events-none" />
                        </div>

                        {/* Dấu gạch chéo phân cách */}
                        <div className="z-10 font-bold text-sm text-white/70 dark:text-white/70 pointer-events-none px-1">
                          /
                        </div>

                        {/* Cột Năm - ẨN 100% THANH CUỘN */}
                        <div
                          ref={wheelYearsScrollRef}
                          onScroll={handleWheelYearScroll}
                          className="h-full w-20 overflow-y-auto snap-y snap-mandatory z-10 text-center py-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        >
                          <div className="h-[80px] shrink-0 pointer-events-none" />
                          {WHEEL_YEARS.map((y) => {
                            const isSelected = y === year;
                            return (
                              <div
                                key={y}
                                onClick={() => handleWheelSelectYear(y)}
                                className={`h-10 flex items-center justify-center snap-center text-xs font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'text-white dark:text-white scale-105 font-extrabold'
                                    : 'text-circle-slate dark:text-circle-dark-muted opacity-35 hover:opacity-80 scale-90'
                                }`}
                              >
                                {y}
                              </div>
                            );
                          })}
                          <div className="h-[80px] shrink-0 pointer-events-none" />
                        </div>
                      </div>

                      {/* Nút Xong */}
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setIsMonthPickerOpen(false)}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-2xs cursor-pointer"
                        >
                          Xong
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg text-circle-slate hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors cursor-pointer"
                  title="Tháng sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <span className="text-xs text-circle-slate dark:text-circle-dark-muted font-medium">
                {events.length} sự kiện trong tháng
              </span>
            </div>

            {/* Weekday Labels (Thứ 2 đến CN) */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-circle-slate dark:text-circle-dark-muted mb-2">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty leading slots */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[80px] p-1 rounded-xl bg-circle-canvas/30 dark:bg-circle-dark-surface/20 border border-transparent"
                />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected =
                  selectedDate.getDate() === dayNum &&
                  selectedDate.getMonth() + 1 === month &&
                  selectedDate.getFullYear() === year;

                const isToday =
                  now.getDate() === dayNum &&
                  now.getMonth() + 1 === month &&
                  now.getFullYear() === year;

                const dayEvents = eventsByDay.get(dayNum) || [];

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => setSelectedDate(new Date(year, month - 1, dayNum))}
                    className={`min-h-[80px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/20 dark:bg-teal-950/20'
                        : isToday
                        ? 'border-teal-500/40 bg-teal-50/10'
                        : 'border-circle-hairline/60 dark:border-circle-dark-hairline/40 hover:bg-circle-wash/50 dark:hover:bg-circle-dark-surface/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center ${
                          isToday
                            ? 'bg-teal-600 text-white'
                            : isSelected
                            ? 'text-teal-700 dark:text-teal-300 font-extrabold'
                            : 'text-circle-charcoal dark:text-circle-dark-text'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[9px] font-bold text-teal-600 bg-teal-500/10 px-1.5 py-0.2 rounded-full">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event indicators - Clicking directly opens Event Detail Modal */}
                    <div className="w-full space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const isCancelled = isEventCancelledOnDate(ev, new Date(year, month - 1, dayNum));
                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(new Date(year, month - 1, dayNum));
                              setDetailModalState({
                                isOpen: true,
                                event: ev,
                                occDate: new Date(year, month - 1, dayNum),
                              });
                            }}
                            className={`text-[9px] px-1 py-0.2 rounded-sm truncate text-left font-medium cursor-pointer hover:opacity-80 transition-opacity ${
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
                      onClick={() => {
                        setDetailModalState({
                          isOpen: true,
                          event: ev,
                          occDate: new Date(selectedDate),
                        });
                      }}
                      className={`rounded-xl border p-3 space-y-2.5 transition-all cursor-pointer hover:border-teal-500/60 hover:shadow-xs ${
                        isOccCancelled
                          ? 'border-rose-200 bg-rose-50/40 dark:bg-rose-950/20'
                          : 'border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-surface'
                      }`}
                    >
                      {/* Row 1: Tiêu đề & Tag Đã Hủy */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-xs sm:text-sm font-bold ${
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
                      </div>

                      {/* Row 2: Thời gian diễn ra */}
                      <div className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-medium">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatEventTimeForDate(ev, selectedDate)}</span>
                      </div>

                      {/* Row 3: Địa điểm */}
                      {ev.location && (
                        <div className="text-xs text-circle-slate dark:text-circle-dark-muted min-w-0">
                          <EventLocationDisplay location={ev.location} className="text-xs" />
                        </div>
                      )}

                      {/* Row 4: 3 Nút phản hồi nhanh RSVP */}
                      {(() => {
                        const rsvps = ev.rsvps || [];
                        const myVote = rsvps.find((r) => r.userId === user?.id)?.status;

                        return (
                          <div
                            className="pt-2 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60 flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {[
                              { status: EventRsvpStatus.YES, label: 'Tham gia', icon: Check, active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-bold', hover: 'hover:border-emerald-500/50 hover:text-emerald-600' },
                              { status: EventRsvpStatus.MAYBE, label: 'Chưa chắc', icon: HelpCircle, active: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold', hover: 'hover:border-amber-500/50 hover:text-amber-600' },
                              { status: EventRsvpStatus.NO, label: 'Bận', icon: X, active: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 font-bold', hover: 'hover:border-rose-500/50 hover:text-rose-600' },
                            ].map((btn) => {
                              const isSelected = myVote === btn.status;
                              const Icon = btn.icon;
                              return (
                                <button
                                  key={btn.status}
                                  type="button"
                                  disabled={isOccCancelled || rsvpMutation.isPending || isApplyingPollScope}
                                  onClick={() => handleCardRsvpClick(ev, btn.status, new Date(selectedDate))}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-all cursor-pointer ${
                                    isSelected
                                      ? btn.active
                                      : `bg-white dark:bg-circle-dark-surface text-circle-slate dark:text-circle-dark-muted border-circle-hairline dark:border-white/10 ${btn.hover}`
                                  } disabled:opacity-50`}
                                >
                                  {isSelected && <Icon className="h-3 w-3 shrink-0" />}
                                  <span>{btn.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
        </>
      )}



      {/* ============================================================== */}
      {/* MODAL PHẠM VI ÁP DỤNG KHI BÌNH CHỌN TRÊN THẺ CHO SỰ KIỆN LẶP LẠI */}
      {/* ============================================================== */}
      {pollScopeState && pollScopeState.isOpen && (
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
                disabled={isApplyingPollScope}
                onClick={() => handleApplyPollScope('this')}
                className="w-full text-left p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  Chỉ lần này
                </p>
                <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                  Chỉ áp dụng phản hồi cho riêng ngày {formatDateOnly(pollScopeState.occDate)}, các lần khác giữ nguyên.
                </p>
              </button>

              <button
                type="button"
                disabled={isApplyingPollScope}
                onClick={() => handleApplyPollScope('future')}
                className="w-full text-left p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  Lần này và các lần tiếp theo
                </p>
                <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                  Áp dụng phản hồi từ ngày {formatDateOnly(pollScopeState.occDate)} trở đi (sẽ tách làm 2 sự kiện có chu kỳ lặp khác nhau).
                </p>
              </button>

              <button
                type="button"
                disabled={isApplyingPollScope}
                onClick={() => handleApplyPollScope('all')}
                className="w-full text-left p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  Tất cả các lần
                </p>
                <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                  Cập nhật phản hồi cho toàn bộ các lần diễn ra trong chuỗi lặp lại.
                </p>
              </button>
            </div>

            <div className="pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline flex justify-end">
              <button
                type="button"
                disabled={isApplyingPollScope}
                onClick={() => setPollScopeState(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-circle-slate hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* POPUP TÙY CHỈNH QUY TẮC LẶP */}
      {/* ============================================================== */}
      <CustomRecurrenceModal
        isOpen={isCustomRepeatOpen}
        onClose={() => setIsCustomRepeatOpen(false)}
        config={recurrenceConfig}
        startDate={startTime ? new Date(startTime) : new Date()}
        onApply={(updated) => {
          setRecurrenceConfig(updated);
        }}
      />

      



      {/* ============================================================== */}
      {/* MODAL CẢNH BÁO: THAY ĐỔI CHƯA LƯU */}
      {/* ============================================================== */}
      {showUnsavedChangesModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-5 shadow-2xl space-y-4">
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                Thay đổi chưa lưu
              </h4>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted leading-relaxed">
                Bạn muốn bỏ nội dung chỉnh sửa hay tiếp tục chỉnh sửa?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline">
              <button
                type="button"
                onClick={handleForceCloseForm}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
              >
                Bỏ nội dung chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => setShowUnsavedChangesModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-xs cursor-pointer"
              >
                Tiếp tục chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SCOPE CONFIRMATION MODAL CHO LƯU / SỬA (3 OPTIONS) */}
      {/* ============================================================== */}
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
                  Áp dụng thay đổi từ ngày {startTime ? formatDateOnly(new Date(startTime)) : editingOccurrenceDate ? formatDateOnly(editingOccurrenceDate) : ''} trở đi (sẽ tách làm 2 sự kiện có chu kỳ lặp khác nhau).
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
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SCOPE CONFIRMATION MODAL CHO XÓA (3 OPTIONS HOẶC CONFIRM ĐƠN) */}
      {/* ============================================================== */}
      {deleteModalState.isOpen && deleteModalState.event && (() => {
        const ev = deleteModalState.event;
        const occD = deleteModalState.occDate || selectedDate || new Date(ev.startTime);
        const { recurrenceConfig: parsedRec } = parseEventRecurrence(ev.description);
        const isRecurring = Boolean(parsedRec && parsedRec.frequency !== 'none');

        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-5 shadow-2xl space-y-4">
              <div>
                <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {isRecurring ? 'Xóa sự kiện lặp lại' : 'Xóa vĩnh viễn sự kiện'}
                </h4>
                <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1">
                  {isRecurring
                    ? 'Bạn muốn xóa sự kiện này cho lần diễn ra này, các lần tiếp theo hay tất cả các lần?'
                    : 'Bạn có chắc chắn muốn xóa vĩnh viễn sự kiện này khỏi lịch nhóm?'}
                </p>
              </div>

              {isRecurring ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => executeDelete('this')}
                    className="w-full text-left p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:border-rose-500 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-all"
                  >
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Chỉ xóa lần này
                    </p>
                    <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                      Ẩn sự kiện vào ngày {formatDateOnly(occD)}. Các lần khác vẫn hiển thị bình thường.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => executeDelete('future')}
                    className="w-full text-left p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:border-rose-500 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-all"
                  >
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Xóa lần này và các lần tiếp theo
                    </p>
                    <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                      Ngừng chuỗi lặp lại từ ngày {formatDateOnly(occD)} trở đi.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => executeDelete('all')}
                    className="w-full text-left p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:border-rose-500 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-all"
                  >
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Xóa tất cả các lần
                    </p>
                    <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                      Xóa vĩnh viễn toàn bộ chuỗi sự kiện khỏi lịch nhóm.
                    </p>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-circle-hairline">
                  <button
                    type="button"
                    onClick={() => setDeleteModalState({ isOpen: false, event: null, occDate: null })}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold text-circle-slate hover:bg-circle-wash transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={() => executeDelete('all')}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                  >
                    Xác nhận xóa
                  </button>
                </div>
              )}

              {isRecurring && (
                <div className="pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline flex justify-end">
                  <button
                    type="button"
                    onClick={() => setDeleteModalState({ isOpen: false, event: null, occDate: null })}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold text-circle-slate hover:bg-circle-wash transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ============================================================== */}
      {/* SCOPE CONFIRMATION MODAL CHO HỦY (3 OPTIONS HOẶC CONFIRM ĐƠN) */}
      {/* ============================================================== */}
      {cancelModalState.isOpen && cancelModalState.event && (() => {
        const ev = cancelModalState.event;
        const occD = cancelModalState.occDate || selectedDate || new Date(ev.startTime);
        const { recurrenceConfig: parsedRec } = parseEventRecurrence(ev.description);
        const isRecurring = Boolean(parsedRec && parsedRec.frequency !== 'none');

        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-5 shadow-2xl space-y-4">
              <div>
                <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {isRecurring ? 'Hủy sự kiện lặp lại' : 'Hủy lịch hẹn'}
                </h4>
                <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1">
                  {isRecurring
                    ? 'Bạn muốn hủy sự kiện này cho lần diễn ra này, các lần tiếp theo hay tất cả các lần?'
                    : 'Bạn có chắc chắn muốn hủy lịch hẹn này? Sự kiện sẽ được đánh dấu [Đã hủy] và giữ lại trên lịch nhóm.'}
                </p>
              </div>

              {isRecurring ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => executeCancel('this')}
                    className="w-full text-left p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:border-amber-500 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-all"
                  >
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      Chỉ hủy lần này
                    </p>
                    <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                      Đánh dấu đã hủy cho ngày {formatDateOnly(occD)}. Lịch hẹn vẫn lưu lại để nhóm theo dõi.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => executeCancel('future')}
                    className="w-full text-left p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:border-amber-500 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-all"
                  >
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      Hủy lần này và các lần tiếp theo
                    </p>
                    <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                      Đánh dấu đã hủy từ ngày {formatDateOnly(occD)} trở đi.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => executeCancel('all')}
                    className="w-full text-left p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:border-amber-500 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-all"
                  >
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      Hủy tất cả các lần
                    </p>
                    <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                      Đánh dấu đã hủy cho toàn bộ chuỗi sự kiện.
                    </p>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-circle-hairline">
                  <button
                    type="button"
                    onClick={() => setCancelModalState({ isOpen: false, event: null, occDate: null })}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold text-circle-slate hover:bg-circle-wash transition-colors"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCancel('all')}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                  >
                    Xác nhận hủy
                  </button>
                </div>
              )}

              {isRecurring && (
                <div className="pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline flex justify-end">
                  <button
                    type="button"
                    onClick={() => setCancelModalState({ isOpen: false, event: null, occDate: null })}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold text-circle-slate hover:bg-circle-wash transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
