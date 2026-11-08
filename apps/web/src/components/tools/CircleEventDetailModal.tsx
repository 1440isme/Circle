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
  HelpCircle,
  Video,
} from 'lucide-react';
import { CalendarEventEntity, EventRsvpStatus } from '@circle/types';
import {
  parseEventRecurrence,
  formatRecurrenceSummary,
  formatDateOnly,
  isEventCancelledOnDate,
  getNextOrPrevOccurrence,
  formatEventTimeForDate,
} from './calendar-recurrence';
import { useAuth } from '../../context/AuthContext';
import { useRespondEventRsvpMutation } from '../../hooks/use-circle-tools';
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

  const handleJumpOccurrence = (direction: 'next' | 'prev') => {
    if (!isRecurring) return;
    const target = getNextOrPrevOccurrence(currentOccDate, recurrenceConfig, direction);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header Actions */}
        <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline">
          {/* Occurrence Date Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-500/20 text-teal-800 dark:text-teal-300 text-xs font-bold">
            <Clock className="h-3.5 w-3.5 text-teal-600" />
            <span>
              {currentOccDate.toLocaleDateString('vi-VN', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {onShareToChat && (
              <button
                type="button"
                onClick={handleShareClick}
                title="Chia sẻ vào tin nhắn nhóm"
                className="p-1.5 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-wash text-circle-slate hover:text-teal-600 transition-colors"
              >
                <Share2 className="h-4 w-4" />
              </button>
            )}

            {!isThisOccurrenceCancelled && (
              <button
                type="button"
                onClick={() => {
                  onEdit(event, currentOccDate);
                }}
                title="Chỉnh sửa lịch hẹn"
                className="p-1.5 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-wash text-circle-slate hover:text-teal-600 transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}

            {isThisOccurrenceCancelled ? (
              <button
                type="button"
                onClick={() => onRestore(event, currentOccDate)}
                title="Khôi phục lịch hẹn"
                className="p-1.5 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline hover:bg-emerald-50 text-emerald-600 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onCancel(event, currentOccDate)}
                title="Hủy lịch hẹn"
                className="p-1.5 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline hover:bg-amber-50 text-amber-600 transition-colors"
              >
                <Ban className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onDelete(event, currentOccDate)}
              title="Xóa lịch hẹn"
              className="p-1.5 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline hover:bg-rose-50 text-rose-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-circle-wash text-circle-slate hover:text-circle-charcoal transition-colors ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Share Feedback Toast */}
        {copiedShare && (
          <div className="p-2 rounded-xl bg-teal-600 text-white text-xs text-center font-bold animate-in fade-in">
            Đã chia sẻ lịch hẹn vào tin nhắn nhóm thành công!
          </div>
        )}

        {/* Title & Cancelled Banner */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h1
              className={`text-base font-bold text-circle-charcoal dark:text-circle-dark-text ${
                isThisOccurrenceCancelled ? 'line-through opacity-70 text-rose-700 dark:text-rose-400' : ''
              }`}
            >
              {event.eventTitle}
            </h1>
            {isThisOccurrenceCancelled && (
              <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                Đã hủy
              </span>
            )}
          </div>

          {isThisOccurrenceCancelled && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
                <Ban className="h-4 w-4 shrink-0" />
                <span>Lịch hẹn này đã được đánh dấu là Đã hủy trên lịch nhóm.</span>
              </div>
              <button
                type="button"
                onClick={() => onRestore(event, currentOccDate)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                Khôi phục
              </button>
            </div>
          )}
        </div>

        {/* Details Card */}
        <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/40 p-4 space-y-3.5">
          {/* Time & Duration */}
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0 mt-0.5">
              <Clock className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                {formatEventTimeForDate(event, currentOccDate)}
              </div>
              <div className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                {occStartDate.toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>

          {/* Location */}
          {parsedLocation && (
            <div className="flex items-start gap-3 pt-3 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                {parsedLocation.category === 'meet' ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                  {parsedLocation.text}
                </div>
                {parsedLocation.url && (
                  <a
                    href={parsedLocation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700 hover:underline mt-0.5"
                  >
                    <span>{parsedLocation.linkText}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Recurrence & Occurrence Navigation */}
          {isRecurring && recurrenceConfig && (
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="h-8 w-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shrink-0 mt-0.5">
                  <Repeat className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                    {formatRecurrenceSummary(recurrenceConfig)}
                  </div>
                  {recurrenceConfig.endType === 'on_date' && recurrenceConfig.endDate && (
                    <div className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                      Kết thúc sau {formatDateOnly(new Date(recurrenceConfig.endDate))}
                    </div>
                  )}
                </div>
              </div>

              {/* Prev / Next occurrence buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleJumpOccurrence('prev')}
                  title="Xem lần diễn ra trước"
                  className="p-1.5 rounded-lg border border-circle-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash text-circle-slate hover:text-circle-charcoal transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleJumpOccurrence('next')}
                  title="Xem lần diễn ra tiếp theo"
                  className="p-1.5 rounded-lg border border-circle-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash text-circle-slate hover:text-circle-charcoal transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Reminder */}
          <div className="flex items-start gap-3 pt-3 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                Nhắc trước
              </div>
              <div className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                {reminderLabel}
              </div>
            </div>
          </div>

          {/* Description / Notes */}
          {cleanDesc ? (
            <div className="flex items-start gap-3 pt-3 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
              <div className="h-8 w-8 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                <Info className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  Ghi chú
                </div>
                <div className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1 whitespace-pre-wrap leading-relaxed">
                  {cleanDesc}
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-2 text-[11px] text-circle-slate/60 dark:text-circle-dark-muted/60 italic">
              Không có ghi chú thêm
            </div>
          )}
        </div>

        {/* RSVP Voting & Attendees Section */}
        <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" />
              <h3 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                Bình chọn tham gia ({totalRsvps})
              </h3>
            </div>
            {totalRsvps > 0 && (
              <button
                type="button"
                onClick={() => setShowAttendeesModal(true)}
                className="text-[11px] font-bold text-teal-600 hover:text-teal-700 hover:underline"
              >
                Xem danh sách
              </button>
            )}
          </div>

          {/* Interactive Vote Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                status: EventRsvpStatus.YES,
                label: 'Tham gia',
                count: yesRsvps.length,
                color: 'bg-emerald-600',
                border: 'border-emerald-600',
                activeBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300',
              },
              {
                status: EventRsvpStatus.MAYBE,
                label: 'Chưa chắc',
                count: maybeRsvps.length,
                color: 'bg-amber-600',
                border: 'border-amber-600',
                activeBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300',
              },
              {
                status: EventRsvpStatus.NO,
                label: 'Bận',
                count: noRsvps.length,
                color: 'bg-rose-600',
                border: 'border-rose-600',
                activeBg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300',
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
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? `${opt.activeBg} ${opt.border} ring-2 ring-teal-500/20 font-bold shadow-2xs`
                      : 'border-circle-hairline bg-circle-canvas/50 dark:bg-circle-dark-canvas hover:bg-circle-wash text-circle-charcoal dark:text-circle-dark-text font-medium'
                  } disabled:opacity-50`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[11px] opacity-75 mt-0.5">
                    {opt.count} ({percent}%)
                  </div>
                </button>
              );
            })}
          </div>

          {/* Avatar stack preview */}
          {totalRsvps > 0 && (
            <div className="flex items-center gap-1 pt-1 overflow-x-auto">
              {rsvps.slice(0, 8).map((r, i) => {
                const isMe = r.userId === user?.id;
                const dName = isMe ? 'Bạn' : r.user?.profile?.displayName || 'TV';
                const avUrl = r.user?.profile?.avatarUrl;

                return (
                  <div
                    key={r.id || r.userId || i}
                    title={`${dName} (${r.status === EventRsvpStatus.YES ? 'Tham gia' : r.status === EventRsvpStatus.MAYBE ? 'Chưa chắc' : 'Bận'})`}
                    className="h-6 w-6 rounded-full border border-white dark:border-circle-dark-surface overflow-hidden bg-circle-wash flex items-center justify-center text-[10px] font-bold text-circle-charcoal shrink-0"
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

        {/* Close Button */}
        <div className="pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-circle-charcoal text-white hover:bg-black transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Attendees Full List Dialog */}
      {showAttendeesModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-circle-dark-surface p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-circle-hairline">
              <h3 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                Danh sách phản hồi ({totalRsvps})
              </h3>
              <button
                type="button"
                onClick={() => setShowAttendeesModal(false)}
                className="p-1 rounded-lg hover:bg-circle-wash text-circle-slate"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {rsvps.map((r) => {
                const isMe = r.userId === user?.id;
                const dName = isMe ? 'Bạn' : r.user?.profile?.displayName || 'Thành viên';
                const statusBadge =
                  r.status === EventRsvpStatus.YES
                    ? { label: 'Tham gia', color: 'bg-emerald-500/10 text-emerald-600' }
                    : r.status === EventRsvpStatus.MAYBE
                    ? { label: 'Chưa chắc', color: 'bg-amber-500/10 text-amber-600' }
                    : { label: 'Bận', color: 'bg-rose-500/10 text-rose-600' };

                return (
                  <div key={r.id || r.userId} className="flex items-center justify-between py-1">
                    <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                      {dName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge.color}`}>
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
