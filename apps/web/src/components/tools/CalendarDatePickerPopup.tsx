'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { formatDateKey } from './calendar-recurrence';

interface CalendarDatePickerPopupProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  placeholder?: string;
  onClose?: () => void;
}

export const CalendarDatePickerPopup: React.FC<CalendarDatePickerPopupProps> = ({
  value,
  onChange,
  minDate,
  placeholder = 'Chọn ngày kết thúc',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = value || minDate || new Date();
  const [viewDate, setViewDate] = useState<Date>(initialDate);

  // Sync view date if value changes
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value));
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

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1; // 1-12

  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  const firstDayOfWeek = useMemo(() => {
    const day = new Date(year, month - 1, 1).getDay();
    return day === 0 ? 6 : day - 1; // 0 = Thứ Hai, 6 = Chủ Nhật
  }, [year, month]);

  const todayKey = formatDateKey(new Date());
  const selectedKey = value ? formatDateKey(value) : '';
  const minKey = minDate ? formatDateKey(minDate) : '';

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month, 1));
  };

  const handleSelectDay = (day: number) => {
    const targetDate = new Date(year, month - 1, day, 23, 59, 59);
    onChange(targetDate);
    setIsOpen(false);
  };

  const handleQuickPreset = (offsetMonths: number) => {
    const base = minDate || new Date();
    const d = new Date(base.getFullYear(), base.getMonth() + offsetMonths, base.getDate(), 23, 59, 59);
    onChange(d);
    setViewDate(d);
    setIsOpen(false);
  };

  const formattedDisplay = value
    ? `${String(value.getDate()).padStart(2, '0')}/${String(value.getMonth() + 1).padStart(2, '0')}/${value.getFullYear()}`
    : '';

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      {/* Trigger pill/button */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-all active:scale-95 cursor-pointer ${
            isOpen
              ? 'border-circle-primary ring-2 ring-circle-primary/20 bg-circle-wash dark:bg-circle-dark-wash'
              : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:border-circle-primary/60'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-3.5 w-3.5 text-circle-primary shrink-0" />
            <span
              className={
                formattedDisplay
                  ? 'font-bold text-circle-charcoal dark:text-circle-dark-text'
                  : 'text-circle-slate dark:text-circle-dark-muted font-normal'
              }
            >
              {formattedDisplay || placeholder}
            </span>
          </div>

          <span className="text-[10px] uppercase font-bold text-circle-sage dark:text-circle-dark-primary tracking-wider">
            {isOpen ? 'Đóng' : 'Chọn ngày'}
          </span>
        </button>

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
            }}
            title="Xóa ngày kết thúc"
            className="p-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline hover:bg-rose-50 hover:border-rose-200 text-circle-slate hover:text-rose-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Calendar Popup */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-72 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-xl p-3 animate-in fade-in zoom-in-95 duration-150">
          {/* Header navigation */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate hover:text-circle-charcoal transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
              Tháng {month} / {year}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate hover:text-circle-charcoal transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-circle-slate dark:text-circle-dark-muted mb-1">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
              <div key={d} className="h-6 flex items-center justify-center">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-7" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(year, month - 1, day);
              const key = formatDateKey(dateObj);
              const isSelected = key === selectedKey;
              const isToday = key === todayKey;
              const isDisabled = minKey ? key < minKey : false;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 rounded-lg text-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-circle-primary text-white font-bold shadow-2xs'
                      : isToday
                      ? 'border border-circle-primary text-circle-sage dark:text-circle-dark-primary font-bold hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                      : isDisabled
                      ? 'opacity-25 cursor-not-allowed text-circle-slate'
                      : 'text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick presets */}
          <div className="mt-3 pt-2 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
            <div className="text-[10px] font-semibold text-circle-slate dark:text-circle-dark-muted mb-1.5">
              Gợi ý nhanh:
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => handleQuickPreset(1)}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-circle-wash dark:bg-circle-dark-canvas hover:bg-circle-primary/10 hover:text-circle-sage dark:hover:text-circle-dark-primary text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-95 cursor-pointer"
              >
                1 tháng
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(3)}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-circle-wash dark:bg-circle-dark-canvas hover:bg-circle-primary/10 hover:text-circle-sage dark:hover:text-circle-dark-primary text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-95 cursor-pointer"
              >
                3 tháng
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(6)}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-circle-wash dark:bg-circle-dark-canvas hover:bg-circle-primary/10 hover:text-circle-sage dark:hover:text-circle-dark-primary text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-95 cursor-pointer"
              >
                6 tháng
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(12)}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-circle-wash dark:bg-circle-dark-canvas hover:bg-circle-primary/10 hover:text-circle-sage dark:hover:text-circle-dark-primary text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-95 cursor-pointer"
              >
                1 năm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
