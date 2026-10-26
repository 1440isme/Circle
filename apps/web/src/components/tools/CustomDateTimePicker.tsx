'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

interface CustomDateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:mm" hoặc ""
  onChange: (val: string) => void;
  required?: boolean;
  min?: string; // "YYYY-MM-DDTHH:mm"
  placeholder?: string;
  align?: 'left' | 'right';
  className?: string;
}

const ITEM_HEIGHT = 40; // 40px mỗi slot
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  value,
  onChange,
  required = false,
  min,
  placeholder = 'dd/mm/yyyy --:--',
  align = 'left',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Phân tích value thành date ("YYYY-MM-DD") và time ("HH:mm")
  const { datePart, timePart } = useMemo(() => {
    if (!value || !value.includes('T')) {
      return { datePart: '', timePart: '00:00' };
    }
    const [d, t] = value.split('T');
    return { datePart: d, timePart: t ? t.slice(0, 5) : '00:00' };
  }, [value]);

  // Phân tích min
  const { minDatePart } = useMemo(() => {
    if (!min || !min.includes('T')) {
      return { minDatePart: '', minTimePart: '' };
    }
    const [d, t] = min.split('T');
    return { minDatePart: d, minTimePart: t ? t.slice(0, 5) : '' };
  }, [min]);

  // Hiển thị ngày dạng dd/mm/yyyy HH:mm
  const formattedDisplay = useMemo(() => {
    if (!datePart) return '';
    const parts = datePart.split('-');
    if (parts.length !== 3) return value;
    const [y, m, d] = parts;
    const timeDisplay = timePart || '00:00';
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y} ${timeDisplay}`;
  }, [datePart, timePart, value]);

  // Calendar view state
  const initialCalendarDate = useMemo(() => {
    if (datePart) {
      const [y, m, d] = datePart.split('-').map(Number);
      if (y && m && d) return new Date(y, m - 1, d);
    }
    return new Date();
  }, [datePart]);

  const [currentViewDate, setCurrentViewDate] = useState<Date>(initialCalendarDate);

  // Wheel state (24h: 00 - 23, 00 - 59)
  const [hStr, mStr] = (timePart || '00:00').split(':');
  const [activeHour, setActiveHour] = useState(parseInt(hStr || '0', 10));
  const [activeMinute, setActiveMinute] = useState(parseInt(mStr || '0', 10));

  const hoursScrollRef = useRef<HTMLDivElement>(null);
  const minutesScrollRef = useRef<HTMLDivElement>(null);

  // Sync state khi value thay đổi từ ngoài
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

  // Đóng khi click ra ngoài popover
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

  // Scroll time wheel
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

  // Tự động cuộn bánh xe giờ vào vị trí trung tâm khi mở popover
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        scrollTo(hoursScrollRef.current, activeHour, false);
        scrollTo(minutesScrollRef.current, activeMinute, false);
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeHour, activeMinute, scrollTo]);

  // Calendar calculations
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth() + 1; // 1-12

  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(year, month - 1, 1).getDay(); // 0 = Chủ nhật
  }, [year, month]);

  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(year, month, 1));
  };

  const handleSelectDay = (dayNum: number) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const newDatePart = `${year}-${pad(month)}-${pad(dayNum)}`;
    const curTime = `${pad(activeHour)}:${pad(activeMinute)}`;
    onChange(`${newDatePart}T${curTime}`);
  };

  // Wheel scroll handlers
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

  const setPresetTime = (h: number, m: number) => {
    setActiveHour(h);
    setActiveMinute(m);
    scrollTo(hoursScrollRef.current, h, true);
    scrollTo(minutesScrollRef.current, m, true);
    const newTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const d = datePart || new Date().toISOString().split('T')[0];
    onChange(`${d}T${newTime}`);
  };

  // Check if a day is disabled
  const isDayDisabled = (dayNum: number): boolean => {
    if (!minDatePart) return false;
    const pad = (n: number) => String(n).padStart(2, '0');
    const dayIso = `${year}-${pad(month)}-${pad(dayNum)}`;
    return dayIso < minDatePart;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input box trigger hiển thị dd/mm/yyyy HH:mm */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-2.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage cursor-pointer select-none transition-all ${
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
          {formattedDisplay || placeholder}
        </span>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {!required && Boolean(value) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              title="Xóa thời gian"
              className="p-0.5 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate hover:text-rose-500 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <CalendarIcon className="h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted" />
        </div>
      </div>

      {/* Popover Picker: 1 BÊN LỊCH & 1 BÊN GIỜ (Side-by-side) */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } top-full mt-1.5 z-50 w-[380px] max-w-[calc(100vw-32px)] rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Khu vực chính: 2 Cột song song */}
          <div className="flex gap-3">
            {/* CỘT BÊN TRÁI: LỊCH (Tháng, Ngày) */}
            <div className="flex-1 min-w-[210px]">
              {/* Header điều hướng tháng */}
              <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60">
                <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  Tháng {month}/{year}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate hover:text-circle-charcoal transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate hover:text-circle-charcoal transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Tên các thứ trong tuần */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d, i) => (
                  <span
                    key={d}
                    className={`text-[10px] font-bold ${
                      i === 0 ? 'text-rose-500' : 'text-circle-slate dark:text-circle-dark-muted'
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Lưới ngày */}
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
                          ? 'opacity-25 cursor-not-allowed text-circle-slate'
                          : isSelected
                          ? 'bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal font-bold shadow-xs'
                          : 'hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text'
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>

              {/* Phím tắt Hôm nay / Ngày mai */}
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const pad = (n: number) => String(n).padStart(2, '0');
                    const todayIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
                    onChange(`${todayIso}T${pad(activeHour)}:${pad(activeMinute)}`);
                  }}
                  className="text-[11px] font-semibold text-circle-sage dark:text-circle-primary hover:underline"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tmrw = new Date(Date.now() + 86400000);
                    const pad = (n: number) => String(n).padStart(2, '0');
                    const tmrwIso = `${tmrw.getFullYear()}-${pad(tmrw.getMonth() + 1)}-${pad(tmrw.getDate())}`;
                    onChange(`${tmrwIso}T${pad(activeHour)}:${pad(activeMinute)}`);
                  }}
                  className="text-[11px] font-semibold text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text"
                >
                  Ngày mai
                </button>
              </div>
            </div>

            {/* ĐƯỜNG KẺ DỌC PHÂN CHIA LỊCH VÀ GIỜ */}
            <div className="w-px bg-circle-hairline/60 dark:bg-circle-dark-hairline/60 self-stretch my-0.5" />

            {/* CỘT BÊN PHẢI: BÁNH XE GIỜ 24H (00 - 23, KHÔNG CÓ AM/PM, CỤC ĐEN CỐ ĐỊNH Ở GIỮA) */}
            <div className="w-[124px] shrink-0 flex flex-col justify-between">
              {/* Presets giờ nhanh */}
              <div className="grid grid-cols-3 gap-1 pb-1.5 border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60">
                {[
                  { label: '08:00', h: 8, m: 0 },
                  { label: '12:00', h: 12, m: 0 },
                  { label: '14:00', h: 14, m: 0 },
                  { label: '18:00', h: 18, m: 0 },
                  { label: '20:00', h: 20, m: 0 },
                  { label: '00:00', h: 0, m: 0 },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setPresetTime(p.h, p.m)}
                    className={`py-0.5 rounded-md text-[9px] font-semibold transition-colors text-center ${
                      activeHour === p.h && activeMinute === p.m
                        ? 'bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal'
                        : 'bg-circle-wash dark:bg-circle-dark-wash text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Bánh xe cuộn giờ 24h với CỤC ĐEN CỐ ĐỊNH Ở GIỮA */}
              <div className="relative h-[180px] w-full rounded-xl bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 border border-circle-hairline/60 dark:border-circle-dark-hairline/60 overflow-hidden flex justify-center items-center select-none my-1">
                {/* CỤC ĐEN CỐ ĐỊNH LƯỚT GIỜ */}
                <div className="absolute inset-x-1.5 top-[70px] h-10 rounded-xl bg-circle-charcoal dark:bg-circle-primary shadow-lg pointer-events-none z-0 border border-white/10" />

                {/* Cột Giờ 24h (00 - 23) */}
                <div
                  ref={hoursScrollRef}
                  onScroll={handleHoursScroll}
                  className="h-full w-14 overflow-y-auto snap-y snap-mandatory scrollbar-none z-10 text-center py-0"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  <div className="h-[70px] shrink-0 pointer-events-none" />
                  {HOURS.map((h, idx) => {
                    const isSelected = idx === activeHour;
                    return (
                      <div
                        key={h}
                        onClick={() => handleSelectHour(idx)}
                        className={`h-10 flex items-center justify-center snap-center text-sm font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'text-white dark:text-circle-charcoal scale-110'
                            : 'text-circle-slate dark:text-circle-dark-muted opacity-30 hover:opacity-80 scale-90'
                        }`}
                      >
                        {h}
                      </div>
                    );
                  })}
                  <div className="h-[70px] shrink-0 pointer-events-none" />
                </div>

                {/* Dấu hai chấm cố định */}
                <div className="z-10 font-black text-sm text-white dark:text-circle-charcoal pointer-events-none px-0.5">
                  :
                </div>

                {/* Cột Phút (00 - 59) */}
                <div
                  ref={minutesScrollRef}
                  onScroll={handleMinutesScroll}
                  className="h-full w-14 overflow-y-auto snap-y snap-mandatory scrollbar-none z-10 text-center py-0"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  <div className="h-[70px] shrink-0 pointer-events-none" />
                  {MINUTES.map((m, idx) => {
                    const isSelected = idx === activeMinute;
                    return (
                      <div
                        key={m}
                        onClick={() => handleSelectMinute(idx)}
                        className={`h-10 flex items-center justify-center snap-center text-sm font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'text-white dark:text-circle-charcoal scale-110'
                            : 'text-circle-slate dark:text-circle-dark-muted opacity-30 hover:opacity-80 scale-90'
                        }`}
                      >
                        {m}
                      </div>
                    );
                  })}
                  <div className="h-[70px] shrink-0 pointer-events-none" />
                </div>
              </div>

              {/* Chú thích phía dưới cột giờ */}
              <div className="text-center">
                <span className="text-[9px] text-circle-slate dark:text-circle-dark-muted">
                  Giờ 24h
                </span>
              </div>
            </div>
          </div>

          {/* Thanh Footer: Hiển thị giá trị & Nút Xong */}
          <div className="pt-2.5 mt-2.5 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-circle-charcoal dark:text-circle-dark-text font-semibold">
              <Clock className="h-3.5 w-3.5 text-circle-sage dark:text-circle-primary" />
              <span>{formattedDisplay || 'dd/mm/yyyy --:--'}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 rounded-lg bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal px-3 py-1 text-xs font-semibold hover:bg-circle-sage transition-all shadow-xs"
            >
              <Check className="h-3 w-3" />
              <span>Xong</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
