'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  Loader2,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import {
  useCalendarEventsQuery,
  useCreateCalendarEventMutation,
  useDeleteCalendarEventMutation,
} from '../../hooks/use-circle-tools';
import { CalendarEventEntity } from '@circle/types';

interface CircleCalendarViewProps {
  circleId: string;
}

export const CircleCalendarView: React.FC<CircleCalendarViewProps> = ({ circleId }) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);

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
  const deleteMutation = useDeleteCalendarEventMutation(circleId);

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

  const handleCreateEvent = async (e: React.FormEvent) => {
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

    await createMutation.mutateAsync({
      eventTitle: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startTime: start.toISOString(),
      endTime: end,
      reminderTime: reminder,
    });

    setTitle('');
    setLocation('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setIsAddModalOpen(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Bạn có chắc chắn muốn hủy sự kiện này?')) {
      await deleteMutation.mutateAsync(eventId);
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
            onClick={() => setIsAddModalOpen(true)}
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
                {selectedDayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-circle-hairline/80 dark:border-circle-dark-hairline/80 bg-circle-wash/40 dark:bg-circle-dark-wash/40 p-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                        {ev.eventTitle}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-1 text-circle-slate hover:text-red-500 transition-colors"
                        title="Hủy sự kiện"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 mt-2 text-[11px] text-circle-slate dark:text-circle-dark-muted">
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
                      <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-2 pt-2 border-t border-circle-hairline/50 dark:border-circle-dark-hairline/50">
                        {ev.description}
                      </p>
                    )}

                    <div className="text-[10px] text-circle-slate/80 dark:text-circle-dark-muted/80 mt-2">
                      Tạo bởi {ev.creator?.user?.profile?.displayName || 'Thành viên'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <CalendarDays className="h-10 w-10 text-circle-slate dark:text-circle-dark-muted opacity-40 mb-2" />
                <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
                  Không có sự kiện nào trong ngày này
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
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
                Lên Lịch Hẹn & Sự Kiện Nhóm
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
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
                  disabled={createMutation.isPending || !title.trim() || !startTime}
                  className="rounded-lg bg-circle-charcoal dark:bg-circle-primary px-4 py-2 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Đang tạo...' : 'Lên lịch ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
