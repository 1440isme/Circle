'use client';

import React, { useState } from 'react';
import {
  X,
  Compass,
  Sparkles,
  Layers,
  Plus,
  Loader2,
  Check,
  Utensils,
  CreditCard,
  Home,
  HelpCircle,
} from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';
import { useWheelsQuery, useLiveSpinWheelMutation } from '../../hooks/use-circle-tools';

interface LiveWheelPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId: string;
  channelId?: string;
}

export const LiveWheelPickerModal: React.FC<LiveWheelPickerModalProps> = ({
  isOpen,
  onClose,
  circleId,
  channelId,
}) => {
  const { t, locale } = useLanguageStore();
  const { data: existingWheels = [], isLoading: isLoadingWheels } = useWheelsQuery(circleId);
  const liveSpinMutation = useLiveSpinWheelMutation(circleId);

  const [activeTab, setActiveTab] = useState<'existing' | 'custom'>('existing');
  const [selectedWheelId, setSelectedWheelId] = useState<string | null>(null);

  // Custom options state
  const [customTitle, setCustomTitle] = useState('');
  const [customOptionsText, setCustomOptionsText] = useState('');

  if (!isOpen) return null;

  // Auto-select first wheel if none selected
  const activeExistingWheelId = selectedWheelId || (existingWheels[0]?.id ?? null);

  const parsedCustomOptions = customOptionsText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const handleApplyPreset = (title: string, options: string[]) => {
    setCustomTitle(title);
    setCustomOptionsText(options.join('\n'));
    setActiveTab('custom');
  };

  const handleStartSpin = () => {
    if (activeTab === 'existing') {
      if (!activeExistingWheelId) return;
      liveSpinMutation.mutate(
        {
          wheelId: activeExistingWheelId,
          channelId,
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      if (parsedCustomOptions.length < 2) return;
      liveSpinMutation.mutate(
        {
          title: customTitle.trim() || (locale === 'vi' ? 'Vòng quay may mắn' : 'Lucky Wheel'),
          options: parsedCustomOptions,
          channelId,
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    }
  };

  const isSpinDisabled =
    liveSpinMutation.isPending ||
    (activeTab === 'existing' && (!activeExistingWheelId || existingWheels.length === 0)) ||
    (activeTab === 'custom' && parsedCustomOptions.length < 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-circle-dark-surface rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-circle-hairline dark:border-circle-dark-hairline">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500">
              <Compass className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.luckyWheel?.liveWheelTitle || 'Vòng quay trực tiếp trong nhóm'}
              </h2>
              <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
                {locale === 'vi'
                  ? 'Tất cả thành viên trong nhóm sẽ cùng xem vòng quay trực tiếp'
                  : 'All group members will watch the live spin simultaneously'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-2 p-1 bg-circle-canvas dark:bg-circle-dark-canvas rounded-xl border border-circle-hairline dark:border-circle-dark-hairline">
            <button
              type="button"
              onClick={() => setActiveTab('existing')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'existing'
                  ? 'bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text shadow-xs'
                  : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>
                {(t.luckyWheel?.selectExistingWheel || 'Vòng quay có sẵn ({count})').replace(
                  '{count}',
                  String(existingWheels.length)
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'custom'
                  ? 'bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text shadow-xs'
                  : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.luckyWheel?.createCustomWheel || 'Thiết lập danh sách mới'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {activeTab === 'existing' ? (
            <div className="space-y-2.5">
              {isLoadingWheels ? (
                <div className="flex items-center justify-center py-10 gap-2 text-xs text-circle-slate dark:text-circle-dark-muted">
                  <Loader2 className="w-4 h-4 animate-spin text-circle-primary" />
                  <span>{locale === 'vi' ? 'Đang tải danh sách...' : 'Loading wheels...'}</span>
                </div>
              ) : existingWheels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                  <Compass className="w-10 h-10 text-circle-slate/40 dark:text-circle-dark-muted/40" />
                  <p className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                    {locale === 'vi' ? 'Chưa có Vòng quay nào' : 'No wheels found'}
                  </p>
                  <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted max-w-xs">
                    {locale === 'vi'
                      ? 'Nhóm chưa có vòng quay nào được lưu. Bạn có thể tự thiết lập danh sách mới ở tab bên cạnh.'
                      : 'No saved wheels yet. You can create custom options in the other tab.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('custom')}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-circle-primary text-white text-xs font-bold shadow-xs hover:bg-circle-sage transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.luckyWheel?.createCustomWheel || 'Thiết lập danh sách mới'}</span>
                  </button>
                </div>
              ) : (
                existingWheels.map((wheel) => {
                  const isSelected = activeExistingWheelId === wheel.id;
                  const opts = wheel.options || [];
                  return (
                    <div
                      key={wheel.id}
                      onClick={() => setSelectedWheelId(wheel.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-circle-primary bg-circle-primary/5 dark:bg-circle-primary/10 shadow-xs'
                          : 'border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-wash/60 dark:hover:bg-circle-dark-wash/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Compass
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? 'text-circle-primary' : 'text-circle-slate dark:text-circle-dark-muted'
                            }`}
                          />
                          <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                            {wheel.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-circle-wash dark:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted font-medium shrink-0">
                            {opts.length} {locale === 'vi' ? 'lựa chọn' : 'options'}
                          </span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-circle-primary bg-circle-primary text-white'
                              : 'border-circle-slate/40 dark:border-circle-dark-muted/40'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Options preview pills */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {opts.slice(0, 6).map((opt, i) => (
                          <span
                            key={i}
                            className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted border border-circle-hairline/80 dark:border-circle-dark-hairline truncate max-w-[140px]"
                          >
                            {opt.optionLabel}
                          </span>
                        ))}
                        {opts.length > 6 && (
                          <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-medium text-circle-slate/70 dark:text-circle-dark-muted/70">
                            +{opts.length - 6}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Presets Chips */}
              <div>
                <label className="block text-[11px] font-semibold text-circle-slate dark:text-circle-dark-muted mb-1.5">
                  {locale === 'vi' ? 'Mẫu gợi ý nhanh:' : 'Quick presets:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPreset(
                        locale === 'vi' ? 'Trưa nay ăn gì?' : 'What to eat today?',
                        locale === 'vi'
                          ? ['Phở bò', 'Bún chả', 'Cơm tấm', 'Bánh mì', 'Pizza', 'Gà rán']
                          : ['Pizza', 'Burger', 'Sushi', 'Tacos', 'Salad', 'Pasta']
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-circle-wash dark:bg-circle-dark-wash hover:bg-circle-primary/10 hover:text-circle-primary transition-colors text-circle-charcoal dark:text-circle-dark-text border border-circle-hairline/60 dark:border-white/5"
                  >
                    <Utensils className="w-3 h-3 text-amber-500" />
                    <span>{t.luckyWheel?.presetFood || 'Trưa nay ăn gì?'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPreset(
                        locale === 'vi' ? 'Ai trả tiền hôm nay?' : 'Who pays the bill?',
                        locale === 'vi'
                          ? ['Tôi trả', 'Chia đều', 'Người nhỏ tuổi nhất', 'Người nhiều tiền nhất']
                          : ['Me', 'Split equally', 'Youngest member', 'Lucky one']
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-circle-wash dark:bg-circle-dark-wash hover:bg-circle-primary/10 hover:text-circle-primary transition-colors text-circle-charcoal dark:text-circle-dark-text border border-circle-hairline/60 dark:border-white/5"
                  >
                    <CreditCard className="w-3 h-3 text-emerald-500" />
                    <span>{t.luckyWheel?.presetPayer || 'Ai trả tiền hôm nay?'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPreset(
                        locale === 'vi' ? 'Ai dọn dẹp nhà?' : 'Who does the chores?',
                        locale === 'vi'
                          ? ['Rửa bát', 'Quét nhà', 'Đổ rác', 'Nấu cơm', 'Lau bàn']
                          : ['Wash dishes', 'Sweep floor', 'Take out trash', 'Cook dinner']
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-circle-wash dark:bg-circle-dark-wash hover:bg-circle-primary/10 hover:text-circle-primary transition-colors text-circle-charcoal dark:text-circle-dark-text border border-circle-hairline/60 dark:border-white/5"
                  >
                    <Home className="w-3 h-3 text-sky-500" />
                    <span>{t.luckyWheel?.presetChores || 'Ai dọn dẹp nhà?'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPreset(
                        locale === 'vi' ? 'Có hoặc Không?' : 'Yes or No?',
                        locale === 'vi' ? ['Có (Yes)', 'Không (No)'] : ['Yes', 'No']
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-circle-wash dark:bg-circle-dark-wash hover:bg-circle-primary/10 hover:text-circle-primary transition-colors text-circle-charcoal dark:text-circle-dark-text border border-circle-hairline/60 dark:border-white/5"
                  >
                    <HelpCircle className="w-3 h-3 text-purple-500" />
                    <span>{t.luckyWheel?.presetYesNo || 'Có hoặc Không?'}</span>
                  </button>
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-[11px] font-bold text-circle-charcoal dark:text-circle-dark-text mb-1">
                  {t.luckyWheel?.customWheelTitle || 'Tên vòng quay'}
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={
                    locale === 'vi' ? 'Ví dụ: Trưa nay ăn gì? Đi chơi ở đâu?...' : 'E.g., What to eat for lunch?'
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/50 dark:placeholder:text-circle-dark-muted/50 focus:outline-none focus:ring-1 focus:ring-circle-primary"
                />
              </div>

              {/* Textarea options */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-circle-charcoal dark:text-circle-dark-text">
                    {locale === 'vi'
                      ? `Các phương án lựa chọn (${parsedCustomOptions.length})`
                      : `Options (${parsedCustomOptions.length})`}
                  </label>
                  {parsedCustomOptions.length < 2 && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      {t.luckyWheel?.minOptionsWarning || 'Tối thiểu 2 lựa chọn'}
                    </span>
                  )}
                </div>
                <textarea
                  rows={5}
                  value={customOptionsText}
                  onChange={(e) => setCustomOptionsText(e.target.value)}
                  placeholder={
                    t.luckyWheel?.customOptionsPlaceholder ||
                    'Nhập mỗi lựa chọn trên 1 dòng (tối thiểu 2)...'
                  }
                  className="w-full p-2.5 text-xs rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/50 dark:placeholder:text-circle-dark-muted/50 focus:outline-none focus:ring-1 focus:ring-circle-primary resize-none font-sans"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-circle-hairline dark:border-circle-dark-hairline bg-circle-wash/30 dark:bg-circle-dark-wash/20 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
          >
            {t.common?.cancel || 'Hủy'}
          </button>
          <button
            type="button"
            disabled={isSpinDisabled}
            onClick={handleStartSpin}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-circle-primary hover:bg-circle-sage text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {liveSpinMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{locale === 'vi' ? 'Đang khởi tạo...' : 'Starting...'}</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" />
                <span>{t.luckyWheel?.startLiveSpin || 'Bắt đầu quay trực tiếp'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
