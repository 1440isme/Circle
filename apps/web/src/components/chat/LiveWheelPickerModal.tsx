'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Compass,
  X,
  Plus,
  Trash2,
  Loader2,
  Volume2,
  VolumeX,
  Shuffle,
  RotateCcw,
  Edit2,
  Check,
  ArrowDownAZ,
  BookmarkCheck,
  Sparkles,
} from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';
import {
  useWheelsQuery,
  useCreateWheelMutation,
  useUpdateWheelMutation,
  useDeleteWheelMutation,
  useDeleteAllWheelsMutation,
  useCreateLiveWheelStageMutation,
} from '../../hooks/use-circle-tools';

interface LiveWheelPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId: string;
  channelId?: string;
}

const PASTEL_WHEEL_COLORS = [
  '#FFD6A5', // Pastel Warm Apricot
  '#CAFFBF', // Pastel Mint Green
  '#9BF6FF', // Pastel Sky Cyan
  '#FFADAD', // Pastel Coral Pink
  '#BDB2FF', // Pastel Soft Lavender
  '#FDFFB6', // Pastel Cream Butter
  '#A0C4FF', // Pastel Powder Blue
  '#FFC6FF', // Pastel Light Orchid
  '#B8E0D2', // Pastel Celadon Sage
  '#FED1BA', // Pastel Peach
  '#D7E3FC', // Pastel Periwinkle
  '#FDE2E4', // Pastel Rose Blossom
];

