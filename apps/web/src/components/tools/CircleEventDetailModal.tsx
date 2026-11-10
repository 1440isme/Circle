'use client';

import React, { useState } from 'react';
import {
  X,
  Clock,
  MapPin,
  Repeat,
  Bell,
  Info,
  Pencil,
  Trash2,
  Ban,
  RotateCcw,
  Share2,
  Users,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Check,
  Video,
  AlignLeft,
  Loader2,
} from 'lucide-react';
import { CalendarEventEntity, EventRsvpStatus } from '@circle/types';
import {
  parseEventRecurrence,
  formatRecurrenceSummary,
  formatDateOnly,
  isEventCancelledOnDate,
  getNextOrPrevOccurrence,
} from './calendar-recurrence';
import { useAuth } from '../../context/AuthContext';
import {
  useRespondEventRsvpMutation,
  useUpdateCalendarEventMutation,
} from '../../hooks/use-circle-tools';
import { parseEventLocation } from './EventLocationDisplay';

interface CircleEventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEventEntity | null;
  occurrenceDate: Date | null;
  circleId: string;
  onEdit: (ev: CalendarEventEntity, occDate: Date) => void;
  onDelete: (ev: CalendarEventEntity, occDate: Date) => void;
  onCancel: (ev: CalendarEventEntity, occDate: Date) => void;
  onRestore: (ev: CalendarEventEntity, occDate: Date) => void;
  onShareToChat?: (eventId: string) => void;
}

