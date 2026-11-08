'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Info, Repeat } from 'lucide-react';
import {
  RecurrenceConfig,
  RecurrenceFrequency,
  MonthlyType,
  YearlyType,
  NthWeekdayOrder,
  formatRecurrenceSummary,
  getDefaultWeeklyDays,
} from './calendar-recurrence';
import { CalendarDatePickerPopup } from './CalendarDatePickerPopup';

interface CustomRecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RecurrenceConfig;
  onApply: (config: RecurrenceConfig) => void;
  startDate?: Date;
}

export const CustomRecurrenceModal: React.FC<CustomRecurrenceModalProps> = ({
  isOpen,
  onClose,
  config,
  onApply,
  startDate = new Date(),
}) => {
  const [tempConfig, setTempConfig] = useState<RecurrenceConfig>(config);

  // Sync internal state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const baseFreq = config.frequency === 'none' ? 'weekly' : config.frequency;
      const baseWk = config.weeklyDays.length > 0 ? config.weeklyDays : getDefaultWeeklyDays(startDate, startDate);
      setTempConfig({
        ...config,
        frequency: baseFreq,
        interval: Math.max(1, config.interval || 1),
        weeklyDays: baseWk,
        isCustom: true,
      });
    }
  }, [isOpen, config, startDate]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply({
      ...tempConfig,
      isCustom: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">
              <Repeat className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                Tùy chỉnh quy tắc lặp
              </h2>
              <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
                Thiết lập tần suất và thời hạn lặp lại theo nhu cầu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-circle-wash text-circle-slate hover:text-circle-charcoal transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 1. Chu kỳ lặp */}
        <div>
          <label className="block text-xs font-bold text-circle-slate dark:text-circle-dark-muted mb-1.5">
            Chu kỳ lặp
          </label>
          <div className="grid grid-cols-4 gap-1.5 bg-circle-canvas dark:bg-circle-dark-canvas p-1 rounded-xl border border-circle-hairline/80 dark:border-circle-dark-hairline">
            {[
              { key: 'daily', label: 'Ngày' },
              { key: 'weekly', label: 'Tuần' },
              { key: 'monthly', label: 'Tháng' },
              { key: 'yearly', label: 'Năm' },
            ].map(({ key, label }) => {
              const isSelected = tempConfig.frequency === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setTempConfig((prev) => ({
                      ...prev,
                      frequency: key as RecurrenceFrequency,
                    }))
                  }
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Khoảng cách lặp (Tần suất) */}
        <div>
          <label className="block text-xs font-bold text-circle-slate dark:text-circle-dark-muted mb-1.5">
            Lặp lại mỗi
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-circle-hairline dark:border-circle-dark-hairline rounded-xl p-1 bg-white dark:bg-circle-dark-canvas">
              <button
                type="button"
                onClick={() =>
                  setTempConfig((prev) => ({
                    ...prev,
                    interval: Math.max(1, (prev.interval || 1) - 1),
                  }))
                }
                className="h-7 w-7 rounded-lg hover:bg-circle-wash flex items-center justify-center text-teal-600 transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                min={1}
                max={99}
                value={tempConfig.interval || 1}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setTempConfig((prev) => ({
                    ...prev,
                    interval: isNaN(val) ? 1 : Math.max(1, Math.min(99, val)),
                  }));
                }}
                className="w-12 text-center text-xs font-bold text-circle-charcoal dark:text-circle-dark-text bg-transparent outline-hidden"
              />
              <button
                type="button"
                onClick={() =>
                  setTempConfig((prev) => ({
                    ...prev,
                    interval: Math.min(99, (prev.interval || 1) + 1),
                  }))
                }
                className="h-7 w-7 rounded-lg hover:bg-circle-wash flex items-center justify-center text-teal-600 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
              {tempConfig.frequency === 'daily' && 'ngày'}
              {tempConfig.frequency === 'weekly' && 'tuần'}
              {tempConfig.frequency === 'monthly' && 'tháng'}
              {tempConfig.frequency === 'yearly' && 'năm'}
            </span>
          </div>
        </div>

        {/* 3. Chi tiết theo chu kỳ */}
        {/* Hằng tuần: 7 nút chọn thứ */}
        {tempConfig.frequency === 'weekly' && (
          <div>
            <label className="block text-xs font-bold text-circle-slate dark:text-circle-dark-muted mb-1.5">
              Vào các ngày trong tuần
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {[
                { w: 1, label: 'T2' },
                { w: 2, label: 'T3' },
                { w: 3, label: 'T4' },
                { w: 4, label: 'T5' },
                { w: 5, label: 'T6' },
                { w: 6, label: 'T7' },
                { w: 7, label: 'CN' },
              ].map(({ w, label }) => {
                const isSelected = tempConfig.weeklyDays.includes(w);
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      const exists = tempConfig.weeklyDays.includes(w);
                      if (exists && tempConfig.weeklyDays.length === 1) return;
                      const next = exists
                        ? tempConfig.weeklyDays.filter((d) => d !== w)
                        : [...tempConfig.weeklyDays, w];
                      setTempConfig((prev) => ({ ...prev, weeklyDays: next.sort((a, b) => a - b) }));
                    }}
                    className={`h-8 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                        : 'border-circle-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash text-circle-charcoal dark:text-circle-dark-text'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Hằng tháng: Theo ngày / Theo thứ */}
        {tempConfig.frequency === 'monthly' && (
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-circle-slate dark:text-circle-dark-muted">
              Quy tắc lặp trong tháng
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-circle-canvas dark:bg-circle-dark-canvas p-1 rounded-xl border border-circle-hairline">
              <button
                type="button"
                onClick={() =>
                  setTempConfig((prev) => ({
                    ...prev,
                    monthlyType: 'day_of_month',
                  }))
                }
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  tempConfig.monthlyType === 'day_of_month'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-circle-slate hover:text-circle-charcoal'
                }`}
              >
                Theo ngày
              </button>
              <button
                type="button"
                onClick={() =>
                  setTempConfig((prev) => ({
                    ...prev,
                    monthlyType: 'nth_weekday',
                  }))
                }
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  tempConfig.monthlyType === 'nth_weekday'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-circle-slate hover:text-circle-charcoal'
                }`}
              >
                Theo thứ
              </button>
            </div>

            {tempConfig.monthlyType === 'day_of_month' ? (
              <div className="grid grid-cols-7 gap-1 p-2 rounded-xl border border-circle-hairline bg-circle-canvas/50 dark:bg-circle-dark-canvas/30 max-h-40 overflow-y-auto">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                  const isSel = tempConfig.monthlyDay === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTempConfig((prev) => ({ ...prev, monthlyDay: d }))}
                      className={`h-7 rounded-lg text-xs font-semibold transition-all ${
                        isSel
                          ? 'bg-teal-600 text-white font-bold'
                          : 'hover:bg-circle-wash text-circle-charcoal dark:text-circle-dark-text'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-circle-slate mb-1">
                    Thứ tự
                  </label>
                  <select
                    value={tempConfig.monthlyNthOrder}
                    onChange={(e) =>
                      setTempConfig((prev) => ({
                        ...prev,
                        monthlyNthOrder: e.target.value as NthWeekdayOrder,
                      }))
                    }
                    className="w-full text-xs font-semibold rounded-xl border border-circle-hairline bg-white dark:bg-circle-dark-surface p-2 text-circle-charcoal dark:text-circle-dark-text"
                  >
                    <option value="first">Đầu tiên</option>
                    <option value="second">Thứ hai</option>
                    <option value="third">Thứ ba</option>
                    <option value="fourth">Thứ tư</option>
                    <option value="last">Cuối cùng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-circle-slate mb-1">
                    Thứ trong tuần
                  </label>
                  <select
                    value={tempConfig.monthlyNthWeekday}
                    onChange={(e) =>
                      setTempConfig((prev) => ({
                        ...prev,
                        monthlyNthWeekday: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full text-xs font-semibold rounded-xl border border-circle-hairline bg-white dark:bg-circle-dark-surface p-2 text-circle-charcoal dark:text-circle-dark-text"
                  >
                    <option value="1">Thứ Hai</option>
                    <option value="2">Thứ Ba</option>
                    <option value="3">Thứ Tư</option>
                    <option value="4">Thứ Năm</option>
                    <option value="5">Thứ Sáu</option>
                    <option value="6">Thứ Bảy</option>
                    <option value="7">Chủ Nhật</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hằng năm: Theo ngày / Theo thứ */}
        {tempConfig.frequency === 'yearly' && (
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-circle-slate dark:text-circle-dark-muted">
              Quy tắc lặp trong năm
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-circle-canvas dark:bg-circle-dark-canvas p-1 rounded-xl border border-circle-hairline">
              <button
                type="button"
                onClick={() =>
                  setTempConfig((prev) => ({
                    ...prev,
                    yearlyType: 'specific_date',
                  }))
                }
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  tempConfig.yearlyType === 'specific_date'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-circle-slate hover:text-circle-charcoal'
                }`}
              >
                Theo ngày
              </button>
              <button
                type="button"
                onClick={() =>
                  setTempConfig((prev) => ({
                    ...prev,
                    yearlyType: 'nth_weekday',
                  }))
                }
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  tempConfig.yearlyType === 'nth_weekday'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-circle-slate hover:text-circle-charcoal'
                }`}
              >
                Theo thứ
              </button>
            </div>

            {tempConfig.yearlyType === 'specific_date' ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-circle-slate mb-1">
                    Tháng
                  </label>
                  <select
                    value={tempConfig.yearlyMonth}
                    onChange={(e) =>
                      setTempConfig((prev) => ({
                        ...prev,
                        yearlyMonth: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full text-xs font-semibold rounded-xl border border-circle-hairline bg-white dark:bg-circle-dark-surface p-2 text-circle-charcoal dark:text-circle-dark-text"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        Tháng {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-circle-slate mb-1">
                    Ngày
                  </label>
                  <select
                    value={tempConfig.yearlyDay}
                    onChange={(e) =>
                      setTempConfig((prev) => ({
                        ...prev,
                        yearlyDay: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full text-xs font-semibold rounded-xl border border-circle-hairline bg-white dark:bg-circle-dark-surface p-2 text-circle-charcoal dark:text-circle-dark-text"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Ngày {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-circle-slate mb-1">
                    Thứ tự
                  </label>
                  <select
                    value={tempConfig.yearlyNthOrder}
                    onChange={(e) =>
                      setTempConfig((prev) => ({
                        ...prev,
                        yearlyNthOrder: e.target.value as NthWeekdayOrder,
                      }))
                    }
                    className="w-full text-xs font-semibold rounded-xl border border-circle-hairline bg-white dark:bg-circle-dark-surface p-2 text-circle-charcoal dark:text-circle-dark-text"
                  >
                    <option value="first">Đầu tiên</option>
                    <option value="second">Thứ hai</option>
                    <option value="third">Thứ ba</option>
                    <option value="fourth">Thứ tư</option>
                    <option value="last">Cuối cùng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-circle-slate mb-1">
                    Thứ
                  </label>
                  <select
                    value={tempConfig.yearlyNthWeekday}
                    onChange={(e) =>
                      setTempConfig((prev) => ({
                        ...prev,
                        yearlyNthWeekday: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full text-xs font-semibold rounded-xl border border-circle-hairline bg-white dark:bg-circle-dark-surface p-2 text-circle-charcoal dark:text-circle-dark-text"
                  >
                    <option value="1">Thứ Hai</option>
                    <option value="2">Thứ Ba</option>
                    <option value="3">Thứ Tư</option>
                    <option value="4">Thứ Năm</option>
                    <option value="5">Thứ Sáu</option>
                    <option value="6">Thứ Bảy</option>
                    <option value="7">Chủ Nhật</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-circle-slate mb-1">
                    Tháng
                  </label>
                  <select
                    value={tempConfig.yearlyNthMonth}
                    onChange={(e) =>
                      setTempConfig((prev) => ({
                        ...prev,
                        yearlyNthMonth: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full text-xs font-semibold rounded-xl border border-circle-hairline bg-white dark:bg-circle-dark-surface p-2 text-circle-charcoal dark:text-circle-dark-text"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        Tháng {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Kết thúc lặp (Dạng Popup Lịch) */}
        <div className="pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline space-y-2">
          <label className="block text-xs font-bold text-circle-slate dark:text-circle-dark-muted">
            Kết thúc lặp
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-circle-canvas dark:bg-circle-dark-canvas p-1 rounded-xl border border-circle-hairline">
            <button
              type="button"
              onClick={() =>
                setTempConfig((prev) => ({
                  ...prev,
                  endType: 'never',
                  endDate: null,
                }))
              }
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                tempConfig.endType === 'never'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-circle-slate hover:text-circle-charcoal'
              }`}
            >
              Không giới hạn
            </button>
            <button
              type="button"
              onClick={() =>
                setTempConfig((prev) => ({
                  ...prev,
                  endType: 'on_date',
                  endDate: prev.endDate || new Date(startDate.getTime() + 30 * 86400000),
                }))
              }
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                tempConfig.endType === 'on_date'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-circle-slate hover:text-circle-charcoal'
              }`}
            >
              Vào ngày
            </button>
          </div>

          {tempConfig.endType === 'on_date' && (
            <div className="pt-1">
              <CalendarDatePickerPopup
                value={tempConfig.endDate}
                onChange={(d) =>
                  setTempConfig((prev) => ({
                    ...prev,
                    endType: d ? 'on_date' : 'never',
                    endDate: d,
                  }))
                }
                minDate={startDate}
                placeholder="Chọn ngày kết thúc chuỗi lặp"
              />
            </div>
          )}
        </div>

        {/* 5. Tóm tắt quy tắc */}
        <div className="p-3 rounded-xl border border-teal-500/20 bg-teal-50/50 dark:bg-teal-950/20 flex items-start gap-2">
          <Info className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
          <div className="text-xs text-teal-800 dark:text-teal-300">
            <span className="font-bold">Quy tắc hiện tại: </span>
            <span>{formatRecurrenceSummary(tempConfig)}</span>
            {tempConfig.endType === 'on_date' && tempConfig.endDate && (
              <span className="block mt-0.5 text-[11px] opacity-80">
                (Kết thúc sau ngày {tempConfig.endDate.toLocaleDateString('vi-VN')})
              </span>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-circle-slate hover:bg-circle-wash transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
};
