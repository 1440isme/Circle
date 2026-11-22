'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  Users,
  Lock,
  LockOpen,
  LogOut,
  ShieldCheck,
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
  useActiveLiveWheelQuery,
  useCloseLiveWheelMutation,
  useUpdateLiveWheelSettingsMutation,
} from '../../hooks/use-circle-tools';
import { DecisionWheelEntity, SpinWheelResult, LiveWheelSession } from '@circle/types';

interface LiveWheelOverlayProps {
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

// Canvas Wheel Component y hệt CircleWheelView
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

      // Label text: Centered radially in the slice so it never sinks into hub or spills off rim
      ctx.save();
      const midAngle = startAngle + sliceAngle / 2;
      ctx.rotate(midAngle);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#1E293B';

      const hubRadius = size > 500 ? 32 : size > 420 ? 28 : size > 300 ? 22 : 18;
      const outerMargin = size > 500 ? 26 : size > 420 ? 24 : size > 300 ? 20 : 14;
      const trackLength = radius - outerMargin - hubRadius;
      const textRadius = hubRadius + trackLength / 2;

      const baseFontSize = size > 500 ? 16 : size > 420 ? 15 : size > 300 ? 13 : size > 250 ? 12 : 11;
      ctx.font = `600 ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
      ctx.shadowBlur = 2;

      let label = opt.label;
      let measured = ctx.measureText(label).width;
      if (measured > trackLength - 6) {
        const smallerFont = Math.max(baseFontSize - 2, 9);
        ctx.font = `600 ${smallerFont}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        measured = ctx.measureText(label).width;
        if (measured > trackLength - 6) {
          const charWidth = smallerFont * 0.6;
          const maxLen = Math.max(Math.floor((trackLength - 8) / charWidth), 3);
          label = label.substring(0, maxLen - 1) + '…';
        }
      }

      ctx.fillText(label, textRadius, 0);
      ctx.restore();
    });

    ctx.restore();

    // Center circular hub
    const hubRadius = size > 500 ? 32 : size > 420 ? 28 : size > 300 ? 22 : 18;
    ctx.beginPath();
    ctx.arc(center, center, hubRadius, 0, 2 * Math.PI);
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
    ctx.arc(center, center, size > 500 ? 12 : size > 420 ? 10 : size > 300 ? 8 : 6, 0, 2 * Math.PI);
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
        style={{ right: size > 500 ? -32 : size > 420 ? -30 : -26 }}
      >
        <svg
          width={size > 500 ? '44' : size > 420 ? '40' : '34'}
          height={size > 500 ? '30' : size > 420 ? '28' : '24'}
          viewBox="0 0 34 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
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

