'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X, Check } from 'lucide-react';

interface CustomDateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:mm" hoặc "YYYY-MM-DD" hoặc ""
  onChange: (val: string) => void;
  required?: boolean;
  min?: string; // "YYYY-MM-DDTHH:mm" hoặc "YYYY-MM-DD"
  placeholder?: string;
  align?: 'left' | 'right';
  className?: string;
  dateOnly?: boolean; // Khi chỉ chọn ngày, không có phần giờ
}

const ITEM_HEIGHT = 40; // 40px mỗi slot

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const MONTH_NAMES = Array.from({ length: 12 }, (_, i) => `Tháng ${String(i + 1).padStart(2, '0')}`);
const START_YEAR = 1950;
const END_YEAR = 2100;
const YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);

const pad = (n: number) => String(n).padStart(2, '0');
const formatLocalDateKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  value,
  onChange,
  required = false,
  min,
  placeholder,
  align = 'left',
  className = '',
  dateOnly = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMonthYearOpen, setIsMonthYearOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const effectivePlaceholder = placeholder || (dateOnly ? 'dd/mm/yyyy' : 'dd/mm/yyyy --:--');

  // Phân tích value thành date ("YYYY-MM-DD") và time ("HH:mm")
  const { datePart, timePart } = useMemo(() => {
    if (!value) {
      return { datePart: '', timePart: '00:00' };
    }
    if (value.includes('T')) {
      const [d, t] = value.split('T');
      return { datePart: d, timePart: t ? t.slice(0, 5) : '00:00' };
    }
    return { datePart: value, timePart: '00:00' };
  }, [value]);

  // Phân tích min
  const { minDatePart } = useMemo(() => {
    if (!min) {
      return { minDatePart: '', minTimePart: '' };
    }
    if (min.includes('T')) {
      const [d, t] = min.split('T');
      return { minDatePart: d, minTimePart: t ? t.slice(0, 5) : '' };
    }
    return { minDatePart: min, minTimePart: '' };
  }, [min]);

  // Hiển thị ngày dạng dd/mm/yyyy (hoặc dd/mm/yyyy HH:mm nếu có giờ)
  const formattedDisplay = useMemo(() => {
    if (!datePart) return '';
    const parts = datePart.split('-');
    if (parts.length !== 3) return value;
    const [y, m, d] = parts;
    if (dateOnly) {
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    const timeDisplay = timePart || '00:00';
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y} ${timeDisplay}`;
  }, [datePart, timePart, value, dateOnly]);

  // Calendar view date (chỉ dùng cho năm và tháng hiển thị trên lưới lịch)
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
  const monthsScrollRef = useRef<HTMLDivElement>(null);
  const yearsScrollRef = useRef<HTMLDivElement>(null);

  // Khóa chống scroll ảo / scroll tự động kích hoạt onChange làm nhảy giờ/năm
  const isProgrammaticScrollRef = useRef(false);

  // Debounce timers cho scroll thủ công
  const hourScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minuteScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const monthScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const yearScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Dọn dẹp timers khi unmount
  useEffect(() => {
    return () => {
      if (hourScrollTimerRef.current) clearTimeout(hourScrollTimerRef.current);
      if (minuteScrollTimerRef.current) clearTimeout(minuteScrollTimerRef.current);
      if (monthScrollTimerRef.current) clearTimeout(monthScrollTimerRef.current);
      if (yearScrollTimerRef.current) clearTimeout(yearScrollTimerRef.current);
    };
  }, []);

  // Đóng khi click ra ngoài popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsMonthYearOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Calendar calculations
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth() + 1; // 1-12

  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(year, month - 1, 1).getDay(); // 0 = Chủ nhật
  }, [year, month]);

  // Định vị bánh xe Giờ & Phút NGAY LẬP TỨC khi mở popover (KHÔNG scroll animation từ 0)
  useEffect(() => {
    if (isOpen && !dateOnly) {
      isProgrammaticScrollRef.current = true;
      const timer = setTimeout(() => {
        if (hoursScrollRef.current) {
          hoursScrollRef.current.scrollTop = activeHour * ITEM_HEIGHT;
        }
        if (minutesScrollRef.current) {
          minutesScrollRef.current.scrollTop = activeMinute * ITEM_HEIGHT;
        }
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 60);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen, dateOnly]);

  // Định vị bánh xe Tháng & Năm NGAY LẬP TỨC khi mở chọn Tháng & Năm
  useEffect(() => {
    if (isMonthYearOpen) {
      isProgrammaticScrollRef.current = true;
      const timer = setTimeout(() => {
        if (monthsScrollRef.current) {
          monthsScrollRef.current.scrollTop = (month - 1) * ITEM_HEIGHT;
        }
        if (yearsScrollRef.current) {
          const yIdx = Math.max(0, Math.min(YEARS.length - 1, year - START_YEAR));
          yearsScrollRef.current.scrollTop = yIdx * ITEM_HEIGHT;
        }
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 60);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isMonthYearOpen]);

  const handleSelectDay = (dayNum: number) => {
    if (isDayDisabled(dayNum)) return;
    const newDatePart = `${year}-${pad(month)}-${pad(dayNum)}`;
    if (dateOnly) {
      onChange(newDatePart);
      setIsOpen(false);
      return;
    }
    const curTime = `${pad(activeHour)}:${pad(activeMinute)}`;
    onChange(`${newDatePart}T${curTime}`);
  };

  // Cuộn & chọn Tháng (thủ công bằng chuột / vuốt chạm)
  const handleMonthScroll = () => {
    if (isProgrammaticScrollRef.current || !monthsScrollRef.current) return;
    if (monthScrollTimerRef.current) clearTimeout(monthScrollTimerRef.current);
    monthScrollTimerRef.current = setTimeout(() => {
      if (!monthsScrollRef.current || isProgrammaticScrollRef.current) return;
      const scrollTop = monthsScrollRef.current.scrollTop;
      const idx = Math.min(11, Math.max(0, Math.round(scrollTop / ITEM_HEIGHT)));
      if (idx !== month - 1) {
        const targetMonth = idx + 1;
        const daysInTargetMonth = new Date(year, targetMonth, 0).getDate();
        const currentDay = datePart ? parseInt(datePart.split('-')[2], 10) : 1;
        const targetDay = Math.min(currentDay, daysInTargetMonth);
        setCurrentViewDate(new Date(year, idx, targetDay));

        const newDatePart = `${year}-${pad(targetMonth)}-${pad(targetDay)}`;
        if (dateOnly) {
          onChange(newDatePart);
        } else {
          onChange(`${newDatePart}T${pad(activeHour)}:${pad(activeMinute)}`);
        }
      }
    }, 90);
  };

  // Cuộn & chọn Năm (thủ công bằng chuột / vuốt chạm)
  const handleYearScroll = () => {
    if (isProgrammaticScrollRef.current || !yearsScrollRef.current) return;
    if (yearScrollTimerRef.current) clearTimeout(yearScrollTimerRef.current);
    yearScrollTimerRef.current = setTimeout(() => {
      if (!yearsScrollRef.current || isProgrammaticScrollRef.current) return;
      const scrollTop = yearsScrollRef.current.scrollTop;
      const idx = Math.min(YEARS.length - 1, Math.max(0, Math.round(scrollTop / ITEM_HEIGHT)));
      const targetYear = YEARS[idx];
      if (targetYear !== undefined && targetYear !== year) {
        const daysInTargetMonth = new Date(targetYear, month, 0).getDate();
        const currentDay = datePart ? parseInt(datePart.split('-')[2], 10) : 1;
        const targetDay = Math.min(currentDay, daysInTargetMonth);
        setCurrentViewDate(new Date(targetYear, month - 1, targetDay));

        const newDatePart = `${targetYear}-${pad(month)}-${pad(targetDay)}`;
        if (dateOnly) {
          onChange(newDatePart);
        } else {
          onChange(`${newDatePart}T${pad(activeHour)}:${pad(activeMinute)}`);
        }
      }
    }, 90);
  };

  const handleSelectMonth = (mIdx: number) => {
    isProgrammaticScrollRef.current = true;
    if (monthsScrollRef.current) {
      monthsScrollRef.current.scrollTo({ top: mIdx * ITEM_HEIGHT, behavior: 'smooth' });
    }
    const targetMonth = mIdx + 1;
    const daysInTargetMonth = new Date(year, targetMonth, 0).getDate();
    const currentDay = datePart ? parseInt(datePart.split('-')[2], 10) : 1;
    const targetDay = Math.min(currentDay, daysInTargetMonth);
    setCurrentViewDate(new Date(year, mIdx, targetDay));

    const newDatePart = `${year}-${pad(targetMonth)}-${pad(targetDay)}`;
    if (dateOnly) {
      onChange(newDatePart);
    } else {
      onChange(`${newDatePart}T${pad(activeHour)}:${pad(activeMinute)}`);
    }
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 250);
  };

  const handleSelectYear = (targetYear: number) => {
    isProgrammaticScrollRef.current = true;
    const yIdx = targetYear - START_YEAR;
    if (yearsScrollRef.current) {
      yearsScrollRef.current.scrollTo({ top: yIdx * ITEM_HEIGHT, behavior: 'smooth' });
    }
    const daysInTargetMonth = new Date(targetYear, month, 0).getDate();
    const currentDay = datePart ? parseInt(datePart.split('-')[2], 10) : 1;
    const targetDay = Math.min(currentDay, daysInTargetMonth);
    setCurrentViewDate(new Date(targetYear, month - 1, targetDay));

    const newDatePart = `${targetYear}-${pad(month)}-${pad(targetDay)}`;
    if (dateOnly) {
      onChange(newDatePart);
    } else {
      onChange(`${newDatePart}T${pad(activeHour)}:${pad(activeMinute)}`);
    }
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 250);
  };

  // Wheel scroll handlers cho Giờ & Phút (thủ công)
  const handleHoursScroll = () => {
    if (isProgrammaticScrollRef.current || !hoursScrollRef.current) return;
    if (hourScrollTimerRef.current) clearTimeout(hourScrollTimerRef.current);
    hourScrollTimerRef.current = setTimeout(() => {
      if (!hoursScrollRef.current || isProgrammaticScrollRef.current) return;
      const scrollTop = hoursScrollRef.current.scrollTop;
      const idx = Math.min(23, Math.max(0, Math.round(scrollTop / ITEM_HEIGHT)));
      if (idx !== activeHour) {
        setActiveHour(idx);
        const newTime = `${pad(idx)}:${pad(activeMinute)}`;
        const d = datePart || formatLocalDateKey(new Date());
        onChange(`${d}T${newTime}`);
      }
    }, 90);
  };

  const handleMinutesScroll = () => {
    if (isProgrammaticScrollRef.current || !minutesScrollRef.current) return;
    if (minuteScrollTimerRef.current) clearTimeout(minuteScrollTimerRef.current);
    minuteScrollTimerRef.current = setTimeout(() => {
      if (!minutesScrollRef.current || isProgrammaticScrollRef.current) return;
      const scrollTop = minutesScrollRef.current.scrollTop;
      const idx = Math.min(59, Math.max(0, Math.round(scrollTop / ITEM_HEIGHT)));
      if (idx !== activeMinute) {
        setActiveMinute(idx);
        const newTime = `${pad(activeHour)}:${pad(idx)}`;
        const d = datePart || formatLocalDateKey(new Date());
        onChange(`${d}T${newTime}`);
      }
    }, 90);
  };

  const handleSelectHour = (h: number) => {
    isProgrammaticScrollRef.current = true;
    setActiveHour(h);
    if (hoursScrollRef.current) {
      hoursScrollRef.current.scrollTo({ top: h * ITEM_HEIGHT, behavior: 'smooth' });
    }
    const newTime = `${pad(h)}:${pad(activeMinute)}`;
    const d = datePart || formatLocalDateKey(new Date());
    onChange(`${d}T${newTime}`);
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 250);
  };

  const handleSelectMinute = (m: number) => {
    isProgrammaticScrollRef.current = true;
    setActiveMinute(m);
    if (minutesScrollRef.current) {
      minutesScrollRef.current.scrollTo({ top: m * ITEM_HEIGHT, behavior: 'smooth' });
    }
    const newTime = `${pad(activeHour)}:${pad(m)}`;
    const d = datePart || formatLocalDateKey(new Date());
    onChange(`${d}T${newTime}`);
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 250);
  };

  // Check if a day is disabled
  const isDayDisabled = (dayNum: number): boolean => {
    if (!minDatePart) return false;
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
          {formattedDisplay || effectivePlaceholder}
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

      {/* Popover Picker */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } top-full mt-1.5 z-50 ${
            dateOnly ? 'w-[280px]' : 'w-[390px]'
          } max-w-[calc(100vw-32px)] rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Khu vực chính */}
          <div className="flex gap-3 items-stretch">
            {/* CỘT BÊN TRÁI: LỊCH (Tháng, Năm, Ngày) */}
            <div className="flex-1 min-w-[210px] flex flex-col justify-between">
              {/* Header Tháng / Năm ghi chung với nút sổ lên sổ xuống */}
              <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60">
                <button
                  type="button"
                  onClick={() => setIsMonthYearOpen(!isMonthYearOpen)}
                  title={isMonthYearOpen ? 'Thu gọn về lịch ngày' : 'Sổ xuống chọn Tháng & Năm'}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors cursor-pointer group"
                >
                  <span>Tháng {month}/{year}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-circle-slate group-hover:text-circle-charcoal dark:group-hover:text-circle-dark-text transition-transform duration-200 ${
                      isMonthYearOpen ? 'rotate-180 text-circle-sage dark:text-circle-primary' : ''
                    }`}
                  />
                </button>

                <div className="flex items-center gap-1">
                  {!isMonthYearOpen && (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrentViewDate(new Date(year, month - 2, 1))}
                        className="p-1 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate hover:text-circle-charcoal transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentViewDate(new Date(year, month, 1))}
                        className="p-1 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate hover:text-circle-charcoal transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {dateOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setIsMonthYearOpen(false);
                      }}
                      className="p-1 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate hover:text-circle-charcoal transition-colors"
                      title="Xong"
                    >
                      <Check className="h-3.5 w-3.5 text-teal-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* KHI SỔ XUỐNG: BÁNH XE THÁNG VÀ NĂM CÓ CỤC ĐEN CỐ ĐỊNH, ẨN TOÀN BỘ THANH CUỘN */}
              {isMonthYearOpen ? (
                <div className="relative h-[210px] w-full overflow-hidden flex justify-center items-center select-none">
                  {/* CỤC ĐEN CỐ ĐỊNH Ở CHÍNH GIỮA */}
                  <div className="absolute inset-x-1 top-[85px] h-10 rounded-xl bg-circle-charcoal dark:bg-circle-primary shadow-lg pointer-events-none z-0 border border-white/10" />

                  {/* Cột Tháng (Tháng 01 - Tháng 12) - ẨN 100% THANH CUỘN */}
                  <div
                    ref={monthsScrollRef}
                    onScroll={handleMonthScroll}
                    className="h-full w-24 overflow-y-auto snap-y snap-mandatory z-10 text-center py-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  >
                    <div className="h-[85px] shrink-0 pointer-events-none" />
                    {MONTH_NAMES.map((mName, idx) => {
                      const isSelected = idx === month - 1;
                      return (
                        <div
                          key={mName}
                          onClick={() => handleSelectMonth(idx)}
                          className={`h-10 flex items-center justify-center snap-center text-sm font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'text-white dark:text-circle-charcoal scale-105'
                              : 'text-circle-slate dark:text-circle-dark-muted opacity-30 hover:opacity-80 scale-90'
                          }`}
                        >
                          {mName}
                        </div>
                      );
                    })}
                    <div className="h-[85px] shrink-0 pointer-events-none" />
                  </div>

                  {/* Dấu gạch chéo phân cách */}
                  <div className="z-10 font-bold text-sm text-white/70 dark:text-circle-charcoal/70 pointer-events-none px-1">
                    /
                  </div>

                  {/* Cột Năm (Cố định từ START_YEAR đến END_YEAR) - ẨN 100% THANH CUỘN */}
                  <div
                    ref={yearsScrollRef}
                    onScroll={handleYearScroll}
                    className="h-full w-20 overflow-y-auto snap-y snap-mandatory z-10 text-center py-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  >
                    <div className="h-[85px] shrink-0 pointer-events-none" />
                    {YEARS.map((y) => {
                      const isSelected = y === year;
                      return (
                        <div
                          key={y}
                          onClick={() => handleSelectYear(y)}
                          className={`h-10 flex items-center justify-center snap-center text-sm font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'text-white dark:text-circle-charcoal scale-105'
                              : 'text-circle-slate dark:text-circle-dark-muted opacity-30 hover:opacity-80 scale-90'
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
                /* CHẾ ĐỘ XEM NGÀY (Lưới lịch tiêu chuẩn) */
                <div className="h-[210px] flex flex-col justify-start">
                  <div>
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
                  </div>
                </div>
              )}
            </div>

            {!dateOnly && (
              <>
                {/* ĐƯỜNG KẺ DỌC PHÂN CHIA LỊCH VÀ GIỜ */}
                <div className="w-px bg-circle-hairline/60 dark:bg-circle-dark-hairline/60 self-stretch my-0.5" />

                {/* CỘT BÊN PHẢI: BÁNH XE GIỜ 24H (KHÔNG KHUNG BO, KHÔNG THANH CUỘN, KHÔNG GỢI Ý, CỤC ĐEN CỐ ĐỊNH) */}
                <div className="w-[120px] shrink-0 flex flex-col justify-between">
                  {/* Header góc trên bên phải: Nút Xong */}
                  <div className="flex items-center justify-end pb-2 mb-1.5 border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setIsMonthYearOpen(false);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal px-2.5 py-0.5 text-xs font-semibold hover:bg-circle-sage transition-all shadow-xs"
                    >
                      <Check className="h-3 w-3" />
                      <span>Xong</span>
                    </button>
                  </div>

                  {/* Vùng bánh xe tinh gọn không viền hộp */}
                  <div className="relative h-[210px] w-full overflow-hidden flex justify-center items-center select-none">
                    {/* CỤC ĐEN CỐ ĐỊNH LƯỚT GIỜ Ở CHÍNH GIỮA */}
                    <div className="absolute inset-x-1 top-[85px] h-10 rounded-xl bg-circle-charcoal dark:bg-circle-primary shadow-lg pointer-events-none z-0 border border-white/10" />

                    {/* Cột Giờ 24h (00 - 23) - ẨN 100% THANH CUỘN */}
                    <div
                      ref={hoursScrollRef}
                      onScroll={handleHoursScroll}
                      className="h-full w-14 overflow-y-auto snap-y snap-mandatory z-10 text-center py-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
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
                                ? 'text-white dark:text-circle-charcoal scale-110'
                                : 'text-circle-slate dark:text-circle-dark-muted opacity-30 hover:opacity-80 scale-90'
                            }`}
                          >
                            {h}
                          </div>
                        );
                      })}
                      <div className="h-[85px] shrink-0 pointer-events-none" />
                    </div>

                    {/* Dấu hai chấm cố định */}
                    <div className="z-10 font-black text-sm text-white dark:text-circle-charcoal pointer-events-none px-0.5">
                      :
                    </div>

                    {/* Cột Phút (00 - 59) - ẨN 100% THANH CUỘN */}
                    <div
                      ref={minutesScrollRef}
                      onScroll={handleMinutesScroll}
                      className="h-full w-14 overflow-y-auto snap-y snap-mandatory z-10 text-center py-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
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
                                ? 'text-white dark:text-circle-charcoal scale-110'
                                : 'text-circle-slate dark:text-circle-dark-muted opacity-30 hover:opacity-80 scale-90'
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
