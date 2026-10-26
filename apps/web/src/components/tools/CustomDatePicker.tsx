'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (isoDate: string) => void;
  label?: string;
  minDate?: string; // "YYYY-MM-DD"
  disabled?: boolean;
}

// Convert "YYYY-MM-DD" to "DD/MM/YYYY"
export function toDisplayDate(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
}

// Convert "DD/MM/YYYY" to "YYYY-MM-DD"
export function toIsoDate(display: string): string {
  if (!display) return '';
  const parts = display.split('/');
  if (parts.length !== 3) return display;
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  label,
  minDate,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current date
  const parsedDate = useMemo(() => {
    if (!value) return new Date();
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d);
  }, [value]);

  const [currentViewDate, setCurrentViewDate] = useState<Date>(parsedDate);
  const [textInputVal, setTextInputVal] = useState(toDisplayDate(value));

  // Sync state when prop value changes
  useEffect(() => {
    setTextInputVal(toDisplayDate(value));
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      if (y && m && d) {
        setCurrentViewDate(new Date(y, m - 1, d));
      }
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth() + 1; // 1-12

  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(year, month - 1, 1).getDay(); // 0 = Sunday
  }, [year, month]);

  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(year, month, 1));
  };

  const handleSelectDay = (dayNum: number) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const newIso = `${year}-${pad(month)}-${pad(dayNum)}`;
    onChange(newIso);
    setIsOpen(false);
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextInputVal(val);
    // If user typed valid "DD/MM/YYYY"
    const match = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      const d = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const y = parseInt(match[3], 10);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 2000 && y <= 2100) {
        const pad = (n: number) => String(n).padStart(2, '0');
        const newIso = `${y}-${pad(m)}-${pad(d)}`;
        onChange(newIso);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
          {label}
        </label>
      )}

      {/* Input showing formatted date DD/MM/YYYY */}
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          value={textInputVal}
          onChange={handleTextInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="DD/MM/YYYY"
          className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas pl-3 pr-8 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text font-bold tracking-wide focus:outline-hidden focus:ring-1 focus:ring-circle-sage disabled:opacity-50"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2.5 top-2.5 text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text cursor-pointer"
        >
          <CalendarIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-2xl p-3 w-64 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60 mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
              Tháng {month}, {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-circle-slate dark:text-circle-dark-muted pb-1">
            <span>CN</span>
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-7 opacity-0" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const pad = (n: number) => String(n).padStart(2, '0');
              const thisIso = `${year}-${pad(month)}-${pad(dayNum)}`;
              const isSelected = value === thisIso;

              const isPast = minDate && thisIso < minDate;

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  disabled={Boolean(isPast)}
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-7 w-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal font-bold shadow-xs'
                      : isPast
                      ? 'opacity-25 cursor-not-allowed text-circle-slate'
                      : 'hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Quick presets footer */}
          <div className="flex items-center justify-between pt-2 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60 mt-2">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const pad = (n: number) => String(n).padStart(2, '0');
                onChange(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
                setIsOpen(false);
              }}
              className="text-[10px] font-semibold text-circle-sage dark:text-circle-primary hover:underline"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const pad = (n: number) => String(n).padStart(2, '0');
                onChange(`${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`);
                setIsOpen(false);
              }}
              className="text-[10px] font-semibold text-circle-slate dark:text-circle-dark-muted hover:underline"
            >
              Ngày mai
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
