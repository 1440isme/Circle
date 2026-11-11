'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
} from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';

interface CustomDateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:mm" or ""
  onChange: (val: string) => void;
  required?: boolean;
  min?: string; // "YYYY-MM-DDTHH:mm"
  placeholder?: string;
  align?: 'left' | 'right';
  className?: string;
}

const ITEM_HEIGHT = 40;
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const YEARS = Array.from({ length: 35 }, (_, i) => 2015 + i); // 2015 - 2049

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  value,
  onChange,
  required = false,
  min,
  placeholder,
  align = 'left',
  className = '',
}) => {
  const t = useLanguageStore((s) => s.t);
  const resolvedPlaceholder = placeholder || t.collab.datePickerPlaceholder;

  const [isOpen, setIsOpen] = useState(false);
  const [isMonthYearOpen, setIsMonthYearOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const monthNames = useMemo(
    () => [
      t.collab.monthShort1,
      t.collab.monthShort2,
      t.collab.monthShort3,
      t.collab.monthShort4,
      t.collab.monthShort5,
      t.collab.monthShort6,
      t.collab.monthShort7,
      t.collab.monthShort8,
      t.collab.monthShort9,
      t.collab.monthShort10,
      t.collab.monthShort11,
      t.collab.monthShort12,
    ],
    [t],
  );

  const weekdays = useMemo(
    () => [
      t.collab.weekdaySun,
      t.collab.weekdayMon,
      t.collab.weekdayTue,
      t.collab.weekdayWed,
      t.collab.weekdayThu,
      t.collab.weekdayFri,
      t.collab.weekdaySat,
    ],
    [t],
  );

  const { datePart, timePart } = useMemo(() => {
    if (!value || !value.includes('T')) {
      return { datePart: '', timePart: '00:00' };
    }
    const [d, tm] = value.split('T');
    return { datePart: d, timePart: tm ? tm.slice(0, 5) : '00:00' };
  }, [value]);

  const { minDatePart } = useMemo(() => {
    if (!min || !min.includes('T')) {
      return { minDatePart: '' };
    }
    const [d] = min.split('T');
    return { minDatePart: d };
  }, [min]);

  const formattedDisplay = useMemo(() => {
    if (!datePart) return '';
    const parts = datePart.split('-');
    if (parts.length !== 3) return value;
    const [y, m, d] = parts;
    const timeDisplay = timePart || '00:00';
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y} ${timeDisplay}`;
  }, [datePart, timePart, value]);

  const initialCalendarDate = useMemo(() => {
    if (datePart) {
      const [y, m, d] = datePart.split('-').map(Number);
      if (y && m && d) return new Date(y, m - 1, d);
    }
    return new Date();
  }, [datePart]);

  const [currentViewDate, setCurrentViewDate] = useState<Date>(initialCalendarDate);

  const [hStr, mStr] = (timePart || '00:00').split(':');
  const [activeHour, setActiveHour] = useState(parseInt(hStr || '0', 10));
  const [activeMinute, setActiveMinute] = useState(parseInt(mStr || '0', 10));

  const hoursScrollRef = useRef<HTMLDivElement>(null);
  const minutesScrollRef = useRef<HTMLDivElement>(null);
  const monthsScrollRef = useRef<HTMLDivElement>(null);
  const yearsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (datePart) {
      const [y, m, d] = datePart.split('-').map(Number);
      if (y && m && d) {
        setCurrentViewDate(new Date(y, m - 1, d));
      }
    }
    const [h, m] = (timePart || '00:00').split(':');
    const nh = parseInt(h || '0', 10);
    const nm = parseInt(m || '0', 10);
    if (!isNaN(nh)) setActiveHour(nh);
    if (!isNaN(nm)) setActiveMinute(nm);
  }, [datePart, timePart]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsMonthYearOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsMonthYearOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const scrollTo = useCallback((element: HTMLElement | null, index: number, smooth = true) => {
    if (!element) return;
    const targetTop = index * ITEM_HEIGHT;
    if (Math.abs(element.scrollTop - targetTop) > 1) {
      element.scrollTo({
        top: targetTop,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        scrollTo(hoursScrollRef.current, activeHour, false);
        scrollTo(minutesScrollRef.current, activeMinute, false);
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeHour, activeMinute, scrollTo]);

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth() + 1;

  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(year, month - 1, 1).getDay();
  }, [year, month]);

  useEffect(() => {
    if (isMonthYearOpen) {
      const timer = setTimeout(() => {
        scrollTo(monthsScrollRef.current, month - 1, false);
        const yIdx = YEARS.indexOf(year);
        if (yIdx !== -1) {
          scrollTo(yearsScrollRef.current, yIdx, false);
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isMonthYearOpen, month, year, scrollTo]);

  const handleSelectDay = (dayNum: number) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const newDatePart = `${year}-${pad(month)}-${pad(dayNum)}`;
    const curTime = `${pad(activeHour)}:${pad(activeMinute)}`;
    onChange(`${newDatePart}T${curTime}`);
  };

  const handleMonthScroll = () => {
    if (!monthsScrollRef.current) return;
    const scrollTop = monthsScrollRef.current.scrollTop;
    const idx = Math.min(11, Math.max(0, Math.round(scrollTop / ITEM_HEIGHT)));
    if (idx !== month - 1) {
      const daysInTargetMonth = new Date(year, idx + 1, 0).getDate();
      const currentDay = datePart ? parseInt(datePart.split('-')[2], 10) : 1;
      const targetDay = Math.min(currentDay, daysInTargetMonth);
      const pad = (n: number) => String(n).padStart(2, '0');
      const newDatePart = `${year}-${pad(idx + 1)}-${pad(targetDay)}`;
      onChange(`${newDatePart}T${pad(activeHour)}:${pad(activeMinute)}`);
    }
  };

  const handleYearScroll = () => {
    if (!yearsScrollRef.current) return;
    const scrollTop = yearsScrollRef.current.scrollTop;
    const idx = Math.min(YEARS.length - 1, Math.max(0, Math.round(scrollTop / ITEM_HEIGHT)));
    const targetYear = YEARS[idx];
    if (targetYear !== year) {
      const daysInTargetMonth = new Date(targetYear, month, 0).getDate();
      const currentDay = datePart ? parseInt(datePart.split('-')[2], 10) : 1;
      const targetDay = Math.min(currentDay, daysInTargetMonth);
      const pad = (n: number) => String(n).padStart(2, '0');
      const newDatePart = `${targetYear}-${pad(month)}-${pad(targetDay)}`;
      onChange(`${newDatePart}T${pad(activeHour)}:${pad(activeMinute)}`);
    }
  };

  const handleSelectMonth = (mIdx: number) => {
    scrollTo(monthsScrollRef.current, mIdx, true);
    const daysInTargetMonth = new Date(year, mIdx + 1, 0).getDate();
    const currentDay = datePart ? parseInt(datePart.split('-')[2], 10) : 1;
    const targetDay = Math.min(currentDay, daysInTargetMonth);
    const pad = (n: number) => String(n).padStart(2, '0');
    const newDatePart = `${year}-${pad(mIdx + 1)}-${pad(targetDay)}`;
    onChange(`${newDatePart}T${pad(activeHour)}:${pad(activeMinute)}`);
  };

  const handleSelectYear = (yIdx: number) => {
    scrollTo(yearsScrollRef.current, yIdx, true);
    const targetYear = YEARS[yIdx];
    const daysInTargetMonth = new Date(targetYear, month, 0).getDate();
    const currentDay = datePart ? parseInt(datePart.split('-')[2], 10) : 1;
    const targetDay = Math.min(currentDay, daysInTargetMonth);
    const pad = (n: number) => String(n).padStart(2, '0');
    const newDatePart = `${targetYear}-${pad(month)}-${pad(targetDay)}`;
    onChange(`${newDatePart}T${pad(activeHour)}:${pad(activeMinute)}`);
  };

  const handleHoursScroll = () => {
    if (!hoursScrollRef.current) return;
    const scrollTop = hoursScrollRef.current.scrollTop;
    const idx = Math.min(23, Math.max(0, Math.round(scrollTop / ITEM_HEIGHT)));
    if (idx !== activeHour) {
      setActiveHour(idx);
      const newTime = `${String(idx).padStart(2, '0')}:${String(activeMinute).padStart(2, '0')}`;
      const d = datePart || new Date().toISOString().split('T')[0];
      onChange(`${d}T${newTime}`);
    }
  };

  const handleMinutesScroll = () => {
    if (!minutesScrollRef.current) return;
    const scrollTop = minutesScrollRef.current.scrollTop;
    const idx = Math.min(59, Math.max(0, Math.round(scrollTop / ITEM_HEIGHT)));
    if (idx !== activeMinute) {
      setActiveMinute(idx);
      const newTime = `${String(activeHour).padStart(2, '0')}:${String(idx).padStart(2, '0')}`;
      const d = datePart || new Date().toISOString().split('T')[0];
      onChange(`${d}T${newTime}`);
    }
  };

  const handleSelectHour = (h: number) => {
    setActiveHour(h);
    scrollTo(hoursScrollRef.current, h, true);
    const newTime = `${String(h).padStart(2, '0')}:${String(activeMinute).padStart(2, '0')}`;
    const d = datePart || new Date().toISOString().split('T')[0];
    onChange(`${d}T${newTime}`);
  };

  const handleSelectMinute = (m: number) => {
    setActiveMinute(m);
    scrollTo(minutesScrollRef.current, m, true);
    const newTime = `${String(activeHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const d = datePart || new Date().toISOString().split('T')[0];
    onChange(`${d}T${newTime}`);
  };

  const isDayDisabled = (dayNum: number): boolean => {
    if (!minDatePart) return false;
    const pad = (n: number) => String(n).padStart(2, '0');
    const dayIso = `${year}-${pad(month)}-${pad(dayNum)}`;
    return dayIso < minDatePart;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-2.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-sage cursor-pointer select-none transition-all ${
          isOpen ? 'ring-1 ring-circle-sage border-circle-sage' : 'hover:border-circle-sage/60'
        } ${className}`}
      >
        <span
          className={`truncate font-medium ${
            formattedDisplay
              ? 'text-circle-charcoal dark:text-circle-dark-text font-semibold'
              : 'text-circle-slate/60 dark:text-circle-dark-muted/60'
          }`}
        >
          {formattedDisplay || resolvedPlaceholder}
        </span>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {!required && Boolean(value) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              title={t.collab.datePickerClear}
              className="p-0.5 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted hover:text-rose-500 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <CalendarIcon className="h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted" />
        </div>
      </div>

      {/* Popover Picker */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } top-full mt-1.5 z-50 w-[380px] max-w-[calc(100vw-32px)] rounded-2xl glass-sheet shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="flex gap-3 items-stretch">
            {/* LEFT: Calendar */}
            <div className="flex-1 min-w-[200px] flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60">
                <button
                  type="button"
                  onClick={() => setIsMonthYearOpen(!isMonthYearOpen)}
                  title={
                    isMonthYearOpen
                      ? t.collab.datePickerCollapse
                      : t.collab.datePickerExpandMonthYear
                  }
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors cursor-pointer group"
                >
                  <span>
                    {monthNames[month - 1]} / {year}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted group-hover:text-circle-charcoal dark:group-hover:text-circle-dark-text transition-transform duration-200 ${
                      isMonthYearOpen ? 'rotate-180 text-circle-sage dark:text-circle-dark-primary' : ''
                    }`}
                  />
                </button>

                {!isMonthYearOpen && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentViewDate(new Date(year, month - 2, 1))}
                      className="p-1 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentViewDate(new Date(year, month, 1))}
                      className="p-1 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {isMonthYearOpen ? (
                <div className="relative h-[210px] w-full overflow-hidden flex justify-center items-center select-none">
                  <div className="absolute inset-x-1 top-[85px] h-10 rounded-xl bg-circle-charcoal dark:bg-circle-primary shadow-lg pointer-events-none z-0 border border-white/10" />

                  <div
                    ref={monthsScrollRef}
                    onScroll={handleMonthScroll}
                    className="h-full w-24 overflow-y-auto snap-y snap-mandatory z-10 text-center py-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    style={{ scrollBehavior: 'smooth' }}
                  >
                    <div className="h-[85px] shrink-0 pointer-events-none" />
                    {monthNames.map((mName, idx) => {
                      const isSelected = idx === month - 1;
                      return (
                        <div
                          key={mName}
                          onClick={() => handleSelectMonth(idx)}
                          className={`h-10 flex items-center justify-center snap-center text-sm font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'text-white dark:text-circle-dark-canvas scale-105'
                              : 'text-circle-slate dark:text-circle-dark-muted opacity-35 hover:opacity-80 scale-90'
                          }`}
                        >
                          {mName}
                        </div>
                      );
                    })}
                    <div className="h-[85px] shrink-0 pointer-events-none" />
                  </div>

                  <div className="z-10 font-bold text-sm text-white/70 dark:text-circle-dark-canvas/70 pointer-events-none px-1">
                    /
                  </div>

                  <div
                    ref={yearsScrollRef}
                    onScroll={handleYearScroll}
                    className="h-full w-20 overflow-y-auto snap-y snap-mandatory z-10 text-center py-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    style={{ scrollBehavior: 'smooth' }}
                  >
                    <div className="h-[85px] shrink-0 pointer-events-none" />
                    {YEARS.map((y, idx) => {
                      const isSelected = y === year;
                      return (
                        <div
                          key={y}
                          onClick={() => handleSelectYear(idx)}
                          className={`h-10 flex items-center justify-center snap-center text-sm font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'text-white dark:text-circle-dark-canvas scale-105'
                              : 'text-circle-slate dark:text-circle-dark-muted opacity-35 hover:opacity-80 scale-90'
                          }`}
                        >
                          {y}
                        </div>
                      );
                    })}
                    <div className="h-[85px] shrink-0 pointer-events-none" />
                  </div>
                </div>
              ) : (
                <div className="h-[210px] flex flex-col justify-start">
                  <div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                      {weekdays.map((d, i) => (
                        <span
                          key={d}
                          className={`text-[10px] font-bold ${
                            i === 0
                              ? 'text-rose-500'
                              : 'text-circle-slate dark:text-circle-dark-muted'
                          }`}
                        >
                          {d}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-7 w-7" />
                      ))}

                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
                        const pad = (n: number) => String(n).padStart(2, '0');
                        const currentIso = `${year}-${pad(month)}-${pad(dayNum)}`;
                        const isSelected = datePart === currentIso;
                        const disabled = isDayDisabled(dayNum);

                        return (
                          <button
                            key={dayNum}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleSelectDay(dayNum)}
                            className={`h-7 w-7 mx-auto rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                              disabled
                                ? 'opacity-25 cursor-not-allowed text-circle-slate dark:text-circle-dark-muted'
                                : isSelected
                                  ? 'bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-dark-canvas font-bold shadow-xs'
                                  : 'hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text'
                            }`}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="w-px bg-circle-hairline/60 dark:bg-circle-dark-hairline/60 self-stretch my-0.5" />

            {/* RIGHT: Time Wheel */}
            <div className="w-[120px] shrink-0 flex flex-col justify-between">
              <div className="flex items-center justify-end pb-2 mb-1.5 border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsMonthYearOpen(false);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-dark-canvas px-2.5 py-0.5 text-xs font-semibold hover:bg-circle-sage hover:text-white dark:hover:text-white transition-all shadow-xs"
                >
                  <Check className="h-3 w-3" />
                  <span>{t.collab.datePickerDone}</span>
                </button>
              </div>

              <div className="relative h-[210px] w-full overflow-hidden flex justify-center items-center select-none">
                <div className="absolute inset-x-1 top-[85px] h-10 rounded-xl bg-circle-charcoal dark:bg-circle-primary shadow-lg pointer-events-none z-0 border border-white/10" />

                <div
                  ref={hoursScrollRef}
                  onScroll={handleHoursScroll}
                  className="h-full w-14 overflow-y-auto snap-y snap-mandatory z-10 text-center py-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  <div className="h-[85px] shrink-0 pointer-events-none" />
                  {HOURS.map((h, idx) => {
                    const isSelected = idx === activeHour;
                    return (
                      <div
                        key={h}
                        onClick={() => handleSelectHour(idx)}
                        className={`h-10 flex items-center justify-center snap-center text-sm font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'text-white dark:text-circle-dark-canvas scale-110'
                            : 'text-circle-slate dark:text-circle-dark-muted opacity-35 hover:opacity-80 scale-90'
                        }`}
                      >
                        {h}
                      </div>
                    );
                  })}
                  <div className="h-[85px] shrink-0 pointer-events-none" />
                </div>

                <div className="z-10 font-black text-sm text-white dark:text-circle-dark-canvas pointer-events-none px-0.5">
                  :
                </div>

                <div
                  ref={minutesScrollRef}
                  onScroll={handleMinutesScroll}
                  className="h-full w-14 overflow-y-auto snap-y snap-mandatory z-10 text-center py-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  <div className="h-[85px] shrink-0 pointer-events-none" />
                  {MINUTES.map((m, idx) => {
                    const isSelected = idx === activeMinute;
                    return (
                      <div
                        key={m}
                        onClick={() => handleSelectMinute(idx)}
                        className={`h-10 flex items-center justify-center snap-center text-sm font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'text-white dark:text-circle-dark-canvas scale-110'
                            : 'text-circle-slate dark:text-circle-dark-muted opacity-35 hover:opacity-80 scale-90'
                        }`}
                      >
                        {m}
                      </div>
                    );
                  })}
                  <div className="h-[85px] shrink-0 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