export const CircleEventDetailModal: React.FC<CircleEventDetailModalProps> = ({
  isOpen,
  onClose,
  event,
  occurrenceDate,
  circleId,
  onEdit,
  onDelete,
  onCancel,
  onRestore,
  onShareToChat,
}) => {
  const { user } = useAuth();
  const [currentOccDate, setCurrentOccDate] = useState<Date>(() => occurrenceDate || new Date());
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const rsvpMutation = useRespondEventRsvpMutation(circleId);

  // Sync occurrence date when prop changes
  React.useEffect(() => {
    if (occurrenceDate) {
      setCurrentOccDate(new Date(occurrenceDate));
    } else if (event) {
      setCurrentOccDate(new Date(event.startTime));
    }
  }, [occurrenceDate, event]);

  if (!isOpen || !event) return null;

  const { cleanDesc, recurrenceConfig } = parseEventRecurrence(event.description);
  const isThisOccurrenceCancelled = isEventCancelledOnDate(event, currentOccDate);
  const isRecurring = Boolean(recurrenceConfig && recurrenceConfig.frequency !== 'none');

  // Time calculations
  const evStart = new Date(event.startTime);
  const evEnd = event.endTime ? new Date(event.endTime) : null;

  const occStartDate = new Date(currentOccDate);
  occStartDate.setHours(evStart.getHours(), evStart.getMinutes(), 0, 0);

  const diffMs = evEnd ? evEnd.getTime() - evStart.getTime() : 3600000;
  const occEndDate = new Date(occStartDate.getTime() + Math.max(0, diffMs));

  const isSameDay =
    occStartDate.getFullYear() === occEndDate.getFullYear() &&
    occStartDate.getMonth() === occEndDate.getMonth() &&
    occStartDate.getDate() === occEndDate.getDate();

  // Reminder label
  const reminderLabel = (() => {
    if (!event.reminderTime) return 'Không nhắc';
    const diffMins = Math.round((evStart.getTime() - new Date(event.reminderTime).getTime()) / 60000);
    if (diffMins <= 0) return 'Khi sự kiện diễn ra';
    if (diffMins === 5) return 'Trước 5 phút';
    if (diffMins === 15) return 'Trước 15 phút';
    if (diffMins === 30) return 'Trước 30 phút';
    if (diffMins === 60) return 'Trước 1 giờ';
    if (diffMins === 120) return 'Trước 2 giờ';
    if (diffMins === 1440) return 'Trước 1 ngày';
    if (diffMins === 2880) return 'Trước 2 ngày';
    return `Trước ${diffMins} phút`;
  })();

  const updateMutation = useUpdateCalendarEventMutation(circleId);

  // Calculated diff minutes for quick select
  const calculatedDiffMins = (() => {
    if (!event.reminderTime) return 'none';
    const mins = Math.round((evStart.getTime() - new Date(event.reminderTime).getTime()) / 60000);
    if (mins <= 0) return '0';
    const standardOptions = [0, 5, 15, 30, 60, 120, 1440, 2880];
    const found = standardOptions.find((m) => Math.abs(m - mins) <= 1);
    return found !== undefined ? String(found) : String(mins);
  })();

  const [currentReminderValue, setCurrentReminderValue] = useState<string>(calculatedDiffMins);
  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);

  React.useEffect(() => {
    setCurrentReminderValue(calculatedDiffMins);
  }, [calculatedDiffMins]);

  const handleReminderChange = async (newVal: string) => {
    if (isThisOccurrenceCancelled || isUpdatingReminder) return;
    setCurrentReminderValue(newVal);
    setIsUpdatingReminder(true);
    try {
      let newReminderIso: string | null = null;
      if (newVal !== 'none') {
        const mins = parseInt(newVal, 10);
        const s = new Date(event.startTime);
        s.setMinutes(s.getMinutes() - mins);
        newReminderIso = s.toISOString();
      }
      await updateMutation.mutateAsync({
        eventId: event.id,
        input: {
          reminderTime: newReminderIso,
        },
      });
    } catch (err: any) {
      console.warn('Failed to update reminder:', err);
      setCurrentReminderValue(calculatedDiffMins);
    } finally {
      setIsUpdatingReminder(false);
    }
  };

  // Location parsing
  const parsedLocation = event.location ? parseEventLocation(event.location) : null;

  // RSVP statistics
  const rsvps = event.rsvps || [];
  const myRsvp = rsvps.find((r) => r.userId === user?.id)?.status;
  const yesRsvps = rsvps.filter((r) => r.status === EventRsvpStatus.YES);
  const maybeRsvps = rsvps.filter((r) => r.status === EventRsvpStatus.MAYBE);
  const noRsvps = rsvps.filter((r) => r.status === EventRsvpStatus.NO);
  const totalRsvps = rsvps.length;

  const handleVote = (status: EventRsvpStatus) => {
    if (isThisOccurrenceCancelled || rsvpMutation.isPending) return;
    rsvpMutation.mutate({ eventId: event.id, status });
  };

  // Boundary check for occurrences: cannot go prior to initial start date
  const evStartDay = new Date(evStart.getFullYear(), evStart.getMonth(), evStart.getDate());
  const currentOccDay = new Date(currentOccDate.getFullYear(), currentOccDate.getMonth(), currentOccDate.getDate());

  const isPrevDisabled = currentOccDay.getTime() <= evStartDay.getTime();
  const isNextDisabled = Boolean(
    recurrenceConfig?.endType === 'on_date' &&
      recurrenceConfig?.endDate &&
      currentOccDay.getTime() >=
        new Date(
          new Date(recurrenceConfig.endDate).getFullYear(),
          new Date(recurrenceConfig.endDate).getMonth(),
          new Date(recurrenceConfig.endDate).getDate(),
        ).getTime()
  );

  const handleJumpOccurrence = (direction: 'next' | 'prev') => {
    if (!isRecurring) return;
    if (direction === 'prev' && isPrevDisabled) return;
    if (direction === 'next' && isNextDisabled) return;

    const target = getNextOrPrevOccurrence(currentOccDate, recurrenceConfig, direction);
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());

    if (direction === 'prev' && targetDay.getTime() < evStartDay.getTime()) {
      return;
    }
    if (
      direction === 'next' &&
      recurrenceConfig?.endType === 'on_date' &&
      recurrenceConfig?.endDate
    ) {
      const endDay = new Date(
        new Date(recurrenceConfig.endDate).getFullYear(),
        new Date(recurrenceConfig.endDate).getMonth(),
        new Date(recurrenceConfig.endDate).getDate(),
      );
      if (targetDay.getTime() > endDay.getTime()) {
        return;
      }
    }

    setCurrentOccDate(target);
  };

  const handleShareClick = () => {
    if (onShareToChat) {
      onShareToChat(event.id);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className="space-y-6 w-full pb-16 animate-in fade-in duration-200">
      {/* Floating Pill Buttons Bar (No static heading, pure floating controls with scroll-under content) */}
      <div className="sticky top-0 z-30 pointer-events-none flex items-center justify-between gap-3 py-1 -mt-1 mb-2">
        {/* Left: Nút 1 Quay lại dạng ngày tháng năm - Floating Pill Button */}
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
          title="Quay lại Lịch"
        >
          <ChevronLeft className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>
            {currentOccDate.toLocaleDateString('vi-VN', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
        </button>

        {/* Right: Cụm Floating Pill Buttons (Share, Sửa, Hủy/Khôi phục, Xóa) */}
        <div className="pointer-events-auto flex items-center gap-2 shrink-0">
          {onShareToChat && (
            <button
              type="button"
              onClick={handleShareClick}
              title="Chia sẻ vào tin nhắn nhóm"
              className="flex items-center justify-center h-9 w-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted hover:text-teal-600 transition-all active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          {!isThisOccurrenceCancelled && (
            <button
              type="button"
              onClick={() => onEdit(event, currentOccDate)}
              title="Chỉnh sửa lịch hẹn"
              className="flex items-center justify-center h-9 w-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted hover:text-teal-600 transition-all active:scale-95 cursor-pointer"
            >
              <Pencil className="w-4 h-4 text-circle-slate dark:text-circle-dark-muted" />
            </button>
          )}

          {isThisOccurrenceCancelled ? (
            <button
              type="button"
              onClick={() => onRestore(event, currentOccDate)}
              title="Khôi phục lịch hẹn"
              className="flex items-center justify-center h-9 w-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted hover:text-emerald-600 transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onCancel(event, currentOccDate)}
              title="Hủy lịch hẹn lần này"
              className="flex items-center justify-center h-9 w-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted hover:text-amber-600 transition-all active:scale-95 cursor-pointer"
            >
              <Ban className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onDelete(event, currentOccDate)}
            title="Xóa lịch hẹn"
            className="flex items-center justify-center h-9 w-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-rose-50 dark:hover:bg-rose-950/40 text-circle-slate hover:text-rose-600 transition-all active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Share Feedback Toast */}
      {copiedShare && (
        <div className="p-2.5 rounded-xl bg-teal-600 text-white text-xs text-center font-bold animate-in fade-in shadow-xs">
          Đã chia sẻ lịch hẹn vào tin nhắn nhóm thành công!
        </div>
      )}

      {/* Chi tiết sự kiện (Bỏ khung thẻ, giao diện trực tiếp mượt mà như app) */}
      <div className="space-y-6 pt-1">
        {/* Tiêu đề & Trạng thái */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2
              className={`text-xl sm:text-2xl font-bold tracking-tight text-circle-charcoal dark:text-circle-dark-text leading-snug ${
                isThisOccurrenceCancelled ? 'line-through opacity-70 text-rose-700 dark:text-rose-400' : ''
              }`}
            >
              {event.eventTitle}
            </h2>
            {isThisOccurrenceCancelled && (
              <span className="shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                Đã hủy
              </span>
            )}
          </div>

          {isThisOccurrenceCancelled && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
                <Ban className="h-4 w-4 shrink-0" />
                <span>Lịch hẹn này đã bị hủy trên lịch nhóm.</span>
              </div>
              <button
                type="button"
                onClick={() => onRestore(event, currentOccDate)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
              >
                Khôi phục
              </button>
            </div>
          )}
        </div>

        {/* 1. Hàng Thời gian (Icon Clock - màu xanh teal) */}
        <div className="flex items-start gap-4 pt-4 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
          <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0 mt-0.5">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
              {isSameDay
                ? `${String(occStartDate.getHours()).padStart(2, '0')}:${String(occStartDate.getMinutes()).padStart(2, '0')} - ${String(occEndDate.getHours()).padStart(2, '0')}:${String(occEndDate.getMinutes()).padStart(2, '0')}`
                : `Từ ${String(occStartDate.getHours()).padStart(2, '0')}:${String(occStartDate.getMinutes()).padStart(2, '0')} ngày ${formatDateOnly(occStartDate)} - ${String(occEndDate.getHours()).padStart(2, '0')}:${String(occEndDate.getMinutes()).padStart(2, '0')} ngày ${formatDateOnly(occEndDate)}`}
            </div>
            {isSameDay && (
              <div className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1">
                {occStartDate.toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            )}
          </div>
        </div>

        {/* 2. Hàng Địa điểm (Icon MapPin / Video - đồng bộ màu xanh teal) */}
        {parsedLocation && parsedLocation.text && (
          <div className="flex items-start gap-4 pt-4 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
            <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0 mt-0.5">
              {parsedLocation.category === 'meet' ? (
                <Video className="h-5 w-5" />
              ) : (
                <MapPin className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <a
                href={
                  parsedLocation.url ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parsedLocation.text)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 text-sm font-bold text-circle-charcoal dark:text-circle-dark-text hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                title={parsedLocation.url ? 'Mở liên kết cuộc họp' : 'Xem địa chỉ trên Google Maps'}
              >
                <span className="truncate group-hover:underline">{parsedLocation.text}</span>
                <ExternalLink className="h-4 w-4 shrink-0 text-circle-slate group-hover:text-teal-600 transition-colors" />
              </a>
              <div className="text-xs text-teal-600 dark:text-teal-400 font-medium mt-0.5">
                {parsedLocation.category === 'meet'
                  ? (parsedLocation.linkText || 'Mở liên kết họp online')
                  : 'Mở trên Google Maps'}
              </div>
            </div>
          </div>
        )}

        {/* 3. Hàng Lặp lại (Icon Repeat - màu xanh teal) */}
        {isRecurring && recurrenceConfig && (
          <div className="flex items-start gap-4 pt-4 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
            <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0 mt-0.5">
              <Repeat className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {formatRecurrenceSummary(recurrenceConfig, false)}
                </div>
                {recurrenceConfig.endType === 'on_date' && recurrenceConfig.endDate && (
                  <div className="text-xs text-circle-slate dark:text-circle-dark-muted mt-0.5">
                    Kết thúc vào {formatDateOnly(new Date(recurrenceConfig.endDate))}
                  </div>
                )}
              </div>

              {/* Prev / Next occurrence stepper */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={isPrevDisabled}
                  onClick={() => handleJumpOccurrence('prev')}
                  title={isPrevDisabled ? 'Đã là lần diễn ra đầu tiên' : 'Xem lần diễn ra trước'}
                  className={`p-1.5 rounded-full border transition-all ${
                    isPrevDisabled
                      ? 'opacity-25 cursor-not-allowed border-circle-hairline text-circle-slate'
                      : 'border-circle-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash text-circle-slate hover:text-circle-charcoal cursor-pointer'
                  }`}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={isNextDisabled}
                  onClick={() => handleJumpOccurrence('next')}
                  title={isNextDisabled ? 'Đã là lần diễn ra cuối cùng' : 'Xem lần diễn ra tiếp theo'}
                  className={`p-1.5 rounded-full border transition-all ${
                    isNextDisabled
                      ? 'opacity-25 cursor-not-allowed border-circle-hairline text-circle-slate'
                      : 'border-circle-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash text-circle-slate hover:text-circle-charcoal cursor-pointer'
                  }`}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Hàng Người tham gia & Bình chọn (Gộp lên trên, hiển thị số người tham gia + avatar, sau đó mới cho bình chọn) */}
        <div className="flex items-start gap-4 pt-4 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
          <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0 mt-0.5">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            {/* Attendees stats & avatars */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                  Người tham gia ({totalRsvps})
                </span>
                <span className="text-xs text-circle-slate dark:text-circle-dark-muted ml-2 font-medium">
                  • {yesRsvps.length} tham gia
                </span>
              </div>
              {totalRsvps > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAttendeesModal(true)}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
                >
                  Xem danh sách
                </button>
              )}
            </div>

            {/* Avatar stack preview */}
            {totalRsvps > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {rsvps.slice(0, 10).map((r, i) => {
                  const isMe = r.userId === user?.id;
                  const dName = isMe ? 'Bạn' : r.user?.profile?.displayName || 'TV';
                  const avUrl = r.user?.profile?.avatarUrl;

                  return (
                    <div
                      key={r.id || r.userId || i}
                      title={`${dName} (${r.status === EventRsvpStatus.YES ? 'Tham gia' : r.status === EventRsvpStatus.MAYBE ? 'Chưa chắc' : 'Bận'})`}
                      className="h-7 w-7 rounded-full border-2 border-white dark:border-circle-dark-surface overflow-hidden bg-circle-wash flex items-center justify-center text-[11px] font-bold text-circle-charcoal shrink-0 shadow-2xs"
                    >
                      {avUrl ? (
                        <img src={avUrl} alt={dName} className="h-full w-full object-cover" />
                      ) : (
                        <span>{dName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  );
                })}
                {rsvps.length > 10 && (
                  <span className="text-xs font-bold text-circle-slate ml-1">
                    +{rsvps.length - 10}
                  </span>
                )}
              </div>
            )}

            {/* Interactive Vote Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {[
                {
                  status: EventRsvpStatus.YES,
                  label: 'Tham gia',
                  count: yesRsvps.length,
                  activeBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-600',
                },
                {
                  status: EventRsvpStatus.MAYBE,
                  label: 'Chưa chắc',
                  count: maybeRsvps.length,
                  activeBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-600',
                },
                {
                  status: EventRsvpStatus.NO,
                  label: 'Bận',
                  count: noRsvps.length,
                  activeBg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-600',
                },
              ].map((opt) => {
                const isSelected = myRsvp === opt.status;
                const percent = totalRsvps > 0 ? Math.round((opt.count / totalRsvps) * 100) : 0;

                return (
                  <button
                    key={opt.status}
                    type="button"
                    disabled={isThisOccurrenceCancelled || rsvpMutation.isPending}
                    onClick={() => handleVote(opt.status)}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? `${opt.activeBg} ring-2 ring-teal-500/20 font-bold shadow-2xs`
                        : 'border-circle-hairline bg-circle-canvas/50 dark:bg-circle-dark-canvas hover:bg-circle-wash text-circle-charcoal dark:text-circle-dark-text font-medium'
                    } disabled:opacity-50 active:scale-98`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[11px] opacity-75 mt-0.5">
                      {opt.count} ({percent}%)
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. Hàng Nhắc nhở (Icon Bell - đồng bộ màu xanh teal, cho chỉnh nhanh luôn) */}
        <div className="flex items-start gap-4 pt-4 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
          <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0 mt-0.5">
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                Nhắc hẹn trước
              </div>
              {isUpdatingReminder && (
                <div className="flex items-center gap-1.5 text-xs text-teal-600 font-medium">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </div>
              )}
            </div>
            <div className="mt-1.5 max-w-xs">
              <select
                value={currentReminderValue}
                disabled={isThisOccurrenceCancelled || isUpdatingReminder}
                onChange={(e) => handleReminderChange(e.target.value)}
                className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-surface px-3 py-1.5 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage cursor-pointer disabled:opacity-50"
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
        </div>

        {/* 6. Hàng Ghi chú (Icon AlignLeft - đồng bộ màu xanh teal) */}
        <div className="flex items-start gap-4 pt-4 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
          <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0 mt-0.5">
            <AlignLeft className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
              Ghi chú
            </div>
            {cleanDesc ? (
              <div className="text-xs sm:text-sm text-circle-slate dark:text-circle-dark-muted mt-1 whitespace-pre-wrap leading-relaxed">
                {cleanDesc}
              </div>
            ) : (
              <div className="text-xs text-circle-slate/60 dark:text-circle-dark-muted/60 italic mt-0.5">
                Không có ghi chú thêm
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Attendees Full List Dialog */}
      {showAttendeesModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-circle-dark-surface p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline">
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                Danh sách phản hồi ({totalRsvps})
              </h3>
              <button
                type="button"
                onClick={() => setShowAttendeesModal(false)}
                className="p-1.5 rounded-lg hover:bg-circle-wash text-circle-slate cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {rsvps.map((r) => {
                const isMe = r.userId === user?.id;
                const dName = isMe ? 'Bạn' : r.user?.profile?.displayName || 'Thành viên';
                const statusBadge =
                  r.status === EventRsvpStatus.YES
                    ? { label: 'Tham gia', color: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' }
                    : r.status === EventRsvpStatus.MAYBE
                    ? { label: 'Chưa chắc', color: 'bg-amber-500/10 text-amber-600 border border-amber-500/20' }
                    : { label: 'Bận', color: 'bg-rose-500/10 text-rose-600 border border-rose-500/20' };

                return (
                  <div key={r.id || r.userId} className="flex items-center justify-between py-1.5 border-b border-circle-hairline/40 last:border-0">
                    <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                      {dName}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
