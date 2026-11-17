'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Compass,
  X,
  Plus,
  Trash2,
  Trophy,
  Loader2,
  RotateCw,
  Volume2,
  VolumeX,
  Shuffle,
  RotateCcw,
  Edit2,
  Check,
  ArrowDownAZ,
  BookmarkCheck,
  Sparkles,
  ArrowLeft,
  Play,
  ArrowRight,
} from 'lucide-react';
import { DecisionWheelEntity, LiveWheelSession } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';
import {
  useWheelsQuery,
  useCreateWheelMutation,
  useUpdateWheelMutation,
  useDeleteWheelMutation,
  useDeleteAllWheelsMutation,
  useLiveSpinWheelMutation,
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

// Web Audio API Synthesizer
class ModalWheelAudioEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playTick() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {}
  }

  playFanfare() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = ctx.currentTime + idx * 0.1;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.6);
      });
    } catch {}
  }
}

const modalAudio = new ModalWheelAudioEngine();

// Component vẽ đĩa Canvas độc lập cho từng vòng
const SingleWheelCanvas: React.FC<{
  options: { label: string; color: string }[];
  rotation: number;
  size?: number;
}> = ({ options, rotation, size = 220 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = center - 2;
    const count = Math.max(options.length, 1);
    const sliceAngle = (2 * Math.PI) / count;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((rotation * Math.PI) / 180);

    options.forEach((opt, idx) => {
      const startAngle = idx * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = opt.color || PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length]!;
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();

      ctx.save();
      const midAngle = startAngle + sliceAngle / 2;
      ctx.rotate(midAngle);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#1E293B';
      ctx.font = `600 ${size > 220 ? 12 : 10.5}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
      ctx.shadowBlur = 2;

      const maxLabelLen = size > 220 ? 14 : 9;
      let label = opt.label;
      if (label.length > maxLabelLen) {
        label = label.substring(0, maxLabelLen - 1) + '…';
      }
      ctx.fillText(label, radius - 14, 4);
      ctx.restore();
    });

    ctx.restore();

    // Vành viền ngoài
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Center circular hub
    ctx.beginPath();
    ctx.arc(center, center, size > 220 ? 20 : 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 1;
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#E2E8F0';
    ctx.stroke();

    // Center small circle (brand primary teal)
    ctx.beginPath();
    ctx.arc(center, center, size > 220 ? 8 : 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#0D9488';
    ctx.fill();
  }, [options, rotation, size]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="rounded-full shadow-md"
      />
      {/* Kim chỉ bên phải */}
      <div
        className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none drop-shadow-md flex items-center"
        style={{ right: size > 220 ? -14 : -12 }}
      >
        <svg width={size > 220 ? 28 : 22} height={size > 220 ? 20 : 16} viewBox="0 0 34 24" fill="none">
          <path
            d="M 2 12 L 20 3 C 22 2 24 3 24 5.5 V 18.5 C 24 21 22 22 20 21 L 2 12 Z"
            fill="#0D9488"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <rect x="22" y="5" width="10" height="14" rx="3.5" fill="#0F766E" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="27" cy="12" r="3" fill="#FFFFFF" />
          <circle cx="27" cy="12" r="1.5" fill="#0D9488" />
        </svg>
      </div>
    </div>
  );
};

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
  const liveSpinMutation = useLiveSpinWheelMutation(circleId);
  const createStageMutation = useCreateLiveWheelStageMutation(circleId);

  // Chế độ xem: 'setup' (bảng cấu hình) hoặc 'arena' (sân khấu các vòng tròn khi bấm Tạo)
  const [viewMode, setViewMode] = useState<'setup' | 'arena'>('setup');

  // Active Tab trong bảng Setup
  const [activeWheelId, setActiveWheelId] = useState<string | null>(null);

  // Bật/tắt âm thanh
  const [soundEnabled, setSoundEnabled] = useState(true);

  // State các vòng quay
  const [wheelsState, setWheelsState] = useState<Record<string, { optionsText: string }>>({});

  // Góc quay và trạng thái quay của từng vòng trên Sân khấu
  const [wheelRotations, setWheelRotations] = useState<Record<string, number>>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastSpinResult, setLastSpinResult] = useState<string | null>(null);

  // Editing title inline
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleText, setEditingTitleText] = useState('');
  const [saveInitialFeedback, setSaveInitialFeedback] = useState(false);

  const animFrameRef = useRef<number | null>(null);

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

  // Reset về view setup khi mở modal
  useEffect(() => {
    if (isOpen) {
      setViewMode('setup');
      setLastSpinResult(null);
      setIsSpinning(false);
    }
  }, [isOpen]);

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

  // Thêm vòng xoay
  const handleAddDefaultWheel = () => {
    if (wheels.length >= 4 || createWheelMutation.isPending) return;
    const nextNumber = wheels.length + 1;
    const defaultTitle = t.luckyWheel.wheelNumber.replace('{number}', String(nextNumber));
    const sampleOptions = [
      { optionLabel: 'Phở bò' },
      { optionLabel: 'Bún chả' },
      { optionLabel: 'Cơm tấm' },
      { optionLabel: 'Bánh mì' },
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

  // Sửa tên vòng
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
        input: { title: trimmed.slice(0, 50) },
      });
    }
    setIsEditingTitle(false);
  };

  // Xóa vòng đang chọn
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

  // Xóa tất cả vòng quay
  const handleDeleteAllWheels = () => {
    if (wheels.length === 0 || deleteAllMutation.isPending) return;
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

  // Shuffle
  const handleShuffle = () => {
    if (!activeWheel || activeParsedOptions.length < 2) return;
    const arr = [...activeParsedOptions];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    handleOptionsChange(arr.map((o) => o.label).join('\n'));
  };

  // Sort A-Z
  const handleSortAZ = () => {
    if (!activeWheel || activeParsedOptions.length < 2) return;
    const sorted = [...activeParsedOptions].sort((a, b) =>
      a.label.localeCompare(b.label, 'vi', { numeric: true, sensitivity: 'base' })
    );
    handleOptionsChange(sorted.map((o) => o.label).join('\n'));
  };

  // Save as Initial
  const handleSaveAsInitial = () => {
    if (!activeWheel) return;
    const lines = parseOptions(activeLocalState?.optionsText || '');
    if (lines.length < 2) {
      alert(t.luckyWheel.minOptionsWarning);
      return;
    }
    updateWheelMutation.mutate(
      {
        wheelId: activeWheel.id,
        input: {
          initialOptions: lines.map((l) => l.label),
          options: lines.map((l) => ({
            optionLabel: l.label,
            color: l.color,
          })),
        },
      },
      {
        onSuccess: () => {
          setSaveInitialFeedback(true);
          setTimeout(() => setSaveInitialFeedback(false), 2000);
        },
      }
    );
  };

  // Reset
  const handleReset = () => {
    if (!activeWheel) return;
    const initial =
      activeWheel.initialOptions && activeWheel.initialOptions.length > 0
        ? activeWheel.initialOptions
        : (activeWheel.options || []).map((o) => o.optionLabel);
    handleOptionsChange(initial.join('\n'));
  };

  // KHI BẤM NÚT "TẠO": Lưu và kích hoạt sân khấu 4 vòng xoay trực tiếp cho cả nhóm
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

      await createStageMutation.mutateAsync({ channelId });
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể tạo sân khấu vòng quay');
    }
  };

  // KHI BẤM NÚT "QUAY" / "QUAY TẤT CẢ" TRÊN SÂN KHẤU
  const handleStartSpin = async () => {
    if (wheels.length === 0 || isSpinning || liveSpinMutation.isPending) return;

    try {
      setIsSpinning(true);
      setLastSpinResult(null);

      const session = await liveSpinMutation.mutateAsync({
        isAll: true,
        wheelId: activeWheel?.id,
        channelId,
      });

      // Bắt đầu animation xoay các vòng tròn
      const duration = session.durationMs || 6000;
      const startTime = Date.now();
      let lastTickAngle = 0;

      // Tính toán góc dừng cho từng vòng
      const targetSlices = session.options.length;
      const sliceDeg = 360 / Math.max(targetSlices, 1);
      const targetCenterDeg = session.winningIndex * sliceDeg + sliceDeg / 2;
      const stopAngle = (360 - (targetCenterDeg % 360)) % 360;
      const extraSpins = 6 * 360;
      const finalRot = extraSpins + stopAngle;

      const step = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4);
        const currRot = finalRot * easeOut;

        // Cập nhật góc quay cho các vòng
        setWheelRotations((prev) => {
          const next: Record<string, number> = {};
          wheels.forEach((w) => {
            next[w.id] = currRot;
          });
          return next;
        });

        if (soundEnabled && Math.abs(currRot - lastTickAngle) >= sliceDeg) {
          modalAudio.playTick();
          lastTickAngle = currRot;
        }

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          setIsSpinning(false);
          setLastSpinResult(session.winningOption?.optionLabel || '');
          if (soundEnabled) {
            modalAudio.playFanfare();
          }
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    } catch (err: any) {
      setIsSpinning(false);
      alert(err?.response?.data?.message || err?.message || 'Không thể bắt đầu quay');
    }
  };

  // Kích thước đĩa quay phù hợp theo số lượng vòng
  const wheelCanvasSize = useMemo(() => {
    if (wheels.length === 1) return 260;
    if (wheels.length === 2) return 190;
    return 160;
  }, [wheels.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline shadow-2xl p-5 sm:p-6 flex flex-col max-h-[90vh] overflow-hidden">
        {/* ============================================================== */}
        {/* HEADER                                                         */}
        {/* ============================================================== */}
        <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline shrink-0">
          <div className="flex items-center gap-2.5">
            {viewMode === 'arena' && (
              <button
                type="button"
                onClick={() => setViewMode('setup')}
                disabled={isSpinning}
                className="p-1.5 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted transition-colors mr-1 cursor-pointer disabled:opacity-40"
                title="Quay lại thiết lập"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="w-8 h-8 rounded-full bg-circle-primary/15 text-circle-primary flex items-center justify-center">
              <Compass className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text leading-tight">
                {t.luckyWheel.title}
              </h3>
              <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
                {viewMode === 'setup'
                  ? 'Thiết lập danh sách lựa chọn cho vòng quay'
                  : 'Sân khấu vòng quay trực tiếp'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSpinning}
            className="p-1.5 rounded-full text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* VIEW MODE 1: SETUP (BẢNG THIẾT LẬP - BỎ KẾT QUẢ ĐI)            */}
        {/* ============================================================== */}
        {viewMode === 'setup' ? (
          <>
            {/* Dãy Tabs các vòng: Vòng 1, Vòng 2, ... (KHÔNG CÓ TAB KẾT QUẢ) */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-3 border-b border-circle-hairline dark:border-circle-dark-hairline no-scrollbar shrink-0">
              {wheels.map((wheel) => {
                const isSelected = activeWheelId === wheel.id;
                return (
                  <button
                    key={wheel.id}
                    onClick={() => setActiveWheelId(wheel.id)}
                    className={`flex items-center justify-center w-28 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
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
                            className="p-1 rounded-md bg-circle-primary text-white"
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
                            className="opacity-70 hover:opacity-100 p-1 rounded hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted transition-opacity"
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
                          className="p-1.5 rounded-lg text-circle-slate dark:text-circle-dark-muted hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 transition-colors"
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
                        className="w-full flex-1 min-h-[120px] p-2.5 text-xs rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/50 dark:placeholder:text-circle-dark-muted/50 focus:outline-none focus:ring-1 focus:ring-circle-primary resize-none font-mono"
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
                        className="flex items-center justify-center py-1.5 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-95"
                        title={t.luckyWheel.shuffleOptions}
                      >
                        <Shuffle className="w-4 h-4 text-circle-sage dark:text-circle-primary" />
                      </button>

                      <button
                        type="button"
                        onClick={handleSortAZ}
                        className="flex items-center justify-center py-1.5 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-95"
                        title={t.luckyWheel.sortAZ}
                      >
                        <ArrowDownAZ className="w-4 h-4 text-indigo-500" />
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveAsInitial}
                        className={`flex items-center justify-center py-1.5 px-2 rounded-xl border transition-all active:scale-95 ${
                          saveInitialFeedback
                            ? 'border-circle-primary bg-circle-wash dark:bg-circle-dark-wash'
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
                        className="flex items-center justify-center py-1.5 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-95"
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
                className="flex items-center gap-1.5 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors"
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
                className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-semibold disabled:opacity-40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.luckyWheel.deleteAllWheels}</span>
              </button>
            </div>

            {/* HÀNG NÚT Ở DƯỚI BẬT TẮT ÂM THANH: [Thêm vòng xoay] & [Tạo] */}
            <div className="flex items-center gap-2.5 pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline shrink-0">
              {/* Nút Thêm vòng xoay */}
              <button
                type="button"
                onClick={handleAddDefaultWheel}
                disabled={wheels.length >= 4 || createWheelMutation.isPending}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-xs font-bold text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 transition-all active:scale-95"
                title={wheels.length >= 4 ? t.luckyWheel.maxWheelsBadge : undefined}
              >
                <Plus className="w-4 h-4 text-circle-sage dark:text-circle-primary" />
                <span>{t.luckyWheel.addWheel}</span>
              </button>

              {/* Nút TẠO (Thay thế nút Quay tất cả theo yêu cầu) */}
              <button
                type="button"
                onClick={handleCreateStage}
                disabled={wheels.length === 0 || createStageMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal dark:text-circle-dark-canvas font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {createStageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>
                  {createStageMutation.isPending
                    ? locale === 'vi'
                      ? 'Đang tạo...'
                      : 'Creating...'
                    : locale === 'vi'
                    ? 'Tạo'
                    : 'Create'}
                </span>
              </button>
            </div>
          </>
        ) : (
          /* ============================================================== */
          /* VIEW MODE 2: SÂN KHẤU CÁC VÒNG TRÒN (CÓ NÚT QUAY & KẾT QUẢ)   */
          /* ============================================================== */
          <div className="flex-1 flex flex-col items-center justify-between overflow-y-auto py-2 gap-4">
            {/* VÙNG HIỂN THỊ CÁC VÒNG TRÒN ĐƯỢC TẠO RA */}
            <div className="w-full flex-1 flex flex-col items-center justify-center py-2">
              <div
                className={`w-full flex items-center justify-center gap-5 flex-wrap ${
                  wheels.length >= 3 ? 'grid grid-cols-2 max-w-sm mx-auto' : ''
                }`}
              >
                {wheels.map((wheel) => {
                  const optionsText = wheelsState[wheel.id]?.optionsText || '';
                  const parsed = parseOptions(optionsText);
                  const rot = wheelRotations[wheel.id] || 0;

                  return (
                    <div key={wheel.id} className="flex flex-col items-center justify-center gap-2">
                      <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text px-2 py-0.5 rounded-md bg-circle-wash dark:bg-circle-dark-wash truncate max-w-[140px]">
                        {wheel.title}
                      </span>
                      <SingleWheelCanvas
                        options={parsed}
                        rotation={rot}
                        size={wheelCanvasSize}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PHẦN KẾT QUẢ VÒNG QUAY */}
            <div className="w-full min-h-[64px] flex items-center justify-center">
              {isSpinning ? (
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-xs sm:text-sm font-semibold border border-teal-200 dark:border-teal-800 animate-pulse">
                  <RotateCw className="w-4 h-4 animate-spin text-teal-600 dark:text-teal-400" />
                  <span>{t.luckyWheel.spinningLive}</span>
                </div>
              ) : lastSpinResult ? (
                <div className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 border-2 border-amber-500/40 text-center animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-0.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t.luckyWheel.winnerAnnounce}</span>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 tracking-wide break-words drop-shadow-xs">
                    {lastSpinResult}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-circle-slate dark:text-circle-dark-muted italic text-center">
                  {locale === 'vi'
                    ? 'Nhấn nút "Quay" bên dưới để bắt đầu quay trực tiếp trong nhóm!'
                    : 'Click "Spin" below to start live spinning for the group!'}
                </div>
              )}
            </div>

            {/* NÚT QUAY VÀ CÁC THAO TÁC Ở SÂN KHẤU */}
            <div className="w-full flex flex-col gap-2 pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline shrink-0">
              <button
                type="button"
                onClick={handleStartSpin}
                disabled={isSpinning || wheels.length === 0}
                className="w-full py-3 px-5 rounded-2xl bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal dark:text-circle-dark-canvas font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-circle-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isSpinning ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
                <span>
                  {isSpinning
                    ? t.luckyWheel.spinning
                    : lastSpinResult
                    ? t.luckyWheel.spinAgain
                    : wheels.length > 1
                    ? t.luckyWheel.spinAll
                    : t.luckyWheel.spin}
                </span>
              </button>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('setup')}
                  disabled={isSpinning}
                  className="py-1.5 px-3 rounded-xl text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{locale === 'vi' ? 'Chỉnh sửa vòng quay' : 'Edit wheel'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSpinning}
                  className="py-1.5 px-3 rounded-xl text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                >
                  <span>{t.luckyWheel.backToChat}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
