'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Check, ChevronUp, ChevronDown } from 'lucide-react';

interface TimeWheelPickerProps {
  value: string; // "HH:mm" (24-hour format, e.g. "14:30" or "00:00")
  onChange: (time: string) => void;
  label?: string;
  disabled?: boolean;
}

const ITEM_HEIGHT = 40; // 40px per slot
const VISIBLE_ITEMS = 5;
const PADDING_ITEMS = Math.floor(VISIBLE_ITEMS / 2); // 2 items = 80px
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 200px

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export const TimeWheelPicker: React.FC<TimeWheelPickerProps> = ({
  value,
  onChange,
  label,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoursScrollRef = useRef<HTMLDivElement>(null);
  const minutesScrollRef = useRef<HTMLDivElement>(null);

  // Parse current hour and minute from value (defaults to "00:00")
  const [hStr, mStr] = (value || '00:00').split(':');
  const currentHour = parseInt(hStr || '0', 10);
  const currentMinute = parseInt(mStr || '0', 10);

  const [activeHour, setActiveHour] = useState(isNaN(currentHour) ? 0 : currentHour);
  const [activeMinute, setActiveMinute] = useState(isNaN(currentMinute) ? 0 : currentMinute);

  const isScrollingRef = useRef(false);

  // Sync state when prop value changes
  useEffect(() => {
    const [h, m] = (value || '00:00').split(':');
    const nh = parseInt(h || '0', 10);
    const nm = parseInt(m || '0', 10);
    if (!isNaN(nh)) setActiveHour(nh);
    if (!isNaN(nm)) setActiveMinute(nm);
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

  // Programmatically scroll column to index
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

  // When modal opens, center the current active time immediately
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        scrollTo(hoursScrollRef.current, activeHour, false);
        scrollTo(minutesScrollRef.current, activeMinute, false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeHour, activeMinute, scrollTo]);

  // Handle hours scroll
  const handleHoursScroll = () => {
    if (!hoursScrollRef.current) return;
    const scrollTop = hoursScrollRef.current.scrollTop;
    const idx = Math.min(23, Math.max(0, Math.round(scrollTop / ITEM_HEIGHT)));
    if (idx !== activeHour) {
      setActiveHour(idx);
      const newTime = `${String(idx).padStart(2, '0')}:${String(activeMinute).padStart(2, '0')}`;
      onChange(newTime);
    }
  };

  // Handle minutes scroll
  const handleMinutesScroll = () => {
    if (!minutesScrollRef.current) return;
    const scrollTop = minutesScrollRef.current.scrollTop;
    const idx = Math.min(59, Math.max(0, Math.round(scrollTop / ITEM_HEIGHT)));
    if (idx !== activeMinute) {
      setActiveMinute(idx);
      const newTime = `${String(activeHour).padStart(2, '0')}:${String(idx).padStart(2, '0')}`;
      onChange(newTime);
    }
  };

  const handleSelectHour = (h: number) => {
    setActiveHour(h);
    scrollTo(hoursScrollRef.current, h, true);
    onChange(`${String(h).padStart(2, '0')}:${String(activeMinute).padStart(2, '0')}`);
  };

  const handleSelectMinute = (m: number) => {
    setActiveMinute(m);
    scrollTo(minutesScrollRef.current, m, true);
    onChange(`${String(activeHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  const setPreset = (h: number, m: number) => {
    setActiveHour(h);
    setActiveMinute(m);
    scrollTo(hoursScrollRef.current, h, true);
    scrollTo(minutesScrollRef.current, m, true);
    onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  const displayTime = `${String(activeHour).padStart(2, '0')}:${String(activeMinute).padStart(2, '0')}`;

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
          {label}
        </label>
      )}

      {/* Button trigger showing 24h formatted time */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text hover:border-circle-sage transition-all focus:outline-hidden focus:ring-1 focus:ring-circle-sage cursor-pointer disabled:opacity-50"
      >
        <span className="font-bold tracking-wider text-sm">{displayTime}</span>
        <Clock className="h-4 w-4 text-circle-slate dark:text-circle-dark-muted shrink-0" />
      </button>

      {/* 24-Hour Drum-Roll Wheel Picker Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60 mb-2">
            <span className="text-[11px] font-bold text-circle-slate dark:text-circle-dark-muted uppercase tracking-wider">
              Chọn giờ (24 giờ)
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal">
              {displayTime}
            </span>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1 pb-2 overflow-x-auto scrollbar-none mb-1">
            {[
              { label: '00:00', h: 0, m: 0 },
              { label: '08:00', h: 8, m: 0 },
              { label: '12:00', h: 12, m: 0 },
              { label: '14:00', h: 14, m: 0 },
              { label: '18:00', h: 18, m: 0 },
              { label: '20:00', h: 20, m: 0 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setPreset(p.h, p.m)}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition-colors shrink-0 ${
                  activeHour === p.h && activeMinute === p.m
                    ? 'bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal'
                    : 'bg-circle-wash dark:bg-circle-dark-wash text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Wheel Picker Stage (Height: 200px, 5 slots visible) */}
          <div className="relative h-[200px] w-full rounded-xl bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 border border-circle-hairline/60 dark:border-circle-dark-hairline/60 overflow-hidden flex justify-center items-center select-none">
            {/* The Fixed Dark Center Selection Box ("Cục đen cố định") */}
            <div className="absolute inset-x-3 top-[80px] h-10 rounded-xl bg-circle-charcoal dark:bg-circle-primary shadow-lg pointer-events-none z-0 border border-white/10" />

            {/* Hours Column (00 - 23) */}
            <div
              ref={hoursScrollRef}
              onScroll={handleHoursScroll}
              className="h-full w-24 overflow-y-auto snap-y snap-mandatory scrollbar-none z-10 text-center py-0"
              style={{ scrollBehavior: 'smooth' }}
            >
              {/* Top Padding so index 0 centers in middle */}
              <div className="h-[80px] shrink-0 pointer-events-none" />
              {HOURS.map((h, idx) => {
                const isSelected = idx === activeHour;
                return (
                  <div
                    key={h}
                    onClick={() => handleSelectHour(idx)}
                    className={`h-10 flex items-center justify-center snap-center text-base font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'text-white dark:text-circle-charcoal scale-110'
                        : 'text-circle-slate dark:text-circle-dark-muted opacity-30 hover:opacity-80 scale-90'
                    }`}
                  >
                    {h}
                  </div>
                );
              })}
              {/* Bottom Padding */}
              <div className="h-[80px] shrink-0 pointer-events-none" />
            </div>

            {/* Fixed Separator */}
            <div className="z-10 font-black text-xl text-white dark:text-circle-charcoal pointer-events-none px-1">
              :
            </div>

            {/* Minutes Column (00 - 59) */}
            <div
              ref={minutesScrollRef}
              onScroll={handleMinutesScroll}
              className="h-full w-24 overflow-y-auto snap-y snap-mandatory scrollbar-none z-10 text-center py-0"
              style={{ scrollBehavior: 'smooth' }}
            >
              {/* Top Padding */}
              <div className="h-[80px] shrink-0 pointer-events-none" />
              {MINUTES.map((m, idx) => {
                const isSelected = idx === activeMinute;
                return (
                  <div
                    key={m}
                    onClick={() => handleSelectMinute(idx)}
                    className={`h-10 flex items-center justify-center snap-center text-base font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'text-white dark:text-circle-charcoal scale-110'
                        : 'text-circle-slate dark:text-circle-dark-muted opacity-30 hover:opacity-80 scale-90'
                    }`}
                  >
                    {m}
                  </div>
                );
              })}
              {/* Bottom Padding */}
              <div className="h-[80px] shrink-0 pointer-events-none" />
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-2.5 flex items-center justify-between">
            <span className="text-[10px] text-circle-slate dark:text-circle-dark-muted">
              Lướt hoặc bấm vào số để chọn
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 rounded-lg bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal px-3 py-1 text-xs font-semibold hover:bg-circle-sage transition-all"
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
