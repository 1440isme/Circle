'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Compass,
  Plus,
  Trash2,
  X,
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
  PanelRightClose,
  PanelRightOpen,
  BookmarkCheck,
  Share2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { getSocket } from '../../lib/socket';
import {
  useWheelsQuery,
  useCreateWheelMutation,
  useUpdateWheelMutation,
  useSpinWheelMutation,
  useSpinAllWheelsMutation,
  useDeleteWheelMutation,
  useDeleteAllWheelsMutation,
  useShareWheelResultsToChatMutation,
} from '../../hooks/use-circle-tools';
import { DecisionWheelEntity, SpinWheelResult } from '@circle/types';

interface CircleWheelViewProps {
  circleId: string;
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

// Web Audio API Synthesizer (Zero external dependencies)
class WheelAudioEngine {
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
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.035);
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
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.55);
      });
    } catch {}
  }
}

const audio = new WheelAudioEngine();

// Canvas Wheel Component
const WheelCanvas: React.FC<{
  options: { label: string; color: string }[];
  rotation: number;
  size?: number;
  onClick?: () => void;
}> = ({ options, rotation, size = 260, onClick }) => {
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
    const radius = center - 1;
    const count = Math.max(options.length, 1);
    const sliceAngle = (2 * Math.PI) / count;

    ctx.clearRect(0, 0, size, size);

    // Save and rotate context
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((rotation * Math.PI) / 180);

    // Draw slices
    options.forEach((opt, idx) => {
      const startAngle = idx * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = opt.color || PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length]!;
      ctx.fill();



      // Label text: Modern, crisp, dark charcoal color for high readability on pastel
      ctx.save();
      const midAngle = startAngle + sliceAngle / 2;
      ctx.rotate(midAngle);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#1E293B';
      ctx.font = `600 ${size > 280 ? 13 : 11}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
      ctx.shadowBlur = 2;

      const maxLabelLen = size > 280 ? 15 : 11;
      let label = opt.label;
      if (label.length > maxLabelLen) {
        label = label.substring(0, maxLabelLen - 1) + '…';
      }
      ctx.fillText(label, radius - 16, 4);
      ctx.restore();
    });

    ctx.restore();

    // Center circular hub
    ctx.beginPath();
    ctx.arc(center, center, size > 280 ? 22 : 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#E2E8F0';
    ctx.stroke();

    // Center small circle (brand teal)
    ctx.beginPath();
    ctx.arc(center, center, size > 280 ? 8 : 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#0D9488';
    ctx.fill();
  }, [options, rotation, size]);

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.99]"
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="rounded-full shadow-lg"
      />
      {/* Sleek needle pointer anchored on the RIGHT OUTSIDE, pointing into the wheel */}
      <div
        className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none drop-shadow-md flex items-center"
        style={{ right: -26 }}
      >
        <svg width="34" height="24" viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Needle body pointing left */}
          <path
            d="M 2 12 L 20 3 C 22 2 24 3 24 5.5 V 18.5 C 24 21 22 22 20 21 L 2 12 Z"
            fill="#0D9488"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Base mounting bracket on the right (firmly outside the wheel) */}
          <rect x="22" y="5" width="10" height="14" rx="3.5" fill="#0F766E" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="27" cy="12" r="3" fill="#FFFFFF" />
          <circle cx="27" cy="12" r="1.5" fill="#0D9488" />
        </svg>
      </div>
    </div>
  );
};

export const CircleWheelView: React.FC<CircleWheelViewProps> = ({ circleId }) => {
  const { user } = useAuth();
  const { t } = useLanguageStore();

  const { data: wheels = [], isLoading: isLoadingWheels } = useWheelsQuery(circleId);

  const createWheelMutation = useCreateWheelMutation(circleId);
  const updateWheelMutation = useUpdateWheelMutation(circleId);
  const deleteWheelMutation = useDeleteWheelMutation(circleId);
  const deleteAllMutation = useDeleteAllWheelsMutation(circleId);
  const spinWheelMutation = useSpinWheelMutation(circleId);
  const spinAllMutation = useSpinAllWheelsMutation(circleId);

  const shareResultsMutation = useShareWheelResultsToChatMutation(circleId);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Active Tab: Selected Wheel ID or 'results'
  const [activeTab, setActiveTab] = useState<string>('wheel');
  const [activeWheelId, setActiveWheelId] = useState<string | null>(null);

  // Results Text: Mỗi dòng là kết quả của 1 lần quay (các vòng cách nhau bởi dấu " - ")
  const [resultsText, setResultsText] = useState<string>('');
  const resultLines = useMemo(() => {
    return resultsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }, [resultsText]);
  const resultLinesCount = resultLines.length;

  // Panel Collapsed State (cho phép ẩn bảng để vòng tròn to hơn, mặc định thu gọn khi mới vào)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);

  // Auto-seed: Khởi tạo 1 vòng mặc định ngay khi tải trang nếu Circle chưa có vòng nào (mở ra là quay ngay)
  const autoSeedRef = useRef(false);
  useEffect(() => {
    if (!isLoadingWheels && wheels.length === 0 && !autoSeedRef.current && !createWheelMutation.isPending) {
      autoSeedRef.current = true;
      const defaultTitle = t.luckyWheel.wheelNumber.replace('{number}', '1');
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
          confettiEnabled: false,
        },
        {
          onSuccess: (newWheel) => {
            if (newWheel?.id) {
              setActiveWheelId(newWheel.id);
            }
          },
        }
      );
    }
  }, [isLoadingWheels, wheels.length, createWheelMutation, t.luckyWheel.wheelNumber]);

  // Local state per wheel (textarea, rotation, isSpinning)
  interface WheelLocalState {
    optionsText: string;
    rotation: number;
    isSpinning: boolean;
    lastResult: string | null;
  }
  const [wheelsState, setWheelsState] = useState<Record<string, WheelLocalState>>({});

  // Batch Spinning Accumulator (gom kết quả chung khi quay nhiều vòng cùng lúc)
  const activeSpinningBatchRef = useRef<Set<string>>(new Set());
  const batchResultsAccumulatorRef = useRef<
    { wheelId: string; wheelTitle: string; result: string; resultIndex: number }[]
  >([]);

  // Batch Results Modal
  const [combinedResultsModal, setCombinedResultsModal] = useState<
    { wheelId: string; wheelTitle: string; result: string; resultIndex: number }[] | null
  >(null);

  // Synchronize wheels into local state
  useEffect(() => {
    if (wheels.length === 0) return;

    setWheelsState((prev) => {
      const next = { ...prev };
      wheels.forEach((w) => {
        if (!next[w.id]) {
          const text = (w.options || []).map((o) => o.optionLabel).join('\n');
          next[w.id] = {
            optionsText: text,
            rotation: 0,
            isSpinning: false,
            lastResult: w.lastResult || null,
          };
        }
      });
      return next;
    });

    if (!activeWheelId || !wheels.some((w) => w.id === activeWheelId)) {
      const fallbackId = wheels[0]?.id || null;
      setActiveWheelId(fallbackId);
      if (activeTab !== 'results' && fallbackId) {
        setActiveTab(fallbackId);
      }
    }
  }, [wheels, activeWheelId, activeTab]);

  // Active Wheel entity
  const activeWheel = useMemo(
    () => wheels.find((w) => w.id === activeWheelId) || wheels[0] || null,
    [wheels, activeWheelId]
  );

  const activeLocalState = useMemo(() => {
    if (!activeWheel) return null;
    return (
      wheelsState[activeWheel.id] || {
        optionsText: (activeWheel.options || []).map((o) => o.optionLabel).join('\n'),
        rotation: 0,
        isSpinning: false,
        lastResult: activeWheel.lastResult || null,
      }
    );
  }, [activeWheel, wheelsState]);

  // Is any wheel spinning currently?
  const isAnySpinning = useMemo(
    () => Object.values(wheelsState).some((s) => s.isSpinning),
    [wheelsState]
  );

  // Parse lines to options helper
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

  // Debounced auto-save timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerAutoSave = useCallback(
    (wheelId: string, text: string) => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        const lines = text
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        if (lines.length >= 1) {
          updateWheelMutation.mutate({
            wheelId,
            input: {
              options: lines.map((opt, idx) => ({
                optionLabel: opt,
                color: PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length],
              })),
            },
          });
        }
      }, 900);
    },
    [updateWheelMutation]
  );

  // Add default wheel without popup
  const handleAddDefaultWheel = () => {
    if (wheels.length >= 4 || isAnySpinning) return;
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

  // Textarea change handler for active wheel
  const handleOptionsChange = (newText: string) => {
    if (!activeWheel || isAnySpinning) return;
    setWheelsState((prev) => ({
      ...prev,
      [activeWheel.id]: {
        ...(prev[activeWheel.id] || { rotation: 0, isSpinning: false, lastResult: null }),
        optionsText: newText,
      },
    }));
    triggerAutoSave(activeWheel.id, newText);
  };

  // Shuffle options for active wheel
  const handleShuffle = () => {
    if (!activeWheel || !activeLocalState || isAnySpinning) return;
    const lines = activeLocalState.optionsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return;

    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lines[i], lines[j]] = [lines[j]!, lines[i]!];
    }
    const shuffledText = lines.join('\n');
    handleOptionsChange(shuffledText);
  };

  // Sort options A-Z (Alphabetical)
  const handleSortAZ = () => {
    if (!activeWheel || !activeLocalState || isAnySpinning) return;
    const lines = activeLocalState.optionsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return;

    lines.sort((a, b) => a.localeCompare(b, 'vi', { sensitivity: 'base' }));
    const sortedText = lines.join('\n');
    handleOptionsChange(sortedText);
  };

  // Save current options as initial baseline
  const [saveInitialFeedback, setSaveInitialFeedback] = useState(false);
  const handleSaveAsInitial = () => {
    if (!activeWheel || !activeLocalState || isAnySpinning) return;
    const lines = activeLocalState.optionsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 1) return;

    updateWheelMutation.mutate(
      {
        wheelId: activeWheel.id,
        input: {
          initialOptions: lines,
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

  // Reset options to initial
  const handleReset = () => {
    if (!activeWheel || isAnySpinning) return;
    const initial = activeWheel.initialOptions || [];
    if (initial.length >= 2) {
      if (window.confirm(t.luckyWheel.confirmReset)) {
        handleOptionsChange(initial.join('\n'));
      }
    } else {
      alert(t.luckyWheel.resetEmptyWarning);
    }
  };

  // Delete All Wheels (leaves 1 default wheel)
  const handleDeleteAllWheels = () => {
    if (isAnySpinning || wheels.length === 0) return;
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

  // Settings toggle (hoạt động cho cả tab setup lẫn tab kết quả)
  const currentSoundEnabled = activeWheel
    ? (activeWheel.soundEnabled ?? true)
    : (wheels[0]?.soundEnabled ?? true);

  const handleToggleSound = () => {
    const target = activeWheel || wheels[0];
    if (!target || isAnySpinning) return;
    updateWheelMutation.mutate({
      wheelId: target.id,
      input: { soundEnabled: !currentSoundEnabled },
    });
  };

  // Inline rename title
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleText, setEditingTitleText] = useState('');

  const startEditTitle = () => {
    if (!activeWheel || isAnySpinning) return;
    setEditingTitleText(activeWheel.title);
    setIsEditingTitle(true);
  };

  const saveEditTitle = () => {
    if (!activeWheel || isAnySpinning) return;
    const trimmed = editingTitleText.trim();
    if (trimmed && trimmed !== activeWheel.title) {
      updateWheelMutation.mutate({
        wheelId: activeWheel.id,
        input: { title: trimmed },
      });
    }
    setIsEditingTitle(false);
  };

  // Animate a single wheel rotation
  const animateWheelRotation = useCallback(
    (
      wheelId: string,
      targetIndex: number,
      totalCount: number,
      soundEnabled: boolean,
      wheelTitle: string,
      resultLabel: string
    ) => {
      const sliceDeg = 360 / totalCount;
      const targetCenterDeg = targetIndex * sliceDeg + sliceDeg / 2;
      const stopAngle = (360 - (targetCenterDeg % 360)) % 360;

      const currentRotation = wheelsState[wheelId]?.rotation || 0;
      const currentNorm = currentRotation % 360;
      const extraSpins = 6 * 360;
      let delta = stopAngle - currentNorm;
      if (delta < 0) delta += 360;
      const finalRotation = currentRotation + extraSpins + delta;

      const duration = 5200; // 5.2 seconds
      const startTime = performance.now();
      let lastTickAngle = currentRotation;

      setWheelsState((prev) => ({
        ...prev,
        [wheelId]: {
          ...(prev[wheelId] || { optionsText: '', lastResult: null }),
          isSpinning: true,
          rotation: currentRotation,
        },
      }));

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4);
        const currRot = currentRotation + (finalRotation - currentRotation) * easeOut;

        if (soundEnabled && Math.abs(currRot - lastTickAngle) >= sliceDeg) {
          audio.playTick();
          lastTickAngle = currRot;
        }

        setWheelsState((prev) => ({
          ...prev,
          [wheelId]: {
            ...(prev[wheelId] || { optionsText: '', lastResult: null }),
            isSpinning: true,
            rotation: currRot,
          },
        }));

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setWheelsState((prev) => ({
            ...prev,
            [wheelId]: {
              ...(prev[wheelId] || { optionsText: '' }),
              isSpinning: false,
              rotation: finalRotation,
              lastResult: resultLabel,
            },
          }));

          if (soundEnabled) audio.playFanfare();

          // Add this result to the batch accumulator
          batchResultsAccumulatorRef.current.push({
            wheelId,
            wheelTitle,
            result: resultLabel,
            resultIndex: targetIndex,
          });

          // Remove from active batch
          activeSpinningBatchRef.current.delete(wheelId);

          // If ALL spinning wheels in this active batch have completed, display combined modal!
          if (activeSpinningBatchRef.current.size === 0) {
            const rawBatch = [...batchResultsAccumulatorRef.current];

            // Sắp xếp các kết quả theo thứ tự của wheels
            const sortedBatch = [...rawBatch].sort((a, b) => {
              const idxA = wheels.findIndex((w) => w.id === a.wheelId);
              const idxB = wheels.findIndex((w) => w.id === b.wheelId);
              return idxA - idxB;
            });

            setCombinedResultsModal(sortedBatch);

            // Nối kết quả của các vòng trong lần này bằng dấu " - " (ghi dạng text như khi nhập)
            const roundLine = sortedBatch.map((b) => b.result).join(' - ');
            setResultsText((prev) => (prev ? `${prev}\n${roundLine}` : roundLine));

            batchResultsAccumulatorRef.current = [];
          }
        }
      };

      requestAnimationFrame(step);
    },
    [wheelsState]
  );

  // Spin a single wheel
  const handleSpinSingle = (wheel: DecisionWheelEntity) => {
    const localState = wheelsState[wheel.id];
    if (localState?.isSpinning) return;

    const parsed = parseOptions(localState?.optionsText || '');
    if (parsed.length < 1) return;

    // Register into active batch
    activeSpinningBatchRef.current.add(wheel.id);

    spinWheelMutation.mutate(wheel.id, {
      onSuccess: (res) => {
        const targetIdx =
          res.selectedOptionIndex !== undefined
            ? res.selectedOptionIndex
            : parsed.findIndex((p) => p.label === res.selectedOption.optionLabel);
        const validIdx = targetIdx >= 0 ? targetIdx : 0;

        animateWheelRotation(
          wheel.id,
          validIdx,
          parsed.length,
          wheel.soundEnabled ?? true,
          wheel.title,
          res.selectedOption.optionLabel
        );
      },
      onError: () => {
        activeSpinningBatchRef.current.delete(wheel.id);
      },
    });
  };

  // Spin ALL wheels simultaneously
  const handleSpinAll = () => {
    if (wheels.length === 0 || isAnySpinning || spinAllMutation.isPending) return;

    wheels.forEach((w) => {
      const parsed = parseOptions(wheelsState[w.id]?.optionsText || '');
      if (parsed.length >= 1) {
        activeSpinningBatchRef.current.add(w.id);
      }
    });

    spinAllMutation.mutate(undefined, {
      onSuccess: (results: SpinWheelResult[]) => {
        results.forEach((r: SpinWheelResult) => {
          const w = wheels.find((item) => item.id === r.wheelId);
          if (!w) return;
          const parsed = parseOptions(wheelsState[w.id]?.optionsText || '');
          if (parsed.length < 1) return;

          const targetIdx =
            r.selectedOptionIndex !== undefined
              ? r.selectedOptionIndex
              : parsed.findIndex((p) => p.label === r.selectedOption.optionLabel);
          const validIdx = targetIdx >= 0 ? targetIdx : 0;

          animateWheelRotation(
            w.id,
            validIdx,
            parsed.length,
            w.soundEnabled ?? true,
            w.title,
            r.selectedOption.optionLabel
          );
        });
      },
      onError: () => {
        activeSpinningBatchRef.current.clear();
      },
    });
  };

  // Remove result from a wheel
  const handleRemoveResult = (wheelId: string, resultIndex: number) => {
    const local = wheelsState[wheelId];
    if (!local) return;
    const lines = local.optionsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (resultIndex >= 0 && resultIndex < lines.length) {
      lines.splice(resultIndex, 1);
      const newText = lines.join('\n');
      setWheelsState((prev) => ({
        ...prev,
        [wheelId]: {
          ...prev[wheelId]!,
          optionsText: newText,
        },
      }));
      triggerAutoSave(wheelId, newText);
    }

    setCombinedResultsModal((prev) => {
      if (!prev) return null;
      const remaining = prev.filter(
        (p) => !(p.wheelId === wheelId && p.resultIndex === resultIndex),
      );
      return remaining.length > 0 ? remaining : null;
    });
  };

  // Sort results: toggle between alphabetical (A-Z) and reverse order
  const handleSortResults = () => {
    if (resultLines.length < 2) return;
    const isSortedAZ = resultLines.every(
      (line, idx, arr) => idx === 0 || line.localeCompare(arr[idx - 1]!, 'vi') >= 0
    );
    const sorted = isSortedAZ
      ? [...resultLines].reverse()
      : [...resultLines].sort((a, b) => a.localeCompare(b, 'vi'));
    setResultsText(sorted.join('\n'));
  };

  // Share results board to circle chat channel
  const handleShareResultsToChat = () => {
    if (resultLines.length === 0 || shareResultsMutation.isPending) return;
    shareResultsMutation.mutate(
      resultLines.map((line, idx) => ({
        wheelTitle: `Lần ${idx + 1}`,
        winner: line,
      })),
      {
        onSuccess: () => {
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 2500);
        },
      }
    );
  };

  // Clear all results history with confirmation
  const handleClearResults = () => {
    if (resultLines.length === 0) return;
    if (window.confirm(t.luckyWheel.confirmClearResultsDesc)) {
      setResultsText('');
    }
  };

  // Realtime Socket.IO listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleWheelSpun = (data: any) => {
      if (data.spunBy?.userId === user?.id) return; // Ignore own trigger already animated

      if (data.isSpinAll && Array.isArray(data.results)) {
        data.results.forEach((r: any) => {
          const w = wheels.find((item) => item.id === r.wheelId);
          if (!w) return;
          const parsed = parseOptions(wheelsState[w.id]?.optionsText || '');
          if (parsed.length >= 1) {
            animateWheelRotation(
              w.id,
              r.selectedOptionIndex ?? 0,
              parsed.length,
              w.soundEnabled ?? true,
              w.title,
              r.selectedOption.optionLabel
            );
          }
        });
      } else if (data.wheelId) {
        const w = wheels.find((item) => item.id === data.wheelId);
        if (w) {
          const parsed = parseOptions(wheelsState[w.id]?.optionsText || '');
          if (parsed.length >= 1) {
            animateWheelRotation(
              w.id,
              data.selectedOptionIndex ?? 0,
              parsed.length,
              w.soundEnabled ?? true,
              w.title,
              data.selectedOption.optionLabel
            );
          }
        }
      }
    };

    socket.on('circle:wheel-spun', handleWheelSpun);
    return () => {
      socket.off('circle:wheel-spun', handleWheelSpun);
    };
  }, [wheels, wheelsState, user?.id, animateWheelRotation, parseOptions]);

  if (isLoadingWheels) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">{t.luckyWheel.saving}</p>
      </div>
    );
  }

  // Active wheel parsed options
  const activeParsedOptions = parseOptions(activeLocalState?.optionsText || '');

  // Calculate dynamic wheel size depending on panel collapsed state
  const getWheelSize = (count: number) => {
    if (isPanelCollapsed) {
      if (count === 1) return 460;
      if (count === 2) return 320;
      if (count === 3) return 280;
      return 260; // 4 wheels 2x2
    } else {
      if (count === 1) return 360;
      if (count === 2) return 250;
      if (count === 3) return 220;
      return 210; // 4 wheels 2x2
    }
  };

  const wheelSize = getWheelSize(wheels.length);

  // Loại bỏ tất cả kết quả trúng thưởng vừa quay và đóng modal
  const handleRemoveAllBatchResults = () => {
    if (!combinedResultsModal) return;
    combinedResultsModal.forEach((item) => {
      handleRemoveResult(item.wheelId, item.resultIndex);
    });
    setCombinedResultsModal(null);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full bg-circle-canvas dark:bg-circle-dark-surface overflow-y-auto p-4 md:p-6 transition-colors">
      {/* Floating Pill Toolbar: Các nút điều khiển dạng Floating Pill Button */}
      <div className="sticky top-0 z-20 flex items-center justify-end pointer-events-none mb-3 py-1">


        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Add Wheel Pill Button */}
          <button
            onClick={handleAddDefaultWheel}
            disabled={wheels.length >= 4 || isAnySpinning || createWheelMutation.isPending}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full border border-border/80 bg-background/90 dark:bg-circle-dark-surface/90 backdrop-blur-md shadow-xs hover:bg-muted text-foreground transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title={wheels.length >= 4 ? t.luckyWheel.maxWheelsBadge : undefined}
          >
            <Plus className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{t.luckyWheel.addWheel}</span>
          </button>

          {/* Spin All Pill Button */}
          {wheels.length > 0 && (
            <button
              onClick={handleSpinAll}
              disabled={isAnySpinning || spinAllMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-bold rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isAnySpinning ? 'animate-spin' : ''}`} />
              <span>{t.luckyWheel.spinAll}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Responsive Layout */}
      <div className="relative flex flex-col lg:flex-row gap-6 w-full flex-1 items-stretch">
        {/* LEFT COLUMN: Visual Arena */}
        <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 transition-all min-h-[460px]">
          {/* SÂN KHẤU VÒNG QUAY (VISUAL ARENA) */}
          {wheels.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <Compass className="w-16 h-16 text-muted-foreground/30 mb-3" />
              <h3 className="text-base font-semibold text-foreground mb-1">
                {t.luckyWheel.emptyWheelsTitle}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-4">
                {t.luckyWheel.emptyWheelsDesc}
              </p>
              <button
                onClick={handleAddDefaultWheel}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
              >
                <Plus className="w-4 h-4" />
                {t.luckyWheel.createWheel}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-6 w-full">
              {/* 1 VÒNG: Hiển thị 1 vòng to chính giữa */}
              {wheels.length === 1 && (
                <div className="flex flex-col items-center justify-center gap-3">
                  {/* Tên vòng xoay ghi trên vòng: ấn vào tên mới mở bảng setup */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveWheelId(wheels[0]!.id);
                      setActiveTab(wheels[0]!.id);
                      setIsPanelCollapsed(false);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-sm sm:text-base font-bold transition-all shadow-2xs max-w-[260px] ${
                      activeWheelId === wheels[0]!.id
                        ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                        : 'bg-card/90 dark:bg-circle-dark-surface/90 border-border/80 text-foreground hover:bg-muted'
                    }`}
                    title={wheels[0]!.title}
                  >
                    <Compass className={`w-4 h-4 shrink-0 ${activeWheelId === wheels[0]!.id ? 'text-white' : 'text-teal-600'}`} />
                    <span className="truncate">{wheels[0]!.title}</span>
                  </button>

                  <WheelCanvas
                    options={parseOptions(wheelsState[wheels[0]!.id]?.optionsText || '')}
                    rotation={wheelsState[wheels[0]!.id]?.rotation || 0}
                    size={wheelSize}
                    onClick={() => {
                      handleSpinSingle(wheels[0]!);
                    }}
                  />
                </div>
              )}

              {/* 2 VÒNG: Hàng trên 2 vòng đặt cạnh nhau */}
              {wheels.length === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl justify-items-center">
                  {wheels.map((wheel) => {
                    const local = wheelsState[wheel.id];
                    const parsed = parseOptions(local?.optionsText || '');
                    return (
                      <div
                        key={wheel.id}
                        className="flex flex-col items-center gap-2.5 p-2 rounded-2xl transition-all"
                      >
                        {/* Tên vòng xoay ghi trên vòng: ấn vào tên mới mở bảng setup */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveWheelId(wheel.id);
                            setActiveTab(wheel.id);
                            setIsPanelCollapsed(false);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs max-w-[200px] ${
                            activeWheelId === wheel.id
                              ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                              : 'bg-card/90 dark:bg-circle-dark-surface/90 border-border/80 text-foreground hover:bg-muted'
                          }`}
                          title={wheel.title}
                        >
                          <Compass className={`w-3.5 h-3.5 shrink-0 ${activeWheelId === wheel.id ? 'text-white' : 'text-teal-600'}`} />
                          <span className="truncate">{wheel.title}</span>
                        </button>

                        <WheelCanvas
                          options={parsed}
                          rotation={local?.rotation || 0}
                          size={wheelSize}
                          onClick={() => {
                            handleSpinSingle(wheel);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3 VÒNG: Hàng trên 2 vòng, Hàng dưới 1 vòng ở giữa */}
              {wheels.length === 3 && (
                <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
                  {/* Top row: 2 wheels */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full justify-items-center">
                    {wheels.slice(0, 2).map((wheel) => {
                      const local = wheelsState[wheel.id];
                      const parsed = parseOptions(local?.optionsText || '');
                      return (
                        <div
                          key={wheel.id}
                          className="flex flex-col items-center gap-2.5 p-2 rounded-2xl transition-all"
                        >
                          {/* Tên vòng xoay ghi trên vòng: ấn vào tên mới mở bảng setup */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveWheelId(wheel.id);
                              setActiveTab(wheel.id);
                              setIsPanelCollapsed(false);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs max-w-[200px] ${
                              activeWheelId === wheel.id
                                ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                              : 'bg-card/90 dark:bg-circle-dark-surface/90 border-border/80 text-foreground hover:bg-muted'
                            }`}
                            title={wheel.title}
                          >
                            <Compass className={`w-3.5 h-3.5 shrink-0 ${activeWheelId === wheel.id ? 'text-white' : 'text-teal-600'}`} />
                            <span className="truncate">{wheel.title}</span>
                          </button>

                          <WheelCanvas
                            options={parsed}
                            rotation={local?.rotation || 0}
                            size={wheelSize}
                            onClick={() => {
                              handleSpinSingle(wheel);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom row: 1 wheel centered */}
                  {wheels[2] && (
                    <div className="flex flex-col items-center gap-2.5 p-2 rounded-2xl transition-all">
                      {/* Tên vòng xoay ghi trên vòng: ấn vào tên mới mở bảng setup */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveWheelId(wheels[2]!.id);
                          setActiveTab(wheels[2]!.id);
                          setIsPanelCollapsed(false);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs max-w-[200px] ${
                          activeWheelId === wheels[2]!.id
                            ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                            : 'bg-card/90 dark:bg-circle-dark-surface/90 border-border/80 text-foreground hover:bg-muted'
                        }`}
                        title={wheels[2]!.title}
                      >
                        <Compass className={`w-3.5 h-3.5 shrink-0 ${activeWheelId === wheels[2]!.id ? 'text-white' : 'text-teal-600'}`} />
                        <span className="truncate">{wheels[2]!.title}</span>
                      </button>

                      <WheelCanvas
                        options={parseOptions(wheelsState[wheels[2]!.id]?.optionsText || '')}
                        rotation={wheelsState[wheels[2]!.id]?.rotation || 0}
                        size={wheelSize}
                        onClick={() => {
                          handleSpinSingle(wheels[2]!);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 4 VÒNG: LƯỚI 2x2 (2 vòng hàng trên, 2 vòng hàng dưới) */}
              {wheels.length === 4 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl justify-items-center">
                  {wheels.map((wheel) => {
                    const local = wheelsState[wheel.id];
                    const parsed = parseOptions(local?.optionsText || '');
                    return (
                      <div
                        key={wheel.id}
                        className="flex flex-col items-center gap-2.5 p-2 rounded-2xl transition-all"
                      >
                        {/* Tên vòng xoay ghi trên vòng: ấn vào tên mới mở bảng setup */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveWheelId(wheel.id);
                            setActiveTab(wheel.id);
                            setIsPanelCollapsed(false);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs max-w-[200px] ${
                            activeWheelId === wheel.id
                              ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                              : 'bg-card/90 dark:bg-circle-dark-surface/90 border-border/80 text-foreground hover:bg-muted'
                          }`}
                          title={wheel.title}
                        >
                          <Compass className={`w-3.5 h-3.5 shrink-0 ${activeWheelId === wheel.id ? 'text-white' : 'text-teal-600'}`} />
                          <span className="truncate">{wheel.title}</span>
                        </button>

                        <WheelCanvas
                          options={parsed}
                          rotation={local?.rotation || 0}
                          size={wheelSize}
                          onClick={() => {
                            handleSpinSingle(wheel);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: "CÁI BẢNG" (TABBED OPTIONS BOARD & RESULTS) */}
        {!isPanelCollapsed && (
          <div className="relative w-full lg:w-[380px] xl:w-[420px] flex flex-col bg-card rounded-2xl border border-border/70 shadow-sm p-4 sm:p-5 transition-all">
            {/* Nút thu gọn bảng: Nằm giữa cái viền luôn nửa trong nửa ngoài */}
            <button
              type="button"
              onClick={() => setIsPanelCollapsed(true)}
              className="absolute top-6 -left-3.5 z-30 w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-circle-charcoal border border-border/80 shadow-md hover:bg-slate-50 dark:hover:bg-circle-dark-surface text-slate-500 hover:text-teal-600 transition-all active:scale-90"
              title={t.luckyWheel.collapsePanel || 'Thu gọn bảng'}
              aria-label={t.luckyWheel.collapsePanel || 'Thu gọn bảng'}
            >
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>

            {/* Tabs Header: Tên của từng vòng + TAB KẾT QUẢ */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-border/60 no-scrollbar">
                {wheels.map((wheel) => {
                  const isSelected = activeTab === wheel.id;
                  return (
                    <button
                      key={wheel.id}
                      onClick={() => {
                        setActiveTab(wheel.id);
                        setActiveWheelId(wheel.id);
                      }}
                      className={`flex items-center px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-xs font-bold'
                          : 'bg-slate-100 dark:bg-circle-dark-hairline text-slate-600 dark:text-circle-dark-muted hover:bg-slate-200 dark:hover:bg-white/10 hover:text-foreground'
                      }`}
                    >
                      <span className="max-w-[130px] truncate">{wheel.title}</span>
                    </button>
                  );
                })}

                {/* Tab Kết Quả */}
                <button
                  onClick={() => setActiveTab('results')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'results'
                      ? 'bg-amber-500 text-white shadow-xs font-bold'
                      : 'bg-slate-100 dark:bg-circle-dark-hairline text-slate-600 dark:text-circle-dark-muted hover:bg-slate-200 dark:hover:bg-white/10 hover:text-foreground'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{t.luckyWheel.resultsTab}</span>
                  {resultLinesCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        activeTab === 'results'
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {resultLinesCount}
                    </span>
                  )}
                </button>
            </div>

            {/* TAB CONTENT: KẾT QUẢ (DẠNG TEXT NHƯ KHI NHẬP, GHI THEO LẦN) */}
            {activeTab === 'results' ? (
              <div className="flex-1 flex flex-col pt-4 gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-sm text-foreground">
                      {t.luckyWheel.resultsHistoryTitle}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      ({resultLinesCount})
                    </span>
                  </div>
                </div>

                {/* Textarea lớn hiển thị & cho phép sửa kết quả dạng text */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <textarea
                    value={resultsText}
                    onChange={(e) => setResultsText(e.target.value)}
                    placeholder={t.luckyWheel.resultsPlaceholder}
                    className="w-full flex-1 min-h-[220px] p-3 text-sm rounded-xl border border-border/80 bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/40 focus:outline-none resize-none leading-relaxed transition-all font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {t.luckyWheel.resultsHint}
                  </p>
                </div>

                {/* Thanh tác vụ dưới cùng: Sắp xếp, Gửi tin nhắn, Xoá tất cả (Icons only) */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
                  {/* Nút Sắp xếp */}
                  <button
                    onClick={handleSortResults}
                    disabled={resultLinesCount < 2}
                    className="flex items-center justify-center py-2 px-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 transition-all active:scale-95 text-foreground"
                    title={t.luckyWheel.sortResults}
                    aria-label={t.luckyWheel.sortResults}
                  >
                    <ArrowDownAZ className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </button>

                  {/* Nút Gửi bảng kết quả vào tin nhắn */}
                  <button
                    onClick={handleShareResultsToChat}
                    disabled={resultLinesCount === 0 || shareResultsMutation.isPending}
                    className="flex items-center justify-center py-2 px-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 transition-all active:scale-95 text-foreground"
                    title={shareSuccess ? t.luckyWheel.shareResultsSuccess : t.luckyWheel.shareResultsToChat}
                    aria-label={t.luckyWheel.shareResultsToChat}
                  >
                    {shareSuccess ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </button>

                  {/* Nút Xoá tất cả kết quả */}
                  <button
                    onClick={handleClearResults}
                    disabled={resultLinesCount === 0}
                    className="flex items-center justify-center py-2 px-2 rounded-xl border border-border hover:bg-destructive/10 hover:border-destructive/30 disabled:opacity-40 transition-all active:scale-95 text-foreground"
                    title={t.luckyWheel.clearResults}
                    aria-label={t.luckyWheel.clearResults}
                  >
                    <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </button>
                </div>

                {/* Hàng thiết lập ở đáy: Bật/Tắt âm thanh & Xoá tất cả vòng quay (đồng bộ với Tab Setup) */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  {/* Sound Toggle */}
                  <button
                    onClick={handleToggleSound}
                    disabled={isAnySpinning}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                  >
                    {currentSoundEnabled ? (
                      <Volume2 className="w-4 h-4 text-primary" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-muted-foreground/60" />
                    )}
                    <span>{t.luckyWheel.soundSetting}</span>
                  </button>

                  {/* Delete All Wheels Button */}
                  <button
                    onClick={handleDeleteAllWheels}
                    disabled={isAnySpinning || wheels.length === 0}
                    className="flex items-center gap-1 text-destructive hover:text-destructive/80 font-semibold disabled:opacity-30 transition-colors"
                    title={t.luckyWheel.deleteAllWheels}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.luckyWheel.deleteAllWheels}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* TAB CONTENT: ACTIVE WHEEL (OPTIONS & SETTINGS) */
              activeWheel && (
                <div className="flex-1 flex flex-col pt-4 gap-4">
                  {/* Wheel Title Row */}
                  <div className="flex items-center justify-between gap-2">
                    {isEditingTitle ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingTitleText}
                          onChange={(e) => setEditingTitleText(e.target.value)}
                          onBlur={saveEditTitle}
                          onKeyDown={(e) => e.key === 'Enter' && saveEditTitle()}
                          autoFocus
                          disabled={isAnySpinning}
                          className="flex-1 px-2.5 py-1 text-sm font-semibold rounded-lg border border-primary bg-background focus:outline-none disabled:opacity-50"
                        />
                        <button
                          onClick={saveEditTitle}
                          disabled={isAnySpinning}
                          className="p-1 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1 group">
                        <span className="font-bold text-sm text-foreground truncate max-w-[240px]">
                          {activeWheel.title}
                        </span>
                        {!isAnySpinning && (
                          <button
                            onClick={startEditTitle}
                            className="opacity-70 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground transition-opacity"
                            title={t.luckyWheel.renameWheel}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Delete wheel if more than 1 wheel */}
                    {wheels.length > 1 && (
                      <button
                        onClick={() => {
                          if (isAnySpinning) return;
                          if (window.confirm(t.luckyWheel.confirmDeleteDesc)) {
                            deleteWheelMutation.mutate(activeWheel.id);
                          }
                        }}
                        disabled={isAnySpinning}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 transition-colors"
                        title={t.luckyWheel.confirmDeleteTitle}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Textarea: Large, 1 line = 1 option */}
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium">{t.luckyWheel.optionsListTitle}</span>
                      <span
                        className={`font-semibold ${
                          activeParsedOptions.length < 1 ? 'text-amber-500' : 'text-primary'
                        }`}
                      >
                        {t.luckyWheel.optionsCount.replace(
                          '{count}',
                          String(activeParsedOptions.length)
                        )}
                      </span>
                    </div>

                    <textarea
                      value={activeLocalState?.optionsText || ''}
                      onChange={(e) => handleOptionsChange(e.target.value)}
                      readOnly={isAnySpinning}
                      placeholder={t.luckyWheel.optionsPlaceholder}
                      className="w-full flex-1 min-h-[200px] p-3 text-sm rounded-xl border border-border/80 bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/40 focus:outline-none resize-none leading-relaxed transition-all font-mono disabled:opacity-50"
                    />

                    <p className="text-[11px] text-muted-foreground">{t.luckyWheel.optionsHint}</p>
                  </div>

                  {/* Action Buttons: Shuffle, Sort A-Z, Save Initial & Reset (Icons only, no text) */}
                  <div className="grid grid-cols-4 gap-2 pt-1 border-t border-border/50">
                    {/* Shuffle Button */}
                    <button
                      onClick={handleShuffle}
                      disabled={isAnySpinning}
                      className="flex items-center justify-center py-2 px-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 transition-all active:scale-95 text-foreground"
                      title={t.luckyWheel.shuffleOptions}
                      aria-label={t.luckyWheel.shuffleOptions}
                    >
                      <Shuffle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </button>

                    {/* Sort A-Z Button */}
                    <button
                      onClick={handleSortAZ}
                      disabled={isAnySpinning}
                      className="flex items-center justify-center py-2 px-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 transition-all active:scale-95 text-foreground"
                      title={t.luckyWheel.sortAZ}
                      aria-label={t.luckyWheel.sortAZ}
                    >
                      <ArrowDownAZ className="w-4 h-4 text-indigo-500" />
                    </button>

                    {/* Save as Initial Button */}
                    <button
                      onClick={handleSaveAsInitial}
                      disabled={isAnySpinning || updateWheelMutation.isPending}
                      className={`flex items-center justify-center py-2 px-2 rounded-xl border transition-all active:scale-95 ${
                        saveInitialFeedback
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'border-border hover:bg-muted text-foreground disabled:opacity-40'
                      }`}
                      title={t.luckyWheel.saveAsInitial}
                      aria-label={t.luckyWheel.saveAsInitial}
                    >
                      <BookmarkCheck
                        className={`w-4 h-4 ${
                          saveInitialFeedback ? 'text-emerald-500' : 'text-teal-600 dark:text-teal-400'
                        }`}
                      />
                    </button>

                    {/* Reset Button */}
                    <button
                      onClick={handleReset}
                      disabled={isAnySpinning}
                      className="flex items-center justify-center py-2 px-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 transition-all active:scale-95 text-foreground"
                      title={t.luckyWheel.resetOptions}
                      aria-label={t.luckyWheel.resetOptions}
                    >
                      <RotateCcw className="w-4 h-4 text-amber-500" />
                    </button>
                  </div>

                  {/* Wheel Settings: Sound and Delete All */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                    {/* Sound Toggle */}
                    <button
                      onClick={handleToggleSound}
                      disabled={isAnySpinning}
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                    >
                      {activeWheel.soundEnabled ? (
                        <Volume2 className="w-4 h-4 text-primary" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-muted-foreground/60" />
                      )}
                      <span>{t.luckyWheel.soundSetting}</span>
                    </button>

                    {/* Delete All Wheels Button */}
                    <button
                      onClick={handleDeleteAllWheels}
                      disabled={isAnySpinning || wheels.length === 0}
                      className="flex items-center gap-1 text-destructive hover:text-destructive/80 font-semibold disabled:opacity-30 transition-colors"
                      title={t.luckyWheel.deleteAllWheels}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.luckyWheel.deleteAllWheels}</span>
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Nút mở lại bảng: Ghim ở mép bên phải của phần hiển thị nội dung khi thu gọn */}
        {isPanelCollapsed && (
          <button
            type="button"
            onClick={() => setIsPanelCollapsed(false)}
            className="absolute right-0 top-6 z-30 flex items-center justify-center w-7 h-9 rounded-l-xl bg-white dark:bg-circle-charcoal border-y border-l border-border/80 shadow-md text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-all active:scale-90 group"
            title={t.luckyWheel.expandPanel || 'Mở bảng'}
            aria-label={t.luckyWheel.expandPanel || 'Mở bảng'}
          >
            <PanelRightOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

      {/* COMBINED / BATCH RESULTS MODAL - CELEBRATION WINNER SHOWCASE */}
      {combinedResultsModal && combinedResultsModal.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-300/60 dark:border-amber-500/30 bg-white dark:bg-circle-charcoal text-circle-charcoal dark:text-white shadow-2xl animate-scaleUp flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            {/* Celebration Header Background Glow */}
            <div className="relative pt-7 pb-3 px-6 flex flex-col items-center text-center bg-gradient-to-b from-amber-400/15 via-teal-500/5 to-transparent">
              {/* Nút X đóng ở góc trên bên phải */}
              <button
                type="button"
                onClick={() => setCombinedResultsModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title={t.luckyWheel.close}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Glowing Golden Trophy Icon */}
              <div className="relative mb-2.5 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 blur-lg opacity-40 animate-pulse" />
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/30 text-white">
                  <Trophy className="w-7 h-7" />
                </div>
              </div>

              {/* Header Title */}
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>🎉</span>
                <span>{t.luckyWheel.winnerTitle || 'Xin chúc mừng!'}</span>
              </h3>
            </div>

            {/* Single Winner Showcase */}
            {combinedResultsModal.length === 1 && (
              <div className="p-6 pt-2 pb-6 flex flex-col items-center">
                <div className="w-full relative overflow-hidden rounded-2xl border-2 border-amber-300/80 dark:border-amber-500/40 bg-gradient-to-b from-amber-50/90 via-white to-amber-50/40 dark:from-amber-950/30 dark:via-circle-charcoal dark:to-amber-950/20 p-5 flex flex-col items-center justify-center text-center shadow-sm">
                  {/* Wheel Name Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-2.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[220px]">{combinedResultsModal[0]!.wheelTitle}</span>
                  </div>

                  {/* Winner Name in Big Typography */}
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight select-all leading-tight drop-shadow-xs my-1">
                    {combinedResultsModal[0]!.result}
                  </span>

                  {/* Sparkle decorative text */}
                  <p className="text-xs text-amber-700/80 dark:text-amber-400/80 font-medium mt-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Lựa chọn may mắn của bạn!</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </p>
                </div>

                {/* Actions */}
                <div className="w-full flex flex-col gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setCombinedResultsModal(null)}
                    className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-teal-600/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t.luckyWheel.close}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveResult(
                        combinedResultsModal[0]!.wheelId,
                        combinedResultsModal[0]!.resultIndex,
                      )
                    }
                    className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.luckyWheel.removeResult}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Multiple Winners Showcase (Spin All) */}
            {combinedResultsModal.length > 1 && (
              <div className="p-6 pt-2 pb-6 flex flex-col">
                <div className="flex flex-col gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {combinedResultsModal.map((item) => (
                    <div
                      key={item.wheelId}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/70 to-teal-50/70 dark:from-amber-950/20 dark:to-teal-950/20 border border-amber-200/60 dark:border-white/10 transition-all"
                    >
                      <div className="flex flex-col min-w-0 pr-3">
                        <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider truncate mb-0.5">
                          {item.wheelTitle}
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                          {item.result}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveResult(item.wheelId, item.resultIndex)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 transition-all shrink-0"
                        title={t.luckyWheel.removeResult}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setCombinedResultsModal(null)}
                    className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-teal-600/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t.luckyWheel.close}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveAllBatchResults}
                    className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.luckyWheel.removeAllResults || 'Loại bỏ tất cả'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