export const LiveWheelPickerModal: React.FC<LiveWheelPickerModalProps> = ({
  isOpen,
  onClose,
  circleId,
  channelId,
}) => {
  const { t, locale } = useLanguageStore();

  const { data: rawWheels = [], isLoading: isLoadingWheels } = useWheelsQuery(circleId);

  // Sắp xếp vòng 1, 2, 3, 4 theo thứ tự thời gian tạo tăng dần
  const wheels = useMemo(() => {
    return [...rawWheels].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return a.title.localeCompare(b.title, 'vi', { numeric: true });
    });
  }, [rawWheels]);

  const createWheelMutation = useCreateWheelMutation(circleId);
  const updateWheelMutation = useUpdateWheelMutation(circleId);
  const deleteWheelMutation = useDeleteWheelMutation(circleId);
  const deleteAllMutation = useDeleteAllWheelsMutation(circleId);
  const createStageMutation = useCreateLiveWheelStageMutation(circleId);

  // Active Tab trong bảng Setup
  const [activeWheelId, setActiveWheelId] = useState<string | null>(null);

  // Bật/tắt âm thanh
  const [soundEnabled, setSoundEnabled] = useState(true);

  // State các vòng quay
  const [wheelsState, setWheelsState] = useState<Record<string, { optionsText: string }>>({});

  // Editing title inline
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleText, setEditingTitleText] = useState('');
  const [saveInitialFeedback, setSaveInitialFeedback] = useState(false);

  // Parse options helper
  const parseOptions = useCallback((text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    return lines.map((label, idx) => ({
      label,
      color: PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length]!,
    }));
  }, []);

  // Sync server wheels into local state
  useEffect(() => {
    if (wheels.length > 0) {
      setWheelsState((prev) => {
        const next = { ...prev };
        wheels.forEach((w) => {
          if (!next[w.id]) {
            next[w.id] = {
              optionsText: (w.options || []).map((o) => o.optionLabel).join('\n'),
            };
          }
        });
        return next;
      });

      if (!activeWheelId || !wheels.some((w) => w.id === activeWheelId)) {
        setActiveWheelId(wheels[0]!.id);
      }
    }
  }, [wheels, activeWheelId]);

  const activeWheel = useMemo(() => {
    return wheels.find((w) => w.id === activeWheelId) || wheels[0] || null;
  }, [wheels, activeWheelId]);

  const activeLocalState = activeWheel ? wheelsState[activeWheel.id] : null;

  const activeParsedOptions = useMemo(() => {
    return parseOptions(activeLocalState?.optionsText || '');
  }, [activeLocalState, parseOptions]);

  const handleOptionsChange = (newText: string) => {
    if (!activeWheel) return;
    setWheelsState((prev) => ({
      ...prev,
      [activeWheel.id]: {
        ...(prev[activeWheel.id] || {}),
        optionsText: newText,
      },
    }));
  };

  // Thêm 1 vòng mặc định không có popup
  const handleAddDefaultWheel = () => {
    if (wheels.length >= 4 || createWheelMutation.isPending) return;
    const nextNumber = wheels.length + 1;
    const defaultTitle = t.luckyWheel.wheelNumber.replace('{number}', String(nextNumber));
    const sampleOptions = [
      { optionLabel: 'Lựa chọn 1' },
      { optionLabel: 'Lựa chọn 2' },
      { optionLabel: 'Lựa chọn 3' },
      { optionLabel: 'Lựa chọn 4' },
    ];

    createWheelMutation.mutate(
      {
        title: defaultTitle,
        options: sampleOptions,
        initialOptions: sampleOptions.map((o) => o.optionLabel),
        soundEnabled: true,
        confettiEnabled: true,
      },
      {
        onSuccess: (newWheel) => {
          if (newWheel?.id) {
            setActiveWheelId(newWheel.id);
          }
        },
      }
    );
  };

  // Đổi tên vòng quay inline
  const startEditTitle = () => {
    if (!activeWheel) return;
    setEditingTitleText(activeWheel.title);
    setIsEditingTitle(true);
  };

  const saveEditTitle = () => {
    if (!activeWheel) return;
    const trimmed = editingTitleText.trim();
    if (trimmed && trimmed !== activeWheel.title) {
      updateWheelMutation.mutate({
        wheelId: activeWheel.id,
        input: { title: trimmed },
      });
    }
    setIsEditingTitle(false);
  };

  // Xóa vòng hiện tại
  const handleDeleteCurrentWheel = () => {
    if (!activeWheel || wheels.length <= 1) return;
    if (window.confirm(t.luckyWheel.confirmDeleteDesc)) {
      deleteWheelMutation.mutate(activeWheel.id, {
        onSuccess: () => {
          const remaining = wheels.filter((w) => w.id !== activeWheel.id);
          if (remaining.length > 0) {
            setActiveWheelId(remaining[0]!.id);
          }
        },
      });
    }
  };

  // Xóa tất cả các vòng (reset về 1 vòng mặc định)
  const handleDeleteAllWheels = () => {
    if (wheels.length === 0) return;
    if (window.confirm(t.luckyWheel.confirmDeleteAllWheels)) {
      const defaultTitle = t.luckyWheel.wheelNumber.replace('{number}', '1');
      deleteAllMutation.mutate(defaultTitle, {
        onSuccess: (res: any) => {
          if (res?.defaultWheel?.id) {
            setActiveWheelId(res.defaultWheel.id);
          }
        },
      });
    }
  };

  // Trộn ngẫu nhiên
  const handleShuffle = () => {
    if (!activeLocalState) return;
    const lines = activeLocalState.optionsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return;

    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lines[i], lines[j]] = [lines[j]!, lines[i]!];
    }
    handleOptionsChange(lines.join('\n'));
  };

  // Sắp xếp A-Z
  const handleSortAZ = () => {
    if (!activeLocalState) return;
    const lines = activeLocalState.optionsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return;

    lines.sort((a, b) => a.localeCompare(b, 'vi', { sensitivity: 'base' }));
    handleOptionsChange(lines.join('\n'));
  };

  // Lưu làm ban đầu
  const handleSaveAsInitial = () => {
    if (!activeWheel || !activeLocalState) return;
    const lines = activeLocalState.optionsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 1) return;

    updateWheelMutation.mutate(
      {
        wheelId: activeWheel.id,
        input: { initialOptions: lines },
      },
      {
        onSuccess: () => {
          setSaveInitialFeedback(true);
          setTimeout(() => setSaveInitialFeedback(false), 2000);
        },
      }
    );
  };

  // Reset về ban đầu
  const handleReset = () => {
    if (!activeWheel) return;
    const initial =
      activeWheel.initialOptions && activeWheel.initialOptions.length > 0
        ? activeWheel.initialOptions
        : (activeWheel.options || []).map((o) => o.optionLabel);
    handleOptionsChange(initial.join('\n'));
  };

  // KHI BẤM NÚT "TẠO": Lưu cấu hình, kích hoạt sân khấu và mở bung LiveWheelOverlay
  const handleCreateStage = async () => {
    try {
      // Lưu các lựa chọn đã chỉnh sửa của active wheel nếu có
      if (activeWheel && activeLocalState?.optionsText) {
        const lines = parseOptions(activeLocalState.optionsText);
        if (lines.length >= 2) {
          await updateWheelMutation.mutateAsync({
            wheelId: activeWheel.id,
            input: {
              options: lines.map((l) => ({
                optionLabel: l.label,
                color: l.color,
              })),
            },
          });
        }
      }

      const created = await createStageMutation.mutateAsync({ channelId });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('circle:open-live-wheel', {
            detail: { circleId, sessionId: created?.id, session: created },
          })
        );
      }
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể tạo sân khấu vòng quay');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline shadow-2xl p-5 sm:p-6 flex flex-col max-h-[90vh] overflow-hidden">
        {/* ============================================================== */}
        {/* HEADER                                                         */}
        {/* ============================================================== */}
        <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-circle-primary/15 text-circle-primary flex items-center justify-center">
              <Compass className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text leading-tight">
                {locale === 'vi' ? 'Vòng quay ngẫu nhiên' : 'Random Wheel'}
              </h3>
              <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
                {locale === 'vi'
                  ? 'Thiết lập danh sách lựa chọn cho vòng quay'
                  : 'Configure options for random wheel'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* BẢNG THIẾT LẬP CÁC VÒNG                                        */}
        {/* ============================================================== */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 border-b border-circle-hairline dark:border-circle-dark-hairline no-scrollbar shrink-0">
          {wheels.map((wheel) => {
            const isSelected = activeWheelId === wheel.id;
            return (
              <button
                key={wheel.id}
                type="button"
                onClick={() => setActiveWheelId(wheel.id)}
                className={`flex items-center justify-center w-28 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-circle-primary text-white shadow-xs font-bold'
                    : 'bg-circle-wash/60 dark:bg-circle-dark-wash/40 text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                }`}
                title={wheel.title}
              >
                <span className="truncate">{wheel.title}</span>
              </button>
            );
          })}
        </div>

        {/* Nội dung cấu hình của vòng đang chọn */}
        <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-3 min-h-0">
          {isLoadingWheels ? (
            <div className="flex items-center justify-center py-12 gap-2 text-xs text-circle-slate dark:text-circle-dark-muted">
              <Loader2 className="w-4 h-4 animate-spin text-circle-primary" />
              <span>{locale === 'vi' ? 'Đang tải danh sách...' : 'Loading wheels...'}</span>
            </div>
          ) : (
            activeWheel && (
              <div className="flex-1 flex flex-col gap-3 min-h-[220px]">
                {/* Tên vòng + Sửa + Xóa */}
                <div className="flex items-center justify-between gap-2">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        maxLength={50}
                        value={editingTitleText}
                        onChange={(e) => setEditingTitleText(e.target.value)}
                        onBlur={saveEditTitle}
                        onKeyDown={(e) => e.key === 'Enter' && saveEditTitle()}
                        autoFocus
                        className="flex-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-circle-primary bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={saveEditTitle}
                        className="p-1 rounded-md bg-circle-primary text-white cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1 group">
                      <span className="font-bold text-sm text-circle-charcoal dark:text-circle-dark-text truncate max-w-[240px]">
                        {activeWheel.title}
                      </span>
                      <button
                        type="button"
                        onClick={startEditTitle}
                        className="opacity-70 hover:opacity-100 p-1 rounded hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted transition-opacity cursor-pointer"
                        title={t.luckyWheel.renameWheel}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {wheels.length > 1 && (
                    <button
                      type="button"
                      onClick={handleDeleteCurrentWheel}
                      className="p-1.5 rounded-lg text-circle-slate dark:text-circle-dark-muted hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                      title={t.luckyWheel.confirmDeleteTitle}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Textarea Options */}
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs text-circle-slate dark:text-circle-dark-muted">
                    <span className="font-medium">{t.luckyWheel.optionsListTitle}</span>
                    <span
                      className={`font-semibold ${
                        activeParsedOptions.length < 2 ? 'text-amber-500' : 'text-circle-primary'
                      }`}
                    >
                      {t.luckyWheel.optionsCount.replace('{count}', String(activeParsedOptions.length))}
                    </span>
                  </div>

                  <textarea
                    value={activeLocalState?.optionsText || ''}
                    onChange={(e) => handleOptionsChange(e.target.value)}
                    placeholder={t.luckyWheel.optionsPlaceholder}
                    rows={6}
                    className="w-full flex-1 min-h-[140px] p-2.5 text-xs rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/50 dark:placeholder:text-circle-dark-muted/50 focus:outline-none focus:ring-1 focus:ring-circle-primary resize-none font-mono"
                  />
                  <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted">
                    {t.luckyWheel.optionsHint}
                  </p>
                </div>

                {/* 4 Nút thao tác icon */}
                <div className="grid grid-cols-4 gap-2 pt-1 border-t border-circle-hairline dark:border-circle-dark-hairline">
                  <button
                    type="button"
                    onClick={handleShuffle}
                    className="flex items-center justify-center py-1.5 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-95 cursor-pointer"
                    title={t.luckyWheel.shuffleOptions}
                  >
                    <Shuffle className="w-4 h-4 text-circle-sage dark:text-circle-primary" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSortAZ}
                    className="flex items-center justify-center py-1.5 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-95 cursor-pointer"
                    title={t.luckyWheel.sortAZ}
                  >
                    <ArrowDownAZ className="w-4 h-4 text-indigo-500" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAsInitial}
                    className={`flex items-center justify-center py-1.5 px-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                      saveInitialFeedback
                        ? 'border-circle-primary bg-circle-wash dark:bg-circle-dark-wash text-circle-primary'
                        : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                    }`}
                    title={t.luckyWheel.saveAsInitial}
                  >
                    <BookmarkCheck
                      className={`w-4 h-4 ${
                        saveInitialFeedback ? 'text-circle-primary' : 'text-circle-sage dark:text-circle-primary'
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center justify-center py-1.5 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-95 cursor-pointer"
                    title={t.luckyWheel.resetOptions}
                  >
                    <RotateCcw className="w-4 h-4 text-amber-500" />
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Hàng thiết lập: Bật/Tắt âm thanh & Xóa tất cả */}
        <div className="flex items-center justify-between pt-2.5 pb-2 border-t border-circle-hairline dark:border-circle-dark-hairline text-xs shrink-0">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-circle-primary" />
            ) : (
              <VolumeX className="w-4 h-4 text-circle-slate/60 dark:text-circle-dark-muted/60" />
            )}
            <span>{t.luckyWheel.soundSetting}</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteAllWheels}
            disabled={wheels.length === 0 || deleteAllMutation.isPending}
            className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-semibold disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.luckyWheel.deleteAllWheels}</span>
          </button>
        </div>

        {/* HÀNG NÚT DƯỚI CÙNG: [Thêm vòng xoay] & [Tạo] */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline shrink-0">
          {/* Nút Thêm vòng xoay */}
          <button
            type="button"
            onClick={handleAddDefaultWheel}
            disabled={wheels.length >= 4 || createWheelMutation.isPending}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-xs font-bold text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 transition-all active:scale-95 cursor-pointer shrink-0"
            title={wheels.length >= 4 ? t.luckyWheel.maxWheelsBadge : undefined}
          >
            <Plus className="w-4 h-4 text-circle-sage dark:text-circle-primary" />
            <span>{t.luckyWheel.addWheel}</span>
          </button>

          {/* Nút TẠO */}
          <button
            type="button"
            onClick={handleCreateStage}
            disabled={wheels.length === 0 || createStageMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-circle-primary hover:bg-circle-sage text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {createStageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Sparkles className="w-4 h-4 text-white" />
            )}
            <span>
              {createStageMutation.isPending
                ? locale === 'vi'
                  ? 'Đang tạo...'
                  : 'Creating...'
                : locale === 'vi'
                ? 'Tạo vòng quay'
                : 'Create Wheel'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