export const LiveWheelOverlay: React.FC<LiveWheelOverlayProps> = ({ circleId }) => {
  const { user } = useAuth();
  const { t, locale } = useLanguageStore();
  const queryClient = useQueryClient();

  const [isVisible, setIsVisible] = useState(false);
  const [liveSession, setLiveSession] = useState<LiveWheelSession | null>(null);

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

  // Mutations
  const createWheelMutation = useCreateWheelMutation(circleId);
  const updateWheelMutation = useUpdateWheelMutation(circleId);
  const deleteWheelMutation = useDeleteWheelMutation(circleId);
  const deleteAllMutation = useDeleteAllWheelsMutation(circleId);
  const spinWheelMutation = useSpinWheelMutation(circleId);
  const spinAllMutation = useSpinAllWheelsMutation(circleId);
  const shareResultsMutation = useShareWheelResultsToChatMutation(circleId);
  const closeLiveMutation = useCloseLiveWheelMutation(circleId);
  const updateSettingsMutation = useUpdateLiveWheelSettingsMutation(circleId);

  // Phân quyền: Chủ phòng vs Người xem & Quyền chỉnh sửa
  const isHost = Boolean(!liveSession?.creatorId || liveSession.creatorId === user?.id);
  const allowMembersToEdit = Boolean(liveSession?.allowMembersToEdit);
  const canEdit = isHost || allowMembersToEdit;

  const handleToggleAllowEdit = async () => {
    if (!isHost) return;
    try {
      await updateSettingsMutation.mutateAsync({
        allowMembersToEdit: !allowMembersToEdit,
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể thay đổi thiết lập');
    }
  };

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

  // Panel Collapsed State (Nút kéo mở / thu gọn setup y hệt CircleWheelView)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Auto-seed: Khởi tạo 1 vòng mặc định ngay khi tải trang nếu Circle chưa có vòng nào
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

  // Batch Spinning Accumulator
  const activeSpinningBatchRef = useRef<Set<string>>(new Set());
  const batchResultsAccumulatorRef = useRef<
    { wheelId: string; wheelTitle: string; result: string; resultIndex: number }[]
  >([]);

  // Batch Results Modal (Cúp vàng chúc mừng chiến thắng)
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

  // Settings toggle
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

            const sortedBatch = [...rawBatch].sort((a, b) => {
              const idxA = wheels.findIndex((w) => w.id === a.wheelId);
              const idxB = wheels.findIndex((w) => w.id === b.wheelId);
              return idxA - idxB;
            });

            setCombinedResultsModal(sortedBatch);

            // Ghi kết quả theo từng dòng (các vòng cách nhau bởi dấu " - ")
            const roundLine = sortedBatch.map((b) => b.result).join(' - ');
            setResultsText((prev) => (prev ? `${prev}\n${roundLine}` : roundLine));

            batchResultsAccumulatorRef.current = [];
          }
        }
      };

      requestAnimationFrame(step);
    },
    [wheelsState, wheels]
  );

  // Spin a single wheel
  const handleSpinSingle = (wheel: DecisionWheelEntity) => {
    const localState = wheelsState[wheel.id];
    if (localState?.isSpinning) return;

    const parsed = parseOptions(localState?.optionsText || '');
    if (parsed.length < 1) return;

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

  // Loại bỏ tất cả kết quả trúng thưởng vừa quay và đóng modal
  const handleRemoveAllBatchResults = () => {
    if (!combinedResultsModal) return;
    combinedResultsModal.forEach((item) => {
      handleRemoveResult(item.wheelId, item.resultIndex);
    });
    setCombinedResultsModal(null);
  };

  // Sort results A-Z
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

  // Share results to chat
  const handleShareResultsToChat = () => {
    if (resultLines.length === 0 || shareResultsMutation.isPending) return;
    shareResultsMutation.mutate(
      resultLines.map((line, idx) => ({
        wheelTitle: (t.luckyWheel.turnNumber || 'Lần {number}').replace('{number}', String(idx + 1)),
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

  // Clear all results
  const handleClearResults = () => {
    if (resultLines.length === 0) return;
    if (window.confirm(t.luckyWheel.confirmClearResultsDesc)) {
      setResultsText('');
    }
  };

  // ĐÓNG PHÒNG QUAY & TỰ ĐỘNG GỬI KẾT QUẢ VÀO TIN NHẮN CHAT
  const handleCloseStage = async () => {
    const confirmMsg =
      resultLines.length > 0
        ? (locale === 'vi'
            ? 'Đóng phòng quay và tự động gửi kết quả vào tin nhắn nhóm?'
            : 'Close wheel stage and auto-share results to group chat?')
        : (locale === 'vi'
            ? 'Bạn có chắc chắn muốn đóng phòng quay trực tiếp?'
            : 'Are you sure you want to end this live wheel stage?');

    if (!window.confirm(confirmMsg)) return;

    try {
      const formattedResults =
        resultLines.length > 0
          ? resultLines.map((line, idx) => ({
              wheelTitle: `Lần ${idx + 1}`,
              winner: line,
            }))
          : undefined;

      await closeLiveMutation.mutateAsync({
        results: formattedResults,
      });
      queryClient.invalidateQueries({ queryKey: ['wheels', circleId] });
      setIsVisible(false);
      setLiveSession(null);
      setResultsText('');
      setCombinedResultsModal(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể đóng phòng quay');
    }
  };

  // 1. Fetch active session on mount
  const { data: initialActiveSession } = useActiveLiveWheelQuery(circleId);

  useEffect(() => {
    if (initialActiveSession) {
      const elapsed = Date.now() - initialActiveSession.startedAt;
      if (elapsed < 4 * 60 * 60 * 1000) {
        setLiveSession(initialActiveSession);
        setIsVisible(true);
      }
    }
  }, [initialActiveSession]);

  // 2. Realtime Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleStageCreated = (incoming: LiveWheelSession) => {
      if (incoming.circleId === circleId) {
        setLiveSession(incoming);
        setIsVisible(true);
      }
    };

    const handleStageClosed = (data: { circleId: string }) => {
      if (data.circleId === circleId) {
        setIsVisible(false);
        setLiveSession(null);
        setResultsText('');
        setCombinedResultsModal(null);
        queryClient.invalidateQueries({ queryKey: ['wheels', circleId] });
      }
    };

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

    const handleOpenFromChat = (e: any) => {
      if (e.detail?.circleId === circleId) {
        setIsVisible(true);
        if (e.detail?.session) {
          setLiveSession(e.detail.session);
        }
        setResultsText('');
        setCombinedResultsModal(null);
      }
    };

    const handleParticipantsUpdated = (data: { sessionId: string; participants: any[] }) => {
      setLiveSession((prev) => {
        if (prev && (prev.id === data.sessionId || !data.sessionId)) {
          return {
            ...prev,
            participants: data.participants,
          };
        }
        return prev;
      });
    };

    const handleStageUpdated = (incoming: LiveWheelSession) => {
      if (incoming.circleId === circleId) {
        setLiveSession(incoming);
        queryClient.invalidateQueries({ queryKey: ['wheels', circleId] });
      }
    };

    socket.on('circle:live-wheel:stage-created', handleStageCreated);
    socket.on('circle:live-wheel:updated', handleStageUpdated);
    socket.on('circle:live-wheel:closed', handleStageClosed);
    socket.on('circle:live-wheel:participants-updated', handleParticipantsUpdated);
    socket.on('circle:wheel-spun', handleWheelSpun);
    window.addEventListener('circle:open-live-wheel', handleOpenFromChat);

    return () => {
      socket.off('circle:live-wheel:stage-created', handleStageCreated);
      socket.off('circle:live-wheel:updated', handleStageUpdated);
      socket.off('circle:live-wheel:closed', handleStageClosed);
      socket.off('circle:live-wheel:participants-updated', handleParticipantsUpdated);
      socket.off('circle:wheel-spun', handleWheelSpun);
      window.removeEventListener('circle:open-live-wheel', handleOpenFromChat);
    };
  }, [circleId, wheels, wheelsState, user?.id, animateWheelRotation, parseOptions]);

  const participants = useMemo(() => {
    const list = liveSession?.participants || [];
    if (user && !list.some((p) => p.userId === user.id)) {
      return [
        ...list,
        {
          userId: user.id,
          displayName: user.profile?.displayName || user.email?.split('@')[0] || 'Bạn',
          avatarUrl: user.profile?.avatarUrl || null,
          joinedAt: new Date().toISOString(),
        },
      ];
    }
    return list;
  }, [liveSession?.participants, user]);

  if (!isVisible) return null;

  // Active wheel parsed options
  const activeParsedOptions = parseOptions(activeLocalState?.optionsText || '');

  // Dynamic wheel sizes by count & panel collapsed state (optimized for true full-screen experience)
  const getWheelSize = (count: number, isCollapsed: boolean) => {
    if (isCollapsed) {
      if (count === 1) return 560; // 1 vòng to chiếm trọn tâm điểm màn hình
      if (count === 2) return 380; // 2 vòng to 380px mỗi vòng
      return 280; // 3 hoặc 4 vòng: 280px
    } else {
      if (count === 1) return 440; // 1 vòng khi mở bảng: 440px
      if (count === 2) return 300; // 2 vòng: 300px
      return 230; // 3 hoặc 4 vòng: 230px
    }
  };

  const wheelSize = getWheelSize(wheels.length, isPanelCollapsed);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-circle-canvas dark:bg-circle-dark-surface overflow-hidden transition-colors animate-fadeIn">
      {/* ============================================================== */}
      {/* TOP HEADER / BAR (FULL WIDTH EDGE-TO-EDGE) */}
      {/* ============================================================== */}
      <header className="w-full z-20 flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 bg-white/90 dark:bg-circle-dark-surface/90 backdrop-blur-xl border-b border-circle-hairline/80 dark:border-white/10 shrink-0">
        {/* Nhãn Tiêu đề Vòng quay ngẫu nhiên */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-full bg-circle-primary/15 text-circle-primary flex items-center justify-center">
            <Compass className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base text-circle-charcoal dark:text-circle-dark-text leading-tight">
              {locale === 'vi' ? 'Vòng quay ngẫu nhiên' : 'Random Wheel'}
            </h2>
            <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted hidden sm:block">
              {locale === 'vi' ? 'Sân khấu trực tiếp trong nhóm chat' : 'Live stage in group chat'}
            </p>
          </div>
        </div>

        {/* Thanh công cụ Floating Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* Floating Pill: KẾT QUẢ */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('results');
              setIsPanelCollapsed(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl border shadow-sm font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shrink-0 ${
              activeTab === 'results' && !isPanelCollapsed
                ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                : 'bg-white/92 dark:bg-circle-dark-surface/90 border-circle-hairline/80 dark:border-white/12 hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text'
            }`}
            title={t.luckyWheel.resultsTab}
          >
            <Trophy className={`w-4 h-4 ${activeTab === 'results' && !isPanelCollapsed ? 'text-white' : 'text-amber-500'}`} />
            <span>{t.luckyWheel.resultsTab}</span>
            {resultLinesCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'results' && !isPanelCollapsed
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                }`}
              >
                {resultLinesCount}
              </span>
            )}
          </button>

          {/* Floating Pill: NGƯỜI XEM */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('viewers');
              setIsPanelCollapsed(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl border shadow-sm font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shrink-0 ${
              activeTab === 'viewers' && !isPanelCollapsed
                ? 'bg-circle-primary text-white border-circle-primary shadow-md'
                : 'bg-white/92 dark:bg-circle-dark-surface/90 border-circle-hairline/80 dark:border-white/12 hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text'
            }`}
            title={locale === 'vi' ? 'Người xem trực tiếp' : 'Live viewers'}
          >
            <Users className={`w-4 h-4 ${activeTab === 'viewers' && !isPanelCollapsed ? 'text-white' : 'text-circle-primary'}`} />
            <span>{locale === 'vi' ? 'Người xem' : 'Viewers'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'viewers' && !isPanelCollapsed
                  ? 'bg-white/20 text-white'
                  : 'bg-circle-primary/15 text-circle-primary'
              }`}
            >
              {participants.length}
            </span>
          </button>

          {/* Add Wheel Pill Button */}
          <button
            type="button"
            onClick={handleAddDefaultWheel}
            disabled={wheels.length >= 4 || isAnySpinning || createWheelMutation.isPending || !canEdit}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title={
              !canEdit
                ? (t.luckyWheel.viewOnlyDesc || 'Chỉ chủ phòng mới có quyền thêm vòng quay')
                : wheels.length >= 4
                ? t.luckyWheel.maxWheelsBadge
                : undefined
            }
          >
            <Plus className="w-4 h-4 text-circle-sage dark:text-circle-dark-primary" />
            <span>{t.luckyWheel.addWheel}</span>
          </button>

          {/* Spin All Pill Button (Tất cả thành viên đều có thể sử dụng chức năng quay) */}
          {wheels.length > 0 && (
            <button
              type="button"
              onClick={handleSpinAll}
              disabled={isAnySpinning || spinAllMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full backdrop-blur-xl bg-circle-primary hover:bg-circle-sage text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <RotateCw className={`w-4 h-4 ${isAnySpinning ? 'animate-spin' : ''}`} />
              <span>{t.luckyWheel.spinAll}</span>
            </button>
          )}

          {/* Floating Pill: Nút "Cho phép sửa" */}
          {isHost ? (
            <button
              type="button"
              onClick={handleToggleAllowEdit}
              disabled={updateSettingsMutation.isPending}
              className={`inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl border shadow-sm font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shrink-0 ${
                allowMembersToEdit
                  ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-emerald-500/20'
                  : 'bg-white/92 dark:bg-circle-dark-surface/90 border-circle-hairline/80 dark:border-white/12 hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text'
              }`}
              title={
                allowMembersToEdit
                  ? (locale === 'vi' ? 'Nhấp để khóa quyền chỉnh sửa (chỉ bạn có quyền sửa)' : 'Click to lock edit permission')
                  : (t.luckyWheel.allowEditDesc || (locale === 'vi' ? 'Nhấp để cho phép tất cả thành viên cùng sửa' : 'Click to allow all members to edit'))
              }
            >
              {allowMembersToEdit ? (
                <LockOpen className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4 text-amber-500" />
              )}
              <span>
                {allowMembersToEdit
                  ? (t.luckyWheel.allowEditEnabled || (locale === 'vi' ? 'Cho phép sửa: Bật' : 'Allow Edit: On'))
                  : (t.luckyWheel.allowEditDisabled || (locale === 'vi' ? 'Cho phép sửa: Tắt' : 'Allow Edit: Off'))}
              </span>
            </button>
          ) : (
            <div
              className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-full backdrop-blur-xl border shadow-2xs font-bold text-xs sm:text-sm select-none shrink-0 ${
                allowMembersToEdit
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-white/5 border-circle-hairline/80 dark:border-white/10 text-circle-slate dark:text-circle-dark-muted'
              }`}
              title={
                allowMembersToEdit
                  ? (t.luckyWheel.collabEditDesc || (locale === 'vi' ? 'Chủ phòng đã cho phép bạn chỉnh sửa nội dung' : 'Host has allowed you to edit'))
                  : (t.luckyWheel.viewOnlyDesc || (locale === 'vi' ? 'Chỉ chủ phòng mới có quyền chỉnh sửa' : 'View only'))
              }
            >
              {allowMembersToEdit ? (
                <LockOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Lock className="w-4 h-4 opacity-70" />
              )}
              <span>
                {allowMembersToEdit
                  ? (t.luckyWheel.collabEditBadge || (locale === 'vi' ? 'Được phép sửa' : 'Can edit'))
                  : (t.luckyWheel.viewOnlyBadge || (locale === 'vi' ? 'Chỉ xem' : 'View only'))}
              </span>
            </div>
          )}

          {/* Nút Đóng phòng (Chủ phòng) HOẶC Rời phòng (Người xem) */}
          {isHost ? (
            <button
              type="button"
              onClick={handleCloseStage}
              disabled={closeLiveMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shrink-0"
              title={locale === 'vi' ? 'Đóng phòng quay và gửi kết quả vào chat' : 'Close stage & share results'}
            >
              <X className="w-4 h-4" />
              <span>{t.luckyWheel.closeStage || (locale === 'vi' ? 'Đóng phòng' : 'Close')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shrink-0"
              title={t.luckyWheel.leaveStage || (locale === 'vi' ? 'Rời phòng quay trực tiếp (phòng vẫn tiếp tục cho các thành viên khác)' : 'Leave room')}
            >
              <LogOut className="w-4 h-4 text-circle-slate dark:text-circle-dark-muted" />
              <span>{t.luckyWheel.leaveStage || (locale === 'vi' ? 'Rời phòng' : 'Leave')}</span>
            </button>
          )}
        </div>
      </header>

      {/* ============================================================== */}
      {/* FULL-SCREEN WORKSPACE (VISUAL ARENA + SETUP PANEL) */}
      {/* ============================================================== */}
      <div className="flex-1 w-full min-h-0 flex flex-col lg:flex-row overflow-hidden relative">
        {/* CỘT BÊN TRÁI: SÂN KHẤU VÒNG QUAY (VISUAL ARENA) */}
        <div className="flex-1 h-full min-w-0 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto relative">
            {wheels.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <Compass className="w-16 h-16 text-circle-slate/30 dark:text-circle-dark-muted/30 mb-3" />
                <h3 className="text-base font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1">
                  {t.luckyWheel.emptyWheelsTitle}
                </h3>
                <p className="text-xs text-circle-slate dark:text-circle-dark-muted max-w-sm mb-4">
                  {t.luckyWheel.emptyWheelsDesc}
                </p>
                <button
                  type="button"
                  onClick={handleAddDefaultWheel}
                  className="inline-flex items-center gap-1.5 px-5 h-9 text-xs sm:text-sm font-bold rounded-full bg-circle-primary hover:bg-circle-sage text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.luckyWheel.createWheel}</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 w-full flex flex-col items-center justify-center min-h-0 overflow-y-auto py-2">
                {/* 1 VÒNG: Hiển thị 1 vòng to chính giữa */}
                {wheels.length === 1 && (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveWheelId(wheels[0]!.id);
                        setActiveTab(wheels[0]!.id);
                        setIsPanelCollapsed(false);
                      }}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs w-36 ${
                        activeWheelId === wheels[0]!.id
                          ? 'bg-circle-primary border-circle-primary text-white shadow-xs'
                          : 'bg-white/90 dark:bg-circle-dark-surface/90 border-circle-hairline/80 dark:border-white/12 text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                      }`}
                      title={wheels[0]!.title}
                    >
                      <Compass
                        className={`w-3.5 h-3.5 shrink-0 ${
                          activeWheelId === wheels[0]!.id
                            ? 'text-white'
                            : 'text-circle-sage dark:text-circle-dark-primary'
                        }`}
                      />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl justify-items-center">
                    {wheels.map((wheel) => {
                      const local = wheelsState[wheel.id];
                      const parsed = parseOptions(local?.optionsText || '');
                      return (
                        <div
                          key={wheel.id}
                          className="flex flex-col items-center gap-2.5 p-2 rounded-2xl transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveWheelId(wheel.id);
                              setActiveTab(wheel.id);
                              setIsPanelCollapsed(false);
                            }}
                            className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs w-36 ${
                              activeWheelId === wheel.id
                                ? 'bg-circle-primary border-circle-primary text-white shadow-xs'
                                : 'bg-white/90 dark:bg-circle-dark-surface/90 border-circle-hairline/80 dark:border-white/12 text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                            }`}
                            title={wheel.title}
                          >
                            <Compass
                              className={`w-3.5 h-3.5 shrink-0 ${
                                activeWheelId === wheel.id
                                  ? 'text-white'
                                  : 'text-circle-sage dark:text-circle-dark-primary'
                              }`}
                            />
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
                  <div className="flex flex-col items-center gap-8 w-full max-w-5xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full justify-items-center">
                      {wheels.slice(0, 2).map((wheel) => {
                        const local = wheelsState[wheel.id];
                        const parsed = parseOptions(local?.optionsText || '');
                        return (
                          <div
                            key={wheel.id}
                            className="flex flex-col items-center gap-2.5 p-2 rounded-2xl transition-all"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveWheelId(wheel.id);
                                setActiveTab(wheel.id);
                                setIsPanelCollapsed(false);
                              }}
                              className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs w-36 ${
                                activeWheelId === wheel.id
                                  ? 'bg-circle-primary border-circle-primary text-white shadow-xs'
                                  : 'bg-white/90 dark:bg-circle-dark-surface/90 border-circle-hairline/80 dark:border-white/12 text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                              }`}
                              title={wheel.title}
                            >
                              <Compass
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  activeWheelId === wheel.id
                                    ? 'text-white'
                                    : 'text-circle-sage dark:text-circle-dark-primary'
                                }`}
                              />
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

                    {wheels[2] && (
                      <div className="flex flex-col items-center gap-2.5 p-2 rounded-2xl transition-all">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveWheelId(wheels[2]!.id);
                            setActiveTab(wheels[2]!.id);
                            setIsPanelCollapsed(false);
                          }}
                          className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs w-36 ${
                            activeWheelId === wheels[2]!.id
                              ? 'bg-circle-primary border-circle-primary text-white shadow-xs'
                              : 'bg-white/90 dark:bg-circle-dark-surface/90 border-circle-hairline/80 dark:border-white/12 text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                          }`}
                          title={wheels[2]!.title}
                        >
                          <Compass
                            className={`w-3.5 h-3.5 shrink-0 ${
                              activeWheelId === wheels[2]!.id
                                ? 'text-white'
                                : 'text-circle-sage dark:text-circle-dark-primary'
                            }`}
                          />
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
                  <div className="grid grid-cols-2 gap-4 sm:gap-8 w-full max-w-5xl justify-items-center">
                    {wheels.map((wheel) => {
                      const local = wheelsState[wheel.id];
                      const parsed = parseOptions(local?.optionsText || '');
                      return (
                        <div
                          key={wheel.id}
                          className="flex flex-col items-center gap-2.5 p-2 rounded-2xl transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveWheelId(wheel.id);
                              setActiveTab(wheel.id);
                              setIsPanelCollapsed(false);
                            }}
                            className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs w-36 ${
                              activeWheelId === wheel.id
                                ? 'bg-circle-primary border-circle-primary text-white shadow-xs'
                                : 'bg-white/90 dark:bg-circle-dark-surface/90 border-circle-hairline/80 dark:border-white/12 text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                            }`}
                            title={wheel.title}
                          >
                            <Compass
                              className={`w-3.5 h-3.5 shrink-0 ${
                                activeWheelId === wheel.id
                                  ? 'text-white'
                                  : 'text-circle-sage dark:text-circle-dark-primary'
                              }`}
                            />
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

          {/* ============================================================== */}
          {/* CỘT BÊN PHẢI: "CÁI BẢNG" (TABBED OPTIONS BOARD & RESULTS) */}
          {/* ============================================================== */}
          {!isPanelCollapsed && (
            <div className="relative w-full lg:w-[420px] xl:w-[460px] h-full shrink-0 flex flex-col bg-white dark:bg-circle-dark-surface border-l border-circle-hairline/80 dark:border-white/10 shadow-xl p-4 sm:p-6 transition-all">
              {/* Nút thu gọn bảng: Nằm giữa cái viền luôn nửa trong nửa ngoài, to, z-40 và không bị cắt */}
              <button
                type="button"
                onClick={() => setIsPanelCollapsed(true)}
                className="absolute top-6 -left-4 z-40 w-8 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-circle-dark-surface border border-circle-hairline/80 dark:border-white/12 shadow-lg hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted hover:text-circle-primary dark:hover:text-circle-primary transition-all active:scale-90 group cursor-pointer"
                title={t.luckyWheel.collapsePanel}
                aria-label={t.luckyWheel.collapsePanel}
              >
                <PanelRightClose className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
              </button>

              {/* Tabs Header: Tên của từng vòng + TAB KẾT QUẢ */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline no-scrollbar shrink-0">
                {wheels.map((wheel) => {
                  const isSelected = activeTab === wheel.id;
                  return (
                    <button
                      key={wheel.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(wheel.id);
                        setActiveWheelId(wheel.id);
                      }}
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

                {/* Tab Kết Quả */}
                <button
                  type="button"
                  onClick={() => setActiveTab('results')}
                  className={`flex items-center justify-center gap-1.5 min-w-24 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'results'
                      ? 'bg-amber-500 text-white shadow-xs font-bold'
                      : 'bg-circle-wash/60 dark:bg-circle-dark-wash/40 text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.luckyWheel.resultsTab}</span>
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

                {/* Tab: NGƯỜI XEM */}
                <button
                  type="button"
                  onClick={() => setActiveTab('viewers')}
                  className={`flex items-center justify-center gap-1.5 min-w-24 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'viewers'
                      ? 'bg-circle-primary text-white shadow-xs font-bold'
                      : 'bg-circle-wash/60 dark:bg-circle-dark-wash/40 text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{locale === 'vi' ? 'Người xem' : 'Viewers'}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'viewers'
                        ? 'bg-white/20 text-white'
                        : 'bg-circle-primary/15 text-circle-primary'
                    }`}
                  >
                    {participants.length}
                  </span>
                </button>
              </div>

              {/* TAB CONTENT: KẾT QUẢ (DẠNG TEXT CHỈ ĐỌC, GHI THEO LẦN) */}
              {activeTab === 'results' ? (
                <div className="flex-1 min-h-0 flex flex-col pt-4 gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-circle-hairline dark:border-circle-dark-hairline shrink-0">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-sm text-circle-charcoal dark:text-circle-dark-text truncate">
                        {t.luckyWheel.resultsHistoryTitle}
                      </span>
                      <span className="text-xs text-circle-slate dark:text-circle-dark-muted font-semibold">
                        ({resultLinesCount})
                      </span>
                    </div>
                  </div>

                  {/* Textarea lớn chỉ đọc hiển thị kết quả */}
                  <div className="flex-1 min-h-0 flex flex-col gap-1.5">
                    <textarea
                      value={resultsText}
                      readOnly
                      placeholder={t.luckyWheel.resultsPlaceholder}
                      className="w-full flex-1 min-h-0 p-3 text-sm rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/60 dark:placeholder:text-circle-dark-muted/60 focus:outline-none resize-none leading-relaxed transition-all font-mono select-text cursor-default"
                    />
                    <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted truncate shrink-0">
                      {t.luckyWheel.resultsHint}
                    </p>
                  </div>

                  {/* Thanh tác vụ dưới cùng: Sắp xếp, Gửi tin nhắn, Xoá tất cả (Icons only) */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline shrink-0">
                    {/* Nút Sắp xếp */}
                    <button
                      type="button"
                      onClick={handleSortResults}
                      disabled={resultLinesCount < 2}
                      className="flex items-center justify-center py-2 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
                      title={t.luckyWheel.sortResults}
                      aria-label={t.luckyWheel.sortResults}
                    >
                      <ArrowDownAZ className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </button>

                    {/* Nút Gửi bảng kết quả vào tin nhắn */}
                    <button
                      type="button"
                      onClick={handleShareResultsToChat}
                      disabled={resultLinesCount === 0 || shareResultsMutation.isPending}
                      className="flex items-center justify-center py-2 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
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
                      type="button"
                      onClick={handleClearResults}
                      disabled={resultLinesCount === 0}
                      className="flex items-center justify-center py-2 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-rose-500/10 dark:hover:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-900/40 text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
                      title={t.luckyWheel.clearResults}
                      aria-label={t.luckyWheel.clearResults}
                    >
                      <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </button>
                  </div>

                  {/* Hàng thiết lập ở đáy: Bật/Tắt âm thanh & Xoá tất cả vòng quay (đồng bộ với Tab Setup) */}
                  <div className="flex items-center justify-between pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline text-xs shrink-0">
                    {/* Sound Toggle */}
                    <button
                      type="button"
                      onClick={handleToggleSound}
                      disabled={isAnySpinning}
                      className="flex items-center gap-1.5 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      {currentSoundEnabled ? (
                        <Volume2 className="w-4 h-4 text-circle-primary dark:text-circle-dark-primary" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-circle-slate/60 dark:text-circle-dark-muted/60" />
                      )}
                      <span>{t.luckyWheel.soundSetting}</span>
                    </button>

                    {/* Delete All Wheels Button */}
                    <button
                      type="button"
                      onClick={handleDeleteAllWheels}
                      disabled={isAnySpinning || wheels.length === 0}
                      className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-semibold disabled:opacity-30 transition-colors cursor-pointer"
                      title={t.luckyWheel.deleteAllWheels}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.luckyWheel.deleteAllWheels}</span>
                    </button>
                  </div>
                </div>
              ) : activeTab === 'viewers' ? (
                /* TAB CONTENT: NGƯỜI XEM (VIEWERS LIST) */
                <div className="flex-1 min-h-0 flex flex-col pt-4 gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-circle-hairline dark:border-circle-dark-hairline shrink-0">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-circle-primary" />
                      <span className="font-bold text-sm text-circle-charcoal dark:text-circle-dark-text truncate">
                        {locale === 'vi' ? 'Người đang xem trực tiếp' : 'Live Viewers'}
                      </span>
                      <span className="text-xs text-circle-slate dark:text-circle-dark-muted font-semibold">
                        ({participants.length})
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {participants.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-circle-slate dark:text-circle-dark-muted text-xs">
                        <Users className="w-8 h-8 mb-2 opacity-30" />
                        <p>{locale === 'vi' ? 'Chưa có người xem nào' : 'No viewers yet'}</p>
                      </div>
                    ) : (
                      participants.map((p) => {
                        const isCreator = p.userId === liveSession?.creatorId;
                        const isMe = p.userId === user?.id;
                        return (
                          <div
                            key={p.userId}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 hover:bg-circle-wash/50 dark:hover:bg-circle-dark-wash/50 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative shrink-0">
                                {p.avatarUrl ? (
                                  <img
                                    src={p.avatarUrl}
                                    alt={p.displayName}
                                    className="w-8 h-8 rounded-full object-cover border border-circle-hairline dark:border-circle-dark-hairline"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-circle-primary/10 text-circle-primary font-bold text-xs flex items-center justify-center border border-circle-primary/20">
                                    {(p.displayName || 'U').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-circle-dark-surface" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                                    {p.displayName}
                                  </p>
                                  {isMe && (
                                    <span className="text-[10px] text-circle-slate dark:text-circle-dark-muted font-normal">
                                      ({locale === 'vi' ? 'Bạn' : 'You'})
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  {locale === 'vi' ? 'Đang theo dõi' : 'Watching'}
                                </p>
                              </div>
                            </div>

                            {isCreator && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                                {locale === 'vi' ? 'Chủ phòng' : 'Host'}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Hàng thiết lập ở đáy: Bật/Tắt âm thanh & Xoá tất cả vòng quay */}
                  <div className="flex items-center justify-between pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline text-xs shrink-0">
                    <button
                      type="button"
                      onClick={handleToggleSound}
                      disabled={isAnySpinning}
                      className="flex items-center gap-1.5 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      {currentSoundEnabled ? (
                        <Volume2 className="w-4 h-4 text-circle-primary dark:text-circle-dark-primary" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-circle-slate/60 dark:text-circle-dark-muted/60" />
                      )}
                      <span>{t.luckyWheel.soundSetting}</span>
                    </button>

                    {/* Cho phép sửa Toggle (Chỉ chủ phòng) */}
                    {isHost && (
                      <button
                        type="button"
                        onClick={handleToggleAllowEdit}
                        disabled={updateSettingsMutation.isPending}
                        className="flex items-center gap-1 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors cursor-pointer"
                        title={t.luckyWheel.allowEditDesc}
                      >
                        {allowMembersToEdit ? (
                          <LockOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-circle-slate/60 dark:text-circle-dark-muted/60" />
                        )}
                        <span className={allowMembersToEdit ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
                          {allowMembersToEdit ? t.luckyWheel.allowEditEnabled : t.luckyWheel.allowEditDisabled}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleDeleteAllWheels}
                      disabled={isAnySpinning || wheels.length === 0 || !canEdit}
                      className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-semibold disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      title={!canEdit ? (t.luckyWheel.viewOnlyDesc || 'Chỉ chủ phòng mới có quyền xóa') : t.luckyWheel.deleteAllWheels}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.luckyWheel.deleteAllWheels}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* TAB CONTENT: ACTIVE WHEEL (OPTIONS & SETTINGS) */
                activeWheel && (
                  <div className="flex-1 min-h-0 flex flex-col pt-4 gap-3.5">
                    {/* Wheel Title Row */}
                    <div className="flex items-center justify-between gap-2 shrink-0">
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
                            disabled={isAnySpinning || !canEdit}
                            className="flex-1 px-2.5 py-1 text-sm font-semibold rounded-lg border border-circle-primary bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text focus:outline-none disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={saveEditTitle}
                            disabled={isAnySpinning || !canEdit}
                            className="p-1 rounded-md bg-circle-primary hover:bg-circle-sage text-white disabled:opacity-50 cursor-pointer shrink-0"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1 group">
                          <span className="font-bold text-sm text-circle-charcoal dark:text-circle-dark-text truncate max-w-[240px]">
                            {activeWheel.title}
                          </span>
                          {!isAnySpinning && canEdit && (
                            <button
                              type="button"
                              onClick={startEditTitle}
                              className="opacity-70 group-hover:opacity-100 p-1 rounded hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted transition-opacity cursor-pointer shrink-0"
                              title={t.luckyWheel.renameWheel}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Delete wheel if more than 1 wheel */}
                      {wheels.length > 1 && canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isAnySpinning) return;
                            if (window.confirm(t.luckyWheel.confirmDeleteDesc)) {
                              deleteWheelMutation.mutate(activeWheel.id);
                            }
                          }}
                          disabled={isAnySpinning}
                          className="p-1.5 rounded-lg text-circle-slate dark:text-circle-dark-muted hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 disabled:opacity-30 transition-colors cursor-pointer shrink-0"
                          title={t.luckyWheel.confirmDeleteTitle}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Banner hiển thị quyền chỉnh sửa */}
                    {!canEdit ? (
                      <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-medium shrink-0 animate-fadeIn">
                        <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="truncate">{t.luckyWheel.viewOnlyDesc || 'Chế độ chỉ xem — Chỉ chủ phòng mới có quyền chỉnh sửa'}</span>
                      </div>
                    ) : !isHost ? (
                      <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-medium shrink-0 animate-fadeIn">
                        <LockOpen className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="truncate">{t.luckyWheel.collabEditDesc || 'Chế độ cùng sửa — Chủ phòng đã cho phép bạn chỉnh sửa'}</span>
                      </div>
                    ) : null}

                    {/* Textarea: Large, 1 line = 1 option */}
                    <div className="flex-1 min-h-0 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs text-circle-slate dark:text-circle-dark-muted shrink-0">
                        <span className="font-medium">{t.luckyWheel.optionsListTitle}</span>
                        <span
                          className={`font-semibold ${
                            activeParsedOptions.length < 1 ? 'text-amber-500' : 'text-circle-primary dark:text-circle-dark-primary'
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
                        readOnly={isAnySpinning || !canEdit}
                        placeholder={
                          !canEdit
                            ? (t.luckyWheel.viewOnlyDesc || 'Chế độ chỉ xem. Chỉ chủ phòng mới có quyền chỉnh sửa nội dung.')
                            : t.luckyWheel.optionsPlaceholder
                        }
                        className={`w-full flex-1 min-h-0 p-3 text-sm rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/60 dark:placeholder:text-circle-dark-muted/60 focus:bg-white dark:focus:bg-circle-dark-canvas focus:ring-2 focus:ring-circle-primary/40 focus:outline-none resize-none leading-relaxed transition-all font-mono disabled:opacity-50 ${
                          !canEdit ? 'cursor-default select-text' : ''
                        }`}
                      />

                      <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted shrink-0">
                        {!canEdit
                          ? (t.luckyWheel.viewOnlyDesc || 'Chỉ chủ phòng mới có quyền chỉnh sửa nội dung')
                          : t.luckyWheel.optionsHint}
                      </p>
                    </div>

                    {/* Action Buttons: Shuffle, Sort A-Z, Save Initial & Reset (Icons only, no text) */}
                    <div className="grid grid-cols-4 gap-2 pt-1 border-t border-circle-hairline dark:border-circle-dark-hairline shrink-0">
                      {/* Shuffle Button */}
                      <button
                        type="button"
                        onClick={handleShuffle}
                        disabled={isAnySpinning || !canEdit}
                        className="flex items-center justify-center py-2 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                        title={!canEdit ? (t.luckyWheel.viewOnlyDesc || 'Chỉ chủ phòng mới có quyền thao tác') : t.luckyWheel.shuffleOptions}
                        aria-label={t.luckyWheel.shuffleOptions}
                      >
                        <Shuffle className="w-4 h-4 text-circle-sage dark:text-circle-dark-primary" />
                      </button>

                      {/* Sort A-Z Button */}
                      <button
                        type="button"
                        onClick={handleSortAZ}
                        disabled={isAnySpinning || !canEdit}
                        className="flex items-center justify-center py-2 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                        title={!canEdit ? (t.luckyWheel.viewOnlyDesc || 'Chỉ chủ phòng mới có quyền thao tác') : t.luckyWheel.sortAZ}
                        aria-label={t.luckyWheel.sortAZ}
                      >
                        <ArrowDownAZ className="w-4 h-4 text-indigo-500" />
                      </button>

                      {/* Save as Initial Button */}
                      <button
                        type="button"
                        onClick={handleSaveAsInitial}
                        disabled={isAnySpinning || updateWheelMutation.isPending || !canEdit}
                        className={`flex items-center justify-center py-2 px-2 rounded-xl border transition-all active:scale-95 ${
                          saveInitialFeedback
                            ? 'border-circle-primary bg-circle-wash dark:bg-circle-dark-wash text-circle-sage dark:text-circle-dark-primary'
                            : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed'
                        }`}
                        title={!canEdit ? (t.luckyWheel.viewOnlyDesc || 'Chỉ chủ phòng mới có quyền thao tác') : t.luckyWheel.saveAsInitial}
                        aria-label={t.luckyWheel.saveAsInitial}
                      >
                        <BookmarkCheck
                          className={`w-4 h-4 ${
                            saveInitialFeedback ? 'text-circle-primary' : 'text-circle-sage dark:text-circle-dark-primary'
                          }`}
                        />
                      </button>

                      {/* Reset Button */}
                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={isAnySpinning || !canEdit}
                        className="flex items-center justify-center py-2 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                        title={!canEdit ? (t.luckyWheel.viewOnlyDesc || 'Chỉ chủ phòng mới có quyền thao tác') : t.luckyWheel.resetOptions}
                        aria-label={t.luckyWheel.resetOptions}
                      >
                        <RotateCcw className="w-4 h-4 text-amber-500" />
                      </button>
                    </div>

                    {/* Wheel Settings: Sound, Allow Edit (Host only) and Delete All */}
                    <div className="flex items-center justify-between pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline text-xs shrink-0">
                      {/* Sound Toggle */}
                      <button
                        type="button"
                        onClick={handleToggleSound}
                        disabled={isAnySpinning}
                        className="flex items-center gap-1.5 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        {activeWheel.soundEnabled ? (
                          <Volume2 className="w-4 h-4 text-circle-primary dark:text-circle-dark-primary" />
                        ) : (
                          <VolumeX className="w-4 h-4 text-circle-slate/60 dark:text-circle-dark-muted/60" />
                        )}
                        <span>{t.luckyWheel.soundSetting}</span>
                      </button>

                      {/* Cho phép sửa Toggle (Chỉ chủ phòng) */}
                      {isHost && (
                        <button
                          type="button"
                          onClick={handleToggleAllowEdit}
                          disabled={updateSettingsMutation.isPending}
                          className="flex items-center gap-1 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors cursor-pointer"
                          title={t.luckyWheel.allowEditDesc}
                        >
                          {allowMembersToEdit ? (
                            <LockOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-circle-slate/60 dark:text-circle-dark-muted/60" />
                          )}
                          <span className={allowMembersToEdit ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
                            {allowMembersToEdit ? t.luckyWheel.allowEditEnabled : t.luckyWheel.allowEditDisabled}
                          </span>
                        </button>
                      )}

                      {/* Delete All Wheels Button */}
                      <button
                        type="button"
                        onClick={handleDeleteAllWheels}
                        disabled={isAnySpinning || wheels.length === 0 || !canEdit}
                        className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-semibold disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title={!canEdit ? (t.luckyWheel.viewOnlyDesc || 'Chỉ chủ phòng mới có quyền xóa') : t.luckyWheel.deleteAllWheels}
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

          {/* Nút mở lại bảng: Ghim ở mép bên phải màn hình khi thu gọn */}
          {isPanelCollapsed && (
            <button
              type="button"
              onClick={() => setIsPanelCollapsed(false)}
              className="absolute right-0 top-6 z-30 flex items-center justify-center w-8 h-12 rounded-l-2xl bg-white dark:bg-circle-dark-surface border-y border-l border-circle-hairline/80 dark:border-white/12 shadow-md text-circle-slate dark:text-circle-dark-muted hover:text-circle-primary dark:hover:text-circle-primary transition-all active:scale-90 group cursor-pointer"
              title={t.luckyWheel.expandPanel}
              aria-label={t.luckyWheel.expandPanel}
            >
              <PanelRightOpen className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
            </button>
          )}
      </div>

      {/* ============================================================== */}
      {/* COMBINED / BATCH RESULTS MODAL - CELEBRATION WINNER SHOWCASE */}
      {/* ============================================================== */}
      {combinedResultsModal && combinedResultsModal.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-300/60 dark:border-amber-500/30 bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-white shadow-2xl animate-scaleUp flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            {/* Celebration Header Background Glow */}
            <div className="relative pt-7 pb-3 px-6 flex flex-col items-center text-center bg-gradient-to-b from-amber-400/15 via-circle-wash to-transparent">
              <button
                type="button"
                onClick={() => setCombinedResultsModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
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
                <span>{t.luckyWheel.winnerTitle}</span>
              </h3>
            </div>

            {/* Single Winner Showcase */}
            {combinedResultsModal.length === 1 && (
              <div className="p-6 pt-2 pb-6 flex flex-col items-center">
                <div className="w-full relative overflow-hidden rounded-2xl border-2 border-amber-300/80 dark:border-amber-500/40 bg-gradient-to-b from-amber-50/90 via-white to-amber-50/40 dark:from-amber-950/30 dark:via-circle-dark-surface dark:to-amber-950/20 p-5 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-2.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[220px]">{combinedResultsModal[0]!.wheelTitle}</span>
                  </div>

                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight select-all leading-tight drop-shadow-xs my-1">
                    {combinedResultsModal[0]!.result}
                  </span>

                  <p className="text-xs text-amber-700/80 dark:text-amber-400/80 font-medium mt-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t.luckyWheel.luckyChoiceBadge}</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </p>
                </div>

                <div className="w-full flex flex-col gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setCombinedResultsModal(null)}
                    className="w-full py-3 px-6 rounded-2xl bg-circle-primary hover:bg-circle-sage text-white font-bold text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t.luckyWheel.close}</span>
                  </button>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveResult(
                          combinedResultsModal[0]!.wheelId,
                          combinedResultsModal[0]!.resultIndex,
                        )
                      }
                      className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.luckyWheel.removeResult}</span>
                    </button>
                  )}
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
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/70 to-circle-wash dark:from-amber-950/20 dark:to-circle-dark-wash border border-amber-200/60 dark:border-white/10 transition-all"
                    >
                      <div className="flex flex-col min-w-0 pr-3">
                        <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider truncate mb-0.5">
                          {item.wheelTitle}
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                          {item.result}
                        </span>
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleRemoveResult(item.wheelId, item.resultIndex)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 transition-all shrink-0 active:scale-95 cursor-pointer"
                          title={t.luckyWheel.removeResult}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setCombinedResultsModal(null)}
                    className="w-full py-3 px-6 rounded-2xl bg-circle-primary hover:bg-circle-sage text-white font-bold text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t.luckyWheel.close}</span>
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={handleRemoveAllBatchResults}
                      className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.luckyWheel.removeAllResults}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
