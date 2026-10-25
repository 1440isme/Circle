'use client';

import React from 'react';
import { CalendarDays, Clock, MapPin, ExternalLink, Calendar } from 'lucide-react';
import { CalendarEventMessagePayload } from '@circle/types';
import { useCircleStore } from '../../stores/circle.store';
import { useLanguageStore } from '../../stores/language.store';

export interface CalendarEventChatEmbedProps {
  eventData: CalendarEventMessagePayload;
  isSenderMe?: boolean;
}

export const CalendarEventChatEmbed: React.FC<CalendarEventChatEmbedProps> = ({
  eventData,
  isSenderMe = false,
}) => {
  const setActiveCircleView = useCircleStore((s) => s.setActiveCircleView);
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);

  const formatEventDateTime = (startIso: string, endIso?: string | null) => {
    try {
      const startDate = new Date(startIso);
      const isVi = locale === 'vi';

      // Date string format
      const dateStr = startDate.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      // Start time
      const startTimeStr = startDate.toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      if (!endIso) {
        return `${startTimeStr} • ${dateStr}`;
      }

      const endDate = new Date(endIso);
      const endTimeStr = endDate.toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      return `${startTimeStr} - ${endTimeStr} • ${dateStr}`;
    } catch {
      return startIso;
    }
  };

  const handleOpenCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCircleView('calendar');
  };

  const isUpdated = eventData.action === 'UPDATED';

  return (
    <div
      className={`rounded-2xl border transition-all my-1 overflow-hidden ${
        isSenderMe
          ? 'bg-circle-primary/10 border-circle-primary/30 text-circle-charcoal dark:text-circle-dark-text'
          : 'bg-white dark:bg-circle-dark-elevated border-circle-hairline dark:border-circle-dark-hairline text-circle-charcoal dark:text-circle-dark-text shadow-xs'
      }`}
      style={{ maxWidth: 360, minWidth: 260 }}
    >
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-circle-canvas/60 dark:bg-circle-dark-wash/50 border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60 text-xs font-semibold">
        <div className="flex items-center gap-1.5 text-circle-sage dark:text-circle-primary">
          <Calendar className="h-3.5 w-3.5" />
          <span>{isUpdated ? 'Cập nhật lịch hẹn' : 'Lịch hẹn nhóm'}</span>
        </div>
        <span className="text-[10px] text-circle-slate dark:text-circle-dark-muted font-normal">
          {eventData.creatorName}
        </span>
      </div>

      {/* Main Content */}
      <div className="p-3.5 space-y-2.5">
        <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text leading-snug break-words">
          {eventData.eventTitle}
        </h4>

        {/* Time and Date */}
        <div className="flex items-start gap-2 text-xs text-circle-slate dark:text-circle-dark-muted">
          <CalendarDays className="h-4 w-4 shrink-0 text-circle-primary mt-0.5" />
          <span className="font-medium text-circle-charcoal dark:text-circle-dark-text">
            {formatEventDateTime(eventData.startTime, eventData.endTime)}
          </span>
        </div>

        {/* Location if present */}
        {eventData.location && (
          <div className="flex items-start gap-2 text-xs text-circle-slate dark:text-circle-dark-muted">
            <MapPin className="h-4 w-4 shrink-0 text-red-500/80 mt-0.5" />
            <span className="truncate">{eventData.location}</span>
          </div>
        )}

        {/* Description if present */}
        {eventData.description && (
          <p className="text-xs text-circle-slate dark:text-circle-dark-muted line-clamp-2 bg-circle-canvas/50 dark:bg-circle-dark-canvas/50 rounded-lg p-2 italic">
            "{eventData.description}"
          </p>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={handleOpenCalendar}
          className="mt-1 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-circle-canvas dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash border border-circle-hairline dark:border-circle-dark-hairline text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-98 shadow-2xs"
        >
          <Calendar className="h-3.5 w-3.5 text-circle-primary" />
          <span>{t.nav.calendarEvents || 'Xem trên Lịch nhóm'}</span>
          <ExternalLink className="h-3 w-3 text-circle-slate dark:text-circle-dark-muted ml-0.5" />
        </button>
      </div>
    </div>
  );
};
