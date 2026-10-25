'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Trash2,
  Pencil,
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleStore } from '../../stores/circle.store';
import {
  useCalendarEventsQuery,
  useCreateCalendarEventMutation,
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

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState('15');

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data: events = [], isLoading } = useCalendarEventsQuery(circleId, month, year);
  const createMutation = useCreateCalendarEventMutation(circleId);
  const updateMutation = useUpdateCalendarEventMutation(circleId);
  const deleteMutation = useDeleteCalendarEventMutation(circleId);
  const rsvpMutation = useRespondEventRsvpMutation(circleId);

  const [editingEvent, setEditingEvent] = useState<CalendarEventEntity | null>(null);

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

  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setTitle('');
    setLocation('');
    setDescription('');
    setReminderMinutes('15');
    setStartTime(formatToLocalDateTimeInput(selectedDate, 0, 0));
    setEndTime('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (ev: CalendarEventEntity) => {
    setEditingEvent(ev);
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
    if (!title.trim() || !startTime) return;

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

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Bạn có chắc chắn muốn hủy sự kiện này? Thao tác này sẽ xóa sự kiện khỏi lịch của nhóm.')) {
      try {
        await deleteMutation.mutateAsync(eventId);
      } catch (err: any) {
        alert(err?.message || 'Có lỗi xảy ra khi hủy sự kiện');
      }
    }
  };

  // Group events by day of current month
  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEventEntity[]>();
    for (const ev of events) {
      const evDate = new Date(ev.startTime);
      if (evDate.getMonth() + 1 === month && evDate.getFullYear() === year) {
        const d = evDate.getDate();
        if (!map.has(d)) map.set(d, []);
        map.get(d)!.push(ev);
      }
    }
    return map;
  }, [events, month, year]);

  const selectedDayEvents = useMemo(() => {
    if (
      selectedDate.getMonth() + 1 !== month ||
      selectedDate.getFullYear() !== year
    ) {
      return [];
    }
    return eventsByDay.get(selectedDate.getDate()) || [];
  }, [eventsByDay, selectedDate, month, year]);

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
                    onClick={() => setSelectedDate(new Date(year, month - 1, dayNum))}
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

                    return (
                      <div
                        key={ev.id}
                        className="rounded-xl border border-circle-hairline/80 dark:border-circle-dark-hairline/80 bg-circle-wash/40 dark:bg-circle-dark-wash/40 p-3 shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                            {ev.eventTitle}
                          </h4>
                                                    <div className="flex items-center gap-1">
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
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="p-1 text-circle-slate hover:text-rose-500 transition-colors"
                              title="Hủy sự kiện"
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
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 text-circle-sage dark:text-circle-primary" />
                              <span className="truncate">{ev.location}</span>
                            </div>
                          )}

                          {ev.reminderTime && (
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
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
                        </div>

                        {ev.description && (
                          <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted pt-2 border-t border-circle-hairline/50 dark:border-circle-dark-hairline/50">
                            {ev.description}
                          </p>
                        )}

                        <div className="text-[10px] text-circle-slate/80 dark:text-circle-dark-muted/80">
                          Tạo bởi {ev.creator?.user?.profile?.displayName || 'Thành viên'}
                        </div>

                        {/* RSVP Section (COL-09) */}
                        <div className="pt-2.5 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-circle-charcoal dark:text-circle-dark-text flex items-center gap-1">
                              <Users className="h-3 w-3 text-circle-sage dark:text-circle-primary" />
                              <span>Phản hồi tham gia</span>
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-circle-slate dark:text-circle-dark-muted font-medium">
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{yesRsvps.length} Tham gia</span>
                              <span>•</span>
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">{maybeRsvps.length} Chưa chắc</span>
                              <span>•</span>
                              <span className="text-rose-500 dark:text-rose-400 font-semibold">{noRsvps.length} Bận</span>
                            </div>
                          </div>

                          {/* 3 Action Buttons */}
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              disabled={isStarted || rsvpMutation.isPending}
                              onClick={() => handleRsvp(EventRsvpStatus.YES)}
                              className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                                isStarted
                                  ? myRsvp === EventRsvpStatus.YES
                                    ? 'bg-emerald-600/80 text-white cursor-not-allowed opacity-90'
                                    : 'bg-circle-canvas/80 text-circle-slate/60 border border-circle-hairline/60 cursor-not-allowed opacity-60'
                                  : myRsvp === EventRsvpStatus.YES
                                  ? 'bg-emerald-600 text-white shadow-2xs active:scale-95'
                                  : 'bg-white dark:bg-circle-dark-surface hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-circle-charcoal dark:text-circle-dark-text border border-circle-hairline/80 dark:border-circle-dark-hairline/80 active:scale-95'
                              }`}
                            >
                              <Check className="h-2.5 w-2.5" />
                              <span>Tham gia</span>
                            </button>

                            <button
                              type="button"
                              disabled={isStarted || rsvpMutation.isPending}
                              onClick={() => handleRsvp(EventRsvpStatus.MAYBE)}
                              className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                                isStarted
                                  ? myRsvp === EventRsvpStatus.MAYBE
                                    ? 'bg-amber-600/80 text-white cursor-not-allowed opacity-90'
                                    : 'bg-circle-canvas/80 text-circle-slate/60 border border-circle-hairline/60 cursor-not-allowed opacity-60'
                                  : myRsvp === EventRsvpStatus.MAYBE
                                  ? 'bg-amber-600 text-white shadow-2xs active:scale-95'
                                  : 'bg-white dark:bg-circle-dark-surface hover:bg-amber-50 dark:hover:bg-amber-950/20 text-circle-charcoal dark:text-circle-dark-text border border-circle-hairline/80 dark:border-circle-dark-hairline/80 active:scale-95'
                              }`}
                            >
                              <HelpCircle className="h-2.5 w-2.5" />
                              <span>Chưa chắc</span>
                            </button>

                            <button
                              type="button"
                              disabled={isStarted || rsvpMutation.isPending}
                              onClick={() => handleRsvp(EventRsvpStatus.NO)}
                              className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                                isStarted
                                  ? myRsvp === EventRsvpStatus.NO
                                    ? 'bg-rose-600/80 text-white cursor-not-allowed opacity-90'
                                    : 'bg-circle-canvas/80 text-circle-slate/60 border border-circle-hairline/60 cursor-not-allowed opacity-60'
                                  : myRsvp === EventRsvpStatus.NO
                                  ? 'bg-rose-600 text-white shadow-2xs active:scale-95'
                                  : 'bg-white dark:bg-circle-dark-surface hover:bg-rose-50 dark:hover:bg-rose-950/20 text-circle-charcoal dark:text-circle-dark-text border border-circle-hairline/80 dark:border-circle-dark-hairline/80 active:scale-95'
                              }`}
                            >
                              <X className="h-2.5 w-2.5" />
                              <span>Bận</span>
                            </button>
                          </div>
                          {isStarted && (
                            <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted italic">
                              Sự kiện đang diễn ra hoặc đã kết thúc, không thể thay đổi phản hồi nữa.
                            </p>
                          )}

                          {/* Attendee Avatars */}
                          {ev.rsvps && ev.rsvps.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {ev.rsvps.slice(0, 6).map((r) => {
                                  const name = r.user?.profile?.displayName || r.user?.email?.split('@')[0] || 'Thành viên';
                                  return (
                                    <div
                                      key={r.id}
                                      title={`${name} (${r.status === 'YES' ? 'Tham gia' : r.status === 'MAYBE' ? 'Chưa chắc' : 'Bận'})`}
                                      className="relative inline-block h-5 w-5 rounded-full ring-1 ring-white dark:ring-circle-dark-surface overflow-hidden bg-circle-primary text-circle-charcoal text-[9px] font-bold flex items-center justify-center shrink-0"
                                    >
                                      {r.user?.profile?.avatarUrl ? (
                                        <img src={r.user.profile.avatarUrl} alt={name} className="h-full w-full object-cover" />
                                      ) : (
                                        <span>{name.charAt(0).toUpperCase()}</span>
                                      )}
                                      <span
                                        className={`absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full ring-1 ring-white dark:ring-circle-dark-surface ${
                                          r.status === 'YES' ? 'bg-emerald-500' : r.status === 'MAYBE' ? 'bg-amber-500' : 'bg-rose-500'
                                        }`}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              {ev.rsvps.length > 6 && (
                                <span className="text-[10px] text-circle-slate dark:text-circle-dark-muted font-medium">
                                  +{ev.rsvps.length - 6}
                                </span>
                              )}
                            </div>
                          )}
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
          <div className="w-full max-w-md rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-5 shadow-2xl">
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
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ví dụ: Thư viện HCMUTE, Quán Cafe..."
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                    Bắt đầu lúc *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-2.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                    Kết thúc (tùy chọn)
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-2.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage"
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
                  disabled={(editingEvent ? updateMutation.isPending : createMutation.isPending) || !title.trim() || !startTime}
                  className="rounded-lg bg-circle-charcoal dark:bg-circle-primary px-4 py-2 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all disabled:opacity-50"
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
