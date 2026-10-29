'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Bell,
  Loader2,
  CalendarDays,
  Users,
  Check,
  HelpCircle,
  Lock,
  AlertCircle,
} from 'lucide-react';
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
} from '../../hooks/use-circle-tools';
import { CalendarEventEntity, EventRsvpStatus } from '@circle/types';

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

  // Form states
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

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

  const now = new Date();
  const nowIsoLocal = formatToLocalDateTimeInput(now, now.getHours(), now.getMinutes());
  const [reminderMinutes, setReminderMinutes] = useState('15');

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data: events = [], isLoading } = useCalendarEventsQuery(circleId, month, year);
  const createMutation = useCreateCalendarEventMutation(circleId);
  const updateMutation = useUpdateCalendarEventMutation(circleId);
  const cancelMutation = useCancelCalendarEventMutation(circleId);
  const deleteMutation = useDeleteCalendarEventMutation(circleId);
  const rsvpMutation = useRespondEventRsvpMutation(circleId);

  const [editingEvent, setEditingEvent] = useState<CalendarEventEntity | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setSubmitError(null);
    setTitle('');
    setLocation('');
    setDescription('');
    setReminderMinutes('15');

    const curNow = new Date();
    const isToday =
      selectedDate.getFullYear() === curNow.getFullYear() &&
      selectedDate.getMonth() === curNow.getMonth() &&
      selectedDate.getDate() === curNow.getDate();

    const isPastDay =
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime() <
      new Date(curNow.getFullYear(), curNow.getMonth(), curNow.getDate()).getTime();

    // Mặc định giờ bắt đầu là 00:00 ngày đó, kết thúc là 23:59 ngày đó
    setStartTime(formatToLocalDateTimeInput(selectedDate, 0, 0));
    setEndTime(formatToLocalDateTimeInput(selectedDate, 23, 59));
    setIsAddModalOpen(true);
  };

  const getFormValidationError = (): string | null => {
    if (!title.trim()) return 'Vui lòng nhập tên sự kiện';
    if (!startTime) return 'Vui lòng chọn thời gian bắt đầu';

    const start = new Date(startTime);
    if (isNaN(start.getTime())) return 'Thời gian bắt đầu không hợp lệ';

    if (endTime) {
      const end = new Date(endTime);
      if (isNaN(end.getTime())) return 'Thời gian kết thúc không hợp lệ';
      if (end.getTime() <= start.getTime()) {
        return 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu';
      }
    }

    return null;
  };

  const handleOpenEditModal = (ev: CalendarEventEntity) => {
    setEditingEvent(ev);
    setSubmitError(null);
    setTitle(ev.eventTitle);
    setLocation(ev.location || '');
    setDescription(ev.description || '');

    if (ev.startTime) {
      const s = new Date(ev.startTime);
      setStartTime(formatToLocalDateTimeInput(s, s.getHours(), s.getMinutes()));
    } else {
      setStartTime('');
    }

    if (ev.endTime) {
      const e = new Date(ev.endTime);
      setEndTime(formatToLocalDateTimeInput(e, e.getHours(), e.getMinutes()));
    } else {
      setEndTime('');
    }

    if (ev.reminderTime && ev.startTime) {
      const diffMins = Math.round(
        (new Date(ev.startTime).getTime() - new Date(ev.reminderTime).getTime()) / 60000
      );
      if ([15, 30, 60, 1440].includes(diffMins)) {
        setReminderMinutes(String(diffMins));
      } else {
        setReminderMinutes('none');
      }
    } else {
      setReminderMinutes('none');
    }

    setIsAddModalOpen(true);
  };

  // Calendar math
  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  const firstDayOfWeek = useMemo(() => {
    // 0 = Sunday, 1 = Monday, ...
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validationErr = getFormValidationError();
    if (validationErr) {
      setSubmitError(validationErr);
      return;
    }

    const start = new Date(startTime);
    let end: string | undefined = undefined;
    if (endTime) {
      end = new Date(endTime).toISOString();
    }

    let reminder: string | undefined = undefined;
    if (reminderMinutes && reminderMinutes !== 'none') {
      const mins = parseInt(reminderMinutes, 10);
      reminder = new Date(start.getTime() - mins * 60 * 1000).toISOString();
    }

    if (editingEvent) {
      await updateMutation.mutateAsync({
        eventId: editingEvent.id,
        input: {
          eventTitle: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          startTime: start.toISOString(),
          endTime: end,
          reminderTime: reminder,
        },
      });
    } else {
      await createMutation.mutateAsync({
        eventTitle: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startTime: start.toISOString(),
        endTime: end,
        reminderTime: reminder,
      });
      setActiveCircleView('chat');
    }

    setEditingEvent(null);
    setTitle('');
    setLocation('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setIsAddModalOpen(false);
  };

  const handleCancelEvent = async (eventId: string) => {
    if (confirm('Bạn có chắc chắn muốn HỦY lịch hẹn này? Sự kiện sẽ được đánh dấu [ĐÃ HỦY] và giữ lại trên lịch để cả nhóm theo dõi.')) {
      try {
        await cancelMutation.mutateAsync(eventId);
      } catch (err: any) {
        alert(err?.message || 'Có lỗi xảy ra khi hủy lịch hẹn');
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Bạn có chắc chắn muốn XÓA VĨNH VIỄN sự kiện này khỏi lịch? Sự kiện sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu.')) {
      try {
        await deleteMutation.mutateAsync(eventId);
      } catch (err: any) {
        alert(err?.message || 'Có lỗi xảy ra khi xóa sự kiện');
      }
    }
  };

  // Group events by day of current month (supporting multi-day events)
  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEventEntity[]>();
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const targetTime = new Date(year, month - 1, d).getTime();
      for (const ev of events) {
        const start = new Date(ev.startTime);
        const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
        const end = ev.endTime ? new Date(ev.endTime) : start;
        const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

        if (targetTime >= startTime && targetTime <= endTime) {
          if (!map.has(d)) map.set(d, []);
          map.get(d)!.push(ev);
        }
      }
    }
    return map;
  }, [events, month, year]);


  // Automatically sync calendar date and month when navigating from chat/rail
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

  // Scroll to targeted event card if present
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
              className="p-1.5 hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
              Tháng {month}, {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 rounded-lg bg-circle-charcoal dark:bg-circle-primary px-3.5 py-1.5 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all shadow-sm active:scale-98"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tạo sự kiện</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-circle-slate dark:text-circle-dark-muted" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid (2 cols on large screen) */}
          <div className="lg:col-span-2 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas p-4 shadow-2xs">
            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-circle-slate dark:text-circle-dark-muted pb-2 border-b border-circle-hairline dark:border-circle-dark-hairline">
              <span>CN</span>
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
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => {
                      setSelectedDate(new Date(year, month - 1, dayNum));
                      setTargetCalendarEvent(null, null);
                    }}
                    className={`aspect-square rounded-xl p-1.5 flex flex-col items-center justify-between transition-all border ${
                      isSelected
                        ? 'border-circle-sage bg-circle-sage/10 text-circle-sage dark:border-circle-primary dark:bg-circle-primary/10 dark:text-circle-primary font-bold shadow-2xs'
                        : isCurrentToday
                          ? 'border-circle-charcoal/30 bg-circle-wash dark:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text font-bold'
                          : 'border-transparent hover:bg-circle-wash/60 dark:hover:bg-circle-dark-wash/60 text-circle-charcoal dark:text-circle-dark-text'
                    }`}
                  >
                    <span className="text-xs">{dayNum}</span>
                    <div className="flex gap-0.5">
                      {dayEvents.slice(0, 3).map((_, eIdx) => (
                        <span
                          key={eIdx}
                          className="h-1.5 w-1.5 rounded-full bg-circle-sage dark:bg-circle-primary"
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Events Details (1 col) */}
          <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas p-4 shadow-2xs flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline mb-3">
              <h3 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text uppercase tracking-wider">
                Sự kiện ngày {selectedDate.toLocaleDateString('vi-VN')}
              </h3>
              <span className="text-[11px] text-circle-slate dark:text-circle-dark-muted font-medium">
                {selectedDayEvents.length} sự kiện
              </span>
            </div>

            {selectedDayEvents.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {selectedDayEvents.map((ev) => {
                    const yesRsvps = ev.rsvps?.filter((r) => r.status === 'YES') || [];
                    const maybeRsvps = ev.rsvps?.filter((r) => r.status === 'MAYBE') || [];
                    const noRsvps = ev.rsvps?.filter((r) => r.status === 'NO') || [];
                    const myRsvp = ev.rsvps?.find((r) => r.userId === user?.id)?.status;
                    const isStarted = new Date(ev.startTime) <= new Date();

                    const handleRsvp = async (status: EventRsvpStatus) => {
                      try {
                        await rsvpMutation.mutateAsync({ eventId: ev.id, status });
                      } catch (err) {
                        console.error('Failed to RSVP:', err);
                      }
                    };

                    const isTargeted = targetCalendarEventId === ev.id;
                    return (
                      <div
                        key={ev.id}
                        id={`calendar-event-${ev.id}`}
                        className={`rounded-xl border p-3 shadow-2xs space-y-2.5 transition-all ${
                          isTargeted
                            ? 'border-circle-sage dark:border-circle-primary bg-circle-sage/10 dark:bg-circle-primary/10 ring-2 ring-circle-sage dark:ring-circle-primary'
                            : 'border-circle-hairline/80 dark:border-circle-dark-hairline/80 bg-circle-wash/40 dark:bg-circle-dark-wash/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <h4 className={`text-xs font-bold ${
                              ev.isCancelled
                                ? 'line-through text-circle-slate/70 dark:text-circle-dark-muted/70'
                                : 'text-circle-charcoal dark:text-circle-dark-text'
                            }`}>
                              {ev.eventTitle}
                            </h4>
                            {ev.isCancelled && (
                              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                Đã hủy
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {!ev.isCancelled && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(ev)}
                                  className="p-1 text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors"
                                  title="Chỉnh sửa sự kiện"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelEvent(ev.id)}
                                  className="p-1 text-amber-600 hover:text-amber-700 dark:text-amber-400 transition-colors"
                                  title="Hủy lịch hẹn (Giữ lại trên lịch)"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="p-1 text-circle-slate hover:text-rose-500 transition-colors"
                              title="Xóa vĩnh viễn sự kiện"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-[11px] text-circle-slate dark:text-circle-dark-muted">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-circle-sage dark:text-circle-primary" />
                            <span>
                              {new Date(ev.startTime).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {ev.endTime &&
                                ` - ${new Date(ev.endTime).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}`}
                            </span>
                          </div>

                          {ev.location && (
                            <EventLocationDisplay
                              location={ev.location}
                              className="text-[11px]"
                              iconClassName="h-3 w-3 shrink-0"
                            />
                          )}

                        </div>

                        {ev.description && ev.description.trim().toLowerCase() !== 'body' && (
                          <div className="text-[11px] text-circle-slate dark:text-circle-dark-muted pt-2 border-t border-circle-hairline/50 dark:border-circle-dark-hairline/50">
                            <span className="font-semibold text-circle-charcoal dark:text-circle-dark-text block mb-0.5">Ghi chú:</span>
                            {ev.description}
                          </div>
                        )}

                        {ev.reminderTime && (
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[11px] pt-1">
                            <Bell className="h-3 w-3" />
                            <span>
                              Nhắc trước lúc{' '}
                              {new Date(ev.reminderTime).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}

                        <div className="text-[10px] text-circle-slate/80 dark:text-circle-dark-muted/80">
                          Tạo bởi {ev.creator?.user?.profile?.displayName || 'Thành viên'}
                        </div>

                        {/* RSVP Section (COL-09 - Poll Style) */}
                        <div className="pt-2.5 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold flex items-center gap-1">
                              {ev.isCancelled ? (
                                <>
                                  <Lock className="h-3 w-3 text-rose-500" />
                                  <span className="text-rose-600 dark:text-rose-400">Lịch hẹn đã bị hủy</span>
                                </>
                              ) : isStarted ? (
                                <>
                                  <Lock className="h-3 w-3 text-circle-slate dark:text-circle-dark-muted" />
                                  <span className="text-circle-slate dark:text-circle-dark-muted">Bình chọn đã đóng</span>
                                </>
                              ) : (
                                <>
                                  <Users className="h-3 w-3 text-circle-sage dark:text-circle-primary" />
                                  <span className="text-circle-charcoal dark:text-circle-dark-text">Khảo sát tham gia</span>
                                </>
                              )}
                            </span>
                            <span className="text-[10px] text-circle-slate dark:text-circle-dark-muted font-medium">
                              {yesRsvps.length + maybeRsvps.length + noRsvps.length} phản hồi
                            </span>
                          </div>

                          {/* Poll Options */}
                          <div className="space-y-1.5">
                            {[
                              {
                                status: EventRsvpStatus.YES,
                                label: 'Tham gia',
                                icon: Check,
                                count: yesRsvps.length,
                                percent: (yesRsvps.length + maybeRsvps.length + noRsvps.length) > 0 ? Math.round((yesRsvps.length / (yesRsvps.length + maybeRsvps.length + noRsvps.length)) * 100) : 0,
                                rsvps: yesRsvps,
                                barColor: 'bg-emerald-500/15 dark:bg-emerald-500/20',
                                activeBarColor: 'bg-emerald-500/25 dark:bg-emerald-500/35',
                                activeBorder: 'border-emerald-500/70 dark:border-emerald-400/80 ring-1 ring-emerald-500/30',
                                iconColor: 'text-emerald-600 dark:text-emerald-400',
                              },
                              {
                                status: EventRsvpStatus.MAYBE,
                                label: 'Chưa chắc',
                                icon: HelpCircle,
                                count: maybeRsvps.length,
                                percent: (yesRsvps.length + maybeRsvps.length + noRsvps.length) > 0 ? Math.round((maybeRsvps.length / (yesRsvps.length + maybeRsvps.length + noRsvps.length)) * 100) : 0,
                                rsvps: maybeRsvps,
                                barColor: 'bg-amber-500/15 dark:bg-amber-500/20',
                                activeBarColor: 'bg-amber-500/25 dark:bg-amber-500/35',
                                activeBorder: 'border-amber-500/70 dark:border-amber-400/80 ring-1 ring-amber-500/30',
                                iconColor: 'text-amber-600 dark:text-amber-400',
                              },
                              {
                                status: EventRsvpStatus.NO,
                                label: 'Bận',
                                icon: X,
                                count: noRsvps.length,
                                percent: (yesRsvps.length + maybeRsvps.length + noRsvps.length) > 0 ? Math.round((noRsvps.length / (yesRsvps.length + maybeRsvps.length + noRsvps.length)) * 100) : 0,
                                rsvps: noRsvps,
                                barColor: 'bg-rose-500/15 dark:bg-rose-500/20',
                                activeBarColor: 'bg-rose-500/25 dark:bg-rose-500/35',
                                activeBorder: 'border-rose-500/70 dark:border-rose-400/80 ring-1 ring-rose-500/30',
                                iconColor: 'text-rose-600 dark:text-rose-400',
                              },
                            ].map((opt) => {
                              const isSelected = myRsvp === opt.status;
                              return (
                                <div key={opt.status} className="space-y-1">
                                  <button
                                    type="button"
                                    disabled={isStarted || Boolean(ev.isCancelled) || rsvpMutation.isPending}
                                    onClick={() => handleRsvp(opt.status)}
                                    className={`relative w-full overflow-hidden rounded-xl border p-2 text-left transition-all ${
                                      isStarted || Boolean(ev.isCancelled)
                                        ? 'cursor-not-allowed opacity-75'
                                        : 'hover:border-circle-primary/50 active:scale-[0.99]'
                                    } ${
                                      isSelected
                                        ? `${opt.activeBorder} bg-circle-canvas/90 dark:bg-circle-dark-canvas/90 font-bold shadow-2xs`
                                        : 'border-circle-hairline/80 dark:border-circle-dark-hairline/80 bg-white/90 dark:bg-circle-dark-surface/90'
                                    }`}
                                  >
                                    {/* Progress fill */}
                                    <div
                                      className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
                                        isSelected ? opt.activeBarColor : opt.barColor
                                      }`}
                                      style={{ width: `${opt.percent}%` }}
                                    />

                                    {/* Labels */}
                                    <div className="relative z-10 flex items-center justify-between text-[11px]">
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-all ${
                                            isSelected
                                              ? 'border-circle-primary bg-circle-primary text-circle-charcoal'
                                              : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface'
                                          }`}
                                        >
                                          {isSelected && <Check className="h-2 w-2 stroke-[3]" />}
                                        </span>
                                        <opt.icon className={`h-3 w-3 ${opt.iconColor}`} />
                                        <span className="font-semibold text-circle-charcoal dark:text-circle-dark-text">
                                          {opt.label}
                                        </span>
                                      </div>

                                      {/* Circular avatars of respondents replacing percent & count */}
                                      <div className="flex items-center -space-x-1.5 shrink-0 pl-2">
                                        {opt.rsvps.slice(0, 5).map((r, idx) => {
                                          const name = r.user?.profile?.displayName || r.user?.email?.split('@')[0] || 'Thành viên';
                                          const avatarUrl = r.user?.profile?.avatarUrl;
                                          const isMe = r.userId === user?.id;
                                          const displayName = isMe ? 'Bạn' : name;
                                          return (
                                            <div
                                              key={r.id || r.userId || idx}
                                              title={displayName}
                                              className="relative inline-flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white dark:ring-circle-dark-surface bg-circle-wash dark:bg-circle-dark-wash overflow-hidden shrink-0 shadow-xs"
                                            >
                                              {avatarUrl ? (
                                                <img
                                                  src={avatarUrl}
                                                  alt={displayName}
                                                  className="h-full w-full rounded-full object-cover"
                                                />
                                              ) : (
                                                <span className="flex h-full w-full items-center justify-center rounded-full bg-circle-primary text-circle-charcoal text-[8px] font-bold">
                                                  {displayName.charAt(0).toUpperCase()}
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })}
                                        {opt.rsvps.length > 5 && (
                                          <span
                                            title={opt.rsvps.slice(5).map((r) => r.user?.profile?.displayName || 'Thành viên').join(', ')}
                                            className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-circle-charcoal/80 dark:bg-circle-slate text-white text-[8px] font-bold ring-2 ring-white dark:ring-circle-dark-surface shrink-0"
                                          >
                                            +{opt.rsvps.length - 5}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <CalendarDays className="h-10 w-10 text-circle-slate dark:text-circle-dark-muted opacity-40 mb-2" />
                <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
                  Không có sự kiện nào trong ngày này
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="mt-3 text-xs font-semibold text-circle-sage dark:text-circle-primary hover:underline"
                >
                  + Lên lịch hẹn mới
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline mb-4">
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                {editingEvent ? 'Chỉnh Sửa Lịch Hẹn' : 'Lên Lịch Hẹn & Sự Kiện Nhóm'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
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
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage"
                />
              </div>

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

              <div className="grid grid-cols-2 gap-3">
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
                    Kết thúc (tùy chọn)
                  </label>
                  <CustomDateTimePicker
                    value={endTime}
                    onChange={setEndTime}
                    min={startTime || (!editingEvent ? nowIsoLocal : undefined)}
                    placeholder="dd/mm/yyyy --:--"
                    align="right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                  Nhắc nhở trước
                </label>
                <select
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(e.target.value)}
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage"
                >
                  <option value="none">Không nhắc</option>
                  <option value="15">Trước 15 phút</option>
                  <option value="30">Trước 30 phút</option>
                  <option value="60">Trước 1 giờ</option>
                  <option value="1440">Trước 1 ngày</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                  Ghi chú nội dung
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Chi tiết công việc hoặc chuẩn bị..."
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage"
                />
              </div>

              

              {submitError && (
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg px-3.5 py-2 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editingEvent ? updateMutation.isPending : createMutation.isPending}
                  className="rounded-lg bg-circle-charcoal dark:bg-circle-primary px-4 py-2 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingEvent
                    ? (updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi')
                    : (createMutation.isPending ? 'Đang tạo...' : 'Lên lịch ngay')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
