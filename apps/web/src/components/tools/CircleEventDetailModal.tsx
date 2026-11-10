import React, { useState } from 'react';
import {
  X,
  Clock,
  MapPin,
  Calendar as CalendarIcon,
  Bell,
  Users,
  Repeat,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pencil,
  Trash2,
  Share2,
  Ban,
  RotateCcw,
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
  formatDateKey,
  getWeekdayNumber,
  serializeRecurrence,
  RecurrenceConfig,
  isEventCancelledOnDate,
  getNextOrPrevOccurrence,
} from './calendar-recurrence';
import { useAuth } from '../../context/AuthContext';
import {
  useRespondEventRsvpMutation,
  useUpdateCalendarEventMutation,
  useCreateCalendarEventMutation,
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
  const [attendeeTab, setAttendeeTab] = useState<'yes' | 'maybe' | 'no'>('yes');
  const [copiedShare, setCopiedShare] = useState(false);

  // Reminder Scope & Confirmation Modals
  const [showReminderScopeModal, setShowReminderScopeModal] = useState(false);
  const [showReminderConfirmModal, setShowReminderConfirmModal] = useState(false);
  const [pendingReminderValue, setPendingReminderValue] = useState<string | null>(null);

  const rsvpMutation = useRespondEventRsvpMutation(circleId);
  const updateMutation = useUpdateCalendarEventMutation(circleId);
  const createMutation = useCreateCalendarEventMutation(circleId);

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

  // Recurrence summary text: e.g. "Lặp lại hằng tuần vào T4"
  const repeatSummaryText = (() => {
    if (!recurrenceConfig) return '';
    let cfg = recurrenceConfig;
    if (cfg.frequency === 'weekly' && (!cfg.weeklyDays || cfg.weeklyDays.length === 0)) {
      cfg = { ...cfg, weeklyDays: [getWeekdayNumber(evStart)] };
    }
    const raw = formatRecurrenceSummary(cfg, false);
    return raw.toLowerCase().startsWith('lặp lại')
      ? raw
      : `Lặp lại ${raw.charAt(0).toLowerCase() + raw.slice(1)}`;
  })();

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

  // When user picks an option in the Reminder dropdown: ask confirmation/scope first
  const handleReminderSelectChange = (newVal: string) => {
    if (isThisOccurrenceCancelled || isUpdatingReminder) return;
    if (newVal === currentReminderValue) return;

    setPendingReminderValue(newVal);
    if (isRecurring) {
      setShowReminderScopeModal(true);
    } else {
      setShowReminderConfirmModal(true);
    }
  };

  const handleCancelReminderModal = () => {
    setShowReminderScopeModal(false);
    setShowReminderConfirmModal(false);
    setCurrentReminderValue(calculatedDiffMins);
    setPendingReminderValue(null);
  };

  const handleApplyReminder = async (scope: 'this' | 'all') => {
    const newVal = pendingReminderValue;
    if (!newVal) return;

    setShowReminderScopeModal(false);
    setShowReminderConfirmModal(false);
    setCurrentReminderValue(newVal);
    setIsUpdatingReminder(true);

    try {
      const diffMins = newVal !== 'none' ? parseInt(newVal, 10) : null;

      if (isRecurring && scope === 'this') {
        const occKey = formatDateKey(currentOccDate);
        const currentExcluded = recurrenceConfig?.excludedDates || [];
        const nextExcluded = currentExcluded.includes(occKey)
          ? currentExcluded
          : [...currentExcluded, occKey];
        const updatedParentRecurrence: RecurrenceConfig = {
          ...(recurrenceConfig!),
          excludedDates: nextExcluded,
        };
        const updatedParentDesc = serializeRecurrence(updatedParentRecurrence, cleanDesc);

        // 1. Exclude this occurrence from parent series
        await updateMutation.mutateAsync({
          eventId: event.id,
          input: {
            description: updatedParentDesc,
          },
        });

        // 2. Create standalone non-recurring event for this occurrence
        let standaloneReminderIso: string | null = null;
        if (diffMins !== null) {
          const s = new Date(occStartDate);
          s.setMinutes(s.getMinutes() - diffMins);
          standaloneReminderIso = s.toISOString();
        }

        const standaloneConfig: RecurrenceConfig = {
          ...(recurrenceConfig!),
          frequency: 'none',
          endType: 'never',
          endDate: null,
          isCustom: false,
        };
        const standaloneDesc = serializeRecurrence(standaloneConfig, cleanDesc);

        await createMutation.mutateAsync({
          eventTitle: event.eventTitle,
          description: standaloneDesc,
          location: event.location || undefined,
          startTime: occStartDate.toISOString(),
          endTime: occEndDate.toISOString(),
          reminderTime: standaloneReminderIso || undefined,
        });
      } else {
        // Apply to all (or standalone event)
        let newReminderIso: string | null = null;
        if (diffMins !== null) {
          const s = new Date(event.startTime);
          s.setMinutes(s.getMinutes() - diffMins);
          newReminderIso = s.toISOString();
        }

        await updateMutation.mutateAsync({
          eventId: event.id,
          input: {
            reminderTime: newReminderIso,
          },
        });
      }
    } catch (err: any) {
      console.warn('Failed to update reminder:', err);
      setCurrentReminderValue(calculatedDiffMins);
    } finally {
      setIsUpdatingReminder(false);
      setPendingReminderValue(null);
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
              <Share2 className="w-4 h-4 text-circle-slate dark:text-circle-dark-muted" />
            </button>
          )}

          {(event.createdById === user?.id || event.creator?.userId === user?.id) && (
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

        {/* 3. Hàng Lặp lại (Ghi rõ: Lặp lại hằng tuần vào T4) */}
        {isRecurring && recurrenceConfig && (
          <div className="flex items-start gap-4 pt-4 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
            <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0 mt-0.5">
              <Repeat className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {repeatSummaryText}
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

        {/* 4. Hàng Người tham gia (Ấn vào button mới bình chọn và xem danh sách xây như apps có 3 tab) */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                Người tham gia ({totalRsvps})
              </div>
              <div className="text-xs text-circle-slate dark:text-circle-dark-muted font-medium mt-0.5">
                {totalRsvps > 0 ? `${yesRsvps.length} người tham gia` : 'Chưa có phản hồi nào'}
              </div>

              {/* Avatar stack preview */}
              {totalRsvps > 0 && (
                <div className="flex items-center gap-1 overflow-x-auto pt-1.5">
                  {rsvps.slice(0, 8).map((r, i) => {
                    const isMe = r.userId === user?.id;
                    const dName = isMe ? 'Bạn' : r.user?.profile?.displayName || 'TV';
                    const avUrl = r.user?.profile?.avatarUrl;

                    return (
                      <div
                        key={r.id || r.userId || i}
                        title={`${dName} (${r.status === EventRsvpStatus.YES ? 'Tham gia' : r.status === EventRsvpStatus.MAYBE ? 'Chưa chắc' : 'Bận'})`}
                        className="h-6 w-6 rounded-full border-2 border-white dark:border-circle-dark-surface overflow-hidden bg-circle-wash flex items-center justify-center text-[10px] font-bold text-circle-charcoal shrink-0 shadow-2xs"
                      >
                        {avUrl ? (
                          <img src={avUrl} alt={dName} className="h-full w-full object-cover" />
                        ) : (
                          <span>{dName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    );
                  })}
                  {rsvps.length > 8 && (
                    <span className="text-[11px] font-bold text-circle-slate ml-1">
                      +{rsvps.length - 8}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Nút bấm để mở Popup Bình chọn & Xem danh sách */}
          <button
            type="button"
            onClick={() => setShowAttendeesModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:bg-teal-50 dark:hover:bg-teal-950/20 text-xs font-bold text-teal-600 dark:text-teal-400 hover:border-teal-500/30 transition-all cursor-pointer shrink-0"
          >
            <span>
              {myRsvp
                ? myRsvp === EventRsvpStatus.YES
                  ? 'Đã chọn: Tham gia'
                  : myRsvp === EventRsvpStatus.MAYBE
                  ? 'Đã chọn: Chưa chắc'
                  : 'Đã chọn: Bận'
                : 'Tham gia bình chọn'}
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 5. Hàng Nhắc nhở (Icon Bell - Select nằm bên phải luôn, hỏi xác nhận cập nhật như lưu chỉnh sửa) */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text shrink-0">
              Nhắc hẹn trước
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isUpdatingReminder && (
              <div className="flex items-center gap-1.5 text-xs text-teal-600 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="hidden sm:inline">Đang lưu...</span>
              </div>
            )}
            <select
              value={currentReminderValue}
              disabled={isThisOccurrenceCancelled || isUpdatingReminder}
              onChange={(e) => handleReminderSelectChange(e.target.value)}
              className="rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-surface px-3 py-1.5 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage cursor-pointer disabled:opacity-50"
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

      {/* ============================================================== */}
      {/* POPUP: BÌNH CHỌN & DANH SÁCH NGƯỜI THAM GIA XÂY NHƯ APP (3 TABS) */}
      {/* ============================================================== */}
      {showAttendeesModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-circle-dark-surface p-5 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                  Bình chọn & Danh sách phản hồi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAttendeesModal(false)}
                className="p-1.5 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Phần 1: Bình chọn của bạn */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-circle-slate dark:text-circle-dark-muted">
                Bình chọn của bạn:
              </div>
              <div className="grid grid-cols-3 gap-2">
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
                      className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? `${opt.activeBg} ring-2 ring-teal-500/20 font-bold shadow-2xs`
                          : 'border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/50 dark:bg-circle-dark-canvas hover:bg-circle-wash text-circle-charcoal dark:text-circle-dark-text font-medium'
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

            {/* Phần 2: 3 Tabs (Tham gia | Chưa chắc | Bận) giống như Apps */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center p-1 rounded-xl bg-circle-canvas/80 dark:bg-circle-dark-canvas border border-circle-hairline dark:border-circle-dark-hairline">
                {[
                  { key: 'yes', label: 'Tham gia', count: yesRsvps.length },
                  { key: 'maybe', label: 'Chưa chắc', count: maybeRsvps.length },
                  { key: 'no', label: 'Bận', count: noRsvps.length },
                ].map((tab) => {
                  const isActive = attendeeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setAttendeeTab(tab.key as 'yes' | 'maybe' | 'no')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                        isActive
                          ? 'bg-white dark:bg-circle-dark-surface text-teal-600 dark:text-teal-400 shadow-2xs'
                          : 'text-circle-slate hover:text-circle-charcoal dark:hover:text-white'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  );
                })}
              </div>

              {/* Danh sách người dùng của Tab đang chọn */}
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {(() => {
                  const activeList =
                    attendeeTab === 'yes'
                      ? yesRsvps
                      : attendeeTab === 'maybe'
                      ? maybeRsvps
                      : noRsvps;

                  if (activeList.length === 0) {
                    return (
                      <div className="py-8 text-center text-xs text-circle-slate dark:text-circle-dark-muted">
                        Chưa có thành viên nào chọn mục này
                      </div>
                    );
                  }

                  return activeList.map((r, idx) => {
                    const isMe = r.userId === user?.id;
                    const dName = isMe ? 'Bạn' : r.user?.profile?.displayName || 'Thành viên';
                    const realNameOrHandle =
                      (r.user?.profile as any)?.fullName ||
                      ((r.user?.profile as any)?.handle ? `@${(r.user?.profile as any).handle}` : (isMe ? '@toi' : '@thanhvien'));
                    const avUrl = r.user?.profile?.avatarUrl;

                    return (
                      <div
                        key={r.id || r.userId || idx}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
                      >
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-circle-wash dark:bg-circle-dark-wash border border-circle-hairline flex items-center justify-center text-xs font-bold text-circle-charcoal dark:text-circle-dark-text shrink-0">
                          {avUrl ? (
                            <img src={avUrl} alt={dName} className="h-full w-full object-cover" />
                          ) : (
                            <span>{dName.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                            {dName} {isMe && <span className="text-teal-600 font-semibold">(Tôi)</span>}
                          </div>
                          <div className="text-[11px] text-circle-slate dark:text-circle-dark-muted truncate">
                            {realNameOrHandle}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-circle-hairline dark:border-circle-dark-hairline flex justify-end">
              <button
                type="button"
                onClick={() => setShowAttendeesModal(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-circle-slate hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SCOPE MODAL KHI CẬP NHẬT NHẮC HẸN CHO SỰ KIỆN LẶP LẠI */}
      {/* ============================================================== */}
      {showReminderScopeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-5 shadow-2xl space-y-4">
            <div>
              <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                Cập nhật sự kiện lặp lại
              </h4>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1">
                Bạn muốn áp dụng thay đổi thời gian nhắc hẹn này cho lần diễn ra này hay tất cả các lần?
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleApplyReminder('this')}
                className="w-full text-left p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-all cursor-pointer"
              >
                <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  Chỉ lần này
                </p>
                <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                  Chỉ thay đổi riêng ngày {formatDateOnly(occStartDate)}, các lần khác giữ nguyên.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyReminder('all')}
                className="w-full text-left p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-all cursor-pointer"
              >
                <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  Tất cả các lần
                </p>
                <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                  Cập nhật thời gian nhắc hẹn cho toàn bộ các lần diễn ra trong chuỗi lặp lại.
                </p>
              </button>
            </div>

            <div className="pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline flex justify-end">
              <button
                type="button"
                onClick={handleCancelReminderModal}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-circle-slate hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CONFIRMATION MODAL KHI CẬP NHẬT NHẮC HẸN CHO SỰ KIỆN ĐƠN */}
      {/* ============================================================== */}
      {showReminderConfirmModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-5 shadow-2xl space-y-4">
            <div>
              <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                Cập nhật thời gian nhắc hẹn
              </h4>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1">
                Bạn có chắc chắn muốn thay đổi thời gian nhắc hẹn cho sự kiện này?
              </p>
            </div>

            <div className="pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelReminderModal}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-circle-slate hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleApplyReminder('all')}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
