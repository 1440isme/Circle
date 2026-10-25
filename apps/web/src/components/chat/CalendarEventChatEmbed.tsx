'use client';

import React from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  ExternalLink,
  Calendar as CalendarIcon,
  Bell,
  Sparkles,
} from 'lucide-react';
import { CalendarEventMessagePayload } from '@circle/types';
import { useCircleStore } from '../../stores/circle.store';
import { useLanguageStore } from '../../stores/language.store';

export interface CalendarEventChatEmbedProps {
  eventData: CalendarEventMessagePayload;
  isSenderMe?: boolean;
  messageId?: string;
  onReact?: (messageId: string, emoji: string) => void;
  reactionCounts?: Record<string, number>;
  currentUserId?: string;
}

const QUICK_EVENT_EMOJIS = ['👍', '🎉', '❤️', '🔥'];

export const CalendarEventChatEmbed: React.FC<CalendarEventChatEmbedProps> = ({
  eventData,
  isSenderMe = false,
  messageId,
  onReact,
  reactionCounts = {},
  currentUserId,
}) => {
  const setActiveCircleView = useCircleStore((s) => s.setActiveCircleView);
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);

  const startDate = new Date(eventData.startTime);
  const isVi = locale === 'vi';

  const monthNamesVi = [
    'THG 1', 'THG 2', 'THG 3', 'THG 4', 'THG 5', 'THG 6',
    'THG 7', 'THG 8', 'THG 9', 'THG 10', 'THG 11', 'THG 12',
  ];
  const weekdayNamesVi = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  const monthStr = isVi
    ? monthNamesVi[startDate.getMonth()]
    : startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dayNum = startDate.getDate();
  const weekdayStr = isVi
    ? weekdayNamesVi[startDate.getDay()]
    : startDate.toLocaleDateString('en-US', { weekday: 'short' });

  // Time format
  const startTimeStr = startDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  let timeRangeStr = startTimeStr;
  if (eventData.endTime) {
    const endDate = new Date(eventData.endTime);
    const endTimeStr = endDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    timeRangeStr = `${startTimeStr} – ${endTimeStr}`;
  }

  // Reminder format
  let reminderStr: string | null = null;
  if (eventData.reminderTime) {
    const remDate = new Date(eventData.reminderTime);
    const diffMinutes = Math.round((startDate.getTime() - remDate.getTime()) / (60 * 1000));
    if (diffMinutes > 0) {
      if (diffMinutes >= 1440) {
        const days = Math.round(diffMinutes / 1440);
        reminderStr = isVi ? `Nhắc trước ${days} ngày` : `Remind ${days}d before`;
      } else if (diffMinutes >= 60) {
        const hours = Math.round(diffMinutes / 60);
        reminderStr = isVi ? `Nhắc trước ${hours} giờ` : `Remind ${hours}h before`;
      } else {
        reminderStr = isVi ? `Nhắc trước ${diffMinutes} phút` : `Remind ${diffMinutes}m before`;
      }
    }
  }

  const isUpdated = eventData.action === 'UPDATED';

  const handleOpenCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCircleView('calendar');
  };

  return (
    <div className="w-full max-w-lg mx-auto transition-all select-text">
      {/* Container with modern card styling and soft shadow */}
      <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/95 dark:bg-circle-dark-surface/95 backdrop-blur-md shadow-md overflow-hidden transition-all hover:border-circle-primary/40">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-circle-primary/15 via-circle-wash to-circle-canvas dark:from-circle-primary/20 dark:via-circle-dark-wash dark:to-circle-dark-canvas border-b border-circle-hairline/70 dark:border-circle-dark-hairline/70">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-circle-primary text-circle-charcoal shadow-2xs">
              <CalendarIcon className="h-3 w-3" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-circle-sage dark:text-circle-primary">
              {isUpdated ? (isVi ? 'Cập nhật lịch hẹn' : 'Event Updated') : (isVi ? 'Thông báo lịch hẹn' : 'Circle Event')}
            </span>
          </div>
          <span className="text-[11px] font-medium text-circle-slate dark:text-circle-dark-muted">
            {isVi ? `Bởi ${eventData.creatorName}` : `By ${eventData.creatorName}`}
          </span>
        </div>

        {/* Event Body with Calendar Tile + Event Info */}
        <div className="p-4 flex flex-col sm:flex-row items-start gap-4">
          {/* Calendar Date Block (iOS / Calendar Style) */}
          <div className="flex sm:flex-col items-center justify-center shrink-0 w-full sm:w-16 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/80 overflow-hidden shadow-2xs">
            <div className="w-full bg-circle-primary text-circle-charcoal text-[10px] font-bold py-1 text-center uppercase tracking-wider">
              {monthStr}
            </div>
            <div className="flex items-baseline sm:flex-col items-center justify-center p-2 sm:py-2 gap-1.5 sm:gap-0">
              <span className="text-2xl font-black text-circle-charcoal dark:text-circle-dark-text leading-none">
                {dayNum}
              </span>
              <span className="text-[10px] font-semibold text-circle-slate dark:text-circle-dark-muted uppercase mt-0.5">
                {weekdayStr}
              </span>
            </div>
          </div>

          {/* Event Content Details */}
          <div className="flex-1 min-w-0 space-y-2">
            <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text leading-snug break-words">
              {eventData.eventTitle}
            </h3>

            {/* Time row */}
            <div className="flex items-center gap-2 text-xs text-circle-charcoal dark:text-circle-dark-text font-medium">
              <Clock className="h-3.5 w-3.5 text-circle-primary shrink-0" />
              <span>{timeRangeStr}</span>
              <span className="text-circle-slate dark:text-circle-dark-muted">• {weekdayStr}, {dayNum} {monthStr}</span>
            </div>

            {/* Location row (if provided) */}
            {eventData.location && (
              <div className="flex items-center gap-2 text-xs text-circle-slate dark:text-circle-dark-muted">
                <MapPin className="h-3.5 w-3.5 text-red-500/80 shrink-0" />
                <span className="truncate">{eventData.location}</span>
              </div>
            )}

            {/* Reminder Badge */}
            {reminderStr && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
                <Bell className="h-3 w-3 shrink-0" />
                <span>{reminderStr}</span>
              </div>
            )}

            {/* Description note */}
            {eventData.description && (
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 rounded-xl p-2.5 italic border border-circle-hairline/60 dark:border-circle-dark-hairline/60">
                "{eventData.description}"
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions & Reactions */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60 gap-2">
          {/* Reaction chips */}
          <div className="flex items-center gap-1 flex-wrap">
            {QUICK_EVENT_EMOJIS.map((emoji) => {
              const count = reactionCounts[emoji] || 0;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => messageId && onReact?.(messageId, emoji)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all active:scale-95 ${
                    count > 0
                      ? 'bg-circle-primary/20 text-circle-sage dark:text-circle-primary font-bold border border-circle-primary/30'
                      : 'hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted border border-circle-hairline/50 dark:border-circle-dark-hairline/50'
                  }`}
                  title={isVi ? `Thả cảm xúc ${emoji}` : `React ${emoji}`}
                >
                  <span>{emoji}</span>
                  {count > 0 && <span className="text-[10px] font-mono">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Jump to Calendar button */}
          <button
            type="button"
            onClick={handleOpenCalendar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-circle-charcoal hover:bg-circle-sage text-white dark:bg-circle-primary dark:text-circle-charcoal dark:hover:bg-circle-primary/90 text-xs font-semibold shadow-xs transition-all active:scale-98 shrink-0"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{isVi ? 'Xem trên Lịch' : 'View in Calendar'}</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
};
